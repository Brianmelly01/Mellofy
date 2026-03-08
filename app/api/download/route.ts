import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Piped instances ──
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.yt",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.garudalinux.org",
    "https://watchapi.whatever.social",
];

// ── Invidious instances ──
const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://yewtu.be",
    "https://iv.melmac.space",
    "https://invidious.io.lol",
    "https://invidious.privacydev.net",
];

// ── Cobalt API instances ──
const COBALT_API_INSTANCES = [
    "https://api.cobalt.tools",
    "https://cobalt.api.horse",
];

// ── Phase 1: @distube/ytdl-core (pure JS, works on Vercel) ──
async function extractViaYtdlCore(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    console.log(`ytdl-core: Trying ${videoId} (${type})...`);
    try {
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
        const title = info.videoDetails.title || "download";

        if (type === "audio") {
            const formats = ytdl.filterFormats(info.formats, "audioonly");
            formats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
            if (formats[0]?.url) {
                console.log(`ytdl-core: SUCCESS audio (bitrate: ${formats[0].audioBitrate})`);
                return { url: formats[0].url, title };
            }
        } else {
            // Try combined audio+video first
            const combined = ytdl.filterFormats(info.formats, "videoandaudio");
            combined.sort((a, b) => (b.height || 0) - (a.height || 0));
            if (combined[0]?.url) {
                console.log(`ytdl-core: SUCCESS video combined (${combined[0].height}p)`);
                return { url: combined[0].url, title };
            }

            // Fall back to video-only
            const videoOnly = ytdl.filterFormats(info.formats, "videoonly");
            videoOnly.sort((a, b) => (b.height || 0) - (a.height || 0));
            if (videoOnly[0]?.url) {
                console.log(`ytdl-core: SUCCESS video-only (${videoOnly[0].height}p)`);
                return { url: videoOnly[0].url, title };
            }
        }

        console.warn(`ytdl-core: No ${type} URL found in formats`);
        return null;
    } catch (e: any) {
        console.error("ytdl-core ERROR:", e?.message?.slice(0, 150));
        throw new Error(`ytdl-core: ${e?.message || e}`);
    }
}

// ── Phase 2: Cobalt API ──
async function extractViaCobalt(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    for (const instance of COBALT_API_INSTANCES) {
        try {
            const body: Record<string, any> = {
                url: youtubeUrl,
                downloadMode: type === "audio" ? "audio" : "auto",
                audioFormat: "mp3",
                filenameStyle: "basic",
            };
            const res = await fetch(`${instance}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) continue;
            const data = await res.json();
            if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
                const title = data.filename?.replace(/\.(mp3|mp4|webm|m4a|opus)$/i, "") || "download";
                return { url: data.url, title };
            }
            if (data.status === "picker" && data.picker?.[0]?.url) {
                return { url: data.picker[0].url, title: data.filename || "download" };
            }
        } catch { }
    }
    return null;
}

// ── Phase 3: Piped API ──
async function tryPiped(instance: string, videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const streams = type === "audio" ? data.audioStreams : data.videoStreams;
    if (!streams?.length) throw new Error("No streams");
    const stream = type === "audio"
        ? (streams.find((s: any) => s.codec === "opus") || streams[0])
        : (streams.find((s: any) => s.quality === "720p") || streams[0]);
    if (stream?.url) return { url: stream.url, title: data.title || "download" };
    throw new Error("No URL");
}

// ── Phase 4: Invidious API ──
async function tryInvidious(instance: string, videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    const res = await fetch(`${instance}/api/v1/videos/${videoId}?local=true`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const formats = data.adaptiveFormats || [];
    const format = formats.find((f: any) => f.type?.includes(type === "audio" ? "audio" : "video"));
    if (format?.url) return { url: format.url, title: data.title || "download" };
    throw new Error("No URL");
}

// ── Race helper ──
async function raceInstances<T>(
    instances: string[],
    fn: (instance: string) => Promise<T | null>,
): Promise<T | null> {
    const promises = instances.map((inst) =>
        fn(inst).then((result) => { if (!result) throw new Error("null"); return result; })
    );
    try { return await Promise.any(promises); } catch { return null; }
}

// ── Full extraction pipeline ──
async function extractStream(videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    const errors: string[] = [];

    // Phase 1: ytdl-core (pure JS, best for Vercel)
    try {
        const result = await extractViaYtdlCore(videoId, type);
        if (result) return result;
        errors.push("P1:no URL in formats");
    } catch (e: any) {
        errors.push(`P1:${e?.message}`);
    }

    // Phase 2: Cobalt
    try {
        const result = await extractViaCobalt(videoId, type);
        if (result) return result;
        errors.push("P2:Cobalt null");
    } catch (e: any) {
        errors.push(`P2:${e?.message}`);
    }

    // Phase 3: Piped (parallel)
    const pipedResult = await raceInstances(
        [...PIPED_INSTANCES].sort(() => Math.random() - 0.5),
        (inst) => tryPiped(inst, videoId, type),
    );
    if (pipedResult) return pipedResult;
    errors.push("P3:All Piped failed");

    // Phase 4: Invidious (parallel)
    const invResult = await raceInstances(
        [...INVIDIOUS_INSTANCES].sort(() => Math.random() - 0.5),
        (inst) => tryInvidious(inst, videoId, type),
    );
    if (invResult) return invResult;
    errors.push("P4:All Invidious failed");

    throw new Error(`All extraction methods failed: ${errors.join(" | ")}`);
}

// ── Main Route Handler ──
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("id");
    const type = searchParams.get("type") || "both";
    const pipe = searchParams.get("pipe") === "true";
    const getUrl = searchParams.get("get_url") === "true";
    const directUrl = searchParams.get("direct_url");
    const action = searchParams.get("action");

    if (!videoId && !action && !directUrl)
        return NextResponse.json({ error: "Missing video ID" }, { status: 400 });

    // Proxy action
    if (action === "proxy") {
        const targetUrl = searchParams.get("url");
        if (!targetUrl) return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        try {
            const proxyRes = await fetch(targetUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) });
            const data = await proxyRes.text();
            return new NextResponse(data, {
                status: proxyRes.status,
                headers: { "Content-Type": proxyRes.headers.get("Content-Type") || "application/json" },
            });
        } catch {
            return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
        }
    }

    const shouldPipe = pipe || getUrl;

    if (shouldPipe) {
        if (!videoId && !directUrl)
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        try {
            // Direct URL proxy
            if (directUrl) {
                const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0", Accept: "*/*", Range: "bytes=0-" };
                if (directUrl.includes("googlevideo.com")) {
                    headers["Origin"] = "https://www.youtube.com";
                    headers["Referer"] = "https://www.youtube.com/";
                }
                const streamResponse = await fetch(directUrl, { headers, signal: AbortSignal.timeout(30000) });
                if (streamResponse.ok) {
                    const ext = type === "audio" ? "mp3" : "mp4";
                    const h = new Headers();
                    h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mpeg" : "video/mp4"));
                    h.set("Content-Disposition", `attachment; filename="download.${ext}"`);
                    if (streamResponse.headers.get("Content-Length")) h.set("Content-Length", streamResponse.headers.get("Content-Length")!);
                    h.set("Accept-Ranges", "bytes");
                    return new NextResponse(streamResponse.body, { headers: h });
                }
            }

            const mediaType = type === "audio" ? "audio" : "video";
            const result = videoId ? await extractStream(videoId, mediaType) : null;

            if (getUrl && result?.url) {
                const ext = type === "audio" ? "mp3" : "mp4";
                return NextResponse.json({
                    url: result.url,
                    title: result.title || "download",
                    filename: `${(result.title || "download").replace(/[^\w\s-]/g, "")}.${ext}`,
                });
            }

            if (!result?.url) throw new Error("All extraction methods exhausted");

            // Pipe stream through server
            const streamHeaders: Record<string, string> = { "User-Agent": "Mozilla/5.0", Range: "bytes=0-" };
            if (result.url.includes("googlevideo.com")) {
                streamHeaders["Origin"] = "https://www.youtube.com";
                streamHeaders["Referer"] = "https://www.youtube.com/";
            }
            const streamResponse = await fetch(result.url, { headers: streamHeaders, signal: AbortSignal.timeout(30000) });
            if (!streamResponse.ok) throw new Error(`Stream fetch: ${streamResponse.status}`);

            const ext = type === "audio" ? "mp3" : "mp4";
            const h = new Headers();
            h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mpeg" : "video/mp4"));
            h.set("Content-Disposition", `attachment; filename="${result.title.replace(/[^\w\s-]/g, "")}.${ext}"`);
            if (streamResponse.headers.get("Content-Length")) h.set("Content-Length", streamResponse.headers.get("Content-Length")!);
            h.set("Accept-Ranges", "bytes");
            return new NextResponse(streamResponse.body, { headers: h });

        } catch (e: any) {
            console.error("Download error:", e);
            return NextResponse.json({ error: `Download failed: ${e?.message}` }, { status: 500 });
        }
    }

    // Probe mode
    const probeType = async (t: string) => {
        try { return await extractStream(videoId!, t); } catch { return null; }
    };

    const fallbackUrl = `https://cobalt.tools/#${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;

    if (type === "both") {
        const [audio, video] = await Promise.all([probeType("audio"), probeType("video")]);
        return NextResponse.json({
            audio: audio ? { url: audio.url, filename: `${audio.title}.mp3` } : null,
            video: video ? { url: video.url, filename: `${video.title}.mp4` } : null,
            fallbackUrl,
            status: audio || video ? "ready" : "fallback_required",
        });
    }

    const result = await probeType(type);
    if (result) {
        return NextResponse.json({
            audio: type === "audio" ? { url: result.url, filename: `${result.title}.mp3` } : null,
            video: type === "video" ? { url: result.url, filename: `${result.title}.mp4` } : null,
            fallbackUrl,
            status: "ready",
        });
    }

    return NextResponse.json({
        audio: null,
        video: null,
        error: "All extraction methods failed",
        fallbackUrl,
        ghostProtocolUrl: `/api/download?id=${videoId}&type=${type}&pipe=true`,
        status: "fallback_required",
    }, { status: 500 });
}

export async function POST(request: NextRequest) {
    return GET(request);
}

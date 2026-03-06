import { NextRequest, NextResponse } from "next/server";
import { create } from "youtube-dl-exec";
import path from "path";

const getBinaryPath = () => {
    return path.join(
        process.cwd(),
        "node_modules",
        "youtube-dl-exec",
        "bin",
        process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
    );
};
const youtubedl = create(getBinaryPath());

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Cobalt API instances (public, works on datacenter IPs) ──
const COBALT_API_INSTANCES = [
    "https://api.cobalt.tools",
    "https://cobalt.api.horse",
];

// ── Piped instances ──
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.yt",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.garudalinux.org",
];

// ── Invidious instances ──
const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://yewtu.be",
    "https://iv.melmac.space",
];

// ── Phase 1: yt-dlp (youtube-dl-exec) ──
async function extractViaYtDlp(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    console.log(`yt-dlp: Trying ${videoId} (${type})...`);
    try {
        const output = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
            ]
        });

        const title = output.title || "download";

        if (type === "audio") {
            const audioFormats = output.formats.filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none');
            // Sort by average bitrate descending
            audioFormats.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));
            if (audioFormats.length > 0 && audioFormats[0].url) {
                console.log(`yt-dlp: SUCCESS audio`);
                return { url: audioFormats[0].url, title };
            }
        } else {
            // Video: try to find combined audio+video first
            const combinedFormats = output.formats.filter((f: any) => f.acodec !== 'none' && f.vcodec !== 'none');
            // Sort by resolution
            combinedFormats.sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

            if (combinedFormats.length > 0 && combinedFormats[0].url) {
                console.log(`yt-dlp: SUCCESS video (combined)`);
                return { url: combinedFormats[0].url, title };
            }

            // Fallback to video-only if combined not found
            const videoFormats = output.formats.filter((f: any) => f.vcodec !== 'none');
            videoFormats.sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
            if (videoFormats.length > 0 && videoFormats[0].url) {
                console.log(`yt-dlp: SUCCESS video (video-only)`);
                return { url: videoFormats[0].url, title };
            }
        }
    } catch (e: any) {
        console.error("yt-dlp FATAL ERROR:", e);
        throw new Error(`yt-dlp failed: ${e?.message || JSON.stringify(e)}`);
    }

    throw new Error(`yt-dlp: No suitable ${type} format found`);
}

// ── Phase 2: Cobalt API ──
async function extractViaCobalt(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    for (const instance of COBALT_API_INSTANCES) {
        try {
            console.log(`Cobalt(${instance}): Trying ${videoId} (${type})...`);
            const body: Record<string, any> = {
                url: youtubeUrl,
                downloadMode: type === "audio" ? "audio" : "auto",
                audioFormat: "mp3",
                filenameStyle: "basic",
            };

            const res = await fetch(`${instance}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0",
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(10000),
            });

            if (!res.ok) continue;

            const data = await res.json();
            if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
                const title = data.filename ? data.filename.replace(/\.(mp3|mp4|webm|m4a|opus)$/i, "") : "download";
                return { url: data.url, title };
            }
            if (data.status === "picker" && data.picker?.length > 0 && data.picker[0]?.url) {
                const title = data.filename ? data.filename.replace(/\.(mp3|mp4|webm|m4a|opus)$/i, "") : "download";
                return { url: data.picker[0].url, title };
            }
        } catch (e: any) { }
    }
    return null;
}

// ── Phase 3: Piped API ──
async function tryPiped(
    instance: string,
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const streams = type === "audio" ? data.audioStreams : data.videoStreams;
    if (!streams || streams.length === 0) throw new Error(`No streams`);

    let stream = type === "audio"
        ? (streams.find((s: any) => s.codec === "opus") || streams[0])
        : (streams.find((s: any) => s.quality === "720p") || streams[0]);

    if (stream?.url) return { url: stream.url, title: data.title || "download" };
    throw new Error(`No URL`);
}

// ── Phase 4: Invidious API ──
async function tryInvidious(
    instance: string,
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const res = await fetch(`${instance}/api/v1/videos/${videoId}?local=true`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const formats = data.adaptiveFormats || [];
    let format = type === "audio"
        ? formats.find((f: any) => f.type?.includes("audio"))
        : formats.find((f: any) => f.type?.includes("video"));

    if (format?.url) return { url: format.url, title: data.title || "download" };
    throw new Error(`No URL`);
}

// ── Parallel race helper ──
async function raceInstances<T>(
    instances: string[],
    fn: (instance: string) => Promise<T | null>,
    label: string,
): Promise<T | null> {
    const promises = instances.map((inst) =>
        fn(inst).then((result) => {
            if (!result) throw new Error(`${inst}: null`);
            return result;
        })
    );
    try {
        return await Promise.any(promises);
    } catch {
        return null;
    }
}

// ── Full extraction pipeline ──
async function extractStream(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const phaseErrors: string[] = [];

    // Phase 1: yt-dlp (most reliable, handles all deciphering natively using compiled python binary)
    try {
        const result = await extractViaYtDlp(videoId, type);
        if (result) return result;
    } catch (e: any) {
        phaseErrors.push(`P1:${e?.message || e}`);
    }

    // Phase 2: Cobalt API (if working nodes exist)
    try {
        const result = await extractViaCobalt(videoId, type);
        if (result) return result;
        phaseErrors.push("P2:Cobalt returned null");
    } catch (e: any) {
        phaseErrors.push(`P2:${e?.message || e}`);
    }

    // Phase 3: Piped fleet (parallel)
    const shuffledPiped = [...PIPED_INSTANCES].sort(() => Math.random() - 0.5);
    const pipedResult = await raceInstances(shuffledPiped, (inst) => tryPiped(inst, videoId, type), "Piped");
    if (pipedResult) return pipedResult;
    phaseErrors.push("P3:All Piped instances failed");

    // Phase 4: Invidious fleet (parallel)
    const shuffledInv = [...INVIDIOUS_INSTANCES].sort(() => Math.random() - 0.5);
    const invResult = await raceInstances(shuffledInv, (inst) => tryInvidious(inst, videoId, type), "Invidious");
    if (invResult) return invResult;
    phaseErrors.push("P4:All Invidious instances failed");

    throw new Error(`All extraction methods failed | ${phaseErrors.join(" | ")}`);
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

    if (action === "proxy") {
        const targetUrl = searchParams.get("url");
        if (!targetUrl) return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        try {
            const proxyRes = await fetch(targetUrl, {
                headers: { "User-Agent": "Mozilla/5.0" },
                signal: AbortSignal.timeout(15000),
            });
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
            return NextResponse.json({ error: "Missing ID for piping" }, { status: 400 });

        try {
            console.log(`Download: ${videoId || "Direct"} (${type}) [Direct: ${!!directUrl}]`);

            if (directUrl) {
                const isGoogle = directUrl.includes("googlevideo.com");
                const headers: Record<string, string> = {
                    "User-Agent": "Mozilla/5.0",
                    Accept: "*/*",
                    Range: "bytes=0-",
                    Connection: "keep-alive",
                };
                if (isGoogle) {
                    headers["Origin"] = "https://www.youtube.com";
                    headers["Referer"] = "https://www.youtube.com/";
                }

                const streamResponse = await fetch(directUrl, { headers, signal: AbortSignal.timeout(30000) });
                if (streamResponse.ok) {
                    const h = new Headers();
                    h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mpeg" : "video/mp4"));
                    const ext = type === "audio" ? "mp3" : "mp4";
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

            const streamHeaders: Record<string, string> = {
                "User-Agent": "Mozilla/5.0",
                Range: "bytes=0-",
                Connection: "keep-alive",
            };
            if (result.url.includes("googlevideo.com")) {
                streamHeaders["Origin"] = "https://www.youtube.com";
                streamHeaders["Referer"] = "https://www.youtube.com/";
            }

            const streamResponse = await fetch(result.url, { headers: streamHeaders, signal: AbortSignal.timeout(30000) });
            if (!streamResponse.ok) throw new Error(`Stream failed: ${streamResponse.status}`);

            const ext = type === "audio" ? "mp3" : "mp4";
            const h = new Headers();
            h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mpeg" : "video/mp4"));
            h.set("Content-Disposition", `attachment; filename="${result.title.replace(/[^\w\s-]/g, "")}.${ext}"`);
            if (streamResponse.headers.get("Content-Length")) h.set("Content-Length", streamResponse.headers.get("Content-Length")!);
            h.set("Accept-Ranges", "bytes");

            return new NextResponse(streamResponse.body, { headers: h });
        } catch (e: any) {
            console.error("Download error:", e);
            return NextResponse.json({ error: `Download failed: ${e?.message || "All extraction methods exhausted"}` }, { status: 500 });
        }
    }

    const probeType = async (t: string) => {
        try {
            return await extractStream(videoId!, t);
        } catch {
            return null;
        }
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

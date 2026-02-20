import { NextRequest, NextResponse } from "next/server";
import Innertube, { UniversalCache } from "youtubei.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Fresh Cobalt instances (Feb 2026 — from instances.cobalt.best) ──
// ── Fresh Cobalt instances (Feb 2026 — from instances.cobalt.best) ──
const COBALT_INSTANCES = [
    "https://kityune.imput.net",           // 76% uptime
    "https://nachos.imput.net",            // 76% uptime
    "https://blossom.imput.net",           // 76% uptime
    "https://capi.3kh0.net",              // 72% uptime
    "https://sunny.imput.net",            // 68% uptime
    "https://cobalt.q69.xyz",
];

// ── Fresh Piped instances (Feb 2026) ──
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.leptons.xyz",
    "https://piped-api.lunar.icu",
    "https://pipedapi.mha.fi",
    "https://pipedapi.garudalinux.org",
    "https://api.piped.yt",
    "https://pipedapi.r4fo.com",
    "https://pipedapi.rivo.lol",
];

// ── Fresh Invidious instances (Feb 2026) ──
const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
    "https://iv.melmac.space",
    "https://invidious.no-logs.com",
];

const STABLE_FALLBACKS = [
    "https://cobalt.tools",
    "https://cobalt.canine.tools",
];

// ── Cobalt API v10 ──
async function tryCobalt(
    instance: string,
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const payload = {
        url: targetUrl,
        videoQuality: "720",
        downloadMode: type === "audio" ? "audio" : "auto",
        youtubeVideoCodec: "h264",
    };

    try {
        const res = await fetch(instance, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(12000),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.status === "error") {
                throw new Error(`${instance}: Cobalt error: ${data.error?.code || data.status}`);
            }
            const resultUrl = data.url || data.picker?.[0]?.url;
            if (resultUrl) {
                return { url: resultUrl, title: data.filename || "download" };
            }
        } else {
            const text = await res.text().catch(() => "N/A");
            throw new Error(`${instance}: HTTP ${res.status}: ${text.substring(0, 100)}`);
        }
    } catch (e: any) {
        if (e.name === "AbortError") throw new Error(`${instance}: Timeout`);
        throw e;
    }

    return null;
}

// ── Piped API ──
async function tryPiped(
    instance: string,
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "N/A");
        throw new Error(`${instance}: HTTP ${res.status}: ${text.substring(0, 50)}`);
    }

    const data = await res.json();
    const streams = type === "audio" ? data.audioStreams : data.videoStreams;

    if (!streams || streams.length === 0) {
        throw new Error(`${instance}: No ${type} streams found`);
    }

    let stream;
    if (type === "audio") {
        stream = streams.find((s: any) => s.codec === "opus") ||
            streams.find((s: any) => s.mimeType?.includes("audio")) ||
            streams[0];
    } else {
        stream = streams.find((s: any) => s.quality === "720p") ||
            streams.find((s: any) => !s.videoOnly) ||
            streams[0];
    }

    if (stream?.url) {
        return { url: stream.url, title: data.title || "download" };
    }
    throw new Error(`${instance}: Found streams but no URL`);
}

// ── Invidious API ──
async function tryInvidious(
    instance: string,
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const res = await fetch(
        `${instance}/api/v1/videos/${videoId}?local=true`,
        {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
            signal: AbortSignal.timeout(8000),
        },
    );

    if (!res.ok) {
        const text = await res.text().catch(() => "N/A");
        throw new Error(`${instance}: HTTP ${res.status}: ${text.substring(0, 50)}`);
    }

    const data = await res.json();
    const formats = data.adaptiveFormats || [];
    let format;

    if (type === "audio") {
        format = formats.find((f: any) => f.type?.includes("audio/webm")) ||
            formats.find((f: any) => f.type?.includes("audio/mp4")) ||
            formats.find((f: any) => f.type?.includes("audio"));
    } else {
        format = formats.find((f: any) => f.qualityLabel?.includes("720")) ||
            formats.find((f: any) => f.type?.includes("video/mp4") && f.encoding?.includes("avc")) ||
            formats.find((f: any) => f.type?.includes("video"));
    }

    if (format?.url) {
        return { url: format.url, title: data.title || "download" };
    }
    throw new Error(`${instance}: No stream URL found in metadata`);
}

// ── youtubei.js extraction ──
async function extractViaYouTubeJS(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const clients = ['WEB', 'ANDROID', 'TV_EMBEDDED', 'IOS', 'YTMUSIC'] as const;
    let lastError: any = null;

    for (const clientName of clients) {
        try {
            console.log(`YouTubeJS: Trying ${clientName} for ${videoId}...`);
            const yt = await Innertube.create({
                retrieve_player: true,
                generate_session_locally: true,
                cache: new UniversalCache(false),
                client_type: clientName as any,
            });

            const info = await yt.getBasicInfo(videoId);

            if (!info.streaming_data) {
                console.log(`YouTubeJS (${clientName}): No streaming data`);
                continue;
            }

            const allFormats = [
                ...(info.streaming_data.adaptive_formats || []),
                ...(info.streaming_data.formats || []),
            ];

            if (allFormats.length === 0) {
                console.log(`YouTubeJS (${clientName}): No formats found`);
                continue;
            }

            const withUrl = allFormats.filter((f: any) => !!f.url);
            console.log(`YouTubeJS (${clientName}): ${allFormats.length} total, ${withUrl.length} with URLs`);

            let chosen: any = null;
            if (type === "audio") {
                chosen =
                    withUrl.find((f: any) => f.mime_type?.includes("audio/mp4")) ||
                    withUrl.find((f: any) => f.mime_type?.includes("audio/webm")) ||
                    withUrl.find((f: any) => f.mime_type?.includes("audio"));
            } else {
                chosen =
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4") && f.quality_label === "720p") ||
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4") && f.quality_label === "480p") ||
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4") && f.has_audio) ||
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4")) ||
                    withUrl.find((f: any) => f.mime_type?.includes("video"));
            }

            if (chosen?.url) {
                const title = info.basic_info?.title || "download";
                console.log(`YouTubeJS (${clientName}): SUCCESS — found ${type}`);
                return { url: chosen.url, title };
            }
        } catch (e: any) {
            console.error(`YouTubeJS (${clientName}) error:`, e?.message || e);
            lastError = e;
        }
    }

    throw new Error(`YouTubeJS: All clients failed. Last: ${lastError?.message || 'No data'}`);
}

// ── Parallel helper: race N instances ──
async function raceInstances<T>(
    instances: string[],
    fn: (instance: string) => Promise<T | null>,
    label: string,
): Promise<T | null> {
    const promises = instances.map(inst =>
        fn(inst).then(result => {
            if (!result) throw new Error(`${inst}: null result`);
            console.log(`${label}: Success via ${inst}`);
            return result;
        }).catch(e => {
            console.warn(`${label}: ${inst} failed: ${e?.message}`);
            throw e;
        })
    );

    try {
        return await Promise.any(promises);
    } catch {
        console.log(`${label}: All instances failed`);
        return null;
    }
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

    // ── Action: proxy ──
    if (action === "proxy") {
        const targetUrl = searchParams.get("url");
        if (!targetUrl)
            return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        try {
            const proxyRes = await fetch(targetUrl, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                },
                signal: AbortSignal.timeout(15000),
            });
            const data = await proxyRes.text();
            return new NextResponse(data, {
                status: proxyRes.status,
                headers: {
                    "Content-Type": proxyRes.headers.get("Content-Type") || "application/json",
                },
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

            // ── PHASE 0: Direct URL proxy ──
            if (directUrl) {
                console.log("Phase 0: Direct URL proxy...");
                const isGoogle = directUrl.includes("googlevideo.com");
                const headers: Record<string, string> = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    Accept: "*/*",
                    Range: "bytes=0-",
                    Connection: "keep-alive",
                };
                if (isGoogle) {
                    headers["Origin"] = "https://www.youtube.com";
                    headers["Referer"] = "https://www.youtube.com/";
                }

                const streamResponse = await fetch(directUrl, {
                    headers,
                    signal: AbortSignal.timeout(30000),
                });

                if (streamResponse.ok) {
                    const h = new Headers();
                    h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mp4" : "video/mp4"));
                    h.set("Content-Disposition", `attachment; filename="download.${type === "audio" ? "m4a" : "mp4"}"`);
                    if (streamResponse.headers.get("Content-Length"))
                        h.set("Content-Length", streamResponse.headers.get("Content-Length")!);
                    h.set("Accept-Ranges", "bytes");
                    h.set("Cache-Control", "no-cache, no-store, must-revalidate");
                    return new NextResponse(streamResponse.body, { headers: h });
                }
                console.warn(`Phase 0: Direct URL failed (${streamResponse.status})`);
            }

            let result: { url: string; title: string } | null = null;
            const phaseErrors: string[] = [];
            const mediaType = type === "audio" ? "audio" : "video";

            // ── PHASE 1: youtubei.js ──
            if (videoId) {
                console.log("Phase 1: youtubei.js extraction...");
                try {
                    result = await extractViaYouTubeJS(videoId, mediaType);
                    if (!result) phaseErrors.push("P1:YouTubeJS returned null");
                } catch (e: any) {
                    phaseErrors.push(`P1:${e?.message || e}`);
                }
            }

            // ── PHASE 2: Cobalt fleet (parallel) ──
            if (!result && videoId) {
                console.log("Phase 2: Cobalt fleet (parallel)...");
                result = await raceInstances(
                    COBALT_INSTANCES,
                    (inst) => tryCobalt(inst, videoId, mediaType),
                    "Cobalt"
                );
                if (!result) phaseErrors.push("P2:All Cobalt instances failed");
            }

            // ── PHASE 3: Piped fleet (parallel) ──
            if (!result && videoId) {
                console.log("Phase 3: Piped fleet (parallel)...");
                const shuffled = [...PIPED_INSTANCES].sort(() => Math.random() - 0.5);
                result = await raceInstances(
                    shuffled.slice(0, 5),
                    (inst) => tryPiped(inst, videoId, mediaType),
                    "Piped"
                );
                if (!result) phaseErrors.push("P3:All Piped instances failed");
            }

            // ── PHASE 4: Invidious fleet (parallel) ──
            if (!result && videoId) {
                console.log("Phase 4: Invidious fleet (parallel)...");
                result = await raceInstances(
                    INVIDIOUS_INSTANCES,
                    (inst) => tryInvidious(inst, videoId, mediaType),
                    "Invidious"
                );
                if (!result) phaseErrors.push("P4:All Invidious instances failed");
            }

            // Return URL if get_url mode
            if (getUrl && result?.url) {
                return NextResponse.json({
                    url: result.url,
                    title: result.title || "download",
                    filename: `${(result.title || "download").replace(/[^\w\s-]/g, "")}.${type === "audio" ? "m4a" : "mp4"}`,
                });
            }

            if (!result?.url) throw new Error(`All extraction methods failed | ${phaseErrors.join(" | ")}`);

            // ── Stream the result ──
            console.log("Streaming result...");
            const streamResponse = await fetch(result.url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    Range: "bytes=0-",
                    Connection: "keep-alive",
                    Origin: "https://www.youtube.com",
                    Referer: "https://www.youtube.com/",
                },
                signal: AbortSignal.timeout(30000),
            });

            if (!streamResponse.ok)
                throw new Error(`Stream failed: ${streamResponse.status}`);

            const h = new Headers();
            h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mp4" : "video/mp4"));
            h.set("Content-Disposition", `attachment; filename="${result.title.replace(/[^\w\s-]/g, "")}.${type === "audio" ? "m4a" : "mp4"}"`);
            if (streamResponse.headers.get("Content-Length"))
                h.set("Content-Length", streamResponse.headers.get("Content-Length")!);
            h.set("Accept-Ranges", "bytes");
            h.set("Cache-Control", "no-cache, no-store, must-revalidate");

            return new NextResponse(streamResponse.body, { headers: h });
        } catch (e: any) {
            console.error("Download error:", e);
            return NextResponse.json(
                { error: `Download failed: ${e?.message || "All extraction methods exhausted"}` },
                { status: 500 },
            );
        }
    }

    // ── Non-pipe mode: return URLs ──
    const probeType = async (t: string) => {
        // Try youtubei.js first
        try {
            const result = await extractViaYouTubeJS(videoId!, t);
            if (result) return result;
        } catch { /* continue to fallbacks */ }

        // Cobalt (parallel)
        const cobaltResult = await raceInstances(
            COBALT_INSTANCES.slice(0, 5),
            (inst) => tryCobalt(inst, videoId!, t),
            "Cobalt"
        );
        if (cobaltResult) return cobaltResult;

        // Piped (parallel)
        const shuffledPiped = [...PIPED_INSTANCES].sort(() => Math.random() - 0.5);
        const pipedResult = await raceInstances(
            shuffledPiped.slice(0, 5),
            (inst) => tryPiped(inst, videoId!, t),
            "Piped"
        );
        if (pipedResult) return pipedResult;

        // Invidious (parallel)
        const invResult = await raceInstances(
            INVIDIOUS_INSTANCES,
            (inst) => tryInvidious(inst, videoId!, t),
            "Invidious"
        );
        if (invResult) return invResult;

        return null;
    };

    if (type === "both") {
        const [audio, video] = await Promise.all([
            probeType("audio"),
            probeType("video"),
        ]);

        const fallbackUrl = `${STABLE_FALLBACKS[0]}/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;

        return NextResponse.json({
            audio: audio ? { url: audio.url, filename: `${audio.title}.m4a` } : null,
            video: video ? { url: video.url, filename: `${video.title}.mp4` } : null,
            fallbackUrl,
            status: audio || video ? "ready" : "fallback_required",
        });
    }

    const result = await probeType(type);
    if (result) {
        return NextResponse.json({
            audio: type === "audio" ? { url: result.url, filename: `${result.title}.m4a` } : null,
            video: type === "video" ? { url: result.url, filename: `${result.title}.mp4` } : null,
            fallbackUrl: `${STABLE_FALLBACKS[0]}/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
            status: "ready",
        });
    }

    return NextResponse.json(
        {
            audio: null,
            video: null,
            error: "All extraction methods failed",
            fallbackUrl: `${STABLE_FALLBACKS[0]}/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
            ghostProtocolUrl: `/api/download?id=${videoId}&type=${type}&pipe=true`,
            status: "fallback_required",
        },
        { status: 500 },
    );
}

// Allow POST requests
export async function POST(request: NextRequest) {
    return GET(request);
}

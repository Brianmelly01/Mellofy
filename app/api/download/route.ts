import { NextRequest, NextResponse } from "next/server";
import Innertube, { UniversalCache } from "youtubei.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Cobalt instances (Refreshed 2026) ──
const COBALT_INSTANCES = [
    "https://api.cobalt.tools",    // Main (often has Turnstile)
    "https://co.wuk.sh",           // Alias
    "https://cobalt-backend.canine.tools", // Checked: requires JWT but maybe not for all?
    "https://cobalt-api.meowing.de",
    "https://capi.3kh0.net",
    "https://cobalt.canine.tools",
    "https://api.cobalt.canine.tools",
];

// Piped API instances (CORS-friendly often)
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.mha.fi",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.colinslegacy.com",
    "https://api.piped.yt",
];

// Invidious instances
const INVIDIOUS_INSTANCES = [
    "https://yewtu.be",
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://inv.zzls.xyz",
];

const STABLE_FALLBACKS = [
    "https://cobalt.tools",
    "https://cobalt.canine.tools",
];

// ── Cobalt API ──
async function tryCobalt(
    instance: string,
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const attemptFetch = async (endpoint: string, isV10: boolean) => {
        const payload = isV10
            ? {
                url: targetUrl,
                videoQuality: "720",
                downloadMode: type === "audio" ? "audio" : "auto",
                youtubeVideoCodec: "h264",
            }
            : {
                url: targetUrl,
                vCodec: "h264",
                vQuality: "720",
                isAudioOnly: type === "audio",
            };

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Origin": "https://cobalt.tools", // Some instances check origin
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.status === "error" || data.status === "picker") {
                const errorInfo = data.error?.code || data.status;
                throw new Error(`${endpoint}: Cobalt error: ${errorInfo}`);
            }
            const resultUrl = data.url || data.picker?.[0]?.url;
            if (resultUrl) {
                return { url: resultUrl, title: data.filename || "download" };
            }
        } else {
            const text = await res.text().catch(() => "N/A");
            throw new Error(`${endpoint}: HTTP ${res.status}: ${text.substring(0, 100)}`);
        }
        return null;
    };

    // Try v10 (root endpoint) first
    try {
        let result = await attemptFetch(instance, true);
        if (result) return result;
    } catch (e: any) {
        // Log individual instance failure but continue
        console.warn(e.message);
        // If it's a JWT error, don't bother with v7
        if (e.message.includes("jwt")) throw e;
    }

    // Try legacy v7 (/api/json) fallback
    if (!instance.includes("/api/json")) {
        const v7Url = instance.endsWith("/")
            ? `${instance}api/json`
            : `${instance}/api/json`;
        try {
            return await attemptFetch(v7Url, false);
        } catch (e: any) {
            throw e;
        }
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
        throw new Error(`${instance}: No ${type} streams found (Datacenter block?)`);
    }

    const stream =
        streams.find((s: any) => s.quality === "720p") ||
        streams.find((s: any) => !s.videoOnly) ||
        streams[0];

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
    try {
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
        const format =
            type === "audio"
                ? formats.find((f: any) => f.type?.includes("audio/webm")) ||
                formats.find((f: any) => f.type?.includes("audio/mp4")) ||
                formats[0]
                : formats.find((f: any) =>
                    f.qualityLabel?.includes("720"),
                ) ||
                formats.find(
                    (f: any) =>
                        f.type?.includes("video/mp4") &&
                        f.encoding?.includes("avc"),
                ) ||
                formats[0];

        if (format?.url) {
            return { url: format.url, title: data.title || "download" };
        }
        throw new Error(`${instance}: No stream URL found in metadata`);
    } catch (e: any) {
        throw e;
    }
}

// ── youtubei.js extraction (Primary) ──
async function extractViaYouTubeJS(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const clients = ['ANDROID', 'TV_EMBEDDED', 'IOS'] as const;
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
                console.log(`YouTubeJS (${clientName}): No streaming data (Blocked?)`);
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
            console.log(`YouTubeJS (${clientName}): ${allFormats.length} total formats, ${withUrl.length} with URLs`);

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

            console.log(`YouTubeJS (${clientName}): No suitable URL found`);
        } catch (e: any) {
            console.error(`YouTubeJS (${clientName}) error:`, e?.message || e);
            lastError = e;
        }
    }

    const msg = `YouTubeJS: All clients failed. Last error: ${lastError?.message || 'No streaming data'}`;
    throw new Error(msg);
}

// ── Main Route Handler ──
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("id");
    const type = searchParams.get("type") || "both";
    const pipe = searchParams.get("pipe") === "true";
    const getUrl = searchParams.get("get_url") === "true";
    const force = searchParams.get("force") === "true";
    const directUrl = searchParams.get("direct_url");
    const action = searchParams.get("action");

    if (!videoId && !action && !directUrl)
        return NextResponse.json(
            { error: "Missing video ID" },
            { status: 400 },
        );

    // ── Action handlers ──
    if (action === "proxy") {
        const targetUrl = searchParams.get("url");
        if (!targetUrl)
            return NextResponse.json(
                { error: "Missing URL" },
                { status: 400 },
            );
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
                    "Content-Type":
                        proxyRes.headers.get("Content-Type") ||
                        "application/json",
                },
            });
        } catch {
            return NextResponse.json(
                { error: "Proxy failed" },
                { status: 500 },
            );
        }
    }

    const shouldPipe = pipe || getUrl;

    if (shouldPipe) {
        if (!videoId && !directUrl)
            return NextResponse.json(
                { error: "Missing ID for piping" },
                { status: 400 },
            );

        try {
            console.log(
                `Download: ${videoId || "Direct"} (${type}) [Direct: ${!!directUrl}]`,
            );

            // ── PHASE 0: Direct URL proxy ──
            if (directUrl) {
                console.log("Phase 0: Direct URL proxy...");
                const isGoogle = directUrl.includes("googlevideo.com");
                const headers: Record<string, string> = {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
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
                    h.set(
                        "Content-Type",
                        streamResponse.headers.get("Content-Type") ||
                        (type === "audio" ? "audio/mp4" : "video/mp4"),
                    );
                    h.set(
                        "Content-Disposition",
                        `attachment; filename="download.${type === "audio" ? "m4a" : "mp4"}"`,
                    );
                    if (streamResponse.headers.get("Content-Length"))
                        h.set(
                            "Content-Length",
                            streamResponse.headers.get("Content-Length")!,
                        );
                    h.set("Accept-Ranges", "bytes");
                    h.set("Cache-Control", "no-cache, no-store, must-revalidate");
                    return new NextResponse(streamResponse.body, { headers: h });
                }
                console.warn(`Phase 0: Direct URL failed (${streamResponse.status})`);
            }

            let result: { url: string; title: string } | null = null;
            const phaseErrors: string[] = [];

            // ── PHASE 1: youtubei.js extraction (most reliable) ──
            if (videoId) {
                console.log("Phase 1: youtubei.js extraction...");
                try {
                    result = await extractViaYouTubeJS(
                        videoId,
                        type === "audio" ? "audio" : "video",
                    );
                    if (!result) phaseErrors.push("P1:YouTubeJS returned null");
                } catch (e: any) {
                    phaseErrors.push(`P1:YouTubeJS error: ${e?.message || e}`);
                }
            }

            // ── PHASE 2: Cobalt fleet ──
            if (!result && videoId) {
                console.log("Phase 2: Cobalt fleet...");
                for (const instance of COBALT_INSTANCES) {
                    try {
                        result = await tryCobalt(
                            instance,
                            videoId,
                            type === "audio" ? "audio" : "video",
                        );
                        if (result) {
                            console.log(`Phase 2: Cobalt success via ${instance}`);
                            break;
                        }
                    } catch (e: any) {
                        phaseErrors.push(`P2:${instance}: ${e?.message || e}`);
                    }
                }
                if (!result) phaseErrors.push("P2:All Cobalt instances failed");
            }

            // ── PHASE 3: Piped fleet ──
            if (!result && videoId) {
                console.log("Phase 3: Piped fleet...");
                const shuffled = [...PIPED_INSTANCES].sort(
                    () => Math.random() - 0.5,
                );
                for (const instance of shuffled.slice(0, 5)) {
                    try {
                        result = await tryPiped(
                            instance,
                            videoId,
                            type === "audio" ? "audio" : "video",
                        );
                        if (result) {
                            console.log(`Phase 3: Piped success via ${instance}`);
                            break;
                        }
                    } catch (e: any) {
                        phaseErrors.push(`P3:${instance}: ${e?.message || e}`);
                    }
                }
                if (!result) phaseErrors.push("P3:All Piped instances failed");
            }

            // ── PHASE 4: Invidious fleet ──
            if (!result && videoId) {
                console.log("Phase 4: Invidious fleet...");
                for (const instance of INVIDIOUS_INSTANCES) {
                    try {
                        result = await tryInvidious(
                            instance,
                            videoId,
                            type === "audio" ? "audio" : "video",
                        );
                        if (result) {
                            console.log(`Phase 4: Invidious success via ${instance}`);
                            break;
                        }
                    } catch (e: any) {
                        phaseErrors.push(`P4:${instance}: ${e?.message || e}`);
                    }
                }
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
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
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
            h.set(
                "Content-Type",
                streamResponse.headers.get("Content-Type") ||
                (type === "audio" ? "audio/mp4" : "video/mp4"),
            );
            h.set(
                "Content-Disposition",
                `attachment; filename="${result.title.replace(/[^\w\s-]/g, "")}.${type === "audio" ? "m4a" : "mp4"}"`,
            );
            if (streamResponse.headers.get("Content-Length"))
                h.set(
                    "Content-Length",
                    streamResponse.headers.get("Content-Length")!,
                );
            h.set("Accept-Ranges", "bytes");
            h.set("Cache-Control", "no-cache, no-store, must-revalidate");

            return new NextResponse(streamResponse.body, { headers: h });
        } catch (e: any) {
            console.error("Download error:", e);
            return NextResponse.json(
                {
                    error: `Download failed: ${e?.message || "All extraction methods exhausted"}`,
                },
                { status: 500 },
            );
        }
    }

    // ── Non-pipe mode: return URLs ──
    const probeType = async (t: string) => {
        // Try youtubei.js first
        let result = await extractViaYouTubeJS(videoId!, t);
        if (result) return result;

        // Then Cobalt
        for (const instance of COBALT_INSTANCES) {
            result = await tryCobalt(instance, videoId!, t);
            if (result) return result;
        }

        // Then Piped
        const shuffledPiped = [...PIPED_INSTANCES].sort(() => Math.random() - 0.5);
        for (const instance of shuffledPiped.slice(0, 5)) {
            result = await tryPiped(instance, videoId!, t);
            if (result) return result;
        }

        // Then Invidious
        for (const instance of INVIDIOUS_INSTANCES) {
            result = await tryInvidious(instance, videoId!, t);
            if (result) return result;
        }

        return null;
    };

    if (type === "both") {
        const [audio, video] = await Promise.all([
            probeType("audio"),
            probeType("video"),
        ]);

        const fallbackUrl = `${STABLE_FALLBACKS[0]}/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;

        return NextResponse.json({
            audio: audio
                ? { url: audio.url, filename: `${audio.title}.m4a` }
                : null,
            video: video
                ? { url: video.url, filename: `${video.title}.mp4` }
                : null,
            fallbackUrl,
            status: audio || video ? "ready" : "fallback_required",
        });
    }

    const result = await probeType(type);
    if (result) {
        return NextResponse.json({
            audio:
                type === "audio"
                    ? {
                        url: result.url,
                        filename: `${result.title}.m4a`,
                    }
                    : null,
            video:
                type === "video"
                    ? {
                        url: result.url,
                        filename: `${result.title}.mp4`,
                    }
                    : null,
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

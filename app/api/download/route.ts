import { NextRequest, NextResponse } from "next/server";
import Innertube, { UniversalCache } from "youtubei.js";
import ytdl from "@distube/ytdl-core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Cobalt API instances (public, works on datacenter IPs) ──
const COBALT_API_INSTANCES = [
    "https://api.cobalt.tools",
    "https://cobalt.api.horse",
];

// ── Piped instances — verified March 2026 ──
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.yt",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.garudalinux.org",
    "https://pipedapi.rivo.lol",
    "https://pipedapi.r4fo.com",
    "https://piped-api.codespace.cz",
    "https://pipedapi.drgns.space",
    "https://pipedapi.in.projectsegfau.lt",
];

// ── Invidious instances — verified March 2026 ──
const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
    "https://invidious.privacydev.net",
    "https://iv.melmac.space",
    "https://inv.tux.pizza",
    "https://invidious.jing.rocks",
    "https://iv.ggtyler.dev",
    "https://invidious.drgns.space",
    "https://invidious.lunar.icu",
];

// ── Phase 1: Cobalt API — works on Vercel datacenter IPs ──
async function extractViaCobalt(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    for (const instance of COBALT_API_INSTANCES) {
        try {
            console.log(`Cobalt(${instance}): Trying ${videoId} (${type})...`);

            // Build request body for Cobalt API v10
            const body: Record<string, any> = {
                url: youtubeUrl,
                downloadMode: type === "audio" ? "audio" : "auto",
                audioFormat: "mp3",
                videoQuality: "720",
                filenameStyle: "basic",
            };

            if (type === "audio") {
                body.downloadMode = "audio";
                body.audioFormat = "mp3";
            } else {
                body.downloadMode = "auto";
            }

            const res = await fetch(`${instance}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(20000),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "N/A");
                console.warn(`Cobalt(${instance}): HTTP ${res.status}: ${text.substring(0, 100)}`);
                continue;
            }

            const data = await res.json();
            console.log(`Cobalt(${instance}): Response status=${data.status}`);

            // Cobalt API returns { status: "tunnel"|"redirect"|"stream", url: "...", filename: "..." }
            if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
                console.log(`Cobalt(${instance}): SUCCESS — got ${type} URL`);
                // Extract title from filename if available
                const title = data.filename
                    ? data.filename.replace(/\.(mp3|mp4|webm|m4a|opus)$/i, "")
                    : "download";
                return { url: data.url, title };
            }

            // Cobalt v9 format: array of streams
            if (data.status === "picker" && data.picker?.length > 0) {
                const stream = data.picker[0];
                if (stream?.url) {
                    const title = data.filename
                        ? data.filename.replace(/\.(mp3|mp4|webm|m4a|opus)$/i, "")
                        : "download";
                    return { url: stream.url, title };
                }
            }

            console.warn(`Cobalt(${instance}): Unexpected response: ${JSON.stringify(data).substring(0, 150)}`);
        } catch (e: any) {
            console.warn(`Cobalt(${instance}): Error — ${e?.message}`);
        }
    }
    return null;
}

// ── Phase 2: youtubei.js — multiple clients ──
async function extractViaYouTubeJS(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    // Try clients in priority order: MWEB tends to return non-IP-signed URLs on some regions
    const clients = ["MWEB", "WEB_CREATOR", "ANDROID", "TV_EMBEDDED", "IOS"] as const;
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

            const info = await yt.getBasicInfo(videoId, clientName as any);

            if (!info.streaming_data) {
                console.log(`YouTubeJS (${clientName}): No streaming data`);
                continue;
            }

            const allFormats = [
                ...(info.streaming_data.adaptive_formats || []),
                ...(info.streaming_data.formats || []),
            ];

            const withUrl = allFormats.filter((f: any) => !!f.url);
            console.log(`YouTubeJS (${clientName}): ${allFormats.length} total, ${withUrl.length} with URLs`);

            if (withUrl.length === 0) continue;

            let chosen: any = null;
            if (type === "audio") {
                chosen =
                    withUrl.find((f: any) => f.mime_type?.includes("audio/mp4")) ||
                    withUrl.find((f: any) => f.mime_type?.includes("audio/webm")) ||
                    withUrl.find((f: any) => f.mime_type?.includes("audio"));
            } else {
                // Prefer combined streams (has audio+video) for immediate playback
                chosen =
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4") && f.has_audio && f.quality_label === "720p") ||
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4") && f.has_audio && f.quality_label === "480p") ||
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4") && f.has_audio) ||
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4") && f.quality_label === "720p") ||
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4") && f.quality_label === "480p") ||
                    withUrl.find((f: any) => f.mime_type?.includes("video/mp4")) ||
                    withUrl.find((f: any) => f.mime_type?.includes("video"));
            }

            if (chosen?.url) {
                const title = info.basic_info?.title || "download";
                console.log(`YouTubeJS (${clientName}): SUCCESS — found ${type} URL`);
                return { url: chosen.url, title };
            }
        } catch (e: any) {
            console.error(`YouTubeJS (${clientName}) error:`, e?.message || e);
            lastError = e;
        }
    }

    throw new Error(`YouTubeJS: All clients failed. Last: ${lastError?.message || "No data"}`);
}

// ── Phase 3: @distube/ytdl-core extraction ──
async function extractViaYtdl(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`ytdl-core: Trying ${videoId}...`);

    const info = await ytdl.getInfo(url, {
        requestOptions: {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            },
        },
    });

    const title = info.videoDetails.title || "download";

    if (type === "audio") {
        const format =
            ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" }) ||
            ytdl.chooseFormat(info.formats, { filter: "audioonly" });
        if (format?.url) {
            console.log(`ytdl-core: SUCCESS audio`);
            return { url: format.url, title };
        }
    } else {
        // Try combined first (has audio+video), then video-only
        const combined =
            ytdl.chooseFormat(info.formats, { quality: "highestvideo", filter: "audioandvideo" }) ||
            ytdl.chooseFormat(info.formats, { filter: "audioandvideo" });
        if (combined?.url) {
            console.log(`ytdl-core: SUCCESS video (combined)`);
            return { url: combined.url, title };
        }

        const videoOnly = ytdl.chooseFormat(info.formats, { quality: "highestvideo" });
        if (videoOnly?.url) {
            console.log(`ytdl-core: SUCCESS video (video-only)`);
            return { url: videoOnly.url, title };
        }
    }

    throw new Error(`ytdl-core: No suitable ${type} format found`);
}

// ── Phase 4: Piped API ──
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
        stream =
            streams.find((s: any) => s.codec === "opus") ||
            streams.find((s: any) => s.mimeType?.includes("audio")) ||
            streams[0];
    } else {
        stream =
            streams.find((s: any) => s.quality === "720p") ||
            streams.find((s: any) => !s.videoOnly) ||
            streams[0];
    }

    if (stream?.url) {
        return { url: stream.url, title: data.title || "download" };
    }
    throw new Error(`${instance}: Found streams but no URL`);
}

// ── Phase 5: Invidious API ──
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
        format =
            formats.find((f: any) => f.type?.includes("audio/mp4")) ||
            formats.find((f: any) => f.type?.includes("audio/webm")) ||
            formats.find((f: any) => f.type?.includes("audio"));
    } else {
        format =
            formats.find((f: any) => f.qualityLabel?.includes("720")) ||
            formats.find((f: any) => f.type?.includes("video/mp4") && f.encoding?.includes("avc")) ||
            formats.find((f: any) => f.type?.includes("video"));
    }

    if (format?.url) {
        return { url: format.url, title: data.title || "download" };
    }
    throw new Error(`${instance}: No stream URL found in metadata`);
}

// ── Parallel race helper ──
async function raceInstances<T>(
    instances: string[],
    fn: (instance: string) => Promise<T | null>,
    label: string,
): Promise<T | null> {
    const promises = instances.map((inst) =>
        fn(inst)
            .then((result) => {
                if (!result) throw new Error(`${inst}: null result`);
                console.log(`${label}: Success via ${inst}`);
                return result;
            })
            .catch((e) => {
                console.warn(`${label}: ${inst} failed: ${e?.message}`);
                throw e;
            }),
    );

    try {
        return await Promise.any(promises);
    } catch {
        console.log(`${label}: All instances failed`);
        return null;
    }
}

// ── Full extraction pipeline ──
async function extractStream(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    const phaseErrors: string[] = [];

    // Phase 1: Cobalt API (most reliable on Vercel datacenter IPs)
    console.log("Phase 1: Cobalt API...");
    try {
        const result = await extractViaCobalt(videoId, type);
        if (result) return result;
        phaseErrors.push("P1:Cobalt returned null");
    } catch (e: any) {
        phaseErrors.push(`P1:${e?.message || e}`);
    }

    // Phase 2: youtubei.js (MWEB, WEB_CREATOR, ANDROID, etc.)
    console.log("Phase 2: youtubei.js (multiple clients)...");
    try {
        const result = await extractViaYouTubeJS(videoId, type);
        if (result) return result;
        phaseErrors.push("P2:YouTubeJS returned null");
    } catch (e: any) {
        phaseErrors.push(`P2:${e?.message || e}`);
    }

    // Phase 3: @distube/ytdl-core
    console.log("Phase 3: @distube/ytdl-core...");
    try {
        const result = await extractViaYtdl(videoId, type);
        if (result) return result;
        phaseErrors.push("P3:ytdl-core returned null");
    } catch (e: any) {
        phaseErrors.push(`P3:${e?.message || e}`);
    }

    // Phase 4: Piped fleet (parallel)
    console.log("Phase 4: Piped fleet (parallel)...");
    const shuffledPiped = [...PIPED_INSTANCES].sort(() => Math.random() - 0.5);
    const pipedResult = await raceInstances(
        shuffledPiped.slice(0, 6),
        (inst) => tryPiped(inst, videoId, type),
        "Piped",
    );
    if (pipedResult) return pipedResult;
    phaseErrors.push("P4:All Piped instances failed");

    // Phase 5: Invidious fleet (parallel)
    console.log("Phase 5: Invidious fleet (parallel)...");
    const shuffledInv = [...INVIDIOUS_INSTANCES].sort(() => Math.random() - 0.5);
    const invResult = await raceInstances(
        shuffledInv.slice(0, 6),
        (inst) => tryInvidious(inst, videoId, type),
        "Invidious",
    );
    if (invResult) return invResult;
    phaseErrors.push("P5:All Invidious instances failed");

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

            // Phase 0: Direct URL proxy
            if (directUrl) {
                console.log("Phase 0: Direct URL proxy...");
                const isGoogle = directUrl.includes("googlevideo.com");
                const isCobalt = directUrl.includes("cobalt");
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
                    h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mpeg" : "video/mp4"));
                    const ext = type === "audio" ? "mp3" : "mp4";
                    h.set("Content-Disposition", `attachment; filename="download.${ext}"`);
                    if (streamResponse.headers.get("Content-Length"))
                        h.set("Content-Length", streamResponse.headers.get("Content-Length")!);
                    h.set("Accept-Ranges", "bytes");
                    h.set("Cache-Control", "no-cache, no-store, must-revalidate");
                    return new NextResponse(streamResponse.body, { headers: h });
                }
                console.warn(`Phase 0: Direct URL failed (${streamResponse.status})`);
            }

            const mediaType = type === "audio" ? "audio" : "video";
            const result = videoId ? await extractStream(videoId, mediaType) : null;

            // Return URL only (get_url mode)
            if (getUrl && result?.url) {
                const ext = type === "audio" ? "mp3" : "mp4";
                return NextResponse.json({
                    url: result.url,
                    title: result.title || "download",
                    filename: `${(result.title || "download").replace(/[^\w\s-]/g, "")}.${ext}`,
                });
            }

            if (!result?.url) throw new Error("All extraction methods exhausted");

            // Stream the result
            console.log("Streaming result...");
            const streamHeaders: Record<string, string> = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                Range: "bytes=0-",
                Connection: "keep-alive",
            };
            if (result.url.includes("googlevideo.com")) {
                streamHeaders["Origin"] = "https://www.youtube.com";
                streamHeaders["Referer"] = "https://www.youtube.com/";
            }

            const streamResponse = await fetch(result.url, {
                headers: streamHeaders,
                signal: AbortSignal.timeout(30000),
            });

            if (!streamResponse.ok)
                throw new Error(`Stream failed: ${streamResponse.status}`);

            const ext = type === "audio" ? "mp3" : "mp4";
            const h = new Headers();
            h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mpeg" : "video/mp4"));
            h.set("Content-Disposition", `attachment; filename="${result.title.replace(/[^\w\s-]/g, "")}.${ext}"`);
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

    // ── Non-pipe mode: return URLs (used by browse/player) ──
    const probeType = async (t: string) => {
        try {
            return await extractStream(videoId!, t);
        } catch {
            return null;
        }
    };

    const fallbackUrl = `https://cobalt.tools/#${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;

    if (type === "both") {
        const [audio, video] = await Promise.all([
            probeType("audio"),
            probeType("video"),
        ]);

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

    return NextResponse.json(
        {
            audio: null,
            video: null,
            error: "All extraction methods failed",
            fallbackUrl,
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

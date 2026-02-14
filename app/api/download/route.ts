import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cobalt instances for robust fallback (Expanded community list)
const COBALT_INSTANCES = [
    "https://cobalt.canine.tools",
    "https://cobalt.meowing.de",
    "https://co.eepy.moe",
    "https://cobalt.red",
    "https://cobalt.best",
    "https://cobalt.03c8.net",
    "https://cobalt.miz.icu",
    "https://cobalt.inst.moe",
    "https://cobalt.vps.moe",
];

// Multiple Invidious/Piped instances for secondary fallback
const PROXY_INSTANCES = [
    "https://invidious.ducks.party",
    "https://inv.vern.cc",
    "https://invidious.flokinet.to",
    "https://iv.melmac.space",
    "https://pipedapi.kavin.rocks",
    "https://piped-api.lunar.icu",
    "https://piped-api.garudalinux.org",
    "https://api-piped.mha.fi",
    "https://invidious.nerdvpn.de",
    "https://iv.datura.network",
    "https://invidious.privacyredirect.com",
];

// Try Cobalt API to get download URL
async function tryCobalt(instance: string, videoId: string, type: string, log: string[]): Promise<{ url: string; title: string } | null> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const tryEndpoint = async (endpoint: string) => {
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    url,
                    videoQuality: "720",
                    filenameStyle: "pretty",
                    downloadMode: type === "audio" ? "audio" : "video",
                    youtubeVideoCodec: "h264",
                }),
                signal: AbortSignal.timeout(10000),
            });

            if (!res.ok) {
                log.push(`Cobalt ${endpoint} -> HTTP ${res.status}`);
                return null;
            }

            const data = await res.json();
            if (data.status === "error") {
                log.push(`Cobalt ${endpoint} -> Error: ${data.text || "Unknown"}`);
                return null;
            }

            if (data.url) return { url: data.url, title: data.filename || "download" };
            return null;
        } catch (err: any) {
            log.push(`Cobalt ${endpoint} -> Failed: ${err.message || "Timeout"}`);
            return null;
        }
    };

    let result = await tryEndpoint(instance);
    if (!result) {
        result = await tryEndpoint(`${instance.endsWith("/") ? instance : instance + "/"}api/json`);
    }
    return result;
}

// Try Invidious API to get stream URL
async function tryInvidious(instance: string, videoId: string, type: string, log: string[]): Promise<{ url: string; title: string } | null> {
    try {
        const isInvidious = !instance.includes("piped");

        if (isInvidious) {
            const res = await fetch(`${instance}/api/v1/videos/${videoId}?local=true`, {
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) {
                log.push(`Invidious ${instance} -> HTTP ${res.status}`);
                return null;
            }
            const data = await res.json();

            const formats = data.adaptiveFormats || [];
            let format;

            if (type === "audio") {
                format = formats.find((f: any) => f.type?.startsWith("audio/mp4")) ||
                    formats.find((f: any) => f.type?.startsWith("audio/"));
            } else {
                format = formats.find((f: any) => f.type?.startsWith("video/mp4") && f.encoding?.includes("avc")) ||
                    formats.find((f: any) => f.type?.startsWith("video/mp4"));
            }

            if (!format?.url) {
                log.push(`Invidious ${instance} -> No suitable format`);
                return null;
            }
            return { url: format.url, title: data.title || "download" };
        } else {
            // Piped API
            const res = await fetch(`${instance}/streams/${videoId}`, {
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) {
                log.push(`Piped ${instance} -> HTTP ${res.status}`);
                return null;
            }
            const data = await res.json();

            let streams;
            if (type === "audio") {
                streams = data.audioStreams || [];
                const stream = streams.find((s: any) => s.mimeType?.includes("mp4")) || streams[0];
                if (!stream?.url) {
                    log.push(`Piped ${instance} -> No audio stream`);
                    return null;
                }
                return { url: stream.url, title: data.title || "download" };
            } else {
                streams = data.videoStreams || [];
                const stream = streams.find((s: any) => s.mimeType?.includes("mp4") && s.videoOnly === false) || streams[0];
                if (!stream?.url) {
                    log.push(`Piped ${instance} -> No video stream`);
                    return null;
                }
                return { url: stream.url, title: data.title || "download" };
            }
        }
    } catch (err: any) {
        log.push(`${instance} -> Exception: ${err.message || "Unknown"}`);
        return null;
    }
}

// Try @distube/ytdl-core
async function tryYtdlCore(videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    try {
        const ytdl = require("@distube/ytdl-core");
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(url);

        let format;
        if (type === "audio") {
            const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
            format = audioFormats.find((f: any) => f.mimeType?.includes("mp4")) || audioFormats[0];
        } else {
            const videoFormats = ytdl.filterFormats(info.formats, "videoandaudio");
            format = videoFormats[0];
        }

        if (!format?.url) return null;
        return { url: format.url, title: info.videoDetails?.title || "download" };
    } catch (err: any) {
        console.warn(`ytdl-core failed: ${err.message}`);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("id");
    const type = searchParams.get("type") || "audio";
    const log: string[] = [];

    if (!videoId) {
        return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    console.log(`Starting download for ${videoId} (${type})...`);

    // Layer 1: ytdl-core
    let result = await tryYtdlCore(videoId, type);

    // Layer 2: Cobalt Fleet
    if (!result) {
        console.log(`ytdl-core failed, trying Cobalt fleet...`);
        for (const instance of COBALT_INSTANCES) {
            result = await tryCobalt(instance, videoId, type, log);
            if (result) break;
        }
    }

    // Layer 3: Proxy Fleet
    if (!result) {
        console.log(`Cobalt failed, trying Proxy fleet...`);
        for (const instance of PROXY_INSTANCES) {
            result = await tryInvidious(instance, videoId, type, log);
            if (result) break;
        }
    }

    if (!result) {
        console.error(`Download failed for ${videoId}. Log:`, log.join(" | "));
        return NextResponse.json(
            {
                error: "Unable to process download. YouTube is currently restricting access from this server. Please try again later or try a different video.",
                diagnostics: log.slice(0, 10)
            },
            { status: 503 }
        );
    }

    try {
        const response = await fetch(result.url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: "https://www.youtube.com/",
            },
            signal: AbortSignal.timeout(45000),
        });

        if (!response.ok || !response.body) {
            return NextResponse.json({ error: "Failed to download stream" }, { status: 502 });
        }

        const ext = type === "audio" ? "m4a" : "mp4";
        const safeTitle = result.title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();

        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${safeTitle}.${ext}"`);
        headers.set("Content-Type", type === "audio" ? "audio/mp4" : "video/mp4");

        const contentLength = response.headers.get("Content-Length");
        if (contentLength) headers.set("Content-Length", contentLength);

        return new NextResponse(response.body as any, { status: 200, headers });
    } catch (error: any) {
        console.error("Stream transfer error:", error);
        return NextResponse.json({ error: "Stream timed out" }, { status: 504 });
    }
}

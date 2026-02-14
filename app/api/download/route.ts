import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Multiple Invidious/Piped instances for fallback
const PROXY_INSTANCES = [
    "https://inv.tux.pizza",
    "https://invidious.privacyredirect.com",
    "https://invidious.nerdvpn.de",
    "https://iv.datura.network",
    "https://pipedapi.kavin.rocks",
    "https://piped-api.lunar.icu",
    "https://pipedapi.leptons.xyz",
];

// Try Invidious API to get stream URL
async function tryInvidious(instance: string, videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    try {
        const isInvidious = !instance.includes("piped");

        if (isInvidious) {
            const res = await fetch(`${instance}/api/v1/videos/${videoId}?local=true`, {
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return null;
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

            if (!format?.url) return null;
            return { url: format.url, title: data.title || "download" };
        } else {
            // Piped API
            const res = await fetch(`${instance}/streams/${videoId}`, {
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return null;
            const data = await res.json();

            let streams;
            if (type === "audio") {
                streams = data.audioStreams || [];
                const stream = streams.find((s: any) => s.mimeType?.includes("mp4")) || streams[0];
                if (!stream?.url) return null;
                return { url: stream.url, title: data.title || "download" };
            } else {
                streams = data.videoStreams || [];
                const stream = streams.find((s: any) => s.mimeType?.includes("mp4") && s.videoOnly === false) || streams[0];
                if (!stream?.url) return null;
                return { url: stream.url, title: data.title || "download" };
            }
        }
    } catch {
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
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("id");
    const type = searchParams.get("type") || "audio";

    if (!videoId) {
        return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    // Strategy 1: Try @distube/ytdl-core first
    let result = await tryYtdlCore(videoId, type);

    // Strategy 2: Try proxy instances as fallback
    if (!result) {
        for (const instance of PROXY_INSTANCES) {
            result = await tryInvidious(instance, videoId, type);
            if (result) break;
        }
    }

    if (!result) {
        return NextResponse.json(
            { error: "Unable to process download. YouTube is currently restricting access from this server. Please try again later." },
            { status: 503 }
        );
    }

    try {
        // Proxy the stream
        const response = await fetch(result.url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: "https://www.youtube.com/",
            },
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok || !response.body) {
            return NextResponse.json(
                { error: "Failed to download the stream." },
                { status: 502 }
            );
        }

        const ext = type === "audio" ? "m4a" : "mp4";
        const safeTitle = result.title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();

        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${safeTitle}.${ext}"`);
        headers.set("Content-Type", type === "audio" ? "audio/mp4" : "video/mp4");

        const contentLength = response.headers.get("Content-Length");
        if (contentLength) {
            headers.set("Content-Length", contentLength);
        }

        return new NextResponse(response.body as any, { status: 200, headers });
    } catch (error: any) {
        console.error("Download proxy error:", error);
        return NextResponse.json(
            { error: "Download stream timed out. Please try again." },
            { status: 504 }
        );
    }
}

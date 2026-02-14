import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cobalt Fleet: Specialized media extraction engines (Top Community Nodes)
// Sources: instances.cobalt.best, cobalt.directory (Updated Feb 2026)
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
    "https://cobalt.perv.cat",
    "https://cobalt.sh",
    "https://co.wuk.be",
    "https://cobalt.api.unv.me",
    "https://cobalt.cloud.it",
    "https://cobalt.io.no",
];

// Invidious/Piped Fleet: Traditional proxies (Broad Global Coverage)
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
    "https://iv.ggtyler.dev",
    "https://invidious.projectsegfau.lt",
    "https://iv.n0p.me",
    "https://invidious.namazso.eu",
    "https://api.piped.privacydev.net",
];

// Try Cobalt API with varying parameters
async function tryCobalt(instance: string, videoId: string, type: string, log: string[]): Promise<{ url: string; title: string } | null> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const tryParams = async (params: any) => {
        try {
            // Normalize instance URL
            const base = instance.replace(/\/$/, "");
            const endpoint = base.includes("api") ? base : `${base}/api/json`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                },
                body: JSON.stringify({
                    url,
                    ...params
                }),
                signal: AbortSignal.timeout(10000),
            });

            if (!res.ok) return null;
            const data = await res.json();
            if (data.status === "error") return null;
            if (data.url) return { url: data.url, title: data.filename || "download" };
            if (data.picker) return { url: data.picker[0]?.url, title: data.filename || "download" };
            return null;
        } catch (e) {
            return null;
        }
    };

    // Strategy 1: HQ
    let result = await tryParams({
        videoQuality: "720",
        downloadMode: type === "audio" ? "audio" : "video",
        youtubeVideoCodec: "h264",
    });

    // Strategy 2: LQ (often bypasses some restrictions)
    if (!result) {
        result = await tryParams({
            videoQuality: "360",
            downloadMode: type === "audio" ? "audio" : "video",
            youtubeVideoCodec: "h264",
        });
    }

    if (!result) log.push(`${instance.split("/")[2]} fails`);
    return result;
}

// Try Invidious API
async function tryInvidious(instance: string, videoId: string, type: string, log: string[]): Promise<{ url: string; title: string } | null> {
    try {
        const isInvidious = !instance.includes("piped");
        const endpoint = isInvidious
            ? `${instance}/api/v1/videos/${videoId}?local=true`
            : `${instance}/streams/${videoId}`;

        const res = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        const data = await res.json();

        if (isInvidious) {
            const formats = data.adaptiveFormats || [];
            const format = type === "audio"
                ? (formats.find((f: any) => f.type?.startsWith("audio/mp4")) || formats.find((f: any) => f.type?.startsWith("audio/")))
                : (formats.find((f: any) => f.type?.startsWith("video/mp4") && f.encoding?.includes("avc")) || formats.find((f: any) => f.type?.startsWith("video/mp4")));

            if (format?.url) return { url: format.url, title: data.title || "download" };
        } else {
            const stream = type === "audio"
                ? (data.audioStreams?.find((s: any) => s.mimeType?.includes("mp4")) || data.audioStreams?.[0])
                : (data.videoStreams?.find((s: any) => s.mimeType?.includes("mp4") && s.videoOnly === false) || data.videoStreams?.[0]);

            if (stream?.url) return { url: stream.url, title: data.title || "download" };
        }
        return null;
    } catch (e) {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("id");
    const type = searchParams.get("type") || "audio";
    const log: string[] = [];

    if (!videoId) return NextResponse.json({ error: "Missing video ID" }, { status: 400 });

    console.log(`Starting v7 extraction for ${videoId}...`);

    // Step 1: ytdl-core
    let result;
    try {
        const ytdl = require("@distube/ytdl-core");
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
        const format = type === "audio"
            ? ytdl.filterFormats(info.formats, "audioonly").find((f: any) => f.mimeType?.includes("mp4")) || ytdl.filterFormats(info.formats, "audioonly")[0]
            : ytdl.filterFormats(info.formats, "videoandaudio")[0];
        if (format?.url) result = { url: format.url, title: info.videoDetails?.title || "download" };
    } catch (e) { }

    // Step 2: Parallelized Fleet (Try in batches of 3)
    if (!result) {
        const fleet = [...COBALT_INSTANCES, ...PROXY_INSTANCES];
        // Randomize pool to distribute load and bypass common-node bans
        const pool = fleet.sort(() => Math.random() - 0.5);

        for (let i = 0; i < pool.length; i += 3) {
            if (log.length > 30) break; // Execution limit safety

            const batch = pool.slice(i, i + 3);
            const results = await Promise.all(batch.map(instance =>
                instance.includes("cobalt") ? tryCobalt(instance, videoId, type, log) : tryInvidious(instance, videoId, type, log)
            ));

            result = results.find(r => r !== null);
            if (result) break;
        }
    }

    if (!result) {
        return NextResponse.json({
            error: "All server-side download paths are restricted for this specific video. This is common for VEVO-protected music content.",
            suggestion: "The video should still be playable in the player. For downloads, please try a different video or use an external downloader like cobalt.tools.",
            metrics: log.join(" | ")
        }, { status: 503 });
    }

    try {
        const response = await fetch(result.url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                Referer: "https://www.youtube.com/",
            },
            signal: AbortSignal.timeout(50000),
        });

        if (!response.ok || !response.body) return NextResponse.json({ error: "Stream extraction node is currently blocked." }, { status: 502 });

        const safeTitle = result.title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();
        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${safeTitle}.${type === "audio" ? "m4a" : "mp4"}"`);
        headers.set("Content-Type", type === "audio" ? "audio/mp4" : "video/mp4");
        const contentLength = response.headers.get("Content-Length");
        if (contentLength) headers.set("Content-Length", contentLength);

        return new NextResponse(response.body as any, { status: 200, headers });
    } catch (error: any) {
        return NextResponse.json({ error: "Stream transfer timed out." }, { status: 504 });
    }
}

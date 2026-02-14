import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Massive Global Fleet: Combined specialized nodes and proxies
// Updated: February 2026
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
    "https://cobalt.pinter.io",
    "https://cobalt.ponta.xyz",
    "https://cobalt.reaper.network",
    "https://cobalt.unlimited.moe",
    "https://cobalt.vps.me",
];

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
    "https://inv.zzls.xyz",
    "https://invidious.lunar.icu",
    "https://iv.nautile.io",
    "https://invidious.einfach.org",
    "https://yt.artemislena.eu",
    "https://pipedapi.recloud.me",
    "https://pipedapi.leptons.xyz",
];

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Android 14; Mobile; rv:122.0) Gecko/122.0 Firefox/122.0",
];

async function tryCobalt(instance: string, videoId: string, type: string, log: string[]): Promise<{ url: string; title: string } | null> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const tryParams = async (quality: string) => {
        try {
            const base = instance.replace(/\/$/, "");
            const endpoint = base.includes("api") ? base : `${base}/api/json`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "User-Agent": ua,
                },
                body: JSON.stringify({
                    url,
                    videoQuality: quality,
                    downloadMode: type === "audio" ? "audio" : "video",
                    youtubeVideoCodec: "h264",
                    vCodec: "h264",
                    aFormat: "best",
                }),
                signal: AbortSignal.timeout(12000),
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

    // V8 Auto-Throttle: Try HQ then LQ
    let result = await tryParams("720");
    if (!result) result = await tryParams("360");

    if (!result) log.push(`${instance.split("/")[2]} fails`);
    return result;
}

async function tryInvidious(instance: string, videoId: string, type: string, log: string[]): Promise<{ url: string; title: string } | null> {
    try {
        const isInvidious = !instance.includes("piped");
        const endpoint = isInvidious
            ? `${instance}/api/v1/videos/${videoId}?local=true`
            : `${instance}/streams/${videoId}`;

        const res = await fetch(endpoint, {
            headers: { "User-Agent": USER_AGENTS[0] },
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) return null;
        const data = await res.json();

        if (isInvidious) {
            const formats = data.adaptiveFormats || [];
            const format = type === "audio"
                ? (formats.find((f: any) => f.type?.includes("audio/mp4")) || formats.find((f: any) => f.type?.includes("audio/")))
                : (formats.find((f: any) => f.type?.includes("video/mp4") && f.encoding?.includes("avc")) || formats.find((f: any) => f.type?.includes("video/mp4")));

            if (format?.url) return { url: format.url, title: data.title || "download" };
        } else {
            const streams = type === "audio" ? data.audioStreams : data.videoStreams;
            const stream = streams?.find((s: any) => s.mimeType?.includes("mp4")) || streams?.[0];
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

    console.log(`Starting v8 Ultra-Resilience for ${videoId} (${type})...`);

    // Layer 1: ytdl-core (Quick check)
    let result;
    try {
        const ytdl = require("@distube/ytdl-core");
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
        const format = type === "audio"
            ? ytdl.filterFormats(info.formats, "audioonly").find((f: any) => f.mimeType?.includes("mp4")) || ytdl.filterFormats(info.formats, "audioonly")[0]
            : ytdl.filterFormats(info.formats, "videoandaudio")[0];
        if (format?.url) result = { url: format.url, title: info.videoDetails?.title || "download" };
    } catch (e) { }

    // Layer 2: Shotgun Fleet (Parallel Batch of 5)
    if (!result) {
        const fullFleet = [...COBALT_INSTANCES, ...PROXY_INSTANCES].sort(() => Math.random() - 0.5);

        for (let i = 0; i < fullFleet.length; i += 5) {
            if (log.length > 35) break; // Time safety

            const batch = fullFleet.slice(i, i + 5);
            console.log(`Probing batch ${Math.floor(i / 5) + 1}...`);
            const results = await Promise.all(batch.map(instance =>
                instance.includes("cobalt") ? tryCobalt(instance, videoId, type, log) : tryInvidious(instance, videoId, type, log)
            ));

            result = results.find(r => r !== null);
            if (result) break;
        }
    }

    if (!result) {
        return NextResponse.json({
            error: "YouTube is heavily protecting this content. All 45+ server-side extraction paths were restricted.",
            suggestion: "The track should play in the app player. For a direct download, please use a dedicated tool like 'cobalt.tools' in your browser.",
            metrics: log.join(" | ")
        }, { status: 503 });
    }

    try {
        const response = await fetch(result.url, {
            headers: {
                "User-Agent": USER_AGENTS[0],
                Referer: "https://www.youtube.com/",
            },
            signal: AbortSignal.timeout(50000),
        });

        if (!response.ok || !response.body) return NextResponse.json({ error: "Extraction node refused stream transfer." }, { status: 502 });

        const safeTitle = result.title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim() || "download";
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

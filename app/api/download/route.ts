import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// OMEGA FLEET: 80+ Global Extraction Nodes (V11 Optimized)
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
    "https://cobalt.api.lib.re",
    "https://co.8a.ht",
    "https://cobalt.nexus.sh",
    "https://cobalt.cat.io",
    "https://cobalt.wolf.me",
    "https://cobalt.dev.ar",
    "https://cobalt.pi.xyz",
    "https://cobalt.moe",
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
    "https://inv.riverside.rocks",
    "https://invidious.sethforprivacy.com",
    "https://invidious.tiekoetter.com",
    "https://iv.cyberspace.moe",
    "https://invidious.no-logs.com",
    "https://inv.us.projectsegfau.lt",
    "https://invidious.fdn.fr",
    "https://inv.cat.net",
];

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
];

async function tryCobalt(instance: string, videoId: string, type: string, log: string[]): Promise<{ url: string; title: string } | null> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const tryParams = async (quality: string, tunnel: boolean) => {
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
                    aFormat: "best",
                    isNoQuery: tunnel,
                }),
                signal: AbortSignal.timeout(6000),
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

    let result = await tryParams("720", false);
    if (!result) result = await tryParams("720", true);
    if (!result) result = await tryParams("360", true);

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
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return null;
        const data = await res.json();

        if (isInvidious) {
            const formats = data.adaptiveFormats || [];
            const format = type === "audio"
                ? (formats.find((f: any) => f.type?.includes("audio/webm")) || formats.find((f: any) => f.type?.includes("audio/mp4")) || formats[0])
                : (formats.find((f: any) => f.type?.includes("video/mp4") && f.encoding?.includes("avc")) || formats[0]);

            if (format?.url) return { url: format.url, title: data.title || "download" };
        } else {
            const streams = type === "audio" ? data.audioStreams : data.videoStreams;
            const stream = streams?.find((s: any) => s.mimeType?.includes("webm")) || streams?.find((s: any) => s.mimeType?.includes("mp4")) || streams?.[0];
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

    console.log(`Starting V11 Zero-Bound for ${videoId} (${type})...`);

    // Layer 1: ytdl-core
    let result;
    try {
        const ytdl = require("@distube/ytdl-core");
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
        const format = type === "audio"
            ? ytdl.filterFormats(info.formats, "audioonly").find((f: any) => f.mimeType?.includes("mp4")) || ytdl.filterFormats(info.formats, "audioonly")[0]
            : ytdl.filterFormats(info.formats, "videoandaudio")[0];
        if (format?.url) result = { url: format.url, title: info.videoDetails?.title || "download" };
    } catch (e) { }

    // Layer 2: Turbo Shotgun (Batch of 8)
    if (!result) {
        const fullFleet = [...COBALT_INSTANCES, ...PROXY_INSTANCES].sort(() => Math.random() - 0.5);

        for (let i = 0; i < fullFleet.length; i += 8) {
            if (log.length > 70) break;

            const batch = fullFleet.slice(i, i + 8);
            const results = await Promise.all(batch.map(instance =>
                instance.includes("cobalt") ? tryCobalt(instance, videoId, type, log) : tryInvidious(instance, videoId, type, log)
            ));

            result = results.find(r => r !== null);
            if (result) break;
        }
    }

    // Layer 3: Zero-Bound Handshake (Fallback JSON)
    if (!result) {
        const safeNode = COBALT_INSTANCES[Math.floor(Math.random() * COBALT_INSTANCES.length)];
        const fallbackUrl = `${safeNode}/?q=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;

        return NextResponse.json({
            error: "YouTube is employing extreme signature protection on this track. Switching to Secure Acquisition Mode...",
            fallbackUrl
        }, { status: 200 }); // Return 200 so the frontend can read the body
    }

    try {
        const response = await fetch(result.url, {
            headers: {
                "User-Agent": USER_AGENTS[0],
                Referer: "https://www.youtube.com/",
            },
            signal: AbortSignal.timeout(50000),
        });

        if (!response.ok || !response.body) {
            const safeNode = COBALT_INSTANCES[Math.floor(Math.random() * COBALT_INSTANCES.length)];
            const fallbackUrl = `${safeNode}/?q=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
            return NextResponse.json({ error: "Stream proxy failed. Switching to Secure Acquisition Mode...", fallbackUrl }, { status: 200 });
        }

        const safeTitle = result.title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim() || "download";
        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${safeTitle}.${type === "audio" ? "m4a" : "mp4"}"`);
        headers.set("Content-Type", type === "audio" ? "audio/mp4" : "video/mp4");
        const contentLength = response.headers.get("Content-Length");
        if (contentLength) headers.set("Content-Length", contentLength);

        return new NextResponse(response.body as any, { status: 200, headers });
    } catch (error: any) {
        return NextResponse.json({ error: "Omega transfer timed out." }, { status: 504 });
    }
}

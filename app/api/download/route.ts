import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// OMEGA FLEET V16: Deep-Probe Elite (Mobile Bridge Overhaul)
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
    "https://cobalt.cloud.it",
    "https://cobalt.io.no",
    "https://cobalt.pinter.io",
    "https://cobalt.ponta.xyz",
    "https://cobalt.reaper.network",
    "https://cobalt.unlimited.moe",
    "https://cobalt.vps.me",
    "https://cobalt.api.lib.re",
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

const STABLE_FALLBACKS = [
    "https://cobalt.canine.tools",
    "https://cobalt.meowing.de",
    "https://co.eepy.moe",
    "https://cobalt.best",
];

// V16 Mobile-Elite Headers (Android/iOS Bypass)
const GET_ELITE_HEADERS = (isMobile: boolean = false) => {
    const agents = isMobile
        ? ["com.google.android.youtube/19.05.35 (Linux; U; Android 14; en_US; Pixel 8 Pro; Build/UQ1A.240205.004)"]
        : ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"];

    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": agents[0],
        "X-YouTube-Client-Name": isMobile ? "21" : "1",
        "X-YouTube-Client-Version": isMobile ? "2.20240224.0.0" : "2.20240224.01.00",
    };
};

async function tryCobalt(instance: string, videoId: string, type: string, force: boolean = false): Promise<{ url: string; title: string; quality?: string } | null> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const headers = GET_ELITE_HEADERS(force);

    const tryParams = async (quality: string, tunnel: boolean) => {
        try {
            const base = instance.replace(/\/$/, "");
            const endpoint = base.includes("api") ? base : `${base}/api/json`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: headers as any,
                body: JSON.stringify({
                    url,
                    videoQuality: quality,
                    downloadMode: type === "audio" ? "audio" : "video",
                    youtubeVideoCodec: "h264",
                    aFormat: "best",
                    isNoQuery: tunnel,
                }),
                signal: AbortSignal.timeout(force ? 12000 : 7000),
            });

            if (!res.ok) return null;
            const data = await res.json();
            if (data.status === "error") return null;
            if (data.url) return { url: data.url, title: data.filename || "download", quality };
            if (data.picker) return { url: data.picker[0]?.url, title: data.filename || "download", quality };
            return null;
        } catch (e) {
            return null;
        }
    };

    // V16: In force mode, we prioritize quality, but scale down if needed
    let result = await tryParams("1080", true);
    if (!result) result = await tryParams("720", true);
    if (!result && !force) result = await tryParams("360", true);
    return result;
}

async function tryInvidious(instance: string, videoId: string, type: string, force: boolean = false): Promise<{ url: string; title: string } | null> {
    try {
        const isInvidious = !instance.includes("piped");
        const endpoint = isInvidious
            ? `${instance}/api/v1/videos/${videoId}?local=true`
            : `${instance}/streams/${videoId}`;

        const res = await fetch(endpoint, {
            headers: { "User-Agent": GET_ELITE_HEADERS(force)["User-Agent"] },
            signal: AbortSignal.timeout(force ? 15000 : 8000)
        });
        if (!res.ok) return null;
        const data = await res.json();

        if (isInvidious) {
            const formats = data.adaptiveFormats || [];
            const format = type === "audio"
                ? (formats.find((f: any) => f.type?.includes("audio/webm")) || formats.find((f: any) => f.type?.includes("audio/mp4")) || formats[0])
                : (formats.find((f: any) => f.qualityLabel?.includes(force ? "1080" : "720")) || formats.find((f: any) => f.type?.includes("video/mp4") && f.encoding?.includes("avc")) || formats[0]);

            if (format?.url) return { url: format.url, title: data.title || "download" };
        } else {
            const streams = type === "audio" ? data.audioStreams : data.videoStreams;
            const stream = streams?.find((s: any) => s.quality === (force ? "1080p" : "720p")) || streams?.find((s: any) => s.mimeType?.includes("mp4")) || (streams ? streams[0] : null);
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
    const type = searchParams.get("type") || "both";
    const force = searchParams.get("force") === "true";

    if (!videoId) return NextResponse.json({ error: "Missing video ID" }, { status: 400 });

    console.log(`V16 Deep-Probe: ${videoId} (Force: ${force})`);

    const probeType = async (t: string) => {
        let result;
        // Layer 1: Signature-Obliterator (InnerTube Mobile Emulation)
        try {
            const ytdl = require("@distube/ytdl-core");
            const options = {
                requestOptions: {
                    headers: GET_ELITE_HEADERS(force)
                }
            };
            const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, options);
            const formatSelection = t === "audio"
                ? ytdl.filterFormats(info.formats, "audioonly").find((f: any) => f.mimeType?.includes("mp4")) || ytdl.filterFormats(info.formats, "audioonly")[0]
                : ytdl.filterFormats(info.formats, "videoandaudio").find((f: any) => f.qualityLabel?.includes(force ? "1080" : "720")) || ytdl.filterFormats(info.formats, "videoandaudio")[0];

            if (formatSelection?.url) result = { url: formatSelection.url, title: info.videoDetails?.title || "download" };
        } catch (e) { }

        // Layer 2: Elite Shotgun (Expanded batch size for force)
        if (!result) {
            const fullFleet = [...COBALT_INSTANCES, ...PROXY_INSTANCES].sort(() => Math.random() - 0.5);
            const batchSize = force ? 15 : 8;
            const limit = force ? 120 : 64;

            for (let i = 0; i < fullFleet.length; i += batchSize) {
                if (i > limit) break;
                const batch = fullFleet.slice(i, i + batchSize);
                const results = await Promise.all(batch.map(instance =>
                    instance.includes("cobalt") ? tryCobalt(instance, videoId, t, force) : tryInvidious(instance, videoId, t, force)
                ));
                result = results.find(r => r !== null);
                if (result) break;
            }
        }
        return result;
    };

    if (type === "both") {
        const [audio, video] = await Promise.all([probeType("audio"), probeType("video")]);
        const bestNodes = STABLE_FALLBACKS.sort(() => Math.random() - 0.5);
        const fallbackUrl = `${bestNodes[0]}/?q=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;

        return NextResponse.json({
            audio: audio ? { url: audio.url, filename: `${audio.title}.m4a` } : null,
            video: video ? { url: video.url, filename: `${video.title}.mp4` } : null,
            fallbackUrl,
            status: (audio || video) ? "ready" : "fallback_required"
        });
    }

    const result = await probeType(type);
    if (result) return NextResponse.json({ downloadUrl: result.url, filename: `${result.title}.${type === "audio" ? "m4a" : "mp4"}` });

    return NextResponse.json({
        error: "Signature Obliteration failed. Handing over to Secure Acquisition...",
        fallbackUrl: `${STABLE_FALLBACKS[0]}/?q=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`
    });
}

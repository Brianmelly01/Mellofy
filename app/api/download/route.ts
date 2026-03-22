import { NextRequest, NextResponse } from "next/server";
import Innertube, { UniversalCache, Platform } from "youtubei.js";
import { Jinter } from "jintr";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Patch Platform.shim.eval with Jintr so youtubei.js can decipher URL signatures
// This runs once at module load, before any Innertube instance is created.
try {
    (Platform.shim as any).eval = (data: any, env: Record<string, any>) => {
        const jinter = new Jinter();
        for (const [key, val] of Object.entries(env)) {
            jinter.scope.set(key, val);
        }
        jinter.evaluate(data.script);
        const result: Record<string, any> = {};
        for (const [key] of Object.entries(env)) {
            result[key] = jinter.scope.get(key);
        }
        return result;
    };
} catch { /* Platform.shim might not be loaded yet - it will auto-patch on first use */ }

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Piped instances ──
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.yt",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.garudalinux.org",
    "https://watchapi.whatever.social",
];

// ── Invidious instances ──
const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://yewtu.be",
    "https://iv.melmac.space",
    "https://invidious.io.lol",
    "https://invidious.privacydev.net",
];

// ── Cobalt API instances ──
const COBALT_API_INSTANCES = [
    "https://api.cobalt.tools",
    "https://api.cobalt.blackcat.sweeux.org",
    "https://co.wuk.sh",
    "https://cobalt.api.horse",
];

// ── Phase 1 & 2: Cobalt API (Primary Method) ──
async function extractViaCobalt(
    videoId: string,
    type: string,
): Promise<{ url: string; title: string } | null> {
    console.log(`Cobalt: Trying ${videoId} (${type})...`);
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    for (const instance of COBALT_API_INSTANCES) {
        try {
            const body: Record<string, any> = {
                url: youtubeUrl,
                downloadMode: type === "audio" ? "audio" : "auto",
                audioFormat: "mp3",
                filenameStyle: "basic",
            };
            const res = await fetch(`${instance}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) continue;
            const data = await res.json();
            if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
                const title = data.filename?.replace(/\.(mp3|mp4|webm|m4a|opus)$/i, "") || "download";
                console.log(`Cobalt SUCCESS on ${instance}`);
                return { url: data.url, title };
            }
            if (data.status === "picker" && data.picker?.[0]?.url) {
                console.log(`Cobalt SUCCESS (picker) on ${instance}`);
                return { url: data.picker[0].url, title: data.filename || "download" };
            }
        } catch { }
    }
    return null;
}


// ── Phase 3: Piped API ──
async function tryPiped(instance: string, videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const streams = type === "audio" ? data.audioStreams : data.videoStreams;
    if (!streams?.length) throw new Error("No streams");
    const stream = type === "audio"
        ? (streams.find((s: any) => s.codec === "opus") || streams[0])
        : (streams.find((s: any) => s.quality === "720p") || streams[0]);
    if (stream?.url) return { url: stream.url, title: data.title || "download" };
    throw new Error("No URL");
}

// ── Phase 4: Invidious API ──
async function tryInvidious(instance: string, videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    const res = await fetch(`${instance}/api/v1/videos/${videoId}?local=true`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const formats = data.adaptiveFormats || [];
    const format = formats.find((f: any) => f.type?.includes(type === "audio" ? "audio" : "video"));
    if (format?.url) return { url: format.url, title: data.title || "download" };
    throw new Error("No URL");
}

// ── Race helper ──
async function raceInstances<T>(
    instances: string[],
    fn: (instance: string) => Promise<T | null>,
): Promise<T | null> {
    const promises = instances.map((inst) =>
        fn(inst).then((result) => { if (!result) throw new Error("null"); return result; })
    );
    try { return await Promise.any(promises); } catch { return null; }
}

// ── Phase 0: youtubei.js (ANDROID / TV_EMBEDDED) ──
let ytClient: any = null;
async function getYTClient() {
    if (!ytClient) {
        ytClient = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false)
        });
    }
    return ytClient;
}

async function extractViaYtjs(videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    console.log(`ytjs: Trying ${videoId} (${type})...`);
    try {
        const yt = await getYTClient();

        // Ensure Jintr is applied to the shim after instance creation
        (Platform.shim as any).eval = (data: any, env: Record<string, any>) => {
            const jinter = new Jinter();
            for (const [key, val] of Object.entries(env)) {
                jinter.scope.set(key, val);
            }
            jinter.evaluate(data.script);
            const result: Record<string, any> = {};
            for (const [key] of Object.entries(env)) {
                result[key] = jinter.scope.get(key);
            }
            return result;
        };

        const info = await yt.getBasicInfo(videoId);
        const allFormats = [
            ...(info.streaming_data?.adaptive_formats || []),
            ...(info.streaming_data?.formats || [])
        ];

        const title = info.basic_info?.title || "download";

        if (type === "audio") {
            // Audio formats have direct URLs (no cipher needed)
            const audioFormats = allFormats.filter((f: any) => f.has_audio && !f.has_video && !!f.url);
            audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            const url = audioFormats?.[0]?.url;
            if (url) return { url, title };
        } else {
            // Video formats: try combined (audio+video) first, decipher if needed
            const combined = allFormats.filter((f: any) => f.has_video && f.has_audio);
            combined.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

            for (const fmt of combined) {
                try {
                    const url = fmt.url || await fmt.decipher(yt.session.player);
                    if (url) return { url, title };
                } catch { continue; }
            }

            // Fall back to video-only track (no audio), still useful for display
            const videoOnly = allFormats.filter((f: any) => f.has_video);
            videoOnly.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
            for (const fmt of videoOnly) {
                try {
                    const url = fmt.url || await fmt.decipher(yt.session.player);
                    if (url) return { url, title };
                } catch { continue; }
            }
        }
    } catch (e: any) {
        console.error("ytjs error:", e.message?.slice(0, 100));
    }
    return null;
}

// ── Phase 1: yt-dlp standalone binary ──
async function downloadYtDlp() {
    const isWindows = os.platform() === 'win32';
    const binName = isWindows ? 'yt-dlp.exe' : 'yt-dlp_linux';
    const binaryPath = path.join(os.tmpdir(), binName);

    if (!fs.existsSync(binaryPath)) {
        console.log(`Downloading ${binName} to ${binaryPath}...`);
        const res = await fetch(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binName}`);
        if (!res.ok) throw new Error("Failed to download yt-dlp");
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(binaryPath, Buffer.from(arrayBuffer));
        if (!isWindows) fs.chmodSync(binaryPath, '755');
    }
    return binaryPath;
}

async function extractViaYtDlp(videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    console.log(`yt-dlp binary: Trying ${videoId} (${type})...`);
    try {
        const binPath = await downloadYtDlp();
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const cmd = `"${binPath}" -J --no-warnings --no-check-certificates "${url}"`;
        // Increase maxBuffer to 10MB (1024 * 1024 * 10) because JSON metadata can be large
        const { stdout } = await execPromise(cmd, { maxBuffer: 10485760 });
        const output = JSON.parse(stdout);

        const title = output.title || "download";

        if (type === "audio") {
            const audioFormats = output.formats.filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none');
            audioFormats.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));
            if (audioFormats.length > 0) return { url: audioFormats[0].url, title };
        } else {
            const combined = output.formats.filter((f: any) => f.acodec !== 'none' && f.vcodec !== 'none');
            if (combined.length > 0) return { url: combined[0].url, title };

            const videoOnly = output.formats.filter((f: any) => f.vcodec !== 'none');
            if (videoOnly.length > 0) return { url: videoOnly[0].url, title };
        }
    } catch (e: any) {
        console.error("yt-dlp binary error:", e.message?.slice(0, 200));
    }
    return null;
}

// ── Full extraction pipeline ──
async function extractStream(videoId: string, type: string): Promise<{ url: string; title: string } | null> {
    const errors: string[] = [];

    // Phase 1: yt-dlp
    try {
        const result = await extractViaYtDlp(videoId, type);
        if (result) return result;
        errors.push("P1:yt-dlp null");
    } catch (e: any) {
        errors.push(`P1:${e?.message}`);
    }

    // Phase 2: ytjs 
    try {
        const result = await extractViaYtjs(videoId, type);
        if (result) return result;
        errors.push("P2:ytjs null");
    } catch (e: any) {
        errors.push(`P2:${e?.message}`);
    }

    // Phase 1 & 2: Cobalt
    try {
        const result = await extractViaCobalt(videoId, type);
        if (result) return result;
        errors.push("P1:Cobalt null");
    } catch (e: any) {
        errors.push(`P1:${e?.message}`);
    }

    // Phase 3: Piped (parallel)
    const pipedResult = await raceInstances(
        [...PIPED_INSTANCES].sort(() => Math.random() - 0.5),
        (inst) => tryPiped(inst, videoId, type),
    );
    if (pipedResult) return pipedResult;
    errors.push("P3:All Piped failed");

    // Phase 4: Invidious (parallel)
    const invResult = await raceInstances(
        [...INVIDIOUS_INSTANCES].sort(() => Math.random() - 0.5),
        (inst) => tryInvidious(inst, videoId, type),
    );
    if (invResult) return invResult;
    errors.push("P4:All Invidious failed");

    throw new Error(`All extraction methods failed: ${errors.join(" | ")}`);
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

    // Proxy action
    if (action === "proxy") {
        const targetUrl = searchParams.get("url");
        if (!targetUrl) return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        try {
            const reqHeaders = new Headers(request.headers);
            const headers: Record<string, string> = {
                "User-Agent": "Mozilla/5.0",
                "Accept": "*/*",
            };

            // Forward Range header for partial content requests (video seeking)
            if (reqHeaders.has("range")) {
                headers["Range"] = reqHeaders.get("range")!;
            }

            // Bypass restrictions for googlevideo streams
            if (targetUrl.includes("googlevideo.com")) {
                headers["Origin"] = "https://www.youtube.com";
                headers["Referer"] = "https://www.youtube.com/";
            }

            const proxyRes = await fetch(targetUrl, { headers });
            const resHeaders = new Headers();
            resHeaders.set("Content-Type", proxyRes.headers.get("Content-Type") || "video/mp4");

            if (proxyRes.headers.has("Content-Length")) {
                resHeaders.set("Content-Length", proxyRes.headers.get("Content-Length")!);
            }
            if (proxyRes.headers.has("Content-Range")) {
                resHeaders.set("Content-Range", proxyRes.headers.get("Content-Range")!);
            }
            resHeaders.set("Accept-Ranges", proxyRes.headers.get("Accept-Ranges") || "bytes");

            if (searchParams.get("download") === "true") {
                const title = searchParams.get("title") || "download";
                const ext = searchParams.get("ext") || ".mp4";
                const filename = `${title.replace(/[^\w\s-]/g, "")}${ext}`;
                resHeaders.set("Content-Disposition", `attachment; filename="${filename}"`);
            }

            return new NextResponse(proxyRes.body, {
                status: proxyRes.status,
                headers: resHeaders,
            });
        } catch (e: any) {
            return NextResponse.json({ error: "Proxy failed: " + e.message }, { status: 500 });
        }
    }

    const shouldPipe = pipe || getUrl;

    if (shouldPipe) {
        if (!videoId && !directUrl)
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        try {
            // Direct URL proxy
            if (directUrl) {
                const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0", Accept: "*/*", Range: "bytes=0-" };
                if (directUrl.includes("googlevideo.com")) {
                    headers["Origin"] = "https://www.youtube.com";
                    headers["Referer"] = "https://www.youtube.com/";
                }
                const streamResponse = await fetch(directUrl, { headers, signal: AbortSignal.timeout(30000) });
                if (streamResponse.ok) {
                    const ext = type === "audio" ? "mp3" : "mp4";
                    const h = new Headers();
                    h.set("Content-Type", streamResponse.headers.get("Content-Type") || (type === "audio" ? "audio/mpeg" : "video/mp4"));
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

            // If it's your Cobalt tunnel or a direct URL, just fetch and return the response transparently
            const streamHeaders: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
            if (result.url.includes("googlevideo.com")) {
                streamHeaders["Origin"] = "https://www.youtube.com";
                streamHeaders["Referer"] = "https://www.youtube.com/";
            }

            const streamResponse = await fetch(result.url, { headers: streamHeaders, signal: AbortSignal.timeout(30000) });
            if (!streamResponse.ok) throw new Error(`Stream fetch: ${streamResponse.status}`);

            // To prevent hanging on piped Vercel streams, use the native headers from the Cobalt response
            const h = new Headers(streamResponse.headers);
            const ext = type === "audio" ? "mp3" : "mp4";

            // Only set specific headers if they are missing
            if (!h.has("Content-Type")) {
                h.set("Content-Type", type === "audio" ? "audio/mpeg" : "video/mp4");
            }
            if (!h.has("Content-Disposition")) {
                h.set("Content-Disposition", `attachment; filename="${result.title.replace(/[^\w\s-]/g, "")}.${ext}"`);
            }

            return new NextResponse(streamResponse.body, { headers: h });

        } catch (e: any) {
            console.error("Download error:", e);
            return NextResponse.json({ error: `Download failed: ${e?.message}` }, { status: 500 });
        }
    }

    // Probe mode
    const probeType = async (t: string) => {
        try { return await extractStream(videoId!, t); } catch { return null; }
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

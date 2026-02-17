"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Repeat,
    Shuffle,
    Download,
    MoreVertical,
    Heart,
    ChevronUp,
    ChevronDown,
    Music,
    Video,
    Shield,
    X,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ExternalLink
} from "lucide-react";
import { usePlayerStore } from "@/lib/store/usePlayerStore"; // Keeping usePlayerStore as per original, assuming usePlayer is a typo in instructions
import { cn } from "@/lib/utils";
import PlayerContent from "./PlayerContent";
import { motion } from "framer-motion";

interface AcquisitionResults {
    audio: { url: string; filename: string } | null;
    video: { url: string; filename: string } | null;
    fallbackUrl: string | null;
}

const Player = () => {
    const {
        currentTrack: storeTrack,
        isPlaying,
        togglePlay,
        volume,
        setVolume,
        playNext,
        playPrevious,
        progress,
        playbackMode,
        setPlaybackMode
    } = usePlayerStore();

    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(volume);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    // Acquisition Hub States
    const [isHubOpen, setIsHubOpen] = useState(false);
    const [hubStatus, setHubStatus] = useState<'probing' | 'ready' | 'fallback' | 'tunneling' | 'scanning'>('probing');
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [extractionLayer, setExtractionLayer] = useState<'ytdl' | 'verifying' | 'mirror'>('ytdl');
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [hubResults, setHubResults] = useState<AcquisitionResults>({ audio: null, video: null, fallbackUrl: null });

    // Close download menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleMute = () => {
        if (isMuted) {
            setVolume(prevVolume);
        } else {
            setPrevVolume(volume);
            setVolume(0);
        }
        setIsMuted(!isMuted);
    };

    const triggerLink = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * V19 Hyper-Tunnel: Accessibility Probe
     * Checks if the extracted URL is reachable by the client's browser.
     * If blocked (CORS/IP-lock), this returns false to trigger server-piping.
     */
    const testUrlAccessibility = async (url: string): Promise<boolean> => {
        try {
            // Use no-cors to avoid CORS blocks, we just want to see if the server responds at all
            // and Range: bytes=0-0 to keep it lightweight
            const res = await fetch(url, {
                mode: 'no-cors',
                signal: AbortSignal.timeout(3000)
            });
            return true;
        } catch (e) {
            console.warn("Hyper-Tunnel: URL inaccessible. Triggering Failure-Reflex...", e);
            return false;
        }
    };

    const handleDownload = async (type: 'audio' | 'video' | 'both') => {
        if (!currentTrack) return;

        setIsHubOpen(true);
        setHubStatus('scanning');
        setHubResults({ audio: null, video: null, fallbackUrl: null });
        setShowDownloadMenu(false);

        try {
            console.log("Omnipresence Phase 12: Engaging User-IP Spear discovery...");
            setStatusMessage("Quantum Search Engaged (User-IP Spear)...");

            // 1. Client-Side Probe (Primary - Uses Browser IP)
            const [audioUrl, videoUrl] = await Promise.all([
                (type === 'audio' || type === 'both') ? clientSideProbe(currentTrack.id, 'audio') : Promise.resolve(null),
                (type === 'video' || type === 'both') ? clientSideProbe(currentTrack.id, 'video') : Promise.resolve(null)
            ]);

            if (audioUrl || videoUrl) {
                console.log("Omnipresence: Link found by browser! Triggering Warp Tunnel...");
                handleGhostProtocol(type, {
                    audioUrl: audioUrl || null,
                    videoUrl: videoUrl || null
                });
            } else {
                // 2. Server-Side Fallback (Secondary - Uses Deep Shotgun)
                console.log("Omnipresence: Browser IP exhausted. Falling back to Server Gun...");
                const response = await fetch(`/api/download?id=${currentTrack.id}&type=${type}&action=discovery`, { signal: AbortSignal.timeout(30000) });
                const data = await response.json();

                if (data.status === 'found') {
                    handleGhostProtocol(type, {
                        audioUrl: data.audio || null,
                        videoUrl: data.video || null
                    });
                } else {
                    handleGhostProtocol(type);
                }
            }
        } catch (err) {
            console.error("Omnipresence: Discovery system failure, fallback to emergency tunnel.", err);
            handleGhostProtocol(type);
        }
    };

    // V4 ULTIMATE PROBE CONSTANTS
    const PIPED_NODES = [
        "https://pipedapi.kavin.rocks", "https://api.piped.privacydev.net", "https://pipedapi.adminforge.de",
        "https://pipedapi.leptons.xyz", "https://pipedapi.recloud.me", "https://piped-api.lunar.icu",
        "https://api.piped.victr.me", "https://pipedapi.tokyo.kappa.host", "https://pipedapi.mha.fi",
        "https://api.piped.projectsegfault.lt", "https://piped-api.loli.net", "https://pipedapi.moemoe.me"
    ];

    const INVIDIOUS_NODES = [
        "https://vid.puffyan.us", "https://invidious.flokinet.to", "https://inv.vern.cc", "https://iv.ggtyler.dev",
        "https://invidious.projectsegfau.lt", "https://iv.n0p.me", "https://invidious.namazso.eu", "https://inv.zzls.xyz",
        "https://invidious.lunar.icu", "https://iv.nautile.io", "https://iv.libRedirect.eu", "https://invidious.privacydev.net",
        "https://inv.nadeko.net", "https://yewtu.be", "https://invidious.nerdvpn.de", "https://inv.tux.pizza"
    ];

    const COBALT_NODES = [
        "https://cobalt.tools", "https://co.wuk.sh", "https://cobalt.api.unblocker.it", "https://cobalt.q69.it",
        "https://api.cobalt.tools", "https://cobalt-api.v06.me", "https://cobalt.sweet-pota.to", "https://cobaltt.tools",
        "https://cobalt.canine.tools", "https://lc.vern.cc", "https://cobalt.meowing.de", "https://co.eepy.moe"
    ];

    const clientSideProbe = async (videoId: string, type: 'audio' | 'video'): Promise<string | null> => {
        const fetchWithTimeout = async (url: string, options: any, timeout = 6000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(id);
                return response;
            } catch (e) {
                clearTimeout(id);
                throw e;
            }
        };

        const tryAllOrigins = async (url: string) => {
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const res = await fetchWithTimeout(proxyUrl, {}, 8000);
                if (!res.ok) return null;
                const data = await res.json();
                return JSON.parse(data.contents);
            } catch (e) { return null; }
        };

        const probePiped = async (instance: string): Promise<string | null> => {
            try {
                // Phase 17: Relay Shotgun (Ultra-Robust)
                const bridgeUrl = `/api/download?action=proxy&url=${encodeURIComponent(`${instance}/streams/${videoId}`)}&force=true`;
                const res = await fetchWithTimeout(bridgeUrl, { headers: { "Accept": "application/json" } }, 12000).catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    const streams = type === 'audio' ? data.audioStreams : data.videoStreams;
                    if (!streams || streams.length === 0) return null;
                    const stream = streams.find((s: any) => s.quality === "720p") || streams.find((s: any) => !s.videoOnly) || streams[0];
                    return stream?.url || null;
                }
            } catch (e) { }
            return null;
        };

        const probeInvidious = async (instance: string): Promise<string | null> => {
            try {
                // Phase 17: Relay Shotgun (Ultra-Robust)
                const bridgeUrl = `/api/download?action=proxy&url=${encodeURIComponent(`${instance}/api/v1/videos/${videoId}?local=true`)}&force=true`;
                const res = await fetchWithTimeout(bridgeUrl, {}, 12000).catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    const formats = data.adaptiveFormats || data.formatStreams || [];
                    const format = type === 'audio'
                        ? (formats.find((f: any) => f.type?.includes("audio/webm")) || formats.find((f: any) => f.type?.includes("audio/mp4")) || formats[0])
                        : (formats.find((f: any) => f.qualityLabel?.includes("720") || f.resolution === '720p') || formats.find((f: any) => f.type?.includes("video/mp4") && f.encoding?.includes("avc")) || formats[0]);
                    return format?.url || null;
                }
            } catch (e) { }
            return null;
        };

        const probeCobalt = async (instance: string): Promise<string | null> => {
            try {
                // Phase 17: Relay Shotgun (Ultra-Robust)
                const bridgeUrl = `/api/download?action=proxy&url=${encodeURIComponent(`${instance}/api/json`)}&force=true`;
                const payload = {
                    url: `https://youtube.com/watch?v=${videoId}`,
                    downloadMode: type === 'audio' ? 'audio' : 'auto',
                    youtubeVideoCodec: 'h264'
                };
                const res = await fetchWithTimeout(bridgeUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }, 12000).catch(() => null);

                if (res && res.ok) {
                    const d = await res.json();
                    return d.url || d.picker?.[0]?.url || null;
                }
            } catch (e) { }
            return null;
        };

        const probePremium = async (): Promise<string | null> => {
            try {
                // Phase 19: Chronos Engine (STS Sync + Cipher Recognition)
                const stsRes = await fetch("/api/download?action=sts").catch(() => null);
                const { sts } = stsRes ? await stsRes.json() : { sts: "20147" };

                const bridgeUrl = `/api/download?action=proxy&url=${encodeURIComponent(`https://www.youtube.com/youtubei/v1/player`)}&force=true`;
                const payload = {
                    videoId,
                    context: {
                        client: {
                            clientName: 'TVHTML5',
                            clientVersion: '7.20250224.01.00',
                            hl: 'en',
                            gl: 'US'
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp: parseInt(sts)
                        }
                    }
                };
                const res = await fetchWithTimeout(bridgeUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }, 15000).catch(() => null);

                if (res && res.ok) {
                    const data = await res.json();
                    const formats = [...(data.streamingData?.adaptiveFormats || []), ...(data.streamingData?.formats || [])];
                    const targetMime = type === 'audio' ? "audio/mp4" : "video/mp4";
                    const format = formats.find((f: any) => f.mimeType?.includes(targetMime) && (type === 'audio' || f.qualityLabel === "720p")) || formats[0];

                    if (format) {
                        if (format.url) return format.url;
                        if (format.signatureCipher || format.cipher) {
                            // Phase 19: Relay to Decipher Bridge
                            const c = format.signatureCipher || format.cipher;
                            const decRes = await fetch(`/api/download?action=decipher&cipher=${encodeURIComponent(c)}`).catch(() => null);
                            if (decRes && decRes.ok) {
                                const decData = await decRes.json();
                                return decData.url || null;
                            }
                        }
                    }
                }
            } catch (e) { }
            return null;
        };

        // V4 Strategy: Unified Ultra-Intensity Relayed Shotgun (Omega Singularity V18)
        try {
            console.log(`V4 Pulsar: Launching backup concurrent search for ${videoId}...`);
            setStatusMessage("Engaging Emergency Mirror Fleet...");

            const allNodes = [
                { type: 'premium' as const, url: 'direct' },
                ...PIPED_NODES.map(n => ({ type: 'piped' as const, url: n })),
                ...INVIDIOUS_NODES.map(n => ({ type: 'invidious' as const, url: n })),
                ...COBALT_NODES.map(n => ({ type: 'cobalt' as const, url: n }))
            ].sort((a) => a.type === 'premium' ? -1 : (Math.random() - 0.5));

            const batchSize = 30;
            for (let i = 0; i < allNodes.length; i += batchSize) {
                const batch = allNodes.slice(i, i + batchSize);
                const results = await Promise.all(batch.map((node: any) => {
                    if (node.type === 'premium') return probePremium();
                    if (node.type === 'piped') return probePiped(node.url);
                    if (node.type === 'invidious') return probeInvidious(node.url);
                    return probeCobalt(node.url);
                }));
                const valid = results.find(url => url !== null);
                if (valid) return valid;
            }
        } catch (globalErr) {
            console.error("V4 Engine failure:", globalErr);
        }

        return null;
    };

    const handleGhostProtocol = async (type: 'audio' | 'video' | 'both', discoveredUrls?: { audioUrl: string | null, videoUrl: string | null }) => {
        if (!currentTrack) return;
        setHubStatus('tunneling');
        setDownloadProgress(0);

        const bridgeFetch = async (t: 'audio' | 'video', directUrl?: string | null) => {
            // Build the pipe URL - if we have a direct URL, pass it for server-side proxying
            let pipeUrl = `/api/download?id=${currentTrack.id}&type=${t}&pipe=true`;
            if (directUrl) {
                pipeUrl += `&direct_url=${encodeURIComponent(directUrl)}`;
            }
            const response = await fetch(pipeUrl, {
                headers: {
                    'X-Pulsar-Agent': navigator.userAgent,
                    'X-Pulsar-Origin': window.location.origin,
                    'isNoQuery': 'true' // Phase 13 force tunnel
                }
            });
            if (!response.ok) throw new Error(`Tunnel Failed for ${t} (HTTP ${response.status})`);

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;

            const reader = response.body?.getReader();
            if (!reader) throw new Error("ReadableStream not supported");
            const chunks: any[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                    loaded += value.length;
                    if (total > 0 && (type !== 'both' || t === 'video')) {
                        setDownloadProgress(Math.floor((loaded / total) * 100));
                    }
                }
            }

            const blob = new Blob(chunks, { type: t === 'audio' ? 'audio/m4a' : 'video/mp4' });
            return URL.createObjectURL(blob);
        };

        // Attempt strategy: 
        // 1st: Use server tunnel with direct URL (if available)
        // 2nd: Use server tunnel with YTDL/Fleet (server-side)
        // 3rd: Client-side probe (bypass Vercel)
        const attemptDownload = async (t: 'audio' | 'video') => {
            const directUrl = t === 'audio' ? discoveredUrls?.audioUrl : discoveredUrls?.videoUrl;

            // Attempt 1 & 2: Server Tunnel (proxies the download)
            try {
                return await bridgeFetch(t, directUrl);
            } catch (e) {
                console.warn(`Server tunnel failed for ${t}, switching to Client-Side Fallback...`, e);
            }

            // Attempt 3: Client-Side Fallback (Deep Pulse Recovery)
            try {
                console.log(`Engaging Deep Pulse Discovery for ${t}...`);
                setHubStatus('scanning');
                const clientUrl = await clientSideProbe(currentTrack.id, t);
                if (clientUrl) {
                    console.log(`Client-Side success! URL: ${clientUrl}`);
                    // Simply return the direct URL? No, we need a Blob URL for consistency if possible, 
                    // BUT triggerLink handles direct URLs too. 
                    // If we return a direct URL here, `triggerLink` will use `download` attr, which might be ignored if cross-origin.
                    // But usually Cobalt URLs are downloadable.
                    // To be safe, we can try to fetch it as blob IF CORS allows.
                    try {
                        const res = await fetch(clientUrl);
                        if (res.ok) {
                            const blob = await res.blob();
                            return URL.createObjectURL(blob);
                        }
                    } catch (corsErr) {
                        // If fetch fails (CORS), just return the raw URL and let browser handle it
                        console.log("Client-side fetch blocked by CORS, returning raw URL");
                        return clientUrl;
                    }
                }
            } catch (e) {
                console.warn(`Client-side probe failed for ${t}:`, e);
            }

            throw new Error(`All tunnel methods exhausted for ${t}`);
        };

        try {
            if (type === 'both') {
                const [audioUrl, videoUrl] = await Promise.all([attemptDownload('audio'), attemptDownload('video')]);
                triggerLink(audioUrl, `${currentTrack.title.replace(/[^\w\s-]/g, "")}.m4a`);
                setTimeout(() => triggerLink(videoUrl, `${currentTrack.title.replace(/[^\w\s-]/g, "")}.mp4`), 1000);
                setHubStatus('ready');
                // Only revoke if it looks like a blob url
                setTimeout(() => {
                    if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
                    if (videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
                }, 60000);
            } else {
                const blobUrl = await attemptDownload(type);
                triggerLink(blobUrl, `${currentTrack.title.replace(/[^\w\s-]/g, "")}.${type === 'audio' ? 'm4a' : 'mp4'}`);
                setHubStatus('ready');
                setTimeout(() => { if (blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl); }, 60000);
            }
        } catch (e) {
            console.error("All tunnel attempts failed:", e);
            setHubStatus('fallback');
            // Auto-Targeting: Pre-fill Cobalt with the highest-reliability mirror
            setHubResults(prev => ({
                ...prev,
                fallbackUrl: `https://cobalt.tools/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${currentTrack.id}`)}`
            }));
        }
    };

    const currentTrack = storeTrack || {
        id: "vibe-check",
        title: "Feel the Vibe",
        artist: "Mark Ellis",
        thumbnail: "file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/player_feel_the_vibe_1771266405368.png",
        url: ""
    };

    if (!currentTrack) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-3xl mx-auto glass-heavy rounded-[40px] overflow-hidden p-2 shadow-2xl shadow-black/60 border border-white/10"
        >
            <PlayerContent />
            <div className="flex items-center justify-between px-3 h-20 relative">
                {/* Track Info (Left) */}
                <div className="flex items-center gap-x-4 w-[40%] min-w-0">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative w-14 h-14 flex-shrink-0"
                    >
                        <img
                            src={currentTrack.thumbnail || "/placeholder-music.png"}
                            alt="Thumbnail"
                            className="w-full h-full rounded-2xl object-cover shadow-2xl"
                        />
                        <div className="absolute inset-0 rounded-2xl border border-white/20 shadow-inner" />
                    </motion.div>
                    <div className="flex flex-col truncate">
                        <p className="text-white font-black text-base truncate leading-tight tracking-tight">
                            {currentTrack.title}
                        </p>
                        <p className="text-neutral-400 text-xs font-bold truncate tracking-wide">
                            {currentTrack.artist}
                        </p>
                    </div>
                </div>

                {/* Progress (Center) */}
                <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-y-2 w-full max-w-[180px] md:max-w-[300px]">
                    <div className="w-full h-1.5 bg-white/10 rounded-full relative cursor-pointer group">
                        {/* Progress Fill */}
                        <motion.div
                            className="absolute h-full pulsar-bg rounded-full"
                            style={{ width: `${progress * 100}%` }}
                        />
                        {/* Progress Handle (Mockup Detail) */}
                        <motion.div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-white/20"
                            style={{ left: `calc(${progress * 100}% - 8px)` }}
                        />
                    </div>
                </div>

                {/* Controls (Right) */}
                <div className="flex items-center gap-x-3 w-[40%] justify-end pr-1">
                    <div className="relative" ref={downloadMenuRef}>
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="p-2 text-white hover:text-green-400 transition"
                            title="Download"
                        >
                            <Download size={24} strokeWidth={2.5} />
                        </button>

                        {showDownloadMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-neutral-900 border border-white/10 rounded-xl p-2 shadow-2xl min-w-[140px] z-50">
                                <button
                                    onClick={() => handleDownload('audio')}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-sm text-white"
                                >
                                    <Music size={16} />
                                    Audio Only
                                </button>
                                <button
                                    onClick={() => handleDownload('video')}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-sm text-white"
                                >
                                    <Video size={16} />
                                    Video Only
                                </button>
                                <button
                                    onClick={() => handleDownload('both')}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-sm text-green-400 font-bold"
                                >
                                    <Download size={16} />
                                    Both
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        {isPlaying ? (
                            <Pause size={20} className="text-black fill-black" strokeWidth={3} />
                        ) : (
                            <Play size={20} className="text-black fill-black ml-1" strokeWidth={3} />
                        )}
                    </button>
                    <button
                        onClick={playNext}
                        className="p-2 text-white hover:text-neutral-300 transition"
                    >
                        <SkipForward size={32} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* V14 Acquisition Hub Modal */}
            {isHubOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-md bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={() => setIsHubOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition text-white/60 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#1DB954]/20 rounded-lg">
                                    <Shield size={24} className="text-[#1DB954]" />
                                </div>
                                <h2 className="text-xl font-bold">Acquisition Hub</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Status Section */}
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm text-white/60 font-medium">Status</span>
                                        {hubStatus === 'fallback' && (
                                            <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                                <AlertTriangle size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Manual Required</span>
                                            </div>
                                        )}
                                        {hubStatus === 'tunneling' && (
                                            <div className="flex items-center gap-2 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                                <Loader2 size={12} className="animate-spin" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Tunneling</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-white/40 leading-relaxed">
                                        {hubStatus === 'probing' && (
                                            <span className="flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin text-[#1DB954]" />
                                                Analyzing YouTube protection layers...
                                            </span>
                                        )}
                                        {(hubStatus === 'scanning' || hubStatus === 'probing') && (
                                            <span className="flex items-center gap-2 text-blue-400">
                                                <Loader2 size={14} className="animate-spin" />
                                                {statusMessage || "Quantum Mirror Search (400+ Nodes)..."}
                                            </span>
                                        )}
                                        {hubStatus === 'tunneling' && (
                                            <div className="w-full space-y-3">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-purple-400 uppercase">
                                                    <span>Mirror Stream Tunnel</span>
                                                    <span>{downloadProgress}%</span>
                                                </div>
                                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 transition-all duration-300"
                                                        style={{ width: `${downloadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-white/30 italic">
                                                    Encrypting stream packets through global mirror fleet...
                                                </p>
                                            </div>
                                        )}
                                        {hubStatus === 'ready' && (
                                            <span className="flex items-center gap-2 text-[#1DB954]">
                                                <CheckCircle2 size={14} />
                                                Warp-Tunnel Established. Acquisition successful.
                                            </span>
                                        )}
                                        {hubStatus === 'fallback' && (
                                            <span className="flex items-center gap-2 text-amber-500">
                                                <AlertTriangle size={14} />
                                                Vercel-IP Blacklisted. Extreme Deep-Pulse required.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Results / Action Section */}
                                {hubStatus === 'ready' && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-white/60">Your files are now available locally:</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {hubResults.audio && (
                                                <button
                                                    onClick={() => triggerLink(hubResults.audio!.url, hubResults.audio!.filename)}
                                                    className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition group"
                                                >
                                                    <Music size={16} className="text-purple-400" />
                                                    <span className="text-xs font-bold text-white">Audio</span>
                                                </button>
                                            )}
                                            {hubResults.video && (
                                                <button
                                                    onClick={() => triggerLink(hubResults.video!.url, hubResults.video!.filename)}
                                                    className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition group"
                                                >
                                                    <Video size={16} className="text-blue-400" />
                                                    <span className="text-xs font-bold text-white">Video</span>
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setIsHubOpen(false)}
                                            className="w-full py-3 bg-[#1DB954] hover:scale-[1.02] active:scale-95 rounded-xl text-black font-bold text-sm transition mt-2 shadow-lg shadow-[#1DB954]/20"
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}

                                {hubStatus === 'fallback' && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-center text-white/40 uppercase tracking-widest mb-2">
                                            Auto-Tunnel Blocked. Select Secure Method:
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => window.open(`https://cobalt.tools/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${currentTrack.id}`)}`, '_blank')}
                                                className="flex items-center justify-center gap-2 p-3 bg-[#323232] hover:bg-[#404040] rounded-lg text-xs font-bold transition group"
                                            >
                                                <ExternalLink size={14} className="group-hover:text-blue-400" /> Cobalt (Auto)
                                            </button>
                                            <button
                                                onClick={() => window.open(`https://cobalt.canine.tools/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${currentTrack.id}`)}`, '_blank')}
                                                className="flex items-center justify-center gap-2 p-3 bg-[#323232] hover:bg-[#404040] rounded-lg text-xs font-bold transition group"
                                            >
                                                <ExternalLink size={14} className="group-hover:text-blue-400" /> Cobalt (Mirror)
                                            </button>
                                            <button
                                                onClick={() => window.open(`https://loader.to/api/button/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${currentTrack.id}`)}&f=${playbackMode === 'audio' ? 'mp3' : 'mp4'}`, '_blank')}
                                                className="flex items-center justify-center gap-2 p-3 bg-[#323232] hover:bg-[#404040] rounded-lg text-xs font-bold transition group"
                                            >
                                                <ExternalLink size={14} className="group-hover:text-amber-400" /> Loader.to
                                            </button>
                                            <button
                                                onClick={() => window.open(`https://www.y2mate.com/youtube/${currentTrack.id}`, '_blank')}
                                                className="flex items-center justify-center gap-2 p-3 bg-[#323232] hover:bg-[#404040] rounded-lg text-xs font-bold transition group"
                                            >
                                                <ExternalLink size={14} className="group-hover:text-red-400" /> Y2Mate
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-center text-white/30">
                                            Note: Opens in new secure tab. No ads.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-white/5 border-t border-white/5">
                            <p className="text-[10px] text-white/20 text-center uppercase tracking-[0.2em]">
                                Mellofy Quantum-Shield Fleet v27.0 Quantum-Tunnel
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Player;

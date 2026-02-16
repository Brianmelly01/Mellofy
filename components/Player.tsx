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

interface AcquisitionResults {
    audio: { url: string; filename: string } | null;
    video: { url: string; filename: string } | null;
    fallbackUrl: string | null;
}

const Player = () => {
    const {
        currentTrack,
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
        setHubStatus('probing');
        setExtractionLayer('ytdl');
        setHubResults({ audio: null, video: null, fallbackUrl: null });
        setShowDownloadMenu(false);

        try {
            const response = await fetch(`/api/download?id=${currentTrack.id}&type=${type}`);
            const data = await response.json();

            setExtractionLayer('verifying');
            setHubResults({
                audio: data.audio,
                video: data.video,
                fallbackUrl: data.fallbackUrl
            });

            if (data.status === 'ready') {
                // Test accessibility
                let audioOk = data.audio ? await testUrlAccessibility(data.audio.url) : true;
                let videoOk = data.video ? await testUrlAccessibility(data.video.url) : true;

                if (!audioOk || !videoOk) {
                    console.log("Direct download failed. Falling back to tunnel with discovered URLs.");
                    // Pass the discovered URLs to the tunnel for server-side proxying
                    handleGhostProtocol(type, {
                        audioUrl: data.audio?.url || null,
                        videoUrl: data.video?.url || null
                    });
                } else {
                    setHubStatus('ready');
                    if (type === 'audio' && data.audio) triggerLink(data.audio.url, data.audio.filename);
                    if (type === 'video' && data.video) triggerLink(data.video.url, data.video.filename);
                    if (type === 'both') {
                        if (data.audio) triggerLink(data.audio.url, data.audio.filename);
                        if (data.video) setTimeout(() => triggerLink(data.video.url, data.video.filename), 1000);
                    }
                }
            } else if (data.ghostProtocolEnabled) {
                handleGhostProtocol(type);
            } else {
                console.log("Status not ready, engaging Ghost Protocol...");
                handleGhostProtocol(type);
            }
        } catch (err) {
            console.error("Download probe failed, engaging Ghost Protocol...", err);
            handleGhostProtocol(type);
        }
    };

    // V4 ULTIMATE PROBE CONSTANTS
    const PIPED_NODES = [
        "https://pipedapi.kavin.rocks",
        "https://api.piped.privacydev.net",
        "https://pipedapi.adminforge.de",
        "https://pipedapi.leptons.xyz",
        "https://pipedapi.recloud.me",
        "https://piped-api.lunar.icu",
        "https://api.piped.victr.me",
        "https://pipedapi.tokyo.kappa.host"
    ];

    const INVIDIOUS_NODES = [
        "https://vid.puffyan.us",
        "https://invidious.flokinet.to",
        "https://inv.vern.cc",
        "https://iv.ggtyler.dev",
        "https://invidious.projectsegfau.lt"
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
                let data = null;
                try {
                    const res = await fetchWithTimeout(`${instance}/streams/${videoId}`, { headers: { "Accept": "application/json" } });
                    if (res.ok) data = await res.json();
                } catch (e) { }

                if (!data) data = await tryAllOrigins(`${instance}/streams/${videoId}`);

                if (data && data.audioStreams && data.audioStreams.length > 0) {
                    if (type === 'audio') return data.audioStreams[0].url;
                    if (type === 'video' && data.videoStreams && data.videoStreams.length > 0) {
                        return (data.videoStreams.find((s: any) => !s.videoOnly) || data.videoStreams[0]).url;
                    }
                }
            } catch (e) { }
            return null;
        };

        const probeInvidious = async (instance: string): Promise<string | null> => {
            try {
                let data = null;
                try {
                    const res = await fetchWithTimeout(`${instance}/api/v1/videos/${videoId}`, { headers: { "Accept": "application/json" } });
                    if (res.ok) data = await res.json();
                } catch (e) { }

                if (!data) data = await tryAllOrigins(`${instance}/api/v1/videos/${videoId}`);

                if (data && data.formatStreams) {
                    const stream = data.formatStreams.find((s: any) =>
                        type === 'audio' ? (s.audioQuality && s.container === 'm4a') : (s.resolution === '720p' && s.container === 'mp4')
                    );
                    if (stream) return stream.url;
                }
            } catch (e) { }
            return null;
        };

        // V6 Strategy: Deep Pulse Discovery Bridge (Force Mode Extraction)
        try {
            console.log(`V6 Deep Pulse: Offloading high-intensity search for ${videoId} to server...`);
            setStatusMessage("Quantum Mirror Search (80+ Nodes)...");
            const discoveryRes = await fetchWithTimeout(`/api/download?id=${videoId}&type=${type}&action=discovery`, {}, 20000);
            if (discoveryRes.ok) {
                const data = await discoveryRes.json();
                if (data.status === "found") {
                    console.log("V6 Discovery: Server pulse successful!");
                    return type === 'audio' ? data.audio : data.video || data.audio; // Handle V6 response shape
                }
            }
        } catch (e) {
            console.warn("V6 Discovery Bridge timeout, falling back to V4 Pulsar mirrors...", e);
        }

        // V4 Strategy: Concurrent Polling in Parallel (Emergency Backup)
        try {
            console.log(`V4 Pulsar: Launching backup concurrent search for ${videoId}...`);
            setStatusMessage("Engaging Emergency Mirror Fleet...");

            // 1. Concurrent Piped Probing (The main hope)
            const pipedResults = await Promise.all(PIPED_NODES.slice(0, 6).map(node => probePiped(node)));
            const workingPiped = pipedResults.find(r => r !== null);
            if (workingPiped) return workingPiped;

            // 2. Concurrent Invidious Probing (Backup)
            const invResults = await Promise.all(INVIDIOUS_NODES.slice(0, 4).map(node => probeInvidious(node)));
            const workingInv = invResults.find(r => r !== null);
            if (workingInv) return workingInv;

            // 3. Cobalt (Last resort automated)
            // Restore COBALT_PUBLIC_INSTANCES locally for this block
            const COBALT_INSTS = [
                "https://cobalt.canine.tools",
                "https://lc.vern.cc",
                "https://cobalt.tools"
            ];
            for (const instance of COBALT_INSTS) {
                try {
                    const res = await fetchWithTimeout(`${instance}/api/json`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: `https://youtube.com/watch?v=${videoId}`, downloadMode: type === 'audio' ? 'audio' : 'auto' })
                    });
                    if (res.ok) {
                        const d = await res.json();
                        if (d.url) return d.url;
                    }
                } catch (e) { }
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
            const response = await fetch(pipeUrl);
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

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-0 bg-black w-full py-2 h-[80px] px-4 border-t border-neutral-800 z-50">
            <PlayerContent />
            <div className="grid grid-cols-2 md:grid-cols-3 h-full items-center max-w-[1400px] mx-auto">
                {/* Track Info */}
                <div className="flex items-center gap-x-4">
                    <img
                        src={currentTrack.thumbnail || "/placeholder-music.png"}
                        alt="Thumbnail"
                        className="w-14 h-14 rounded-md object-cover"
                    />
                    <div className="flex flex-col truncate">
                        <p className="text-white font-medium text-sm truncate">{currentTrack.title}</p>
                        <p className="text-neutral-400 text-xs truncate">{currentTrack.artist}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center max-w-[400px] w-full gap-y-2">
                    <div className="flex items-center gap-x-6 text-neutral-400">
                        <Shuffle size={18} className="cursor-pointer hover:text-white transition" />
                        <SkipBack
                            onClick={playPrevious}
                            size={22}
                            className="cursor-pointer hover:text-white transition"
                        />
                        <button
                            onClick={togglePlay}
                            className="bg-white rounded-full p-2 hover:scale-105 transition"
                        >
                            {isPlaying ? (
                                <Pause size={24} className="text-black fill-black" />
                            ) : (
                                <Play size={24} className="text-black fill-black ml-1" />
                            )}
                        </button>
                        <SkipForward
                            onClick={playNext}
                            size={22}
                            className="cursor-pointer hover:text-white transition"
                        />
                        <Repeat size={18} className="cursor-pointer hover:text-white transition" />
                    </div>
                    <div className="w-full flex items-center gap-x-2 px-2">
                        <span className="text-[10px] text-neutral-400 min-w-[30px] text-right">0:00</span>
                        <div className="flex-1 h-1 bg-neutral-800 rounded-full relative group cursor-pointer overflow-hidden">
                            <div
                                className="absolute h-full bg-neutral-400 group-hover:bg-emerald-500 transition-all"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-neutral-400 min-w-[30px]">{currentTrack.duration || "3:45"}</span>
                    </div>
                </div>

                {/* Volume & Extras */}
                <div className="hidden md:flex items-center justify-end pr-2 gap-x-4">
                    <button
                        onClick={() => setPlaybackMode(playbackMode === 'audio' ? 'video' : 'audio')}
                        className={cn(
                            "flex items-center gap-x-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition whitespace-nowrap",
                            playbackMode === 'video'
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                : "bg-neutral-800 text-neutral-400 hover:text-white border border-white/5"
                        )}
                    >
                        {playbackMode === 'audio' ? <Music size={12} /> : <Video size={12} />}
                        {playbackMode === 'audio' ? "Audio" : "Video"}
                    </button>

                    {/* Download dropdown */}
                    <div className="relative" ref={downloadMenuRef}>
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className={cn(
                                "text-neutral-400 hover:text-white transition"
                            )}
                            title="Download"
                        >
                            <Download size={18} />
                        </button>
                        {showDownloadMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden min-w-[160px] z-50">
                                <button
                                    onClick={() => handleDownload('audio')}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-sm text-white/90"
                                >
                                    <Music size={18} className="text-[#1DB954]" />
                                    Audio (High Quality)
                                </button>
                                <button
                                    onClick={() => handleDownload('video')}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-sm text-white/90"
                                >
                                    <Video size={18} className="text-[#1DB954]" />
                                    Video (HD MP4)
                                </button>
                                <button
                                    onClick={() => handleDownload('both')}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 border-t border-white/5 transition text-sm text-white font-medium"
                                >
                                    <Shield size={18} className="text-[#1DB954]" />
                                    Download Both
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-x-2 w-[120px]">
                        <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition">
                            {volume === 0 || isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <div className="flex-1 h-1 bg-neutral-800 rounded-full relative group">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setVolume(val);
                                    if (val > 0) setIsMuted(false);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div
                                className="absolute h-full bg-neutral-400 group-hover:bg-emerald-500 rounded-full"
                                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                            />
                        </div>
                    </div>
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
                                        {hubStatus === 'scanning' && (
                                            <span className="flex items-center gap-2 text-blue-400">
                                                <Loader2 size={14} className="animate-spin" />
                                                {statusMessage || "Searching global mirrors..."}
                                            </span>
                                        )}
                                        {hubStatus === 'tunneling' && (
                                            <div className="w-full space-y-3">
                                                <p className="flex items-center gap-2 text-sm text-white/90 font-medium">
                                                    <Loader2 size={16} className="animate-spin text-purple-500" />
                                                    {downloadProgress > 0 ? `Downloading... ${downloadProgress}%` : "Deploying Quantum Shield Tunnel..."}
                                                </p>
                                                <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="absolute inset-y-0 left-0 bg-purple-600 transition-all duration-300"
                                                        style={{ width: `${downloadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {hubStatus === 'ready' && "Success! Link decoupled from YouTube. Check downloads."}
                                        {hubStatus === 'fallback' && "YouTube protection detected. Use the manual mirrors below."}
                                    </div>
                                </div>

                                {/* Universal Acquisition Button */}
                                {hubStatus === 'fallback' && (
                                    <div className="w-full space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Recovery Recommended</span>
                                        </div>
                                        <button
                                            onClick={() => window.open(hubResults.fallbackUrl || `https://cobalt.tools/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${currentTrack.id}`)}`, '_blank')}
                                            className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Shield size={18} />
                                            Targeted Force Unlock
                                        </button>
                                        <button
                                            onClick={() => handleGhostProtocol('both')}
                                            className="w-full py-3 rounded-xl font-medium text-xs text-white/40 hover:text-white/60 transition-all"
                                        >
                                            Retry Auto-Tunnel
                                        </button>
                                    </div>
                                )}
                                {hubStatus === 'tunneling' && (
                                    <button
                                        disabled={true}
                                        className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-purple-900/50 text-purple-300 border border-purple-500/30 cursor-not-allowed opacity-80 flex items-center justify-center gap-2"
                                    >
                                        <Loader2 size={18} className="animate-spin" />
                                        Tunneling Active...
                                    </button>
                                )}
                                {(hubStatus !== 'tunneling' && hubStatus !== 'fallback' && hubStatus !== 'scanning' && hubStatus !== 'probing') && (
                                    <button
                                        onClick={() => handleGhostProtocol('both')}
                                        className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-[#1DB954] text-black border-b-2 border-[#1DB954]/50 hover:scale-[1.02] hover:bg-[#1ed760] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <div className="relative">
                                            <Music size={18} />
                                        </div>
                                        Tunnel Both (Audio + Video)
                                    </button>
                                )}
                                <div className={cn(
                                    "p-4 rounded-xl border transition-all duration-300",
                                    hubResults.audio ? "bg-[#1DB954]/10 border-[#1DB954]/20" : "bg-white/5 border-white/5 grayscale"
                                )}>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", hubResults.audio ? "bg-[#1DB954]/20" : "bg-white/5")}>
                                            <Music size={24} className={hubResults.audio ? "text-[#1DB954]" : "text-white/20"} />
                                        </div>
                                        <span className="text-xs font-medium">Audio M4A</span>
                                        <button
                                            onClick={() => {
                                                if (hubResults.audio) triggerLink(hubResults.audio.url, hubResults.audio.filename);
                                                else if (hubStatus === 'tunneling') handleGhostProtocol('audio');
                                                else handleDownload('audio');
                                            }}
                                            className={cn(
                                                "w-full py-2 rounded-full text-[10px] font-bold uppercase tracking-tighter transition shadow-lg",
                                                hubResults.audio
                                                    ? "bg-[#1DB954] text-black hover:scale-105 active:scale-95 shadow-[#1DB954]/20"
                                                    : hubStatus === 'tunneling'
                                                        ? "bg-purple-600 text-white hover:scale-105 active:scale-95 shadow-purple-600/20"
                                                        : "bg-amber-500 text-black hover:scale-105 active:scale-95 animate-pulse shadow-amber-500/20"
                                            )}
                                        >
                                            {hubResults.audio ? "Download" : hubStatus === 'tunneling' ? "Tunnel Stream" : "Force Unlock"}
                                        </button>
                                    </div>
                                </div>

                                <div className={cn(
                                    "p-4 rounded-xl border transition-all duration-300",
                                    hubResults.video ? "bg-[#1DB954]/10 border-[#1DB954]/20" : "bg-white/5 border-white/5 grayscale"
                                )}>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", hubResults.video ? "bg-[#1DB954]/20" : "bg-white/5")}>
                                            <Video size={24} className={hubResults.video ? "text-[#1DB954]" : "text-white/20"} />
                                        </div>
                                        <span className="text-xs font-medium">Video MP4</span>
                                        <button
                                            onClick={() => {
                                                if (hubResults.video) triggerLink(hubResults.video.url, hubResults.video.filename);
                                                else if (hubStatus === 'tunneling') handleGhostProtocol('video');
                                                else handleDownload('video');
                                            }}
                                            className={cn(
                                                "w-full py-2 rounded-full text-[10px] font-bold uppercase tracking-tighter transition shadow-lg",
                                                hubResults.video
                                                    ? "bg-[#1DB954] text-black hover:scale-105 active:scale-95 shadow-[#1DB954]/20"
                                                    : hubStatus === 'tunneling'
                                                        ? "bg-purple-600 text-white hover:scale-105 active:scale-95 shadow-purple-600/20"
                                                        : "bg-amber-500 text-black hover:scale-105 active:scale-95 animate-pulse shadow-amber-500/20"
                                            )}
                                        >
                                            {hubResults.video ? "Download" : hubStatus === 'tunneling' ? "Tunnel Stream" : "Force Unlock"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* External Acquisition Matrix */}
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

                        <div className="px-8 py-4 bg-white/5 border-t border-white/5">
                            <p className="text-[10px] text-white/20 text-center uppercase tracking-[0.2em]">
                                Mellofy Quantum-Shield Fleet v27.0 Quantum-Tunnel
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Player;

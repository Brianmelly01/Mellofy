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
    const [hubStatus, setHubStatus] = useState<'probing' | 'ready' | 'fallback' | 'obliterating' | 'tunneling'>('probing');
    const [extractionLayer, setExtractionLayer] = useState<'ytdl' | 'cobalt' | 'shotgun' | 'mobile_elite' | 'verifying' | 'done'>('ytdl');
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

    const handleDownload = async (type: 'audio' | 'video' | 'both', isForce: boolean = false) => {
        if (!currentTrack) return;

        setIsHubOpen(true);
        setHubStatus(isForce ? 'obliterating' : 'probing');
        setExtractionLayer(isForce ? 'mobile_elite' : 'ytdl');
        setHubResults({ audio: null, video: null, fallbackUrl: null });
        setShowDownloadMenu(false);

        // Simulation cycle for granular UX progress
        const layers: ('ytdl' | 'cobalt' | 'shotgun' | 'mobile_elite')[] = isForce
            ? ['mobile_elite', 'shotgun', 'cobalt']
            : ['ytdl', 'cobalt', 'shotgun'];

        let currentLayerIndex = 0;
        const layerInterval = setInterval(() => {
            if (currentLayerIndex < layers.length - 1) {
                currentLayerIndex++;
                setExtractionLayer(layers[currentLayerIndex]);
            }
        }, isForce ? 1000 : 1500);

        try {
            const response = await fetch(`/api/download?id=${currentTrack.id}&type=both${isForce ? '&force=true' : ''}`);
            const data = await response.json();

            clearInterval(layerInterval);
            setExtractionLayer('verifying');

            setHubResults({
                audio: data.audio,
                video: data.video,
                fallbackUrl: data.fallbackUrl
            });

            if (data.status === 'ready') {
                // V19 Failure-Reflex: Test accessibility before initiating
                let audioOk = data.audio ? await testUrlAccessibility(data.audio.url) : true;
                let videoOk = data.video ? await testUrlAccessibility(data.video.url) : true;

                if (!audioOk || !videoOk) {
                    console.log("Hyper-Tunnel: Critical IP-Lock detected. Initiating Piping protocol.");
                    setHubStatus('tunneling');
                    return;
                }

                setHubStatus('ready');
                if (type === 'audio' && data.audio) triggerLink(data.audio.url, data.audio.filename);
                if (type === 'video' && data.video) triggerLink(data.video.url, data.video.filename);
                if (type === 'both') {
                    if (data.audio) triggerLink(data.audio.url, data.audio.filename);
                    if (data.video) setTimeout(() => triggerLink(data.video.url, data.video.filename), 1000);
                }
            } else if (data.ghostProtocolEnabled) {
                setHubStatus('tunneling');
            } else {
                setHubStatus('fallback');
            }
        } catch (err) {
            clearInterval(layerInterval);
            setHubStatus('fallback');
            setHubResults(prev => ({ ...prev, fallbackUrl: `https://cobalt.canine.tools/?q=${encodeURIComponent(`https://www.youtube.com/watch?v=${currentTrack.id}`)}` }));
        }
    };

    const handleGhostProtocol = async (type: 'audio' | 'video') => {
        if (!currentTrack) return;
        setHubStatus('tunneling');
        setDownloadProgress(0);

        // Titan-Beam: Front-end Bridge-Fetch (Audio)
        if (type === 'audio') {
            try {
                const pipeUrl = `/api/download?id=${currentTrack.id}&type=audio&pipe=true`;
                const response = await fetch(pipeUrl);

                if (!response.ok) throw new Error("Titan-Beam Bridge Failed");

                const contentLength = response.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength, 10) : 0;
                let loaded = 0;

                const reader = response.body?.getReader();
                if (!reader) throw new Error("ReadableStream not supported");

                const chunks: Uint8Array[] = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    chunks.push(value);
                    loaded += value.length;

                    if (total > 0) {
                        setDownloadProgress(Math.floor((loaded / total) * 100));
                    }
                }

                const blob = new Blob(chunks, { type: 'audio/m4a' });
                const blobUrl = URL.createObjectURL(blob);
                triggerLink(blobUrl, `${currentTrack.title.replace(/[^\w\s-]/g, "")}.m4a`);

                // Cleanup
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                    setHubStatus('ready');
                    setDownloadProgress(0);
                }, 3000);
            } catch (e) {
                console.error("Titan-Beam Failure:", e);
                setHubStatus('fallback');
            }
        } else {
            // Video still uses direct handover due to memory constraints on 100MB+ blobs
            const pipeUrl = `/api/download?id=${currentTrack.id}&type=video&pipe=true`;
            triggerLink(pipeUrl, `${currentTrack.title.replace(/[^\w\s-]/g, "")}.mp4`);
            setTimeout(() => setHubStatus('ready'), 3000);
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
                                        {hubStatus === 'probing' && (
                                            <div className="flex items-center gap-2 text-[#1DB954]">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Probing Fleet...</span>
                                            </div>
                                        )}
                                        {hubStatus === 'obliterating' && (
                                            <div className="flex items-center gap-2 text-amber-500">
                                                <Shield size={16} className="animate-pulse" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Obliterating...</span>
                                            </div>
                                        )}
                                        {hubStatus === 'tunneling' && (
                                            <div className="flex items-center gap-2 text-purple-500">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Ghost Protocol...</span>
                                            </div>
                                        )}
                                        {hubStatus === 'ready' && (
                                            <div className="flex items-center gap-2 text-[#1DB954]">
                                                <CheckCircle2 size={16} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Streams Ready</span>
                                            </div>
                                        )}
                                        {hubStatus === 'fallback' && (
                                            <div className="flex items-center gap-2 text-amber-500">
                                                <AlertTriangle size={16} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Signature Detected</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed italic">
                                        {hubStatus === 'probing' && (
                                            <>
                                                {extractionLayer === 'ytdl' && "Deciphering YouTube Signature logic (InnerTube Layer)..."}
                                                {extractionLayer === 'cobalt' && "Injecting stream into Global Cobalt Network..."}
                                                {extractionLayer === 'shotgun' && "Probing verified worldwide proxy nodes..."}
                                            </>
                                        )}
                                        {hubStatus === 'obliterating' && (
                                            <>
                                                {extractionLayer === 'mobile_elite' && "Switching to Android Music Mobile authorized bridge..."}
                                                {extractionLayer === 'shotgun' && "Saturating signature decryptors via expanded shotgun batch..."}
                                                {extractionLayer === 'cobalt' && "Finalizing high-resilience stream reconstruction..."}
                                            </>
                                        )}
                                        {hubStatus === 'tunneling' && (
                                            <div className="w-full space-y-2">
                                                <p>Titan-Beam Active: Bridging Secure Stream via Authorized Handshake...</p>
                                                {downloadProgress > 0 && (
                                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-500 transition-all duration-300"
                                                            style={{ width: `${downloadProgress}%` }}
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-purple-400 animate-pulse">
                                                    {downloadProgress > 0 ? `Streaming Fragmented Binary Data: ${downloadProgress}%` : "Establishing persistent identity tunnel..."}
                                                </p>
                                            </div>
                                        )}
                                        {extractionLayer === 'verifying' && "Performing Fleet Security Verification (Ghost-Node Check)..."}
                                        {hubStatus === 'ready' && "Direct extraction successful. Your download has been initiated."}
                                        {hubStatus === 'fallback' && "Fleet verification failed. Switching to Secure Acquisition..."}
                                    </p>
                                </div>

                                {/* Results Section */}
                                <div className="grid grid-cols-2 gap-4">
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
                                                    else handleDownload('audio', true);
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
                                                    else handleDownload('video', true);
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

                                {/* External Acquisition Button */}
                                {hubStatus === 'fallback' && hubResults.fallbackUrl && (
                                    <button
                                        onClick={() => window.open(hubResults.fallbackUrl!, '_blank')}
                                        className="w-full flex items-center justify-center gap-2 p-4 bg-amber-500 text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition shadow-lg shadow-amber-500/20"
                                    >
                                        <ExternalLink size={18} />
                                        Open Secure Acquisition Window
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-white/5 border-t border-white/5">
                            <p className="text-[10px] text-white/20 text-center uppercase tracking-[0.2em]">
                                Mellofy Ultra-Resilience Fleet v21.0 Titan-Beam
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Player;

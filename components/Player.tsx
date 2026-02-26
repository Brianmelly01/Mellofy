"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Shuffle,
    Download,
    Heart,
    ChevronUp,
    Music,
    Video,
    Shield,
    X,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ExternalLink,
    Copy,
    Heart as HeartIcon
} from "lucide-react";
import { usePlayerStore, Track } from "@/lib/store/usePlayerStore";
import { useLibraryStore } from "@/lib/store/useLibraryStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";

interface AcquisitionResults {
    audio: { url: string; filename: string } | null;
    video: { url: string; filename: string } | null;
}

import { clientSideProbe } from "@/lib/download-helper";

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
        setPlaybackMode,
        isHubOpen,
        hubStatus,
        hubProgress,
        hubTrack,
        openHub,
        closeHub,
        setHubStatus,
        setHubProgress,
        streamUrl,
        setStreamUrl,
        isLoadingStream,
        setIsLoadingStream,
        playbackError,
        setPlaybackError,
        setProgress: setStoreProgress
    } = usePlayerStore();

    const { toggleLike, isLiked } = useLibraryStore();

    const playerRef = useRef<any>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(volume);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

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

    // Auto-extract stream on track change
    useEffect(() => {
        if (!storeTrack) return;

        const extractStream = async () => {
            try {
                // Check if we already have a stream URL (unlikely but safe)
                if (streamUrl && !isLoadingStream) return;

                const { url, logs } = await clientSideProbe(storeTrack.id, playbackMode);
                if (url) {
                    setStreamUrl(url);
                } else {
                    setPlaybackError("Failed to extract media stream. Try downloading instead.");
                }
            } catch (err: any) {
                console.error("Extraction error:", err);
                setPlaybackError(err.message || "Extraction failed");
            }
        };

        extractStream();
    }, [storeTrack?.id, playbackMode]);

    const triggerLink = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownload = async (type: 'audio' | 'video' | 'both') => {
        const track = storeTrack || hubTrack;
        if (!track) return;

        openHub(track);
        setShowDownloadMenu(false);

        const attemptDownloadOne = async (t: 'audio' | 'video') => {
            setHubProgress(20);
            const filename = `${track.title.replace(/[^\w\s-]/g, "")}.${t === 'audio' ? 'm4a' : 'mp4'}`;

            // Server-side extraction (runs full pipeline: youtubei.js → ytdl-core → Piped → Invidious)
            try {
                setHubProgress(40);
                const res = await fetch(`/api/download?id=${track.id}&type=${t}&get_url=true`, {
                    signal: AbortSignal.timeout(55000),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        setHubProgress(100);
                        triggerLink(data.url, data.filename || filename);
                        return true;
                    }
                } else {
                    console.warn(`Server extraction returned ${res.status}`);
                }
            } catch (e: any) {
                console.warn(`Server extraction failed for ${t}:`, e?.message);
            }

            return false;
        };

        try {
            let success = false;
            if (type === 'both') {
                const s1 = await attemptDownloadOne('audio');
                setHubProgress(50);
                await new Promise(r => setTimeout(r, 800));
                const s2 = await attemptDownloadOne('video');
                success = s1 || s2;
            } else {
                success = await attemptDownloadOne(type);
            }

            if (success) {
                setHubProgress(100);
                setHubStatus('ready');
                setTimeout(() => closeHub(), 2500);
            } else {
                setHubStatus('fallback');
            }
        } catch (err) {
            console.error("Acquisition error:", err);
            setHubStatus('fallback');
        }
    };

    return (
        <>
            <AnimatePresence>
                {storeTrack && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 py-3 px-4 z-50 shadow-2xl"
                    >
                        {/* Hidden ReactPlayer */}
                        <div className={cn(
                            "fixed bottom-24 right-4 w-64 aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl z-50 transition-all duration-500",
                            playbackMode === 'video' ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
                        )}>
                            {streamUrl && (
                                <ReactPlayer
                                    {...({
                                        ref: playerRef,
                                        url: streamUrl,
                                        playing: isPlaying,
                                        volume: volume,
                                        muted: isMuted,
                                        width: "100%",
                                        height: "100%",
                                        onProgress: (state: any) => setStoreProgress(state.played),
                                        onEnded: playNext,
                                        onError: (e: any) => {
                                            console.error("ReactPlayer Error:", e);
                                            setPlaybackError("Playback error occurred.");
                                        },
                                        onBuffer: () => setIsLoadingStream(true),
                                        onBufferEnd: () => setIsLoadingStream(false),
                                        config: {
                                            file: {
                                                attributes: {
                                                    controlsList: 'nodownload',
                                                    className: "w-full h-full object-contain"
                                                }
                                            }
                                        }
                                    } as any)}
                                />
                            )}
                            {isLoadingStream && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
                            {/* Track Info */}
                            <div className="flex items-center gap-4 w-1/3 min-w-0">
                                <div className="relative group flex-shrink-0">
                                    <img
                                        src={storeTrack.thumbnail}
                                        alt={storeTrack.title}
                                        className="w-14 h-14 rounded-md object-cover shadow-lg"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md cursor-pointer">
                                        <ChevronUp size={20} className="text-white" />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
                                        {storeTrack.title}
                                    </h4>
                                    <p className="text-[11px] text-neutral-400 truncate hover:text-white cursor-pointer mt-0.5">
                                        {storeTrack.artist}
                                    </p>
                                </div>
                                <button
                                    onClick={() => storeTrack && toggleLike(storeTrack)}
                                    className={cn(
                                        "ml-2 transition",
                                        storeTrack && isLiked(storeTrack.id) ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"
                                    )}
                                >
                                    <HeartIcon size={18} fill={storeTrack && isLiked(storeTrack.id) ? "currentColor" : "none"} />
                                </button>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col items-center gap-2 flex-grow max-w-2xl">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setPlaybackMode(playbackMode === 'audio' ? 'video' : 'audio')}
                                        className={cn(
                                            "p-2 transition",
                                            playbackMode === 'video' ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"
                                        )}
                                    >
                                        <Shuffle size={18} />
                                    </button>
                                    <button
                                        onClick={playPrevious}
                                        className="p-2 text-white hover:text-neutral-300 transition"
                                    >
                                        <SkipBack size={24} fill="currentColor" />
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        disabled={isLoadingStream}
                                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:scale-100 relative"
                                    >
                                        {isLoadingStream ? (
                                            <Loader2 size={20} className="text-black animate-spin" strokeWidth={3} />
                                        ) : isPlaying ? (
                                            <Pause size={20} className="text-black fill-black" strokeWidth={3} />
                                        ) : (
                                            <Play size={20} className="text-black fill-black ml-1" strokeWidth={3} />
                                        )}
                                    </button>
                                    <button
                                        onClick={playNext}
                                        className="p-2 text-white hover:text-neutral-300 transition"
                                    >
                                        <SkipForward size={24} fill="currentColor" />
                                    </button>

                                    <div className="relative" ref={downloadMenuRef}>
                                        <button
                                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                            className="p-2 text-neutral-400 hover:text-white transition"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <AnimatePresence>
                                            {showDownloadMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-32 bg-[#282828] border border-white/10 rounded-xl shadow-2xl p-1 z-[60] overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => handleDownload('audio')}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-xs text-neutral-200"
                                                    >
                                                        <Music size={14} /> Audio
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload('video')}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-xs text-neutral-200"
                                                    >
                                                        <Video size={14} /> Video
                                                    </button>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <button
                                                        onClick={() => handleDownload('both')}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-xs text-[#1DB954] font-bold"
                                                    >
                                                        <Download size={14} /> Both
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {playbackError && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-3 py-1 rounded-full whitespace-nowrap animate-bounce flex items-center gap-1">
                                        <AlertTriangle size={10} />
                                        {playbackError}
                                    </div>
                                )}
                                {/* Progress Bar (Minimal) */}
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer">
                                    <motion.div
                                        className="h-full bg-white group-hover:bg-[#1DB954]"
                                        initial={false}
                                        animate={{ width: `${(progress || 0) * 100}%` }}
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.001"
                                        value={progress || 0}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setStoreProgress(val);
                                            playerRef.current?.seekTo(val);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Volume (Right) */}
                            <div className="flex items-center justify-end gap-3 w-1/3">
                                <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition">
                                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white hover:accent-[#1DB954] transition-all"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Acquisition Hub Modal */}
            <AnimatePresence>
                {isHubOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-[#1DB954]/20 rounded-lg">
                                        <Shield size={24} className="text-[#1DB954]" />
                                    </div>
                                    <h2 className="text-xl font-bold">Acquisition Hub</h2>
                                    <button
                                        onClick={() => closeHub()}
                                        className="ml-auto p-1 hover:bg-white/10 rounded-full transition text-white/40 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-white/60 font-medium">Status</span>
                                            {hubStatus === 'scanning' ? (
                                                <div className="flex items-center gap-1.5 text-blue-400">
                                                    <Loader2 size={14} className="animate-spin" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Acquiring</span>
                                                </div>
                                            ) : hubStatus === 'ready' ? (
                                                <div className="flex items-center gap-1.5 text-[#1DB954]">
                                                    <CheckCircle2 size={14} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-amber-500">
                                                    <AlertTriangle size={14} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Fallback</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                                            <motion.div
                                                className={cn(
                                                    "h-full transition-all duration-300",
                                                    hubStatus === 'scanning' ? "bg-blue-500" :
                                                        hubStatus === 'ready' ? "bg-[#1DB954]" : "bg-amber-500"
                                                )}
                                                animate={{ width: `${hubProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-white/30 mt-3 italic text-center">
                                            {hubStatus === 'scanning' ? "Bypassing restrictions via global fleet..." :
                                                hubStatus === 'ready' ? "Acquisition successfully initiated." :
                                                    "Content restricted. Use the bridges below to acquire:"}
                                        </p>
                                    </div>

                                    {hubStatus === ('fallback' as any) && hubTrack && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => window.open(`https://cobalt.tools/#https://www.youtube.com/watch?v=${hubTrack.id}`, '_blank')}
                                                    className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-[10px] font-bold"
                                                >
                                                    <ExternalLink size={14} className="text-blue-400" /> Cobalt Web
                                                </button>
                                                <button
                                                    onClick={() => window.open(`https://www.y2mate.com/youtube/${hubTrack.id}`, '_blank')}
                                                    className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-[10px] font-bold"
                                                >
                                                    <ExternalLink size={14} className="text-[#f13131]" /> Y2Mate
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${hubTrack.id}`);
                                                    alert("YouTube URL copied to clipboard!");
                                                }}
                                                className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-[10px] font-bold"
                                            >
                                                <Copy size={14} className="text-green-400" /> Copy YouTube Link
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => closeHub()}
                                        className={cn(
                                            "w-full py-3 rounded-xl font-bold text-sm transition shadow-lg",
                                            hubStatus === ('fallback' as any)
                                                ? "bg-white/10 hover:bg-white/20 text-white shadow-white/5"
                                                : "bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-[#1DB954]/10"
                                        )}
                                    >
                                        {hubStatus === ('fallback' as any) ? "Cancel" : "Close"}
                                    </button>
                                </div>
                            </div>
                            <div className="px-8 py-3 bg-white/5 border-t border-white/5 text-center">
                                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">Quantum Acquisition v10.5</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Player;

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
    Heart as HeartIcon
} from "lucide-react";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AcquisitionResults {
    audio: { url: string; filename: string } | null;
    video: { url: string; filename: string } | null;
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
    const [hubStatus, setHubStatus] = useState<'scanning' | 'ready'>('scanning');
    const [downloadProgress, setDownloadProgress] = useState<number>(0);

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

    const handleDownload = async (type: 'audio' | 'video' | 'both') => {
        if (!storeTrack) return;

        setIsHubOpen(true);
        setHubStatus('scanning');
        setDownloadProgress(0);
        setShowDownloadMenu(false);

        const attemptDownloadOne = async (t: 'audio' | 'video') => {
            setDownloadProgress(prev => Math.min(prev + 20, 90));
            const filename = `${storeTrack.title.replace(/[^\w\s-]/g, "")}.${t === 'audio' ? 'm4a' : 'mp4'}`;

            // Phase 1: Quick Server sync (8s)
            try {
                const res = await fetch(`/api/download?id=${storeTrack.id}&type=${t}&get_url=true`, {
                    signal: AbortSignal.timeout(8000),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        triggerLink(data.url, data.filename || filename);
                        return;
                    }
                }
            } catch (e) {
                console.warn(`Phase 1 fallback for ${t}`);
            }

            // Phase 2: Cobalt Redirect
            const cobaltUrl = `https://cobalt.tools/#https://www.youtube.com/watch?v=${storeTrack.id}`;
            window.open(cobaltUrl, '_blank', 'noopener,noreferrer');
        };

        try {
            if (type === 'both') {
                await attemptDownloadOne('audio');
                await new Promise(r => setTimeout(r, 1000));
                await attemptDownloadOne('video');
            } else {
                await attemptDownloadOne(type);
            }
            setDownloadProgress(100);
            setHubStatus('ready');
        } catch (err) {
            console.error("Acquisition error:", err);
            setHubStatus('ready');
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
                        className="fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-md border-t border-white/5 py-3 px-4 z-50 shadow-2xl"
                    >
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
                                <button className="ml-2 text-neutral-400 hover:text-[#1DB954] transition">
                                    <HeartIcon size={18} />
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
                                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
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

                                {/* Progress Bar (Minimal) */}
                                <div className="w-full flex items-center gap-2">
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-white group-hover:bg-[#1DB954]"
                                            initial={false}
                                            animate={{ width: `${(progress || 0) * 100}%` }}
                                        />
                                    </div>
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
                                        onClick={() => setIsHubOpen(false)}
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
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[#1DB954]">
                                                    <CheckCircle2 size={14} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                                            <motion.div
                                                className={cn("h-full transition-all duration-300", hubStatus === 'scanning' ? "bg-blue-500" : "bg-[#1DB954]")}
                                                animate={{ width: `${downloadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-white/30 mt-3 italic text-center">
                                            {hubStatus === 'scanning' ? "Bypassing restrictions via global fleet..." : "Acquisition successfully initiated."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setIsHubOpen(false)}
                                        className="w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] rounded-xl text-black font-bold text-sm transition shadow-lg shadow-[#1DB954]/10"
                                    >
                                        Close
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

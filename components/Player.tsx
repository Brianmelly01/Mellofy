"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Download, Video, Music } from "lucide-react";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { cn } from "@/lib/utils";
import PlayerContent from "./PlayerContent";

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
    const [isDownloading, setIsDownloading] = useState(false);
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

    const handleDownload = async (type: 'audio' | 'video') => {
        if (!currentTrack) return;
        setIsDownloading(true);
        setShowDownloadMenu(false);

        try {
            const response = await fetch(`/api/download?id=${currentTrack.id}&type=${type}`);

            // Check if response is JSON (fallback mode)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (data.fallbackUrl) {
                    // Open the acquisition portal in a new tab
                    window.open(data.fallbackUrl, '_blank');
                    setIsDownloading(false);
                    return;
                }
                if (!response.ok) {
                    alert(data.error || "Download failed");
                    setIsDownloading(false);
                    return;
                }
            }

            if (!response.ok) {
                alert("Download failed. The server might be temporarily restricted.");
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            const ext = type === 'audio' ? 'm4a' : 'mp4';
            link.href = url;
            link.setAttribute("download", `${currentTrack.title}.${ext}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Download failed. Secure Acquisition Mode failed to initialize.');
        } finally {
            setIsDownloading(false);
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
                            disabled={isDownloading}
                            className={cn(
                                "text-neutral-400 hover:text-white transition",
                                isDownloading && "animate-pulse text-emerald-400"
                            )}
                            title="Download"
                        >
                            <Download size={18} />
                        </button>
                        {showDownloadMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden min-w-[160px] z-50">
                                <button
                                    onClick={() => handleDownload('audio')}
                                    className="flex items-center gap-x-2 w-full px-4 py-2.5 text-sm text-white hover:bg-neutral-800 transition"
                                >
                                    <Music size={14} />
                                    Download Audio
                                </button>
                                <button
                                    onClick={() => handleDownload('video')}
                                    className="flex items-center gap-x-2 w-full px-4 py-2.5 text-sm text-white hover:bg-neutral-800 transition"
                                >
                                    <Video size={14} />
                                    Download Video
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
        </div>
    );
};

export default Player;

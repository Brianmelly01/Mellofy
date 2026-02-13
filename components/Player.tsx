"use client";

import React, { useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Download } from "lucide-react";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { cn } from "@/lib/utils";
import PlayerContent from "./PlayerContent";

const Player = () => {
    const { currentTrack, isPlaying, togglePlay, volume, setVolume, playNext, playPrevious, progress } = usePlayerStore();
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(volume);

    const toggleMute = () => {
        if (isMuted) {
            setVolume(prevVolume);
        } else {
            setPrevVolume(volume);
            setVolume(0);
        }
        setIsMuted(!isMuted);
    };

    const handleDownload = () => {
        if (!currentTrack) return;
        const link = document.createElement("a");
        link.href = currentTrack.url;
        link.setAttribute("download", `${currentTrack.title}.mp3`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        <Shuffle size={20} className="cursor-pointer hover:text-white transition" />
                        <SkipBack
                            onClick={playPrevious}
                            size={24}
                            className="cursor-pointer hover:text-white transition"
                        />
                        <button
                            onClick={togglePlay}
                            className="bg-white rounded-full p-2 hover:scale-105 transition"
                        >
                            {isPlaying ? (
                                <Pause size={28} className="text-black fill-black" />
                            ) : (
                                <Play size={28} className="text-black fill-black ml-1" />
                            )}
                        </button>
                        <SkipForward
                            onClick={playNext}
                            size={24}
                            className="cursor-pointer hover:text-white transition"
                        />
                        <Repeat size={20} className="cursor-pointer hover:text-white transition" />
                    </div>
                    <div className="w-full flex items-center gap-x-2 px-2">
                        <span className="text-[10px] text-neutral-400 min-w-[30px] text-right">0:00</span>
                        <div className="flex-1 h-1 bg-neutral-600 rounded-full relative group cursor-pointer overflow-hidden">
                            <div
                                className="absolute h-full bg-white rounded-full group-hover:bg-green-500 transition-all duration-300"
                                style={{ width: `${progress * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-[10px] text-neutral-400 min-w-[30px]">3:45</span>
                    </div>
                </div>

                {/* Volume & Extras */}
                <div className="hidden md:flex items-center justify-end pr-2 gap-x-3">
                    <button
                        onClick={handleDownload}
                        className="text-neutral-400 hover:text-white transition mr-2"
                        title="Download"
                    >
                        <Download size={20} />
                    </button>
                    <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition">
                        {volume === 0 || isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <div className="w-24 h-1 bg-neutral-600 rounded-full cursor-pointer relative group">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div
                            className="absolute h-full bg-white rounded-full group-hover:bg-green-500"
                            style={{ width: `${volume * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Player;

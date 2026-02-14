"use client";

import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, Maximize2 } from "lucide-react";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve) => {
        if (ytApiLoaded && window.YT?.Player) {
            resolve();
            return;
        }

        ytApiCallbacks.push(resolve);

        if (ytApiLoading) return;
        ytApiLoading = true;

        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            ytApiLoaded = true;
            ytApiCallbacks.forEach((cb) => cb());
            ytApiCallbacks.length = 0;
        };
    });
}

const PlayerContent = () => {
    const {
        currentTrack,
        isPlaying,
        volume,
        playNext,
        setProgress,
        playbackMode,
        togglePlay,
    } = usePlayerStore();

    const [isVideoExpanded, setIsVideoExpanded] = useState(true);
    const [apiReady, setApiReady] = useState(false);

    const videoPlayerRef = useRef<any>(null);
    const audioPlayerRef = useRef<any>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const audioContainerRef = useRef<HTMLDivElement>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const lastTrackIdRef = useRef<string | null>(null);

    // Load YouTube IFrame API
    useEffect(() => {
        loadYouTubeAPI().then(() => setApiReady(true));
    }, []);

    // Create or update players when track changes
    useEffect(() => {
        if (!apiReady || !currentTrack?.id) return;

        const isNewTrack = lastTrackIdRef.current !== currentTrack.id;
        lastTrackIdRef.current = currentTrack.id;

        const isVideoMode = playbackMode === "video";

        // Destroy the opposite player to avoid double audio
        if (isVideoMode) {
            if (audioPlayerRef.current) {
                try { audioPlayerRef.current.destroy(); } catch { }
                audioPlayerRef.current = null;
            }
        } else {
            if (videoPlayerRef.current) {
                try { videoPlayerRef.current.destroy(); } catch { }
                videoPlayerRef.current = null;
            }
        }

        if (isVideoMode && isVideoExpanded) {
            // Create/update video player
            if (videoPlayerRef.current && !isNewTrack) return;
            if (videoPlayerRef.current) {
                try { videoPlayerRef.current.destroy(); } catch { }
            }

            if (!videoContainerRef.current) return;
            // Create a fresh div for the player
            const div = document.createElement("div");
            div.id = "yt-video-player";
            videoContainerRef.current.innerHTML = "";
            videoContainerRef.current.appendChild(div);

            videoPlayerRef.current = new window.YT.Player("yt-video-player", {
                videoId: currentTrack.id,
                width: "100%",
                height: "100%",
                playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                },
                events: {
                    onStateChange: (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            playNext();
                        }
                    },
                    onReady: (event: any) => {
                        event.target.setVolume(volume * 100);
                        event.target.playVideo();
                    },
                },
            });
        } else {
            // Create/update audio-only player (hidden)
            if (audioPlayerRef.current && !isNewTrack) return;
            if (audioPlayerRef.current) {
                try { audioPlayerRef.current.destroy(); } catch { }
            }

            if (!audioContainerRef.current) return;
            const div = document.createElement("div");
            div.id = "yt-audio-player";
            audioContainerRef.current.innerHTML = "";
            audioContainerRef.current.appendChild(div);

            audioPlayerRef.current = new window.YT.Player("yt-audio-player", {
                videoId: currentTrack.id,
                width: "1",
                height: "1",
                playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                },
                events: {
                    onStateChange: (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            playNext();
                        }
                    },
                    onReady: (event: any) => {
                        event.target.setVolume(volume * 100);
                        event.target.playVideo();
                    },
                },
            });
        }
    }, [apiReady, currentTrack?.id, playbackMode, isVideoExpanded]);

    // Sync play/pause state
    useEffect(() => {
        const player = videoPlayerRef.current || audioPlayerRef.current;
        if (!player?.getPlayerState) return;

        try {
            const state = player.getPlayerState();
            if (isPlaying && state !== window.YT.PlayerState.PLAYING) {
                player.playVideo();
            } else if (!isPlaying && state === window.YT.PlayerState.PLAYING) {
                player.pauseVideo();
            }
        } catch { }
    }, [isPlaying]);

    // Sync volume
    useEffect(() => {
        const player = videoPlayerRef.current || audioPlayerRef.current;
        try {
            player?.setVolume?.(volume * 100);
        } catch { }
    }, [volume]);

    // Progress tracking
    useEffect(() => {
        if (progressInterval.current) clearInterval(progressInterval.current);

        progressInterval.current = setInterval(() => {
            const player = videoPlayerRef.current || audioPlayerRef.current;
            if (!player?.getCurrentTime || !player?.getDuration) return;

            try {
                const current = player.getCurrentTime();
                const duration = player.getDuration();
                if (duration > 0) {
                    setProgress(current / duration);
                }
            } catch { }
        }, 500);

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [currentTrack?.id, playbackMode]);

    // Expand video when switching to video mode
    useEffect(() => {
        if (playbackMode === "video") {
            setIsVideoExpanded(true);
        }
    }, [currentTrack?.id, playbackMode]);

    if (!currentTrack) return null;

    const isVideoMode = playbackMode === "video";

    return (
        <>
            {/* Video Player (visible in video mode) */}
            <AnimatePresence>
                {isVideoMode && isVideoExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 right-6 z-40"
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50 aspect-video w-[320px] md:w-[480px]">
                            <div
                                ref={videoContainerRef}
                                className="w-full h-full"
                            />
                            <div className="absolute top-2 right-2 flex gap-x-2 z-10">
                                <button
                                    onClick={() => setIsVideoExpanded(false)}
                                    className="bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80 transition backdrop-blur-md"
                                >
                                    <Minimize2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Minimized video indicator */}
            {isVideoMode && !isVideoExpanded && (
                <button
                    onClick={() => setIsVideoExpanded(true)}
                    className="fixed bottom-24 right-6 z-40 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 flex items-center gap-x-2 text-xs text-neutral-300 hover:text-white transition shadow-lg"
                >
                    <Maximize2 size={14} />
                    Show Video
                </button>
            )}

            {/* Hidden container for audio-only player */}
            <div className="fixed -left-[9999px] top-0 w-[1px] h-[1px] overflow-hidden">
                <div ref={audioContainerRef} />
            </div>
        </>
    );
};

export default PlayerContent;

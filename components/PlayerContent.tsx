"use client";

import { usePlayerStore } from "@/lib/store/usePlayerStore";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, Maximize2 } from "lucide-react";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

const PlayerContent = () => {
    const { currentTrack, isPlaying, volume, playNext, setProgress, playbackMode } = usePlayerStore();
    const [isMounted, setIsMounted] = useState(false);
    const [isVideoExpanded, setIsVideoExpanded] = useState(true);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Expand video panel when new video starts
    useEffect(() => {
        if (playbackMode === 'video') {
            setIsVideoExpanded(true);
        }
    }, [currentTrack?.id, playbackMode]);

    if (!isMounted || !currentTrack) return null;

    const isVideoMode = playbackMode === 'video';

    // Build the YouTube URL from the track ID for ReactPlayer
    const youtubeUrl = currentTrack.id
        ? `https://www.youtube.com/watch?v=${currentTrack.id}`
        : currentTrack.url;

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
                            <ReactPlayer
                                url={youtubeUrl}
                                playing={isPlaying}
                                volume={volume}
                                onEnded={playNext}
                                onProgress={(state: any) => setProgress(state.played)}
                                width="100%"
                                height="100%"
                                controls={true}
                                config={{
                                    youtube: {
                                        playerVars: {
                                            autoplay: 1,
                                            modestbranding: 1,
                                            rel: 0,
                                        },
                                    },
                                }}
                            />
                            <div className="absolute top-2 right-2 flex gap-x-2">
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

            {/* Hidden audio-only player (for audio mode or when video is minimized) */}
            <div className="hidden">
                {(!isVideoMode || !isVideoExpanded) && (
                    <ReactPlayer
                        url={youtubeUrl}
                        playing={isPlaying}
                        volume={volume}
                        onEnded={playNext}
                        onProgress={(state: any) => setProgress(state.played)}
                        width="0"
                        height="0"
                        config={{
                            youtube: {
                                playerVars: {
                                    autoplay: 1,
                                },
                            },
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default PlayerContent;

"use client";

import { usePlayerStore } from "@/lib/store/usePlayerStore";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

const PlayerContent = () => {
    const { currentTrack, isPlaying, volume, playNext, setProgress, playbackMode } = usePlayerStore();
    const [isMounted, setIsMounted] = useState(false);
    const [isVideoExpanded, setIsVideoExpanded] = useState(true);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Always keep it expanded when a new video starts if was minimized
    useEffect(() => {
        if (playbackMode === 'video') {
            setIsVideoExpanded(true);
        }
    }, [currentTrack?.id, playbackMode]);

    if (!isMounted || !currentTrack) return null;

    const isVideoMode = playbackMode === 'video';

    return (
        <>
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
                                url={currentTrack.url}
                                playing={isPlaying}
                                volume={volume}
                                onEnded={playNext}
                                onProgress={(state: any) => setProgress(state.played)}
                                width="100%"
                                height="100%"
                                controls={true}
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

            {/* Hidden player for audio only mode or when video is minimized/minimized overlay doesn't support play/pause well if detached */}
            <div className="hidden">
                {(!isVideoMode || !isVideoExpanded) && (
                    <ReactPlayer
                        url={currentTrack.url}
                        playing={isPlaying}
                        volume={volume}
                        onEnded={playNext}
                        onProgress={(state: any) => setProgress(state.played)}
                        width="0"
                        height="0"
                    />
                )}
            </div>
        </>
    );
};

export default PlayerContent;

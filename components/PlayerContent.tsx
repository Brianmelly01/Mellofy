"use client";

import { usePlayerStore } from "@/lib/store/usePlayerStore";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

const PlayerContent = () => {
    const { currentTrack, isPlaying, volume, togglePlay, playNext, setProgress } = usePlayerStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || !currentTrack) return null;

    return (
        <div className="hidden">
            <ReactPlayer
                url={currentTrack.url}
                playing={isPlaying}
                volume={volume}
                onEnded={playNext}
                onProgress={(state: any) => setProgress(state.played)}
                width="0"
                height="0"
            />
        </div>
    );
};

export default PlayerContent;

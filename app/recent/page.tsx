"use client";

import { motion } from "framer-motion";
import { Clock, Play, Music, ArrowLeft } from "lucide-react";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { useRouter } from "next/navigation";

export default function RecentPage() {
    const { queue, setTrack, setPlaybackMode } = usePlayerStore();
    const router = useRouter();

    const handlePlayTrack = (track: any) => {
        setPlaybackMode('audio');
        setTrack(track);
    };

    return (
        <div className="pt-20 pb-24 px-4 md:px-6 min-h-screen bg-gradient-to-b from-orange-900/10 to-transparent">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-full transition text-neutral-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-end gap-6">
                        <div className="h-44 w-44 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                            <Clock size={80} className="text-white opacity-90" />
                            <div className="absolute inset-0 bg-black/10" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold uppercase tracking-wider mb-2">Collection</p>
                            <h1 className="text-white text-7xl font-black mb-6 tracking-tighter">History</h1>
                            <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                <span className="font-bold">Recent Queue</span>
                                <span className="h-1 w-1 rounded-full bg-white/40" />
                                <span>{queue.length} items</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracks List */}
                <div className="w-full">
                    {queue.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <Clock size={48} className="text-neutral-700 mb-4" />
                            <h3 className="text-white text-xl font-bold mb-2">No recent tracks</h3>
                            <p className="text-neutral-500 max-w-xs">Start listening to songs and they will appear in your history.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {queue.map((track, index) => (
                                <motion.div
                                    key={`${track.id}-${index}`}
                                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                    onClick={() => handlePlayTrack(track)}
                                    className="flex items-center gap-4 px-4 py-3 rounded-lg group cursor-pointer"
                                >
                                    <span className="text-neutral-500 text-sm w-4">{index + 1}</span>
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <img src={track.thumbnail} alt="" className="h-10 w-10 rounded object-cover shadow-lg" />
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate text-sm">{track.title}</p>
                                            <p className="text-neutral-400 text-xs truncate">{track.artist}</p>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition">
                                        <Play size={18} className="text-[#1DB954] fill-currentColor" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

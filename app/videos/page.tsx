"use client";

import { motion } from "framer-motion";
import { Video, Play, Music, ArrowLeft } from "lucide-react";
import { useLibraryStore } from "@/lib/store/useLibraryStore";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { useRouter } from "next/navigation";

export default function VideosPage() {
    const { likedTracks } = useLibraryStore();
    const { setTrack, setPlaybackMode } = usePlayerStore();
    const router = useRouter();

    const videoTracks = likedTracks.filter(t => t.type === 'video' || t.type === 'song'); // In this app, most songs have video equivalents

    const handlePlayVideo = (track: any) => {
        setPlaybackMode('video');
        setTrack(track);
    };

    return (
        <div className="pt-20 pb-24 px-4 md:px-6 min-h-screen bg-gradient-to-b from-rose-900/10 to-transparent">
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
                        <div className="h-44 w-44 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                            <Video size={80} className="text-white opacity-90" />
                            <div className="absolute inset-0 bg-black/10" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold uppercase tracking-wider mb-2">Collection</p>
                            <h1 className="text-white text-7xl font-black mb-6 tracking-tighter">Music Videos</h1>
                            <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                <span className="font-bold">Visual Collection</span>
                                <span className="h-1 w-1 rounded-full bg-white/40" />
                                <span>{videoTracks.length} items</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {videoTracks.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <Video size={48} className="text-neutral-700 mb-4" />
                        <h3 className="text-white text-xl font-bold mb-2">No videos discovered</h3>
                        <p className="text-neutral-500 max-w-xs">Like songs or search for videos to build your visual library.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videoTracks.map((track) => (
                            <motion.div
                                key={track.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handlePlayVideo(track)}
                                className="bg-neutral-800/30 rounded-xl overflow-hidden cursor-pointer group border border-white/5"
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    <img src={track.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <div className="bg-rose-600 p-3 rounded-full shadow-xl">
                                            <Play size={24} className="text-white fill-white ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-white font-bold truncate mb-1">{track.title}</h3>
                                    <p className="text-neutral-400 text-sm truncate">{track.artist}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { motion } from "framer-motion";
import { Heart, Play, Music, Trash2, ArrowLeft } from "lucide-react";
import { useLibraryStore } from "@/lib/store/useLibraryStore";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LikedPage() {
    const { likedTracks, toggleLike } = useLibraryStore();
    const { setTrack, setQueue, setPlaybackMode } = usePlayerStore();
    const router = useRouter();

    const handlePlayAll = () => {
        if (likedTracks.length > 0) {
            setPlaybackMode('audio');
            setTrack(likedTracks[0]);
            setQueue(likedTracks);
        }
    };

    const handlePlayTrack = (track: any) => {
        setPlaybackMode('audio');
        setTrack(track);
        setQueue(likedTracks);
    };

    return (
        <div className="pt-20 pb-24 px-4 md:px-6 min-h-screen bg-gradient-to-b from-purple-900/20 to-transparent">
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
                        <div className="h-44 w-44 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                            <Heart size={80} className="text-white fill-white opacity-90" />
                            <div className="absolute inset-0 bg-black/10" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold uppercase tracking-wider mb-2">Playlist</p>
                            <h1 className="text-white text-7xl font-black mb-6 tracking-tighter">Liked Songs</h1>
                            <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                <span className="font-bold">Brian</span>
                                <span className="h-1 w-1 rounded-full bg-white/40" />
                                <span>{likedTracks.length} songs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 mb-8 mt-10">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayAll}
                        disabled={likedTracks.length === 0}
                        className="h-14 w-14 bg-[#1DB954] hover:bg-[#1ed760] rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                    >
                        <Play size={24} className="text-black fill-black ml-1" />
                    </motion.button>
                </div>

                {/* Tracks Table */}
                <div className="w-full">
                    <div className="grid grid-cols-[16px_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-white/10 text-neutral-400 text-sm font-medium mb-4">
                        <span>#</span>
                        <span>Title</span>
                        <span>Artist</span>
                        <span className="pr-4 text-right">Action</span>
                    </div>

                    {likedTracks.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <Heart size={48} className="text-neutral-700 mb-4" />
                            <h3 className="text-white text-xl font-bold mb-2">Songs you like will appear here</h3>
                            <p className="text-neutral-500 max-w-xs">Save songs by tapping the heart icon anywhere in the app.</p>
                            <Link href="/">
                                <button className="mt-6 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition">
                                    Find songs
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {likedTracks.map((track, index) => (
                                <motion.div
                                    key={track.id}
                                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                    onClick={() => handlePlayTrack(track)}
                                    className="grid grid-cols-[16px_1fr_1fr_auto] gap-4 px-4 py-3 rounded-lg group cursor-pointer"
                                >
                                    <span className="text-neutral-500 self-center text-sm">{index + 1}</span>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src={track.thumbnail} alt="" className="h-10 w-10 rounded object-cover shadow-lg" />
                                        <p className="text-white font-medium truncate text-sm">{track.title}</p>
                                    </div>
                                    <p className="text-neutral-400 text-sm self-center truncate">{track.artist}</p>
                                    <div className="flex items-center gap-4 pr-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleLike(track);
                                            }}
                                            className="text-[#1DB954] opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Heart size={18} fill="currentColor" />
                                        </button>
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

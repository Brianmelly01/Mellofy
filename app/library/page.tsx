"use client";

import { motion } from "framer-motion";
import { Heart, Video, Clock, ListMusic, Music } from "lucide-react";
import Link from "next/link";
import { useLibraryStore } from "@/lib/store/useLibraryStore";
import { usePlayerStore } from "@/lib/store/usePlayerStore";

export default function LibraryPage() {
    const { likedTracks, playlists } = useLibraryStore();
    const { queue } = usePlayerStore();

    const libraryItems = [
        {
            id: 'liked',
            name: "Liked Songs",
            icon: Heart,
            gradient: "from-purple-600 to-blue-600",
            count: likedTracks.length,
            href: "/liked"
        },
        {
            id: 'videos',
            name: "Your Videos",
            icon: Video,
            gradient: "from-pink-600 to-rose-600",
            count: likedTracks.filter(t => t.type === 'video').length,
            href: "/videos"
        },
        {
            id: 'recent',
            name: "Recently Played",
            icon: Clock,
            gradient: "from-orange-600 to-amber-600",
            count: queue.length,
            href: "/recent"
        },
        {
            id: 'playlists',
            name: "Your Playlists",
            icon: ListMusic,
            gradient: "from-green-600 to-emerald-600",
            count: playlists.length,
            href: "/playlists"
        },
    ];

    return (
        <div className="pt-20 pb-24 px-4 md:px-6">
            <h1 className="text-3xl font-bold text-white mb-6">Your Library</h1>

            {/* Quick Access */}
            <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {libraryItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.id} href={item.href}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`bg-gradient-to-br ${item.gradient} rounded-xl p-6 cursor-pointer relative overflow-hidden h-40 flex flex-col justify-end`}
                                >
                                    <div className="relative z-10">
                                        <Icon className="w-8 h-8 text-white mb-2" />
                                        <h3 className="text-white font-bold text-lg mb-1">{item.name}</h3>
                                        <p className="text-white/80 text-sm">{item.count} items</p>
                                    </div>
                                    <div className="absolute -right-6 -bottom-6 opacity-20">
                                        <Icon className="w-28 h-28 text-white" />
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Playlists */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Your Playlists</h2>
                    <button className="text-xs text-neutral-400 hover:text-white transition">See All →</button>
                </div>

                {playlists.length === 0 ? (
                    <div className="bg-neutral-800/20 border border-white/5 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                        <ListMusic className="w-12 h-12 text-neutral-600 mb-4" />
                        <h3 className="text-white font-medium mb-1">No playlists yet</h3>
                        <p className="text-neutral-500 text-sm max-w-xs">Create your first playlist to start organizing your collection.</p>
                        <button
                            className="mt-4 px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition"
                        >
                            Create Playlist
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {playlists.map((playlist) => (
                            <motion.div
                                key={playlist.id}
                                whileHover={{ y: -5 }}
                                className="bg-neutral-800/30 p-3 rounded-xl cursor-pointer hover:bg-neutral-800/50 transition group"
                            >
                                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-neutral-700 flex items-center justify-center relative">
                                    {playlist.cover ? (
                                        <img src={playlist.cover} alt={playlist.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Music className="w-10 h-10 text-neutral-500" />
                                    )}
                                </div>
                                <h3 className="text-white font-medium text-sm truncate">{playlist.name}</h3>
                                <p className="text-neutral-500 text-xs">{playlist.tracks.length} tracks</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

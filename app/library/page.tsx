"use client";

import { motion } from "framer-motion";
import { Heart, Video, Clock, ListMusic } from "lucide-react";
import Link from "next/link";

const libraryItems = [
    {
        id: 1,
        name: "Liked Songs",
        icon: Heart,
        gradient: "from-purple-600 to-blue-600",
        count: 127,
        href: "/liked"
    },
    {
        id: 2,
        name: "Your Videos",
        icon: Video,
        gradient: "from-pink-600 to-rose-600",
        count: 34,
        href: "/videos"
    },
    {
        id: 3,
        name: "Recently Played",
        icon: Clock,
        gradient: "from-orange-600 to-amber-600",
        count: 89,
        href: "/recent"
    },
    {
        id: 4,
        name: "Your Playlists",
        icon: ListMusic,
        gradient: "from-green-600 to-emerald-600",
        count: 12,
        href: "/playlists"
    },
];

const recentPlaylists = [
    { id: 1, name: "My Mix #1", tracks: 50, cover: "https://picsum.photos/seed/lib1/200" },
    { id: 2, name: "Road Trip", tracks: 32, cover: "https://picsum.photos/seed/lib2/200" },
    { id: 3, name: "Chill Evening", tracks: 28, cover: "https://picsum.photos/seed/lib3/200" },
    { id: 4, name: "Workout", tracks: 45, cover: "https://picsum.photos/seed/lib4/200" },
];

export default function LibraryPage() {
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
                                    className={`bg-gradient-to-br ${item.gradient} rounded-xl p-6 cursor-pointer relative overflow-hidden`}
                                >
                                    <Icon className="w-10 h-10 text-white mb-3" />
                                    <h3 className="text-white font-bold text-lg mb-1">{item.name}</h3>
                                    <p className="text-white/80 text-sm">{item.count} items</p>
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
                <h2 className="text-xl font-semibold text-white mb-4">Your Playlists</h2>
                <div className="space-y-2">
                    {recentPlaylists.map((playlist) => (
                        <motion.div
                            key={playlist.id}
                            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                            className="flex items-center gap-4 p-3 rounded-lg cursor-pointer bg-neutral-800/30"
                        >
                            <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                <img
                                    src={playlist.cover}
                                    alt={playlist.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate">{playlist.name}</h3>
                                <p className="text-neutral-400 text-sm">{playlist.tracks} tracks</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

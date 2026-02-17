"use client";

import { motion } from "framer-motion";
import { Music, Podcast, Radio, TrendingUp } from "lucide-react";

const categories = [
    { name: "Music", icon: Music, gradient: "from-purple-600 to-pink-600" },
    { name: "Podcasts", icon: Podcast, gradient: "from-blue-600 to-cyan-600" },
    { name: "Radio", icon: Radio, gradient: "from-orange-600 to-red-600" },
    { name: "Trending", icon: TrendingUp, gradient: "from-green-600 to-emerald-600" },
];

const mockPlaylists = [
    { id: 1, title: "Today's Top Hits", cover: "https://picsum.photos/seed/browse1/300" },
    { id: 2, title: "Chill Vibes", cover: "https://picsum.photos/seed/browse2/300" },
    { id: 3, title: "Workout Mix", cover: "https://picsum.photos/seed/browse3/300" },
    { id: 4, title: "Study Focus", cover: "https://picsum.photos/seed/browse4/300" },
    { id: 5, title: "Party Hits", cover: "https://picsum.photos/seed/browse5/300" },
    { id: 6, title: "Acoustic", cover: "https://picsum.photos/seed/browse6/300" },
];

export default function BrowsePage() {
    return (
        <div className="pt-20 pb-24 px-4 md:px-6">
            <h1 className="text-3xl font-bold text-white mb-6">Browse</h1>

            {/* Categories */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <motion.div
                                key={category.name}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`bg-gradient-to-br ${category.gradient} rounded-xl p-6 cursor-pointer relative overflow-hidden`}
                            >
                                <Icon className="w-12 h-12 text-white mb-2" />
                                <h3 className="text-white font-bold text-lg">{category.name}</h3>
                                <div className="absolute -right-4 -bottom-4 opacity-20">
                                    <Icon className="w-32 h-32 text-white" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Featured Playlists */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Featured Playlists</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {mockPlaylists.map((playlist) => (
                        <motion.div
                            key={playlist.id}
                            whileHover={{ scale: 1.05 }}
                            className="bg-neutral-800/50 rounded-lg p-3 cursor-pointer hover:bg-neutral-800 transition"
                        >
                            <div className="aspect-square rounded-md overflow-hidden mb-3">
                                <img
                                    src={playlist.cover}
                                    alt={playlist.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h3 className="text-white font-medium text-sm truncate">{playlist.title}</h3>
                            <p className="text-neutral-400 text-xs mt-1">Playlist</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

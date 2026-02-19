"use client";

import { motion } from "framer-motion";
import { Music, Podcast, Radio, TrendingUp, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/store/usePlayerStore";

interface Category {
    name: string;
    id?: string;
    gradient: string;
}

interface Playlist {
    id: string;
    title: string;
    cover: string;
    artist: string;
    type: string;
}

const Shimmer = () => (
    <div className="animate-pulse bg-neutral-800/50 rounded-lg w-full h-full" />
);

export default function BrowsePage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { setTrack } = usePlayerStore();

    useEffect(() => {
        const fetchBrowseData = async () => {
            try {
                const res = await fetch("/api/browse");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setCategories(data.categories || []);
                setPlaylists(data.playlists || []);
            } catch (err) {
                console.error("Browse fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBrowseData();
    }, []);

    const handleCategoryClick = (name: string) => {
        router.push(`/search?q=${encodeURIComponent(name)}`);
    };

    const handlePlaylistClick = (playlist: Playlist) => {
        // Since we don't have a playlist page, search for the title
        router.push(`/search?q=${encodeURIComponent(playlist.title)}`);
    };

    return (
        <div className="pt-20 pb-24 px-4 md:px-6">
            <h1 className="text-3xl font-bold text-white mb-6">Browse</h1>

            {/* Categories */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-xl overflow-hidden">
                                <Shimmer />
                            </div>
                        ))
                    ) : (
                        categories.map((category) => (
                            <motion.div
                                key={category.name}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCategoryClick(category.name)}
                                className={`bg-gradient-to-br ${category.gradient} rounded-xl p-6 cursor-pointer relative overflow-hidden`}
                            >
                                <h3 className="text-white font-bold text-lg">{category.name}</h3>
                                <div className="absolute -right-4 -bottom-4 opacity-20">
                                    <Music className="w-32 h-32 text-white" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Featured Playlists */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Featured Playlists</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {loading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="bg-neutral-800/30 rounded-lg p-3 h-64">
                                <div className="aspect-square bg-neutral-800 rounded-md mb-3" />
                                <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-neutral-800 rounded w-1/2" />
                            </div>
                        ))
                    ) : (
                        playlists.map((playlist) => (
                            <motion.div
                                key={playlist.id}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => handlePlaylistClick(playlist)}
                                className="bg-neutral-800/30 rounded-lg p-3 cursor-pointer hover:bg-neutral-800/50 transition group"
                            >
                                <div className="relative aspect-square rounded-md overflow-hidden mb-3">
                                    <img
                                        src={playlist.cover}
                                        alt={playlist.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <div className="bg-purple-600 p-3 rounded-full">
                                            <Play className="w-6 h-6 text-white fill-white" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-white font-medium text-sm truncate">{playlist.title}</h3>
                                <p className="text-neutral-400 text-xs mt-1 truncate">{playlist.artist}</p>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

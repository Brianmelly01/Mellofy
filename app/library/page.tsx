"use client";

<<<<<<< HEAD
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
=======
import Header from "@/components/Header";
import { Plus, Library as LibraryIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function Library() {
    return (
        <div className="bg-[#080808] h-full w-full overflow-hidden overflow-y-auto no-scrollbar">
            <Header className="bg-transparent border-none">
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-y-1">
                        <h1 className="text-white text-3xl font-black tracking-tighter">Your Library</h1>
                        <p className="text-neutral-400 text-sm font-medium">All your favorite tracks in one place</p>
                    </div>
                </div>
            </Header>

            <div className="px-5 md:px-8 pb-32">
                <div className="flex items-center gap-x-3 mb-10 overflow-x-auto no-scrollbar py-2">
                    <button className="px-5 py-2 rounded-full bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition whitespace-nowrap">Playlists</button>
                    <button className="px-5 py-2 rounded-full bg-white/5 text-neutral-400 font-bold text-sm hover:bg-white/10 transition whitespace-nowrap border border-white/5">Artists</button>
                    <button className="px-5 py-2 rounded-full bg-white/5 text-neutral-400 font-bold text-sm hover:bg-white/10 transition whitespace-nowrap border border-white/5">Albums</button>
                    <button className="px-5 py-2 rounded-full bg-white/5 text-neutral-400 font-bold text-sm hover:bg-white/10 transition whitespace-nowrap border border-white/5">Podcasts</button>
                </div>

                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative w-64 h-64 mb-8"
                    >
                        <img
                            src="file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/library_empty_state_1771268176876.png"
                            alt="Empty Library"
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-purple-500/20 blur-[80px] -z-10" />
                    </motion.div>

                    <h2 className="text-2xl font-black text-white mb-2">Build your collection</h2>
                    <p className="text-neutral-400 max-w-xs mb-8 font-medium">
                        Start following some artists or create your first playlist to get started.
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-x-2 pulsar-bg px-8 py-4 rounded-full text-white font-black shadow-2xl shadow-purple-500/20"
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span>Create Playlist</span>
                    </motion.button>
>>>>>>> 208d31989d1d1ffc320c3a0b64ec05ff94fc4379
                </div>
            </div>
        </div>
    );
}

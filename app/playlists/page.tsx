"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, Play, ArrowLeft, Plus, Music, Trash2, X } from "lucide-react";
import { useLibraryStore } from "@/lib/store/useLibraryStore";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PlaylistsPage() {
    const { playlists, createPlaylist } = useLibraryStore();
    const { setTrack, setQueue, setPlaybackMode } = usePlayerStore();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");

    const handleCreate = () => {
        if (newPlaylistName.trim()) {
            createPlaylist(newPlaylistName);
            setNewPlaylistName("");
            setIsCreating(false);
        }
    };

    const handlePlayPlaylist = (playlist: any) => {
        if (playlist.tracks.length > 0) {
            setPlaybackMode('audio');
            setTrack(playlist.tracks[0]);
            setQueue(playlist.tracks);
        }
    };

    return (
        <div className="pt-20 pb-24 px-4 md:px-6 min-h-screen bg-gradient-to-b from-green-900/10 to-transparent">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-full transition text-neutral-400 hover:text-white"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-3xl font-black text-white">Your Playlists</h1>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-full hover:scale-105 transition shadow-xl"
                    >
                        <Plus size={20} />
                        Create New
                    </button>
                </div>

                {/* Playlist Grid */}
                {playlists.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="p-6 bg-white/5 rounded-full mb-6">
                            <ListMusic size={60} className="text-neutral-700" />
                        </div>
                        <h3 className="text-white text-2xl font-black mb-2">Create your first playlist</h3>
                        <p className="text-neutral-500 max-w-sm mb-8">It&apos;s easy, we&apos;ll help you. Just name it and start adding your favorite hits.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-10 py-4 bg-green-500 text-black font-black rounded-full hover:scale-105 transition shadow-lg shadow-green-500/20"
                        >
                            Get Started
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {playlists.map((playlist) => (
                            <motion.div
                                key={playlist.id}
                                whileHover={{ y: -8 }}
                                onClick={() => router.push(`/playlists/${playlist.id}`)}
                                className="bg-neutral-800/30 p-4 rounded-2xl cursor-pointer hover:bg-neutral-800/50 transition group border border-white/5"
                            >
                                <div className="aspect-square relative rounded-xl overflow-hidden mb-4 bg-neutral-700 flex items-center justify-center shadow-lg">
                                    {playlist.cover ? (
                                        <img src={playlist.cover} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Music size={40} className="text-neutral-500" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayPlaylist(playlist);
                                            }}
                                            className="bg-green-500 p-4 rounded-full shadow-2xl translate-y-4 group-hover:translate-y-0 transition duration-300 hover:scale-105 active:scale-95"
                                        >
                                            <Play size={24} className="text-black fill-black ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-white font-black truncate text-lg mb-1">{playlist.name}</h3>
                                <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">{playlist.tracks.length} Tracks</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Create Modal Overlay */}
                <AnimatePresence>
                    {isCreating && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="w-full max-w-md bg-[#181818] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black text-white">New Playlist</h2>
                                    <button onClick={() => setIsCreating(false)} className="text-neutral-500 hover:text-white transition">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Name your vibe</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Midnight Vibes..."
                                            value={newPlaylistName}
                                            onChange={(e) => setNewPlaylistName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                            className="w-full bg-neutral-800/50 border border-white/5 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-green-500 transition-colors text-lg"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!newPlaylistName.trim()}
                                        className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black rounded-full transition shadow-xl"
                                    >
                                        Create Playlist
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

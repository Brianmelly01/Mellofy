"use client";

import { motion } from "framer-motion";
import { ListMusic, Play, ArrowLeft, Music, Trash2, Clock, MoreVertical } from "lucide-react";
import { useLibraryStore } from "@/lib/store/useLibraryStore";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function PlaylistDetailPage() {
    const { id } = useParams();
    const { playlists, removeFromPlaylist, deletePlaylist } = useLibraryStore();
    const { setTrack, setQueue, setPlaybackMode } = usePlayerStore();
    const router = useRouter();

    const playlist = playlists.find(p => p.id === id);

    if (!playlist) {
        return (
            <div className="pt-20 pb-24 px-4 md:px-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <ListMusic size={60} className="text-neutral-700 mb-4" />
                <h2 className="text-white text-2xl font-black mb-2">Playlist not found</h2>
                <button onClick={() => router.push('/playlists')} className="text-green-500 font-bold hover:underline">
                    Back to Playlists
                </button>
            </div>
        );
    }

    const handlePlayAll = () => {
        if (playlist.tracks.length > 0) {
            setPlaybackMode('audio');
            setTrack(playlist.tracks[0]);
            setQueue(playlist.tracks);
        }
    };

    const handleDeletePlaylist = () => {
        if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
            deletePlaylist(playlist.id);
            router.push('/playlists');
        }
    };

    return (
        <div className="pt-20 pb-24 px-4 md:px-6 min-h-screen bg-gradient-to-b from-green-900/10 to-transparent">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-full transition text-neutral-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-end gap-6 flex-1">
                        <div className="h-52 w-52 bg-neutral-800 rounded-xl shadow-2xl flex items-center justify-center relative overflow-hidden group">
                            {playlist.cover ? (
                                <img src={playlist.cover} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <ListMusic size={80} className="text-neutral-500" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-white text-sm font-black uppercase tracking-widest mb-2">Playlist</p>
                            <h1 className="text-white text-6xl font-black mb-6 tracking-tighter truncate">{playlist.name}</h1>
                            <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
                                <span className="text-white font-bold">Brian</span>
                                <span className="h-1 w-1 rounded-full bg-white/40" />
                                <span>{playlist.tracks.length} tracks</span>
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
                        disabled={playlist.tracks.length === 0}
                        className="h-14 w-14 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                    >
                        <Play size={24} className="text-black fill-black ml-1" />
                    </motion.button>

                    <button
                        onClick={handleDeletePlaylist}
                        className="text-neutral-500 hover:text-red-500 transition"
                        title="Delete Playlist"
                    >
                        <Trash2 size={24} />
                    </button>
                </div>

                {/* Tracks */}
                <div className="w-full">
                    {playlist.tracks.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                            <Music size={48} className="mb-4" />
                            <h3 className="text-white text-xl font-bold mb-2">Your playlist is empty</h3>
                            <Link href="/">
                                <button className="text-green-500 hover:underline">Add tracks from search</button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {playlist.tracks.map((track, index) => (
                                <motion.div
                                    key={`${track.id}-${index}`}
                                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                    className="grid grid-cols-[16px_1fr_1fr_auto] gap-4 px-4 py-3 rounded-lg group cursor-pointer items-center"
                                    onClick={() => {
                                        setPlaybackMode('audio');
                                        setTrack(track);
                                        setQueue(playlist.tracks);
                                    }}
                                >
                                    <span className="text-neutral-500 text-sm">{index + 1}</span>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src={track.thumbnail} alt="" className="h-10 w-10 rounded object-cover shadow-lg" />
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate text-sm">{track.title}</p>
                                            <p className="text-neutral-400 text-xs truncate">{track.artist}</p>
                                        </div>
                                    </div>
                                    <p className="text-neutral-400 text-sm truncate md:block hidden">
                                        {track.artist}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromPlaylist(playlist.id, track.id);
                                            }}
                                            className="text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Trash2 size={16} />
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

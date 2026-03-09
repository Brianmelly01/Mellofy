"use client";

import { useDownloadStore } from "@/lib/store/useDownloadStore";
import { usePlayerStore, Track } from "@/lib/store/usePlayerStore";
import { Music, Video, Trash2, HardDriveDownload } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function DownloadsPage() {
    const { downloadedTracks, removeTrack } = useDownloadStore();
    const { setTrack, setPlaybackMode, setQueue } = usePlayerStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const handlePlay = (track: Track, mode: 'audio' | 'video') => {
        setPlaybackMode(mode);
        // The queue is the current offline tracklist
        setQueue(downloadedTracks);
        setTrack(track);
    };

    return (
        <div className="pt-20 pb-24 px-4 md:px-6 min-h-screen">
            <div className="flex items-center gap-x-3 mb-6">
                <div className="p-3 bg-green-500/20 rounded-full">
                    <HardDriveDownload className="w-8 h-8 text-green-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Downloads</h1>
                    <p className="text-neutral-400 text-sm">{downloadedTracks.length} offline tracks stored</p>
                </div>
            </div>

            {downloadedTracks.length === 0 ? (
                <div className="bg-neutral-800/20 border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center text-center mt-10 shadow-2xl">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-6 bg-white/5 rounded-full mb-6 relative"
                    >
                        <HardDriveDownload className="w-16 h-16 text-neutral-500" />
                        <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500/50 animate-ping" />
                    </motion.div>
                    <h3 className="text-xl text-white font-bold mb-2">No downloads yet</h3>
                    <p className="text-neutral-400 text-sm max-w-xs">Download songs or videos to watch them offline without buffering.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-y-3 w-full">
                    {downloadedTracks.map((song, index) => (
                        <div
                            key={`${song.id}-${song.downloadedAt}`}
                            className="flex items-center gap-x-4 w-full group hover:bg-white/5 p-3 rounded-[20px] transition-all cursor-pointer border border-transparent hover:border-white/5 shadow-sm"
                            onClick={() => handlePlay(song, song.downloadType === 'both' ? 'video' : song.downloadType)}
                        >
                            <div className="relative h-14 w-14 min-w-[56px] overflow-hidden rounded-xl shadow-lg shrink-0">
                                <img
                                    src={song.thumbnail}
                                    alt="Thumbnail"
                                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                            </div>

                            <div className="flex flex-col truncate flex-1 min-w-0 pr-4">
                                <p className="text-white font-bold truncate text-base tracking-tight">{song.title}</p>
                                <div className="flex items-center gap-x-2 text-neutral-400 text-xs font-semibold tracking-wide uppercase mt-0.5">
                                    <span className="truncate">{song.artist}</span>
                                    {song.duration && (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-neutral-600" />
                                            <span>{song.duration}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-x-2">
                                {(song.downloadType === 'audio' || song.downloadType === 'both') && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePlay(song, 'audio'); }}
                                        className="p-3 bg-white/5 hover:bg-white/20 rounded-full text-white transition-all shadow-md"
                                        title="Play Audio Offline"
                                    >
                                        <Music size={18} strokeWidth={2.5} />
                                    </button>
                                )}
                                {(song.downloadType === 'video' || song.downloadType === 'both') && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePlay(song, 'video'); }}
                                        className="p-3 bg-purple-500/20 hover:bg-purple-500/40 rounded-full text-purple-300 transition-all shadow-md border border-purple-500/20"
                                        title="Play Video Offline"
                                    >
                                        <Video size={18} strokeWidth={2.5} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeTrack(song.id); }}
                                    className="p-3 bg-red-500/10 hover:bg-red-500/30 rounded-full text-red-400 transition-all shadow-md ml-1 border border-red-500/20 opacity-0 group-hover:opacity-100"
                                    title="Remove Download"
                                >
                                    <Trash2 size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

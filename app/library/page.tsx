"use client";

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
                </div>
            </div>
        </div>
    );
}

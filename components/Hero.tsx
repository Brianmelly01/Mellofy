"use client";

import { Play } from "lucide-react";
import { motion } from "framer-motion";

const Hero = () => {
    return (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[32px] overflow-hidden group cursor-pointer shadow-2xl border border-white/5">
            {/* Base Image Layer */}
            <div className="absolute inset-0 bg-[#121212]">
                <img
                    src="file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/hero_discover_weekly_1771266003303.png"
                    alt="Discover Weekly"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2000ms]"
                />
            </div>

            {/* Premium Gradients overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/90 via-[#080808]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative h-full w-full flex flex-col justify-center px-8 md:px-12 gap-y-1 md:gap-y-2">
                <div className="flex flex-col mb-4">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-1">
                        Discover Weekly
                    </h1>
                    <p className="text-base md:text-xl text-white/70 font-medium">
                        Fresh Tracks Just for You
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/20 w-fit px-8 py-3 rounded-full transition group shadow-xl"
                >
                    <div className="p-1.5 bg-white rounded-full">
                        <Play className="text-black fill-black" size={14} />
                    </div>
                    <span className="text-white font-bold text-base pr-1">Play</span>
                </motion.button>
            </div>

            {/* Decorative Pulse (Mockup detail) */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-600/20 to-transparent pointer-events-none" />
        </div>
    );
};

export default Hero;

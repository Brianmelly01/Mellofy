"use client";

import { Play } from "lucide-react";
import { motion } from "framer-motion";

const Hero = () => {
    return (
        <div className="relative w-full aspect-[16/8] md:aspect-[21/7] rounded-3xl overflow-hidden group cursor-pointer shadow-2xl">
            {/* Dynamic Gradient Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8e54e9] via-[#4776e6] to-[#080808] opacity-90" />

            {/* Mock Image Placeholder (User should replace with real generated asset) */}
            <div className="absolute inset-0 bg-[url('/api/placeholder/800/400')] bg-cover bg-center mix-blend-overlay opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />

            {/* Content */}
            <div className="relative h-full w-full flex flex-col justify-center px-8 md:px-12 gap-y-2 md:gap-y-4">
                <div className="flex flex-col">
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                        Discover Weekly
                    </h1>
                    <p className="text-sm md:text-lg text-white/80 font-medium">
                        Fresh Tracks Just for You
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-x-2 bg-white/10 backdrop-blur-md border border-white/20 w-fit px-6 py-2 md:py-3 rounded-full hover:bg-white/20 transition group"
                >
                    <div className="p-2 bg-white rounded-full">
                        <Play className="text-black fill-black ml-1" size={16} />
                    </div>
                    <span className="text-white font-bold text-sm md:text-base pr-2">Play</span>
                </motion.button>
            </div>

            {/* Decorative Accents */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-purple/30 rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-pink/20 rounded-full blur-[100px]" />
        </div>
    );
};

export default Hero;

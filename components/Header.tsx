"use client";

import { useRouter } from "next/navigation";
import { Settings, Zap, Bell, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { motion } from "framer-motion";

interface HeaderProps {
    children?: React.ReactNode;
    className?: string;
}

const Header: React.FC<HeaderProps> = ({ children, className }) => {
    const router = useRouter();

    return (
        <div className={cn("sticky top-0 z-40 w-full h-20 bg-background/50 backdrop-blur-xl px-4 md:px-8", className)}>
            <div className="h-full flex items-center justify-between w-full">
                {/* Left: Settings */}
                <motion.button
                    whileTap={{ rotate: 90 }}
                    onClick={() => router.push("/settings")}
                    className="p-2 rounded-full hover:bg-white/5 transition"
                >
                    <Settings className="text-white" size={28} strokeWidth={2.5} />
                </motion.button>

                {/* Center: Logo */}
                <div
                    onClick={() => router.push("/")}
                    className="flex items-center gap-x-1 cursor-pointer"
                >
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.5 12C2.5 12 5 2 9 2C13 2 16 22 20 22C24 22 26.5 12 29.5 12" stroke="url(#pulsar_grad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2.5 12C2.5 12 5 8 9 8C13 8 16 16 20 16C24 16 26.5 12 29.5 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
                            <defs>
                                <linearGradient id="pulsar_grad" x1="2.5" y1="12" x2="29.5" y2="12" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#8e54e9" />
                                    <stop offset="1" stopColor="#ff4b2b" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="text-2xl font-black text-white tracking-tighter">Mellofy</span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-x-2">
                    <button className="p-2 rounded-full hover:bg-white/5 transition">
                        <Search className="text-white" size={28} strokeWidth={2.5} />
                    </button>
                    <div className="relative p-2 rounded-full hover:bg-white/5 transition cursor-pointer">
                        <Bell className="text-white" size={28} strokeWidth={2.5} />
                        <div className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-[#080808] flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">3</span>
                        </div>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
};

export default Header;

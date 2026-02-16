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
    const { onOpen, user, setUser } = useAuthStore();

    return (
        <div className={cn("sticky top-0 z-40 w-full h-20 bg-background/50 backdrop-blur-xl px-4 md:px-8", className)}>
            <div className="h-full flex items-center justify-between w-full">
                {/* Left: Settings */}
                <motion.button
                    whileTap={{ rotate: 90 }}
                    onClick={() => router.push("/settings")}
                    className="p-2 rounded-full hover:bg-white/5 transition"
                >
                    <Settings className="text-neutral-400 hover:text-white" size={24} />
                </motion.button>

                {/* Center: Logo */}
                <div
                    onClick={() => router.push("/")}
                    className="flex items-center gap-x-2 cursor-pointer"
                >
                    <div className="w-8 h-8 pulsar-bg rounded-lg flex items-center justify-center p-1.5">
                        <Zap className="text-white fill-white" />
                    </div>
                    <span className="text-2xl font-black text-white tracking-tighter">Mellofy</span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-x-1 md:gap-x-4">
                    <button className="p-2 rounded-full hover:bg-white/5 transition hidden sm:flex">
                        <Search className="text-neutral-400 hover:text-white" size={22} />
                    </button>
                    <div className="relative p-2 rounded-full hover:bg-white/5 transition cursor-pointer">
                        <Bell className="text-neutral-400 hover:text-white" size={22} />
                        <div className="absolute top-1 right-1 w-4 h-4 bg-accent-pink rounded-full border-2 border-background flex items-center justify-center">
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

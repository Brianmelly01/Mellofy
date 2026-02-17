"use client";

import { Settings, Search, Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const TopNav = () => {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-gradient-to-b from-black/95 to-black/50 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center justify-between h-full px-4 md:px-6">
                {/* Left - Settings */}
                <button className="p-2 hover:bg-white/10 rounded-lg transition">
                    <Settings className="w-6 h-6 text-white" />
                </button>

                {/* Center - Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/mellofy-logo.svg"
                        alt="Mellofy"
                        width={32}
                        height={32}
                        className="w-8 h-8"
                    />
                    <span className="text-white text-xl font-bold">Mellofy</span>
                </Link>

                {/* Right - Search & Notifications */}
                <div className="flex items-center gap-2">
                    <Link href="/search" className="p-2 hover:bg-white/10 rounded-lg transition">
                        <Search className="w-6 h-6 text-white" />
                    </Link>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition relative">
                        <Bell className="w-6 h-6 text-white" />
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            3
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

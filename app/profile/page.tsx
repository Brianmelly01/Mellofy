"use client";

import { motion } from "framer-motion";
import { User, Mail, Settings, LogOut, Music, Heart, ListMusic } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, onOpen, setUser } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        setUser(null);
        router.push("/");
    };

    const stats = [
        { label: "Songs Played", value: "1,234", icon: Music },
        { label: "Liked Songs", value: "127", icon: Heart },
        { label: "Playlists", value: "12", icon: ListMusic },
    ];

    return (
        <div className="pt-20 pb-24 px-4 md:px-6">
            {user ? (
                <>
                    {/* Profile Header */}
                    <div className="mb-8">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4">
                                <User className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-1">
                                {user.name || "Brian"}
                            </h1>
                            <p className="text-neutral-400">{user.email || "brian@example.com"}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-8">
                        <div className="grid grid-cols-3 gap-4">
                            {stats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="bg-neutral-800/50 rounded-xl p-4 text-center">
                                        <Icon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                                        <p className="text-xs text-neutral-400">{stat.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push("/settings")}
                            className="w-full flex items-center gap-4 p-4 bg-neutral-800/50 rounded-xl hover:bg-neutral-800 transition"
                        >
                            <Settings className="w-5 h-5 text-neutral-400" />
                            <span className="text-white font-medium">Settings</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 p-4 bg-neutral-800/50 rounded-xl hover:bg-red-900/30 transition"
                        >
                            <LogOut className="w-5 h-5 text-red-500" />
                            <span className="text-red-500 font-medium">Log Out</span>
                        </motion.button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                        <User className="w-12 h-12 text-neutral-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Log in to view your profile</h2>
                    <p className="text-neutral-400 mb-6 text-center">
                        Create an account or log in to access your profile, playlists, and more
                    </p>
                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onOpen("signup")}
                            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition"
                        >
                            Sign Up
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onOpen("login")}
                            className="px-8 py-3 bg-neutral-800 text-white font-bold rounded-full hover:bg-neutral-700 transition"
                        >
                            Log In
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
}

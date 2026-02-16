"use client";

import Header from "@/components/Header";
import { Settings, LogOut, Shield, Bell, HelpCircle, User, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function Account() {
    return (
        <div className="bg-[#080808] h-full w-full overflow-hidden overflow-y-auto no-scrollbar">
            <Header className="bg-transparent border-none">
                <div className="flex flex-col gap-y-1">
                    <h1 className="text-white text-3xl font-black tracking-tighter">Profile</h1>
                    <p className="text-neutral-400 text-sm font-medium">Manage your personal experience</p>
                </div>
            </Header>

            <div className="px-5 md:px-8 pb-32">
                {/* User Info Card */}
                <div className="relative group p-6 rounded-[32px] bg-white/5 border border-white/10 mb-10 overflow-hidden shadow-2xl">
                    <div className="relative z-10 flex items-center gap-x-6">
                        <div className="relative h-24 w-24">
                            <img
                                src="file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/profile_avatar_placeholder_1771268192771.png"
                                alt="Avatar"
                                className="h-full w-full object-cover rounded-3xl"
                            />
                            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-4 border-[#121212]">
                                <div className="w-2 h-2" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-x-2">
                                <h2 className="text-2xl font-black text-white">Brian Melly</h2>
                                <div className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30">
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Premium</span>
                                </div>
                            </div>
                            <p className="text-neutral-400 font-medium">brian.melly@mellofy.io</p>
                            <div className="mt-2 flex items-center gap-x-4">
                                <span className="text-xs font-bold text-white"><span className="text-purple-400">124</span> Following</span>
                                <span className="text-xs font-bold text-white"><span className="text-pink-400">842</span> Listeners</span>
                            </div>
                        </div>
                    </div>

                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] -z-10 group-hover:bg-purple-500/20 transition-colors" />
                </div>

                <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 ml-2">Preferences</h3>

                <div className="space-y-3">
                    {[
                        { icon: Crown, label: "Your Subscription", color: "text-amber-400" },
                        { icon: Bell, label: "Notification Settings", color: "text-white" },
                        { icon: Shield, label: "Privacy & Security", color: "text-white" },
                        { icon: HelpCircle, label: "Help Center", color: "text-white" },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.label}
                            whileHover={{ scale: 1.01, x: 4 }}
                            className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-x-4">
                                <div className="p-2 rounded-lg bg-black/20">
                                    <item.icon size={20} className={item.color} />
                                </div>
                                <span className="text-sm font-bold text-white">{item.label}</span>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-white/10" />
                        </motion.div>
                    ))}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-10 w-full p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-x-2 text-red-500 font-black transition-colors hover:bg-red-500/20"
                >
                    <LogOut size={20} />
                    <span>Log Out</span>
                </motion.button>
            </div>
        </div>
    );
}

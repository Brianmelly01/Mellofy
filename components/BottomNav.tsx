"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const routes = [
    {
        label: "Home",
        icon: Home,
        href: "/",
    },
    {
        label: "Browse",
        icon: Compass,
        href: "/search",
    },
    {
        label: "Library",
        icon: Library,
        href: "/library",
    },
    {
        label: "Profile",
        icon: User,
        href: "/account",
    },
];

export const BottomNav = () => {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass-heavy h-24 md:hidden flex items-center justify-around px-4 pb-4 select-none">
            {routes.map((route) => {
                const active = pathname === route.href;
                return (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "relative flex flex-col items-center justify-center gap-y-1.5 transition-all duration-300 w-20 py-2 rounded-2xl",
                            active ? "text-white" : "text-neutral-500 hover:text-neutral-400"
                        )}
                    >
                        <div className={cn(
                            "p-1 transition-transform duration-300",
                            active && "scale-110"
                        )}>
                            <route.icon
                                size={28}
                                strokeWidth={active ? 2.5 : 2}
                                className={cn(
                                    "transition-colors",
                                    active && "text-white"
                                )}
                            />
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold tracking-wide uppercase transition-all",
                            active ? "opacity-100 translate-y-0" : "opacity-60 translate-y-0.5"
                        )}>
                            {route.label}
                        </span>
                        {active && (
                            <motion.div
                                layoutId="nav-dot"
                                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                            />
                        )}
                    </Link>
                );
            })}
        </div>
    );
};

"use client";

import { Home, Compass, Library, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Browse", href: "/browse" },
    { icon: Library, label: "Library", href: "/library" },
    { icon: User, label: "Profile", href: "/profile" },
];

export const BottomNav = () => {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-gradient-to-t from-black via-black/98 to-black/50 backdrop-blur-xl border-t border-white/10">
            <div className="flex items-center justify-around h-full px-4 max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all",
                                isActive
                                    ? "text-white"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-6 h-6 transition-all",
                                    isActive && "scale-110"
                                )}
                            />
                            <span className={cn(
                                "text-xs font-medium",
                                isActive && "font-bold"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

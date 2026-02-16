"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div className="fixed bottom-0 left-0 right-0 z-50 glass h-20 md:hidden bg-background/80 flex items-center justify-around px-2 pb-2">
            {routes.map((route) => {
                const active = pathname === route.href;
                return (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-y-1 transition-all duration-300 w-16 px-2",
                            active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        <route.icon
                            size={24}
                            className={cn(
                                "transition-transform",
                                active && "scale-110 pulsar-text"
                            )}
                        />
                        <span className="text-[10px] font-medium">{route.label}</span>
                        {active && (
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full pulsar-bg" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
};

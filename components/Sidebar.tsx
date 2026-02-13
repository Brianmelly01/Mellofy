"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, PlusSquare, Heart, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
    {
        label: "Home",
        icon: Home,
        href: "/",
        active: true,
    },
    {
        label: "Search",
        icon: Search,
        href: "/search",
    },
];

export const Sidebar = () => {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-[300px] flex-col gap-y-2 bg-black p-2">
            <div className="flex flex-col gap-y-4 rounded-lg bg-neutral-900 px-5 py-4">
                {routes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex w-full cursor-pointer items-center gap-x-4 text-md font-medium text-neutral-400 transition hover:text-white py-1",
                            pathname === route.href && "text-white"
                        )}
                    >
                        <route.icon size={26} />
                        <p className="truncate w-100">{route.label}</p>
                    </Link>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto rounded-lg bg-neutral-900">
                <div className="flex flex-col gap-y-4 px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-x-2">
                            <Library className="text-neutral-400" size={26} />
                            <p className="text-neutral-400 font-medium text-md">Your Library</p>
                        </div>
                        <PlusSquare
                            className="text-neutral-400 cursor-pointer hover:text-white transition"
                            size={20}
                        />
                    </div>
                    <div className="flex flex-col gap-y-2 mt-4">
                        <Link
                            href="/liked"
                            className="flex items-center gap-x-3 text-neutral-400 hover:text-white transition group"
                        >
                            <div className="flex items-center justify-center p-2 rounded-md bg-gradient-to-br from-indigo-700 to-blue-300">
                                <Heart className="text-white fill-white" size={16} />
                            </div>
                            <p className="truncate">Liked Songs</p>
                        </Link>
                        <Link
                            href="/videos"
                            className="flex items-center gap-x-3 text-neutral-400 hover:text-white transition group"
                        >
                            <div className="flex items-center justify-center p-2 rounded-md bg-neutral-800 group-hover:bg-neutral-700">
                                <Video className="text-neutral-400 group-hover:text-white" size={16} />
                            </div>
                            <p className="truncate">Your Videos</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

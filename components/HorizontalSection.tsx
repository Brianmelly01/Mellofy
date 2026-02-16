"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HorizontalSectionProps {
    title: string;
    items: {
        id: string;
        title: string;
        artist: string;
        thumbnail: string;
        type?: 'playlist' | 'track';
    }[];
    onItemClick?: (id: string) => void;
    seeAllLink?: string;
    isSquare?: boolean;
}

const HorizontalSection: React.FC<HorizontalSectionProps> = ({
    title,
    items,
    onItemClick,
    seeAllLink = "#",
    isSquare = false
}) => {
    return (
        <div className="flex flex-col gap-y-4 w-full">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
                <Link
                    href={seeAllLink}
                    className="flex items-center gap-x-1 text-sm font-medium text-neutral-400 hover:text-white transition group"
                >
                    <span>See All</span>
                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            <div className="flex gap-x-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onItemClick?.(item.id)}
                        className="flex-shrink-0 w-36 md:w-48 group cursor-pointer"
                    >
                        <div className={cn(
                            "relative w-full overflow-hidden mb-3 shadow-lg group-hover:shadow-pulsar-pink/20 transition-all duration-300",
                            isSquare ? "aspect-square rounded-2xl md:rounded-3xl" : "aspect-[16/10] rounded-xl md:rounded-2xl"
                        )}>
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                            />

                            {item.type === 'playlist' && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            )}
                        </div>

                        <div className="flex flex-col gap-y-0.5 px-1">
                            <h3 className="text-sm md:text-base font-bold text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-pulsar-gradient transition-all">
                                {item.title}
                            </h3>
                            <p className="text-xs md:text-sm text-neutral-400 truncate">
                                {item.artist}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HorizontalSection;

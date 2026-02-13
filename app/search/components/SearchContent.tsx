"use client";

import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { Play } from "lucide-react";
import { Heart } from "lucide-react";

interface SearchContentProps {
    term?: string;
}

const SearchContent: React.FC<SearchContentProps> = ({ term }) => {
    const { setTrack } = usePlayerStore();

    const mockResults = term ? [
        {
            id: "1",
            title: `${term} Hit`,
            artist: "Popular Artist",
            thumbnail: "https://picsum.photos/seed/hit1/200",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        },
        {
            id: "2",
            title: `${term} Remix`,
            artist: "DJ Awesome",
            thumbnail: "https://picsum.photos/seed/remix2/200",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        },
        {
            id: "3",
            title: `Best of ${term}`,
            artist: "Various Artists",
            thumbnail: "https://picsum.photos/seed/best3/200",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        },
    ] : [];

    if (mockResults.length === 0) {
        return (
            <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
                No songs found.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-2 w-full px-6">
            {mockResults.map((song) => (
                <div
                    key={song.id}
                    className="flex items-center gap-x-4 w-full group hover:bg-neutral-800/50 p-2 rounded-md transition cursor-pointer"
                    onClick={() => setTrack(song)}
                >
                    <div className="flex-1 flex items-center gap-x-3">
                        <img
                            src={song.thumbnail}
                            alt="Thumbnail"
                            className="w-12 h-12 rounded-md object-cover"
                        />
                        <div className="flex flex-col truncate">
                            <p className="text-white font-medium truncate">{song.title}</p>
                            <p className="text-neutral-400 text-sm truncate">{song.artist}</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-x-4">
                        <Heart className="text-neutral-400 hover:text-white transition" size={20} />
                        <div className="opacity-0 group-hover:opacity-100 transition">
                            <Play className="text-white" fill="white" size={24} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SearchContent;

"use client";

import { usePlayerStore, Track } from "@/lib/store/usePlayerStore";
import { Play, Video, Music, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchContentProps {
    term?: string;
    results: Track[];
    error?: string;
}

const SearchContent: React.FC<SearchContentProps> = ({ term, results, error }) => {
    const { setTrack, setPlaybackMode, setQueue } = usePlayerStore();

    const handlePlay = (track: Track, mode: 'audio' | 'video') => {
        setPlaybackMode(mode);
        setTrack(track);
        setQueue(results);
    };

    if (error) {
        return (
            <div className="flex flex-col gap-y-2 w-full px-6 text-red-500">
                Error: {error}
            </div>
        );
    }

    if (results.length === 0 && term) {
        return (
            <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
                No results found for "{term}".
            </div>
        );
    }

    if (!term) {
        return (
            <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
                Search for your favorite songs or artists.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-2 w-full px-6 pb-20">
            {results.map((song) => (
                <div
                    key={song.id}
                    className="flex items-center gap-x-4 w-full group hover:bg-neutral-800/40 p-3 rounded-xl transition cursor-pointer border border-transparent hover:border-white/5"
                >
                    <div className="flex-1 flex items-center gap-x-4">
                        <div className="relative h-12 w-12 min-w-[48px] overflow-hidden rounded-md">
                            <img
                                src={song.thumbnail}
                                alt="Thumbnail"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col truncate">
                            <p className="text-white font-semibold truncate text-base">{song.title}</p>
                            <div className="flex items-center gap-x-2 text-neutral-400 text-sm">
                                <span className="truncate">{song.artist}</span>
                                {song.duration && (
                                    <>
                                        <span className="h-1 w-1 rounded-full bg-neutral-600" />
                                        <span>{song.duration}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition translate-x-2 group-hover:translate-x-0">
                        <button
                            onClick={() => handlePlay(song, 'audio')}
                            className="flex items-center gap-x-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-full text-xs font-bold text-white transition border border-white/10"
                            title="Play Audio"
                        >
                            <Music size={14} />
                            Audio
                        </button>
                        <button
                            onClick={() => handlePlay(song, 'video')}
                            className="flex items-center gap-x-2 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-full text-xs font-bold text-white transition shadow-lg shadow-emerald-600/20"
                            title="Play Video"
                        >
                            <Video size={14} />
                            Video
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SearchContent;

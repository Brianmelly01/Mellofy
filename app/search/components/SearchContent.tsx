"use client";

import { usePlayerStore, Track } from "@/lib/store/usePlayerStore";
import { Play, Video, Music, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface SearchContentProps {
    term?: string;
}

const SearchContent: React.FC<SearchContentProps> = ({ term }) => {
    const { setTrack, setPlaybackMode, setQueue } = usePlayerStore();
    const [results, setResults] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!term) {
            setResults([]);
            setError("");
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Search failed.");
                    setResults([]);
                } else {
                    setResults(data.results || []);
                }
            } catch (err: any) {
                setError(err.message || "Network error.");
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [term]);

    const handlePlay = (track: Track, mode: 'audio' | 'video') => {
        setPlaybackMode(mode);
        setTrack(track);
        setQueue(results);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full py-10 text-neutral-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                Searching...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-y-2 w-full px-6 text-red-500 bg-red-500/10 p-4 rounded-lg m-6 border border-red-500/20">
                <p className="font-semibold">Search Error</p>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        );
    }

    if (results.length === 0 && term) {
        return (
            <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
                No results found for &quot;{term}&quot;.
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
        <div className="flex flex-col gap-y-3 w-full pb-20">
            {results.map((song) => (
                <div
                    key={song.id}
                    className="flex items-center gap-x-4 w-full group hover:bg-white/5 p-2 rounded-[20px] transition-all cursor-pointer border border-transparent hover:border-white/5"
                >
                    <div className="flex-1 flex items-center gap-x-4 min-w-0">
                        <div className="relative h-14 w-14 min-w-[56px] overflow-hidden rounded-xl shadow-lg">
                            <img
                                src={song.thumbnail}
                                alt="Thumbnail"
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        </div>
                        <div className="flex flex-col truncate">
                            <p className="text-white font-black truncate text-base tracking-tight">{song.title}</p>
                            <div className="flex items-center gap-x-2 text-neutral-400 text-xs font-bold tracking-wide uppercase">
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

                    <div className="flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pr-2">
                        <button
                            onClick={() => handlePlay(song, 'audio')}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all border border-white/10"
                            title="Play Audio"
                        >
                            <Music size={18} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => handlePlay(song, 'video')}
                            className="p-3 pulsar-bg hover:scale-105 rounded-full text-white transition-all shadow-lg shadow-purple-500/20"
                            title="Play Video"
                        >
                            <Video size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SearchContent;

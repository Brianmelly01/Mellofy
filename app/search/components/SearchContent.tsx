"use client";

import { usePlayerStore, Track } from "@/lib/store/usePlayerStore";
import { Video, Music, Loader2, Download } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchContentProps {
    term?: string;
}

const SearchContent: React.FC<SearchContentProps> = ({ term }) => {
    const {
        setTrack,
        setPlaybackMode,
        setQueue,
        openHub,
        closeHub,
        setHubStatus,
        setHubProgress,
        hubProgress
    } = usePlayerStore();
    const [results, setResults] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!term) {
            setResults([]);
            setError("");
            return;
        }
        const search = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();
                setResults(data.results || []);
            } catch (e: any) {
                setError(e.message || "Search failed");
                setResults([]);
            } finally {
                setLoading(false);
            }
        };
        search();
    }, [term]);

    const handlePlay = (track: Track, mode: 'audio' | 'video') => {
        setPlaybackMode(mode);
        setTrack(track);
        setQueue(results);
    };

    const handleDownload = async (track: Track, type: 'audio' | 'video' | 'both') => {
        openHub(track);

        const triggerBrowserDownload = (url: string, filename: string) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const downloadOne = async (targetType: 'audio' | 'video') => {
            setHubProgress(Math.min(hubProgress + 15, 85));
            const ext = targetType === 'audio' ? 'm4a' : 'mp4';
            const filename = `${track.title.replace(/[^\w\s-]/g, '')}.${ext}`;

            try {
                const res = await fetch(`/api/download?id=${track.id}&type=${targetType}&get_url=true`, {
                    signal: AbortSignal.timeout(35000),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        setHubProgress(100);
                        triggerBrowserDownload(data.url, data.filename || filename);
                        return true;
                    }
                }
            } catch (e: any) {
                console.warn("Extraction failed:", e?.message);
            }
            return false;
        };

        try {
            let success = false;
            if (type === 'both') {
                const s1 = await downloadOne('audio');
                await new Promise(r => setTimeout(r, 1000));
                const s2 = await downloadOne('video');
                success = s1 || s2;
            } else {
                success = await downloadOne(type);
            }

            if (success) {
                setHubProgress(100);
                setHubStatus('ready');
            } else {
                setHubStatus('fallback');
            }
        } catch (err: any) {
            console.error("Download error:", err);
            setHubStatus('fallback');
        }
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
        <>
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
                            <div className="relative group/download">
                                <button
                                    className="p-3 bg-green-600/20 hover:bg-green-600/30 rounded-full text-green-400 transition-all border border-green-500/20"
                                    title="Download"
                                >
                                    <Download size={18} strokeWidth={2.5} />
                                </button>
                                <div className="absolute right-0 bottom-full mb-2 bg-neutral-900 border border-white/10 rounded-xl p-1 shadow-2xl min-w-[130px] opacity-0 invisible group-hover/download:opacity-100 group-hover/download:visible transition-all z-50">
                                    <button
                                        onClick={() => handleDownload(song, 'audio')}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-xs text-white whitespace-nowrap"
                                    >
                                        <Music size={14} />
                                        Audio
                                    </button>
                                    <button
                                        onClick={() => handleDownload(song, 'video')}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-xs text-white whitespace-nowrap"
                                    >
                                        <Video size={14} />
                                        Video
                                    </button>
                                    <button
                                        onClick={() => handleDownload(song, 'both')}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition text-xs text-green-400 font-bold whitespace-nowrap"
                                    >
                                        <Download size={14} />
                                        Both
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default SearchContent;

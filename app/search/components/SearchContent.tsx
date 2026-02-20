"use client";

import { usePlayerStore, Track } from "@/lib/store/usePlayerStore";
import { Play, Video, Music, Loader2, Download, X, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { clientSideProbe } from "@/lib/download-helper";

interface SearchContentProps {
    term?: string;
}

const SearchContent: React.FC<SearchContentProps> = ({ term }) => {
    const { setTrack, setPlaybackMode, setQueue } = usePlayerStore();
    const [results, setResults] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [fallbackModal, setFallbackModal] = useState<{ open: boolean; trackId: string; trackTitle: string }>({ open: false, trackId: "", trackTitle: "" });

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
        const downloadOne = async (targetType: 'audio' | 'video') => {
            setDownloadingId(track.id);
            setDownloadProgress(0);
            let debugLogs: string[] = [];

            try {
                // Phase 1: Client-Side Probe
                console.log(`Phase 1: Probing client-side for ${targetType}...`);
                setDownloadProgress(10);

                const probeResult = await clientSideProbe(track.id, targetType);
                const directUrl = probeResult.url;
                debugLogs = probeResult.logs;

                // Phase 2: Direct Native Download
                if (directUrl) {
                    console.log("Phase 2: Triggering native browser download...", directUrl);
                    setDownloadProgress(100);

                    const link = document.createElement('a');
                    link.href = directUrl;
                    link.download = `${track.title}.${targetType === 'audio' ? 'mp3' : 'mp4'}`;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setDownloadingId(null);
                    setDownloadProgress(0);
                    return;
                }

                // Phase 3: Server Extraction Fallback
                console.log("Phase 3: Client probe failed, engaging Server Extraction...", debugLogs);
                setDownloadProgress(20);

                const apiUrl = `/api/download?id=${track.id}&type=${targetType}&pipe=true&force=true`;
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    let serverError = `Server extraction failed (${response.status})`;
                    try {
                        const errBody = await response.json();
                        if (errBody.error) serverError = errBody.error;
                    } catch { /* ignore parse errors */ }
                    throw new Error(serverError);
                }

                const reader = response.body?.getReader();
                if (!reader) throw new Error("Stream not available");

                const contentLength = response.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength, 10) : 0;
                let loaded = 0;
                const chunks: BlobPart[] = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                        chunks.push(value);
                        loaded += value.length;
                        if (total > 0) {
                            setDownloadProgress(20 + Math.floor((loaded / total) * 80));
                        } else {
                            setDownloadProgress(Math.min(95, 20 + Math.floor(loaded / 500000)));
                        }
                    }
                }

                const blob = new Blob(chunks, { type: targetType === 'audio' ? 'audio/mp4' : 'video/mp4' });
                const url = URL.createObjectURL(blob);
                const aLink = document.createElement('a');
                aLink.href = url;
                aLink.download = `${track.title.replace(/[^\w\s-]/g, '')}.${targetType === 'audio' ? 'm4a' : 'mp4'}`;
                aLink.style.display = 'none';
                document.body.appendChild(aLink);
                aLink.click();
                document.body.removeChild(aLink);
                setTimeout(() => URL.revokeObjectURL(url), 60000);
                setDownloadProgress(100);

            } catch (err: any) {
                console.warn("Extraction details:", debugLogs);
                throw err;
            }
        };

        try {
            if (type === 'both') {
                await downloadOne('audio');
                await new Promise(r => setTimeout(r, 1000));
                await downloadOne('video');
            } else {
                await downloadOne(type);
            }
        } catch (err: any) {
            console.error("Download error:", err);
            // Show styled fallback modal instead of confirm()
            setFallbackModal({ open: true, trackId: track.id, trackTitle: track.title });
        } finally {
            setDownloadingId(null);
            setDownloadProgress(0);
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
                            {downloadingId === song.id ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-600/20 rounded-full border border-green-500/20">
                                    <Loader2 size={16} className="animate-spin text-green-400" />
                                    <span className="text-xs text-green-400 font-bold">{downloadProgress}%</span>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Fallback Download Modal */}
            {fallbackModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setFallbackModal({ open: false, trackId: "", trackTitle: "" })}
                            className="absolute top-3 right-3 p-2 hover:bg-white/10 rounded-full transition text-white/60 hover:text-white z-10"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Download size={20} className="text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Download Blocked</h3>
                                    <p className="text-[11px] text-white/40">Automated extraction failed</p>
                                </div>
                            </div>

                            <p className="text-xs text-white/50 mb-4 leading-relaxed">
                                This video is restricted and couldn&apos;t be extracted automatically. Use one of these trusted tools to download directly:
                            </p>

                            <div className="space-y-2">
                                <a
                                    href={`https://cobalt.tools/#https://www.youtube.com/watch?v=${fallbackModal.trackId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition group"
                                >
                                    <ExternalLink size={16} className="text-blue-400 group-hover:text-blue-300 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white">Cobalt.tools</p>
                                        <p className="text-[10px] text-white/30">Recommended — Pre-filled URL</p>
                                    </div>
                                </a>

                                <a
                                    href={`https://cobalt.canine.tools/#https://www.youtube.com/watch?v=${fallbackModal.trackId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition group"
                                >
                                    <ExternalLink size={16} className="text-purple-400 group-hover:text-purple-300 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white">Cobalt Mirror</p>
                                        <p className="text-[10px] text-white/30">Alternative Cobalt instance</p>
                                    </div>
                                </a>

                                <a
                                    href={`https://piped.video/watch?v=${fallbackModal.trackId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition group"
                                >
                                    <ExternalLink size={16} className="text-green-400 group-hover:text-green-300 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white">Piped.video</p>
                                        <p className="text-[10px] text-white/30">Privacy-focused YouTube frontend</p>
                                    </div>
                                </a>

                                <a
                                    href={`https://yewtu.be/watch?v=${fallbackModal.trackId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition group"
                                >
                                    <ExternalLink size={16} className="text-amber-400 group-hover:text-amber-300 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white">Invidious (yewtu.be)</p>
                                        <p className="text-[10px] text-white/30">Last resort fallback</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-white/5 border-t border-white/5">
                            <p className="text-[10px] text-white/20 text-center">Opens in a new tab • No ads</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SearchContent;

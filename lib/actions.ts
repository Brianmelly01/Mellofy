"use server";

export async function searchYouTube(query: string) {
    if (!query || typeof query !== 'string') return [];

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    try {
        // yt-search and cheerio are configured as serverExternalPackages in next.config.ts
        // so they are available via require() in the serverless runtime.
        const ytSearch = require("yt-search");
        const searchFunc = typeof ytSearch === 'function' ? ytSearch : ytSearch.default || ytSearch;

        if (typeof searchFunc !== 'function') {
            throw new Error("yt-search library not loaded correctly.");
        }

        const r = await searchFunc(trimmedQuery);

        if (!r || !r.videos) {
            return [];
        }

        // Return up to 20 videos for broad, global results
        const videos = (r.videos || []).slice(0, 20).map((video: any) => ({
            id: video.videoId,
            title: video.title || "Untitled",
            artist: video.author?.name || "Unknown Artist",
            thumbnail: video.thumbnail || "",
            url: video.url || "",
            duration: video.timestamp || "",
            type: 'video' as const,
        }));

        const playlists = (r.playlists || []).slice(0, 5).map((list: any) => ({
            id: list.listId,
            title: list.title || "Untitled Playlist",
            artist: list.author?.name || "Unknown Artist",
            thumbnail: list.thumbnail || "",
            url: list.url || "",
            type: 'playlist' as const,
        }));

        return [...videos, ...playlists];
    } catch (error: any) {
        console.error("YouTube search error:", error);
        throw new Error(`Search failed: ${error.message || "Unknown error"}`);
    }
}

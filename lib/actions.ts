"use server";

export async function searchYouTube(query: string) {
    if (!query || typeof query !== 'string') return [];

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    try {
        console.log(`[SERVER] Requiring yt-search for query: "${trimmedQuery}"`);
        const ytSearch = require("yt-search");

        if (!ytSearch) {
            throw new Error("Module 'yt-search' returned null/undefined.");
        }

        const searchFunc = typeof ytSearch === 'function' ? ytSearch : ytSearch.default || ytSearch;

        if (typeof searchFunc !== 'function') {
            const keys = Object.keys(ytSearch);
            throw new Error(`yt-search library not loaded correctly. Export type: ${typeof searchFunc}. Keys: ${keys.join(", ")}`);
        }

        const r = await searchFunc(trimmedQuery);

        if (!r) {
            throw new Error("yt-search returned a null/undefined response.");
        }

        if (!r.videos) {
            throw new Error(`Response missing 'videos' property. Keys: ${Object.keys(r).join(", ")}`);
        }

        const videos = (r.videos || []).slice(0, 15).map((video: any) => ({
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

        console.log(`[SERVER] Found ${videos.length} videos and ${playlists.length} playlists`);
        return [...videos, ...playlists];
    } catch (error: any) {
        console.error("YouTube search error:", error);
        throw new Error(`Search failed: ${error.message || "Unknown error"}`);
    }
}

"use server";

export async function searchYouTube(query: string) {
    if (!query || typeof query !== 'string') return [];

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    try {
        // Use dynamic require inside the server action to isolate dependencies
        // and avoid issues with module-level imports in some environments.
        const ytSearch = require("yt-search");
        const searchFunc = typeof ytSearch === 'function' ? ytSearch : ytSearch.default || ytSearch;

        if (typeof searchFunc !== 'function') {
            console.error("yt-search library not loaded correctly");
            return [];
        }

        const r = await searchFunc(trimmedQuery);

        if (!r) {
            return [];
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

        return [...videos, ...playlists];
    } catch (error: any) {
        console.error("YouTube search error:", error);
        // Returning an empty array instead of throwing keeps the page alive (avoids 500)
        return [];
    }
}

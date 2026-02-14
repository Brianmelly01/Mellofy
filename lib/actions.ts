"use server";

// @ts-ignore
import ytSearch from "yt-search";

// Workaround for potential CJS/ESM interop issues
const search = typeof ytSearch === 'function' ? ytSearch : (ytSearch as any).default || ytSearch;

export async function searchYouTube(query: string) {
    console.log("[DEBUG] searchYouTube called with query:", query);
    if (!query) return [];

    try {
        console.log("[DEBUG] Calling ytSearch...");
        const r = await search(query);
        console.log("[DEBUG] ytSearch success, found", r?.videos?.length, "videos");

        if (!r || !r.videos) {
            console.error("[DEBUG] ytSearch returned invalid results:", r);
            return [];
        }

        const videos = r.videos.slice(0, 15).map((video: any) => ({
            id: video.videoId,
            title: video.title,
            artist: video.author?.name || "Unknown Artist",
            thumbnail: video.thumbnail,
            url: video.url,
            duration: video.timestamp,
            type: 'video' as const,
        }));

        const playlists = (r.playlists || []).slice(0, 5).map((list: any) => ({
            id: list.listId,
            title: list.title,
            artist: list.author?.name || "Unknown Artist",
            thumbnail: list.thumbnail,
            url: list.url,
            type: 'playlist' as const,
        }));

        console.log("[DEBUG] Returning", videos.length + playlists.length, "results");
        return [...videos, ...playlists];
    } catch (error: any) {
        console.error("[DEBUG] YouTube search error:", error.message || error);
        // Return empty array instead of throwing to avoid 500 if search fails
        return [];
    }
}

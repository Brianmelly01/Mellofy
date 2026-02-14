
"use server";

import * as cheerio from "cheerio";
// @ts-ignore
import ytSearch from "yt-search";

// Workaround for potential CJS/ESM interop issues
const search = typeof ytSearch === 'function' ? ytSearch : (ytSearch as any).default || ytSearch;

export async function searchYouTube(query: string) {
    if (!query || typeof query !== 'string') return [];

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    console.log("[DEBUG] searchYouTube searching for:", trimmedQuery);

    try {
        console.log("[DEBUG] Calling ytSearch...");
        const r = await search(trimmedQuery);

        if (!r) {
            console.error("[DEBUG] ytSearch returned nothing");
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

        console.log(`[DEBUG] Found ${videos.length} videos and ${playlists.length} playlists`);
        return [...videos, ...playlists];
    } catch (error: any) {
        console.error("[DEBUG] YouTube search error:", error);
        throw new Error(`YouTube Search failed: ${error.message || "Unknown error"}`);
    }
}

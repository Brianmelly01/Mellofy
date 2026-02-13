"use server";

// @ts-ignore
import ytSearch from "yt-search";

export async function searchYouTube(query: string) {
    if (!query) return [];

    try {
        const r = await ytSearch(query);
        const videos = r.videos.slice(0, 15).map((video: any) => ({
            id: video.videoId,
            title: video.title,
            artist: video.author.name,
            thumbnail: video.thumbnail,
            url: video.url,
            duration: video.timestamp,
            type: 'video' as const,
        }));

        const playlists = r.playlists.slice(0, 5).map((list: any) => ({
            id: list.listId,
            title: list.title,
            artist: list.author.name,
            thumbnail: list.thumbnail,
            url: list.url,
            type: 'playlist' as const,
        }));

        return [...videos, ...playlists];
    } catch (error) {
        console.error("YouTube search error:", error);
        return [];
    }
}

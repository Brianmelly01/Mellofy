import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || typeof query !== "string" || !query.trim()) {
        return NextResponse.json({ results: [] });
    }

    const trimmedQuery = query.trim();

    try {
        const ytSearch = require("yt-search");
        const searchFunc =
            typeof ytSearch === "function"
                ? ytSearch
                : ytSearch.default || ytSearch;

        if (typeof searchFunc !== "function") {
            return NextResponse.json(
                { error: "Search library failed to load." },
                { status: 500 }
            );
        }

        const r = await searchFunc(trimmedQuery);

        if (!r || !r.videos) {
            return NextResponse.json({ results: [] });
        }

        const videos = (r.videos || []).slice(0, 20).map((video: any) => ({
            id: video.videoId,
            title: video.title || "Untitled",
            artist: video.author?.name || "Unknown Artist",
            thumbnail: video.thumbnail || "",
            url: video.url || "",
            duration: video.timestamp || "",
            type: "video" as const,
        }));

        const playlists = (r.playlists || []).slice(0, 5).map((list: any) => ({
            id: list.listId,
            title: list.title || "Untitled Playlist",
            artist: list.author?.name || "Unknown Artist",
            thumbnail: list.thumbnail || "",
            url: list.url || "",
            type: "playlist" as const,
        }));

        return NextResponse.json({ results: [...videos, ...playlists] });
    } catch (error: any) {
        console.error("YouTube search API error:", error);
        return NextResponse.json(
            { error: error.message || "Search failed" },
            { status: 500 }
        );
    }
}

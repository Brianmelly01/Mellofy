import { NextRequest, NextResponse } from "next/server";
import YouTube from "youtube-sr";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || typeof query !== "string" || !query.trim()) {
        return NextResponse.json({ results: [] });
    }

    const trimmedQuery = query.trim();

    try {
        // Search for videos globally using youtube-sr (no cheerio dependency!)
        const videos = await YouTube.search(trimmedQuery, {
            type: "video",
            limit: 20,
        });

        const results = videos.map((video) => ({
            id: video.id || "",
            title: video.title || "Untitled",
            artist: video.channel?.name || "Unknown Artist",
            thumbnail: video.thumbnail?.url || "",
            url: video.url || "",
            duration: video.durationFormatted || "",
            type: "video" as const,
        }));

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error("YouTube search API error:", error);
        return NextResponse.json(
            { error: error.message || "Search failed" },
            { status: 500 }
        );
    }
}

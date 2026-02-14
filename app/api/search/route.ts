import { NextRequest, NextResponse } from "next/server";
import YouTube from "youtube-sr";

const SEARCH_PROXIES = [
    "https://invidious.ducks.party",
    "https://inv.vern.cc",
    "https://invidious.flokinet.to",
    "https://iv.melmac.space",
];

async function tryInvidiousSearch(query: string) {
    for (const instance of SEARCH_PROXIES) {
        try {
            const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) continue;

            const data = await res.json();
            if (!Array.isArray(data)) continue;

            return data.map((video: any) => ({
                id: video.videoId || "",
                title: video.title || "Untitled",
                artist: video.author || "Unknown Artist",
                thumbnail: video.videoThumbnails?.find((t: any) => t.quality === "medium")?.url || video.videoThumbnails?.[0]?.url || "",
                url: `https://www.youtube.com/watch?v=${video.videoId}`,
                duration: video.lengthSeconds ? `${Math.floor(video.lengthSeconds / 60)}:${String(video.lengthSeconds % 60).padStart(2, "0")}` : "",
                type: "video" as const,
            }));
        } catch (err) {
            console.warn(`Search fallback failed for ${instance}:`, err);
        }
    }
    return null;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || typeof query !== "string" || !query.trim()) {
        return NextResponse.json({ results: [] });
    }

    const trimmedQuery = query.trim();

    try {
        // Strategy 1: youtube-sr
        try {
            const videos = await YouTube.search(trimmedQuery, {
                type: "video",
                limit: 20,
            });

            if (videos && videos.length > 0) {
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
            }
        } catch (e) {
            console.warn("youtube-sr search failed, trying fallback...", e);
        }

        // Strategy 2: Invidious Search Fallback
        const fallbackResults = await tryInvidiousSearch(trimmedQuery);
        if (fallbackResults) {
            return NextResponse.json({ results: fallbackResults });
        }

        throw new Error("All search strategies failed");
    } catch (error: any) {
        console.error("YouTube search API error:", error);
        return NextResponse.json(
            { error: error.message || "Search failed" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import Innertube, { UniversalCache } from "youtubei.js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
        });

        // Fetch home feed and explore data in parallel
        const [home, explore] = await Promise.all([
            yt.music.getHomeFeed(),
            yt.music.getExplore(),
        ]);

        const categories: any[] = [];
        const playlists: any[] = [];
        const newReleases: any[] = [];
        const trending: any[] = [];

        // Process Home Feed for Featured Playlists
        if (home.sections) {
            home.sections.forEach((section: any) => {
                const title = section.header?.title?.toString().toLowerCase() || "";

                if (section.contents && Array.isArray(section.contents)) {
                    section.contents.forEach((item: any) => {
                        const playlistItem = {
                            id: item.id || "",
                            title: item.title?.toString() || "Untitled",
                            cover: item.thumbnails?.[0]?.url || "",
                            artist: item.author?.name || "Various Artists",
                            type: item.item_type || "Playlist"
                        };

                        if (playlistItem.id) {
                            if (item.type === "MusicResponsiveListItem" || item.type === "MusicTwoRowItem") {
                                if (playlists.length < 12) playlists.push(playlistItem);
                            }
                        }
                    });
                }
            });
        }

        // Process Explore Sections
        explore.sections.forEach((section: any) => {
            const title = section.header?.title?.toString().toLowerCase() || "";

            if (section.contents && Array.isArray(section.contents)) {
                // Moods & Genres
                if (title.includes("moods")) {
                    section.contents.forEach((item: any) => {
                        categories.push({
                            name: item.title?.toString() || "Unknown",
                            id: item.id || "",
                            gradient: getGradient(item.title?.toString() || "")
                        });
                    });
                }

                // New Releases
                else if (title.includes("new") || title.includes("albums")) {
                    section.contents.slice(0, 12).forEach((item: any) => {
                        newReleases.push({
                            id: item.id || "",
                            title: item.title?.toString() || "Untitled",
                            cover: item.thumbnails?.[0]?.url || "",
                            artist: item.author?.name || "Various Artists",
                            type: item.item_type || "Album"
                        });
                    });
                }

                // Trending
                else if (title.includes("trending")) {
                    section.contents.slice(0, 12).forEach((item: any) => {
                        trending.push({
                            id: item.id || "",
                            title: item.title?.toString() || "Untitled",
                            cover: item.thumbnails?.[0]?.url || "",
                            artist: item.author?.name || "Various Artists",
                            type: item.item_type || "Track"
                        });
                    });
                }
            }
        });

        // If moodsSection is empty, try to get some defaults
        if (categories.length === 0) {
            categories.push(
                { name: "Music", gradient: "from-purple-600 to-pink-600" },
                { name: "Trending", gradient: "from-green-600 to-emerald-600" },
                { name: "Chill", gradient: "from-blue-600 to-cyan-600" },
                { name: "Party", gradient: "from-orange-600 to-red-600" }
            );
        }

        return NextResponse.json({
            categories: categories.slice(0, 12),
            playlists: playlists.slice(0, 12),
            newReleases: newReleases.slice(0, 12),
            trending: trending.slice(0, 12),
        });

    } catch (error: any) {
        console.error("Browse API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch browse data" },
            { status: 500 }
        );
    }
}

function getGradient(name: string) {
    const gradients = [
        "from-purple-600 to-pink-600",
        "from-blue-600 to-cyan-600",
        "from-orange-600 to-red-600",
        "from-green-600 to-emerald-600",
        "from-indigo-600 to-violet-600",
        "from-yellow-600 to-amber-600"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
}

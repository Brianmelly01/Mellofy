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

        // Process Home Feed for Featured Playlists
        if (home.sections) {
            home.sections.forEach((section: any) => {
                const title = section.header?.title?.toString() || "";
                // Look for sections that likely contain playlists or featured content
                if (section.contents && Array.isArray(section.contents)) {
                    section.contents.forEach((item: any) => {
                        if (item.type === "MusicResponsiveListItem" || item.type === "MusicTwoRowItem") {
                            const playlistItem = {
                                id: item.id || "",
                                title: item.title?.toString() || "Untitled",
                                cover: item.thumbnails?.[0]?.url || "",
                                artist: item.author?.name || "Various Artists",
                                type: item.item_type || "Playlist"
                            };
                            if (playlistItem.id && playlists.length < 12) {
                                playlists.push(playlistItem);
                            }
                        }
                    });
                }
            });
        }

        // Process Explore for Moods & Genres (Categories)
        const moodsSection = explore.sections.find(s => s.header?.title?.toString().toLowerCase().includes('moods'));
        if (moodsSection && moodsSection.contents) {
            moodsSection.contents.forEach((item: any) => {
                categories.push({
                    name: item.title?.toString() || "Unknown",
                    id: item.id || "",
                    // Generate a deterministic gradient based on name
                    gradient: getGradient(item.title?.toString() || "")
                });
            });
        }

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
            categories: categories.slice(0, 8),
            playlists: playlists.slice(0, 12),
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

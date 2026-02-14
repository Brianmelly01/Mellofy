import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("id");
    const type = searchParams.get("type") || "audio"; // audio or video

    if (!videoId) {
        return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    try {
        const ytdl = require("@distube/ytdl-core");
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(url);

        let format;
        if (type === "audio") {
            // Get best audio-only format
            const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
            format = audioFormats.find((f: any) => f.mimeType?.includes("mp4")) || audioFormats[0];
        } else {
            // Get best video+audio format
            const videoFormats = ytdl.filterFormats(info.formats, "videoandaudio");
            format = videoFormats[0];
        }

        if (!format || !format.url) {
            return NextResponse.json(
                { error: "No suitable format found" },
                { status: 404 }
            );
        }

        // Proxy the stream to avoid CORS issues
        const title = info.videoDetails?.title || "download";
        const ext = type === "audio" ? "m4a" : "mp4";
        const safeTitle = title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();

        const response = await fetch(format.url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!response.ok || !response.body) {
            return NextResponse.json(
                { error: "Failed to fetch stream" },
                { status: 502 }
            );
        }

        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${safeTitle}.${ext}"`);
        headers.set("Content-Type", type === "audio" ? "audio/mp4" : "video/mp4");
        if (format.contentLength) {
            headers.set("Content-Length", format.contentLength);
        }

        return new NextResponse(response.body as any, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: error.message || "Download failed" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for downloads

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

        // Create an agent with cookies to bypass bot detection
        const agent = ytdl.createAgent(undefined, {
            localAddress: undefined,
        });

        const info = await ytdl.getInfo(url, { agent });

        let format;
        if (type === "audio") {
            // Get best audio-only format (prefer mp4/m4a)
            const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
            format =
                audioFormats.find((f: any) => f.mimeType?.includes("mp4")) ||
                audioFormats[0];
        } else {
            // Get best video+audio format
            const videoFormats = ytdl.filterFormats(info.formats, "videoandaudio");
            format = videoFormats[0];
        }

        if (!format || !format.url) {
            return NextResponse.json(
                { error: "No downloadable format found. YouTube may be restricting access." },
                { status: 404 }
            );
        }

        // Proxy the stream to avoid CORS issues
        const title = info.videoDetails?.title || "download";
        const ext = type === "audio" ? "m4a" : "mp4";
        const safeTitle = title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();

        const response = await fetch(format.url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                Referer: "https://www.youtube.com/",
                Origin: "https://www.youtube.com",
            },
        });

        if (!response.ok || !response.body) {
            return NextResponse.json(
                { error: "Failed to fetch the stream from YouTube." },
                { status: 502 }
            );
        }

        const headers = new Headers();
        headers.set(
            "Content-Disposition",
            `attachment; filename="${safeTitle}.${ext}"`
        );
        headers.set(
            "Content-Type",
            type === "audio" ? "audio/mp4" : "video/mp4"
        );
        if (format.contentLength) {
            headers.set("Content-Length", format.contentLength);
        }

        return new NextResponse(response.body as any, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Download error:", error);

        // Provide a user-friendly error message
        const message = error.message || "Download failed";
        if (
            message.includes("Sign in") ||
            message.includes("bot") ||
            message.includes("confirm")
        ) {
            return NextResponse.json(
                {
                    error:
                        "YouTube is blocking downloads from this server. This is a known limitation. Try again later or use a different download tool.",
                },
                { status: 429 }
            );
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

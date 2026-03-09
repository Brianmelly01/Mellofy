import { Innertube, UniversalCache } from 'youtubei.js';

async function testTve() {
    console.log("Creating Innertube with TV_EMBEDDED...");
    try {
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
            client_type: "TV_EMBEDDED"
        });

        console.log("Getting info...");
        const info = await yt.getBasicInfo("dQw4w9WgXcQ", "TV_EMBEDDED");
        const allFormats = [
            ...(info.streaming_data?.adaptive_formats || []),
            ...(info.streaming_data?.formats || [])
        ];

        console.log("Total formats:", allFormats.length);
        const combined = allFormats.filter(f => f.has_video && f.has_audio);
        if (combined.length > 0) {
            combined.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            console.log("COMBINED URL:", !!combined[0].url);
        } else {
            console.log("No combined formats found. Trying video-only...");
            const videoOnly = allFormats.filter(f => f.has_video);
            if (videoOnly.length > 0) {
                console.log("VIDEO ONLY URL:", !!videoOnly[0].url);
            }
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
testTve();

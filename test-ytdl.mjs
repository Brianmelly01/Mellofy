// Test @distube/ytdl-core directly
import ytdl from "@distube/ytdl-core";

const VIDEO_ID = "dQw4w9WgXcQ";
const url = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

try {
    console.log("Testing @distube/ytdl-core...");
    const info = await ytdl.getInfo(url, {
        requestOptions: {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36",
            },
        },
    });
    console.log(`Title: ${info.videoDetails.title}`);
    console.log(`Formats: ${info.formats.length}`);

    const audios = info.formats.filter(f => f.hasAudio && !f.hasVideo);
    const combined = info.formats.filter(f => f.hasAudio && f.hasVideo);
    console.log(`Audio-only: ${audios.length}, Combined: ${combined.length}`);

    if (audios[0]) {
        const u = new URL(audios[0].url);
        console.log(`First audio URL host: ${u.host}`);
        console.log(`  Quality: ${audios[0].audioBitrate}kbps, mime: ${audios[0].mimeType}`);
    }
    if (combined[0]) {
        console.log(`First combined URL: ${combined[0].qualityLabel}, mime: ${combined[0].mimeType}`);
    }
} catch (e) {
    console.error("ERROR:", e.message?.slice(0, 200));
}

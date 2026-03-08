// Test @distube/ytdl-core for stream URL extraction
import ytdl from "@distube/ytdl-core";

const VIDEO_ID = "dQw4w9WgXcQ";

console.log("Testing @distube/ytdl-core...");

try {
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${VIDEO_ID}`);
    console.log(`Title: ${info.videoDetails.title}`);

    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
    const videoFormats = ytdl.filterFormats(info.formats, "videoandaudio");
    const allFormats = info.formats;

    console.log(`Audio-only formats: ${audioFormats.length}`);
    console.log(`Combined (video+audio) formats: ${videoFormats.length}`);
    console.log(`Total formats: ${allFormats.length}`);

    if (audioFormats.length > 0) {
        const best = audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
        console.log(`Best audio: ${best.mimeType} | bitrate: ${best.audioBitrate} | url: ${best.url?.slice(0, 80)}`);
    }

    if (videoFormats.length > 0) {
        const best = videoFormats.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
        console.log(`Best video+audio: ${best.mimeType} | height: ${best.height} | url: ${best.url?.slice(0, 80)}`);
    }

    console.log("SUCCESS!");
} catch (e) {
    console.error("FAILED:", e.message?.slice(0, 200));
}

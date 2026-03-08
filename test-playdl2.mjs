// Test play-dl for YouTube extraction
import play from 'play-dl';

const VIDEO_ID = 'dQw4w9WgXcQ';

async function test() {
    console.log("Testing play-dl...");
    try {
        const info = await play.video_info(`https://www.youtube.com/watch?v=${VIDEO_ID}`);
        console.log(`Title: ${info.video_details.title}`);

        const audio = info.format.find(f => f.mimeType?.includes('audio'));
        if (audio?.url) {
            console.log(`Audio URL: ${audio.url.slice(0, 150)}...`);
            // Test reachability
            const head = await fetch(audio.url, { method: 'HEAD', headers: { 'User-Agent': "Mozilla/5.0" } });
            console.log(`Audio reachability: HTTP ${head.status}`);
        } else {
            console.log("No audio URL found in formats.");
        }

        const video = info.format.find(f => f.mimeType?.includes('video'));
        if (video?.url) {
            console.log(`Video URL: ${video.url.slice(0, 150)}...`);
            // Test reachability
            const head = await fetch(video.url, { method: 'HEAD', headers: { 'User-Agent': "Mozilla/5.0" } });
            console.log(`Video reachability: HTTP ${head.status}`);
        } else {
            console.log("No video URL found in formats.");
        }

    } catch (e) {
        console.error("play-dl Error:", e.message);
    }
}

test();

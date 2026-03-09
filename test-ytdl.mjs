import ytdl from '@distube/ytdl-core';

async function testYtdl() {
    const videoId = "dQw4w9WgXcQ";
    console.log(`ytdl: Trying ${videoId}...`);
    try {
        const info = await ytdl.getInfo(videoId);
        const allFormats = info.formats;
        const combined = ytdl.filterFormats(allFormats, 'videoandaudio');
        if (combined.length > 0) {
            combined.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            console.log("Combined Format URL:", combined[0].url.slice(0, 50));
        } else {
            console.log("No combined formats found");
        }
    } catch (e) {
        console.error("ytdl error:", e.message);
    }
}
testYtdl();

import youtubedl from 'youtube-dl-exec';

async function testYtdlp() {
    const videoId = "dQw4w9WgXcQ";
    console.log(`yt-dlp: Trying ${videoId}...`);
    try {
        const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        });

        const allFormats = info.formats;
        console.log("Total formats:", allFormats.length);

        const combined = allFormats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4');
        if (combined.length > 0) {
            console.log("COMBINED URL:", !!combined[0].url);
        } else {
            console.log("No combined formats found.");
        }
    } catch (e) {
        console.error("ytdlp error:", e.message);
    }
}
testYtdlp();

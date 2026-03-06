import youtubedl from "youtube-dl-exec";

async function test() {
    try {
        console.log("Extracting URLs with yt-dlp...");
        const output = await youtubedl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
            ]
        });

        console.log("Title:", output.title);

        const audioFormats = output.formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
        console.log("Audio formats:", audioFormats.length);
        if (audioFormats.length > 0) {
            console.log("Audio URL:", audioFormats[0].url.slice(0, 100));
            // test url
            const res = await fetch(audioFormats[0].url, { method: "HEAD" });
            console.log("HTTP status (audio):", res.status);
        }

        const videoFormats = output.formats.filter(f => f.vcodec !== 'none');
        if (videoFormats.length > 0) {
            console.log("Video URL:", videoFormats[0].url.slice(0, 100));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}
test();

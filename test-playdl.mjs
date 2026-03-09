import play from 'play-dl';

async function testPlayDl() {
    const videoId = "dQw4w9WgXcQ";
    console.log(`play-dl: Trying ${videoId}...`);
    try {
        const info = await play.video_info(`https://www.youtube.com/watch?v=${videoId}`);
        const stream = await play.stream_from_info(info, {
            quality: 2 // 2 corresponds to highest video quality
        });

        console.log("Play-dl Stream URL:", stream.url?.slice(0, 100));
        console.log("Format Type:", stream.type);

    } catch (e) {
        console.error("play-dl error:", e);
    }
}
testPlayDl();

import play from "play-dl";
async function test() {
    try {
        console.log("Fetching play-dl info...");
        const video = await play.video_info("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        console.log("Got info. Finding best audio...");
        const audioStream = await play.stream_from_info(video, { quality: 2, discordPlayerCompatibility: false }); // 2 is highest audio
        console.log("Audio URL:", audioStream.url.slice(0, 100));

        const res = await fetch(audioStream.url, { method: "HEAD" });
        console.log("HTTP status:", res.status);
    } catch (e) {
        console.error("play-dl error:", e);
    }
}
test();

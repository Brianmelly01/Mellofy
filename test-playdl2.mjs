import play from "play-dl";

async function testPlayDL() {
    try {
        console.log("Fetching video info using play-dl...");
        // This attempts to get the streaming URL for the video
        const info = await play.video_info("dQw4w9WgXcQ");
        console.log("Title:", info.video_details.title);

        const streamInfo = await play.stream_from_info(info);
        console.log("Stream URL:", streamInfo.url?.slice(0, 80));
    } catch (e) {
        console.error("play-dl Error:", e.message);
    }
}

testPlayDL();

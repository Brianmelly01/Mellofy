import play from "play-dl";

async function testPlayDL() {
    try {
        console.log("Fetching video info using play-dl...");
        // This attempts to get the streaming URL for the video
        const stream = await play.stream("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        console.log("Stream URL:", stream.url?.slice(0, 80));
        console.log("Stream Type:", stream.type);
    } catch (e) {
        console.error("play-dl Error:", e.message);
    }
}

testPlayDL();

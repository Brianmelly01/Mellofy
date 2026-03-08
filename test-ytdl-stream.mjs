// Test @distube/ytdl-core for direct streaming
import ytdl from "@distube/ytdl-core";
import fs from "fs";

const VIDEO_ID = "dQw4w9WgXcQ";

console.log("Testing stream piping with @distube/ytdl-core...");

try {
    const stream = ytdl(`https://www.youtube.com/watch?v=${VIDEO_ID}`, {
        filter: "audioonly",
        quality: "highestaudio",
    });

    let bytes = 0;
    stream.on("data", chunk => {
        bytes += chunk.length;
        if (bytes > 100000) {
            console.log(`Successfully received >100KB: ${bytes} bytes. ytdl-core stream works!`);
            process.exit(0);
        }
    });

    stream.on("error", (err) => {
        console.error("Stream error:", err);
    });

} catch (e) {
    console.error("FAILED:", e.message?.slice(0, 200));
}

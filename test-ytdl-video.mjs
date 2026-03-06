import ytdl from "@distube/ytdl-core";
async function test() {
    try {
        console.log("ytdl-core fetching...");
        const info = await ytdl.getInfo("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        const format = ytdl.chooseFormat(info.formats, { filter: "audioonly" });
        console.log("Success! audio url:", format.url.slice(0, 50));

        const res = await fetch(format.url, { method: "HEAD" });
        console.log("HTTP status:", res.status);
    } catch (e) {
        console.error("ytdl-core error:", e.message);
    }
}
test();

import ytdl from "@distube/ytdl-core";

async function testYtdl() {
    try {
        console.log("Fetching with ytdl-core...");
        const info = await ytdl.getInfo("jNQXAC9IVRw");
        const format = ytdl.chooseFormat(info.formats, { filter: "audioandvideo" });
        console.log("Best combined format:", format.mimeType, format.qualityLabel);
        console.log("URL:", format.url ? "Yes" : "No");

        const audioFormat = ytdl.chooseFormat(info.formats, { filter: "audioonly" });
        console.log("Best audio format:", audioFormat.mimeType, audioFormat.audioBitrate);
        console.log("Audio URL:", audioFormat.url ? "Yes" : "No");

    } catch (e) {
        console.error("ytdl error:", e.message);
    }
}
testYtdl();

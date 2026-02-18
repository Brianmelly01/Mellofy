import { COBALT_NODES } from "./lib/download-helper";

const testCobalt = async () => {
    const videoId = "HX2cgqnbk1A"; // Gunna song from screenshot
    const instance = "https://cobalt-backend.canine.tools"; // One of the failing ones

    console.log(`Testing ${instance}...`);

    const payload = {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoQuality: "720",
        downloadMode: "audio",
        youtubeVideoCodec: "h264",
    };

    try {
        const res = await fetch(instance, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error(e);
    }
};

testCobalt();

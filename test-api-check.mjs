// Quick test: which APIs return working stream URLs?
const VIDEO_ID = "dQw4w9WgXcQ";

const APIs = [
    { name: "pipedapi.kavin.rocks", url: `https://pipedapi.kavin.rocks/streams/${VIDEO_ID}`, type: "piped" },
    { name: "api.piped.yt", url: `https://api.piped.yt/streams/${VIDEO_ID}`, type: "piped" },
    { name: "pipedapi.adminforge.de", url: `https://pipedapi.adminforge.de/streams/${VIDEO_ID}`, type: "piped" },
    { name: "inv.nadeko.net", url: `https://inv.nadeko.net/api/v1/videos/${VIDEO_ID}?local=true`, type: "invidious" },
    { name: "yewtu.be", url: `https://yewtu.be/api/v1/videos/${VIDEO_ID}?local=true`, type: "invidious" },
    { name: "cobalt.tools", url: `https://api.cobalt.tools/`, method: "POST", body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${VIDEO_ID}`, downloadMode: "audio", filenameStyle: "basic" }), headers: { "Content-Type": "application/json", "Accept": "application/json" }, type: "cobalt" },
];

async function testApi(api) {
    try {
        const opts = {
            method: api.method || "GET",
            headers: api.headers || { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(8000),
        };
        if (api.body) opts.body = api.body;

        const res = await fetch(api.url, opts);
        if (!res.ok) {
            console.log(`[${api.name}] HTTP ${res.status} FAIL`);
            return;
        }
        const data = await res.json();

        if (api.type === "piped") {
            const audio = data.audioStreams?.[0];
            if (audio?.url) {
                console.log(`[${api.name}] OK - title="${data.title?.slice(0, 30)}" audio url: ${audio.url.slice(0, 80)}`);
            } else {
                console.log(`[${api.name}] No audio streams. Keys: ${Object.keys(data).join(", ")}`);
            }
        } else if (api.type === "invidious") {
            const audio = (data.adaptiveFormats || []).find(f => f.type?.includes("audio"));
            if (audio?.url) {
                console.log(`[${api.name}] OK - title="${data.title?.slice(0, 30)}" audio url: ${audio.url.slice(0, 80)}`);
            } else {
                console.log(`[${api.name}] No audio formats.`);
            }
        } else if (api.type === "cobalt") {
            console.log(`[${api.name}] status=${data.status} url=${data.url?.slice(0, 80) || "NONE"}`);
        }
    } catch (e) {
        console.log(`[${api.name}] ERROR: ${e.message?.slice(0, 80)}`);
    }
}

console.log("Testing APIs...\n");
for (const api of APIs) {
    await testApi(api);
}
console.log("\nDone.");

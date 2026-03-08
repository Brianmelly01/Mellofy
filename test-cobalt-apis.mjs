const instances = ["https://api.cobalt.tools", "https://cobalt.api.horse", "https://capi.flyingfish.nl"];
const VIDEO_ID = "dQw4w9WgXcQ";

async function test(inst) {
    try {
        const body = { url: `https://www.youtube.com/watch?v=${VIDEO_ID}`, downloadMode: "audio", filenameStyle: "basic" };
        const res = await fetch(inst + "/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(body)
        });
        const d = await res.json();
        console.log(`[${inst}] ${d.status} -> ${d.url?.slice(0, 80) || "none"}`);
    } catch (e) {
        console.log(`[${inst}] ERR: ${e.message}`);
    }
}

for (const i of instances) await test(i);

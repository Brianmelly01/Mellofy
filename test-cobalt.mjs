const instances = [
    "https://api.cobalt.tools",
    "https://cobalt.api.horse",
    "https://capi.flyingfish.nl",
];

for (const base of instances) {
    try {
        console.log(`\nTesting ${base}...`);
        const res = await fetch(`${base}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                downloadMode: "audio",
                audioFormat: "mp3",
            }),
            signal: AbortSignal.timeout(12000),
        });
        console.log(`  HTTP ${res.status}`);
        const text = await res.text();
        console.log(`  Body: ${text.slice(0, 300)}`);
    } catch (e) {
        console.log(`  ERROR: ${e.message}`);
    }
}

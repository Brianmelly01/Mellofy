// End-to-end test: call the local /api/download endpoint
const BASE = "http://localhost:3000";
const VIDEO_ID = "dQw4w9WgXcQ";

async function test(type) {
    console.log(`\nTesting API: type=${type}`);
    try {
        const res = await fetch(`${BASE}/api/download?id=${VIDEO_ID}&type=${type}&get_url=true`, {
            signal: AbortSignal.timeout(55000),
        });
        const data = await res.json();
        console.log(`  Status: ${res.status}`);
        console.log(`  Response:`, JSON.stringify(data, null, 2).slice(0, 400));
        if (data.url) {
            // Also check the URL is actually reachable
            try {
                const head = await fetch(data.url, {
                    method: "HEAD",
                    headers: { "User-Agent": "Mozilla/5.0", "Origin": "https://www.youtube.com", "Referer": "https://www.youtube.com/" },
                    signal: AbortSignal.timeout(5000),
                });
                console.log(`  URL reachable: HTTP ${head.status} (${head.headers.get("content-type")})`);
            } catch (e) {
                console.log(`  URL HEAD check failed: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(`  ERROR: ${e.message}`);
    }
}

await test("audio");
await test("video");
console.log("\nDone.");

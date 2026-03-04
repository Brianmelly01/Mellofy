async function fetchCobaltInstances() {
    console.log("Fetching cobalt.best instances...");
    try {
        const res = await fetch("https://instances.cobalt.best/api/instances");
        if (!res.ok) {
            console.log(`HTTP ${res.status}`);
            return;
        }
        const data = await res.json();
        console.log(`Found ${data.length} instances.`);

        // Sort by trust score or uptime
        const active = data.filter(i => i.status === "online" && i.version !== "unknown");
        console.log(`${active.length} are online.`);

        // Test top 5 instances
        const top = active.slice(0, 10);
        const WORKING = [];

        for (const inst of top) {
            console.log(`\nTesting ${inst.url}...`);
            try {
                const body = {
                    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    downloadMode: "audio",
                    audioFormat: "mp3",
                    filenameStyle: "basic"
                };
                const r = await fetch(inst.url === "https://api.cobalt.tools" || !inst.url.includes("/api") ? `${inst.url}/` : inst.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                    },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(6000)
                });

                if (!r.ok) {
                    console.log(`HTTP ${r.status}`);
                    continue;
                }

                const rData = await r.json();
                if ((rData.status === "tunnel" || rData.status === "redirect") && rData.url) {
                    console.log(`SUCCESS: ${inst.url}`);
                    WORKING.push(inst.url);
                } else {
                    console.log(`Status: ${rData.status} - ${rData.text || ''}`);
                }
            } catch (e) {
                console.log(`Error: ${e.message}`);
            }
        }

        console.log(`\nWORKING INSTANCES:\n${WORKING.join('\n')}`);

    } catch (e) {
        console.log(e);
    }
}
fetchCobaltInstances();

async function getInstances() {
    try {
        console.log("Fetching cobalt instances from github...");
        const res = await fetch("https://raw.githubusercontent.com/imputnet/cobalt/current/docs/instances.md");
        const text = await res.text();

        // basic scrape
        const regex = /https?:\/\/[^\s>]+(?=\s|\[)/g;
        let matches = text.match(regex) || [];
        matches = [...new Set(matches.filter(m => m.includes("api") || m.includes("cobalt")))];

        console.log("Found some urls:", matches.slice(0, 10));

        // Also let's just test a few well-known ones that might be v10
        const testUrls = [
            "https://cobalt-api.peuk.dev/",
            "https://cobalt.api.timelessnesses.me/",
            "https://co.wuk.sh/api/json" // v9?
        ];

        for (const url of [...testUrls, ...matches.slice(0, 3)]) {
            try {
                const isV9 = url.includes("json") || url.includes("wuk");
                const body = isV9 ? { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
                    : { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", downloadMode: "audio" };

                console.log("Testing:", url);
                const r = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(4000)
                });

                if (r.ok) {
                    const data = await r.json();
                    console.log("-> SUCCESS!", data.url.slice(0, 50));
                } else {
                    console.log("-> HTTP", r.status);
                }
            } catch (e) { console.log("-> fetch failed:", e.message) }
        }
    } catch (e) { console.error(e) }
}
getInstances();

const urls = [
    "https://api.cobalt.tools",           // Needs JWT now
    "https://cobalt.api.horse",           // Was dead
    "https://capi.flyingfish.nl",         // Was dead
    "https://cobalt.qtnx.dev",            // Test
    "https://api.cobalt.tools",
    "https://api.cobalt.buss.lol",
    "https://cobalt-api.kwiatekmateusz.pl",
    "https://co.wuk.sh"                   // popular proxy
];

async function testCobalt() {
    for (const base of urls) {
        try {
            const url = base + "/";
            console.log("Testing:", url);
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0"
                },
                body: JSON.stringify({
                    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    downloadMode: "audio",
                    audioFormat: "mp3",
                    filenameStyle: "basic"
                }),
                signal: AbortSignal.timeout(5000)
            });
            const text = await res.text();
            console.log("->", res.status, text.substring(0, 150));
        } catch (e) {
            console.error("->", e.message);
        }
    }
}
testCobalt();

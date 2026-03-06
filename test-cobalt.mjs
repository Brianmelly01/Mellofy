

async function testCobalt() {
    const urls = [
        "https://api.cobalt.tools/",
        "https://cobalt.api.horse/",
        "https://capi.flyingfish.nl/"
    ];

    for (const url of urls) {
        try {
            console.log("Testing:", url);
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                },
                body: JSON.stringify({
                    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    downloadMode: "audio",
                    audioFormat: "mp3",
                    filenameStyle: "basic"
                })
            });
            const text = await res.text();
            console.log(res.status, text.substring(0, 150));
        } catch (e) {
            console.error(e.message);
        }
    }
}

testCobalt();

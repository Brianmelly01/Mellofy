import http from 'http';

async function testVideo() {
    console.log("Starting...");
    const ores = await fetch("https://api.cobalt.blackcat.sweeux.org", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
            downloadMode: "auto",
            filenameStyle: "basic",
        })
    });

    const odata = await ores.json();
    console.log("Cobalt reply:", odata.url?.slice(0, 100));

    const proxyUrl = `http://localhost:3000/api/download?action=proxy&url=${encodeURIComponent(odata.url)}&ext=.mp4`;
    console.log("Fetching proxy URL:", proxyUrl.slice(0, 100));
    try {
        const pres = await fetch(proxyUrl, { headers: { "Range": "bytes=0-1000" } });
        console.log("Proxy status:", pres.status);
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}
testVideo();

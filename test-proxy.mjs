import http from "http";

async function test() {
    const videoId = "dQw4w9WgXcQ";
    console.log("Fetching stream URL...");
    const res = await fetch(`http://localhost:3000/api/download?id=${videoId}&type=audio&get_url=true`);
    const data = await res.json();
    console.log("Extracted URL:", data.url?.slice(0, 100));

    if (!data.url) return console.log("Failed to extract");

    const proxyUrl = `http://localhost:3000/api/download?action=proxy&url=${encodeURIComponent(data.url)}`;
    console.log("Testing proxy URL...");

    http.get(proxyUrl, (res) => {
        console.log("Proxy Status:", res.statusCode);
        console.log("Proxy Headers:", res.headers);
        let bytes = 0;
        res.on('data', (chunk) => {
            bytes += chunk.length;
            if (bytes > 100000) {
                console.log(`Received > 100KB: ${bytes} bytes`);
                res.destroy();
            }
        });
        res.on('end', () => console.log("Stream ended. Total bytes:", bytes));
    }).on('error', console.error);
}

test();

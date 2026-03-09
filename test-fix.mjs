import http from 'http';

async function testDownloadRoute() {
    const videoId = "dQw4w9WgXcQ";
    console.log("Checking api extraction...");
    const url = `http://localhost:3000/api/download?id=${videoId}&type=audio&get_url=true`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.url) return;

    const proxyUrl = `http://localhost:3000/api/download?action=proxy&url=${encodeURIComponent(data.url)}&download=true&title=Ricky&ext=.mp3`;
    console.log("Fetching proxy URL:", proxyUrl.slice(0, 100));

    http.get(proxyUrl, (res) => {
        console.log("Proxy Status:", res.statusCode);
        console.log("Proxy Headers:", res.headers);
        let bytes = 0;
        res.on('data', (c) => {
            bytes += c.length;
        });
        res.on('end', () => {
            console.log("Total bytes downloaded:", bytes);
            if (bytes > 100000) {
                console.log("Download seems successful! (> 100KB)");
            }
        });
    });
}
testDownloadRoute();

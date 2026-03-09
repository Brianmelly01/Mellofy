import http from 'http';

async function testProxy() {
    const videoId = "dQw4w9WgXcQ";
    const url = `http://localhost:3000/api/download?id=${videoId}&type=audio&get_url=true`;
    console.log("Fetching exact URL from server:", url);
    const res = await fetch(url);
    const data = await res.json();
    console.log("Got URL:", data.url?.slice(0, 50) + "...");

    if (!data.url) return;

    const proxyUrl = `http://localhost:3000/api/download?action=proxy&url=${encodeURIComponent(data.url)}&ext=.mp3`;
    console.log("Fetching proxy URL:", proxyUrl);

    http.get(proxyUrl, (res) => {
        console.log("Proxy Status:", res.statusCode);
        console.log("Proxy Headers:", res.headers['content-type']);
        let body = [];
        res.on('data', (c) => body.push(c));
        res.on('end', () => {
            const buf = Buffer.concat(body);
            console.log("Downloaded bytes:", buf.length);
            console.log("File head string:", buf.toString('utf8', 0, 100));
        });
    });
}
testProxy();

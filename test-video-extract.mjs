import http from 'http';

async function testVideo() {
    const videoId = "dQw4w9WgXcQ";
    const url = `http://localhost:3000/api/download?id=${videoId}&type=video&get_url=true`;

    console.log("Fetching video url...", url);
    const res = await fetch(url);
    const data = await res.json();
    console.log("Result:", data.url?.slice(0, 50) + "...");
}
testVideo();

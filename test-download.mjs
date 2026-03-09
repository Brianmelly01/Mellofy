import fs from 'fs';
import http from 'http';

async function testDownload() {
    const videoId = "XqZsoesa55w"; // Baby Shark or something short
    const url = `http://localhost:3000/api/download?id=${videoId}&type=audio`;
    console.log("Fetching from:", url);

    http.get(url, (res) => {
        console.log("Status Code:", res.statusCode);
        console.log("Headers:", res.headers);

        let file = fs.createWriteStream('test-download.mp3');
        res.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log("Download completed. Checking file content...");
            const content = fs.readFileSync('test-download.mp3').toString('utf8', 0, 500);
            console.log("Head of file:", content);
        });
    }).on('error', (err) => {
        console.error("HTTP Error:", err.message);
    });
}
testDownload();

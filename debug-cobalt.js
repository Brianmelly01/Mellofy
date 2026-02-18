const https = require('https');

const videoId = "HX2cgqnbk1A";
const instance = "https://cobalt-backend.canine.tools";

const payload = {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    videoQuality: "720",
    downloadMode: "audio",
    youtubeVideoCodec: "h264",
};

const options = {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};

const req = https.request(instance, options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(`Body: ${data}`));
});

req.on('error', (e) => console.error(e));
req.write(JSON.stringify(payload));
req.end();

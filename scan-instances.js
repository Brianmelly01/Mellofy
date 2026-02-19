const https = require('https');
const http = require('http');

const COBALT_CANDIDATES = [
    "https://cobalt.kwiatekmiki.com",
    "https://cobalt.wuk.sh",
    "https://cobalt.stream",
    "https://hyper.lol",
    "https://cobalt.cal1.cn",
    "https://cobalt.tools",
    "https://cobalt-backend.canine.tools",
    "https://cobalt-api.meowing.de",
    "https://capi.3kh0.net",
    "https://api.cobalt.tools",
    "https://cobalt.q13.me",
    "https://cobalt.synced.to",
    "https://co.wuk.sh",
];

const PIPED_CANDIDATES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.leptons.xyz",
    "https://piped-api.lunar.icu",
    "https://pipedapi.mha.fi",
    "https://pipedapi.garudalinux.org",
    "https://api.piped.yt",
    "https://pipedapi.r4fo.com",
    "https://pipedapi.colinslegacy.com",
    "https://pipedapi.rivo.lol",
    "https://pipedapi.smnz.de",
    "https://pipedapi.ducks.party",
];

const VIDEO_ID = "HX2cgqnbk1A";

const checkCobalt = (url) => {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            url: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
            videoQuality: "720",
            downloadMode: "audio",
            youtubeVideoCodec: "h264"
        });

        const options = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; MellofyBot/1.0)'
            },
            timeout: 5000
        };

        const lib = url.startsWith('https') ? https : http;
        const req = lib.request(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        if (json.url || (json.picker && json.picker.length > 0) || json.status === 'stream') {
                            console.log(`[COBALT] ✅ SUCCESS: ${url}`);
                            resolve(true);
                        } else {
                            console.log(`[COBALT] ❌ ${url} (status: ${json.status || 'unknown'})`);
                            resolve(false);
                        }
                    } catch (e) {
                        console.log(`[COBALT] ❌ ${url} (invalid json)`);
                        resolve(false);
                    }
                } else {
                    console.log(`[COBALT] ❌ ${url} (HTTP ${res.statusCode})`);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log(`[COBALT] ❌ ${url} (${e.message})`);
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`[COBALT] ❌ ${url} (timeout)`);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
};

const checkPiped = (url) => {
    return new Promise((resolve) => {
        const options = {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MellofyBot/1.0)'
            },
            timeout: 5000
        };

        const lib = url.startsWith('https') ? https : http;
        const req = lib.request(`${url}/streams/${VIDEO_ID}`, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        if (json.audioStreams && json.audioStreams.length > 0) {
                            console.log(`[PIPED] ✅ SUCCESS: ${url}`);
                            resolve(true);
                        } else {
                            console.log(`[PIPED] ❌ ${url} (no streams)`);
                            resolve(false);
                        }
                    } catch (e) {
                        console.log(`[PIPED] ❌ ${url} (invalid json)`);
                        resolve(false);
                    }
                } else {
                    console.log(`[PIPED] ❌ ${url} (HTTP ${res.statusCode})`);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log(`[PIPED] ❌ ${url} (${e.message})`);
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`[PIPED] ❌ ${url} (timeout)`);
            resolve(false);
        });

        req.end();
    });
};

(async () => {
    console.log("Scanning Cobalt instances...");
    await Promise.all(COBALT_CANDIDATES.map(checkCobalt));

    console.log("\nScanning Piped instances...");
    await Promise.all(PIPED_CANDIDATES.map(checkPiped));
})();

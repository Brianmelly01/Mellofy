const instances = [
    'https://cobalt.blackcat.sweeux.org',
    'https://cobalt.br0k3.me',
    'https://cobalt.meowing.de',
    'https://cobalt.squair.xyz',
    'https://cobalt.canine.tools',
    'https://cobalt.clxxped.lol',
    'https://cobalt.cjs.nz'
];

async function testInstances() {
    console.log("Testing extracted Cobalt domains...");
    for (const base of instances) {
        console.log(`\nTesting ${base}...`);
        try {
            const body = {
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                downloadMode: "audio",
                audioFormat: "mp3",
                filenameStyle: "basic"
            };
            const r = await fetch(base + '/', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    "Origin": base,
                    "Referer": base + "/"
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(8000)
            });

            console.log(`  HTTP ${r.status}`);
            if (r.ok) {
                const data = await r.json();
                console.log(`  Status: ${data.status}`);
                if (data.url) console.log(`  SUCCESS! URL found: ${data.url.slice(0, 50)}...`);
            } else {
                const text = await r.text();
                console.log(`  Body: ${text.slice(0, 100)}`);
            }
        } catch (e) {
            console.log(`  ERROR: ${e.message}`);
        }
    }
}
testInstances();

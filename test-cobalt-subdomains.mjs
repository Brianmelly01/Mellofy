const baseDomains = [
    'cobalt.blackcat.sweeux.org',
    'cobalt.br0k3.me',
    'cobalt.meowing.de',
    'cobalt.squair.xyz',
    'cobalt.canine.tools',
    'cobalt.clxxped.lol',
    'cobalt.cjs.nz'
];

async function scan() {
    for (const d of baseDomains) {
        // Try domain structure 1: api.domain
        // Try domain structure 2: domain (which we tested)
        // Try domain structure 3: co.domain
        const targets = [
            `https://api.${d}/`,
            `https://${d.replace('cobalt.', 'api.')}/`
        ];

        for (const url of targets) {
            try {
                const body = {
                    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    downloadMode: "audio",
                    audioFormat: "mp3",
                    filenameStyle: "basic"
                };
                const r = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(3000)
                });
                if (r.ok) {
                    const data = await r.json();
                    if (data.status) console.log(`SUCCESS [API found]: ${url} -> status: ${data.status}`);
                }
            } catch (e) { }
        }
    }
    console.log("Scan complete.");
}
scan();

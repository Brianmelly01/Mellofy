const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.yt",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.garudalinux.org",
    "https://pipedapi.rivo.lol",
    "https://piped-api.codespace.cz",
    "https://pipedapi.drgns.space",
    "https://pipedapi.in.projectsegfau.lt",
];

async function testPiped() {
    for (const inst of PIPED_INSTANCES) {
        try {
            console.log("Testing:", inst);
            const res = await fetch(`${inst}/streams/dQw4w9WgXcQ`, { signal: AbortSignal.timeout(6000) });
            if (res.ok) {
                const data = await res.json();
                console.log("-> Success! audioStreams count:", data.audioStreams?.length);
            } else {
                console.log("-> Failed HTTP", res.status);
            }
        } catch (e) {
            console.error("-> Error", e.message);
        }
    }
}
testPiped();

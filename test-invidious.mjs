const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
    "https://invidious.privacydev.net",
    "https://iv.melmac.space",
    "https://inv.tux.pizza",
    "https://invidious.jing.rocks",
    "https://iv.ggtyler.dev",
    "https://invidious.drgns.space",
    "https://invidious.lunar.icu",
];

async function testInvidious() {
    for (const inst of INVIDIOUS_INSTANCES) {
        try {
            console.log("Testing:", inst);
            const res = await fetch(`${inst}/api/v1/videos/dQw4w9WgXcQ?local=true`, {
                headers: { "User-Agent": "Mozilla/5.0" },
                signal: AbortSignal.timeout(6000)
            });
            if (res.ok) {
                const data = await res.json();
                console.log("-> Success! title:", data.title);
            } else {
                console.log("-> Failed HTTP", res.status);
            }
        } catch (e) {
            console.error("-> Error", e.message);
        }
    }
}
testInvidious();

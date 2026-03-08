// Test a wider set of Piped instances to find any that work
const VIDEO_ID = "dQw4w9WgXcQ";

// Extended list of Piped instances from https://piped-instances.kavin.rocks/
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.yt",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.garudalinux.org",
    "https://piped-api.lunar.icu",
    "https://pa.mint.lgbt",
    "https://pipedapi.drgns.space",
    "https://piapi.ggtyler.dev",
    "https://watchapi.whatever.social",
    "https://api.piped.private.coffee",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.moomoo.me",
    "https://piped-api.privacy.com.de",
    "https://pipedapi.colinslegacy.com",
];

const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://yewtu.be",
    "https://iv.melmac.space",
    "https://invidious.io.lol",
    "https://vid.puffyan.us",
    "https://yt.cdaut.de",
    "https://invidious.nerdvpn.de",
    "https://invidious.privacydev.net",
    "https://invidious.fdn.fr",
];

console.log("Testing Piped instances...");
for (const inst of PIPED_INSTANCES) {
    try {
        const res = await fetch(`${inst}/streams/${VIDEO_ID}`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
            process.stdout.write(`[Piped] ${inst}: HTTP ${res.status}\n`);
            continue;
        }
        const data = await res.json();
        const audio = data.audioStreams?.[0];
        process.stdout.write(`[Piped] ${inst}: OK - audio=${!!audio?.url}\n`);
    } catch (e) {
        process.stdout.write(`[Piped] ${inst}: ${e.message?.slice(0, 50)}\n`);
    }
}

console.log("\nTesting Invidious instances...");
for (const inst of INVIDIOUS_INSTANCES) {
    try {
        const res = await fetch(`${inst}/api/v1/videos/${VIDEO_ID}?local=true`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
            process.stdout.write(`[Inv] ${inst}: HTTP ${res.status}\n`);
            continue;
        }
        const data = await res.json();
        const audio = (data.adaptiveFormats || []).find(f => f.type?.includes("audio"));
        process.stdout.write(`[Inv] ${inst}: OK - audio=${!!audio?.url}\n`);
    } catch (e) {
        process.stdout.write(`[Inv] ${inst}: ${e.message?.slice(0, 50)}\n`);
    }
}

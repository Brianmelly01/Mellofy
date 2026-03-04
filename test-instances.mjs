// Test Invidious + Piped instances to find ones that actually work

const PIPED = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.yt",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.garudalinux.org",
    "https://pipedapi.r4fo.com",
    "https://piped-api.codespace.cz",
    "https://pipedapi.drgns.space",
];

const INVIDIOUS = [
    "https://inv.nadeko.net",
    "https://yewtu.be",
    "https://invidious.privacydev.net",
    "https://iv.melmac.space",
    "https://inv.tux.pizza",
    "https://invidious.jing.rocks",
    "https://iv.ggtyler.dev",
    "https://invidious.drgns.space",
    "https://invidious.lunar.icu",
];

const VIDEO_ID = "dQw4w9WgXcQ";
const timeout = 8000;

async function testPiped(base) {
    try {
        const res = await fetch(`${base}/streams/${VIDEO_ID}`, {
            signal: AbortSignal.timeout(timeout),
        });
        if (!res.ok) { console.log(`  PIPED ${base} → HTTP ${res.status}`); return; }
        const data = await res.json();
        const hasAudio = data.audioStreams?.length > 0;
        const hasVideo = data.videoStreams?.length > 0;
        console.log(`  ✓ PIPED ${base} → audio:${hasAudio} video:${hasVideo} firstAudioUrl:${data.audioStreams?.[0]?.url?.slice(0, 60) || 'none'}`);
    } catch (e) {
        console.log(`  PIPED ${base} → ERROR: ${e.message}`);
    }
}

async function testInvidious(base) {
    try {
        const res = await fetch(`${base}/api/v1/videos/${VIDEO_ID}?local=true`, {
            signal: AbortSignal.timeout(timeout),
        });
        if (!res.ok) { console.log(`  INV ${base} → HTTP ${res.status}`); return; }
        const data = await res.json();
        const audio = data.adaptiveFormats?.find(f => f.type?.includes("audio"));
        console.log(`  ✓ INV ${base} → formats:${data.adaptiveFormats?.length} audio:${audio?.url?.slice(0, 60) || 'none'}`);
    } catch (e) {
        console.log(`  INV ${base} → ERROR: ${e.message}`);
    }
}

console.log("\n=== Testing Piped ===");
await Promise.all(PIPED.map(testPiped));

console.log("\n=== Testing Invidious ===");
await Promise.all(INVIDIOUS.map(testInvidious));


const COBALT_INSTANCES = [
    "https://cobalt-api.meowing.de",
    "https://cobalt-backend.canine.tools",
    "https://kityune.imput.net",
    "https://nachos.imput.net",
    "https://blossom.imput.net",
    "https://capi.3kh0.net",
    "https://sunny.imput.net",
    "https://cobalt.q69.xyz",
    "https://api.cobalt.tools",
];

const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.leptons.xyz",
    "https://piped-api.lunar.icu",
    "https://pipedapi.mha.fi",
    "https://pipedapi.garudalinux.org",
    "https://api.piped.yt",
];

const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
    "https://iv.melmac.space",
];

const testCobalt = async (videoId: string) => {
    console.log(`\n--- Testing Cobalt Nodes ---`);
    for (const instance of COBALT_INSTANCES) {
        try {
            const res = await fetch(instance, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ url: `https://youtube.com/watch?v=${videoId}`, downloadMode: "audio" }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.url || data.picker?.[0]?.url) {
                    console.log(`✅ SUCCESS on ${instance}`);
                    return;
                }
            }
        } catch (e: any) { }
    }
    console.log("❌ All Cobalt failed");
};

const testPiped = async (videoId: string) => {
    console.log(`\n--- Testing Piped Nodes ---`);
    for (const instance of PIPED_INSTANCES) {
        try {
            const res = await fetch(`${instance}/streams/${videoId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.audioStreams?.length || data.videoStreams?.length) {
                    console.log(`✅ SUCCESS on ${instance}`);
                    return;
                }
            }
        } catch (e: any) { }
    }
    console.log("❌ All Piped failed");
};

const testInvidious = async (videoId: string) => {
    console.log(`\n--- Testing Invidious Nodes ---`);
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const res = await fetch(`${instance}/api/v1/videos/${videoId}?local=true`);
            if (res.ok) {
                const data = await res.json();
                if (data.adaptiveFormats?.length) {
                    console.log(`✅ SUCCESS on ${instance}`);
                    return;
                }
            }
        } catch (e: any) { }
    }
    console.log("❌ All Invidious failed");
};

const runTests = async () => {
    const videoId = "HX2cgqnbk1A";
    await testCobalt(videoId);
    await testPiped(videoId);
    await testInvidious(videoId);
};

runTests();

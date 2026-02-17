
// V5 ULTIMATE PROBE CONSTANTS — refreshed to currently-live instances
export const PIPED_NODES = [
    "https://pipedapi.kavin.rocks", "https://pipedapi.adminforge.de",
    "https://pipedapi.leptons.xyz", "https://piped-api.lunar.icu",
    "https://pipedapi.mha.fi", "https://pipedapi.garudalinux.org",
    "https://api.piped.yt", "https://pipedapi.r4fo.com",
    "https://pipedapi.colinslegacy.com", "https://pipedapi.rivo.lol",
];

export const INVIDIOUS_NODES = [
    "https://inv.nadeko.net", "https://invidious.nerdvpn.de", "https://yewtu.be",
];

export const COBALT_NODES = [
    "https://api.cobalt.tools",
    "https://cobalt.meowing.de",
    "https://co.eepy.moe",
    "https://cobalt-api.v06.me",
    "https://api.cobalt.kwiatekmiki.pl",
    "https://cobalt.154.53.53.53.sslip.io",
    "https://cobalt.q69.it",
    "https://cobaltt.tools",
    "https://lc.vern.cc",
    "https://cobalt.xy24.eu.org",
    "https://cobalt.kinuseka.net",
    "https://co.wuk.sh",
    "https://cobalt.exozy.me",
    "https://cobalt.majhcc.xyz",
];

export const clientSideProbe = async (videoId: string, type: 'audio' | 'video'): Promise<string | null> => {
    const fetchWithTimeout = async (url: string, options: any, timeout = 6000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            clearTimeout(id);
            throw e;
        }
    };

    const probeCobalt = async (instance: string): Promise<string | null> => {
        // Helper to try a specific endpoint
        const tryEndpoint = async (endpoint: string, isV10: boolean) => {
            try {
                const payload = isV10 ? {
                    url: `https://youtube.com/watch?v=${videoId}`,
                    downloadMode: type === 'audio' ? 'audio' : 'auto',
                    videoQuality: '720',
                    youtubeVideoCodec: 'h264',
                    alwaysProxy: false,
                } : {
                    url: `https://youtube.com/watch?v=${videoId}`,
                    vCodec: 'h264',
                    vQuality: '720',
                    isAudioOnly: type === 'audio',
                };

                const res = await fetchWithTimeout(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify(payload),
                    referrerPolicy: "no-referrer",
                    credentials: "omit",
                    mode: "cors",
                }, 5000).catch(() => null);

                if (res && res.ok) {
                    const d = await res.json();
                    if (d.status === 'error' || d.status === 'picker') return null;
                    return d.url || d.picker?.[0]?.url || null;
                }
            } catch (e) { }
            return null; // Failed this endpoint
        };

        // Try v10 (root) first, then v7 (/api/json)
        let url = await tryEndpoint(instance, true);
        if (url) return url;

        // Some instances use /api/json (v7) or just mount v10 there
        // Only try if the instance URL doesn't already end in /api/json
        if (!instance.includes('/api/json')) {
            const v7Url = instance.endsWith('/') ? `${instance}api/json` : `${instance}/api/json`;
            url = await tryEndpoint(v7Url, false);
        }

        return url;
    };

    // V5 Strategy: Direct Cobalt Swarm
    // We only use Cobalt because it reliably supports CORS for client-side use.
    try {
        console.log(`Phase 1: Launching Cobalt swarm for ${videoId}...`);

        // Randomize order to spread load
        const nodes = [...COBALT_NODES].sort(() => Math.random() - 0.5);

        const batchSize = 6; // Parallelize 6 at a time
        for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(url => probeCobalt(url)));
            const valid = results.find(url => url !== null);
            if (valid) return valid;
        }
    } catch (globalErr) {
        console.error("Client probe failure:", globalErr);
    }

    return null;
};

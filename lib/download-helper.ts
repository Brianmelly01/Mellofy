
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

export const clientSideProbe = async (videoId: string, type: 'audio' | 'video'): Promise<{ url: string | null, logs: string[] }> => {
    const logs: string[] = [];
    const log = (msg: string) => logs.push(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`);

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
        const tryEndpoint = async (endpoint: string, isV10: boolean, useProxy: boolean = false) => {
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

                const targetUrl = useProxy
                    ? `https://corsproxy.io/?${encodeURIComponent(endpoint)}`
                    : endpoint;

                const res = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify(payload),
                    referrerPolicy: "no-referrer",
                    credentials: "omit",
                    mode: "cors",
                }, useProxy ? 10000 : 5000);

                if (res.ok) {
                    const d = await res.json();
                    if (d.status === 'error' || d.status === 'picker') {
                        log(`${instance} (${isV10 ? 'v10' : 'v7'}${useProxy ? '+proxy' : ''}) status: ${d.status}`);
                        return null;
                    }
                    if (d.url || d.picker?.[0]?.url) {
                        log(`${instance} (${isV10 ? 'v10' : 'v7'}${useProxy ? '+proxy' : ''}) SUCCESS`);
                        return d.url || d.picker?.[0]?.url;
                    }
                } else {
                    log(`${instance} (${isV10 ? 'v10' : 'v7'}${useProxy ? '+proxy' : ''}) HTTP ${res.status}`);
                }
            } catch (e: any) {
                log(`${instance} (${isV10 ? 'v10' : 'v7'}${useProxy ? '+proxy' : ''}) Failed: ${e.message || 'CORS/Net'}`);
            }
            return null;
        };

        // 1. Try Direct v10
        let url = await tryEndpoint(instance, true, false);
        if (url) return url;

        // 2. Try Direct v7
        if (!instance.includes('/api/json')) {
            const v7Url = instance.endsWith('/') ? `${instance}api/json` : `${instance}/api/json`;
            url = await tryEndpoint(v7Url, false, false);
            if (url) return url;
        }

        // 3. Try Proxy v10 (Last Resort)
        // Only try proxy if direct failed. corsproxy.io works well for JSON POST.
        url = await tryEndpoint(instance, true, true);
        if (url) return url;

        return null;
    };

    // V5 Strategy: Direct Cobalt Swarm
    // We only use Cobalt because it reliably supports CORS for client-side use.
    try {
        log(`Starting swarm for ${videoId}`);

        // Randomize order to spread load
        const nodes = [...COBALT_NODES].sort(() => Math.random() - 0.5);

        const batchSize = 5;
        for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize);
            log(`Batch ${i / batchSize + 1}: Probing ${batch.join(', ')}`);

            const results = await Promise.all(batch.map(url => probeCobalt(url)));
            const valid = results.find(url => url !== null);
            if (valid) return { url: valid, logs };
        }
    } catch (globalErr: any) {
        log(`Fatal error: ${globalErr.message}`);
    }

    return { url: null, logs };
};

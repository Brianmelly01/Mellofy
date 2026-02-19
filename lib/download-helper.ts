
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
    "https://co.wuk.sh",
    "https://cobalt-backend.canine.tools",
    "https://cobalt-api.meowing.de",
    "https://capi.3kh0.net",
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

    const wrapCORS = (url: string) => {
        const proxies = [
            (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        ];
        return proxies[Math.floor(Math.random() * proxies.length)](url);
    };

    const probeCobalt = async (instance: string): Promise<string | null> => {
        const tryEndpoint = async (endpoint: string, isV10: boolean, useProxy: boolean = false) => {
            try {
                const payload = isV10 ? {
                    url: `https://youtube.com/watch?v=${videoId}`,
                    downloadMode: type === 'audio' ? 'audio' : 'auto',
                    videoQuality: '720',
                    youtubeVideoCodec: 'h264',
                } : {
                    url: `https://youtube.com/watch?v=${videoId}`,
                    vCodec: 'h264',
                    vQuality: '720',
                    isAudioOnly: type === 'audio',
                };

                const targetUrl = useProxy ? wrapCORS(endpoint) : endpoint;

                const res = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify(payload),
                    mode: "cors",
                }, useProxy ? 10000 : 5000);

                if (res.ok) {
                    const d = await res.json();
                    if (d.status === 'error' || d.status === 'picker') {
                        log(`${instance} Error: ${d.error?.code || d.status}`);
                        return null;
                    }
                    const resUrl = d.url || d.picker?.[0]?.url;
                    if (resUrl) {
                        log(`${instance} SUCCESS`);
                        return resUrl;
                    }
                }
            } catch (e: any) {
                log(`${instance} Failed: ${e.message || 'CORS'}`);
            }
            return null;
        };

        let url = await tryEndpoint(instance, true, false);
        if (url) return url;
        return await tryEndpoint(instance, true, true);
    };

    const probePiped = async (instance: string): Promise<string | null> => {
        try {
            const res = await fetchWithTimeout(wrapCORS(`${instance}/streams/${videoId}`), { mode: 'cors' });
            if (res.ok) {
                const data = await res.json();
                const streams = type === 'audio' ? data.audioStreams : data.videoStreams;
                if (streams?.length) {
                    log(`Piped ${instance} SUCCESS`);
                    return streams[0].url;
                }
            }
        } catch (e: any) {
            log(`Piped ${instance} Failed`);
        }
        return null;
    };

    try {
        log(`Client-side probe starting for ${videoId}...`);

        // Strategy 1: Cobalt Swarm (Fastest)
        const cobaltResults = await Promise.all(COBALT_NODES.slice(0, 3).map(n => probeCobalt(n)));
        const cobaltUrl = cobaltResults.find(u => !!u);
        if (cobaltUrl) return { url: cobaltUrl, logs };

        // Strategy 2: Piped Swarm
        const pipedResults = await Promise.all(PIPED_NODES.slice(0, 3).map(n => probePiped(n)));
        const pipedUrl = pipedResults.find(u => !!u);
        if (pipedUrl) return { url: pipedUrl, logs };

        log("All client-side extraction strategies failed.");
    } catch (err: any) {
        log(`Probe error: ${err.message}`);
    }

    return { url: null, logs };
};


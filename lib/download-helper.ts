
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
    "https://co.wuk.sh",
    "https://api.cobalt.tools",
    // Backend nodes usually require JWT now, so we skip them to save time
];

export const clientSideProbe = async (videoId: string, type: 'audio' | 'video'): Promise<{ url: string | null, logs: string[] }> => {
    const logs: string[] = [];
    const log = (msg: string) => {
        const entry = `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`;
        console.log(entry);
        logs.push(entry);
    };

    const fetchWithTimeout = async (url: string, options: any, timeout = 7000) => {
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
        // We deterministicly pick for a node so it's consistent if retried
        const index = url.length % proxies.length;
        return proxies[index](url);
    };

    const probeCobalt = async (instance: string): Promise<string | null> => {
        const tryEndpoint = async (endpoint: string, useProxy: boolean = false) => {
            try {
                const targetUrl = useProxy ? wrapCORS(endpoint) : endpoint;
                const res = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify({
                        url: `https://youtube.com/watch?v=${videoId}`,
                        downloadMode: type === 'audio' ? 'audio' : 'auto',
                        videoQuality: '720',
                    }),
                    mode: "cors",
                }, useProxy ? 10000 : 5000);

                if (res.ok) {
                    const d = await res.json();
                    if (d.url || d.picker?.[0]?.url) {
                        log(`${instance} SUCCESS`);
                        return d.url || d.picker?.[0]?.url;
                    }
                    log(`${instance} Error: ${d.error?.code || d.status}`);
                }
            } catch (e: any) {
                log(`${instance} Failed: ${e.message || 'CORS'}`);
            }
            return null;
        };

        return (await tryEndpoint(instance, false)) || (await tryEndpoint(instance, true));
    };

    const probePiped = async (instance: string): Promise<string | null> => {
        try {
            // Piped APIs are often less strict if proxied
            const res = await fetchWithTimeout(wrapCORS(`${instance}/streams/${videoId}`), { mode: 'cors' });
            if (res.ok) {
                const data = await res.json();
                const streams = type === 'audio' ? data.audioStreams : data.videoStreams;
                if (streams?.length) {
                    log(`Piped ${instance} SUCCESS`);
                    return streams[0].url;
                }
            }
        } catch (e: any) { /* silent */ }
        return null;
    };

    const probeInvidious = async (instance: string): Promise<string | null> => {
        try {
            // Invidious with local=true proxies the video itself through the instance
            const res = await fetchWithTimeout(wrapCORS(`${instance}/api/v1/videos/${videoId}?local=true`), { mode: 'cors' });
            if (res.ok) {
                const data = await res.json();
                const formats = data.adaptiveFormats || data.formatStreams || [];
                if (formats.length > 0) {
                    log(`Invidious ${instance} SUCCESS`);
                    return formats[0].url;
                }
            }
        } catch (e: any) { /* silent */ }
        return null;
    };

    try {
        log(`Resilient probe for ${videoId} (${type})...`);

        // Parallel swarm: each promise rejects if it fails to find a URL
        const wrapToReject = async (p: Promise<string | null>) => {
            const res = await p;
            if (!res) throw new Error("Fail");
            return res;
        };

        const strategies = [
            ...COBALT_NODES.map(n => wrapToReject(probeCobalt(n))),
            ...PIPED_NODES.slice(0, 5).map(n => wrapToReject(probePiped(n))),
            ...INVIDIOUS_NODES.slice(0, 3).map(n => wrapToReject(probeInvidious(n)))
        ];

        try {
            const firstSuccess = await Promise.any(strategies);
            log("Strategy successful!");
            return { url: firstSuccess, logs };
        } catch (e) {
            log("All extraction strategies in swarm failed.");
        }
    } catch (err: any) {
        log(`Probe failed: ${err.message}`);
    }

    return { url: null, logs };
};

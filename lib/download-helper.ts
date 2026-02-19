
// V5 ULTIMATE PROBE CONSTANTS — refreshed to currently-live instances
export const PIPED_NODES = [
    "https://pipedapi.kavin.rocks", "https://pipedapi.adminforge.de",
    "https://pipedapi.leptons.xyz", "https://piped-api.lunar.icu",
    "https://pipedapi.mha.fi", "https://pipedapi.garudalinux.org",
    "https://api.piped.yt", "https://pipedapi.r4fo.com",
    "https://pipedapi.colinslegacy.com", "https://pipedapi.rivo.lol",
    "https://pipedapi.drgns.space", "https://pipedapi.projectsegfau.lt",
];

export const INVIDIOUS_NODES = [
    "https://inv.nadeko.net", "https://invidious.nerdvpn.de", "https://yewtu.be",
    "https://invidious.no-logs.com", "https://inv.riverside.rocks", "https://invidious.snopyta.org",
];

export const COBALT_NODES = [
    "https://co.wuk.sh",
    "https://api.cobalt.tools",
    "https://cobalt-backend.canine.tools", // Sometimes works for client-side
    "https://cobalt-api.meowing.de",
    "https://capi.3kh0.net",
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
        // Use a different proxy based on URL to avoid multi-hitting same rate limit
        const index = Math.abs(url.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % proxies.length;
        return proxies[index](url);
    };

    const probeCobalt = async (instance: string): Promise<string | null> => {
        const tryEndpoint = async (endpoint: string, isV7: boolean, useProxy: boolean = false) => {
            try {
                const targetUrl = useProxy ? wrapCORS(endpoint) : endpoint;
                const payload = isV7 ? {
                    url: `https://youtube.com/watch?v=${videoId}`,
                    vCodec: 'h264', vQuality: '720', isAudioOnly: type === 'audio',
                } : {
                    url: `https://youtube.com/watch?v=${videoId}`,
                    downloadMode: type === 'audio' ? 'audio' : 'auto',
                    videoQuality: '720',
                };

                const res = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify(payload),
                    mode: "cors",
                }, useProxy ? 10000 : 5000);

                if (res.ok) {
                    const d = await res.json();
                    const resUrl = d.url || d.picker?.[0]?.url;
                    if (resUrl) {
                        log(`${instance} (${isV7 ? 'v7' : 'v10'}) SUCCESS`);
                        return resUrl;
                    }
                }
            } catch (e: any) { /* silent */ }
            return null;
        };

        // Try direct V10 -> direct V7 -> proxied V10
        let url = await tryEndpoint(instance, false, false);
        if (!url) {
            const v7Url = instance.endsWith('/') ? `${instance}api/json` : `${instance}/api/json`;
            url = await tryEndpoint(v7Url, true, false);
        }
        if (!url) url = await tryEndpoint(instance, false, true);

        return url;
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
                const formats = (data.adaptiveFormats || []).concat(data.formatStreams || []);
                if (formats.length > 0) {
                    log(`Invidious ${instance} SUCCESS`);
                    return formats[0].url;
                }
            }
        } catch (e: any) { /* silent */ }
        return null;
    };

    try {
        log(`Hardened probe for ${videoId} (${type})...`);

        // Parallel swarm: each promise rejects if it fails to find a URL
        const wrapToReject = async (p: Promise<string | null>) => {
            const res = await p;
            if (!res) throw new Error("Fail");
            return res;
        };

        const strategies = [
            ...COBALT_NODES.slice(0, 3).map(n => wrapToReject(probeCobalt(n))),
            ...PIPED_NODES.slice(0, 6).map(n => wrapToReject(probePiped(n))),
            ...INVIDIOUS_NODES.slice(0, 4).map(n => wrapToReject(probeInvidious(n)))
        ];

        try {
            const firstSuccess = await Promise.any(strategies);
            log("Swarm successful!");
            return { url: firstSuccess, logs };
        } catch (e) {
            log("Swarm failed entirely.");
        }
    } catch (err: any) {
        log(`Probe aborted: ${err.message}`);
    }

    return { url: null, logs };
};

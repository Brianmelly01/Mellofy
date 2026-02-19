// V5 ULTIMATE PROBE CONSTANTS — refreshed 2026 nodes
export const PIPED_NODES = [
    "https://pipedapi.kavin.rocks", "https://pipedapi.adminforge.de",
    "https://pipedapi.leptons.xyz", "https://piped-api.lunar.icu",
    "https://pipedapi.mha.fi", "https://pipedapi.garudalinux.org",
    "https://api.piped.yt", "https://pipedapi.r4fo.com",
    "https://pipedapi.rivo.lol", "https://pipedapi.projectsegfau.lt",
    "https://pipedapi.in.projectsegfau.lt", "https://pipedapi.us.projectsegfau.lt",
];

export const INVIDIOUS_NODES = [
    "https://inv.nadeko.net", "https://invidious.nerdvpn.de", "https://yewtu.be",
    "https://iv.melmac.space", "https://invidious.no-logs.com", "https://inv.riverside.rocks",
];

export const COBALT_NODES = [
    "https://co.wuk.sh",
    "https://api.cobalt.tools",
    "https://cobalt-backend.canine.tools",
    "https://cobalt-api.meowing.de",
];

export const clientSideProbe = async (videoId: string, type: 'audio' | 'video'): Promise<{ url: string | null, logs: string[] }> => {
    const logs: string[] = [];
    const log = (msg: string) => {
        const entry = `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`;
        console.log(entry);
        logs.push(entry);
    };

    const fetchWithTimeout = async (url: string, options: any, timeout = 12000) => {
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

    const wrapCORSPOST = (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

    const wrapCORSGET = (url: string) => {
        const proxies = [
            (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        ];
        const index = Math.abs(url.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % proxies.length;
        return proxies[index](url);
    };

    const probeCobalt = async (instance: string): Promise<string | null> => {
        const tryEndpoint = async (endpoint: string, useProxy: boolean = false) => {
            try {
                // IMPORTANT: Cobalt requires POST, AllOrigins is unreliable for POST. Use corsproxy.io.
                const targetUrl = useProxy ? wrapCORSPOST(endpoint) : endpoint;
                const res = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify({
                        url: `https://youtube.com/watch?v=${videoId}`,
                        downloadMode: type === 'audio' ? 'audio' : 'auto',
                        videoQuality: '720',
                    }),
                    mode: "cors",
                }, useProxy ? 15000 : 8000);

                if (res.ok) {
                    const d = await res.json();
                    if (d.url || d.picker?.[0]?.url) {
                        log(`${instance} SUCCESS`);
                        return d.url || d.picker?.[0]?.url;
                    }
                }
            } catch (e: any) { /* silent */ }
            return null;
        };

        return (await tryEndpoint(instance, false)) || (await tryEndpoint(instance, true));
    };

    const probePiped = async (instance: string): Promise<string | null> => {
        const tryPiped = async (useProxy: boolean) => {
            try {
                const targetUrl = useProxy ? wrapCORSGET(`${instance}/streams/${videoId}`) : `${instance}/streams/${videoId}`;
                const res = await fetchWithTimeout(targetUrl, { mode: 'cors' });
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
        // Strategy: Hit direct first (many have CORS), then proxy
        return (await tryPiped(false)) || (await tryPiped(true));
    };

    const probeInvidious = async (instance: string): Promise<string | null> => {
        try {
            const res = await fetchWithTimeout(wrapCORSGET(`${instance}/api/v1/videos/${videoId}?local=true`), { mode: 'cors' });
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
        log(`Intelligence Probe 4.0 for ${videoId} (${type})...`);
        const wrapToReject = async (p: Promise<string | null>) => {
            const res = await p;
            if (!res) throw new Error("Fail");
            return res;
        };

        const strategies = [
            ...COBALT_NODES.map(n => wrapToReject(probeCobalt(n))),
            ...PIPED_NODES.slice(0, 8).map(n => wrapToReject(probePiped(n))),
            ...INVIDIOUS_NODES.slice(0, 4).map(n => wrapToReject(probeInvidious(n)))
        ];

        try {
            const firstSuccess = await Promise.any(strategies);
            log("Swarm success!");
            return { url: firstSuccess, logs };
        } catch (e) {
            log("Swarm intelligence failed to find working node.");
        }
    } catch (err: any) {
        log(`Probe aborted: ${err.message}`);
    }

    return { url: null, logs };
};

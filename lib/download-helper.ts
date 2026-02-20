
// Fresh instances (Feb 2026 — from instances.cobalt.best & community lists)
export const PIPED_NODES = [
    "https://pipedapi.kavin.rocks", "https://pipedapi.adminforge.de",
    "https://pipedapi.leptons.xyz", "https://piped-api.lunar.icu",
    "https://pipedapi.mha.fi", "https://pipedapi.garudalinux.org",
    "https://api.piped.yt", "https://pipedapi.r4fo.com",
    "https://pipedapi.rivo.lol",
];

export const INVIDIOUS_NODES = [
    "https://inv.nadeko.net", "https://invidious.nerdvpn.de", "https://yewtu.be",
    "https://iv.melmac.space", "https://invidious.no-logs.com",
];

export const COBALT_NODES = [
    "https://cobalt-api.meowing.de",       // 96%
    "https://cobalt-backend.canine.tools", // 92%
    "https://kityune.imput.net",           // 76%
    "https://blossom.imput.net",           // 76%
    "https://nachos.imput.net",            // 76%
    "https://capi.3kh0.net",              // 72%
    "https://sunny.imput.net",            // 68%
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
            (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
        ];
        const index = Math.abs(url.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % proxies.length;
        return proxies[index](url);
    };

    const probeCobalt = async (instance: string): Promise<string | null> => {
        const tryEndpoint = async (useProxy: boolean = false) => {
            try {
                const targetUrl = useProxy ? wrapCORSPOST(instance) : instance;
                const res = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify({
                        url: `https://youtube.com/watch?v=${videoId}`,
                        downloadMode: type === 'audio' ? 'audio' : 'auto',
                        videoQuality: '720',
                        youtubeVideoCodec: 'h264',
                    }),
                    mode: "cors",
                }, useProxy ? 15000 : 8000);

                if (res.ok) {
                    const d = await res.json();
                    if (d.status === "error") return null;
                    if (d.url || d.picker?.[0]?.url) {
                        log(`Cobalt ${instance} SUCCESS`);
                        return d.url || d.picker?.[0]?.url;
                    }
                }
            } catch (e: any) { /* silent */ }
            return null;
        };

        return (await tryEndpoint(false)) || (await tryEndpoint(true));
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
                        if (type === 'audio') {
                            const opus = streams.find((s: any) => s.codec === 'opus');
                            return (opus || streams[0]).url;
                        }
                        const stream = streams.find((s: any) => s.quality === '720p') || streams[0];
                        return stream.url;
                    }
                }
            } catch (e: any) { /* silent */ }
            return null;
        };
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
                    if (type === 'audio') {
                        const audio = formats.find((f: any) => f.type?.includes('audio'));
                        return (audio || formats[0]).url;
                    }
                    const video = formats.find((f: any) => f.type?.includes('video/mp4'));
                    return (video || formats[0]).url;
                }
            }
        } catch (e: any) { /* silent */ }
        return null;
    };

    try {
        log(`Probing for ${videoId} (${type})...`);
        const wrapToReject = async (p: Promise<string | null>) => {
            const res = await p;
            if (!res) throw new Error("Fail");
            return res;
        };

        const strategies = [
            ...COBALT_NODES.map(n => wrapToReject(probeCobalt(n))),
            ...PIPED_NODES.slice(0, 6).map(n => wrapToReject(probePiped(n))),
            ...INVIDIOUS_NODES.slice(0, 4).map(n => wrapToReject(probeInvidious(n)))
        ];

        try {
            const firstSuccess = await Promise.any(strategies);
            log("Probe success!");
            return { url: firstSuccess, logs };
        } catch (e) {
            log("All probe nodes exhausted.");
        }
    } catch (err: any) {
        log(`Probe crash: ${err.message}`);
    }

    return { url: null, logs };
};

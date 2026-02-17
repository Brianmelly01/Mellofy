
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
    "https://cobalt.tools",
    "https://api.cobalt.tools",
    "https://cobalt.canine.tools",
    "https://cobalt.meowing.de",
    "https://co.eepy.moe",
    "https://cobalt.q69.it",
    "https://cobalt-api.v06.me",
    "https://cobalt.sweet-pota.to",
    "https://cobaltt.tools",
    "https://lc.vern.cc",
    "https://api.cobalt.kwiatekmiki.pl",
    "https://cobalt.154.53.53.53.sslip.io",
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

    const probePiped = async (instance: string): Promise<string | null> => {
        try {
            const bridgeUrl = `/api/download?action=proxy&url=${encodeURIComponent(`${instance}/streams/${videoId}`)}&force=true`;
            const res = await fetchWithTimeout(bridgeUrl, { headers: { "Accept": "application/json" } }, 12000).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                const streams = type === 'audio' ? data.audioStreams : data.videoStreams;
                if (!streams || streams.length === 0) return null;
                const stream = streams.find((s: any) => s.quality === "720p") || streams.find((s: any) => !s.videoOnly) || streams[0];
                return stream?.url || null;
            }
        } catch (e) { }
        return null;
    };

    const probeInvidious = async (instance: string): Promise<string | null> => {
        try {
            const bridgeUrl = `/api/download?action=proxy&url=${encodeURIComponent(`${instance}/api/v1/videos/${videoId}?local=true`)}&force=true`;
            const res = await fetchWithTimeout(bridgeUrl, {}, 12000).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                const formats = data.adaptiveFormats || data.formatStreams || [];
                const format = type === 'audio'
                    ? (formats.find((f: any) => f.type?.includes("audio/webm")) || formats.find((f: any) => f.type?.includes("audio/mp4")) || formats[0])
                    : (formats.find((f: any) => f.qualityLabel?.includes("720") || f.resolution === '720p') || formats.find((f: any) => f.type?.includes("video/mp4") && f.encoding?.includes("avc")) || formats[0]);
                return format?.url || null;
            }
        } catch (e) { }
        return null;
    };

    const probeCobalt = async (instance: string): Promise<string | null> => {
        try {
            // Cobalt API v10+: POST / with JSON headers (not /api/json)
            const bridgeUrl = `/api/download?action=proxy&url=${encodeURIComponent(instance)}&force=true`;
            const payload = {
                url: `https://youtube.com/watch?v=${videoId}`,
                downloadMode: type === 'audio' ? 'audio' : 'auto',
                youtubeVideoCodec: 'h264',
                videoQuality: '720',
            };
            const res = await fetchWithTimeout(bridgeUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(payload)
            }, 12000).catch(() => null);

            if (res && res.ok) {
                const d = await res.json();
                // Cobalt v10: status is tunnel/redirect/picker/error
                if (d.status === 'error') return null;
                return d.url || d.picker?.[0]?.url || null;
            }
        } catch (e) { }
        return null;
    };

    const probePremium = async (): Promise<string | null> => {
        try {
            // Phase 19: Chronos Engine (STS Sync + Cipher Recognition)
            const stsRes = await fetch("/api/download?action=sts").catch(() => null);
            const { sts } = stsRes ? await stsRes.json() : { sts: "20147" };

            const bridgeUrl = `/api/download?action=proxy&url=${encodeURIComponent(`https://www.youtube.com/youtubei/v1/player`)}&force=true`;
            const payload = {
                videoId,
                context: {
                    client: {
                        clientName: 'TVHTML5',
                        clientVersion: '7.20250224.01.00',
                        hl: 'en',
                        gl: 'US'
                    }
                },
                playbackContext: {
                    contentPlaybackContext: {
                        signatureTimestamp: parseInt(sts)
                    }
                }
            };
            const res = await fetchWithTimeout(bridgeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }, 15000).catch(() => null);

            if (res && res.ok) {
                const data = await res.json();
                const formats = [...(data.streamingData?.adaptiveFormats || []), ...(data.streamingData?.formats || [])];
                const targetMime = type === 'audio' ? "audio/mp4" : "video/mp4";
                const format = formats.find((f: any) => f.mimeType?.includes(targetMime) && (type === 'audio' || f.qualityLabel === "720p")) || formats[0];

                if (format) {
                    if (format.url) return format.url;
                    if (format.signatureCipher || format.cipher) {
                        const c = format.signatureCipher || format.cipher;
                        const decRes = await fetch(`/api/download?action=decipher&cipher=${encodeURIComponent(c)}`).catch(() => null);
                        if (decRes && decRes.ok) {
                            const decData = await decRes.json();
                            return decData.url || null;
                        }
                    }
                }
            }
        } catch (e) { }
        return null;
    };

    // V4 Strategy: Unified Ultra-Intensity Relayed Shotgun
    try {
        console.log(`V5 Pulsar: Launching concurrent search for ${videoId}...`);

        const allNodes = [
            { type: 'premium' as const, url: 'direct' },
            ...PIPED_NODES.map(n => ({ type: 'piped' as const, url: n })),
            ...INVIDIOUS_NODES.map(n => ({ type: 'invidious' as const, url: n })),
            ...COBALT_NODES.map(n => ({ type: 'cobalt' as const, url: n }))
        ].sort((a) => a.type === 'premium' ? -1 : (Math.random() - 0.5));

        const batchSize = 15;
        for (let i = 0; i < allNodes.length; i += batchSize) {
            const batch = allNodes.slice(i, i + batchSize);
            const results = await Promise.all(batch.map((node: any) => {
                if (node.type === 'premium') return probePremium();
                if (node.type === 'piped') return probePiped(node.url);
                if (node.type === 'invidious') return probeInvidious(node.url);
                return probeCobalt(node.url);
            }));
            const valid = results.find(url => url !== null);
            if (valid) return valid;
        }
    } catch (globalErr) {
        console.error("V4 Engine failure:", globalErr);
    }

    return null;
};

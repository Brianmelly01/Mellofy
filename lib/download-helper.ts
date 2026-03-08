
// Client-side download helper.
// Strategy:
//   1. Try server API (/api/download) — runs full server-side pipeline
//   2. Try Cobalt API directly from browser — works because user IPs aren't blocked
//   3. Return null (caller shows fallback UI)

const COBALT_INSTANCES = [
    "https://api.cobalt.tools",
    "https://cobalt.api.horse",
    "https://capi.flyingfish.nl",
];

/** Call Cobalt's REST API directly from the browser. */
export const cobaltBrowserExtract = async (
    videoId: string,
    type: "audio" | "video",
): Promise<{ url: string; filename: string } | null> => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    for (const instance of COBALT_INSTANCES) {
        try {
            console.log(`[CobaltBrowser] Trying ${instance} for ${videoId} (${type})...`);

            const body: Record<string, any> = {
                url: youtubeUrl,
                downloadMode: type === "audio" ? "audio" : "auto",
                filenameStyle: "basic",
            };

            if (type === "audio") {
                body.audioFormat = "mp3";
            }

            const res = await fetch(`${instance}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(20000),
            });

            if (!res.ok) {
                console.warn(`[CobaltBrowser] ${instance} HTTP ${res.status}`);
                continue;
            }

            const data = await res.json();
            console.log(`[CobaltBrowser] ${instance} status=${data.status}`);

            if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
                const ext = type === "audio" ? "mp3" : "mp4";
                const filename = data.filename || `download.${ext}`;
                console.log(`[CobaltBrowser] SUCCESS via ${instance}`);
                return { url: data.url, filename };
            }

            if (data.status === "picker" && data.picker?.length > 0) {
                const stream = data.picker[0];
                if (stream?.url) {
                    const ext = type === "audio" ? "mp3" : "mp4";
                    return { url: stream.url, filename: data.filename || `download.${ext}` };
                }
            }

            console.warn(`[CobaltBrowser] ${instance} unexpected response: ${JSON.stringify(data).slice(0, 100)}`);
        } catch (e: any) {
            console.warn(`[CobaltBrowser] ${instance} error: ${e?.message}`);
        }
    }
    return null;
};

export const clientSideProbe = async (
    videoId: string,
    type: "audio" | "video",
): Promise<{ url: string | null; logs: string[] }> => {
    const logs: string[] = [];
    const log = (msg: string) => {
        const entry = `[${new Date().toISOString().split("T")[1].slice(0, 8)}] ${msg}`;
        console.log(entry);
        logs.push(entry);
    };

    log(`clientSideProbe: routing ${videoId} (${type}) through server API...`);

    try {
        const res = await fetch(`/api/download?id=${videoId}&type=${type}&get_url=true`, {
            signal: AbortSignal.timeout(55000),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.url) {
                log(`Server API returned URL successfully.`);
                return { url: data.url, logs };
            }
        } else {
            const text = await res.text().catch(() => "N/A");
            log(`Server API responded with ${res.status}: ${text.substring(0, 100)}`);
        }
    } catch (e: any) {
        log(`Server API error: ${e?.message || e}`);
    }

    // Try Cobalt from browser as last resort for playback
    log(`Trying Cobalt browser extract...`);
    const cobalt = await cobaltBrowserExtract(videoId, type);
    if (cobalt?.url) {
        log(`Cobalt browser extract succeeded.`);
        return { url: cobalt.url, logs };
    }

    log("All extraction attempts exhausted.");
    return { url: null, logs };
};

// Kept for backwards compatibility — these are no longer used directly
export const PIPED_NODES: string[] = [];
export const INVIDIOUS_NODES: string[] = [];
export const COBALT_NODES: string[] = [];


// Client-side download helper.
// All heavy extraction is done server-side via /api/download.
// This module simply acts as a thin wrapper around the server API.

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

    log("All extraction attempts exhausted.");
    return { url: null, logs };
};

// Kept for backwards compatibility — these are no longer used directly
export const PIPED_NODES: string[] = [];
export const INVIDIOUS_NODES: string[] = [];
export const COBALT_NODES: string[] = [];

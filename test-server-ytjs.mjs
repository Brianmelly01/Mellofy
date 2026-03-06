import Innertube, { UniversalCache } from "youtubei.js";

async function extractViaYouTubeJS(videoId, type) {
    const clients = ["MWEB", "WEB_CREATOR", "ANDROID", "TV_EMBEDDED", "IOS"];
    let lastError = null;

    for (const clientName of clients) {
        try {
            console.log(`YouTubeJS: Trying ${clientName} for ${videoId}...`);
            const yt = await Innertube.create({
                retrieve_player: true,
                generate_session_locally: true,
                cache: new UniversalCache(false),
                client_type: clientName,
            });

            const info = await yt.getBasicInfo(videoId, clientName);

            if (!info.streaming_data) {
                console.log(`YouTubeJS (${clientName}): No streaming data`);
                continue;
            }

            const allFormats = [
                ...(info.streaming_data.adaptive_formats || []),
                ...(info.streaming_data.formats || []),
            ];

            const withUrl = allFormats.filter((f) => !!f.url || !!f.signature_cipher);
            // NOTE: if a format only has signature_cipher, it needs deciphering, which youtubei.js usually does when accessing .url property but maybe it failed.
            console.log(`YouTubeJS (${clientName}): ${allFormats.length} total, ${withUrl.length} with URLs/ciphers`);

            // Decipher first
            for (const f of withUrl) {
                if (!f.url && f.signature_cipher) {
                    try {
                        f.url = f.decipher(yt.session.player);
                    } catch (e) { }
                }
            }

            const withValidUrl = withUrl.filter((f) => !!f.url);
            console.log(`YouTubeJS (${clientName}): ${withValidUrl.length} valid URLs`);

            if (withValidUrl.length === 0) continue;

            let chosen = null;
            if (type === "audio") {
                chosen = withValidUrl.find((f) => f.mime_type?.includes("audio/mp4")) ||
                    withValidUrl.find((f) => f.mime_type?.includes("audio/webm")) ||
                    withValidUrl.find((f) => f.mime_type?.includes("audio"));
            }

            if (chosen?.url) {
                const title = info.basic_info?.title || "download";
                console.log(`YouTubeJS (${clientName}): SUCCESS - found ${type} URL`);
                return { url: chosen.url, title };
            }
        } catch (e) {
            console.error(`YouTubeJS (${clientName}) error:`, e?.message || e);
            lastError = e;
        }
    }

    throw new Error(`YouTubeJS: All clients failed. Last: ${lastError?.message || "No data"}`);
}

extractViaYouTubeJS("dQw4w9WgXcQ", "audio").then(res => console.log("Final URL:", res.url.slice(0, 50))).catch(e => console.error(e));

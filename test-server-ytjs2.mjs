import Innertube, { UniversalCache } from "youtubei.js";
import { Jintr } from "jintr";

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

            // Need to set jintr or something?
            // Actually Jintr is for youtubei.js
            const info = await yt.getBasicInfo(videoId, clientName);

            // Let's just try info.streaming_data or format.decipher
            const format = info.chooseFormat({ type: 'audio', quality: 'best' });
            if (format) {
                console.log(`Success with chooseFormat! URL: ${format.url}`);
                return format;
            }
        } catch (e) {
            console.log(`failed: ${e.message}`);
        }
    }
}
extractViaYouTubeJS("dQw4w9WgXcQ", "audio").catch(console.error);

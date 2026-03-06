import Innertube, { UniversalCache } from "youtubei.js";
import vm from "vm";

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
                evaluator: (source, env) => {
                    const params = Object.keys(env);
                    const args = Object.values(env);
                    // YouTubei.js evaluator signature passes code string, and maybe an environment object?
                    // Actually, getting-started docs say:
                    //   import { Platform } from 'youtubei.js/web';
                    //   Platform.shim.eval = async (data, env) => { ... }
                    // Let me try the exact code from docs.
                }
            });
            // We'll see if it throws...
        } catch (e) { }
    }
}
extractViaYouTubeJS("dQw4w9WgXcQ", "audio");

// Test youtubei.js locally - what works on non-Vercel IPs?
import Innertube, { UniversalCache } from "youtubei.js";

const VIDEO_ID = "dQw4w9WgXcQ";

const clients = ["MWEB", "WEB", "WEB_CREATOR", "ANDROID", "TV_EMBEDDED", "IOS"];

for (const clientName of clients) {
    try {
        console.log(`\nTrying ${clientName}...`);
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
            client_type: clientName,
        });

        const info = await yt.getBasicInfo(VIDEO_ID, clientName);
        const adaptive = info.streaming_data?.adaptive_formats || [];
        const formats = info.streaming_data?.formats || [];
        const all = [...adaptive, ...formats];
        const withUrl = all.filter(f => !!f.url);
        const audios = withUrl.filter(f => f.mime_type?.includes("audio"));
        const videos = withUrl.filter(f => f.mime_type?.includes("video"));

        console.log(`  ${clientName}: total=${all.length} withUrl=${withUrl.length} audio=${audios.length} video=${videos.length}`);
        if (audios[0]?.url) {
            const u = new URL(audios[0].url);
            console.log(`  firstAudio mime=${audios[0].mime_type} host=${u.host}`);
        }
    } catch (e) {
        console.log(`  ${clientName}: ERROR - ${e.message?.slice(0, 100)}`);
    }
}

import Innertube, { UniversalCache } from "youtubei.js";

async function test() {
    try {
        const yt = await Innertube.create({
            retrieve_player: false,
            generate_session_locally: true,
            cache: new UniversalCache(false),
        });

        // The client_type in Innertube.create() can be "WEB", "MWEB", "ANDROID", "TV_EMBEDDED", "IOS" maybe?
        // Let's print out the typescript definition or just try a few.
        const clients = ["WEB", "MWEB", "ANDROID", "TV", "TV_EMBEDDED", "IOS", "YTMUSIC", "YTMUSIC_ANDROID"];

        for (const client of clients) {
            try {
                console.log("----");
                console.log("Client:", client);
                const info = await yt.getBasicInfo("dQw4w9WgXcQ", client);

                const allFormats = [
                    ...(info.streaming_data?.adaptive_formats || []),
                    ...(info.streaming_data?.formats || [])
                ];

                console.log("Formats:", allFormats.length);
                const withUrl = allFormats.filter(f => !!f.url);
                console.log("With URL (no decipher needed):", withUrl.length);
                if (withUrl.length > 0) {
                    console.log("SUCCESS!", withUrl[0].url.slice(0, 100));
                }
            } catch (e) {
                console.log("Failed:", e.message);
            }
        }
    } catch (e) { console.error("Create Error:", e.stack); }
}
test();

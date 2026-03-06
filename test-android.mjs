import Innertube, { UniversalCache } from "youtubei.js";

async function test() {
    try {
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
            client_type: "ANDROID" // TV_EMBEDDED or ANDROID
        });

        console.log("Fetching basic info for ANDROID...");
        const info = await yt.getBasicInfo("dQw4w9WgXcQ", "ANDROID");

        const allFormats = [
            ...(info.streaming_data?.adaptive_formats || []),
            ...(info.streaming_data?.formats || [])
        ];

        console.log("Formats:", allFormats.length);

        const withUrl = allFormats.filter((f) => !!f.url);
        console.log("With URL:", withUrl.length);

        if (withUrl.length > 0) {
            const url = withUrl[0].url;
            console.log("Success! URL:", url.slice(0, 50));

            const res = await fetch(url, { method: "HEAD" });
            console.log("HTTP status via ANDROID:", res.status);
        }
    } catch (e) { console.error("Error:", e.stack); }
}
test();

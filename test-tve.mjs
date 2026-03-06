import Innertube, { UniversalCache } from "youtubei.js";

async function test() {
    try {
        const yt = await Innertube.create({
            retrieve_player: false,
            generate_session_locally: true,
            cache: new UniversalCache(false),
            client_type: "TV_EMBEDDED"
        });

        console.log("Fetching basic info for TV_EMBEDDED...");
        const info = await yt.getBasicInfo("dQw4w9WgXcQ", "TV_EMBEDDED");

        const allFormats = [
            ...(info.streaming_data?.adaptive_formats || []),
            ...(info.streaming_data?.formats || [])
        ];
        console.log("Formats:", allFormats.length);

        const withUrl = allFormats.filter(f => !!f.url);
        console.log("With URL:", withUrl.length);

        if (withUrl.length > 0) {
            const format = withUrl.find(f => f.mime_type.includes('audio')) || withUrl[0];
            console.log("Success! Audio URL:", format.url.slice(0, 50));

            const res = await fetch(format.url, { method: "HEAD" });
            console.log("HTTP status via TV_EMBEDDED:", res.status);
        }
    } catch (e) { console.error("Error:", e.stack); }
}
test();

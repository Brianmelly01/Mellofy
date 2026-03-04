import Innertube, { UniversalCache } from "youtubei.js";

async function test() {
    try {
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
        });

        console.log("Fetching basic info...");
        const info = await yt.getBasicInfo("dQw4w9WgXcQ");
        console.log(`Title: ${info.basic_info?.title}`);

        console.log("Trying download...");
        const stream = await info.download({ type: "audio", quality: "best", format: "mp4" });
        const reader = stream.getReader();
        const { value } = await reader.read();
        reader.cancel();
        console.log(`Success! First chunk length: ${value?.byteLength}`);
    } catch (e) {
        console.error(`Error: ${e.message}`, e.stack);
    }
}
test();

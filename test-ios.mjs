import Innertube, { UniversalCache } from "youtubei.js";

async function test() {
    console.log("Creating Innertube with IOS client...");
    const yt = await Innertube.create({
        retrieve_player: false,
        generate_session_locally: true,
        cache: new UniversalCache(false),
        client_type: "IOS", // iOS client uses HLS (m3u8) usually
    });

    const info = await yt.getInfo("dQw4w9WgXcQ");

    console.log("HLS Manifest URL:", info.streaming_data?.hls_manifest_url);

    if (info.streaming_data?.hls_manifest_url) {
        // let's try to fetch the manifest
        const manifest = await fetch(info.streaming_data.hls_manifest_url).then(r => r.text());
        console.log("Manifest start:");
        console.log(manifest.slice(0, 300));
    }
}
test().catch(e => console.error(e));

import Innertube, { UniversalCache, Platform } from "youtubei.js";
import { Jinter } from "jintr";

(Platform.shim).eval = (data, env) => {
    const jinter = new Jinter();
    for (const [key, val] of Object.entries(env)) jinter.scope.set(key, val);
    jinter.evaluate(data.script);
    const result = {};
    for (const [key] of Object.entries(env)) result[key] = jinter.scope.get(key);
    return result;
};

async function testVideo() {
    const yt = await Innertube.create({
        retrieve_player: true,
        generate_session_locally: true,
        cache: new UniversalCache(false)
    });

    const info = await yt.getBasicInfo("jNQXAC9IVRw");
    const allFormats = [
        ...(info.streaming_data?.adaptive_formats || []),
        ...(info.streaming_data?.formats || [])
    ];

    const combined = allFormats.filter(f => f.has_video && f.has_audio);
    console.log("COMBINED AUDIO+VIDEO FORMATS:");
    for (const f of combined) {
        console.log(`- ${f.mime_type} (${f.quality}): has url? ${!!f.url}, has signatureCipher? ${!!f.signature_cipher}`);
    }

    const videoOnly = allFormats.filter(f => f.has_video && !f.has_audio);
    console.log("\nVIDEO-ONLY FORMATS:");
    for (const f of videoOnly) {
        console.log(`- ${f.mime_type} (${f.quality}): has url? ${!!f.url}, has signatureCipher? ${!!f.signature_cipher}`);
    }
}
testVideo();

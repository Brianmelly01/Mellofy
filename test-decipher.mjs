import { Innertube, UniversalCache, Platform } from 'youtubei.js';
import { Jinter } from 'jintr';

async function testJintr() {
    console.log("Creating Innertube...");
    const yt = await Innertube.create({
        retrieve_player: true,
        generate_session_locally: true,
        cache: new UniversalCache(false),
    });

    // Patch the eval function to use Jintr after Platform is loaded
    Platform.shim.eval = (data, env) => {
        const jinter = new Jinter(data.script);
        // Inject environment variables into scope
        for (const [key, val] of Object.entries(env)) {
            jinter.scope.set(key, val);
        }
        jinter.evaluate(data.script);
        // Read results back from scope
        const result = {};
        for (const [key] of Object.entries(env)) {
            result[key] = jinter.scope.get(key);
        }
        return result;
    };

    console.log("Getting info...");
    const info = await yt.getBasicInfo("dQw4w9WgXcQ");

    const allFormats = [
        ...(info.streaming_data?.adaptive_formats || []),
        ...(info.streaming_data?.formats || [])
    ];

    console.log("Total formats:", allFormats.length);

    const combined = allFormats.filter(f => f.has_video && f.has_audio);
    if (combined.length > 0) {
        try {
            const deciphered = await combined[0].decipher(yt.session.player);
            console.log("Deciphered URL:", deciphered?.slice(0, 100) + "...");
        } catch (e) {
            console.error("Decipher error:", e.message.slice(0, 200));
        }
    }
}
testJintr();

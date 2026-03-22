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

async function testExtractViaYtjs(videoId, type) {
    const yt = await Innertube.create({
        retrieve_player: true,
        generate_session_locally: true,
        cache: new UniversalCache(false)
    });
    const info = await yt.getBasicInfo(videoId);
    const allFormats = [
        ...(info.streaming_data?.adaptive_formats || []),
        ...(info.streaming_data?.formats || [])
    ];
    const title = info.basic_info?.title || "download";

    if (type === "video") {
        const combined = allFormats.filter(f => f.has_video && f.has_audio);
        combined.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        for (const fmt of combined) {
            try {
                const url = fmt.url || await fmt.decipher(yt.session.player);
                if (url) {
                    console.log("Returned combined URL:", url.substring(0, 80) + "...");
                    return { url, title };
                }
            } catch (e) {
                console.log("Combined format decipher failed:", e.message);
                continue;
            }
        }

        console.log("Falling back to video-only track...");
        const videoOnly = allFormats.filter(f => f.has_video);
        videoOnly.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        for (const fmt of videoOnly) {
            try {
                const url = fmt.url || await fmt.decipher(yt.session.player);
                if (url) {
                    console.log("Returned video-only URL:", url.substring(0, 80) + "...");
                    return { url, title };
                }
            } catch (e) {
                console.log("Video-only format decipher failed:", e.message);
                continue;
            }
        }
    }
}
testExtractViaYtjs("fJ9rUzIMcZQ", "video");

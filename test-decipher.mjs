import Innertube, { UniversalCache } from "youtubei.js";

async function manualDecipher() {
    try {
        console.log("Initializing Innertube...");
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
            client_type: "WEB" // WEB client usually requires deciphering
        });

        console.log("Fetching basic info...");
        const info = await yt.getBasicInfo("dQw4w9WgXcQ");

        const formats = info.streaming_data?.formats || [];
        const adaptive = info.streaming_data?.adaptive_formats || [];
        const allStreams = [...formats, ...adaptive];

        const audio = allStreams.find(f => f.mime_type?.includes("audio"));
        if (!audio) {
            console.log("No audio formats found.");
            return;
        }

        console.log("Found audio format. Deciphering...");
        try {
            // decipher() is a method on the Format object in youtubei.js!
            // Wait, does it internally require the player? Yes, `yt.session.player.decipher(audio.url, audio.signature_cipher)`
            audio.decipher(yt.session.player);

            console.log("Deciphered URL:", audio.url.slice(0, 100));

            // let's test fetching it
            const res = await fetch(audio.url, { method: 'HEAD' });
            console.log("URL fetch status:", res.status);
        } catch (e) {
            console.error("Decipher err:", e.message);
        }
    } catch (e) {
        console.error("Init err:", e.message);
    }
}
manualDecipher();

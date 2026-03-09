import { Innertube, UniversalCache } from 'youtubei.js';

async function testExtraction() {
    console.log("Creating Innertube...");
    const yt = await Innertube.create({
        retrieve_player: true,
        generate_session_locally: true,
        cache: new UniversalCache(false)
    });
    console.log("Getting info...");
    const info = await yt.getBasicInfo("dQw4w9WgXcQ");

    // Choose combined video+audio
    try {
        const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
        const url = format.decipher(yt.session.player);
        console.log("Deciphered URL:", url.slice(0, 100));
    } catch (e) {
        console.log("Error choosing combined format:", e.message);
    }
}
testExtraction();

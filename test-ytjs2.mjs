// Test youtubei.js stream() / download() which runs internal decipher
import Innertube, { UniversalCache } from "youtubei.js";

const VIDEO_ID = "dQw4w9WgXcQ";

// Test the yt.download() method which properly deciphers URLs internally
const clients = ["MWEB", "ANDROID"];

for (const clientName of clients) {
    try {
        console.log(`\nTrying stream via ${clientName}...`);
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
            client_type: clientName,
        });

        const info = await yt.getInfo(VIDEO_ID);
        console.log(`  getInfo OK, formats: ${info.streaming_data?.adaptive_formats?.length}`);

        // Try to get the deciphered URL via choose_format then decipher
        const audioFormat = info.chooseFormat({ type: "audio", quality: "best" });
        console.log(`  audioFormat: ${audioFormat?.mime_type}`);

        // Try getStreamingURL which handles decipher
        if (audioFormat) {
            const urlObj = await info.getStreamingUrl(audioFormat);
            console.log(`  streaming URL: ${urlObj?.slice(0, 80)}`);
        }
    } catch (e) {
        console.log(`  ${clientName}: ERROR - ${e.message?.slice(0, 150)}`);
    }
}

// Also test the .download() streaming method
try {
    console.log("\nTesting yt.download()...");
    const yt = await Innertube.create({
        retrieve_player: true,
        generate_session_locally: true,
        cache: new UniversalCache(false),
    });
    const info = await yt.getInfo(VIDEO_ID);
    // download returns a ReadableStream
    const stream = await info.download({ type: "audio", quality: "best", format: "mp4" });
    const reader = stream.getReader();
    // Just read first chunk to confirm it works
    const { done, value } = await reader.read();
    reader.cancel();
    console.log(`  download() OK - got ${value?.byteLength || 0} bytes in first chunk`);
} catch (e) {
    console.log(`  download() ERROR - ${e.message?.slice(0, 150)}`);
}

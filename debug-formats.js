const { Innertube, UniversalCache } = require('youtubei.js');

(async () => {
    try {
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
        });

        const info = await yt.getBasicInfo("HX2cgqnbk1A");
        console.log("Title:", info.basic_info.title);

        // Method 1: Use chooseFormat
        console.log("\n=== Method 1: info.chooseFormat() ===");
        try {
            const format = info.chooseFormat({ type: 'audio', quality: 'best' });
            console.log("Chosen format:", format.mime_type, format.bitrate);
            console.log("format.url:", format.url ? String(format.url).substring(0, 100) : "NONE");

            // Try to decipher using the format
            if (!format.url && format.decipher) {
                console.log("Trying decipher on chosen format...");
                try {
                    const url = await format.decipher(yt.session.player);
                    console.log("Decipher result:", String(url).substring(0, 100));
                } catch (e) {
                    console.log("Decipher failed:", e.message);
                }
            }
        } catch (e) {
            console.log("chooseFormat error:", e.message);
        }

        // Method 2: Use yt.download() to get a readable stream
        console.log("\n=== Method 2: yt.download() ===");
        try {
            const stream = await yt.download("HX2cgqnbk1A", {
                type: 'audio',
                quality: 'best',
            });
            console.log("Download stream type:", typeof stream);
            console.log("Stream constructor:", stream?.constructor?.name);
            // Read first chunk to verify it works
            const reader = stream.getReader ? stream.getReader() : null;
            if (reader) {
                const { value, done } = await reader.read();
                console.log("First chunk size:", value?.length, "done:", done);
                reader.cancel();
            } else {
                // Try iterating
                let totalBytes = 0;
                let chunks = 0;
                for await (const chunk of stream) {
                    totalBytes += chunk.length;
                    chunks++;
                    if (chunks >= 3) break;
                }
                console.log(`Read ${chunks} chunks, ${totalBytes} bytes`);
            }
            console.log("SUCCESS! yt.download() works");
        } catch (e) {
            console.log("download error:", e.message);
        }

        // Method 3: getStreamingData and then resolve URL
        console.log("\n=== Method 3: streaming_data with getDecipher ===");
        try {
            const formats = info.streaming_data.adaptive_formats;
            const audioFmt = formats.find(f => f.mime_type?.includes("audio/mp4"));
            if (audioFmt) {
                console.log("Format itag:", audioFmt.itag);
                console.log("Has signature_cipher:", !!audioFmt.signature_cipher);
                console.log("Has cipher:", !!audioFmt.cipher);

                // Try the streaming URL from getStreamingData  
                const streamingInfo = await info.getStreamingInfo();
                console.log("streamingInfo type:", typeof streamingInfo);
                console.log("streamingInfo keys:", Object.keys(streamingInfo || {}).join(', '));
            }
        } catch (e) {
            console.log("Method 3 error:", e.message);
        }

    } catch (error) {
        console.error("Error:", error.message || error);
    }
})();

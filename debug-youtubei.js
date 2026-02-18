const { Innertube } = require('youtubei.js');

(async () => {
    try {
        console.log("Creating Innertube instance...");
        const yt = await Innertube.create();
        console.log("Instance created. Fetching info...");
        const info = await yt.getBasicInfo("HX2cgqnbk1A");
        console.log(`Title: ${info.basic_info.title}`);

        console.log("Checking streaming data...");
        if (info.streaming_data) {
            console.log("Streaming data found!");
            console.log(`Formats: ${info.streaming_data.formats.length}`);
            console.log(`Adaptive: ${info.streaming_data.adaptive_formats.length}`);
        } else {
            console.log("No streaming data.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
})();

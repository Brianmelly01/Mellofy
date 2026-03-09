import { Innertube, UniversalCache } from 'youtubei.js';
import Jintr from 'jintr';

async function testExtraction() {
    console.log("Creating Innertube...");
    const yt = await Innertube.create({
        retrieve_player: true,
        generate_session_locally: true,
        cache: new UniversalCache(false),
        fetch: fetch,
    });

    // Inject evaluator manually if needed, but Innertube usually handles Node environment if imported properly
    // Wait, youtubei.js doesn't bundle a JS engine by default anymore. 
    // Wait, let's see if we can just import from 'youtubei.js/node';
}
testExtraction();

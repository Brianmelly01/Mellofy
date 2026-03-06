import { Innertube, UniversalCache } from "youtubei.js";
import vm from "vm";

async function test() {
    try {
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
            evaluator: (code, env) => {
                return vm.runInContext(code, vm.createContext(env));
            }
        });

        console.log("Fetching basic info + deciphering...");
        const info = await yt.getBasicInfo("dQw4w9WgXcQ");
        const format = info.chooseFormat({ type: 'audio', quality: 'best' });

        if (format && format.url) {
            console.log("Success! Audio URL:", format.url.slice(0, 100));

            const res = await fetch(format.url, { method: "HEAD" });
            console.log("HTTP status:", res.status);
        } else {
            console.log("Format or URL missing:", format);
        }
    } catch (e) { console.error("Error:", e.stack || e.message); }
}
test();

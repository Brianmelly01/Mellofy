import { Innertube, UniversalCache, Platform } from "youtubei.js";
import fs from "fs";

Platform.shim.eval = (data, env) => {
    fs.writeFileSync("test-eval-dump.js", data.output);
    console.log("Dumped data.output to test-eval-dump.js");
    const properties = [];
    if (env.n) { properties.push(`n: exportedVars.nFunction("${env.n}")`) }
    if (env.sig) { properties.push(`sig: exportedVars.sigFunction("${env.sig}")`) }
    const code = `${data.output}\nreturn { ${properties.join(', ')} }`;

    // Instead of vm, let's try direct Function
    return new Function(code)();
};

async function test() {
    try {
        const yt = await Innertube.create({
            retrieve_player: true,
            generate_session_locally: true,
            cache: new UniversalCache(false),
            client_type: "MWEB"
        });

        console.log("Fetching basic info for MWEB...");
        const info = await yt.getBasicInfo("dQw4w9WgXcQ");

        const withUrl = info.streaming_data?.formats?.filter(f => !!f.url || !!f.signature_cipher);
        const format = withUrl?.[0];
        if (format) {
            console.log("Deciphering format...");
            const url = format.decipher(yt.session.player);
            console.log("Success! URL:", url.slice(0, 100));
        }
    } catch (e) { console.error("Error:", e.message); }
}
test();

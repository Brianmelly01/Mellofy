import { Innertube, UniversalCache, Platform } from "youtubei.js";
import vm from "vm";

Platform.shim.eval = (data, env) => {
    const properties = [];
    if (env.n) { properties.push(`n: exportedVars.nFunction("${env.n}")`) }
    if (env.sig) { properties.push(`sig: exportedVars.sigFunction("${env.sig}")`) }
    const code = `${data.output}\nreturn { ${properties.join(', ')} }`;

    // Evaluate in v8 VM context since this is Node not Browser
    return vm.runInNewContext(`(function() { ${code} })()`, {});
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

            const res = await fetch(url, { method: "HEAD" });
            console.log("HTTP status via MWEB:", res.status);
        }
    } catch (e) { console.error("Error:", e.stack); }
}
test();

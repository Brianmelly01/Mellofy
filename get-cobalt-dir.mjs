async function scrapeCobalt() {
    const tests = [
        "https://cobalt.directory/instances.json",
        "https://raw.githubusercontent.com/imputnet/cobalt/master/instances.json",
        "https:// instances.cobalt.best/"
    ];
    try {
        const r = await fetch("https://cobalt.directory/");
        const t = await r.text();
        const urls = [...t.matchAll(/https:\/\/[a-zA-Z0-9.-]+/g)].map(m => m[0]);
        const unique = [...new Set(urls)].filter(u => u.includes("cobalt") || u.includes("api"));
        console.log("Found domains on cobalt.directory:", unique);
    } catch (e) {
        console.log(e.message);
    }
}
scrapeCobalt();

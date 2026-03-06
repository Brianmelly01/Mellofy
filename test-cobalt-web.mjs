async function testToken() {
    try {
        console.log("Fetching cobalt.tools webpage...");
        const res = await fetch("https://cobalt.tools", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36"
            }
        });
        const html = await res.text();

        console.log("Looking for api endpoints or tokens...");
        // Cobalt uses Turnstile, it's very hard to bypass Turnstile inside Node.js fetch... 
        // We'll see if the token is embedded or if it's hitting a particular route
        const matches = html.match(/token/gi) || [];
        console.log(`Found 'token' ${matches.length} times in HTML.`);

        // Find main JS bundles
        const jsFiles = [...html.matchAll(/src="([^"]+\.js(?:\?[^"]+)?)"/g)].map(m => m[1]);
        console.log("JS Files:", jsFiles);

        for (const js of jsFiles) {
            const jsUrl = new URL(js, "https://cobalt.tools").href;
            console.log("Fetching JS:", jsUrl);
            const jsRes = await fetch(jsUrl);
            const jsCode = await jsRes.text();

            // Check for JWT auth logic
            if (jsCode.includes("jwt") || jsCode.includes("Authorization")) {
                console.log("-> Found Auth logic in JS! Length:", jsCode.length);
                const ex = jsCode.substring(jsCode.indexOf("jwt") - 50, jsCode.indexOf("jwt") + 200);
                console.log("Snippet:", ex);
            }
        }
    } catch (e) {
        console.error("Error:", e.stack);
    }
}
testToken();

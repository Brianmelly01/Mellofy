async function testAPI() {
    try {
        console.log("Testing API route for Video on port 3000...");
        const res2 = await fetch("http://localhost:3000/api/download?id=jNQXAC9IVRw&type=video&get_url=true");
        const json2 = await res2.json();
        console.log("API Video JSON:", json2);
    } catch (e) {
        console.error("API error:", e.message);
    }
}
testAPI();

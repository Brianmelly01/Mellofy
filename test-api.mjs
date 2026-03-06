async function test() {
    console.log("Testing AUDIO stream extraction...");
    let res = await fetch("http://localhost:3000/api/download?id=dQw4w9WgXcQ&type=audio&get_url=true");
    let json = await res.json();
    console.log("Audio API Response:", json);

    console.log("\nTesting VIDEO stream extraction...");
    res = await fetch("http://localhost:3000/api/download?id=dQw4w9WgXcQ&type=video&get_url=true");
    json = await res.json();
    console.log("Video API Response:", json);
}
test();

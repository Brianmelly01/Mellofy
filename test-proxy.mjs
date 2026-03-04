const url = "http://localhost:3000/api/download?id=dQw4w9WgXcQ&type=audio&pipe=true";
console.log(`Fetching ${url}...`);

try {
    const res = await fetch(url);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get("content-type")}`);
    console.log(`Content-Disposition: ${res.headers.get("content-disposition")}`);

    if (res.ok && res.body) {
        const reader = res.body.getReader();
        const { done, value } = await reader.read();
        reader.cancel();
        console.log(`First chunk received: ${value ? value.byteLength : 0} bytes`);
    } else {
        const text = await res.text();
        console.log(`Response body: ${text.slice(0, 200)}`);
    }
} catch (e) {
    console.error(`Error: ${e.message}`);
}

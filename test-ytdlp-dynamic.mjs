import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function downloadYtDlp() {
    const isWindows = os.platform() === 'win32';
    const binName = isWindows ? 'yt-dlp.exe' : 'yt-dlp_linux';
    const binaryPath = path.join(os.tmpdir(), binName);

    if (!fs.existsSync(binaryPath)) {
        console.log(`Downloading ${binName} to ${binaryPath}...`);
        const res = await fetch(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binName}`);
        if (!res.ok) throw new Error("Failed to download yt-dlp");
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(binaryPath, Buffer.from(arrayBuffer));
        if (!isWindows) fs.chmodSync(binaryPath, '755');
        console.log("Download complete.");
    } else {
        console.log(`Binary already exists at ${binaryPath}`);
    }
    return binaryPath;
}

async function test() {
    try {
        const binPath = await downloadYtDlp();
        console.log("Executing binary...");
        // Use double quotes for URL for windows compatibility if needed
        const { stdout } = await execPromise(`"${binPath}" -J "https://www.youtube.com/watch?v=dQw4w9WgXcQ"`);
        const output = JSON.parse(stdout);
        console.log("Extracted title:", output.title);
        console.log("Formats:", output.formats.length);
    } catch (e) {
        console.error("Test failed:", e);
    }
}
test();

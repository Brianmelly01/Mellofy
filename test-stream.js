const ytdl = require('@distube/ytdl-core');

async function test() {
    try {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        console.log('Getting info...');
        const info = await ytdl.getInfo(url);

        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');

        console.log('Audio formats:', audioFormats.length);
        console.log('Video formats:', videoFormats.length);

        if (audioFormats[0]) {
            console.log('Best audio:', {
                mimeType: audioFormats[0].mimeType,
                hasUrl: !!audioFormats[0].url,
                quality: audioFormats[0].audioQuality,
                contentLength: audioFormats[0].contentLength,
            });
        }

        if (videoFormats[0]) {
            console.log('Best video:', {
                mimeType: videoFormats[0].mimeType,
                hasUrl: !!videoFormats[0].url,
                quality: videoFormats[0].qualityLabel,
                contentLength: videoFormats[0].contentLength,
            });
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();

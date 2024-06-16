const puppeteer = require('puppeteer');

const userAgents = [
    // Windows User Agents
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:89.0) Gecko/20100101 Firefox/89.0',

    // macOS User Agents
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',

    // Android User Agents
    'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',

    // iOS User Agents
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function watchVideo(url) {
    const userAgent = getRandomUserAgent();
    const browser = await puppeteer.launch({
        headless: true, // Set to true for headless mode
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'
            // ,'--proxy-server=socks5://localhost:9050'
        ],
        timeout: 0 // Disable timeout for launching the browser
    });

    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    page.setDefaultNavigationTimeout(60000); // Set navigation timeout to 60 seconds
    page.setDefaultTimeout(60000); // Set default timeout for all Puppeteer operations to 60 seconds

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Attempt to auto-play the video
        const duration = await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                const video = document.querySelector('video');
                if (video) {
                    video.muted = true; // Mute the video to avoid auto-play restrictions
                    video.play()
                        .then(() => {
                            resolve(video.duration);
                        })
                        .catch(err => reject(`Error playing video: ${err.message}`));
                } else {
                    reject('No video element found.');
                }
            });
        });

        console.log(`Video duration: ${duration} seconds`);

        // Wait for the video to finish playing
        await new Promise(resolve => setTimeout(resolve, duration * 1000));

        console.log('Video watched completely!');
    } catch (error) {
        console.error(`Error: ${error}`);
    } finally {
        await browser.close();
    }
}

(async () => {
    const videoUrl = 'https://www.youtube.com/watch?v=HzdneWQRNgw'; // Replace with your video URL
    const repeatCount = 10000; // Number of times to repeat

    for (let i = 0; i < repeatCount; i++) {
        console.log(`Watching video... ${i + 1} / ${repeatCount}`);
        await watchVideo(videoUrl);
        console.log(`Completed watch ${i + 1}`);
    }
})();
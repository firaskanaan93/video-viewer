const puppeteer = require('puppeteer');
const { getVideoURL, incrementViewCount, setVideoDuration, addLog } = require('./index');
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

// Function to fetch IP address
async function getIpAddress(page) {
    try {
        await page.goto('https://api.myip.com', { waitUntil: 'networkidle2' });
        const ipInfo = await page.evaluate(() => {
            return JSON.parse(document.body.innerText);
        });
        return ipInfo.ip;
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return 'Unknown';
    }
}

// Function to watch video and restart task immediately after finishing
async function watchVideo(instanceId) {
    while (true) {
        const videoURL = getVideoURL();
        addLog(`Instance ${instanceId}: Checking video URL: ${videoURL}`);

        if (videoURL) {
            try {
                const userAgent = getRandomUserAgent();
                addLog(`Instance ${instanceId}: Using User Agent: ${userAgent}`);

                const browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--proxy-server=socks5://tor-proxy:9050' // Use SOCKS5 proxy on port 9050
                    ],
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH // Use installed Chromium
                });

                const page = await browser.newPage();
                await page.setUserAgent(userAgent);
                const ipAddress = await getIpAddress(page);
                addLog(`Instance ${instanceId}: Using IP address: ${ipAddress}`);

                await page.goto(videoURL, { waitUntil: 'networkidle2', timeout: 120000 });

                const duration = await page.evaluate(() => {
                    return new Promise((resolve, reject) => {
                        const video = document.querySelector('video');
                        if (video) {
                            video.muted = true;
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

                setVideoDuration(duration);
                addLog(`Instance ${instanceId}: Video duration: ${duration} seconds`);

                await new Promise(resolve => setTimeout(resolve, duration * 1000));

                incrementViewCount();
                addLog(`Instance ${instanceId}: View count updated`);

                await browser.close();
            } catch (error) {
                addLog(`Instance ${instanceId}: Error watching video: ${error.message}`);
            }
        } else {
            addLog(`Instance ${instanceId}: No video URL set. Waiting to check again...`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait before retrying
        }
    }
}

// Function to start instances with a delay between them
async function startInstances(concurrentInstances) {
    for (let i = 1; i <= concurrentInstances; i++) {
        watchVideo(i);
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay between starting instances
    }
}

const concurrentInstances = 5; // Number of simultaneous instances
startInstances(concurrentInstances);

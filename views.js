const puppeteer = require('puppeteer');
const { getVideoURL, incrementViewCount, setVideoDuration, addLog } = require('./index');

async function watchVideo() {
    while (true) { // Infinite loop
        const videoURL = getVideoURL();
        addLog(`Checking video URL: ${videoURL}`);

        if (videoURL) {
            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH // Use the installed Chromium
                });

                const page = await browser.newPage();
                await page.goto(videoURL, { waitUntil: 'networkidle2' });

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
                addLog(`Video duration: ${duration} seconds`);

                await new Promise(resolve => setTimeout(resolve, duration * 1000));

                incrementViewCount();
                addLog(`View count updated`);

                await browser.close();
            } catch (error) {
                addLog(`Error watching video: ${error}`);
            }
        } else {
            addLog('No video URL set. Waiting to check again...');
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait before checking again
        }
    }
}

watchVideo();

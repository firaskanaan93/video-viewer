const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

let videoURL = '';
let viewCount = 0;
let videoDuration = 0;
let logs = [];

function addLog(message) {
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message}`);
    if (logs.length > 100) { // Keep the last 100 logs
        logs.shift();
    }
}

app.post('/set-url', (req, res) => {
    videoURL = req.body.url;
    viewCount = 0; // Reset view count when URL changes
    videoDuration = 0; // Reset duration when URL changes
    addLog(`Video URL set to: ${videoURL}`);
    res.redirect('/');
});

app.get('/view-count', (req, res) => {
    res.json({ count: viewCount, duration: videoDuration });
});

app.get('/logs', (req, res) => {
    res.json({ logs });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    addLog('Server started');
});

// Export functions and variables for use in views.js
module.exports = {
    getVideoURL: () => videoURL,
    incrementViewCount: () => {
        viewCount += 1;
        addLog(`View count incremented to: ${viewCount}`);
    },
    setVideoDuration: (duration) => {
        videoDuration = duration;
        addLog(`Video duration set to: ${videoDuration} seconds`);
    },
    addLog
};

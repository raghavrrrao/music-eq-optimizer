// server/routes/audioRoutes.js
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

router.post('/upload', upload.single('audio'), (req, res) => {
    const pythonProcess = spawn('python', [
        path.join(__dirname, '../audio_analysis/analyzer.py'),
        req.file.path
    ]);

    let result = '';
    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Analysis failed' });
        }
        res.json(JSON.parse(result));
    });
});

module.exports = router;
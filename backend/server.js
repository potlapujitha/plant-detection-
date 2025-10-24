// server.js
const express = require('express');
const multer = require('multer');
const exifParser = require('exif-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { classifyImage } = require('./classifier');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(cors());
app.use(express.json());

const authRouter = require('./auth');
app.use('/api', authRouter);

// POST /api/scan -> multipart form-data with "image" file
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No image uploaded' });
    const buffer = req.file.buffer;

    // 1) Try to parse EXIF GPS
    let gps = null;
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      if (result.tags && result.tags.GPSLatitude && result.tags.GPSLongitude) {
        // exif-parser gives GPS in decimal or rational form; tags often are in degrees
        gps = {
          lat: result.tags.GPSLatitude,
          lon: result.tags.GPSLongitude
        };
      }
    } catch (e) {
      // silently ignore exif parse errors
      gps = null;
    }

    // 2) classification
    const outcome = await classifyImage(buffer);

    const response = {
      ok: true,
      isPlant: outcome.isPlant,
      species: outcome.species,
      confidence: Number(outcome.confidence.toFixed(4)),
      exifLocation: gps,
      rawPredictions: outcome.predictions
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// Serve example static files if any
app.use('/examples', express.static(path.join(__dirname, 'examples')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Plant-detection backend running on http://localhost:${PORT}`));

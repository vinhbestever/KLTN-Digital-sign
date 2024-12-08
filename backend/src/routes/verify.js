const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { verifySignature } = require('../utils/verify');
const pool = require('../database'); // PostgreSQL connection

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileBuffer = req.file.buffer;

  try {
    // Compute hash of the uploaded file
    const uploadedFileHash = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    // Fetch the signature from the database using the hash
    const result = await pool.query(
      'SELECT signature FROM files WHERE hash = $1',
      [uploadedFileHash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found in database' });
    }

    const { signature } = result.rows[0];

    // Verify the signature
    const isValid = verifySignature(uploadedFileHash, signature);

    res.json({ isValid });
  } catch (error) {
    console.error('Error verifying file:', error.stack);
    res.status(500).json({ error: 'Failed to verify file' });
  }
});

module.exports = router;

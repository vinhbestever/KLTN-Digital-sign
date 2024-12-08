const express = require('express');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const crypto = require('crypto');
const pool = require('../database'); // PostgreSQL connection
const { signData } = require('../utils/signature');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file || !req.body.x || !req.body.y) {
    return res.status(400).json({ error: 'File and position are required' });
  }

  const { x, y } = req.body;
  const fileBuffer = req.file.buffer; // Get file buffer from memory

  try {
    // Compute hash of the original file
    const fileHash = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    // Sign the hash
    const signature = signData(fileHash);

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(fileBuffer);

    // Modify the PDF (e.g., add signature text)
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    firstPage.drawText('Signed by User', {
      x: parseFloat(x),
      y: firstPage.getHeight() - parseFloat(y), // Adjust for PDF coordinate system
      size: 12,
      color: rgb(1, 0, 0),
    });

    // Save the modified PDF to a buffer
    const signedPdfBytes = await pdfDoc.save();

    // Store the original and signed files, signature, and hash in the database
    const result = await pool.query(
      'INSERT INTO files (file_name, file_content, signed_content, signature, hash) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.file.originalname, fileBuffer, signedPdfBytes, signature, fileHash]
    );

    const fileId = result.rows[0].id;

    res.json({ message: 'File signed successfully', fileId });
  } catch (error) {
    console.error('Error signing file:', error.stack);
    res.status(500).json({ error: 'Failed to sign PDF' });
  }
});

module.exports = router;

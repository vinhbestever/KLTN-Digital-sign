const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const pool = require('../database');
const { signData } = require('../utils/signature');
const { PDFDocument, rgb } = require('pdf-lib');
const { verifySignature } = require('../utils/verify');

const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() }); // Lưu file trong bộ nhớ tạm
const upload = multer({
  dest: 'uploads/', // Thư mục tạm lưu file
});
const authenticate = require('../middleware/authenticate');
const fs = require('fs');
const path = require('path');

router.post('/sign', upload.single('file'), async (req, res) => {
  const fileBuffer = req.file.buffer;
  const userId = req.user.id; // ID người dùng từ token

  try {
    // 1. Lấy khóa riêng tư của người dùng
    const result = await pool.query(
      'SELECT private_key FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const privateKey = result.rows[0].private_key;

    // 2. Ký dữ liệu
    const signature = signData(fileBuffer, privateKey);

    // 3. Tạo file PDF đã ký
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Thêm chữ ký (văn bản) vào PDF
    firstPage.drawText('Signed by User', {
      x: 50,
      y: firstPage.getHeight() - 50,
      size: 12,
    });

    const signedPdfBytes = await pdfDoc.save(); // Lưu nội dung PDF sau khi thêm chữ ký

    const signedHash = crypto
      .createHash('sha256')
      .update(signedPdfBytes)
      .digest('hex');
    console.log('Signed File Hash:', signedHash);

    // 4. Lưu file và chữ ký vào cơ sở dữ liệu
    const insertResult = await pool.query(
      'INSERT INTO files (file_name, file_content, signed_content, signature, hash, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [
        req.file.originalname,
        fileBuffer,
        signedPdfBytes,
        signature,
        signedHash,
        userId,
      ]
    );

    const fileId = insertResult.rows[0].id;

    res.json({ message: 'File signed successfully', fileId });
  } catch (error) {
    console.error('Error signing file:', error.stack);
    res.status(500).json({ error: 'Failed to sign file' });
  }
});

// Route Verify File
router.post('/verify', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;

    // Hash file uploaded
    const hash = require('crypto')
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    console.log('Hash verify:', hash);

    // Tìm file trong database dựa trên hash
    const result = await pool.query(
      'SELECT signature, hash, user_id FROM files WHERE hash = $1',
      [hash]
    );

    console.log('result', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or not signed' });
    }

    const { signature, user_id } = result.rows[0];

    // Lấy Public Key của user
    const userResult = await pool.query(
      'SELECT public_key FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const publicKey = userResult.rows[0].public_key;

    console.log('publicKey', publicKey, signature);

    // Verify chữ ký
    const isValid = verifySignature(hash, signature, publicKey);

    res.json({ isValid });
  } catch (error) {
    console.error('Error verifying file:', error.stack);
    res.status(500).json({ error: 'Failed to verify file' });
  }
});

// API để lấy danh sách file đã ký
router.get('/signed-files', async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ token

    // Truy vấn danh sách file đã ký của người dùng
    const result = await pool.query(
      'SELECT id, file_name, created_at FROM files WHERE user_id = $1 AND signed_content IS NOT NULL ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching signed files:', error.stack);
    res.status(500).json({ error: 'Failed to fetch signed files' });
  }
});

// API để tải file đã ký
router.get('/download-signed/:id', async (req, res) => {
  const fileId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT file_name, signed_content FROM files WHERE id = $1 AND user_id = $2',
      [fileId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Signed file not found or not authorized' });
    }

    const { file_name: fileName, signed_content: signedContent } =
      result.rows[0];

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(signedContent);
  } catch (error) {
    console.error('Error downloading signed file:', error.stack);
    res.status(500).json({ error: 'Failed to download signed file' });
  }
});

// API Ký nhiều file
router.post(
  '/sign-multiple',
  authenticate,
  upload.array('files', 10),
  async (req, res) => {
    const userId = req.user.id; // Lấy ID user từ token
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
      // Lấy private key của user từ database
      const userQuery = await pool.query(
        'SELECT private_key FROM users WHERE id = $1',
        [userId]
      );
      if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const privateKey = userQuery.rows[0].private_key;

      let signedFiles = [];

      // Lặp qua từng file để ký
      for (const file of files) {
        // Đọc file PDF gốc
        const pdfBytes = fs.readFileSync(file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Thêm chữ ký vào PDF
        firstPage.drawText('Signed by User', { x: 50, y: 50, size: 12 });

        // Lưu PDF sau khi thêm chữ ký
        const signedPdfBytes = await pdfDoc.save();

        // Ký nội dung PDF bằng private key
        const sign = crypto.createSign('SHA256');
        sign.update(signedPdfBytes);
        sign.end();
        const signature = sign.sign(privateKey, 'base64');

        // Lưu file đã ký vào database
        const insertQuery = `
        INSERT INTO signed_files (user_id, original_filename, signed_file)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
        const values = [userId, file.originalname, signedPdfBytes];
        const result = await pool.query(insertQuery, values);

        signedFiles.push({
          id: result.rows[0].id,
          filename: file.originalname,
          signature,
        });

        // Xóa file tạm
        fs.unlinkSync(file.path);
      }

      res
        .status(201)
        .json({ message: 'Files signed successfully', signedFiles });
    } catch (error) {
      console.error('Error signing files:', error);
      res.status(500).json({ error: 'Failed to sign files' });
    }
  }
);
module.exports = router;

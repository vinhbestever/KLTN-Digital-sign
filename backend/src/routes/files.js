const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const pool = require('../database');
const { signData } = require('../utils/signature');
const { PDFDocument, rgb } = require('pdf-lib');
const { verifySignature } = require('../utils/verify');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Lưu file trong bộ nhớ tạm
// const upload = multer({
//   dest: 'uploads/', // Thư mục tạm lưu file
// });
const authenticate = require('../middleware/authenticate');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const forge = require('node-forge');

// Route Verify File
router.post(
  '/verify',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Lấy Public Key của user từ database
      const userQuery = await pool.query(
        'SELECT public_key FROM users WHERE id = $1',
        [userId]
      );
      if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const publicKey = userQuery.rows[0].public_key;

      // Đọc file PDF
      const pdfBytes = fs.readFileSync(file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const fileHashAfter = crypto
        .createHash('sha256')
        .update(pdfBytes)
        .digest('hex');
      console.log('📄 File Hash After Signing:', fileHashAfter);
      // ✅ Lấy chữ ký từ metadata PDF
      const metadata = pdfDoc.getKeywords();
      if (!metadata) {
        return res.status(400).json({ error: 'Signature not found in file' });
      }

      let parsedMetadata;
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (error) {
        return res
          .status(400)
          .json({ error: 'Invalid signature format in file' });
      }

      const { signature } = parsedMetadata;
      if (!signature) {
        return res
          .status(400)
          .json({ error: 'Signature not found in metadata' });
      }

      console.log('signature', signature);

      // ✅ Hash lại nội dung file PDF
      const uploadedHash = crypto
        .createHash('sha256')
        .update(pdfBytes)
        .digest();

      // ✅ Giải mã chữ ký bằng Public Key
      const verify = crypto.createVerify('SHA256');
      verify.update(uploadedHash);
      verify.end();
      const isValid = verify.verify(
        publicKey,
        Buffer.from(signature, 'base64')
      );

      res.json({ isValid });
    } catch (error) {
      console.error('Error verifying file:', error);
      res.status(500).json({ error: 'Failed to verify file' });
    } finally {
      fs.unlinkSync(file.path);
    }
  }
);

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

router.get('/generate-temp-pfx', authenticate, async (req, res) => {
  const userId = req.user.id;
  const tempDir = path.join(__dirname, '../../../frontend/public');

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  try {
    const pfxPassword = 'key-password'; // 🔐 Mật khẩu bảo vệ file PFX

    // 🔹 1. Lấy Private Key từ Database
    const userQuery = await pool.query(
      'SELECT private_key, public_key FROM users WHERE id = $1',
      [userId]
    );
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const privateKeyPem = userQuery.rows[0].private_key;
    const publicKeyPem = userQuery.rows[0].public_key;

    // 🔹 2. Lưu Private Key vào file tạm
    const privateKeyPath = path.join(tempDir, `private-key.pem`);
    fs.writeFileSync(privateKeyPath, privateKeyPem);

    const publicKeyPath = path.join(tempDir, `public-key.pem`);
    fs.writeFileSync(publicKeyPath, publicKeyPem);

    // 🔹 3. Tạo CSR (Certificate Signing Request)
    const csrPath = path.join(tempDir, `csr.pem`);
    execSync(
      `openssl req -new -key ${privateKeyPath} -out ${csrPath} -subj "/C=US/ST=CA/L=SanFrancisco/O=MyCompany/OU=IT/CN=user-${userId}"`
    );

    // 🔹 4. Tạo Self-Signed Certificate
    const certPath = path.join(tempDir, `certificate.pem`);
    execSync(
      `openssl x509 -req -days 365 -in ${csrPath} -signkey ${privateKeyPath} -out ${certPath}`
    );

    // 🔹 5. Tạo file `.pfx`
    const pfxPath = path.join(tempDir, `certificate.pfx`);
    execSync(
      `openssl pkcs12 -export -out ${pfxPath} -inkey ${privateKeyPath} -in ${certPath} -passout pass:${pfxPassword}`
    );

    // 🔹 6. Trả về đường dẫn file `.pfx` & password
    res.json({ pfxPath, pfxPassword });
  } catch (error) {
    console.error('Error generating PFX:', error);
    res.status(500).json({ error: 'Failed to generate PFX' });
  }
});

router.get('/generate-file-to-verify', authenticate, async (req, res) => {
  const tempDir = path.join(__dirname, '../../../frontend/public/verify');

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  try {
    console.log('req', req.query, req.params);

    const { userId } = req.query;

    const pfxPassword = 'key-password'; // 🔐 Mật khẩu bảo vệ file PFX

    // 🔹 1. Lấy Private Key từ Database
    const userQuery = await pool.query(
      'SELECT private_key FROM users WHERE id = $1',
      [userId]
    );
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const privateKeyPem = userQuery.rows[0].private_key;

    // 🔹 2. Lưu Private Key vào file tạm
    const privateKeyPath = path.join(tempDir, `private-key.pem`);
    fs.writeFileSync(privateKeyPath, privateKeyPem);

    // 🔹 3. Tạo CSR (Certificate Signing Request)
    const csrPath = path.join(tempDir, `csr.pem`);
    execSync(
      `openssl req -new -key ${privateKeyPath} -out ${csrPath} -subj "/C=US/ST=CA/L=SanFrancisco/O=MyCompany/OU=IT/CN=user-${userId}"`
    );

    // 🔹 4. Tạo Self-Signed Certificate
    const certPath = path.join(tempDir, `certificate.pem`);
    execSync(
      `openssl x509 -req -days 365 -in ${csrPath} -signkey ${privateKeyPath} -out ${certPath}`
    );

    // 🔹 5. Tạo file `.pfx`
    const pfxPath = path.join(tempDir, `certificate.pfx`);
    execSync(
      `openssl pkcs12 -export -out ${pfxPath} -inkey ${privateKeyPath} -in ${certPath} -passout pass:${pfxPassword}`
    );

    // 🔹 6. Trả về đường dẫn file `.pfx` & password
    res.json({ pfxPath, pfxPassword });
  } catch (error) {
    console.error('Error generating PFX:', error);
    res.status(500).json({ error: 'Failed to generate PFX' });
  }
});

router.post('/delete-temp-files', authenticate, async (req, res) => {
  const frontendPublicPath = path.join(__dirname, '../../../frontend/public');

  try {
    // 🔹 Xóa file `.pfx`, Private Key, CSR & Certificate
    const filesToDelete = [
      `certificate.pfx`,
      `private-key.pem`,
      `csr.pem`,
      `certificate.pem`,
    ];

    filesToDelete.forEach((file) => {
      const filePath = path.join(frontendPublicPath, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    res.json({ message: 'Temporary files deleted successfully' });
  } catch (error) {
    console.error('Error deleting temp files:', error);
    res.status(500).json({ error: 'Failed to delete temp files' });
  }
});

router.post(
  '/save-signed-file',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { originalname } = req.file;
      const fileBuffer = req.file.buffer;

      await pool.query(
        'INSERT INTO signed_files (user_id, file_name, signed_file, signed_at) VALUES ($1, $2, $3, NOW())',
        [userId, originalname, fileBuffer]
      );

      res.json({ message: 'File đã ký được lưu thành công vào database!' });
    } catch (error) {
      console.error('Lỗi khi lưu file đã ký:', error);
      res.status(500).json({ error: 'Lưu file thất bại!' });
    }
  }
);
module.exports = router;

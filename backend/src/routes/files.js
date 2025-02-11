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
const dayjs = require('dayjs');

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
router.get('/signed-files', authenticate, async (req, res) => {
  try {
    const {
      search = '',
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
    } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT id, file_name, signed_at 
      FROM signed_files 
      WHERE file_name ILIKE $1`;

    let queryParams = [`%${search}%`];

    if (startDate && endDate) {
      query += ` AND signed_at BETWEEN $2 AND $3`;
      queryParams.push(startDate, endDate);
    }

    query += ` ORDER BY signed_at DESC LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(pageSize, offset);

    const files = await pool.query(query, queryParams);
    const total = await pool.query(
      `SELECT COUNT(*) FROM signed_files WHERE file_name ILIKE $1`,
      [`%${search}%`]
    );

    res.json({ files: files.rows, total: parseInt(total.rows[0].count) });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách file đã ký:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách file đã ký!' });
  }
});

// API để tải file đã ký
router.get('/download-signed/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;

    const result = await pool.query(
      `SELECT file_name, signed_file FROM signed_files WHERE id = $1`,
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy file đã ký!' });
    }

    const { file_name, signed_file } = result.rows[0];

    res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(signed_file);
  } catch (error) {
    console.error('Lỗi khi tải file đã ký:', error);
    res.status(500).json({ error: 'Lỗi khi tải file đã ký!' });
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

router.get('/statics', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rangeType, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Thiếu userId!' });
    }

    let query;
    let queryParams = [userId, startDate, endDate];

    switch (rangeType) {
      case 'today':
      case 'yesterday':
      case 'custom':
        query = `
          SELECT 'Total' AS period, COUNT(*) AS total_files
          FROM signed_files
          WHERE user_id = $1 AND signed_at BETWEEN $2 AND $3
        `;
        break;

      case 'last7days':
        query = `
          SELECT TO_CHAR(signed_at, 'YYYY-MM-DD') AS period, COUNT(*) AS total_files
          FROM signed_files
          WHERE user_id = $1 AND signed_at BETWEEN $2 AND $3
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      case 'thisMonth':
      case 'lastMonth':
        query = `
          SELECT TO_CHAR(signed_at, 'YYYY-"Week"W') AS period, COUNT(*) AS total_files
          FROM signed_files
          WHERE user_id = $1 AND signed_at BETWEEN $2 AND $3
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      case 'thisYear':
        query = `
          SELECT TO_CHAR(signed_at, 'YYYY-MM') AS period, COUNT(*) AS total_files
          FROM signed_files
          WHERE user_id = $1 AND signed_at BETWEEN $2 AND $3
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      default:
        return res.status(400).json({ error: 'Khoảng thời gian không hợp lệ' });
    }

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi khi lấy thống kê file đã ký:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê!' });
  }
});

router.get('/total-signatures', async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: 'Thiếu userId!' });
    }

    const result = await pool.query(
      `SELECT COUNT(*) AS total FROM signed_files WHERE user_id = $1`,
      [userId]
    );

    res.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error('Lỗi khi lấy tổng số lượt ký:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tổng số lượt ký!' });
  }
});

// API lấy danh sách file đã ký trong 7 ngày gần nhất
router.get('/recent-files', async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: 'Thiếu userId!' });
    }

    const result = await pool.query(
      `SELECT id, file_name, signed_at 
       FROM signed_files 
       WHERE user_id = $1 AND signed_at >= NOW() - INTERVAL '7 days'
       ORDER BY signed_at DESC`,
      [userId]
    );

    res.json({ files: result.rows });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách file gần đây:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách file!' });
  }
});
module.exports = router;

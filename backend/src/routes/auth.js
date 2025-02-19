const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../database'); // PostgreSQL connection
const jwt = require('jsonwebtoken');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const authenticate = require('../middleware/authenticate');

require('dotenv').config();

// Hàm tạo Access Token
const createAccessToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, 'access_secret_key', {
    expiresIn: '15m',
  });
};

// Hàm tạo Refresh Token
const createRefreshToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, 'refresh_secret_key', {
    expiresIn: '7d',
  });
};

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};
// Gửi email qua NodeMailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm tạo chứng chỉ RSA hoặc ECC
const generateCertificate = (email, algorithm) => {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const privateKeyPath = path.join(tempDir, 'private-key.pem');
  const csrPath = path.join(tempDir, 'csr.pem');
  const certificatePath = path.join(tempDir, 'certificate.pem');
  const pfxPath = path.join(tempDir, 'certificate.pfx');
  const pfxPassword = 'key-password';

  if (algorithm === 'RSA') {
    execSync(
      `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out ${privateKeyPath}`
    );
  } else {
    execSync(
      `openssl ecparam -name prime256v1 -genkey -noout -out ${privateKeyPath}`
    );
  }

  execSync(
    `openssl req -new -key ${privateKeyPath} -out ${csrPath} -subj "/CN=${email}"`
  );
  execSync(
    `openssl x509 -req -days 7 -in ${csrPath} -signkey ${privateKeyPath} -out ${certificatePath}`
  );
  execSync(
    `openssl pkcs12 -export -out ${pfxPath} -inkey ${privateKeyPath} -in ${certificatePath} -passout pass:${pfxPassword}`
  );

  const publicKey = fs.readFileSync(certificatePath, 'utf8');
  const privateKey = fs.readFileSync(pfxPath);
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);

  return { publicKey, privateKey, expirationDate };
};

// API Đăng ký
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    if (userQuery.rows.length > 0) {
      const user = userQuery.rows[0];

      if (!user.is_verified) {
        const otp = generateOTP();
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

        await pool.query(
          'UPDATE users SET otp_code = $1, otp_expiration = $2 WHERE email = $3',
          [otp, otpExpiration, email]
        );

        await pool.query(
          `UPDATE users SET otp_code = $1, otp_expiration = $2 WHERE email = $3`,
          [otp, otpExpiration, email]
        );

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Mã OTP Xác Thực Tài Khoản',
          text: `Mã OTP của bạn là: ${otp}. Mã sẽ hết hạn sau 5 phút.`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'OTP mới đã được gửi đến email của bạn!' });
      }

      return res.status(400).json({ error: 'Email đã được đăng ký.' });
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const privateKeyPath = path.join(tempDir, 'private-key.pem');
    const csrPath = path.join(tempDir, 'csr.pem');
    const certificatePath = path.join(tempDir, 'certificate.pem');
    const pfxPath = path.join(tempDir, 'certificate.pfx');

    const { publicKey, privateKey, expirationDate } = generateCertificate(
      email,
      'ECC'
    );

    const passwordHash = await bcrypt.hash(password, 10);

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO users (email, name, password_hash, otp_code, otp_expiration, public_key, private_key, cert_expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        email,
        name,
        passwordHash,
        otpCode,
        otpExpiration,
        publicKey,
        privateKey,
        expirationDate,
      ]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Mã OTP Xác Thực Tài Khoản',
      text: `Mã OTP của bạn là: ${otpCode}. Mã sẽ hết hạn sau 5 phút.`,
    });

    fs.unlinkSync(privateKeyPath);
    fs.unlinkSync(csrPath);
    fs.unlinkSync(certificatePath);
    fs.unlinkSync(pfxPath);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// API tạo tài khoản
router.post('/create-account', authenticate, async (req, res) => {
  const { email, password, name, role, algorithm } = req.body;

  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    if (userQuery.rows.length > 0) {
      return res.status(400).json({ error: 'Email đã được đăng ký.' });
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const privateKeyPath = path.join(tempDir, 'private-key.pem');
    const csrPath = path.join(tempDir, 'csr.pem');
    const certificatePath = path.join(tempDir, 'certificate.pem');
    const pfxPath = path.join(tempDir, 'certificate.pfx');

    const { publicKey, privateKey, expirationDate } = generateCertificate(
      email,
      algorithm
    );

    const passwordHash = await bcrypt.hash(password, 10);

    const otpCode = null;
    const otpExpiration = null;

    await pool.query(
      'INSERT INTO users (email, name, password_hash, otp_code, otp_expiration, public_key, private_key, is_verified, role, cert_expires_at, algorithm) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [
        email,
        name,
        passwordHash,
        otpCode,
        otpExpiration,
        publicKey,
        privateKey,
        true,
        role,
        expirationDate,
        algorithm,
      ]
    );

    fs.unlinkSync(privateKeyPath);
    fs.unlinkSync(csrPath);
    fs.unlinkSync(certificatePath);
    fs.unlinkSync(pfxPath);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// API xác thực OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy email' });
    }

    if (user.otp_code !== otp || new Date() > new Date(user.otp_expiration)) {
      return res.status(400).json({ error: 'OTP không đúng hoặc bị hết hạn' });
    }

    await pool.query(
      'UPDATE users SET is_verified = true, otp_code = NULL, otp_expiration = NULL WHERE email = $1',
      [email]
    );

    res.status(200).json({ message: 'Xác thực thành công email' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// API Login tài khoản
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res
        .status(400)
        .json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    if (!user.is_verified) {
      return res.status(400).json({ error: 'Email chưa được xác nhận' });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    res
      .status(200)
      .json({ message: 'Đăng nhập thành công', accessToken, refreshToken });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// API Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy email' });
    }

    const newPassword = crypto.randomBytes(8).toString('hex'); // Mật khẩu 8 ký tự ngẫu nhiên
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [
      hashedPassword,
      email,
    ]);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your New Password',
      text: `Your new password is: ${newPassword}\nPlease change it after logging in.`,
    });

    res
      .status(200)
      .json({ message: 'New password has been sent to your email.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// API Refresh Token
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, 'refresh_secret_key');

    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      'access_secret_key',
      { expiresIn: '15m' }
    );

    res.json({ token: newAccessToken });
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// API lấy khoá của người dùng
router.get('/get-key/:userId/:fileType', async (req, res) => {
  try {
    const { userId, fileType } = req.params;

    if (!['private_key', 'public_key'].includes(fileType)) {
      return res.status(400).json({ error: 'Loại khoá không hợp lệ!' });
    }

    const query = `SELECT ${fileType} FROM users WHERE id = $1`;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0 || !result.rows[0][fileType]) {
      return res.status(404).json({ error: 'Không tìm thấy file!' });
    }

    const fileData = result.rows[0][fileType];
    const fileExtension = fileType === 'private_key' ? 'pfx' : 'pem';
    const fileName = `${fileType}-${userId}.${fileExtension}`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader(
      'Content-Type',
      fileType === 'private_key'
        ? 'application/x-pkcs12'
        : 'application/x-pem-file'
    );

    if (fileType === 'private_key') {
      res.send(Buffer.from(fileData, 'base64'));
    } else {
      res.send(fileData);
    }
  } catch (error) {
    console.error('Lỗi khi tải file:', error);
    res.status(500).json({ error: 'Lỗi khi tải file!' });
  }
});

// API gửi lại OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const userQuery = `SELECT id, is_verified FROM users WHERE email = $1`;
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email không tồn tại!' });
    }

    if (userResult.rows[0].is_verified) {
      return res.status(400).json({ error: 'Tài khoản đã xác thực!' });
    }

    const newOTP = generateOTP();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `UPDATE users SET otp_code = $1, otp_expiration = $2 WHERE email = $3`,
      [newOTP, otpExpiration, email]
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Mã OTP Xác Thực Tài Khoản',
      text: `Mã OTP của bạn là: ${newOTP}. Mã sẽ hết hạn sau 5 phút.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP mới đã được gửi đến email của bạn!' });
  } catch (error) {
    console.error('Lỗi khi gửi lại OTP:', error);
    res.status(500).json({ error: 'Lỗi khi gửi lại OTP!' });
  }
});

// API Admin duyệt yêu cầu cấp lại chứng chỉ
router.post('/renew-cert/:userId/:type', authenticate, async (req, res) => {
  try {
    const { userId, type } = req.params;
    const user = await pool.query(
      'SELECT email, algorithm FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại' });
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const privateKeyPath = path.join(tempDir, 'private-key.pem');
    const csrPath = path.join(tempDir, 'csr.pem');
    const certificatePath = path.join(tempDir, 'certificate.pem');
    const pfxPath = path.join(tempDir, 'certificate.pfx');

    const { email } = user.rows[0];
    const { publicKey, privateKey, expirationDate } = generateCertificate(
      email,
      type
    );

    await pool.query(
      'UPDATE users SET public_key = $1, private_key = $2, cert_expires_at = $3, algorithm = $4 WHERE id = $5',
      [publicKey, privateKey, expirationDate, type, userId]
    );

    fs.unlinkSync(privateKeyPath);
    fs.unlinkSync(csrPath);
    fs.unlinkSync(certificatePath);
    fs.unlinkSync(pfxPath);

    res.json({ message: 'Cấp chứng chỉ mới thành công' });
  } catch (error) {
    console.error('Lỗi khi cấp lại chứng chỉ:', error);
    res.status(500).json({ error: 'Lỗi khi cấp lại chứng chỉ' });
  }
});

module.exports = router;

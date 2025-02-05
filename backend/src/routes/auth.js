const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../database'); // PostgreSQL connection
const jwt = require('jsonwebtoken');
const router = express.Router();

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

// Gửi email qua NodeMailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API Đăng ký
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Kiểm tra email đã tồn tại chưa
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash mật khẩu
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo mã OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // OTP có hiệu lực trong 10 phút

    // Sinh cặp khóa RSA
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048, // Độ dài khóa
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const certificate = `
    -----BEGIN CERTIFICATE-----
    Owner: ${email}
    PublicKey: ${publicKey}
    Issuer: My Digital Signing System
    -----END CERTIFICATE-----
  `;

    // Lưu thông tin người dùng
    await pool.query(
      'INSERT INTO users (email, password_hash, otp_code, otp_expiration, public_key, private_key, certificate) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        email,
        passwordHash,
        otpCode,
        otpExpiration,
        publicKey,
        privateKey,
        certificate,
      ]
    );

    // Gửi OTP qua email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      text: `Your OTP code is: ${otpCode}`,
    });

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Tìm người dùng
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Kiểm tra OTP
    if (user.otp_code !== otp || new Date() > new Date(user.otp_expiration)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Cập nhật trạng thái xác minh
    await pool.query(
      'UPDATE users SET is_verified = true, otp_code = NULL, otp_expiration = NULL WHERE email = $1',
      [email]
    );

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm người dùng
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(400).json({ error: 'Email not verified' });
    }

    // Tạo token
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    res
      .status(200)
      .json({ message: 'Login successful', accessToken, refreshToken });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// API Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra email có tồn tại
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Tạo mật khẩu mới ngẫu nhiên
    const newPassword = crypto.randomBytes(8).toString('hex'); // Mật khẩu 8 ký tự ngẫu nhiên
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới vào cơ sở dữ liệu
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [
      hashedPassword,
      email,
    ]);

    // Gửi mật khẩu mới qua email
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
router.post('/api/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    // Xác minh Refresh Token
    const decoded = jwt.verify(refreshToken, 'refresh_secret_key');

    // Tạo Access Token mới
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
module.exports = router;

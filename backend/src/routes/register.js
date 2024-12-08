const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../database'); // PostgreSQL connection

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Kiểm tra thông tin bắt buộc
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo cặp khóa RSA
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // Lưu thông tin vào cơ sở dữ liệu
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, email, private_key, public_key) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, passwordHash, email, privateKey, publicKey]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error('Error registering user:', error.stack);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database'); // PostgreSQL connection

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret_key';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Kiểm tra thông tin bắt buộc
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    // Tìm người dùng trong cơ sở dữ liệu
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [
      username,
    ]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Xác minh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Tạo JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error.stack);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const pool = require('../database');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Lưu file trong bộ nhớ tạm
const authenticate = require('../middleware/authenticate');
const bcrypt = require('bcrypt');

router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userQuery = await pool.query(
      'SELECT id, name, avatar, email FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại!' });
    }

    const user = userQuery.rows[0];

    const avatarUrl = user.avatar
      ? `/api/avatar/${userId}`
      : '/default-avatar.png';

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: avatarUrl,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin user:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin user!' });
  }
});

router.put('/user', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, password } = req.body;
    let updatedFields = [];
    let queryValues = [];

    if (name) {
      updatedFields.push('name = $1');
      queryValues.push(name);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.push('password = $2');
      queryValues.push(hashedPassword);
    }

    if (req.file) {
      updatedFields.push('avatar = $3');
      queryValues.push(req.file.buffer);
    }

    if (updatedFields.length === 0) {
      return res
        .status(400)
        .json({ error: 'Không có thông tin nào để cập nhật!' });
    }

    queryValues.push(userId);
    const query = `UPDATE users SET ${updatedFields.join(', ')} WHERE id = $${
      queryValues.length
    }`;

    await pool.query(query, queryValues);

    res.json({ message: 'Cập nhật thông tin thành công!' });
  } catch (error) {
    console.error('Lỗi khi cập nhật user:', error);
    res.status(500).json({ error: 'Cập nhật thất bại!' });
  }
});

router.delete('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Tài khoản đã bị xóa thành công!' });
  } catch (error) {
    console.error('Lỗi khi xóa user:', error);
    res.status(500).json({ error: 'Xóa tài khoản thất bại!' });
  }
});

router.get('/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const avatarQuery = await pool.query(
      'SELECT avatar FROM users WHERE id = $1',
      [userId]
    );

    if (avatarQuery.rows.length === 0 || !avatarQuery.rows[0].avatar) {
      return res.redirect('/default-avatar.png');
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(avatarQuery.rows[0].avatar);
  } catch (error) {
    console.error('Lỗi khi lấy avatar:', error);
    res.status(500).json({ error: 'Lỗi khi lấy avatar!' });
  }
});

module.exports = router;

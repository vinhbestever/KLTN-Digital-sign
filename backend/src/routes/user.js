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
      'SELECT id, name, avatar, email, phone, address, gender, dob, role FROM users WHERE id = $1',
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
      phone: user.phone,
      address: user.address,
      gender: user.gender,
      dob: user.dob,
      role: user.role,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin user:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin user!' });
  }
});

router.put('/user', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, gender, dob } = req.body;
    let updatedFields = [];
    let queryValues = [];

    if (name) {
      updatedFields.push('name = $1');
      queryValues.push(name);
    }

    if (phone) {
      updatedFields.push('phone = $2');
      queryValues.push(phone);
    }

    if (address) {
      updatedFields.push('address = $3');
      queryValues.push(address);
    }
    if (gender) {
      updatedFields.push('gender = $4');
      queryValues.push(gender);
    }
    if (dob) {
      updatedFields.push('dob = $5');
      queryValues.push(dob);
    }

    if (updatedFields.length === 0) {
      return res
        .status(400)
        .json({ error: 'Không có thông tin nào để cập nhật!' });
    }

    const query = `UPDATE users SET ${updatedFields.join(
      ', '
    )} WHERE id = ${userId}`;

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

router.get('/avatar/:userId', authenticate, async (req, res) => {
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

router.get('/users', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', filterVerified } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT id, avatar, name, email, phone, address, gender, dob, role, is_verified 
      FROM users 
      WHERE name ILIKE $1`;

    let queryParams = [`%${search}%`];

    // 🔹 Nếu `filterVerified = true`, chỉ lấy user đã xác thực
    if (filterVerified === 'true') {
      query += ` AND is_verified = true`;
    }

    query += ` ORDER BY id LIMIT $2 OFFSET $3`;
    queryParams.push(pageSize, offset);

    const users = await pool.query(query, queryParams);
    const total = await pool.query(
      `SELECT COUNT(*) FROM users WHERE name ILIKE $1 ${
        filterVerified === 'true' ? 'AND is_verified = true' : ''
      }`,
      [`%${search}%`]
    );

    res.json({ users: users.rows, total: parseInt(total.rows[0].count) });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách user:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách user!' });
  }
});

router.put('/change-password', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: 'Mật khẩu mới và xác nhận mật khẩu không khớp!' });
    }

    const userQuery = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại!' });
    }

    const storedPassword = userQuery.rows[0].password_hash;

    const isMatch = await bcrypt.compare(oldPassword, storedPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu cũ không chính xác!' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      hashedNewPassword,
      userId,
    ]);

    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi khi đổi mật khẩu!' });
  }
});

router.put('/users/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, address, gender, dob, role } = req.body;
    const { id } = req.params;

    const query = `
      UPDATE users 
      SET name = $1, phone = $2, address = $3, gender = $4, dob = $5, role = $6 
      WHERE id = $7 RETURNING *`;

    const result = await pool.query(query, [
      name,
      phone,
      address,
      gender,
      dob,
      role,
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User không tồn tại!' });
    }

    res.json({ message: 'Cập nhật user thành công!', user: result.rows[0] });
  } catch (error) {
    console.error('Lỗi khi cập nhật user:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật user!' });
  }
});

router.delete('/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Xóa user thành công!' });
  } catch (error) {
    console.error('Lỗi khi xóa user:', error);
    res.status(500).json({ error: 'Lỗi khi xóa user!' });
  }
});
module.exports = router;

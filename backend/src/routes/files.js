const express = require('express');
const multer = require('multer');
const pool = require('../database');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const authenticate = require('../middleware/authenticate');

// API để lấy danh sách file đã ký trên hệ thống
router.get('/signed-files-all', authenticate, async (req, res) => {
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

// API để lấy danh sách file đã ký trên hệ thống
router.get('/signed-files', authenticate, async (req, res) => {
  try {
    const {
      search = '',
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
    } = req.query;

    const userId = req.user.id;

    const offset = (page - 1) * pageSize;

    let query = `
      SELECT id, file_name, signed_at 
      FROM signed_files 
      WHERE user_id = $1 AND file_name ILIKE $2`;

    let queryParams = [userId, `%${search}%`];

    if (startDate && endDate) {
      query += ` AND signed_at BETWEEN $3 AND $4`;
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

//API lưu file đã ký
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

// API thống kê file ký theo thời gian cho từng user
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

// API thống kê file ký theo thời gian cho toàn bộ hệ thống
router.get('/statics-all', authenticate, async (req, res) => {
  try {
    const { rangeType, startDate, endDate } = req.query;

    let query;
    let queryParams = [startDate, endDate];

    switch (rangeType) {
      case 'today':
      case 'yesterday':
      case 'custom':
        query = `
          SELECT 'Total' AS period, COUNT(*) AS total_files
          FROM signed_files
          WHERE signed_at BETWEEN $1 AND $2
        `;
        break;

      case 'last7days':
        query = `
          SELECT TO_CHAR(signed_at, 'YYYY-MM-DD') AS period, COUNT(*) AS total_files
          FROM signed_files
          WHERE signed_at BETWEEN $1 AND $2
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      case 'thisMonth':
      case 'lastMonth':
        query = `
          SELECT TO_CHAR(signed_at, 'YYYY-"Week"W') AS period, COUNT(*) AS total_files
          FROM signed_files
          WHERE signed_at BETWEEN $1 AND $2
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      case 'thisYear':
        query = `
          SELECT TO_CHAR(signed_at, 'YYYY-MM') AS period, COUNT(*) AS total_files
          FROM signed_files
          WHERE signed_at BETWEEN $1 AND $2
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

// API tổng file ký của người dùng
router.get('/total-signatures', authenticate, async (req, res) => {
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

// API tổng file ký của hệ thống
router.get('/total-signatures-all', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS total FROM signed_files`,
      []
    );

    res.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error('Lỗi khi lấy tổng số lượt ký:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tổng số lượt ký!' });
  }
});

// API lấy danh sách file đã ký của người dùng trong 7 ngày gần nhất
router.get('/recent-files', authenticate, async (req, res) => {
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

// API lấy danh sách file đã ký của hệ thống trong 7 ngày gần nhất
router.get('/recent-files-all', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, file_name, signed_at 
       FROM signed_files 
       WHERE signed_at >= NOW() - INTERVAL '7 days'
       ORDER BY signed_at DESC`,
      []
    );

    res.json({ files: result.rows });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách file gần đây:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách file!' });
  }
});

router.get('/signed-files-export', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    const query = `
      SELECT id, file_name, signed_at
      FROM signed_files
      WHERE user_id = $1
      AND signed_at BETWEEN $2 AND $3
      ORDER BY signed_at DESC
    `;

    const result = await pool.query(query, [userId, startDate, endDate]);

    res.json({ files: result.rows });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu xuất báo cáo:', error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu!' });
  }
});

router.get('/signed-files-export-all', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT id, file_name, signed_at
      FROM signed_files
      WHERE signed_at BETWEEN $1 AND $2
      ORDER BY signed_at DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);

    res.json({ files: result.rows });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu xuất báo cáo:', error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu!' });
  }
});
module.exports = router;

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret_key';

const authenticate = (req, res, next) => {
  // Lấy token từ header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // Lấy token từ "Bearer <token>"
  if (!token) {
    return res
      .status(401)
      .json({ error: 'Access denied. Invalid token format.' });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Lưu thông tin user vào req
    next(); // Chuyển đến route tiếp theo
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = authenticate;

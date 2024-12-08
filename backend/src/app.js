const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const authenticate = require('./middleware/authenticate');

const app = express();

// Cấu hình CORS
const corsOptions = {
  origin: 'http://localhost:5173', // URL của frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức cho phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};
app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // Đăng nhập và đăng ký
app.use('/api/files', authenticate, fileRoutes); // Upload, ký, verify (yêu cầu đăng nhập)

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

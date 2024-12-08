import axios from 'axios';

// Tạo một instance Axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001', // Đặt baseURL mặc định
  timeout: 10000, // Thời gian chờ mặc định là 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// Middleware: Đính kèm token nếu có trong localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Middleware: Xử lý lỗi phản hồi
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Nếu gặp lỗi 401 (Unauthorized), có thể logout hoặc chuyển hướng người dùng
      alert('Unauthorized! Please login again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import axiosInstance from '../api/axiosConfig';

// 🔹 Định nghĩa kiểu dữ liệu user
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  role: string;
  cert_expires_at: string;
  algorithm: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

// 🔹 Tạo Context với giá trị mặc định
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // 🔹 Gọi API lấy thông tin user
  const refreshUser = async () => {
    try {
      const response = await axiosInstance.get('/api/user/user');
      setUser(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser phải được dùng bên trong UserProvider');
  }
  return context;
};

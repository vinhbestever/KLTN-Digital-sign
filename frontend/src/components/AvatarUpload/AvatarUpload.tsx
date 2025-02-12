import { useState, useRef } from 'react';
import { Upload, Avatar, message } from 'antd';
import { CameraOutlined, UserOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosConfig';

interface AvatarUploadProps {
  userId: number | string | undefined;
  avatarUrl: string | undefined;
  refresh: () => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  avatarUrl,
  refresh,
}) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 📌 Khi chọn file ảnh mới
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const response = await axiosInstance.post(
        `/api/user/user/${userId}/avatar`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response) {
        message.success('Cập nhật avatar thành công!');
        refresh();
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật avatar!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-[120px] h-[120px] rounded-full group cursor-pointer">
      <Avatar
        src={avatarUrl}
        size={120}
        className="w-full h-full"
        icon={<UserOutlined />}
      />

      {/* Nút Upload hiển thị khi hover */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => fileInputRef.current?.click()}
      >
        <CameraOutlined className="text-white text-2xl" />
      </div>

      {/* Input ẩn để chọn file */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUpload;

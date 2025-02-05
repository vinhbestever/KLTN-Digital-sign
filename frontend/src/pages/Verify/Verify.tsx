import React, { useState } from 'react';
import axiosInstance from '../../api/axiosConfig';

export const Verify = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<string | null>(
    null
  );

  // Khi chọn file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Gửi file lên để xác thực
  const handleVerifyFile = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file PDF để xác thực.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axiosInstance.post('/api/files/verify', formData);
      const data = response.data;

      if (data.isValid) {
        setVerificationResult('✅ Chữ ký hợp lệ! File chưa bị thay đổi.');
      } else {
        setVerificationResult('❌ Chữ ký không hợp lệ! File đã bị thay đổi.');
      }
    } catch (error) {
      console.error('Xác thực thất bại:', error);
      setVerificationResult('⚠️ Có lỗi khi xác thực file!');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔍 Xác thực chữ ký số</h2>

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="mb-4"
      />

      <button
        onClick={handleVerifyFile}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Xác Thực Chữ Ký
      </button>

      {verificationResult && (
        <div className="mt-4 p-3 border rounded bg-gray-100">
          <p className="font-semibold">{verificationResult}</p>
        </div>
      )}
    </div>
  );
};

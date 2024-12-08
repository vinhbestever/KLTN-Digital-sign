import React, { useState } from 'react';
import axios from 'axios';

const SignFileForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSign = async () => {
    if (!file) {
      alert('Please select a file!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Gửi yêu cầu ký file
      const response = await axios.post(
        'http://localhost:5001/api/sign/file',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          responseType: 'blob', // Để nhận file dạng blob
        }
      );

      // Tạo link tải file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name); // Đặt tên file tải về
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error signing file:', error);
    }
  };

  return (
    <div className="sign-file-form">
      <h2>Sign File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleSign} className="button">
        Sign File and Download
      </button>
    </div>
  );
};

export default SignFileForm;

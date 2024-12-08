import React, { useState } from 'react';
import axios from '../api/axiosConfig';

const UploadFile = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Lưu file vào state
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Đặt key là 'file'

    try {
      const response = await axios.post('/api/files/sign', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('File uploaded successfully. File ID: ' + response.data.fileId);
    } catch (error) {
      console.error(
        'Error uploading file:',
        error.response?.data || error.message
      );
      alert('Failed to upload file.');
    }
  };

  return (
    <div>
      <h2>Upload File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload and Sign</button>
    </div>
  );
};

export default UploadFile;

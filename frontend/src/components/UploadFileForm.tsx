import React, { useState } from 'react';
import axios from 'axios';

const UploadFileForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'http://localhost:5001/api/sign',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setFileId(response.data.fileId);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDownload = async () => {
    if (!fileId) return;

    try {
      const response = await axios.get(
        `http://localhost:5001/api/files/${fileId}`,
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file?.name || 'signed_file.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div>
      <h2>Sign PDF File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload and Sign</button>
      {fileId && (
        <div>
          <h3>Download Signed PDF:</h3>
          <button onClick={handleDownload}>Download</button>
        </div>
      )}
    </div>
  );
};

export default UploadFileForm;

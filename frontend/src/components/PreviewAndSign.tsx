import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import axios from 'axios';

const PreviewAndSign: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [fileId, setFileId] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile)); // Hiển thị file PDF
    }
  };

  const handlePdfClick = (e: React.MouseEvent) => {
    const viewerContainer = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - viewerContainer.left;
    const y = e.clientY - viewerContainer.top;
    setPosition({ x, y });
  };

  const handleSign = async () => {
    if (!file || !position) {
      alert('Please select a file and a position to sign!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('x', position.x.toString());
    formData.append('y', position.y.toString());

    try {
      const response = await axios.post(
        'http://localhost:5001/api/sign',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setFileId(response.data.fileId);
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error signing file:', error);
    }
  };

  const handleDownload = async () => {
    if (!fileId) return;

    try {
      const response = await axios.get(
        `http://localhost:5001/api/files/${fileId}`,
        {
          responseType: 'blob', // Nhận dữ liệu binary
        }
      );

      // Tạo URL từ blob để tải file
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
      <h2>Upload and Preview PDF</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />

      {pdfUrl && (
        <div
          style={{
            width: '600px',
            height: '800px',
            margin: '20px auto',
            position: 'relative',
          }}
          onClick={handlePdfClick}
        >
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
            <Viewer fileUrl={pdfUrl} />
          </Worker>
          {position && (
            <div
              style={{
                position: 'absolute',
                top: position.y,
                left: position.x,
                backgroundColor: 'red',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
              }}
            ></div>
          )}
        </div>
      )}

      <button onClick={handleSign} disabled={!file || !position}>
        Sign File
      </button>
      {fileId && <button onClick={handleDownload}>Download Signed File</button>}
    </div>
  );
};

export default PreviewAndSign;

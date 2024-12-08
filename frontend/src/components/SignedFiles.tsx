import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';

const SignedFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignedFiles = async () => {
      try {
        const response = await axiosInstance.get('/api/files/signed-files');
        setFiles(response.data);
      } catch (error) {
        console.error(
          'Error fetching signed files:',
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSignedFiles();
  }, []);

  const handleDownload = async (fileId: any, fileName: string) => {
    try {
      const response = await axiosInstance.get(
        `/api/files/download-signed/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          responseType: 'blob', // Nhận dữ liệu dưới dạng blob
        }
      );

      // Tải file xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(
        'Error downloading file:',
        error.response?.data || error.message
      );
      alert('Failed to download file.');
    }
  };

  if (loading) {
    return <p>Loading signed files...</p>;
  }

  if (files.length === 0) {
    return <p>No signed files found.</p>;
  }

  return (
    <div>
      <h2>Signed Files</h2>
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Date Signed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.file_name}</td>
              <td>{new Date(file.created_at).toLocaleString()}</td>
              <td>
                <button onClick={() => handleDownload(file.id, file.file_name)}>
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SignedFiles;

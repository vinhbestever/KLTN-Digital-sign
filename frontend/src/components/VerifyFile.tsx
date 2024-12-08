import React, { useState } from 'react';
import axios from '../api/axiosConfig';

const VerifyFile = () => {
  const [file, setFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setVerifyResult(null); // Reset kết quả khi chọn file mới
  };

  const handleVerify = async () => {
    if (!file) {
      alert('Please select a file to verify.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/files/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setVerifyResult(
        response.data.isValid ? 'Valid Signature' : 'Invalid Signature'
      );
    } catch (error) {
      console.error(
        'Error verifying file:',
        error.response?.data || error.message
      );
      setVerifyResult('Verification failed');
    }
  };

  return (
    <div>
      <h2>Verify Signed File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleVerify}>Verify</button>
      {verifyResult && <p>Verification Result: {verifyResult}</p>}
    </div>
  );
};

export default VerifyFile;

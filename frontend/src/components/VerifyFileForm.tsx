import React, { useState } from 'react';
import axios from 'axios';

const VerifyFileForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleVerify = async () => {
    if (!file) {
      alert('Please select a file!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'http://localhost:5001/api/verify',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setVerificationResult(response.data.isValid);
    } catch (error) {
      console.error('Error verifying file:', error);
    }
  };

  return (
    <div>
      <h2>Verify PDF Signature</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleVerify}>Verify Signature</button>
      {verificationResult !== null && (
        <p>
          Verification Result:{' '}
          {verificationResult ? 'Signature is valid' : 'Signature is invalid'}
        </p>
      )}
    </div>
  );
};

export default VerifyFileForm;

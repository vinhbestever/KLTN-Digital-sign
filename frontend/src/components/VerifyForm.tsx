import React, { useState } from 'react';
import axios from 'axios';

const VerifyForm: React.FC = () => {
  const [data, setData] = useState('');
  const [signature, setSignature] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleVerify = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/verify', {
        data,
        signature,
      });
      setIsValid(response.data.isValid);
    } catch (error) {
      console.error('Error verifying signature:', error);
    }
  };

  return (
    <div className="verify-form">
      <h2>Verify Signature</h2>
      <textarea
        placeholder="Enter data"
        value={data}
        onChange={(e) => setData(e.target.value)}
        rows={4}
        className="textarea"
      />
      <textarea
        placeholder="Enter signature"
        value={signature}
        onChange={(e) => setSignature(e.target.value)}
        rows={4}
        className="textarea"
      />
      <button onClick={handleVerify} className="button">
        Verify
      </button>
      {isValid !== null && (
        <div className={`result ${isValid ? 'valid' : 'invalid'}`}>
          <p>{isValid ? 'Valid Signature' : 'Invalid Signature'}</p>
        </div>
      )}
    </div>
  );
};

export default VerifyForm;

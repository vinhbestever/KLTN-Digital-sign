import React, { useState } from 'react';
import axios from 'axios';

const SignForm: React.FC = () => {
  const [data, setData] = useState('');
  const [signature, setSignature] = useState('');

  const handleSign = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/sign', {
        data,
      });
      setSignature(response.data.signature);
    } catch (error) {
      console.error('Error signing data:', error);
    }
  };

  return (
    <div className="sign-form">
      <h2>Sign Data</h2>
      <textarea
        placeholder="Enter data to sign"
        value={data}
        onChange={(e) => setData(e.target.value)}
        rows={4}
        className="textarea"
      />
      <button onClick={handleSign} className="button">
        Sign
      </button>
      {signature && (
        <div className="result">
          <p>Signature:</p>
          <textarea value={signature} readOnly rows={4} className="textarea" />
        </div>
      )}
    </div>
  );
};

export default SignForm;

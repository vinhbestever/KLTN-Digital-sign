import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/register', {
        username,
        password,
        email,
      });
      alert('Registration successful!');
      window.location.href = '/login';
    } catch (error) {
      alert(
        'Registration failed: ' + error.response?.data?.error || 'Unknown error'
      );
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
};

export default Register;

import { useState } from 'react';
import axiosInstance from '../../api/axiosConfig';
import './Login.css';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        email: emailLogin,
        password: passwordLogin,
      });
      alert(response.data.message);
      localStorage.setItem('token', response.data.token);
      window.location.href = '/dashboard'; // Điều hướng đến Home
    } catch {
      alert('Login failed');
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/register', {
        email,
        password,
      });
      alert(response.data.message);
      setIsOtpSent(true);
    } catch {
      alert('Registration failed');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/verify-otp', {
        email,
        otp,
      });
      alert(response.data.message);
    } catch {
      alert('Verification failed');
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/forgot-password', {
        email: emailLogin,
      });
      alert(response.data.message);
    } catch {
      alert('Send failed');
    }
  };
  return (
    <div className="wrapper-login w-full h-full flex items-center justify-center">
      <div className="login-main">
        <input type="checkbox" id="chk" aria-hidden="true" />

        <div className="signup">
          <label htmlFor="chk" aria-hidden="true">
            Sign up
          </label>

          {isOtpSent ? (
            <>
              <input
                onChange={(e) => setOtp(e.target.value)}
                name="otp"
                placeholder="OTP"
                required
              />
              <button onClick={handleVerifyOtp}>Verify OTP</button>
            </>
          ) : (
            <>
              <input
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                name="email"
                placeholder="Email"
                required
              />

              <input
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                name="pswd"
                placeholder="Password"
                required
              />
              <button onClick={handleRegister}>Sign up</button>
            </>
          )}
        </div>

        <div className="login">
          {isForgotPassword ? (
            <>
              <label htmlFor="chk" aria-hidden="true">
                Login
              </label>
              <input
                onChange={(e) => setEmailLogin(e.target.value)}
                type="email"
                name="email"
                placeholder="Email"
                required
              />

              <button onClick={handleForgotPassword}>Send</button>

              <div
                onClick={() => {
                  setIsForgotPassword(false);
                }}
                className="flex items-center justify-center cursor-pointer text-[#573b8a]"
              >
                Back to login
              </div>
            </>
          ) : (
            <>
              <label htmlFor="chk" aria-hidden="true">
                Login
              </label>
              <input
                onChange={(e) => setEmailLogin(e.target.value)}
                type="email"
                name="email"
                placeholder="Email"
                required
              />
              <input
                onChange={(e) => setPasswordLogin(e.target.value)}
                type="password"
                name="pswd"
                placeholder="Password"
                required
              />
              <button onClick={handleLogin}>Login</button>

              <div
                onClick={() => {
                  setIsForgotPassword(true);
                }}
                className="flex items-center justify-center cursor-pointer text-[#573b8a]"
              >
                Forgot password
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

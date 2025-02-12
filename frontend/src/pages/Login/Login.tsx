import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosConfig';
import './Login.css';
import { message } from 'antd';
const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  const handleLogin = async () => {
    if (passwordConfirm !== password) {
      message.error('Mật khẩu đăng ký không trùng nhau!!');
    }
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        email: emailLogin,
        password: passwordLogin,
      });
      message.info(response.data.message);
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      window.location.href = '/dashboard'; // Điều hướng đến Home
    } catch (error) {
      message.error(error.response.data.error);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/register', {
        email,
        password,
        name,
      });
      message.info(response.data.message);
      setIsOtpSent(true);
    } catch (error) {
      message.error(error.response.data.error);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/verify-otp', {
        email,
        otp,
      });
      alert(response.data.message);
    } catch (error) {
      message.error(error.response.data.error);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/forgot-password', {
        email: emailLogin,
      });
      alert(response.data.message);
    } catch (error) {
      message.error(error.response.data.error);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/resend-otp', {
        email,
      });
      alert(response.data.message);
    } catch (error) {
      message.error(error.response.data.error);
    }
  };

  const [isSignIn, setIsSignIn] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSignIn(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const toggle = () => {
    setIsSignIn((prev) => !prev);
  };
  return (
    <div className={`container-login ${isSignIn ? 'sign-in' : 'sign-up'}`}>
      <div className="row">
        <div className="col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            {isOtpSent ? (
              <div className="form sign-up">
                <div className="input-group">
                  <i className="bx bxs-user"></i>
                  <input
                    type="text"
                    placeholder="Nhập OTP"
                    onChange={(e) => setOtp(e.target.value)}
                    value={otp}
                  />
                </div>

                <button onClick={handleVerifyOtp}>Xác nhận</button>

                <p>
                  <b
                    onClick={() => {
                      setIsOtpSent(false);
                    }}
                    className="pointer"
                  >
                    Quay lại
                  </b>
                </p>
                <p>
                  <span>Bạn có vấn đề?</span>
                  <b onClick={handleResendOTP} className="pointer">
                    Gửi lại OTP
                  </b>
                </p>
              </div>
            ) : (
              <div className="form sign-up">
                <div className="input-group">
                  <i className="bx bxs-user"></i>
                  <input
                    type="text"
                    placeholder="Họ và tên"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                  />
                </div>
                <div className="input-group">
                  <i className="bx bx-mail-send"></i>
                  <input
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                  />
                </div>
                <div className="input-group">
                  <i className="bx bxs-lock-alt"></i>
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                  />
                </div>
                <div className="input-group">
                  <i className="bx bxs-lock-alt"></i>
                  <input
                    type="password"
                    placeholder="Xác nhận mật khẩu"
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    value={passwordConfirm}
                  />
                </div>
                <button onClick={handleRegister}>Đăng ký</button>
                <p>
                  <span>Đã có tài khoản?</span>
                  <b onClick={toggle} className="pointer">
                    Đăng nhập tại đây
                  </b>
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="col align-items-center flex-col sign-in">
          <div className="form-wrapper align-items-center">
            <div className="form sign-in">
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  type="email"
                  placeholder="Email"
                  onChange={(e) => setEmailLogin(e.target.value)}
                  required
                />
              </div>
              {!isForgotPassword && (
                <div className="input-group">
                  <i className="bx bxs-lock-alt"></i>
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    onChange={(e) => setPasswordLogin(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (isForgotPassword) {
                    handleForgotPassword();
                  } else {
                    handleLogin();
                  }
                }}
              >
                {isForgotPassword ? 'Gửi' : 'Đăng nhập'}
              </button>

              <p>
                <b
                  onClick={() => {
                    if (isForgotPassword) {
                      setIsForgotPassword(false);
                    } else {
                      setIsForgotPassword(true);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {isForgotPassword ? 'Quay lại' : 'Quên mật khẩu?'}
                </b>
              </p>
              <p>
                <span>Nếu bạn chưa có tài khoản?</span>
                <b onClick={toggle} className="pointer">
                  Đăng ký tại đây
                </b>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="row content-row">
        <div className="col align-items-center flex-col">
          <div className="text sign-in">
            <h2>Đăng nhập</h2>
          </div>
          <div className="img sign-in"></div>
        </div>
        <div className="col align-items-center flex-col">
          <div className="img sign-up"></div>
          <div className="text sign-up">
            <h2>Đăng ký</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

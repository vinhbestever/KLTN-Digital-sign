import React from 'react';
// import VerifyFile from './VerifyFile';
import UploadFile from './UploadFile';

const Dashboard = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>
      <UploadFile />
      {/* <VerifyFile /> */}
    </div>
  );
};

export default Dashboard;

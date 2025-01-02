import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboad';
import Register from './components/Register';
import Login from './pages/Login/Login';
import SignedFiles from './components/SignedFiles';
import VerifyFile from './components/VerifyFile';
import Header from './components/Header';
import Sidebar from './components/SideBar/SideBar';

const App = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    // <Router>
    //   <Routes>
    //     <Route
    //       path="/login"
    //       element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
    //     />
    //     <Route
    //       path="/register"
    //       element={
    //         isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
    //       }
    //     />
    //     <Route
    //       path="/dashboard"
    //       element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
    //     />
    //     <Route
    //       path="/signed-files"
    //       element={isAuthenticated ? <SignedFiles /> : <Navigate to="/login" />}
    //     />

    //     <Route
    //       path="/verify-file"
    //       element={isAuthenticated ? <VerifyFile /> : <Navigate to="/login" />}
    //     />

    //     <Route path="*" element={<Navigate to="/login" />} />
    //   </Routes>
    // </Router>
    <Router>
      <div className="flex flex-col h-screen">
        {/* Main Content */}
        <div className="flex flex-1">
          {/* Sidebar */}
          {isAuthenticated && <Sidebar />}

          {/* Content */}
          <main
            className={`${
              isAuthenticated ? 'ml-[60px] ' : ''
            }flex-1 bg-gray-100`}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
                }
              />
              <Route
                path="/register"
                element={
                  isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
                }
              />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/signed-files"
                element={
                  isAuthenticated ? <SignedFiles /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/verify-file"
                element={
                  isAuthenticated ? <VerifyFile /> : <Navigate to="/login" />
                }
              />

              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;

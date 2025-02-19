import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';
import Login from './pages/Login/Login';
import Sidebar from './components/SideBar/SideBar';
import { Sign } from './pages/Sign/Sign';
import { Verify } from './pages/Verify/Verify';
import { Members } from './pages/Members/Members';
import { History } from './pages/HIstory/History';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Profile } from './pages/Profile/Profile';
import { useUser } from './context/UserContext';
import { AccessDenied } from './pages/AccessDenied/AccessDenied';

const App = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  const { user } = useUser();

  return (
    <Router>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Sidebar */}
          {isAuthenticated && <Sidebar />}

          {/* Content */}
          <main className={`flex-1`}>
            <Routes>
              <Route
                path="/login"
                element={
                  isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
                }
              />

              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/sign"
                element={isAuthenticated ? <Sign /> : <Navigate to="/login" />}
              />

              <Route
                path="/verify"
                element={
                  isAuthenticated ? <Verify /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/members"
                element={
                  isAuthenticated ? (
                    user?.role === 'admin' ? (
                      <Members />
                    ) : (
                      <AccessDenied />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/history"
                element={
                  isAuthenticated ? <History /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/profile"
                element={
                  isAuthenticated ? <Profile /> : <Navigate to="/login" />
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

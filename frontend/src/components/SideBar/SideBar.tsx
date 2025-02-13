// import { Link } from 'react-router-dom';
import './SideBar.css';
import { Avatar } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
const Sidebar = () => {
  const { user } = useUser();
  const location = useLocation();
  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');

    window.location.href = '/login';
  };

  return (
    <aside>
      <div className="flex flex-col justify-between h-[100vh]">
        <div>
          <div
            onClick={() => {
              window.location.href = '/profile';
            }}
            className="py-[20px] flex gap-[12px] items-center cursor-pointer"
          >
            <Avatar src={user?.avatar} size="large" icon={<UserOutlined />} />

            <div className="flex flex-col">
              <div className="text-white text-[18px]">{user?.name}</div>
              <div className="text-white text-[10px] opacity-40">
                {user?.email}
              </div>
            </div>
          </div>
          <Link
            to="/profile"
            className={location.pathname === '/profile' ? 'active' : ''}
          >
            <i className="fa fa-user-o" aria-hidden="true"></i>
            Thông tin cá nhân
          </Link>
          <Link
            to="/dashboard"
            className={location.pathname === '/dashboard' ? 'active' : ''}
          >
            <i className="fa fa-user-o" aria-hidden="true"></i>
            Thống kê
          </Link>
          <Link
            to="/sign"
            className={location.pathname === '/sign' ? 'active' : ''}
          >
            <i className="fa fa-laptop" aria-hidden="true"></i>
            Ký số
          </Link>
          <Link
            to="/verify"
            className={location.pathname === '/verify' ? 'active' : ''}
          >
            <i className="fa fa-star-o" aria-hidden="true"></i>
            Kiểm tra chữ ký
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/members"
              className={location.pathname === '/members' ? 'active' : ''}
            >
              <i className="fa fa-clone" aria-hidden="true"></i>
              Thành viên
            </Link>
          )}
          <Link
            to="/history"
            className={location.pathname === '/history' ? 'active' : ''}
          >
            <i className="fa fa-trash-o" aria-hidden="true"></i>
            Lịch sử
          </Link>
        </div>
        <div
          onClick={handleLogout}
          className="flex gap-[12px] cursor-pointer p-[12px]"
        >
          <LogoutOutlined className="-rotate-90" />
          <div>Logout</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

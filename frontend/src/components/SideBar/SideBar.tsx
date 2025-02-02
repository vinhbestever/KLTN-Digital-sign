// import { Link } from 'react-router-dom';
import './SideBar.css';
import { Avatar } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
const Sidebar = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');

    window.location.href = '/login';
  };

  return (
    <aside>
      <div className="flex flex-col justify-between h-[100vh]">
        <div>
          <div className="py-[20px] flex gap-[12px] items-center cursor-pointer">
            <Avatar size="large" icon={<UserOutlined />} />

            <div className="text-white text-[18px]">Nguyen Vinh</div>
          </div>
          <a href="/dashboard">
            <i className="fa fa-user-o" aria-hidden="true"></i>
            Dashboard
          </a>
          <a href="/sign">
            <i className="fa fa-laptop" aria-hidden="true"></i>
            Sign
          </a>
          <a href="/members">
            <i className="fa fa-clone" aria-hidden="true"></i>
            Members
          </a>
          <a href="/verify">
            <i className="fa fa-star-o" aria-hidden="true"></i>
            Verify
          </a>
          <a href="/history">
            <i className="fa fa-trash-o" aria-hidden="true"></i>
            History
          </a>
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

import { Link } from 'react-router-dom';
import './SideBar.css';
const Sidebar = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');

    window.location.href = '/login';
  };

  return (
    // <aside className="bg-gray-200 w-1/4 p-4 h-full">
    //   <nav>
    //     <ul className="space-y-2">
    //       <li>
    // <Link
    //   to="/dashboard"
    //   className="block p-2 rounded hover:bg-gray-300"
    // >
    //   Dashboard
    // </Link>
    //       </li>
    //       <li>
    //         <Link
    //           to="/signed-files"
    //           className="block p-2 rounded hover:bg-gray-300"
    //         >
    //           Settings
    //         </Link>
    //       </li>
    //       <li>
    //         <Link
    //           to="/verify-file"
    //           className="block p-2 rounded hover:bg-gray-300"
    //         >
    //           Profile
    //         </Link>
    //       </li>
    //     </ul>
    //   </nav>
    // </aside>

    <div>
      <div className="area"></div>
      <nav className="main-menu">
        <ul>
          <li>
            <a href="/dashboard">
              <i className="fa fa-home fa-2x"></i>
              <span className="nav-text">Dashboard</span>
            </a>
          </li>
          <li className="has-subnav">
            <a href="#">
              <i className="fa fa-globe fa-2x"></i>
              <span className="nav-text">Global Surveyors</span>
            </a>
          </li>
          <li className="has-subnav">
            <a href="#">
              <i className="fa fa-comments fa-2x"></i>
              <span className="nav-text">Group Hub Forums</span>
            </a>
          </li>
          <li className="has-subnav">
            <a href="#">
              <i className="fa fa-camera-retro fa-2x"></i>
              <span className="nav-text">Survey Photos</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-film fa-2x"></i>
              <span className="nav-text">Surveying Tutorials</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-book fa-2x"></i>
              <span className="nav-text">Surveying Jobs</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-cogs fa-2x"></i>
              <span className="nav-text">Tools & Resources</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-map-marker fa-2x"></i>
              <span className="nav-text">Member Map</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fa fa-info fa-2x"></i>
              <span className="nav-text">Documentation</span>
            </a>
          </li>
        </ul>

        <ul className="logout">
          <li>
            <a onClick={handleLogout}>
              <i className="fa fa-power-off fa-2x"></i>
              <span className="nav-text">Logout</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;

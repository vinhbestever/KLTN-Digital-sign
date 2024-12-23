import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="bg-gray-200 w-1/4 p-4 h-full">
      <nav>
        <ul className="space-y-2">
          <li>
            <Link
              to="/dashboard"
              className="block p-2 rounded hover:bg-gray-300"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className="block p-2 rounded hover:bg-gray-300"
            >
              Settings
            </Link>
          </li>
          <li>
            <Link to="/profile" className="block p-2 rounded hover:bg-gray-300">
              Profile
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

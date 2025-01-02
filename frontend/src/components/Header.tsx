const Header = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');

    window.location.href = '/login';
  };
  return (
    <header className="bg-blue-500 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">My Application</h1>
      <div className="cursor-pointer" onClick={handleLogout}>
        Logout
      </div>
    </header>
  );
};

export default Header;

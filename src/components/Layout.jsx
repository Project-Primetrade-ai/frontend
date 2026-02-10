import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="text-lg font-semibold text-indigo-400">
             Dashboard
          </Link>
          <nav className="flex items-center gap-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-sm ${
                  isActive ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `text-sm ${
                  isActive ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Profile 
            </NavLink>
            {user && (
              <span className="text-sm text-slate-400 hidden sm:inline">
                {user.name} 
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-indigo-600"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;


import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FolderPlus, History, Users, Database, UserPlus, Lock, LogOut, Sun, Moon } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-5 py-2.5 text-sm transition-all duration-150 no-underline ${
      isActive
        ? 'bg-blue-600 text-white font-medium shadow-sm'
        : 'text-slate-400 dark:text-slate-300 hover:bg-navy-700 hover:text-white'
    }`;

  return (
    <aside className="w-60 min-h-screen bg-navy-800 flex flex-col flex-shrink-0 fixed top-0 left-0 z-50 shadow-2xl sidebar-scrollbar overflow-y-auto">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-navy-700">
        <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-lg mb-3">
          CI
        </div>
        <div className="text-white font-semibold text-sm leading-tight">Crime Investigation</div>
        <div className="text-navy-500 text-xs mt-0.5">Decision-Support System</div>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 py-4">
        <div className="px-5 pb-1 text-navy-400 text-[10px] font-bold uppercase tracking-widest">
          Investigation
        </div>

        <NavLink to="/" end className={navClass}>
          <FolderPlus className="w-4 h-4 flex-shrink-0" />
          New case
        </NavLink>

        <NavLink to="/history" className={navClass}>
          <History className="w-4 h-4 flex-shrink-0" />
          Case history
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <hr className="border-navy-700 mx-5 my-3" />
            <div className="px-5 pb-1 text-navy-400 text-[10px] font-bold uppercase tracking-widest">
              Administration
            </div>

            <NavLink to="/admin/users" className={navClass}>
              <Users className="w-4 h-4 flex-shrink-0" />
              Manage users
            </NavLink>

            <NavLink to="/admin/cases" className={navClass}>
              <Database className="w-4 h-4 flex-shrink-0" />
              All cases
            </NavLink>

            <NavLink to="/admin/users/register" className={navClass}>
              <UserPlus className="w-4 h-4 flex-shrink-0" />
              Add user
            </NavLink>
          </>
        )}
      </nav>

      {/* Sidebar Footer User Details */}
      <div className="px-4 py-4 border-t border-navy-700 mt-auto">
        {user && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-semibold leading-tight truncate">
                  {user.fullName ? user.fullName.split(' ')[0] : user.username}
                </div>
                <div className="text-navy-500 text-[10px] capitalize">{user.role}</div>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 w-full px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-slate-300 hover:text-white text-xs rounded-lg transition-all duration-150 border-0 cursor-pointer text-left font-medium"
            >
              {theme === 'light' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>

            <NavLink
              to="/change-password"
              className="flex items-center gap-2 w-full px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-slate-300 hover:text-white text-xs rounded-lg transition-all duration-150 no-underline"
            >
              <Lock className="w-3 h-3" />
              Change password
            </NavLink>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-1.5 bg-navy-700 hover:bg-red-600 text-slate-300 hover:text-white text-xs rounded-lg transition-all duration-150 border-0 cursor-pointer text-left font-medium"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FolderPlus,
  History,
  Users,
  Database,
  UserPlus,
  Lock,
  LogOut,
  Sun,
  Moon,
  ShieldAlert,
  Radio
} from 'lucide-react';

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
    `group flex items-center gap-3 px-3.5 py-2.5 mx-2.5 rounded-lg text-xs font-medium transition-all duration-150 no-underline ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40 font-semibold'
        : 'text-slate-400 hover:text-white hover:bg-navy-700/70 hover:translate-x-0.5'
    }`;

  return (
    <aside className="w-60 min-h-screen bg-navy-900 flex flex-col flex-shrink-0 fixed top-0 left-0 z-50 shadow-2xl sidebar-scrollbar overflow-y-auto border-r border-navy-800">
      {/* Brand Header */}
      <div className="p-4 pb-3 border-b border-navy-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0 border border-blue-400/30">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm tracking-tight leading-tight">
              Crime DSS
            </div>
            <div className="text-navy-300 text-[10px] font-mono tracking-wider uppercase mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Investigation AI
            </div>
          </div>
        </div>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 py-4 space-y-4">
        <div>
          <div className="px-5 pb-2 text-navy-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-navy-500" />
            Investigation
          </div>

          <div className="space-y-1">
            <NavLink to="/" end className={navClass}>
              <FolderPlus className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
              <span>New Case Setup</span>
            </NavLink>

            <NavLink to="/history" className={navClass}>
              <History className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
              <span>Case History</span>
            </NavLink>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="pt-2 border-t border-navy-800/80">
            <div className="px-5 pb-2 text-navy-400 text-[10px] font-bold uppercase tracking-wider">
              Administration
            </div>

            <div className="space-y-1">
              <NavLink to="/admin/users" className={navClass}>
                <Users className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>Manage Users</span>
              </NavLink>

              <NavLink to="/admin/cases" className={navClass}>
                <Database className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>All Cases Archive</span>
              </NavLink>

              <NavLink to="/admin/users/register" className={navClass}>
                <UserPlus className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>Add Investigator</span>
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar Footer User Details */}
      <div className="p-3 border-t border-navy-800 bg-navy-950/60 mt-auto">
        {user && (
          <div className="flex flex-col gap-2.5">
            {/* User card info */}
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-navy-900/80 border border-navy-800">
              <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-slate-200 text-xs font-semibold leading-tight truncate">
                  {user.fullName || user.username}
                </div>
                <div className="text-navy-400 text-[10px] uppercase font-mono tracking-wider capitalize">
                  {user.role}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-1">
              <button
                onClick={toggleTheme}
                type="button"
                className="flex items-center justify-between w-full px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg text-xs transition-colors cursor-pointer border-0 font-medium"
              >
                <span className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <Moon className="w-3.5 h-3.5 text-navy-400" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </span>
                <span className="text-[10px] text-navy-400 uppercase font-mono">{theme}</span>
              </button>

              <NavLink
                to="/change-password"
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg text-xs transition-colors no-underline font-medium"
              >
                <Lock className="w-3.5 h-3.5 text-navy-400" />
                <span>Security</span>
              </NavLink>

              <button
                onClick={handleSignOut}
                type="button"
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 rounded-lg text-xs transition-colors cursor-pointer border-0 font-medium text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

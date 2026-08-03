import React from 'react';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ title, actions }) => {
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-40 shadow-sm">
      <span className="text-slate-800 dark:text-slate-100 font-semibold text-base">{title}</span>
      <div className="flex items-center gap-3">
        {user && (
          user.role === 'admin' ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800">
              Admin
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800">
              Investigator
            </span>
          )
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default Topbar;

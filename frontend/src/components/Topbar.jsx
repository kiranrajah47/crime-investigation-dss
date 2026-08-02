import React from 'react';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ title, actions }) => {
  const { user } = useAuth();

  return (
    <div className="bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-40 shadow-sm">
      <span className="text-slate-800 font-semibold text-base">{title}</span>
      <div className="flex items-center gap-3">
        {user && (
          user.role === 'admin' ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 ring-1 ring-amber-200">
              Admin
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200">
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

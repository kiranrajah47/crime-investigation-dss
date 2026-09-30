import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';

const Topbar = ({ title, actions }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-3">
        <h1 className="text-slate-800 dark:text-slate-100 font-bold text-base tracking-tight m-0">
          {title}
        </h1>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          DSS v2.0
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          user.role === 'admin' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
              <Shield className="w-3 h-3 text-amber-500" />
              Administrator
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
              <Shield className="w-3 h-3 text-blue-500" />
              Lead Investigator
            </span>
          )
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};

export default Topbar;

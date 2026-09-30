import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const Layout = ({ children, title = '', actions = null }) => {
  const { flash } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex w-full">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content body */}
      <div className="ml-60 flex-1 min-h-screen flex flex-col">
        {/* Top Header bar */}
        <Topbar title={title} actions={actions} />

        {/* Flash notification */}
        {flash && (
          <div className="px-6 sm:px-8 pt-4">
            <div
              className={`flex items-start gap-3 border rounded-xl px-4 py-3 text-sm shadow-sm fade-in ${
                flash.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : flash.type === 'info'
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {flash.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
              ) : flash.type === 'info' ? (
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-sky-500" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              )}
              <div className="text-sm font-medium flex-1">{flash.message}</div>
            </div>
          </div>
        )}

        {/* Main page content */}
        <main className="px-6 sm:px-8 py-6 flex-1 flex flex-col">
          {children}

          <footer className="mt-auto pt-6 pb-3 px-1 border-t border-slate-200 dark:border-slate-800 mt-8">
            <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600 font-mono">
              <span>Crime Investigation DSS — VTU Major Project 2026–27</span>
              <span>St. Joseph Engineering College, Mangaluru</span>
              <span>Decision support only. All leads must be independently verified.</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const Layout = ({ children, title = '', actions = null }) => {
  const { flash } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex w-full">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content body */}
      <div className="ml-60 flex-1 min-h-screen flex flex-col">
        {/* Top Header bar */}
        <Topbar title={title} actions={actions} />

        {/* Flash notifications alert panel */}
        {flash && (
          <div className="px-8 pt-4">
            <div
              className={`flex items-start gap-3 border rounded-xl px-4 py-3 text-sm shadow-sm fade-in ${
                flash.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : flash.type === 'info'
                  ? 'bg-sky-50 border-sky-200 text-sky-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {flash.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : flash.type === 'info' ? (
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <div>{flash.message}</div>
            </div>
          </div>
        )}

        {/* Main nested page content */}
        <main className="p-8 flex-1 flex flex-col">
          {children}
          <footer className="mt-auto pt-8 pb-4 px-2 border-t border-slate-100 mt-6">
            <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-slate-400">
              <span>Crime Investigation DSS — VTU Project 2026-27</span>
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

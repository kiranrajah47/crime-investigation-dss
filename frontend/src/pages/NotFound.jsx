import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-10 max-w-md w-full">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">404</h1>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved. Verify the URL or return to safety below.
        </p>
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center py-3 gradient-brand text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 transition-all duration-200 active:scale-[0.98] no-underline"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

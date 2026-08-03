import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const res = await login(username, password, remember);
    setSubmitting(false);

    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMsg(res.message);
    }
  };

  if (loading || (isAuthenticated && !errorMsg)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 spinner"></div>
      </div>
    );
  }

  const features = [
    'Upload case documents in TXT, DOCX, or PDF format',
    'Automatic suspect ranking using TF-IDF similarity',
    'Adjustable evidence weights per case type',
    'Transparent explainable reasoning for each suspect',
    'Full case history logging with database storage'
  ];

  return (
    <div className="min-h-screen flex w-full">
      {/* Left branding panel */}
      <div className="relative hidden lg:flex w-[420px] xl:w-[480px] flex-shrink-0 flex-col justify-center px-12 py-16 gradient-bg overflow-hidden text-left">
        {/* Decorative orbs */}
        <div className="orb absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div className="orb absolute bottom-10 right-10 w-56 h-56 rounded-full bg-blue-400/10 blur-2xl" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl mb-8">
              CI
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-4">
              Crime Investigation<br />Decision-Support System
            </h1>
            <p className="text-blue-200 text-sm leading-relaxed mb-10">
              An AI-powered platform that assists investigators in analysing
              case evidence and ranking suspects using NLP and evidence-based scoring.
            </p>

            <ul className="space-y-3.5 p-0 list-none">
              {features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3 text-blue-100 text-sm leading-relaxed">
                  <span className="mt-1 w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-blue-400/60 text-xs border-t border-blue-900/60 pt-6 mt-12">
            Authorized access only &nbsp;·&nbsp; VTU Project 2026–27
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-3">
              CI
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Crime Investigation DSS</h1>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 p-8 text-left">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-7">Sign in to access the investigation system.</p>

            {errorMsg && (
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm mb-5 shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all duration-200 outline-none"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all duration-200 outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-slate-500 dark:text-slate-400 select-none cursor-pointer">
                  Keep me signed in
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 gradient-brand text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-55"
              >
                {submitting ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 leading-relaxed">
              Unauthorized access to this system is strictly prohibited.<br />
              All activity is logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

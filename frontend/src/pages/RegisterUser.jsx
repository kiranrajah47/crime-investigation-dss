import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { UserPlus, ArrowLeft } from 'lucide-react';

const RegisterUser = () => {
  const { showFlash } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('investigator');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      showFlash('Password must be at least 6 characters.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/api/admin/users/register', {
        full_name: fullName,
        username,
        email,
        password,
        role
      });

      if (response.data.success) {
        showFlash(response.data.message, 'success');
        navigate('/admin/users');
      } else {
        showFlash(response.data.message || 'Registration failed.', 'error');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error creating user account.';
      showFlash(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Create new account">
      <div className="max-w-2xl mx-auto w-full space-y-6 font-sans">

        {/* Page hero banner */}
        <div className="relative overflow-hidden gradient-bg rounded-2xl px-7 py-5 text-white shadow-md shadow-blue-500/20">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-base font-bold tracking-tight">Create New Account</h2>
              </div>
              <p className="text-blue-100/90 text-xs leading-relaxed max-w-md">
                Add an investigator or admin to the system. They will be able to log in immediately after account creation.
              </p>
            </div>
            <Link
              to="/admin/users"
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 border border-white/20 rounded-lg hover:bg-white/25 transition-all no-underline"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to users
            </Link>
          </div>
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
          <div className="absolute right-10 bottom-0 w-20 h-20 rounded-full bg-white/5 pointer-events-none"></div>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-left">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Account details</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fill in all fields below to register the new user.</p>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Inspector Ramesh Kumar"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                    placeholder="e.g. ramesh_kumar"
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No spaces. Used for login.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
                  >
                    <option value="investigator">Investigator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Admins can manage users.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@police.gov.in"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 gradient-brand text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {submitting ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default RegisterUser;

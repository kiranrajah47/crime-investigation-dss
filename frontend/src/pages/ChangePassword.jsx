import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Shield, Key, Check, AlertTriangle } from 'lucide-react';

const ChangePassword = () => {
  const { user, showFlash } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Password strength computation
  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
      { width: 'w-0', bg: 'bg-slate-200', text: 'text-slate-400', label: '' },
      { width: 'w-1/4', bg: 'bg-red-500', text: 'text-red-500', label: 'Weak' },
      { width: 'w-2/4', bg: 'bg-orange-500', text: 'text-orange-500', label: 'Fair' },
      { width: 'w-3/4', bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Good' },
      { width: 'w-full', bg: 'bg-green-500', text: 'text-green-500', label: 'Strong' }
    ];
    return levels[Math.min(score, 4)];
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showFlash('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showFlash('New passwords do not match.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      if (response.data.success) {
        showFlash('Password changed successfully.', 'success');
        navigate('/');
      } else {
        showFlash(response.data.message || 'Failed to change password.', 'error');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error updating password. Verify current password.';
      showFlash(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const goodTips = [
    { title: 'Use at least 6 characters', desc: 'Longer passwords are significantly harder to crack.' },
    { title: 'Mix letters, numbers and symbols', desc: 'e.g. Inv3st!gate#2026' },
    { title: 'Never reuse passwords', desc: 'Use a unique password for this system.' }
  ];

  const badTips = [
    { title: 'Avoid personal information', desc: "Don't use your name, date of birth, or badge number." },
    { title: 'Never share your password', desc: 'All activity on this system is logged under your account.' }
  ];

  return (
    <Layout title="Change password">
      <div className="max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-5 items-start text-left font-sans">
        
        {/* Left: form card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Update your password</h2>
              {user && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged in as <strong className="text-slate-700">{user.fullName}</strong> ({user.role})
                </p>
              )}
            </div>
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Key className="w-4 h-4" />
            </div>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none"
                />
                
                {/* Strength bar indicator */}
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.width} ${strength.bg}`}></div>
                </div>
                {strength.label && (
                  <p className={`text-xs mt-1 font-semibold ${strength.text}`}>
                    Password strength: {strength.label}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 gradient-brand text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all duration-200 active:scale-[0.98] mt-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update password'}
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-4">
              You will be redirected to the home page after a successful change.
            </p>
          </div>
        </div>

        {/* Right: security guidelines */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm px-6 py-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-slate-700">Password security tips</div>
          </div>

          <div className="space-y-4">
            {goodTips.map((tip, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-blue-600">
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">{tip.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{tip.desc}</div>
                </div>
              </div>
            ))}

            {badTips.map((tip, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-red-500 font-bold text-sm">
                  ✕
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">{tip.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{tip.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-400 leading-relaxed">
            This is a secure law enforcement support system. Unauthorized access or
            sharing of credentials is a serious security violation.
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default ChangePassword;

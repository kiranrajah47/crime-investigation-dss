import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { UserPlus, ToggleLeft, ToggleRight, Trash2, ShieldAlert, Users, UserCheck, FileText } from 'lucide-react';

const AdminUsers = () => {
  const { showFlash } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user list', err);
      setError(err.response?.data?.message || 'Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggle = async (userId, fullName) => {
    try {
      const response = await axios.post(`/api/admin/users/${userId}/toggle`);
      if (response.data.success) {
        showFlash(response.data.message, 'success');
        // Update user state locally
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isActive: response.data.isActive } : u
        ));
      } else {
        showFlash(response.data.message || 'Action failed.', 'error');
      }
    } catch (err) {
      showFlash(err.response?.data?.message || 'Failed to toggle account status.', 'error');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}" and all their cases? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.post(`/api/admin/users/${userId}/delete`);
      if (response.data.success) {
        showFlash(response.data.message, 'success');
        // Remove from list
        setUsers(users.filter(u => u.id !== userId));
      } else {
        showFlash(response.data.message || 'Deletion failed.', 'error');
      }
    } catch (err) {
      showFlash(err.response?.data?.message || 'Failed to delete user account.', 'error');
    }
  };

  const topbarActions = (
    <Link
      to="/admin/users/register"
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 gradient-brand text-white text-xs font-semibold rounded-lg shadow-sm hover:brightness-110 transition-all no-underline"
    >
      <UserPlus className="w-3.5 h-3.5" />
      New account
    </Link>
  );

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Layout title="User management" actions={topbarActions}>
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 text-left font-sans">
          <StatCard
            title="Total users"
            value={users.length}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Active investigators"
            value={users.filter(u => u.role === 'investigator' && u.isActive).length}
            icon={<UserCheck className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Total cases run"
            value={users.reduce((sum, u) => sum + (u.casesCount || 0), 0)}
            icon={<FileText className="w-5 h-5" />}
            color="violet"
          />
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 spinner"></div>
          <div className="text-slate-400 dark:text-slate-500 text-sm font-semibold font-sans">Loading users list...</div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-red-500 shadow-sm font-sans">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-left font-sans">
          <div className="text-center py-16 px-8">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No users found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              <Link to="/admin/users/register" className="text-blue-500 hover:underline">
                Create the first account
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm font-sans">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cases</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-100">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{u.fullName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{u.username}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.role === 'admin' ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">Admin</span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Investigator</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Active</span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.casesCount}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(u.id, u.fullName)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-700 transition-all cursor-pointer font-sans"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all cursor-pointer font-sans"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminUsers;

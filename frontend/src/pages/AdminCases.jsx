import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Search, Plus, Archive, Trash2, ShieldAlert } from 'lucide-react';

const AdminCases = () => {
  const { showFlash } = useAuth();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('newest');

  // Global suspect search state
  const [suspectQuery, setSuspectQuery] = useState('');
  const [suspectResults, setSuspectResults] = useState([]);
  const [suspectLoading, setSuspectLoading] = useState(false);

  // Modal delete state
  const [showModal, setShowModal] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null); // { id, caseId }
  const [deleting, setDeleting] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cases/history'); // fetches all cases for admin
      setCases(response.data);
      setFilteredCases(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch case list', err);
      setError(err.response?.data?.message || 'Failed to load cases list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Debounced global suspect search (400ms)
  useEffect(() => {
    if (!suspectQuery.trim()) {
      setSuspectResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSuspectLoading(true);
        const response = await axios.get(`/api/admin/suspect-search?name=${encodeURIComponent(suspectQuery.trim())}`);
        setSuspectResults(response.data.results || []);
      } catch (err) {
        console.error('Failed to search suspects', err);
      } finally {
        setSuspectLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [suspectQuery]);

  // Filter and sort processor
  useEffect(() => {
    let result = [...cases];

    // Search query matches title, top suspect, investigator name, or Case ID
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.top_suspect && c.top_suspect.toLowerCase().includes(q)) ||
        (c.case_id && c.case_id.toLowerCase().includes(q)) ||
        (c.investigator && c.investigator.fullName.toLowerCase().includes(q))
      );
    }

    // Priority filter (High >= 0.55, Medium >= 0.30, Low < 0.30)
    if (priority) {
      result = result.filter(c => {
        const score = c.top_score;
        let p = 'low';
        if (score >= 0.55) p = 'primary';
        else if (score >= 0.30) p = 'secondary';
        return p === priority;
      });
    }

    // Sort order
    result.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'score-high') return b.top_score - a.top_score;
      if (sort === 'score-low') return a.top_score - b.top_score;
      return 0;
    });

    setFilteredCases(result);
  }, [cases, search, priority, sort]);

  const confirmDelete = (id, caseId) => {
    setCaseToDelete({ id, caseId });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCaseToDelete(null);
  };

  const handleDelete = async () => {
    if (!caseToDelete) return;
    setDeleting(true);

    try {
      const response = await axios.post(`/api/admin/cases/${caseToDelete.id}/delete`);
      if (response.data.success) {
        showFlash(response.data.message, 'success');
        setCases(cases.filter(c => c.id !== caseToDelete.id));
        closeModal();
      } else {
        showFlash(response.data.message || 'Deletion failed.', 'error');
      }
    } catch (err) {
      showFlash(err.response?.data?.message || 'Failed to delete case.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getPriorityBadge = (score) => {
    if (score >= 0.55) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">{score.toFixed(4)}</span>;
    } else if (score >= 0.30) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">{score.toFixed(4)}</span>;
    } else {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{score.toFixed(4)}</span>;
    }
  };

  return (
    <Layout title="All cases">
      {/* Delete confirmation modal */}
      {showModal && caseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 text-left font-sans">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Delete case?</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              This will permanently delete case <strong className="text-slate-700">{caseToDelete.caseId}</strong> and all its data.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer font-sans disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all cursor-pointer font-sans disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Suspect Search section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm text-left font-sans">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          Search suspect across all cases
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={suspectQuery}
            onChange={(e) => setSuspectQuery(e.target.value)}
            placeholder="Enter suspect name to search across all case reports..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all outline-none"
          />
        </div>

        {suspectQuery.trim() !== '' && (
          <div className="mt-4">
            {suspectLoading ? (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">Searching cases...</div>
            ) : suspectResults.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                No suspect matches found for "{suspectQuery}".
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Suspect Name</th>
                      <th className="px-4 py-2.5">Case</th>
                      <th className="px-4 py-2.5">Rank</th>
                      <th className="px-4 py-2.5">Score</th>
                      <th className="px-4 py-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {suspectResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors duration-100">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{r.suspect_name}</td>
                        <td className="px-4 py-2.5">
                          <Link
                            to={`/results/${r.case_db_id || r.id}`}
                            className="text-blue-600 font-medium hover:underline no-underline"
                          >
                            {r.case_title ? `${r.case_title} (${r.case_id})` : r.case_id}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-medium">#{r.rank}</td>
                        <td className="px-4 py-2.5">{getPriorityBadge(r.score)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-400">{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 mb-4 flex flex-wrap gap-3 items-center shadow-sm text-left font-sans">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, suspect, or investigator..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all outline-none"
          />
        </div>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 focus:outline-none focus:border-blue-400 min-w-[144px] cursor-pointer outline-none"
        >
          <option value="">All priorities</option>
          <option value="primary">High priority</option>
          <option value="secondary">Medium priority</option>
          <option value="low">Low priority</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 focus:outline-none focus:border-blue-400 min-w-[144px] cursor-pointer outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="score-high">Highest score first</option>
          <option value="score-low">Lowest score first</option>
        </select>

        <span className="text-xs text-slate-400 ml-auto whitespace-nowrap font-medium">
          {filteredCases.length} of {cases.length} case{cases.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 spinner"></div>
          <div className="text-slate-400 text-sm font-semibold font-sans">Loading cases list...</div>
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-red-500 shadow-sm font-sans">
          {error}
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm text-left font-sans">
          <div className="text-center py-16 px-8">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Archive className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No cases yet</p>
            <p className="text-sm text-slate-400">Cases will appear here once investigators run analyses.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Case ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top suspect</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suspects</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Run by</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.case_id}</td>
                    <td className="px-4 py-3 text-slate-700 truncate max-w-[180px]" title={c.title}>
                      {c.title || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.top_suspect || '—'}</td>
                    <td className="px-4 py-3">{getPriorityBadge(c.top_score)}</td>
                    <td className="px-4 py-3 text-slate-600">{c.num_suspects}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.investigator?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{c.formatted_date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          to={`/results/${c.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all no-underline font-sans"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => confirmDelete(c.id, c.case_id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all cursor-pointer font-sans"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCases.length === 0 && (
            <div className="text-center py-10 text-sm text-slate-400">
              No cases match your search or filter.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default AdminCases;

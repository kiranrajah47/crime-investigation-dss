import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { Search, Plus, Archive, Trash2, ShieldAlert, ChevronLeft, ChevronRight, FolderOpen, TrendingUp, User } from 'lucide-react';

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);

  const fetchCases = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/cases', {
        params: { page, per_page: 10 }
      });
      if (response.data && response.data.cases) {
        setCases(response.data.cases);
        setTotalPages(response.data.total_pages || 1);
        setTotalCases(response.data.total || 0);
      } else if (Array.isArray(response.data)) {
        setCases(response.data);
        setTotalPages(1);
        setTotalCases(response.data.length);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch case list', err);
      setError(err.response?.data?.message || 'Failed to load cases list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases(currentPage);
  }, [currentPage]);

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
        fetchCases(currentPage);
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
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">{score.toFixed(4)}</span>;
    } else if (score >= 0.30) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">{score.toFixed(4)}</span>;
    } else {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">{score.toFixed(4)}</span>;
    }
  };

  // Derived stats from fetched cases (client-side, no extra API call)
  const avgTopScore = cases.length > 0
    ? (cases.reduce((sum, c) => sum + (c.top_score || 0), 0) / cases.length).toFixed(2)
    : '—';

  const mostRepeatedSuspect = (() => {
    if (cases.length === 0) return '—';
    const freq = {};
    cases.forEach(c => {
      if (c.top_suspect) freq[c.top_suspect] = (freq[c.top_suspect] || 0) + 1;
    });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : '—';
  })();

  return (
    <Layout title="All cases">
      {/* Delete confirmation modal */}
      {showModal && caseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 text-left font-sans">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Delete case?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              This will permanently delete case <strong className="text-slate-700 dark:text-slate-200">{caseToDelete.caseId}</strong> and all its data.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer font-sans disabled:opacity-50"
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

      {/* Stats row */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 text-left font-sans">
          <StatCard
            title="Total cases"
            value={totalCases}
            icon={<FolderOpen className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Average top score"
            value={avgTopScore}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Most repeated suspect"
            value={mostRepeatedSuspect}
            icon={<User className="w-5 h-5" />}
            color="violet"
          />
        </div>
      )}

      {/* Global Suspect Search section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-5 shadow-sm text-left font-sans">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Search suspect across all cases
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={suspectQuery}
            onChange={(e) => setSuspectQuery(e.target.value)}
            placeholder="Enter suspect name to search across all case reports..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
          />
        </div>

        {suspectQuery.trim() !== '' && (
          <div className="mt-4">
            {suspectLoading ? (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-semibold">Searching cases...</div>
            ) : suspectResults.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
                No suspect matches found for "{suspectQuery}".
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Suspect Name</th>
                      <th className="px-4 py-2.5">Case</th>
                      <th className="px-4 py-2.5">Rank</th>
                      <th className="px-4 py-2.5">Score</th>
                      <th className="px-4 py-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {suspectResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-100">
                        <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{r.suspect_name}</td>
                        <td className="px-4 py-2.5">
                          <Link
                            to={`/results/${r.case_db_id || r.id}`}
                            className="text-blue-600 dark:text-blue-400 font-medium hover:underline no-underline"
                          >
                            {r.case_title ? `${r.case_title} (${r.case_id})` : r.case_id}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium">#{r.rank}</td>
                        <td className="px-4 py-2.5">{getPriorityBadge(r.score)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">{r.date}</td>
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3.5 mb-4 flex flex-wrap gap-3 items-center shadow-sm text-left font-sans">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, suspect, or investigator..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
          />
        </div>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-400 min-w-[144px] cursor-pointer outline-none"
        >
          <option value="">All priorities</option>
          <option value="primary">High priority</option>
          <option value="secondary">Medium priority</option>
          <option value="low">Low priority</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-400 min-w-[144px] cursor-pointer outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="score-high">Highest score first</option>
          <option value="score-low">Lowest score first</option>
        </select>

        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto whitespace-nowrap font-medium">
          {filteredCases.length} of {cases.length} case{cases.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 spinner"></div>
          <div className="text-slate-400 dark:text-slate-500 text-sm font-semibold font-sans">Loading cases list...</div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-red-500 shadow-sm font-sans">
          {error}
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-left font-sans">
          <div className="text-center py-16 px-8">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Archive className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No cases yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Cases will appear here once investigators run analyses.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm font-sans">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Case ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Top suspect</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suspects</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Run by</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{c.case_id}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 truncate max-w-[180px]" title={c.title}>
                      {c.title || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{c.top_suspect || '—'}</td>
                    <td className="px-4 py-3">{getPriorityBadge(c.top_score)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.num_suspects}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{c.investigator?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{c.formatted_date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          to={`/results/${c.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-700 transition-all no-underline font-sans"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => confirmDelete(c.id, c.case_id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all cursor-pointer font-sans"
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
            <div className="text-center py-10 text-sm text-slate-400 dark:text-slate-500">
              No cases match your search or filter.
            </div>
          )}

          {/* Pagination Controls */}
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 font-sans">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Page <span className="font-semibold text-slate-700 dark:text-slate-200">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{totalPages || 1}</span> ({totalCases} total cases)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-sans"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-sans"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminCases;

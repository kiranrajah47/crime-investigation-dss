import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Search, Plus, Archive, ChevronRight, ChevronLeft } from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);

  // Fetch case history on mount & page change
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cases/history', {
          params: { page: currentPage, per_page: 10 }
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
        console.error('Failed to fetch case history', err);
        setError(err.response?.data?.message || 'Failed to load case history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentPage]);

  // Process filters and sorts
  useEffect(() => {
    let result = [...cases];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => 
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.top_suspect && c.top_suspect.toLowerCase().includes(q)) ||
        (c.case_id && c.case_id.toLowerCase().includes(q)) ||
        (c.investigator && c.investigator.fullName.toLowerCase().includes(q))
      );
    }

    // Priority filter
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

  const topbarActions = (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 gradient-brand text-white text-xs font-semibold rounded-lg shadow-sm hover:brightness-110 transition-all no-underline"
    >
      <Plus className="w-3.5 h-3.5" />
      New case
    </Link>
  );

  const getPriorityBadge = (score) => {
    if (score >= 0.65) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">{score.toFixed(4)}</span>;
    } else if (score >= 0.50) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">{score.toFixed(4)}</span>;
    } else if (score >= 0.35) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">{score.toFixed(4)}</span>;
    } else if (score >= 0.20) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200">{score.toFixed(4)}</span>;
    } else {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">{score.toFixed(4)}</span>;
    }
  };

  return (
    <Layout title="My case history" actions={topbarActions}>
      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3.5 mb-4 flex flex-wrap gap-3 items-center shadow-sm text-left font-sans">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case title or top suspect..."
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
          <div className="text-slate-400 dark:text-slate-500 text-sm font-semibold">Loading history...</div>
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
            <p className="text-sm text-slate-400 dark:text-slate-500">
              <Link to="/" className="text-blue-500 hover:underline">
                Run your first analysis
              </Link>{' '}
              to see results here.
            </p>
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
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date run</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{c.case_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 truncate max-w-[200px]" title={c.title}>
                      {c.title || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{c.top_suspect || '—'}</td>
                    <td className="px-4 py-3">{getPriorityBadge(c.top_score)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{c.num_suspects}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{c.formatted_date}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/results/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-150 no-underline"
                      >
                        View results
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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

export default History;

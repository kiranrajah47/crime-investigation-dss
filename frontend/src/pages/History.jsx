import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Search, Plus, Archive, ChevronRight } from 'lucide-react';

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

  // Fetch case history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cases/history');
        setCases(response.data);
        setFilteredCases(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch case history', err);
        setError(err.response?.data?.message || 'Failed to load case history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

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
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">{score.toFixed(4)}</span>;
    } else if (score >= 0.50) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">{score.toFixed(4)}</span>;
    } else if (score >= 0.35) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{score.toFixed(4)}</span>;
    } else if (score >= 0.20) {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">{score.toFixed(4)}</span>;
    } else {
      return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{score.toFixed(4)}</span>;
    }
  };

  return (
    <Layout title="My case history" actions={topbarActions}>
      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 mb-4 flex flex-wrap gap-3 items-center shadow-sm text-left font-sans">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case title or top suspect..."
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
          <div className="text-slate-400 text-sm font-semibold">Loading history...</div>
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
            <p className="text-sm text-slate-400">
              <Link to="/" className="text-blue-500 hover:underline">
                Run your first analysis
              </Link>{' '}
              to see results here.
            </p>
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
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date run</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.case_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 truncate max-w-[200px]" title={c.title}>
                      {c.title || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{c.top_suspect || '—'}</td>
                    <td className="px-4 py-3">{getPriorityBadge(c.top_score)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.num_suspects}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{c.formatted_date}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/results/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-150 no-underline"
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
            <div className="text-center py-10 text-sm text-slate-400">
              No cases match your search or filter.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default History;

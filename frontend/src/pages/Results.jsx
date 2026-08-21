import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SuspectCard from '../components/SuspectCard';
import axios from 'axios';
import { Download, Plus, AlertTriangle, HelpCircle, FileText, Save, Sparkles } from 'lucide-react';

const Results = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [report, setReport] = useState([]);
  const [coherenceCheck, setCoherenceCheck] = useState(null);
  const [repeatSuspects, setRepeatSuspects] = useState([]);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesMessage, setNotesMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(0); // #1 suspect expanded by default

  // Optional Sentence-BERT state
  const [showSbert, setShowSbert] = useState(false);
  const [sbertData, setSbertData] = useState([]);
  const [sbertLoading, setSbertLoading] = useState(false);
  const [sbertError, setSbertError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/cases/${id}`);
        setCaseData(response.data.case);
        setReport(response.data.report || []);
        setCoherenceCheck(response.data.coherence_check || response.data.report?.coherence_check || null);
        setNotes(response.data.case?.notes || '');
        setError(null);

        try {
          const repeatRes = await axios.get(`/api/cases/${id}/repeat-suspects`);
          setRepeatSuspects(repeatRes.data.repeat_suspects || []);
        } catch (repeatErr) {
          console.error('Failed to fetch repeat suspects', repeatErr);
        }
      } catch (err) {
        console.error('Failed to fetch case details', err);
        setError(err.response?.data?.message || 'Failed to load case results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      setNotesMessage('');
      await axios.post(`/api/cases/${id}/notes`, { notes });
      setNotesMessage('Notes saved successfully.');
      setTimeout(() => setNotesMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save notes', err);
      setNotesMessage(err.response?.data?.message || 'Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggleSbert = async () => {
    if (showSbert) {
      setShowSbert(false);
      return;
    }

    setShowSbert(true);

    if (sbertData.length === 0 && !sbertLoading) {
      try {
        setSbertLoading(true);
        setSbertError(null);
        const res = await axios.get(`/api/cases/${id}/sbert-comparison`);
        if (Array.isArray(res.data)) {
          setSbertData(res.data);
        } else if (res.data && res.data.success === false) {
          setSbertError(res.data.message || 'Sentence-BERT comparison failed.');
        } else if (res.data && res.data.comparison) {
          setSbertData(res.data.comparison);
        }
      } catch (err) {
        console.error('Failed to fetch SBERT comparison', err);
        setSbertError(err.response?.data?.message || 'Sentence-BERT features are currently unavailable.');
      } finally {
        setSbertLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Layout title="Suspect ranking results">
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 spinner"></div>
          <div className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Retrieving case data...</div>
        </div>
      </Layout>
    );
  }

  if (error || !caseData) {
    return (
      <Layout title="Suspect ranking results">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Error Loading Case</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{error || 'Case details could not be found.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm no-underline"
          >
            Go back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  // Calculate score gap between top two suspects
  let scoreGap = 0;
  let hasLowConfidence = false;
  let hasModerateConfidence = false;

  if (report.length >= 2) {
    scoreGap = report[0].final_score - report[1].final_score;
    if (scoreGap < 0.08) {
      hasLowConfidence = true;
    } else if (scoreGap < 0.15) {
      hasModerateConfidence = true;
    }
  }

  const weightsUsed = report.length > 0 ? report[0].weights_used : null;
  const hasCoherenceWarning = coherenceCheck && (coherenceCheck.victim_evidence_mismatch || coherenceCheck.all_suspects_low_overlap);

  const topbarActions = (
    <>
      <a
        href={`/export/${caseData.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 gradient-brand text-white text-xs font-semibold rounded-lg shadow-sm hover:brightness-110 transition-all no-underline"
      >
        <Download className="w-3.5 h-3.5" />
        Download PDF
      </a>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm no-underline"
      >
        <Plus className="w-3.5 h-3.5" />
        New case
      </Link>
    </>
  );

  return (
    <Layout title="Suspect ranking results" actions={topbarActions}>
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-left font-sans">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Case ID</div>
          <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">
            {caseData.case_id}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Case title</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={caseData.title}>
            {caseData.title || '—'}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Analysed: {caseData.formatted_date}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Suspects evaluated</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{caseData.num_suspects}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Top suspect score</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{caseData.top_score.toFixed(4)}</div>
        </div>
      </div>

      {/* Weights Used */}
      {weightsUsed && (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-sm text-slate-700 dark:text-slate-200 mb-4 flex flex-wrap gap-x-5 gap-y-2 items-center shadow-sm text-left font-sans">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Weights used:</span>
          <span className="flex items-center gap-1.5">Physical evidence: <strong className="bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded text-xs font-semibold">{weightsUsed.physical_evidence}</strong></span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5">Witness statements: <strong className="bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded text-xs font-semibold">{weightsUsed.witness_statement}</strong></span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5">Past history: <strong className="bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded text-xs font-semibold">{weightsUsed.past_history}</strong></span>
          <span className="text-sky-300 dark:text-sky-600 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5">Alibi penalty: <strong className="bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded text-xs font-semibold">{weightsUsed.alibi_penalty}</strong></span>
        </div>
      )}

      {/* Repeat suspect warning indicator */}
      {repeatSuspects.length > 0 && (
        <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl px-5 py-3.5 mb-4 text-xs text-indigo-800 dark:text-indigo-200 shadow-sm text-left font-sans">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" />
          <div className="leading-relaxed space-y-1 flex-1">
            {repeatSuspects.map((item, idx) => (
              <div key={idx}>
                <strong>Repeat suspect detected</strong> — <strong>{item.name}</strong> has appeared as a top suspect in{' '}
                {item.appeared_in_cases.length} previous case{item.appeared_in_cases.length === 1 ? '' : 's'}:{' '}
                {item.appeared_in_cases.map((c, cIdx) => (
                  <span
                    key={cIdx}
                    className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium text-[11px] mx-0.5"
                    title={`Rank #${c.rank} (Score: ${c.score}) - ${c.date}`}
                  >
                    {c.title ? `${c.title} (${c.case_id})` : c.case_id}
                  </span>
                ))}
                . This may indicate a pattern worth investigating.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document coherence warning indicator */}
      {hasCoherenceWarning && (
        <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl px-5 py-3.5 mb-4 text-xs text-rose-800 dark:text-rose-200 shadow-sm text-left font-sans">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="leading-relaxed">
            <strong>Document mismatch warning</strong> — The uploaded documents show unusually low overlap with each other. This may indicate the victim, evidence, and suspect documents do not correspond to the same case. Please verify the correct files were uploaded before relying on these results.
          </div>
        </div>
      )}

      {/* Confidence warning indicators */}
      {hasLowConfidence && (
        <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 rounded-xl px-5 py-3.5 mb-4 text-xs text-orange-800 dark:text-orange-200 shadow-sm text-left font-sans">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
          <div className="leading-relaxed">
            <strong>Low confidence ranking</strong> — The top two suspects (
            <strong>{report[0].name}</strong> at {report[0].final_score.toFixed(4)} and{' '}
            <strong>{report[1].name}</strong> at {report[1].final_score.toFixed(4)})
            are scored very closely (gap: {scoreGap.toFixed(4)}).
            Further investigation of both is strongly recommended before drawing conclusions.
          </div>
        </div>
      )}

      {hasModerateConfidence && (
        <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900/50 rounded-xl px-5 py-3.5 mb-4 text-xs text-yellow-800 dark:text-yellow-200 shadow-sm text-left font-sans">
          <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
          <div className="leading-relaxed">
            <strong>Moderate confidence</strong> — Score gap between top two suspects is{' '}
            {scoreGap.toFixed(4)}. Consider investigating both before focusing solely on #1.
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-4">Click any suspect card to expand full details</p>

      {/* Suspect list */}
      <div className="flex-1 font-sans">
        {report.map((suspect, idx) => (
          <SuspectCard
            key={idx}
            suspect={suspect}
            index={idx + 1}
            isOpen={expandedIndex === idx}
            onToggle={() => setExpandedIndex(expandedIndex === idx ? -1 : idx)}
          />
        ))}
      </div>

      {/* Investigator notes card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mt-6 mb-4 text-left font-sans">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Investigator notes
          </h3>
          {notesMessage && (
            <span
              className={`text-xs font-semibold ${
                notesMessage.includes('Failed') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {notesMessage}
            </span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add investigative observations, interview notes, or follow-up tasks..."
          rows={4}
          className="w-full text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 resize-y transition-all placeholder-slate-400 dark:placeholder-slate-500"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {savingNotes ? 'Saving...' : 'Save notes'}
          </button>
        </div>
      </div>

      {/* Optional Sentence-BERT Comparison Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-4 text-left font-sans">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Sentence-BERT (SBERT) Semantic Comparison
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Optional deep semantic similarity model comparison (all-MiniLM-L6-v2) alongside TF-IDF scores.
            </p>
          </div>
          <button
            onClick={handleToggleSbert}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer font-sans"
          >
            {showSbert ? 'Hide SBERT Comparison' : 'Compare with Sentence-BERT'}
          </button>
        </div>

        {showSbert && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {sbertLoading ? (
              <div className="flex items-center justify-center py-8 gap-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold font-sans">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 spinner"></div>
                Calculating SBERT semantic embeddings...
              </div>
            ) : sbertError ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-300 font-medium font-sans">
                {sbertError}
              </div>
            ) : sbertData.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No comparison data available.</div>
            ) : (() => {
                const top4Tfidf = [...sbertData]
                  .sort((a, b) => (a.tfidf_rank ?? 99) - (b.tfidf_rank ?? 99))
                  .slice(0, 4)
                  .map(x => x.name);
                const top4Sbert = [...sbertData]
                  .sort((a, b) => (a.sbert_rank ?? 99) - (b.sbert_rank ?? 99))
                  .slice(0, 4)
                  .map(x => x.name);
                const matchCount = top4Tfidf.filter(n => top4Sbert.includes(n)).length;
                const cap = Math.min(4, sbertData.length);
                const allMatch = matchCount === cap && cap > 0;
                return (
                  <>
                    {/* Top-4 agreement summary */}
                    <div className={`mb-3 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${allMatch ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'}`}>
                      <span className="text-base leading-none">{allMatch ? '✓' : '⚠'}</span>
                      {allMatch
                        ? `Top ${cap} suspects match exactly between TF-IDF and SBERT rankings`
                        : `${matchCount} of top ${cap} suspects match between TF-IDF and SBERT rankings`}
                    </div>
                    <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Suspect Name</th>
                      <th className="px-4 py-2.5">TF-IDF Score</th>
                      <th className="px-4 py-2.5">Sentence-BERT Score</th>
                      <th className="px-4 py-2.5">Difference</th>
                      <th className="px-4 py-2.5">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {sbertData.map((item, idx) => {
                      const diffNum = item.sbert_score - item.tfidf_score;
                      const diffStr = (diffNum >= 0 ? '+' : '') + diffNum.toFixed(4);
                      const rc = item.rank_change ?? 0;
                      const tRank = item.tfidf_rank ?? '—';
                      const sRank = item.sbert_rank ?? '—';
                      let rankIndicator;
                      if (rc > 0) {
                        rankIndicator = <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">↑{rc}</span>;
                      } else if (rc < 0) {
                        rankIndicator = <span className="text-red-500 dark:text-red-400 font-bold ml-1">↓{Math.abs(rc)}</span>;
                      } else {
                        rankIndicator = <span className="text-slate-400 dark:text-slate-500 ml-1">—</span>;
                      }
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">{Number(item.tfidf_score).toFixed(4)}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{Number(item.sbert_score).toFixed(4)}</td>
                          <td className="px-4 py-2.5 font-mono">
                            <span className={diffNum >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                              {diffStr}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            #{tRank} → #{sRank}{rankIndicator}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
                  </>
                );
              })()
            }
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 text-xs text-slate-400 dark:text-slate-500 text-center mt-2 leading-relaxed">
        This ranking is generated by an AI decision-support system and is intended to assist —
        not replace — investigator judgment. All leads must be independently verified before any action is taken.
      </div>
    </Layout>
  );
};

export default Results;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SuspectCard from '../components/SuspectCard';
import axios from 'axios';
import {
  Download,
  Plus,
  AlertTriangle,
  HelpCircle,
  FileText,
  Save,
  Sparkles,
  Users,
  Hash,
  Trophy,
  Target,
  Activity,
  Shield,
  XCircle,
  Info,
  TrendingUp,
  Cpu,
  BarChart3,
  Fingerprint
} from 'lucide-react';

// ── Warning Alert Component ─────────────────────────────────────────────────
const IntelAlert = ({ severity = 'warning', icon: Icon, title, children }) => {
  const styles = {
    critical: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-200',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60 text-amber-800 dark:text-amber-200',
    moderate: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-900/60 text-yellow-800 dark:text-yellow-200',
    intel: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-200',
  };

  const iconStyles = {
    critical: 'text-rose-500',
    warning: 'text-amber-500',
    moderate: 'text-yellow-500',
    intel: 'text-indigo-500',
  };

  return (
    <div className={`flex items-start gap-3 border rounded-xl px-4 py-3.5 mb-4 text-xs shadow-xs fade-in ${styles[severity]}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconStyles[severity]}`} />
      <div className="leading-relaxed flex-1">
        <strong className="font-bold">{title}</strong>{' '}— {children}
      </div>
    </div>
  );
};

// ── Case Summary Metric Card ────────────────────────────────────────────────
const SummaryMetric = ({ label, value, sub, accent = false }) => (
  <div className={`rounded-xl px-4 py-3.5 border shadow-xs ${
    accent
      ? 'bg-navy-900 border-navy-700 text-white'
      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
  }`}>
    <div className={`text-[10px] font-mono uppercase tracking-wider font-semibold mb-1 ${
      accent ? 'text-blue-300' : 'text-slate-500 dark:text-slate-400'
    }`}>
      {label}
    </div>
    <div className={`font-mono font-extrabold text-xl tracking-tight leading-none ${
      accent ? 'text-white' : 'text-slate-900 dark:text-slate-50'
    }`}>
      {value}
    </div>
    {sub && (
      <div className={`text-[10px] mt-1 ${accent ? 'text-blue-300/70' : 'text-slate-400 dark:text-slate-500'}`}>
        {sub}
      </div>
    )}
  </div>
);

// ── Investigation Insight Badge ─────────────────────────────────────────────
const InsightBadge = ({ icon: Icon, label, value, color = 'slate' }) => {
  const colors = {
    slate: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
    blue: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/60 text-violet-700 dark:text-violet-300',
  };
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${colors[color]} text-xs`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80" />
      <div>
        <div className="font-semibold leading-tight">{label}</div>
        <div className="mt-0.5 opacity-75 text-[11px]">{value}</div>
      </div>
    </div>
  );
};

// ── Main Results Component ──────────────────────────────────────────────────
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
      setNotesMessage('Notes saved.');
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

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout title="Suspect Ranking Results">
        <div className="flex-1 flex flex-col items-center justify-center py-28 gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 spinner"></div>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-700 dark:text-slate-200 text-sm font-bold">Retrieving Case Intelligence...</div>
            <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">Loading ranked suspect analysis report</div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error || !caseData) {
    return (
      <Layout title="Suspect Ranking Results">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs max-w-md mx-auto mt-12">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/50 rounded-xl flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-300">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5">Case Record Not Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{error || 'Case details could not be retrieved from the system.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm no-underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Start New Investigation
          </Link>
        </div>
      </Layout>
    );
  }

  // ── Compute Confidence Gap ─────────────────────────────────────────────────
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

  // Build ranking confidence label
  const confidenceLabel =
    hasLowConfidence
      ? { label: 'Low Confidence', class: 'text-rose-600 dark:text-rose-400' }
      : hasModerateConfidence
      ? { label: 'Moderate Confidence', class: 'text-amber-600 dark:text-amber-400' }
      : { label: 'High Confidence', class: 'text-emerald-600 dark:text-emerald-400' };

  // Strongest evidence factor from top suspect
  const topSuspect = report[0] || null;
  let strongestFactor = null;
  if (topSuspect && topSuspect.score_breakdown) {
    const sb = topSuspect.score_breakdown;
    const factors = [
      { name: 'Physical Evidence', val: sb.physical_evidence },
      { name: 'Witness Link', val: sb.witness_statement },
      { name: 'Past Record', val: sb.past_history },
    ];
    factors.sort((a, b) => b.val - a.val);
    strongestFactor = factors[0];
  }

  // ── Topbar Actions ─────────────────────────────────────────────────────────
  const topbarActions = (
    <>
      <a
        href={`/export/${caseData.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 gradient-brand text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-all no-underline"
      >
        <Download className="w-3.5 h-3.5" />
        PDF Report
      </a>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs no-underline"
      >
        <Plus className="w-3.5 h-3.5" />
        New Case
      </Link>
    </>
  );

  return (
    <Layout title="Suspect Ranking Results" actions={topbarActions}>

      {/* ── Case Header Card ──────────────────────────────────────────────── */}
      <div className="bg-navy-900 rounded-2xl border border-navy-800/80 p-5 mb-5 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-blue-300">
                Case Intelligence Report
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight leading-tight m-0">
              {caseData.title || 'Untitled Investigation'}
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1.5">
              <span className="font-bold text-slate-300">{caseData.case_id}</span>
              <span>•</span>
              <span>Analysed: {caseData.formatted_date}</span>
              <span>•</span>
              <span className={`font-bold ${confidenceLabel.class}`}>
                {confidenceLabel.label}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryMetric
            label="Case ID"
            value={caseData.case_id}
            sub="System identifier"
          />
          <SummaryMetric
            label="Suspects Evaluated"
            value={caseData.num_suspects}
            sub={`${caseData.num_suspects} profile${caseData.num_suspects !== 1 ? 's' : ''} ranked`}
          />
          <SummaryMetric
            label="Top Suspect Score"
            value={caseData.top_score.toFixed(4)}
            sub={topSuspect ? topSuspect.name : ''}
            accent
          />
          <SummaryMetric
            label="Ranking Confidence"
            value={report.length >= 2 ? `Δ ${scoreGap.toFixed(4)}` : 'N/A'}
            sub="Top-2 score gap"
          />
        </div>
      </div>

      {/* ── Weights Used Strip ────────────────────────────────────────────── */}
      {weightsUsed && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 mb-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500">
              Evidence Weights Applied
            </span>
            {[
              { label: 'Physical Evidence', val: weightsUsed.physical_evidence },
              { label: 'Witness Statements', val: weightsUsed.witness_statement },
              { label: 'Past History', val: weightsUsed.past_history },
              { label: 'Alibi Penalty', val: weightsUsed.alibi_penalty },
            ].map((w) => (
              <span key={w.label} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">{w.label}:</span>
                <strong className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 text-[11px]">
                  {w.val}
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Investigation Insights Panel ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Investigation Insights
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-auto">
            Derived from analysis output
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InsightBadge
            icon={Users}
            label="Suspects Analysed"
            value={`${caseData.num_suspects} profile${caseData.num_suspects !== 1 ? 's' : ''} scored`}
            color="blue"
          />
          <InsightBadge
            icon={BarChart3}
            label="Ranking Confidence"
            value={confidenceLabel.label}
            color={hasLowConfidence ? 'amber' : hasModerateConfidence ? 'amber' : 'emerald'}
          />
          {strongestFactor && (
            <InsightBadge
              icon={TrendingUp}
              label="Strongest Evidence Factor"
              value={`${strongestFactor.name} (+${strongestFactor.val.toFixed(4)})`}
              color="violet"
            />
          )}
          <InsightBadge
            icon={Target}
            label="Top Suspect Score"
            value={caseData.top_score.toFixed(4)}
            color="slate"
          />
        </div>
      </div>

      {/* ── Warning Alerts ────────────────────────────────────────────────── */}
      {repeatSuspects.length > 0 && repeatSuspects.map((item, idx) => (
        <IntelAlert
          key={idx}
          severity="intel"
          icon={AlertTriangle}
          title="Repeat Suspect Detected"
        >
          <strong>{item.name}</strong> has appeared as a top-ranked suspect in{' '}
          {item.appeared_in_cases.length} previous case{item.appeared_in_cases.length === 1 ? '' : 's'}:{' '}
          {item.appeared_in_cases.map((c, cIdx) => (
            <span
              key={cIdx}
              className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium text-[11px] mx-0.5 font-mono"
              title={`Rank #${c.rank} (Score: ${c.score}) — ${c.date}`}
            >
              {c.title ? `${c.title} (${c.case_id})` : c.case_id}
            </span>
          ))}
          . This may indicate a pattern of criminal behaviour worth cross-referencing.
        </IntelAlert>
      ))}

      {hasCoherenceWarning && (
        <IntelAlert severity="critical" icon={XCircle} title="Document Mismatch Warning">
          The uploaded documents show unusually low semantic overlap between victim, evidence, and suspect narratives.
          This may indicate the files do not correspond to the same case. Verify all three documents before relying on these rankings.
        </IntelAlert>
      )}

      {hasLowConfidence && (
        <IntelAlert severity="warning" icon={AlertTriangle} title="Low Confidence Ranking">
          The top two suspects — <strong>{report[0].name}</strong> ({report[0].final_score.toFixed(4)}) and{' '}
          <strong>{report[1].name}</strong> ({report[1].final_score.toFixed(4)}) — are very closely scored
          (gap: <strong className="font-mono">{scoreGap.toFixed(4)}</strong>). Independent investigative
          corroboration of both is strongly recommended before drawing conclusions.
        </IntelAlert>
      )}

      {hasModerateConfidence && (
        <IntelAlert severity="moderate" icon={HelpCircle} title="Moderate Confidence">
          Score gap between top two suspects is <strong className="font-mono">{scoreGap.toFixed(4)}</strong>.
          Consider investigating both suspects before focusing solely on the primary lead.
        </IntelAlert>
      )}

      {/* ── Suspect Ranking List ──────────────────────────────────────────── */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight m-0">
              Ranked Suspect Intelligence
            </h3>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              ({report.length} suspect{report.length !== 1 ? 's' : ''})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Click any card to expand full details
          </span>
        </div>

        <div>
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
      </div>

      {/* ── Investigator Notes ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs mt-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 m-0">
            <FileText className="w-4 h-4 text-slate-400" />
            Investigator Notes
          </h3>
          {notesMessage && (
            <span className={`text-xs font-semibold ${
              notesMessage.toLowerCase().includes('fail') ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {notesMessage}
            </span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Record investigative observations, interview notes, follow-up leads, or operational directives..."
          rows={4}
          className="w-full text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 resize-y transition-all placeholder-slate-400 dark:placeholder-slate-500 font-mono leading-relaxed"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {/* ── Optional Sentence-BERT Comparison ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 m-0">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Sentence-BERT Semantic Comparison
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Deep semantic similarity model (all-MiniLM-L6-v2) alongside TF-IDF primary scores.
            </p>
          </div>
          <button
            onClick={handleToggleSbert}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            {showSbert ? 'Hide SBERT Comparison' : 'Compare with Sentence-BERT'}
          </button>
        </div>

        {showSbert && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {sbertLoading ? (
              <div className="flex items-center justify-center py-8 gap-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 spinner"></div>
                Calculating semantic embeddings...
              </div>
            ) : sbertError ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
                {sbertError}
              </div>
            ) : sbertData.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center font-mono">
                No comparison data available.
              </div>
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
                  <div className={`mb-3 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                    allMatch
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                  }`}>
                    <span>{allMatch ? '✓' : '⚠'}</span>
                    {allMatch
                      ? `Top ${cap} suspects match exactly between TF-IDF and SBERT rankings`
                      : `${matchCount} of top ${cap} suspects match between TF-IDF and SBERT rankings`}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-2.5">Suspect Name</th>
                          <th className="px-4 py-2.5">TF-IDF Score</th>
                          <th className="px-4 py-2.5">SBERT Score</th>
                          <th className="px-4 py-2.5">Rank Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                        {sbertData.map((item, idx) => {
                          const rc = item.rank_change ?? 0;
                          const tRank = item.tfidf_rank ?? '—';
                          const sRank = item.sbert_rank ?? '—';
                          let rankIndicator;
                          if (rc > 0) {
                            rankIndicator = <span className="text-emerald-600 dark:text-emerald-400 font-bold">↑{rc}</span>;
                          } else if (rc < 0) {
                            rankIndicator = <span className="text-rose-500 dark:text-rose-400 font-bold">↓{Math.abs(rc)}</span>;
                          } else {
                            rankIndicator = <span className="text-slate-400">—</span>;
                          }
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{Number(item.tfidf_score).toFixed(4)}</td>
                              <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">{Number(item.sbert_score).toFixed(4)}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                #{tRank} → #{sRank} {rankIndicator}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Legal Disclaimer ──────────────────────────────────────────────── */}
      <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl px-6 py-4 text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2 leading-relaxed font-mono">
        This ranking is generated by an AI decision-support system and is intended to assist — not replace — investigator judgment.
        All leads must be independently verified and corroborated before any action is taken.
      </div>
    </Layout>
  );
};

export default Results;

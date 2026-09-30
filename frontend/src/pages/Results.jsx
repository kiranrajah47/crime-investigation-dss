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

  // Model comparison state (TF-IDF primary, Sentence-BERT secondary)
  const [showSbert, setShowSbert] = useState(true);
  const [sbertData, setSbertData] = useState([]);
  const [sbertLoading, setSbertLoading] = useState(false);
  const [sbertError, setSbertError] = useState(null);

  const fetchSbertComparison = async () => {
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
      console.warn('Sentence-BERT comparison fetch error', err);
      setSbertError(err.response?.data?.message || 'Sentence-BERT features are currently unavailable.');
    } finally {
      setSbertLoading(false);
    }
  };

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

        // Auto-fetch secondary Sentence-BERT comparison
        fetchSbertComparison();
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

  const handleToggleSbert = () => {
    if (!showSbert && sbertData.length === 0 && !sbertLoading) {
      fetchSbertComparison();
    }
    setShowSbert(!showSbert);
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
      { name: 'Evidence-Text Similarity', val: sb.physical_evidence },
      { name: 'Victim/Witness Similarity', val: sb.witness_statement },
      { name: 'Past History Match', val: sb.past_history },
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
              { label: 'Evidence-Text Similarity', val: weightsUsed.physical_evidence },
              { label: 'Victim/Witness Similarity', val: weightsUsed.witness_statement },
              { label: 'Past History Weight', val: weightsUsed.past_history },
              { label: 'Alibi Verification Penalty', val: weightsUsed.alibi_penalty },
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

      {/* ── Document Consistency Warning (Requirement 4) ──────────────────── */}
      {hasCoherenceWarning && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 mb-4 text-xs shadow-xs fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                ⚠ Document consistency warning
              </div>
              <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed m-0">
                The uploaded documents show unusually low overlap. Verify that the victim, evidence and suspect documents belong to the same case before relying on the ranking.
              </p>
              {coherenceCheck?.victim_evidence_similarity !== undefined && (
                <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 pt-0.5">
                  Victim-evidence overlap: {coherenceCheck.victim_evidence_similarity.toFixed(4)} (Threshold: 0.10)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Low Confidence / Close Ranking Warning (Requirement 5) ───────── */}
      {hasLowConfidence && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 mb-4 text-xs shadow-xs fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                <span>LOW CONFIDENCE</span>
                <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                  Gap: Δ {scoreGap.toFixed(4)}
                </span>
              </div>
              <p className="text-rose-800 dark:text-rose-300 text-xs leading-relaxed m-0">
                The top suspects ({report[0]?.name} and {report[1]?.name}) have very similar scores. Additional investigation is recommended before drawing conclusions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Moderate Confidence Notice ───────────────────────────────────── */}
      {hasModerateConfidence && !hasLowConfidence && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5 mb-4 text-xs shadow-xs fade-in">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                Moderate confidence ranking
              </div>
              <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed m-0">
                Score gap between top two suspects is <strong className="font-mono">{scoreGap.toFixed(4)}</strong>. Consider investigating both suspects before focusing solely on the primary lead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Similarity-Based Verification Notice (Requirement 6) ─────────── */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 mb-4 font-sans shadow-xs">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div>
          <strong>Similarity-based result — requires investigator verification:</strong>{' '}
          High textual similarity does not necessarily mean confirmed involvement. Scores represent mathematical correlation between suspect profiles and case documents.
        </div>
      </div>

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

      {/* ── Model Agreement (TF-IDF Primary vs Sentence-BERT Secondary) ──── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide font-mono m-0">
                Model Agreement
              </h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Primary TF-IDF lexical ranking cross-referenced with Sentence-BERT (all-MiniLM-L6-v2) semantic embeddings.
            </p>
          </div>
          <button
            onClick={handleToggleSbert}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            {showSbert ? 'Collapse Comparison' : 'Show Model Agreement'}
          </button>
        </div>

        {showSbert && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {sbertLoading ? (
              <div className="flex items-center justify-center py-8 gap-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 spinner"></div>
                Computing Sentence-BERT semantic similarity embeddings...
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
              const cap = Math.min(4, sbertData.length);
              const top4TfidfList = [...sbertData]
                .sort((a, b) => (a.tfidf_rank ?? 99) - (b.tfidf_rank ?? 99))
                .slice(0, cap);
              const top4SbertList = [...sbertData]
                .sort((a, b) => (a.sbert_rank ?? 99) - (b.sbert_rank ?? 99))
                .slice(0, cap);

              const top4TfidfNames = top4TfidfList.map(x => x.name);
              const top4SbertNames = top4SbertList.map(x => x.name);
              const matchCount = top4TfidfNames.filter(n => top4SbertNames.includes(n)).length;
              const allMatch = matchCount === cap && cap > 0;

              return (
                <div className="space-y-4">
                  {/* Agreement Summary Banner */}
                  <div className={`px-4 py-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                    allMatch
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-900/60'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-2xs">
                        {matchCount} / {cap}
                      </span>
                      <span className="font-medium">
                        top suspects overlap between TF-IDF primary and Sentence-BERT secondary rankings
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold">
                        TF-IDF: PRIMARY
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold">
                        SBERT: SECONDARY
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Top Suspects Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TF-IDF Column */}
                    <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-4">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-3 flex items-center justify-between">
                        <span>TF-IDF ranking (Primary)</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-normal">
                          Official Case Order
                        </span>
                      </div>
                      <div className="space-y-2">
                        {top4TfidfList.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-mono font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                                #{item.tfidf_rank}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold ml-2">
                              {Number(item.tfidf_score).toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SBERT Column */}
                    <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 p-4">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-3 flex items-center justify-between">
                        <span>SBERT ranking (Secondary)</span>
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-normal">
                          Semantic Order
                        </span>
                      </div>
                      <div className="space-y-2">
                        {top4SbertList.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-mono font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                                #{item.sbert_rank}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold ml-2">
                              {Number(item.sbert_score).toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Complete Cross-Model Comparison Table */}
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Full suspect model comparison matrix
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <th className="px-3.5 py-2.5">Suspect Name</th>
                            <th className="px-3.5 py-2.5 text-right">TF-IDF (Primary)</th>
                            <th className="px-3.5 py-2.5 text-right">SBERT (Secondary)</th>
                            <th className="px-3.5 py-2.5 text-center">Rank Progression</th>
                            <th className="px-3.5 py-2.5 text-center">Shift</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                          {sbertData.map((item, idx) => {
                            const rc = item.rank_change ?? 0;
                            const tRank = item.tfidf_rank ?? '—';
                            const sRank = item.sbert_rank ?? '—';
                            return (
                              <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-3.5 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-100">
                                  {item.name}
                                </td>
                                <td className="px-3.5 py-2.5 text-right text-blue-600 dark:text-blue-400 font-bold">
                                  {Number(item.tfidf_score).toFixed(4)}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                  {Number(item.sbert_score).toFixed(4)}
                                </td>
                                <td className="px-3.5 py-2.5 text-center text-slate-600 dark:text-slate-300">
                                  #{tRank} → #{sRank}
                                </td>
                                <td className="px-3.5 py-2.5 text-center">
                                  {rc > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">↑{rc}</span>
                                  ) : rc < 0 ? (
                                    <span className="text-rose-500 dark:text-rose-400 font-bold">↓{Math.abs(rc)}</span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Model Agreement Explanation Note */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    <strong>Model Agreement Methodology:</strong> TF-IDF is the primary deterministic ranking based on case-specific keyword frequencies and heuristic weights. Sentence-BERT acts purely as an independent secondary semantic comparison layer to highlight suspects whose narrative matches conceptually even when phrasing differs. Primary rankings and scores remain unaltered.
                  </div>
                </div>
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

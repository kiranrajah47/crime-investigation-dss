import React from 'react';
import {
  ChevronDown,
  ShieldAlert,
  FileSearch2,
  Eye,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  FileSearch,
  Hash,
  Info,
  AlertTriangle,
  Clock
} from 'lucide-react';

// ── Score label helper ────────────────────────────────────────────────────────
const sim_label = (val) => {
  if (val >= 0.60) return { text: 'High', cls: 'text-red-600 dark:text-red-400' };
  if (val >= 0.30) return { text: 'Moderate', cls: 'text-amber-600 dark:text-amber-400' };
  return { text: 'Low', cls: 'text-slate-500 dark:text-slate-400' };
};

const SuspectCard = ({ suspect, index, isOpen, onToggle }) => {
  const finalScore = suspect.final_score;

  const priority = suspect.priority || (
    finalScore >= 0.55 ? 'Primary suspect' : finalScore >= 0.30 ? 'Secondary suspect' : 'Low concern'
  );

  const isRank1 = suspect.rank === 1;
  const isRank2 = suspect.rank === 2;
  const isRank3 = suspect.rank === 3;

  // ── Theme by priority and rank ──────────────────────────────────────────
  let theme = {
    cardBorder: 'border-slate-200 dark:border-slate-800',
    accentBorder: 'border-l-emerald-500 dark:border-l-emerald-400',
    rankBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
    confBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    confLabel: 'Weak signal',
    prioBadge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    prioLabel: 'Low concern',
    barColor: 'bg-emerald-500',
    scoreColor: 'text-slate-800 dark:text-slate-100'
  };

  if (priority === 'Primary suspect') {
    theme = {
      cardBorder: isRank1 ? 'border-red-300 dark:border-red-900/80 ring-1 ring-red-500/20' : isRank2 ? 'border-amber-300 dark:border-amber-900/70' : 'border-slate-200 dark:border-slate-800',
      accentBorder: 'border-l-red-600 dark:border-l-red-500',
      rankBg: isRank1
        ? 'bg-red-600 text-white border-red-700 shadow-sm'
        : isRank2
        ? 'bg-red-500 text-white border-red-600'
        : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800',
      confBadge: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      confLabel: 'Strong signal',
      prioBadge: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800',
      prioLabel: 'Primary suspect',
      barColor: 'bg-red-500',
      scoreColor: 'text-red-700 dark:text-red-400'
    };
  } else if (priority === 'Secondary suspect') {
    theme = {
      cardBorder: isRank2 ? 'border-amber-300 dark:border-amber-900/70' : isRank3 ? 'border-indigo-200 dark:border-indigo-900/60' : 'border-slate-200 dark:border-slate-800',
      accentBorder: 'border-l-amber-500 dark:border-l-amber-400',
      rankBg: isRank2
        ? 'bg-amber-500 text-white border-amber-600'
        : isRank3
        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      confBadge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      confLabel: 'Moderate signal',
      prioBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      prioLabel: 'Secondary suspect',
      barColor: 'bg-amber-500',
      scoreColor: 'text-amber-700 dark:text-amber-400'
    };
  }

  const getPercentage = (val, max = 1.0) => {
    if (!max || max <= 0) return 0;
    return Math.min(Math.max(Math.round((Math.abs(val) / max) * 100), 0), 100);
  };

  const scorePercent = Math.min(Math.max(Math.round(finalScore * 100), 0), 100);

  const maxSignals = 8;
  const visibleSignals = suspect.signals ? suspect.signals.slice(0, maxSignals) : [];
  const excessSignals = (suspect.signals?.length || 0) - maxSignals;

  // Pre-compute similarity labels from actual backend values
  const evLabel  = sim_label(suspect.evidence_sim);
  const vicLabel = sim_label(suspect.victim_sim);

  return (
    <div className={`bg-white dark:bg-slate-900 border ${theme.cardBorder} border-l-4 ${theme.accentBorder} rounded-xl mb-3.5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200`}>

      {/* ── Collapsed header ─────────────────────────────────────────────── */}
      <div
        onClick={onToggle}
        className="px-5 py-4 cursor-pointer select-none hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Rank badge */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm flex-shrink-0 border ${theme.rankBg}`}>
            #{suspect.rank}
          </div>

          {/* Name + badges */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight m-0">
                {suspect.name}
              </h3>
              {isRank1 && (
                <span className="text-[10px] font-mono uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  #1 Primary Lead
                </span>
              )}
              {isRank2 && (
                <span className="text-[10px] font-mono uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800/80 flex items-center gap-1">
                  #2 Secondary Lead
                </span>
              )}
              {isRank3 && (
                <span className="text-[10px] font-mono uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  #3 Follow-up Lead
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.prioBadge}`}>
                {theme.prioLabel}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.confBadge}`}>
                {theme.confLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Score + mini-meter + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-[10px] text-slate-400 font-mono">Score</span>
              <span className={`text-base font-mono font-extrabold tracking-tight ${theme.scoreColor}`}>
                {finalScore.toFixed(4)}
              </span>
            </div>
            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
              <div
                className={`h-full ${theme.barColor} rounded-full`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* ── Expanded body ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-5 space-y-5 bg-slate-50/30 dark:bg-slate-900/50 fade-in">

          {/* ── Similarity disclaimer banner ─────────────────────────────── */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-700 dark:text-blue-300">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
            <span>
              <strong>Similarity-based result</strong> — scores measure textual overlap between profile text and case documents.
              High similarity does not confirm involvement. Requires investigator verification.
            </span>
          </div>

          {/* ── WHY THIS SUSPECT RANKED HERE ─────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Why this suspect ranked here
              </span>
            </div>

            <div className="p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
              {/* Evidence similarity */}
              <div className="flex items-start gap-2.5">
                <FileSearch2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Evidence-text similarity:</span>{' '}
                  <span className={`font-mono font-bold ${evLabel.cls}`}>{suspect.evidence_sim.toFixed(4)}</span>
                  <span className={`ml-1 text-[10px] font-medium ${evLabel.cls}`}>({evLabel.text})</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    — TF-IDF cosine similarity between suspect profile and evidence document.
                  </span>
                </div>
              </div>

              {/* Victim / witness similarity */}
              <div className="flex items-start gap-2.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Victim / witness similarity:</span>{' '}
                  <span className={`font-mono font-bold ${vicLabel.cls}`}>{suspect.victim_sim.toFixed(4)}</span>
                  <span className={`ml-1 text-[10px] font-medium ${vicLabel.cls}`}>({vicLabel.text})</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    — TF-IDF cosine similarity between suspect profile and victim/incident document.
                  </span>
                </div>
              </div>

              {/* Past history */}
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Past history:</span>{' '}
                  <span className="font-mono font-bold text-violet-600 dark:text-violet-400">{suspect.past_history_score.toFixed(4)}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    — keyword-based detection of prior criminal record, conflict, or modus operandi in profile text.
                  </span>
                </div>
              </div>

              {/* Alibi */}
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Alibi strength:</span>{' '}
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{suspect.alibi_score.toFixed(4)}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    — keyword-based detection of verified alibi phrases; higher value reduces the final score.
                  </span>
                </div>
              </div>

              {/* Key signals listed */}
              {visibleSignals.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <Hash className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Key signals detected:</span>{' '}
                    <span className="text-slate-500 dark:text-slate-400">
                      {visibleSignals.map((s, i) => (
                        <span key={i}>
                          <span className={s.type === 'against' ? 'text-rose-600 dark:text-rose-400 font-medium' : s.type === 'for' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                            {s.label}
                          </span>
                          {i < visibleSignals.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      {excessSignals > 0 && <span className="text-slate-400"> +{excessSignals} more</span>}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── System explanation (from backend) ────────────────────────── */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <BrainCircuit className="w-3 h-3 text-blue-500" />
              System interpretation
            </div>
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {suspect.explanation}
            </div>
          </div>

          {/* ── Signal tags ──────────────────────────────────────────────── */}
          {visibleSignals.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                Detected signals
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visibleSignals.map((signal, idx) => {
                  const isAgainst = signal.type === 'against';
                  const isFor = signal.type === 'for';
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                        isAgainst
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                          : isFor
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isAgainst ? (
                        <AlertCircle className="w-2.5 h-2.5 text-rose-500 flex-shrink-0" />
                      ) : isFor ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                      ) : null}
                      {signal.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Score breakdown 2×2 grid ──────────────────────────────────── */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Score contribution breakdown
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Evidence-text similarity */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <FileSearch2 className="w-3 h-3 text-blue-500" />
                    Evidence-text similarity
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    +{suspect.score_breakdown.physical_evidence.toFixed(4)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getPercentage(suspect.evidence_sim)}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">raw cosine: {suspect.evidence_sim.toFixed(4)}</div>
              </div>

              {/* Victim / witness similarity */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-indigo-500" />
                    Victim / witness similarity
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    +{suspect.score_breakdown.witness_statement.toFixed(4)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${getPercentage(suspect.victim_sim)}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">raw cosine: {suspect.victim_sim.toFixed(4)}</div>
              </div>

              {/* Past history */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-violet-500" />
                    Past history (keyword)
                  </span>
                  <span className="font-mono text-violet-600 dark:text-violet-400 font-bold">
                    +{suspect.score_breakdown.past_history.toFixed(4)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${getPercentage(suspect.past_history_score)}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">raw score: {suspect.past_history_score.toFixed(4)}</div>
              </div>

              {/* Alibi penalty */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Alibi penalty (keyword)
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {suspect.score_breakdown.alibi_penalty < 0 ? '' : '+'}
                    {suspect.score_breakdown.alibi_penalty.toFixed(4)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getPercentage(suspect.alibi_score)}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">strength: {suspect.alibi_score.toFixed(4)}</div>
              </div>
            </div>
          </div>

          {/* ── Full score table ──────────────────────────────────────────── */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Complete score table
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/90 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                    <th className="px-3 py-2 text-left">Component</th>
                    <th className="px-3 py-2 text-right">Raw value</th>
                    <th className="px-3 py-2 text-right">Weighted contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
                  <tr>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200 font-sans text-xs">Evidence-text similarity (TF-IDF cosine)</td>
                    <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">{suspect.evidence_sim.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">+{suspect.score_breakdown.physical_evidence.toFixed(4)}</td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200 font-sans text-xs">Victim / witness similarity (TF-IDF cosine)</td>
                    <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">{suspect.victim_sim.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">+{suspect.score_breakdown.witness_statement.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200 font-sans text-xs">Past history (keyword match ratio)</td>
                    <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">{suspect.past_history_score.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-bold text-violet-600 dark:text-violet-400">+{suspect.score_breakdown.past_history.toFixed(4)}</td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                    <td className="px-3 py-2 text-emerald-700 dark:text-emerald-400 font-sans text-xs">Alibi penalty (keyword match ratio)</td>
                    <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">{suspect.alibi_score.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {suspect.score_breakdown.alibi_penalty < 0 ? '' : '+'}{suspect.score_breakdown.alibi_penalty.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 dark:bg-slate-700/60 border-t border-slate-200 dark:border-slate-700 font-bold">
                    <td className="px-3 py-2.5 text-slate-900 dark:text-slate-100 font-sans text-xs">Final weighted score (clamped 0–1)</td>
                    <td className="px-3 py-2.5"></td>
                    <td className="px-3 py-2.5 text-right text-sm text-slate-900 dark:text-slate-100">{finalScore.toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Matched profile excerpt ──────────────────────────────────── */}
          {suspect.highlighted_text && (
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileSearch className="w-3 h-3 text-slate-500" />
                Profile text (top matching terms highlighted)
              </div>
              <div
                className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-44 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: suspect.highlighted_text }}
              />
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default SuspectCard;

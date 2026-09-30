import React from 'react';
import {
  ChevronDown,
  ShieldAlert,
  Fingerprint,
  Eye,
  History,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  FileSearch,
  Scale
} from 'lucide-react';

const SuspectCard = ({ suspect, index, isOpen, onToggle }) => {
  const finalScore = suspect.final_score;

  const priority = suspect.priority || (
    finalScore >= 0.55 ? 'Primary suspect' : finalScore >= 0.30 ? 'Secondary suspect' : 'Low concern'
  );

  const isTopRanked = suspect.rank === 1;

  // Theming based on priority
  let theme = {
    cardBorder: 'border-slate-200 dark:border-slate-800',
    accentBorder: 'border-l-emerald-500 dark:border-l-emerald-400',
    rankBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    confBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    confLabel: 'Weak signal',
    prioBadge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    prioLabel: 'Low concern',
    barColor: 'bg-emerald-500'
  };

  if (priority === 'Primary suspect') {
    theme = {
      cardBorder: isTopRanked ? 'border-red-300 dark:border-red-900/80 ring-1 ring-red-500/20' : 'border-slate-200 dark:border-slate-800',
      accentBorder: 'border-l-red-600 dark:border-l-red-500',
      rankBg: 'bg-red-600 text-white border-red-700 shadow-xs',
      confBadge: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      confLabel: 'Strong signal',
      prioBadge: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800',
      prioLabel: 'Primary suspect',
      barColor: 'bg-red-600'
    };
  } else if (priority === 'Secondary suspect') {
    theme = {
      cardBorder: 'border-slate-200 dark:border-slate-800',
      accentBorder: 'border-l-amber-500 dark:border-l-amber-400',
      rankBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      confBadge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      confLabel: 'Moderate signal',
      prioBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      prioLabel: 'Secondary suspect',
      barColor: 'bg-amber-500'
    };
  }

  // Calculate percentage safely
  const getPercentage = (val, max = 1.0) => {
    if (!max || max <= 0) return 0;
    const pct = Math.round((Math.abs(val) / max) * 100);
    return Math.min(Math.max(pct, 0), 100);
  };

  const scorePercent = Math.min(Math.max(Math.round(finalScore * 100), 0), 100);

  const maxSignals = 6;
  const totalSignals = suspect.signals ? suspect.signals.length : 0;
  const visibleSignals = suspect.signals ? suspect.signals.slice(0, maxSignals) : [];
  const excessSignals = totalSignals - maxSignals;

  return (
    <div
      className={`bg-white dark:bg-slate-900 border ${theme.cardBorder} border-l-4 ${theme.accentBorder} rounded-xl mb-3.5 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200`}
    >
      {/* Header bar (clickable) */}
      <div
        onClick={onToggle}
        className="px-5 py-4 cursor-pointer select-none hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Rank Badge */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm flex-shrink-0 border ${theme.rankBg}`}
          >
            #{suspect.rank}
          </div>

          {/* Suspect Name and Core Badges */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate m-0">
                {suspect.name}
              </h3>
              {isTopRanked && (
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Top Lead
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.prioBadge}`}>
                {theme.prioLabel}
              </span>
              <span>•</span>
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.confBadge}`}>
                {theme.confLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Score Metric + Chevron */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">Score</span>
              <span className="text-lg font-mono font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {finalScore.toFixed(4)}
              </span>
            </div>
            {/* Horizontal Mini-Meter */}
            <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1 ml-auto">
              <div
                className={`h-full ${theme.barColor} rounded-full transition-all duration-300`}
                style={{ width: `${scorePercent}%` }}
              ></div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-5 fade-in space-y-5 bg-slate-50/40 dark:bg-slate-900/40">
          
          {/* Section 1: Score breakdown meters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Evidence Score Breakdown
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                Weighted algorithmic contribution
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Physical Evidence */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                    <Fingerprint className="w-3.5 h-3.5 text-blue-500" />
                    Physical Evidence
                  </span>
                  <div className="font-mono text-xs">
                    <strong className="text-blue-600 dark:text-blue-400">
                      +{suspect.score_breakdown.physical_evidence.toFixed(4)}
                    </strong>
                    <span className="text-slate-400 text-[10px] ml-1">
                      (raw: {suspect.evidence_sim.toFixed(4)})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${getPercentage(suspect.evidence_sim, 1.0)}%` }}
                  ></div>
                </div>
              </div>

              {/* Witness / Victim Link */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    Witness / Victim Link
                  </span>
                  <div className="font-mono text-xs">
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      +{suspect.score_breakdown.witness_statement.toFixed(4)}
                    </strong>
                    <span className="text-slate-400 text-[10px] ml-1">
                      (raw: {suspect.victim_sim.toFixed(4)})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${getPercentage(suspect.victim_sim, 1.0)}%` }}
                  ></div>
                </div>
              </div>

              {/* Past Criminal History */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                    <History className="w-3.5 h-3.5 text-violet-500" />
                    Past Criminal Record
                  </span>
                  <div className="font-mono text-xs">
                    <strong className="text-violet-600 dark:text-violet-400">
                      +{suspect.score_breakdown.past_history.toFixed(4)}
                    </strong>
                    <span className="text-slate-400 text-[10px] ml-1">
                      (raw: {suspect.past_history_score.toFixed(4)})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full transition-all"
                    style={{ width: `${getPercentage(suspect.past_history_score, 1.0)}%` }}
                  ></div>
                </div>
              </div>

              {/* Alibi Strength (Penalty) */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Alibi Exoneration Penalty
                  </span>
                  <div className="font-mono text-xs">
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {suspect.score_breakdown.alibi_penalty < 0 ? '' : '+'}
                      {suspect.score_breakdown.alibi_penalty.toFixed(4)}
                    </strong>
                    <span className="text-slate-400 text-[10px] ml-1">
                      (strength: {suspect.alibi_score.toFixed(4)})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${getPercentage(suspect.alibi_score, 1.0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Key Evidence Signals */}
          {suspect.signals && suspect.signals.length > 0 && (
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Key Evidence Signals
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleSignals.map((signal, idx) => {
                  const isAgainst = signal.type === 'against';
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        isAgainst
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                      }`}
                    >
                      {isAgainst ? (
                        <AlertCircle className="w-3 h-3 text-rose-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      )}
                      <span>{signal.label}</span>
                    </span>
                  );
                })}
                {excessSignals > 0 && (
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    +{excessSignals} additional signals
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Section 3: System Reasoning Callout */}
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Algorithmic Reasoning Brief
            </div>
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-200 leading-relaxed shadow-2xs">
              {suspect.explanation}
            </div>
          </div>

          {/* Section 4: Matched Profile Text */}
          {suspect.highlighted_text && (
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-slate-500" />
                Matched Profile Narrative Excerpt
              </div>
              <div
                className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: suspect.highlighted_text }}
              />
            </div>
          )}

          {/* Section 5: Weighted Score Breakdown Table */}
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Full Mathematical Matrix
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/90 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-2.5 text-left uppercase">Evidence Component</th>
                    <th className="px-4 py-2.5 text-right uppercase">Raw Cosine / Score</th>
                    <th className="px-4 py-2.5 text-right uppercase">Weighted Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                  <tr>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 font-sans">Physical evidence correlation</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{suspect.evidence_sim.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">
                      +{suspect.score_breakdown.physical_evidence.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 font-sans">Witness statements &amp; victim link</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{suspect.victim_sim.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      +{suspect.score_breakdown.witness_statement.toFixed(4)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 font-sans">Past criminal record &amp; MO</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{suspect.past_history_score.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-violet-600 dark:text-violet-400">
                      +{suspect.score_breakdown.past_history.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                    <td className="px-4 py-2.5 text-emerald-700 dark:text-emerald-400 font-sans font-medium">Alibi verification penalty</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">{suspect.alibi_score.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {suspect.score_breakdown.alibi_penalty < 0 ? '' : '+'}
                      {suspect.score_breakdown.alibi_penalty.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 dark:bg-slate-750 font-bold border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 font-sans">Final Guilt-Likelihood Score</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right text-base text-slate-900 dark:text-slate-100">
                      {finalScore.toFixed(4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspectCard;

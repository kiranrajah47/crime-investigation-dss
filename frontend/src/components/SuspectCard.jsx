import React from 'react';
import { ChevronDown } from 'lucide-react';

const SuspectCard = ({ suspect, index, isOpen, onToggle }) => {
  const finalScore = suspect.final_score;

  const priority = suspect.priority || (
    finalScore >= 0.55 ? 'Primary suspect' : finalScore >= 0.30 ? 'Secondary suspect' : 'Low concern'
  );

  let theme = {
    borderColor: 'border-l-emerald-400',
    rankBg: 'bg-emerald-100 text-emerald-700',
    confClass: 'bg-slate-100 text-slate-500',
    confLabel: 'Weak signal',
    prioLabel: 'Low concern',
    prioText: 'text-emerald-600',
    fillColor: 'bg-slate-400'
  };

  if (priority === 'Primary suspect') {
    theme = {
      borderColor: 'border-l-red-500',
      rankBg: 'bg-red-100 text-red-700',
      confClass: 'bg-green-100 text-green-700',
      confLabel: 'Strong signal',
      prioLabel: 'Primary suspect',
      prioText: 'text-red-600',
      fillColor: 'bg-red-500'
    };
  } else if (priority === 'Secondary suspect') {
    theme = {
      borderColor: 'border-l-orange-400',
      rankBg: 'bg-orange-100 text-orange-700',
      confClass: 'bg-amber-100 text-amber-700',
      confLabel: 'Moderate signal',
      prioLabel: 'Secondary suspect',
      prioText: 'text-orange-700',
      fillColor: 'bg-orange-400'
    };
  }

  // Cap progress bars at 100%
  const getPercentage = (val, max) => {
    const pct = Math.round((val / max) * 100);
    return Math.min(Math.max(pct, 0), 100);
  };

  const maxSignals = 6;
  const totalSignals = suspect.signals ? suspect.signals.length : 0;
  const visibleSignals = suspect.signals ? suspect.signals.slice(0, maxSignals) : [];
  const excessSignals = totalSignals - maxSignals;

  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${theme.borderColor} rounded-xl mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {/* Header (clickable) */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors duration-150"
        onClick={onToggle}
      >
        <div className={`w-9 h-9 rounded-full ${theme.rankBg} text-sm font-bold flex items-center justify-center flex-shrink-0`}>
          #{suspect.rank}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-800">{suspect.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Score: <strong className="text-slate-700">{finalScore.toFixed(4)}</strong>
            &nbsp;—&nbsp;
            <span className={`${theme.prioText} font-semibold`}>{theme.prioLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.confClass}`}>
            {theme.confLabel}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="border-t border-slate-100 px-5 pb-5 fade-in">
          {/* Score breakdown bars */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2.5">
            Evidence score breakdown
          </p>
          <div className="space-y-2.5">
            {[
              {
                name: 'Physical evidence',
                val: suspect.score_breakdown.physical_evidence,
                max: 0.50,
                display: suspect.evidence_sim
              },
              {
                name: 'Witness / victim link',
                val: suspect.score_breakdown.witness_statement,
                max: 0.30,
                display: suspect.victim_sim
              },
              {
                name: 'Past history',
                val: suspect.past_history_score,
                max: 1.0,
                display: suspect.past_history_score
              }
            ].map((bar, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-36 flex-shrink-0">{bar.name}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${theme.fillColor} rounded-full transition-all`}
                    style={{ width: `${getPercentage(bar.val, bar.max)}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-slate-600 w-10 text-right">
                  {bar.display.toFixed(4)}
                </span>
              </div>
            ))}

            {/* Alibi strength (green bar) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-36 flex-shrink-0">Alibi strength</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${getPercentage(suspect.alibi_score, 1.0)}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-slate-600 w-10 text-right">
                {suspect.alibi_score.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Key evidence signals */}
          {suspect.signals && suspect.signals.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">
                Key evidence signals
              </p>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {visibleSignals.map((signal, idx) => {
                  let badgeClass = 'bg-slate-100 text-slate-500';
                  if (signal.type === 'against') {
                    badgeClass = 'bg-red-100 text-red-700';
                  } else if (signal.type === 'for') {
                    badgeClass = 'bg-green-100 text-green-700';
                  }
                  return (
                    <span key={idx} className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                      {signal.label}
                    </span>
                  );
                })}
                {excessSignals > 0 && (
                  <span className="text-[11px] italic px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-400">
                    +{excessSignals} more
                  </span>
                )}
              </div>
            </>
          )}

          {/* System reasoning */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">
            System reasoning
          </p>
          <div
            className="bg-slate-50 border-l-4 border-slate-300 border border-slate-200 rounded-r-xl px-4 py-3 text-xs text-slate-600 leading-relaxed"
            style={{ borderLeftWidth: '3px', borderLeftColor: '#cbd5e1' }}
          >
            {suspect.explanation}
          </div>

          {/* Matched profile text */}
          {suspect.highlighted_text && (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">
                Matched profile text
              </p>
              <div
                className="bg-slate-50 border-l-4 border-slate-300 border border-slate-200 rounded-r-xl px-4 py-3 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap"
                style={{ borderLeftWidth: '3px', borderLeftColor: '#cbd5e1' }}
                dangerouslySetInnerHTML={{ __html: suspect.highlighted_text }}
              />
            </>
          )}


          {/* Score breakdown table */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">
            Weighted score breakdown
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-slate-500 font-semibold border-b border-slate-200">Component</th>
                  <th className="px-4 py-2.5 text-right text-slate-500 font-semibold border-b border-slate-200">Raw score</th>
                  <th className="px-4 py-2.5 text-right text-slate-500 font-semibold border-b border-slate-200">Weighted contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-white">
                  <td className="px-4 py-2.5 text-slate-700">Physical evidence</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{suspect.evidence_sim.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">+{suspect.score_breakdown.physical_evidence.toFixed(4)}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">Witness statements</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{suspect.victim_sim.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">+{suspect.score_breakdown.witness_statement.toFixed(4)}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2.5 text-slate-700">Past history</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{suspect.past_history_score.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">+{suspect.score_breakdown.past_history.toFixed(4)}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2.5 text-green-700 font-medium">Alibi strength (penalty)</td>
                  <td className="px-4 py-2.5 text-right text-green-600">{suspect.alibi_score.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-green-700">
                    {suspect.score_breakdown.alibi_penalty < 0 ? '' : '+'}
                    {suspect.score_breakdown.alibi_penalty.toFixed(4)}
                  </td>
                </tr>
                <tr className="bg-slate-100">
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">Final score</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{finalScore.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspectCard;

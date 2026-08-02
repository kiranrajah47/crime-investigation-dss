import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SuspectCard from '../components/SuspectCard';
import axios from 'axios';
import { Download, Plus, AlertTriangle, HelpCircle, FileText, Save } from 'lucide-react';

const Results = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [report, setReport] = useState([]);
  const [repeatSuspects, setRepeatSuspects] = useState([]);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesMessage, setNotesMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(0); // #1 suspect expanded by default

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/cases/${id}`);
        setCaseData(response.data.case);
        setReport(response.data.report || []);
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

  if (loading) {
    return (
      <Layout title="Suspect ranking results">
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 spinner"></div>
          <div className="text-slate-500 text-sm font-semibold">Retrieving case data...</div>
        </div>
      </Layout>
    );
  }

  if (error || !caseData) {
    return (
      <Layout title="Suspect ranking results">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Error Loading Case</h3>
          <p className="text-sm text-slate-500 mb-5">{error || 'Case details could not be found.'}</p>
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
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all shadow-sm no-underline"
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
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 font-medium">Case ID</div>
          <div className="font-mono text-sm font-bold text-slate-700 tracking-tight">
            {caseData.case_id}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 font-medium">Case title</div>
          <div className="text-sm font-bold text-slate-800 truncate" title={caseData.title}>
            {caseData.title || '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Analysed: {caseData.formatted_date}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 font-medium">Suspects evaluated</div>
          <div className="text-2xl font-bold text-slate-800">{caseData.num_suspects}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 font-medium">Top suspect score</div>
          <div className="text-2xl font-bold text-slate-800">{caseData.top_score.toFixed(4)}</div>
        </div>
      </div>

      {/* Weights Used */}
      {weightsUsed && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm text-slate-700 mb-4 flex flex-wrap gap-x-5 gap-y-2 items-center shadow-sm text-left font-sans">
          <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Weights used:</span>
          <span className="flex items-center gap-1.5">Physical evidence: <strong className="bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">{weightsUsed.physical_evidence}</strong></span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5">Witness statements: <strong className="bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">{weightsUsed.witness_statement}</strong></span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5">Past history: <strong className="bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">{weightsUsed.past_history}</strong></span>
          <span className="text-sky-300 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5">Alibi penalty: <strong className="bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">{weightsUsed.alibi_penalty}</strong></span>
        </div>
      )}

      {/* Repeat suspect warning indicator */}
      {repeatSuspects.length > 0 && (
        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3.5 mb-4 text-xs text-indigo-800 shadow-sm text-left font-sans">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" />
          <div className="leading-relaxed space-y-1 flex-1">
            {repeatSuspects.map((item, idx) => (
              <div key={idx}>
                <strong>Repeat suspect detected</strong> — <strong>{item.name}</strong> has appeared as a top suspect in{' '}
                {item.appeared_in_cases.length} previous case{item.appeared_in_cases.length === 1 ? '' : 's'}:{' '}
                {item.appeared_in_cases.map((c, cIdx) => (
                  <span
                    key={cIdx}
                    className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium text-[11px] mx-0.5"
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

      {/* Confidence warning indicators */}
      {hasLowConfidence && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-3.5 mb-4 text-xs text-orange-800 shadow-sm text-left font-sans">
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
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3.5 mb-4 text-xs text-yellow-800 shadow-sm text-left font-sans">
          <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
          <div className="leading-relaxed">
            <strong>Moderate confidence</strong> — Score gap between top two suspects is{' '}
            {scoreGap.toFixed(4)}. Consider investigating both before focusing solely on #1.
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center mb-4">Click any suspect card to expand full details</p>

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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-6 mb-4 text-left font-sans">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            Investigator notes
          </h3>
          {notesMessage && (
            <span
              className={`text-xs font-semibold ${
                notesMessage.includes('Failed') ? 'text-red-600' : 'text-emerald-600'
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
          className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y transition-all"
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

      {/* Disclaimer */}
      <div className="border border-dashed border-slate-200 rounded-xl px-6 py-4 text-xs text-slate-400 text-center mt-2 leading-relaxed">
        This ranking is generated by an AI decision-support system and is intended to assist —
        not replace — investigator judgment. All leads must be independently verified before any action is taken.
      </div>
    </Layout>
  );
};

export default Results;

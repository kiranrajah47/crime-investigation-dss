import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FileText, Users, Calendar, Upload } from 'lucide-react';

const Dashboard = () => {
  const { showFlash } = useAuth();
  const navigate = useNavigate();

  // Stats state
  const [stats, setStats] = useState({
    total_cases: 0,
    total_suspects: 0,
    this_month: 0
  });

  // Form states
  const [caseTitle, setCaseTitle] = useState('');
  const [victimFile, setVictimFile] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [suspectsFile, setSuspectsFile] = useState(null);

  // Weights state
  const [wPhysical, setWPhysical] = useState(0.55);
  const [wWitness, setWWitness] = useState(0.35);
  const [wHistory, setWHistory] = useState(0.25);
  const [wAlibi, setWAlibi] = useState(0.25);

  const [submitting, setSubmitting] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      }
    };
    fetchStats();
  }, []);

  const applyPreset = (p, w, h, a) => {
    setWPhysical(p);
    setWWitness(w);
    setWHistory(h);
    setWAlibi(a);
  };

  const resetWeights = () => {
    applyPreset(0.55, 0.35, 0.25, 0.25);
  };

  const presets = [
    {
      name: 'Default',
      weights: [0.55, 0.35, 0.25, 0.25],
      tip: 'Balanced weights for general investigation. Use when case type is unknown.'
    },
    {
      name: 'Physical assault',
      weights: [0.75, 0.35, 0.25, 0.35],
      tip: 'High weight on forensic & physical evidence. Suitable for violent crimes.'
    },
    {
      name: 'Financial fraud',
      weights: [0.20, 0.40, 0.55, 0.20],
      tip: 'Emphasises past history and financial conflict. Use when physical evidence is minimal.'
    },
    {
      name: 'Kidnapping',
      weights: [0.55, 0.50, 0.30, 0.40],
      tip: 'Balances physical evidence with witness identification. High alibi weight — a confirmed alibi during the abduction window strongly clears a suspect.'
    },
    {
      name: 'Drug trafficking',
      weights: [0.65, 0.35, 0.40, 0.25],
      tip: 'Weighted toward physical seizures, financial trails, and digital evidence. Past history of narcotics offences carries strong weight.'
    },
    {
      name: 'Harassment',
      weights: [0.25, 0.55, 0.40, 0.20],
      tip: 'Prioritises witness accounts and past conflict patterns over physical evidence.'
    },
    {
      name: 'Cybercrime',
      weights: [0.50, 0.20, 0.45, 0.10],
      tip: 'Physical evidence here means digital forensics — logs, IPs, devices. Alibi is nearly irrelevant since cybercrime needs no physical presence.'
    }
  ];

  const toTitleCase = (str) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!victimFile || !evidenceFile || !suspectsFile) {
      showFlash('Please upload all 3 documents.', 'error');
      return;
    }

    setSubmitting(true);
    const titledCaseTitle = caseTitle.trim() ? toTitleCase(caseTitle.trim()) : '';
    const formData = new FormData();
    formData.append('case_title', titledCaseTitle);
    formData.append('victim_file', victimFile);
    formData.append('evidence_file', evidenceFile);
    formData.append('suspects_file', suspectsFile);
    formData.append('w_physical', wPhysical);
    formData.append('w_witness', wWitness);
    formData.append('w_history', wHistory);
    formData.append('w_alibi', wAlibi);

    try {
      const response = await axios.post('/api/cases/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showFlash('Analysis completed successfully!', 'success');
        navigate(`/results/${response.data.case_db_id}`);
      } else {
        showFlash(response.data.message || 'Analysis failed.', 'error');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error executing case analysis. Please try again.';
      showFlash(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="New case analysis">
      {/* Loading overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[9999] bg-navy-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-blue-500 spinner"></div>
          <div className="text-white font-semibold text-base">Analysing documents…</div>
          <div className="text-slate-400 text-sm -mt-2">Running NLP pipeline. This may take a few seconds.</div>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Total cases run"
          value={stats.total_cases}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Suspects evaluated"
          value={stats.total_suspects}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Cases this month"
          value={stats.this_month}
          icon={<Calendar className="w-5 h-5" />}
          color="violet"
          onClick={() => navigate('/history')}
        />
      </div>

      {/* Main upload card */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left"><div className="lg:col-span-3">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Upload case documents</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload 3 documents — the system will analyse and rank suspects automatically.</p>
            </div>
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center text-white">
              <Upload className="w-4 h-4" />
            </div>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Case title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Case title <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g. MG Road Warehouse Incident — April 2026"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>

              {/* Document 1 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Document 1 — Victim details &amp; incident
                </label>
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                  Describe the victim, how they were found, time, location, and immediate observations.
                </p>
                <div className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200 group">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <input
                    type="file"
                    accept=".txt,.docx,.pdf"
                    required
                    onChange={(e) => setVictimFile(e.target.files[0])}
                    className="w-full text-sm text-slate-500 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  />
                </div>
              </div>

              {/* Document 2 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Document 2 — Evidence recovered
                </label>
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                  List all physical evidence, CCTV details, witness statements, and forensic notes.
                </p>
                <div className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <input
                    type="file"
                    accept=".txt,.docx,.pdf"
                    required
                    onChange={(e) => setEvidenceFile(e.target.files[0])}
                    className="w-full text-sm text-slate-500 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  />
                </div>
              </div>

              {/* Document 3 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Document 3 — Suspect profiles
                </label>
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                  Each suspect section must start with <strong className="text-slate-700">SUSPECT: Name</strong> on its own line.
                </p>
                <div className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <input
                    type="file"
                    accept=".txt,.docx,.pdf"
                    required
                    onChange={(e) => setSuspectsFile(e.target.files[0])}
                    className="w-full text-sm text-slate-500 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  />
                </div>
              </div>

              {/* Format box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed font-mono">
                <strong className="text-slate-700 font-sans">Required format for Document 3:</strong>
                <pre className="mt-2 bg-slate-100 rounded-lg px-3 py-2 text-slate-600 text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
{`SUSPECT: Rajan Shetty
Rajan was a colleague of the victim...
He had an ongoing financial dispute...

SUSPECT: Meera Nair
Meera had a prior conflict with the victim...
No physical evidence links her directly...`}
                </pre>
              </div>

              {/* Evidence weight sliders */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800">Evidence weights</span>
                  <button
                    type="button"
                    onClick={resetWeights}
                    className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1 hover:bg-slate-100 transition-all cursor-pointer font-medium"
                  >
                    Reset to default
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
                  Adjust how much each evidence type contributes to the final score. Choose a preset below or customise manually.
                </p>

                {/* Slider rows */}
                <div className="space-y-4 font-sans">
                  {[
                    {
                      id: 'w_physical',
                      val: wPhysical,
                      setVal: setWPhysical,
                      label: 'Physical evidence',
                      desc: 'Fingerprints, CCTV footage, weapons, forensic findings'
                    },
                    {
                      id: 'w_witness',
                      val: wWitness,
                      setVal: setWWitness,
                      label: 'Witness statements',
                      desc: 'Eyewitness accounts and victim connections'
                    },
                    {
                      id: 'w_history',
                      val: wHistory,
                      setVal: setWHistory,
                      label: 'Past history',
                      desc: 'Prior criminal record and conflict history'
                    },
                    {
                      id: 'w_alibi',
                      val: wAlibi,
                      setVal: setWAlibi,
                      label: 'Alibi penalty',
                      desc: "How much a verified alibi reduces the suspect's score"
                    }
                  ].map((slider) => (
                    <div key={slider.id}>
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="text-sm font-medium text-slate-700">{slider.label}</label>
                        <span className="text-sm font-bold text-blue-600 min-w-[36px] text-right">
                          {slider.val.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-1.5">{slider.desc}</p>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={slider.val}
                        onChange={(e) => slider.setVal(parseFloat(e.target.value))}
                        className="w-full h-1.5 accent-blue-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 items-center pt-4 mt-4 border-t border-slate-200 font-sans">
                  <span className="text-xs text-slate-500 font-medium">Presets:</span>
                  {presets.map((preset, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        onClick={() => applyPreset(...preset.weights)}
                        className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-150 cursor-pointer"
                      >
                        {preset.name}
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-52 bg-slate-800 text-white text-[11px] leading-snug rounded-lg px-3 py-2 text-center shadow-xl z-10 pointer-events-none">
                        {preset.tip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 gradient-brand text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Analyse Documents
              </button>
            </form>

            <p className="text-[11px] text-slate-400 text-center mt-4 leading-relaxed font-sans">
              This system is a decision-support tool only. All investigative decisions must be made
              by a qualified human investigator.
            </p>
          </div>
        </div>
        </div>

        {/* Right column: Info panel (2/5 width) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* How it works */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">How it works</h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              {[
                { step: '1', title: 'Upload 3 documents', desc: 'Victim & incident details, evidence recovered, and suspect profiles in plain text.' },
                { step: '2', title: 'Configure weights', desc: 'Adjust how much physical evidence, witness statements, past history, and alibis affect scores.' },
                { step: '3', title: 'AI analyses & ranks', desc: 'The NLP pipeline extracts features and computes a guilt-likelihood score for each suspect.' },
                { step: '4', title: 'Review results', desc: 'Suspects are ranked with justification. Download a PDF report for your records.' }
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full gradient-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.step}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 font-sans">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed font-sans">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm px-5 py-4 text-left">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 font-sans">Tips for best results</h3>
            <ul className="space-y-2 font-sans">
              {[
                'Use plain .txt files for fastest processing.',
                'Each suspect must start with "SUSPECT: Name" on its own line.',
                'More detail in suspect profiles yields more accurate scores.',
                'Use the Financial Fraud preset for white-collar cases.'
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-blue-700">
                  <span className="text-blue-400 mt-0.5">→</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Priority scale legend */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 text-left">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 font-sans">Score interpretation</h3>
            <div className="space-y-2.5 font-sans">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></span>
                <div>
                  <span className="text-xs font-semibold text-slate-700">Primary suspect</span>
                  <span className="text-xs text-slate-400 ml-1">(≥ 0.55)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></span>
                <div>
                  <span className="text-xs font-semibold text-slate-700">Secondary suspect</span>
                  <span className="text-xs text-slate-400 ml-1">(0.30 – 0.54)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <div>
                  <span className="text-xs font-semibold text-slate-700">Low concern</span>
                  <span className="text-xs text-slate-400 ml-1">(&lt; 0.30)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

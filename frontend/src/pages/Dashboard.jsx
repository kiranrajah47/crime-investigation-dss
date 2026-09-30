import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  FileText,
  Users,
  Calendar,
  Upload,
  ShieldAlert,
  Fingerprint,
  UserCheck,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Sliders,
  Cpu,
  Binary,
  Award,
  Info,
  FolderOpen
} from 'lucide-react';

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

  // Drag over states for the 3 dropzones
  const [dragOverVictim, setDragOverVictim] = useState(false);
  const [dragOverEvidence, setDragOverEvidence] = useState(false);
  const [dragOverSuspects, setDragOverSuspects] = useState(false);

  // Weights state
  const [wPhysical, setWPhysical] = useState(0.55);
  const [wWitness, setWWitness] = useState(0.35);
  const [wHistory, setWHistory] = useState(0.25);
  const [wAlibi, setWAlibi] = useState(0.25);
  const [activePreset, setActivePreset] = useState('Default');

  const [submitting, setSubmitting] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(false);

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

  const applyPreset = (presetName, p, w, h, a) => {
    setActivePreset(presetName);
    setWPhysical(p);
    setWWitness(w);
    setWHistory(h);
    setWAlibi(a);
  };

  const resetWeights = () => {
    applyPreset('Default', 0.55, 0.35, 0.25, 0.25);
  };

  const presets = [
    {
      name: 'Default',
      weights: [0.55, 0.35, 0.25, 0.25],
      tip: 'Balanced weights for general investigations. Recommended when case type is broad.'
    },
    {
      name: 'Physical assault',
      weights: [0.75, 0.35, 0.25, 0.35],
      tip: 'High weight on evidence-text similarity. Suitable for violent confrontations.'
    },
    {
      name: 'Murder',
      weights: [0.80, 0.10, 0.45, 0.25],
      tip: 'Calibrated against graded relevance labels. Prioritises evidence document overlap with strong alibi penalty.'
    },
    {
      name: 'Financial fraud',
      weights: [0.20, 0.40, 0.55, 0.20],
      tip: 'Emphasises past record and financial conflict. Ideal when physical evidence text is minimal.'
    },
    {
      name: 'Kidnapping',
      weights: [0.55, 0.50, 0.30, 0.40],
      tip: 'Balances evidence similarity with victim/witness testimony. Verified alibi heavily clears suspects.'
    },
    {
      name: 'Drug trafficking',
      weights: [0.65, 0.35, 0.40, 0.25],
      tip: 'Weighted toward evidence-text logs (contraband, transit) and narcotics arrest history.'
    },
    {
      name: 'Harassment',
      weights: [0.25, 0.55, 0.40, 0.20],
      tip: 'Prioritises victim/witness similarity, interaction logs, and repeat conflict patterns.'
    },
    {
      name: 'Cybercrime',
      weights: [0.50, 0.20, 0.45, 0.10],
      tip: 'Digital evidence text (IP logs, device artifacts). Physical presence alibis carry minimal relevance.'
    }
  ];

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb >= 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
  };

  const getFileExtension = (filename) => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'DOC';
  };

  const toTitleCase = (str) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!victimFile || !evidenceFile || !suspectsFile) {
      showFlash('Please upload all 3 investigative documents.', 'error');
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

  // Helper component for Document Upload Card
  const UploadCard = ({
    docNumber,
    title,
    subtitle,
    icon: Icon,
    color,
    file,
    setFile,
    isDragOver,
    setIsDragOver
  }) => {
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setFile(e.dataTransfer.files[0]);
      }
    };

    const colors = {
      blue: {
        iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        activeBorder: 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
      },
      emerald: {
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
        activeBorder: 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
      },
      indigo: {
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
        badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
        activeBorder: 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
      }
    };

    const theme = colors[color] || colors.blue;

    return (
      <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${theme.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  DOC 0{docNumber}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Zone or Uploaded State */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-3 text-center transition-all ${
              isDragOver
                ? `${theme.activeBorder}`
                : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
            }`}
          >
            <input
              type="file"
              accept=".txt,.docx,.pdf"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <span>
                <strong className="text-blue-600 dark:text-blue-400 underline font-medium">Browse file</strong> or drag &amp; drop
              </span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              Accepts .txt, .pdf, .docx
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                  <span className="uppercase font-bold text-slate-600 dark:text-slate-300">
                    {getFileExtension(file.name)}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer border-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout title="New Case Investigation">
      {/* Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[9999] bg-navy-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 spinner"></div>
            <div className="absolute inset-0 flex items-center justify-center text-blue-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-lg tracking-tight">Processing Case Intelligence...</div>
            <div className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Parsing documents, extracting TF-IDF semantic vectors, scoring alibi penalties &amp; evaluating suspect rankings.
            </div>
          </div>
        </div>
      )}

      {/* Analysis Pipeline Tracker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-mono">
              Investigation Workflow Pipeline
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            TF-IDF Primary + SBERT Secondary Comparison
          </span>
        </div>

        {/* 5-Step Visual Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-left">
          {[
            { step: '01', name: 'Documents', desc: 'Victim, Evidence & Suspects', icon: FolderOpen, active: true },
            { step: '02', name: 'Text Processing', desc: 'Tokenization & Cleaning', icon: Cpu, active: false },
            { step: '03', name: 'Evidence Analysis', desc: 'TF-IDF Vector Similarity', icon: Binary, active: false },
            { step: '04', name: 'Suspect Ranking', desc: 'Weighted Heuristics & Alibi', icon: Award, active: false },
            { step: '05', name: 'Investigation Report', desc: 'Ranked Leads & Model Agreement', icon: FileText, active: false }
          ].map((item, i, arr) => {
            const StepIcon = item.icon;
            return (
              <div
                key={i}
                className={`relative p-3 rounded-lg border transition-all ${
                  item.active
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800/60 opacity-85'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-1">
                  <span className={item.active ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>STEP {item.step}</span>
                  <StepIcon className={`w-3.5 h-3.5 ${item.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>{item.name}</span>
                  {i < arr.length - 1 && (
                    <span className="hidden lg:inline text-slate-300 dark:text-slate-600 font-mono text-xs">→</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {item.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Executive Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

      {/* Main Investigation Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Case Setup & Document Dossiers (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    Case Setup &amp; Investigation Dossiers
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload the three primary case components for automated cross-referencing.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                  Required
                </span>
              </div>

              <div className="p-6 space-y-4">
                {/* Case Title Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                    Case Title / Incident Tag <span className="font-sans font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    placeholder="e.g. MG Road Commercial Warehouse Heist — April 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {/* 3 Upload Cards */}
                <div className="space-y-3 pt-1">
                  <UploadCard
                    docNumber={1}
                    title="Victim & Incident Details"
                    subtitle="Victim profile, incident timeline, scene observations, and background circumstances"
                    icon={ShieldAlert}
                    color="blue"
                    file={victimFile}
                    setFile={setVictimFile}
                    isDragOver={dragOverVictim}
                    setIsDragOver={setDragOverVictim}
                  />

                  <UploadCard
                    docNumber={2}
                    title="Evidence-Text Description"
                    subtitle="Textual descriptions of recovered evidence, forensic logs, CCTV summaries, and weapon notes"
                    icon={Fingerprint}
                    color="emerald"
                    file={evidenceFile}
                    setFile={setEvidenceFile}
                    isDragOver={dragOverEvidence}
                    setIsDragOver={setDragOverEvidence}
                  />

                  <UploadCard
                    docNumber={3}
                    title="Suspect Profiles & Alibis"
                    subtitle="Profiles formatted with 'SUSPECT: Name', background notes, prior record keywords, and alibi claims"
                    icon={Users}
                    color="indigo"
                    file={suspectsFile}
                    setFile={setSuspectsFile}
                    isDragOver={dragOverSuspects}
                    setIsDragOver={setDragOverSuspects}
                  />
                </div>

                {/* Format Guidance Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFormatGuide(!showFormatGuide)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer border-0 bg-transparent p-0"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>{showFormatGuide ? 'Hide Document 3 Format Guidelines' : 'View Document 3 Formatting Guide'}</span>
                  </button>

                  {showFormatGuide && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs fade-in">
                      <div className="font-bold text-slate-700 dark:text-slate-200 mb-1.5 font-mono text-[11px]">
                        Required format for Document 3 (Plain Text):
                      </div>
                      <pre className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre">
{`SUSPECT: Rajan Shetty
Rajan was a former associate of the victim.
Had an ongoing financial grievance.
Alibi: Claimed he was at an airport terminal at 10 PM.

SUSPECT: Meera Nair
Meera had past business disputes with the victim.
No direct weapon or fingerprint correlation at scene.`}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Evidence Weight Tuning (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    Evidence Weight Matrix
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetWeights}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg px-2.5 py-1 transition-all cursor-pointer border-0 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Calibrate the DSS algorithm to assign proportional weight to different evidence streams.
                </p>

                {/* Preset Profiles */}
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    Investigation Presets
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((preset) => (
                      <div key={preset.name} className="relative group">
                        <button
                          type="button"
                          onClick={() => applyPreset(preset.name, ...preset.weights)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                            activePreset === preset.name
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {preset.name}
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-navy-950 text-white text-[11px] leading-snug rounded-lg px-3 py-2 text-center shadow-xl z-20 pointer-events-none border border-navy-800">
                          {preset.tip}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-950"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-4 pt-2">
                  {[
                    {
                      id: 'w_physical',
                      val: wPhysical,
                      setVal: setWPhysical,
                      label: 'Evidence-Text Similarity Weight',
                      tag: 'Evidence Document Overlap',
                      desc: 'Cosine similarity weight between suspect profile and evidence document text.'
                    },
                    {
                      id: 'w_witness',
                      val: wWitness,
                      setVal: setWWitness,
                      label: 'Victim / Witness Similarity Weight',
                      tag: 'Victim/Witness Document Overlap',
                      desc: 'Cosine similarity weight between suspect profile and victim/incident narrative.'
                    },
                    {
                      id: 'w_history',
                      val: wHistory,
                      setVal: setWHistory,
                      label: 'Past Criminal History Weight',
                      tag: 'Prior Records / MO Keywords',
                      desc: 'Weight given to detected keywords of prior criminal record, modus operandi, and repeat conflict.'
                    },
                    {
                      id: 'w_alibi',
                      val: wAlibi,
                      setVal: setWAlibi,
                      label: 'Alibi Verification Penalty',
                      tag: 'Score Deduction for Alibis',
                      desc: 'Magnitude of penalty subtracted from final score when verified alibis are corroborated.'
                    }
                  ].map((slider) => (
                    <div
                      key={slider.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {slider.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-2">
                            {slider.tag}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          {slider.val.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                        {slider.desc}
                      </p>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={slider.val}
                        onChange={(e) => {
                          setActivePreset('Custom');
                          slider.setVal(parseFloat(e.target.value));
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Prominent Submission Section */}
        <div className="bg-gradient-to-r from-blue-900 via-navy-900 to-navy-950 rounded-2xl p-6 shadow-xl border border-blue-800/40 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-mono uppercase tracking-wider text-blue-300 font-semibold">
                Decision-Support Ready
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Execute Intelligence Analysis
            </h3>
            <p className="text-xs text-slate-300 max-w-xl mt-0.5">
              Processes the 3 investigative dossiers through the NLP scoring model to compute cosine relevance rankings.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Analyze Case Dossier</span>
            <ArrowRight className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      </form>

      {/* Auxiliary Intelligence Guidelines Below */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 text-left">
        {/* How it works */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              How the DSS Works
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Text Preprocessing', desc: 'Case narratives are tokenized, normalized, and cleared of legal and general stopwords.' },
                { step: '2', title: 'TF-IDF Matrix Creation', desc: 'Terms are weighted to spotlight unique evidence-text and victim/witness correlations.' },
                { step: '3', title: 'Cosine Similarity', desc: 'Mathematical cosine similarity between suspect profiles and case document texts is computed.' },
                { step: '4', title: 'Weighted Suspect Ranking', desc: 'Weights and alibi penalties compute the calibrated similarity score.' }
              ].map((item) => (
                <div key={item.step} className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investigative Best Practices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Investigative Best Practices
            </h3>
            <ul className="space-y-2.5 p-0 m-0 list-none">
              {[
                'Ensure Document 3 lists each suspect with "SUSPECT: Name" on a dedicated line.',
                'Specify concrete physical items (e.g. 9mm shell casing, blue sedan, Rolex).',
                'Explicitly note alibi confirmations or alibi refutations in suspect briefs.',
                'Review confidence gap warnings when top two suspects have score variance < 0.08.'
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Priority Scale Classification */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Score Interpretation
            </h3>
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
                <div className="flex items-center justify-between text-xs font-bold text-red-700 dark:text-red-300">
                  <span>Primary Suspect</span>
                  <span className="font-mono">≥ 0.55</span>
                </div>
                <div className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-0.5">
                  High correlation across physical and circumstantial evidence.
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span>Secondary Suspect</span>
                  <span className="font-mono">0.30 – 0.54</span>
                </div>
                <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                  Moderate link; requires deeper corroboration or alibi verification.
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>Low Concern</span>
                  <span className="font-mono">&lt; 0.30</span>
                </div>
                <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                  Weak correlation or corroborated alibi substantially clearing the subject.
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

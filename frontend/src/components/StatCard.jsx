import React from 'react';

const StatCard = ({ title, value, icon, color = 'blue', onClick = null }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-slate-200 dark:border-slate-800',
      accent: 'border-l-blue-600 dark:border-l-blue-500',
      glow: 'hover:border-blue-300 dark:hover:border-blue-700/60'
    },
    green: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-slate-200 dark:border-slate-800',
      accent: 'border-l-emerald-600 dark:border-l-emerald-500',
      glow: 'hover:border-emerald-300 dark:hover:border-emerald-700/60'
    },
    violet: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-slate-200 dark:border-slate-800',
      accent: 'border-l-indigo-600 dark:border-l-indigo-500',
      glow: 'hover:border-indigo-300 dark:hover:border-indigo-700/60'
    }
  };

  const c = colorClasses[color] || colorClasses.blue;

  const cardContent = (
    <div
      className={`relative overflow-hidden bg-white dark:bg-slate-900 border ${c.border} border-l-4 ${c.accent} rounded-xl px-5 py-4 flex items-center justify-between shadow-sm transition-all duration-200 ${
        onClick ? `cursor-pointer ${c.glow} hover:-translate-y-0.5 hover:shadow-md` : ''
      }`}
    >
      <div>
        <div className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">
          {title}
        </div>
        <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums">
          {value}
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0 ${c.text} border border-slate-100 dark:border-slate-800`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
    </div>
  );

  return onClick ? (
    <button onClick={onClick} className="p-0 border-0 bg-transparent text-left w-full cursor-pointer focus:outline-none block">
      {cardContent}
    </button>
  ) : (
    <div>{cardContent}</div>
  );
};

export default StatCard;

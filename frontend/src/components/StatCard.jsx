import React from 'react';

const StatCard = ({ title, value, icon, color = 'blue', onClick = null }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      accent: 'border-l-blue-500',
      hover: 'hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5'
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      accent: 'border-l-emerald-500',
      hover: 'hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5'
    },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      border: 'border-violet-200',
      accent: 'border-l-violet-500',
      hover: 'hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5'
    }
  };

  const c = colorClasses[color] || colorClasses.blue;

  const cardContent = (
    <div className={`bg-white border border-l-4 ${c.border} ${c.accent} rounded-xl px-6 py-5 flex items-center gap-4 shadow-sm transition-all duration-200 ${onClick ? `cursor-pointer ${c.hover}` : ''}`}>
      <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center flex-shrink-0 ${c.text}`}>
        {React.cloneElement(icon, { className: 'w-7 h-7' })}
      </div>
      <div>
        <div className="text-4xl font-extrabold text-slate-800 leading-none tabular-nums">{value}</div>
        <div className="text-sm text-slate-500 mt-1.5 font-medium">{title}</div>
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

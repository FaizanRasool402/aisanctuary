import React from 'react';

const StatCard = ({ label, value, sublabel, accent = 'navy', onClick }) => {
  const accentClasses = {
    navy: 'text-navy-500',
    cyan: 'text-cyan',
    magenta: 'text-magenta',
  };

  const interactive = typeof onClick === 'function';

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-xl border border-navy-100 bg-white p-5 shadow-card ${
        interactive
          ? 'cursor-pointer transition hover:border-navy-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-navy-400'
          : ''
      }`}
    >
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${accentClasses[accent]}`}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-gray-400">{sublabel}</div>}
      {interactive && (
        <div className="mt-2 text-xs font-medium text-navy-600">Click to view list</div>
      )}
    </div>
  );
};

export default StatCard;

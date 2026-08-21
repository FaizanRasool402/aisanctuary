import React from 'react';

const StatCard = ({ label, value, sublabel, accent = 'navy' }) => {
  const accentClasses = {
    navy: 'text-navy-500',
    cyan: 'text-cyan',
    magenta: 'text-magenta',
  };

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${accentClasses[accent]}`}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-gray-400">{sublabel}</div>}
    </div>
  );
};

export default StatCard;

import React from 'react';

// Percent-change badge; `change` null means there is no baseline to compare against
const TrendPill = ({ change, current }) => {
  const base = 'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold';
  if (change === null || change === undefined) {
    return current > 0 ? (
      <span className={`${base} bg-emerald-50 text-emerald-600`}>New</span>
    ) : (
      <span className={`${base} bg-slate-100 text-slate-500`}>→ 0%</span>
    );
  }
  if (change > 0) {
    return <span className={`${base} bg-emerald-50 text-emerald-600`}>↑ +{change}%</span>;
  }
  if (change < 0) {
    return <span className={`${base} bg-red-50 text-red-600`}>↓ {change}%</span>;
  }
  return <span className={`${base} bg-slate-100 text-slate-500`}>→ 0%</span>;
};

export default TrendPill;

import React from 'react';

const Table = ({ columns, children }) => (
  <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
    <table className="min-w-full divide-y divide-navy-100">
      <thead className="bg-navy-50">
        <tr>
          {columns.map((col, idx) => (
            <th
              key={col || `col-${idx}`}
              className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600 md:px-4"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-navy-100">{children}</tbody>
    </table>
  </div>
);

export default Table;

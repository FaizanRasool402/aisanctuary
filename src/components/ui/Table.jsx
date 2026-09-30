import React from 'react';

const Table = ({ columns, children, scrollable = true }) => (
  <div
    className={`rounded-xl border border-navy-100 bg-white shadow-card ${
      scrollable ? 'overflow-x-auto' : 'overflow-hidden'
    }`}
  >
    <table
      className={`divide-y divide-navy-100 ${
        scrollable ? 'min-w-full' : 'w-full table-fixed'
      }`}
    >
      <thead className="bg-navy-50">
        <tr>
          {columns.map((col, idx) => (
            <th
              key={col || `col-${idx}`}
              className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600 md:px-4 ${
                scrollable ? 'whitespace-nowrap' : 'break-words'
              }`}
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

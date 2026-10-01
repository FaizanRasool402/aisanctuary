import React, { useState } from 'react';
import TrendPill from './TrendPill';
import {
  BarsIcon,
  BookIcon,
  ChevronDownIcon,
  CodeIcon,
  LanguageIcon,
  MonitorIcon,
  VideoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ResetIcon,
  SearchIcon,
} from './icons';

/* Shared building blocks for the management pages. */

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h2 className="text-2xl font-bold text-navy-900 md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Panel = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white shadow-card ${className}`}>{children}</div>
);

export const tones = {
  blue: 'bg-blue-50 text-blue-500',
  green: 'bg-emerald-50 text-emerald-500',
  purple: 'bg-purple-50 text-purple-500',
  orange: 'bg-orange-50 text-orange-500',
  pink: 'bg-pink-50 text-pink-500',
  red: 'bg-red-50 text-red-500',
  sky: 'bg-sky-50 text-sky-500',
};

export const StatTile = ({ icon: Icon, tone = 'blue', label, value, sublabel, change, badge }) => (
  <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-card sm:flex-row sm:items-start sm:gap-4 sm:p-4">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${tones[tone]}`}>
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-medium text-slate-700 sm:text-sm">{label}</div>
      <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-xl font-bold text-navy-900 sm:text-2xl">{value}</span>
        {badge !== undefined
          ? badge
          : change !== undefined && <TrendPill change={change} current={Number(value) || 0} />}
      </div>
      {sublabel && <div className="truncate text-xs text-slate-500">{sublabel}</div>}
    </div>
  </div>
);

export const PrimaryButton = ({ icon: Icon, children, className = '', ...props }) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
);

export const SearchInput = ({ value, onChange, placeholder, className = '' }) => (
  <label className={`relative block min-w-0 ${className}`}>
    <span className="sr-only">{placeholder}</span>
    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
      <SearchIcon className="h-4 w-4" />
    </span>
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
    />
  </label>
);

export const FilterSelect = ({ label, value, onChange, options, allLabel, className = '' }) => (
  <label className={`block min-w-0 ${className}`}>
    {label && <span className="mb-1 block text-xs text-slate-500">{label}</span>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label || allLabel}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-blue-400 focus:outline-none"
    >
      {allLabel && <option value="all">{allLabel}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

export const ResetButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Reset filters"
    aria-label="Reset filters"
    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center self-end rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
  >
    <ResetIcon className="h-4 w-4" />
  </button>
);

export const Toolbar = ({ children }) => (
  <div className="flex flex-col gap-2 p-4 xl:flex-row xl:items-end">{children}</div>
);

/* ---------- Table ---------- */

// Column roles drive the stacked card layout used below 1280px (see .rtable in index.css):
// a non-text header (select-all checkbox) and '#' are hidden, the first text column is the
// card title, 'Actions' spans the full card width, and every other cell shows its label.
const columnRoles = (cols) => {
  let mainAssigned = false;
  return cols.map((col) => {
    if (typeof col.label !== 'string') return 'hide';
    if (col.label === '#') return 'index';
    if (col.label === 'Actions' || col.label === '') return 'actions';
    if (!mainAssigned) {
      mainAssigned = true;
      return 'main';
    }
    return undefined;
  });
};

export const DataTable = ({ columns, children }) => {
  // A column is a label, or { label, className } to e.g. hide it on small screens
  const cols = columns.map((c) => (c && typeof c === 'object' && 'label' in c ? c : { label: c, className: '' }));
  const roles = columnRoles(cols);

  const labelRow = (row) => {
    if (!React.isValidElement(row) || row.type !== 'tr') return row;
    const cells = React.Children.toArray(row.props.children);
    return React.cloneElement(
      row,
      {},
      cells.map((td, i) =>
        React.isValidElement(td) && cols[i] && !td.props.colSpan
          ? React.cloneElement(td, {
              'data-label': typeof cols[i].label === 'string' && cols[i].label ? cols[i].label : undefined,
              'data-role': roles[i],
            })
          : td
      )
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="rtable min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
            {cols.map((col, i) => (
              <th
                key={typeof col.label === 'string' ? col.label || `c${i}` : `c${i}`}
                data-role={roles[i]}
                className={`whitespace-nowrap px-3 py-3 2xl:px-4 ${col.className}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{React.Children.map(children, labelRow)}</tbody>
      </table>
    </div>
  );
};

export const TableMessage = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="whitespace-normal py-10 text-center text-sm text-slate-400">
      {children}
    </td>
  </tr>
);

export const Checkbox = ({ checked, onChange, label }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    aria-label={label}
    className="h-4 w-4 rounded border-slate-300"
  />
);

/* ---------- Badges, avatars ---------- */

const statusTones = {
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-slate-100 text-slate-500',
};
const dotTones = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  gray: 'bg-slate-400',
};

export const StatusBadge = ({ tone = 'gray', children, dot = true }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium capitalize ${statusTones[tone]}`}
  >
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotTones[tone]}`} />}
    {children}
  </span>
);

const hash = (s = '') => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const iconTiles = [
  'bg-purple-50 text-purple-500',
  'bg-blue-50 text-blue-500',
  'bg-emerald-50 text-emerald-500',
  'bg-orange-50 text-orange-500',
  'bg-pink-50 text-pink-500',
  'bg-amber-50 text-amber-500',
];

export const IconTile = ({ icon: Icon, seed }) => (
  <span
    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTiles[hash(seed) % iconTiles.length]}`}
  >
    <Icon className="h-[18px] w-[18px]" />
  </span>
);

export const Pill = ({ icon: Icon, children, className = 'bg-blue-50 text-blue-700', wrap = false }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
      wrap ? 'whitespace-normal' : 'whitespace-nowrap'
    } ${className}`}
  >
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {children}
  </span>
);

export const IconButton = ({ label, onClick, disabled, tone = 'default', icon: Icon }) => {
  const toneCls = {
    default: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-navy-900',
    danger: 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${toneCls[tone]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

/* ---------- Pagination ---------- */

export const usePagination = (rows, pageSize = 10) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  return {
    page: current,
    setPage,
    totalPages,
    pageRows,
    offset: (current - 1) * pageSize,
    first: rows.length === 0 ? 0 : (current - 1) * pageSize + 1,
    last: Math.min(current * pageSize, rows.length),
    total: rows.length,
  };
};

export const Pagination = ({ pager, noun }) => {
  const { page, setPage, totalPages, first, last, total } = pager;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const navBtn =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40';
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">
        Showing {first} to {last} of {total} {noun}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1} aria-label="Previous page" className={navBtn}>
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPage(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium ${
              n === page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-navy-900 hover:bg-slate-50'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className={navBtn}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/* ---------- Export ---------- */

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const downloadCsv = (filename, header, rows) => {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`﻿${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// options: [{ label, onSelect, disabled }]
export const ExportMenu = ({ options }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-900 transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <DownloadIcon className="h-4 w-4" />
        Export
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 text-sm shadow-lg"
          >
            {options.map((o) => (
              <button
                key={o.label}
                type="button"
                role="menuitem"
                disabled={o.disabled}
                onClick={() => {
                  setOpen(false);
                  o.onSelect();
                }}
                className="block w-full px-4 py-2 text-left text-navy-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Selection ---------- */

export const useSelection = () => {
  const [selected, setSelected] = useState(() => new Set());
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const togglePage = (ids) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const all = ids.length > 0 && ids.every((id) => next.has(id));
      ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
      return next;
    });
  const allSelected = (ids) => ids.length > 0 && ids.every((id) => selected.has(id));
  return { selected, toggle, togglePage, allSelected, clear: () => setSelected(new Set()) };
};

export const SelectionBar = ({ count, onExport, onClear }) =>
  count > 0 ? (
    <div className="mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
      <span className="font-medium">{count} selected</span>
      <button type="button" className="underline" onClick={onExport}>
        Export selected
      </button>
      <button type="button" className="ml-auto text-slate-500 underline" onClick={onClear}>
        Clear
      </button>
    </div>
  ) : null;

/* ---------- Empty state ---------- */

export const EmptyState = ({ title, text, variant = 'search' }) => (
  <div className="flex flex-col items-center px-4 py-10 text-center">
    <svg viewBox="0 0 160 120" className="h-28 w-36" aria-hidden="true">
      <ellipse cx="80" cy="100" rx="56" ry="10" fill="#EEF2FF" />
      <rect x="45" y="18" width="62" height="78" rx="8" fill="#E0E7FF" />
      <path d="M95 18v14h12" fill="#C7D2FE" />
      <rect x="56" y="38" width="30" height="5" rx="2.5" fill="#A5B4FC" />
      <rect x="56" y="50" width="38" height="5" rx="2.5" fill="#C7D2FE" />
      <rect x="56" y="62" width="24" height="5" rx="2.5" fill="#C7D2FE" />
      {variant === 'money' ? (
        <>
          <circle cx="104" cy="78" r="18" fill="#2563EB" />
          <text x="104" y="85" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">
            ₨
          </text>
        </>
      ) : (
        <>
          <circle cx="104" cy="74" r="14" fill="none" stroke="#2563EB" strokeWidth="6" />
          <path d="m114 84 12 12" stroke="#2563EB" strokeWidth="7" strokeLinecap="round" />
        </>
      )}
      <path d="M30 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#93C5FD" />
      <circle cx="128" cy="28" r="3" fill="#93C5FD" />
    </svg>
    <p className="mt-3 text-base font-semibold text-navy-900">{title}</p>
    {text && <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>}
  </div>
);

/* ---------- Modal ---------- */

export const Modal = ({ title, onClose, children, size = 'max-w-lg' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div
      className={`max-h-[90vh] w-full ${size} overflow-y-auto rounded-2xl bg-white p-6 shadow-xl`}
      onClick={(e) => e.stopPropagation()}
    >
      {title && <h2 className="mb-4 text-lg font-semibold text-navy-900">{title}</h2>}
      {children}
    </div>
  </div>
);

export const Detail = ({ label, value }) => (
  <div>
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-0.5 break-words font-medium text-navy-900">{value || '—'}</dd>
  </div>
);

/* ---------- Helpers ---------- */

export const percentChange = (current, previous) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
};

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
// Count of items (optionally matching `pred`) now vs. those that existed 30 days ago
export const trendOf = (items, pred = () => true, dateKey = 'createdAt') => {
  const cutoff = Date.now() - THIRTY_DAYS;
  const current = items.filter(pred).length;
  const previous = items.filter((i) => pred(i) && new Date(i[dateKey]).getTime() < cutoff).length;
  return { value: current, change: percentChange(current, previous) };
};

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const uniqueOptions = (values) =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v }));

/* ---------- Course icon ---------- */

export const courseIconFor = (title = '') => {
  const t = String(title).toLowerCase();
  if (/video|design|ui|ux/.test(t)) return VideoIcon;
  if (/english|language|spoken/.test(t)) return LanguageIcon;
  if (/seo|marketing/.test(t)) return BarsIcon;
  if (/mern|web|stack|develop|code|program/.test(t)) return CodeIcon;
  if (/tech|computer|office/.test(t)) return MonitorIcon;
  return BookIcon;
};

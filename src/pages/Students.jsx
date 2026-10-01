import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import TrendPill from '../components/ui/TrendPill';
import { DataTable } from '../components/ui/kit';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ID_IMAGE_ACCEPT, validateIdImages } from '../utils/idCardUpload';
import PasswordInput from '../components/ui/PasswordInput';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: '',
  identityDocType: 'CNIC',
  guardianName: '',
  guardianContact: '',
  enrollmentStatus: 'pending',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'inactive', label: 'Inactive' },
];

const SORTS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const PAGE_SIZE = 10;

const statusStyle = {
  pending: 'bg-amber-50 text-amber-600',
  active: 'bg-emerald-50 text-emerald-600',
  completed: 'bg-blue-50 text-blue-600',
  inactive: 'bg-slate-100 text-slate-500',
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const percentChange = (current, previous) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/* ---------- Icons ---------- */

const Icon = ({ children, className = 'h-4 w-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const UsersIcon = (
  <Icon className="h-6 w-6">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);
const UserCheckIcon = (
  <Icon className="h-6 w-6">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m16 11 2 2 4-4" />
  </Icon>
);
const AwardIcon = (
  <Icon className="h-6 w-6">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
  </Icon>
);
const UserXIcon = (
  <Icon className="h-6 w-6">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m17 8 5 5M22 8l-5 5" />
  </Icon>
);
const SearchIcon = (
  <Icon className="h-4 w-4">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);
const EyeIcon = (
  <Icon>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
const EditIcon = (
  <Icon>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Icon>
);
const TrashIcon = (
  <Icon>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
  </Icon>
);
const DownloadIcon = (
  <Icon>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </Icon>
);
const ChevronDown = (
  <Icon className="h-3.5 w-3.5">
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
const ResetIcon = (
  <Icon>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Icon>
);

const StatTile = ({ icon, tone, label, value, sublabel, change }) => (
  <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-card sm:flex-row sm:items-start sm:gap-4 sm:p-4">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${tone}`}>{icon}</span>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-700 sm:text-sm">{label}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-xl font-bold text-navy-900 sm:text-2xl">{value}</span>
        <TrendPill change={change} current={value} />
      </div>
      <div className="truncate text-xs text-slate-500">{sublabel}</div>
    </div>
  </div>
);

const IconButton = ({ label, onClick, disabled, danger, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
      danger
        ? 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-navy-900'
    }`}
  >
    {children}
  </button>
);

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [deletingId, setDeletingId] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const canEdit = user?.role === 'admin';

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/students');
      setStudents(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Stable display IDs (STU001…) by registration order
  const studentCodes = useMemo(() => {
    const ordered = [...students].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const map = new Map();
    ordered.forEach((s, i) => map.set(s._id, `STU${String(i + 1).padStart(3, '0')}`));
    return map;
  }, [students]);

  const stats = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const old = students.filter((s) => new Date(s.createdAt).getTime() < cutoff);
    const count = (list, status) => list.filter((s) => s.enrollmentStatus === status).length;
    const make = (status) => {
      const current = status ? count(students, status) : students.length;
      const previous = status ? count(old, status) : old.length;
      return { value: current, change: percentChange(current, previous) };
    };
    return {
      total: make(null),
      active: make('active'),
      pending: make('pending'),
      completed: make('completed'),
      inactive: make('inactive'),
    };
  }, [students]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = students.filter((s) => {
      if (statusFilter !== 'all' && s.enrollmentStatus !== statusFilter) return false;
      if (!term) return true;
      return [s.user?.name, s.user?.email, s.user?.phone, studentCodes.get(s._id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
    const byName = (a, b) => (a.user?.name || '').localeCompare(b.user?.name || '');
    const byDate = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
    const sorters = {
      'name-asc': byName,
      'name-desc': (a, b) => byName(b, a),
      newest: (a, b) => byDate(b, a),
      oldest: byDate,
    };
    return list.sort(sorters[sortBy]);
  }, [students, search, statusFilter, sortBy, studentCodes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  // Drop selections for students that no longer exist
  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(students.map((s) => s._id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [students]);

  const pageAllSelected = pageRows.length > 0 && pageRows.every((s) => selected.has(s._id));

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((s) => (pageAllSelected ? next.delete(s._id) : next.add(s._id)));
      return next;
    });
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('name-asc');
  };

  const exportCsv = (rows, suffix) => {
    setExportOpen(false);
    const header = ['Student ID', 'Name', 'Email', 'Phone', 'Identity Doc', 'Status', 'Joined Date', 'Address'];
    const lines = rows.map((s) =>
      [
        studentCodes.get(s._id),
        s.user?.name,
        s.user?.email,
        s.user?.phone,
        s.identityDocType || '',
        s.enrollmentStatus,
        formatDate(s.createdAt),
        s.address,
      ]
        .map(csvCell)
        .join(',')
    );
    const blob = new Blob([`﻿${[header.map(csvCell).join(','), ...lines].join('\r\n')}`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFrontFile(null);
    setBackFile(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (student) => {
    setViewing(null);
    setEditingId(student._id);
    setForm({
      name: student.user?.name || '',
      email: student.user?.email || '',
      phone: student.user?.phone || '',
      password: '',
      address: student.address || '',
      identityDocType: student.identityDocType || 'CNIC',
      guardianName: student.guardianName || '',
      guardianContact: student.guardianContact || '',
      enrollmentStatus: student.enrollmentStatus || 'pending',
    });
    setFrontFile(null);
    setBackFile(null);
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFrontFile(null);
    setBackFile(null);
    setError('');
  };

  const handleDelete = async (student) => {
    const name = student.user?.name || 'this student';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    setDeletingId(student._id);
    setError('');
    try {
      await api.delete(`/students/${student._id}`);
      setViewing(null);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeletingId('');
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected student${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) {
      return;
    }
    setBulkDeleting(true);
    setError('');
    const failed = [];
    for (const id of ids) {
      try {
        // Sequential on purpose: each delete cascades through enrollments, fees and attendance
        await api.delete(`/students/${id}`);
      } catch {
        failed.push(id);
      }
    }
    setSelected(new Set(failed));
    if (failed.length) setError(`${failed.length} student(s) could not be deleted.`);
    setBulkDeleting(false);
    fetchStudents();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const replacingIds = Boolean(frontFile || backFile);
    if (!editingId && replacingIds) {
      const createError = validateIdImages(frontFile, backFile, form.identityDocType);
      if (createError) {
        setError(createError);
        return;
      }
      if (
        form.identityDocType === 'B-Form' &&
        (!form.guardianName.trim() || !form.guardianContact.trim())
      ) {
        setError('Guardian name and contact are required when uploading a B-Form');
        return;
      }
    } else if (editingId && replacingIds) {
      const replaceError = validateIdImages(frontFile, backFile, form.identityDocType);
      if (replaceError) {
        setError(replaceError);
        return;
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('address', form.address);
      fd.append('enrollmentStatus', form.enrollmentStatus);
      if (replacingIds || editingId) {
        fd.append('identityDocType', form.identityDocType);
        if (form.identityDocType === 'B-Form') {
          fd.append('guardianName', form.guardianName);
          fd.append('guardianContact', form.guardianContact);
        }
        if (frontFile) fd.append('identityDocFront', frontFile);
        if (form.identityDocType === 'CNIC' && backFile) {
          fd.append('identityDocBack', backFile);
        }
      }
      if (form.password.trim()) fd.append('password', form.password);

      if (editingId) {
        await api.put(`/students/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
      } else {
        if (!form.password.trim()) {
          setError('Temporary password is required');
          setSubmitting(false);
          return;
        }
        await api.post('/students', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
      }

      closeForm();
      fetchStudents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingId ? 'Failed to update student' : 'Failed to register student')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const statusCounts = {
    all: students.length,
    active: stats.active.value,
    pending: stats.pending.value,
    completed: stats.completed.value,
    inactive: stats.inactive.value,
  };

  const firstRow = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const selectedRows = students.filter((s) => selected.has(s._id));

  const pageNumbers = (() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <Layout title="Students">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy-900 md:text-3xl">Students</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage all registered students, track their progress and enrollment status.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-900 transition hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={exportOpen}
              >
                {DownloadIcon}
                Export
                {ChevronDown}
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 text-sm shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => exportCsv(filtered, 'filtered')}
                      className="block w-full px-4 py-2 text-left text-navy-900 hover:bg-slate-50"
                    >
                      Current view ({filtered.length}) · CSV
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => exportCsv(students, 'all')}
                      className="block w-full px-4 py-2 text-left text-navy-900 hover:bg-slate-50"
                    >
                      All students ({students.length}) · CSV
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={selectedRows.length === 0}
                      onClick={() => exportCsv(selectedRows, 'selected')}
                      className="block w-full px-4 py-2 text-left text-navy-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Selected ({selectedRows.length}) · CSV
                    </button>
                  </div>
                </>
              )}
            </div>
            {canEdit && (
              <Button
                onClick={openCreate}
                className="!bg-blue-600 px-4 py-2.5 hover:!bg-blue-700"
              >
                + Register Student
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile
            icon={UsersIcon}
            tone="bg-blue-50 text-blue-500"
            label="Total Students"
            value={stats.total.value}
            change={stats.total.change}
            sublabel="All registered students"
          />
          <StatTile
            icon={UserCheckIcon}
            tone="bg-emerald-50 text-emerald-500"
            label="Active Students"
            value={stats.active.value}
            change={stats.active.change}
            sublabel={`Currently enrolled · ${stats.pending.value} pending`}
          />
          <StatTile
            icon={AwardIcon}
            tone="bg-purple-50 text-purple-500"
            label="Completed Students"
            value={stats.completed.value}
            change={stats.completed.change}
            sublabel="Successfully completed"
          />
          <StatTile
            icon={UserXIcon}
            tone="bg-orange-50 text-orange-500"
            label="Inactive Students"
            value={stats.inactive.value}
            change={stats.inactive.change}
            sublabel="Not active"
          />
        </div>

        {error && !showForm && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        {/* Table card */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="flex flex-col gap-3 p-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition ${
                    statusFilter === f.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-navy-900 hover:bg-slate-50'
                  }`}
                >
                  {f.label} ({statusCounts[f.value]})
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="relative block sm:w-72">
                <span className="sr-only">Search students</span>
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  {SearchIcon}
                </span>
                <input
                  type="search"
                  placeholder="Search by name, email, or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-500">Filter by Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-blue-400 focus:outline-none sm:w-40"
                >
                  <option value="all">All Statuses</option>
                  {STATUS_FILTERS.filter((f) => f.value !== 'all').map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-500">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-blue-400 focus:outline-none sm:w-40"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={resetFilters}
                title="Reset filters"
                aria-label="Reset filters"
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center self-end rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                {ResetIcon}
              </button>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
              <span className="font-medium">{selected.size} selected</span>
              <button type="button" className="underline" onClick={() => exportCsv(selectedRows, 'selected')}>
                Export selected
              </button>
              {canEdit && (
                <button
                  type="button"
                  className="text-red-600 underline disabled:opacity-50"
                  disabled={bulkDeleting}
                  onClick={handleBulkDelete}
                >
                  {bulkDeleting ? 'Deleting…' : 'Delete selected'}
                </button>
              )}
              <button type="button" className="ml-auto text-slate-500 underline" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            </div>
          )}

          <DataTable
            columns={[
              <input
                key="all"
                type="checkbox"
                checked={pageAllSelected}
                onChange={togglePage}
                aria-label="Select all on this page"
                className="h-4 w-4 rounded border-slate-300"
              />,
              '#',
              'Student',
              'Email',
              'Phone',
              { label: 'Identity Doc', className: 'hidden 2xl:table-cell' },
              'Status',
              'Joined Date',
              'Actions',
            ]}
          >
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      Loading students…
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((s, i) => {
                    const rowNo = (currentPage - 1) * PAGE_SIZE + i + 1;
                    const code = studentCodes.get(s._id);
                    return (
                      <tr key={s._id} className={selected.has(s._id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                        <td className="py-3 pl-4">
                          <input
                            type="checkbox"
                            checked={selected.has(s._id)}
                            onChange={() => toggleRow(s._id)}
                            aria-label={`Select ${s.user?.name || 'student'}`}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="py-3 text-slate-500">{rowNo}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-semibold text-navy-900">{s.user?.name || 'Unknown'}</div>
                              <div className="text-xs text-slate-500">ID: {code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600">{s.user?.email}</td>
                        <td className="py-3 text-slate-600">{s.user?.phone || '—'}</td>
                        <td className="hidden py-3 text-slate-600 2xl:table-cell">{s.identityDocType || '—'}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                              statusStyle[s.enrollmentStatus] || statusStyle.inactive
                            }`}
                          >
                            {s.enrollmentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{formatDate(s.createdAt)}</td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-2">
                            <IconButton label="View details" onClick={() => setViewing(s)}>
                              {EyeIcon}
                            </IconButton>
                            {canEdit && (
                              <>
                                <IconButton label="Edit student" onClick={() => openEdit(s)}>
                                  {EditIcon}
                                </IconButton>
                                <IconButton
                                  label="Delete student"
                                  danger
                                  disabled={deletingId === s._id}
                                  onClick={() => handleDelete(s)}
                                >
                                  {TrashIcon}
                                </IconButton>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
          </DataTable>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              Showing {firstRow} to {lastRow} of {filtered.length} students
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  ‹
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={n === currentPage ? 'page' : undefined}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium ${
                      n === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-navy-900 hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View details */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewing(null)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-navy-900">{viewing.user?.name}</h2>
                <p className="text-sm text-slate-500">ID: {studentCodes.get(viewing._id)}</p>
                <span
                  className={`mt-1 inline-block rounded-md px-2.5 py-0.5 text-xs font-medium capitalize ${
                    statusStyle[viewing.enrollmentStatus] || statusStyle.inactive
                  }`}
                >
                  {viewing.enrollmentStatus}
                </span>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Detail label="Email" value={viewing.user?.email} />
              <Detail label="Phone" value={viewing.user?.phone} />
              <Detail label="Joined" value={formatDate(viewing.createdAt)} />
              <Detail label="Identity document" value={viewing.identityDocType} />
              <div className="sm:col-span-2">
                <Detail label="Address" value={viewing.address} />
              </div>
              {viewing.guardianName && <Detail label="Guardian" value={viewing.guardianName} />}
              {viewing.guardianContact && <Detail label="Guardian contact" value={viewing.guardianContact} />}
            </dl>

            {canEdit &&
              [viewing.identityDocFrontUrl || viewing.identityDocImageUrl, viewing.identityDocBackUrl].some(Boolean) && (
                <div className="mt-5">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">ID images</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Front', viewing.identityDocFrontUrl || viewing.identityDocImageUrl],
                      ['Back', viewing.identityDocBackUrl],
                    ]
                      .filter(([, url]) => url)
                      .map(([label, url]) => (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg border border-slate-200"
                        >
                          <img src={url} alt={`ID ${label}`} className="h-28 w-full object-cover" />
                          <div className="px-2 py-1 text-xs text-slate-500">{label}</div>
                        </a>
                      ))}
                  </div>
                </div>
              )}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setViewing(null)}>
                Close
              </Button>
              {canEdit && <Button onClick={() => openEdit(viewing)}>Edit</Button>}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              {editingId ? 'Edit Student' : 'Register New Student'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
              />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
              <PasswordInput
                label={editingId ? 'New password (optional)' : 'Temporary Password'}
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                required={!editingId}
                autoComplete="new-password"
              />
              <Field
                label="Address"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
                required
              />

              {editingId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">Enrollment status</label>
                  <select
                    value={form.enrollmentStatus}
                    onChange={(e) => setForm({ ...form, enrollmentStatus: e.target.value })}
                    className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <p className="text-xs text-gray-500">
                {editingId
                  ? 'Identity documents are optional when editing — upload only if you want to replace them.'
                  : 'Identity documents are optional. Students who register themselves must upload CNIC or B-Form on the enrollment form.'}
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  Identity Document {editingId ? '' : '(optional)'}
                </label>
                <select
                  value={form.identityDocType}
                  onChange={(e) => {
                    setForm({ ...form, identityDocType: e.target.value });
                    if (e.target.value === 'B-Form') setBackFile(null);
                  }}
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                >
                  <option value="CNIC">CNIC</option>
                  <option value="B-Form">B-Form (no CNIC)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  {form.identityDocType === 'B-Form' ? 'B-Form photo' : 'CNIC front photo'}
                  {editingId ? ' (optional — leave empty to keep current)' : ' (optional)'}
                </label>
                <input
                  type="file"
                  accept={ID_IMAGE_ACCEPT}
                  onChange={(e) => setFrontFile(e.target.files[0] || null)}
                  className="w-full text-sm"
                />
              </div>

              {form.identityDocType === 'CNIC' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">
                    CNIC back photo
                    {editingId ? ' (optional — leave empty to keep current)' : ' (optional)'}
                  </label>
                  <input
                    type="file"
                    accept={ID_IMAGE_ACCEPT}
                    onChange={(e) => setBackFile(e.target.files[0] || null)}
                    className="w-full text-sm"
                  />
                </div>
              )}

              {form.identityDocType === 'B-Form' && (editingId || frontFile) && (
                <>
                  <Field
                    label="Guardian Name"
                    value={form.guardianName}
                    onChange={(v) => setForm({ ...form, guardianName: v })}
                    required={Boolean(frontFile)}
                  />
                  <Field
                    label="Guardian Contact"
                    value={form.guardianContact}
                    onChange={(v) => setForm({ ...form, guardianContact: v })}
                    required={Boolean(frontFile)}
                  />
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Register Student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-0.5 break-words font-medium text-navy-900">{value || '—'}</dd>
  </div>
);

const Field = ({ label, value, onChange, type = 'text', required }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-navy-900">{label}</label>
    <input
      type={type}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
    />
  </div>
);

export default Students;

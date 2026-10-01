import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  BookIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  PowerIcon,
  UserCheckIcon,
  UsersIcon,
  UserXIcon,
} from '../components/ui/icons';
import {
  Checkbox,
  DataTable,
  Detail,
  ExportMenu,
  FilterSelect,
  IconButton,
  Modal,
  PageHeader,
  Pagination,
  Panel,
  PrimaryButton,
  ResetButton,
  SearchInput,
  SelectionBar,
  StatTile,
  StatusBadge,
  TableMessage,
  Toolbar,
  downloadCsv,
  formatDate,
  trendOf,
  uniqueOptions,
  usePagination,
  useSelection,
} from '../components/ui/kit';

const emptyForm = { name: '', email: '', phone: '', password: '', expertise: '' };

const Teachers = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === 'admin';

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (teacher) => {
    setEditingId(teacher._id);
    setForm({
      name: teacher.user?.name || '',
      email: teacher.user?.email || '',
      phone: teacher.user?.phone || '',
      password: '',
      expertise: (teacher.expertise || []).join(', '),
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const expertiseArray = form.expertise
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingId) {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          expertise: expertiseArray,
        };
        if (form.password.trim()) payload.password = form.password;
        await api.put(`/teachers/${editingId}`, payload);
      } else {
        await api.post('/teachers', { ...form, expertise: expertiseArray });
      }
      closeForm();
      fetchTeachers();
    } catch (err) {
      setError(
        err.response?.data?.message || (editingId ? 'Failed to update teacher' : 'Failed to create teacher')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (teacher) => {
    try {
      await api.put(`/teachers/${teacher._id}`, { isActive: !teacher.isActive });
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update teacher status');
    }
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expertiseFilter, setExpertiseFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewing, setViewing] = useState(null);
  const sel = useSelection();

  const expertiseOptions = useMemo(
    () => uniqueOptions(teachers.flatMap((t) => (t.expertise || []).map((e) => e.trim()))),
    [teachers]
  );

  const stats = useMemo(
    () => ({
      total: trendOf(teachers),
      active: trendOf(teachers, (t) => t.isActive),
      inactive: trendOf(teachers, (t) => !t.isActive),
      expertise: expertiseOptions.length,
    }),
    [teachers, expertiseOptions]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = teachers.filter((t) => {
      if (statusFilter === 'active' && !t.isActive) return false;
      if (statusFilter === 'inactive' && t.isActive) return false;
      if (expertiseFilter !== 'all' && !(t.expertise || []).some((e) => e.trim() === expertiseFilter)) return false;
      if (!term) return true;
      return [t.user?.name, t.user?.email, t.user?.phone, ...(t.expertise || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
    const byName = (a, b) => (a.user?.name || '').localeCompare(b.user?.name || '');
    const sorters = {
      'name-asc': byName,
      'name-desc': (a, b) => byName(b, a),
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    };
    return [...list].sort(sorters[sortBy]);
  }, [teachers, search, statusFilter, expertiseFilter, sortBy]);

  const pager = usePagination(filtered, 10);
  const pageIds = pager.pageRows.map((t) => t._id);

  const exportRows = (rows, suffix) =>
    downloadCsv(
      `teachers-${suffix}`,
      ['Name', 'Email', 'Phone', 'Expertise', 'Status', 'Joined'],
      rows.map((t) => [
        t.user?.name,
        t.user?.email,
        t.user?.phone,
        (t.expertise || []).join('; '),
        t.isActive ? 'Active' : 'Inactive',
        formatDate(t.createdAt),
      ])
    );

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setExpertiseFilter('all');
    setSortBy('name-asc');
  };

  const selectedRows = teachers.filter((t) => sel.selected.has(t._id));

  const columns = [
    <Checkbox key="all" checked={sel.allSelected(pageIds)} onChange={() => sel.togglePage(pageIds)} label="Select all on this page" />,
    '#',
    'Teacher',
    'Email',
    'Phone',
    'Expertise',
    'Status',
    'Actions',
  ];

  return (
    <Layout title="Teachers">
      <div className="space-y-5">
        <PageHeader
          title="Teachers"
          subtitle="Manage your teaching staff, their expertise and account status."
          actions={
            <>
              <ExportMenu
                options={[
                  { label: `Current view (${filtered.length}) · CSV`, onSelect: () => exportRows(filtered, 'filtered') },
                  { label: `All teachers (${teachers.length}) · CSV`, onSelect: () => exportRows(teachers, 'all') },
                  {
                    label: `Selected (${selectedRows.length}) · CSV`,
                    disabled: selectedRows.length === 0,
                    onSelect: () => exportRows(selectedRows, 'selected'),
                  },
                ]}
              />
              {canEdit && (
                <PrimaryButton icon={PlusIcon} onClick={openCreate}>
                  Add Teacher
                </PrimaryButton>
              )}
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile icon={UsersIcon} tone="blue" label="Total Teachers" value={stats.total.value} change={stats.total.change} sublabel="All registered teachers" />
          <StatTile icon={UserCheckIcon} tone="green" label="Active Teachers" value={stats.active.value} change={stats.active.change} sublabel="Currently active" />
          <StatTile icon={UserXIcon} tone="purple" label="Inactive Teachers" value={stats.inactive.value} change={stats.inactive.change} sublabel="Not active" />
          <StatTile icon={BookIcon} tone="orange" label="Expertise Areas" value={stats.expertise} sublabel="Different skill areas" />
        </div>

        {error && !showForm && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <Panel>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or expertise…" className="xl:flex-1" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:items-end">
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                allLabel="All Statuses"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                className="self-end xl:w-36"
              />
              <FilterSelect
                value={expertiseFilter}
                onChange={setExpertiseFilter}
                allLabel="All Expertise"
                options={expertiseOptions}
                className="self-end xl:w-44"
              />
              <FilterSelect
                label="Sort by"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'name-asc', label: 'Name (A-Z)' },
                  { value: 'name-desc', label: 'Name (Z-A)' },
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                ]}
                className="xl:w-40"
              />
            </div>
            <ResetButton onClick={resetFilters} />
          </Toolbar>

          <SelectionBar count={sel.selected.size} onExport={() => exportRows(selectedRows, 'selected')} onClear={sel.clear} />

          <DataTable columns={columns}>
            {loading ? (
              <TableMessage colSpan={8}>Loading teachers…</TableMessage>
            ) : pager.pageRows.length === 0 ? (
              <TableMessage colSpan={8}>No teachers found.</TableMessage>
            ) : (
              pager.pageRows.map((t, i) => (
                <tr key={t._id} className={sel.selected.has(t._id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                  <td className="py-3 pl-4 pr-3">
                    <Checkbox checked={sel.selected.has(t._id)} onChange={() => sel.toggle(t._id)} label={`Select ${t.user?.name || 'teacher'}`} />
                  </td>
                  <td className="py-3 pr-3 text-slate-500">{pager.offset + i + 1}</td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-navy-900">{t.user?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{t.user?.email}</td>
                  <td className="py-3 pr-3 text-slate-600">{t.user?.phone || '—'}</td>
                  <td className="py-3 pr-3">
                    <div className="flex max-w-[18rem] flex-wrap gap-1.5 whitespace-normal">
                      {(t.expertise || []).length === 0 && <span className="text-slate-400">—</span>}
                      {(t.expertise || []).map((ex) => (
                        <span key={ex} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge tone={t.isActive ? 'green' : 'gray'}>{t.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      {canEdit && <IconButton label="Edit teacher" icon={EditIcon} onClick={() => openEdit(t)} />}
                      <IconButton label="View details" icon={EyeIcon} onClick={() => setViewing(t)} />
                      {canEdit && (
                        <IconButton
                          label={t.isActive ? 'Deactivate teacher' : 'Activate teacher'}
                          icon={PowerIcon}
                          tone={t.isActive ? 'danger' : 'success'}
                          onClick={() => toggleStatus(t)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
          <Pagination pager={pager} noun="teachers" />
        </Panel>
      </div>

      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">{viewing.user?.name}</h2>
              <StatusBadge tone={viewing.isActive ? 'green' : 'gray'}>{viewing.isActive ? 'Active' : 'Inactive'}</StatusBadge>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Detail label="Email" value={viewing.user?.email} />
            <Detail label="Phone" value={viewing.user?.phone} />
            <Detail label="Joined" value={formatDate(viewing.createdAt)} />
            <div className="sm:col-span-2">
              <Detail label="Expertise" value={(viewing.expertise || []).join(', ')} />
            </div>
          </dl>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
            {canEdit && (
              <Button
                onClick={() => {
                  setViewing(null);
                  openEdit(viewing);
                }}
              >
                Edit
              </Button>
            )}
          </div>
        </Modal>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              {editingId ? 'Edit Teacher' : 'Add Teacher'}
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
                label="Expertise (comma-separated, e.g. MERN Stack Developer, Python)"
                value={form.expertise}
                onChange={(v) => setForm({ ...form, expertise: v })}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add Teacher'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

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

export default Teachers;

import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import {
  BookIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PowerIcon,
  UsersIcon,
} from '../components/ui/icons';
import {
  Checkbox,
  DataTable,
  Detail,
  ExportMenu,
  FilterSelect,
  IconButton,
  IconTile,
  Modal,
  PageHeader,
  Pagination,
  Panel,
  Pill,
  PrimaryButton,
  ResetButton,
  SearchInput,
  SelectionBar,
  StatTile,
  StatusBadge,
  TableMessage,
  Toolbar,
  courseIconFor,
  downloadCsv,
  formatDate,
  trendOf,
  usePagination,
  useSelection,
} from '../components/ui/kit';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyForm = { title: '', description: '', defaultDurationWeeks: '' };

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === 'admin';

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses');
      setCourses(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (course) => {
    setEditingId(course._id);
    setForm({
      title: course.title || '',
      description: course.description || '',
      defaultDurationWeeks: course.defaultDurationWeeks ?? '',
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
      const payload = {
        title: form.title,
        description: form.description,
        defaultDurationWeeks: Number(form.defaultDurationWeeks),
      };
      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
      } else {
        await api.post('/courses', payload);
      }
      closeForm();
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? 'Failed to update course' : 'Failed to create course'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/courses/${id}/status`);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course');
    }
  };

  // Extra read-only data for the design: active enrollments per course from batch counts
  const [enrolledByCourse, setEnrolledByCourse] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title-asc');
  const [viewing, setViewing] = useState(null);
  const sel = useSelection();

  useEffect(() => {
    api
      .get('/batches')
      .then(({ data }) => {
        const map = {};
        (data.data || []).forEach((b) => {
          const id = b.course?._id || b.course;
          if (id) map[id] = (map[id] || 0) + (b.enrolledCount || 0);
        });
        setEnrolledByCourse(map);
      })
      .catch(() => setEnrolledByCourse({}));
  }, []);

  const stats = useMemo(
    () => ({
      total: trendOf(courses),
      active: trendOf(courses, (c) => c.isActive),
      inactive: trendOf(courses, (c) => !c.isActive),
      enrollments: Object.values(enrolledByCourse).reduce((a, b) => a + b, 0),
    }),
    [courses, enrolledByCourse]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = courses.filter((c) => {
      if (statusFilter === 'active' && !c.isActive) return false;
      if (statusFilter === 'inactive' && c.isActive) return false;
      if (!term) return true;
      return `${c.title} ${c.description || ''}`.toLowerCase().includes(term);
    });
    const byTitle = (a, b) => (a.title || '').localeCompare(b.title || '');
    const sorters = {
      'title-asc': byTitle,
      'title-desc': (a, b) => byTitle(b, a),
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      enrollments: (a, b) => (enrolledByCourse[b._id] || 0) - (enrolledByCourse[a._id] || 0),
    };
    return [...list].sort(sorters[sortBy]);
  }, [courses, search, statusFilter, sortBy, enrolledByCourse]);

  const pager = usePagination(filtered, 10);
  const pageIds = pager.pageRows.map((c) => c._id);

  const exportRows = (rows, suffix) =>
    downloadCsv(
      `courses-${suffix}`,
      ['Title', 'Description', 'Duration (weeks)', 'Active enrollments', 'Status', 'Created'],
      rows.map((c) => [
        c.title,
        c.description,
        c.defaultDurationWeeks,
        enrolledByCourse[c._id] || 0,
        c.isActive ? 'Active' : 'Inactive',
        formatDate(c.createdAt),
      ])
    );

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('title-asc');
  };

  const columns = [
    <Checkbox
      key="all"
      checked={sel.allSelected(pageIds)}
      onChange={() => sel.togglePage(pageIds)}
      label="Select all on this page"
    />,
    '#',
    'Course',
    'Description',
    'Duration',
    'Enrollments',
    'Status',
    'Actions',
  ];

  return (
    <Layout title="Courses">
      <div className="space-y-5">
        <PageHeader
          title="Courses"
          subtitle="Manage all available courses, their details, duration and status."
          actions={
            <>
              <ExportMenu
                options={[
                  { label: `Current view (${filtered.length}) · CSV`, onSelect: () => exportRows(filtered, 'filtered') },
                  { label: `All courses (${courses.length}) · CSV`, onSelect: () => exportRows(courses, 'all') },
                  {
                    label: `Selected (${sel.selected.size}) · CSV`,
                    disabled: sel.selected.size === 0,
                    onSelect: () => exportRows(courses.filter((c) => sel.selected.has(c._id)), 'selected'),
                  },
                ]}
              />
              {canEdit && (
                <PrimaryButton icon={PlusIcon} onClick={openCreate}>
                  Add Course
                </PrimaryButton>
              )}
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile icon={BookIcon} tone="blue" label="Total Courses" value={stats.total.value} change={stats.total.change} sublabel="All available courses" />
          <StatTile icon={PlayIcon} tone="green" label="Active Courses" value={stats.active.value} change={stats.active.change} sublabel="Currently active" />
          <StatTile icon={PauseIcon} tone="purple" label="Inactive Courses" value={stats.inactive.value} change={stats.inactive.change} sublabel="Not available" />
          <StatTile icon={UsersIcon} tone="orange" label="Total Enrollments" value={stats.enrollments} sublabel="Active, across all courses" />
        </div>

        {error && !showForm && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <Panel>
          <Toolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by course title or description…"
              className="xl:flex-1"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:items-end">
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                allLabel="All Statuses"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                className="self-end xl:w-40"
              />
              <FilterSelect
                label="Sort by"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'title-asc', label: 'Title (A-Z)' },
                  { value: 'title-desc', label: 'Title (Z-A)' },
                  { value: 'newest', label: 'Newest first' },
                  { value: 'enrollments', label: 'Most enrollments' },
                ]}
                className="xl:w-44"
              />
            </div>
            <ResetButton onClick={resetFilters} />
          </Toolbar>

          <SelectionBar
            count={sel.selected.size}
            onExport={() => exportRows(courses.filter((c) => sel.selected.has(c._id)), 'selected')}
            onClear={sel.clear}
          />

          <DataTable columns={columns}>
            {loading ? (
              <TableMessage colSpan={8}>Loading courses…</TableMessage>
            ) : pager.pageRows.length === 0 ? (
              <TableMessage colSpan={8}>No courses found.</TableMessage>
            ) : (
              pager.pageRows.map((c, i) => (
                <tr key={c._id} className={sel.selected.has(c._id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                  <td className="py-3 pl-4 pr-3">
                    <Checkbox checked={sel.selected.has(c._id)} onChange={() => sel.toggle(c._id)} label={`Select ${c.title}`} />
                  </td>
                  <td className="py-3 pr-3 text-slate-500">{pager.offset + i + 1}</td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <IconTile icon={courseIconFor(c.title)} seed={c.title} />
                      <span className="whitespace-nowrap font-semibold text-navy-900">{c.title}</span>
                    </div>
                  </td>
                  <td className="max-w-[9rem] truncate py-3 pr-3 text-slate-600 2xl:max-w-xs" title={c.description || undefined}>{c.description || '—'}</td>
                  <td className="py-3 pr-3">
                    <Pill icon={ClockIcon}>{c.defaultDurationWeeks} weeks</Pill>
                  </td>
                  <td className="py-3 pr-3">
                    <Pill icon={UsersIcon} className="bg-slate-100 text-navy-900">
                      {enrolledByCourse[c._id] || 0}
                    </Pill>
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge tone={c.isActive ? 'green' : 'gray'}>{c.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <IconButton label="View details" icon={EyeIcon} onClick={() => setViewing(c)} />
                      {canEdit && (
                        <>
                          <IconButton label="Edit course" icon={EditIcon} onClick={() => openEdit(c)} />
                          <IconButton
                            label={c.isActive ? 'Deactivate course' : 'Activate course'}
                            icon={PowerIcon}
                            tone={c.isActive ? 'danger' : 'success'}
                            onClick={() => toggleStatus(c._id)}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
          <Pagination pager={pager} noun="courses" />
        </Panel>
      </div>

      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          <div className="flex items-center gap-3">
            <IconTile icon={courseIconFor(viewing.title)} seed={viewing.title} />
            <div>
              <h2 className="text-lg font-semibold text-navy-900">{viewing.title}</h2>
              <StatusBadge tone={viewing.isActive ? 'green' : 'gray'}>{viewing.isActive ? 'Active' : 'Inactive'}</StatusBadge>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Detail label="Description" value={viewing.description} />
            </div>
            <Detail label="Default duration" value={`${viewing.defaultDurationWeeks} weeks`} />
            <Detail label="Active enrollments" value={String(enrolledByCourse[viewing._id] || 0)} />
            <Detail label="Created" value={formatDate(viewing.createdAt)} />
            <Detail label="Last updated" value={formatDate(viewing.updatedAt)} />
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
              {editingId ? 'Edit Course' : 'Add Course'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Course Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                />
              </div>
              <Field
                label="Default Duration (weeks)"
                type="number"
                value={form.defaultDurationWeeks}
                onChange={(v) => setForm({ ...form, defaultDurationWeeks: v })}
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add Course'}
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

export default Courses;

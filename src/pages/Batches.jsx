import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  CalendarIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
  LayersIcon,
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
  uniqueOptions,
  usePagination,
  useSelection,
} from '../components/ui/kit';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyForm = {
  course: '',
  teacher: '',
  name: '',
  scheduleDays: [],
  scheduleStartTime: '',
  scheduleEndTime: '',
  capacity: 20,
};

const Batches = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === 'admin';

  const fetchAll = async () => {
    setLoading(true);
    try {
      const requests = [
        api.get('/batches'),
        api.get('/courses', { params: { activeOnly: true } }),
      ];
      if (canEdit) {
        requests.push(api.get('/teachers'));
      }
      const [batchRes, courseRes, teacherRes] = await Promise.all(requests);
      setBatches(batchRes.data.data);
      setCourses(courseRes.data.data);
      if (canEdit) {
        setTeachers(teacherRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      scheduleDays: f.scheduleDays.includes(day)
        ? f.scheduleDays.filter((d) => d !== day)
        : [...f.scheduleDays, day],
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (batch) => {
    setEditingId(batch._id);
    setForm({
      course: batch.course?._id || batch.course || '',
      teacher: batch.teacher?._id || batch.teacher || '',
      name: batch.name || '',
      scheduleDays: batch.scheduleDays || [],
      scheduleStartTime: batch.scheduleStartTime || '',
      scheduleEndTime: batch.scheduleEndTime || '',
      capacity: batch.capacity ?? 20,
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
    if (!form.scheduleDays.length) {
      setError('Select at least one class day');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/batches/${editingId}`, {
          name: form.name,
          teacher: form.teacher,
          scheduleDays: form.scheduleDays,
          scheduleStartTime: form.scheduleStartTime,
          scheduleEndTime: form.scheduleEndTime,
          capacity: Number(form.capacity),
        });
      } else {
        await api.post('/batches', {
          ...form,
          capacity: Number(form.capacity),
        });
      }
      closeForm();
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? 'Failed to update batch' : 'Failed to create batch'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (batch) => {
    try {
      await api.put(`/batches/${batch._id}`, { isActive: !batch.isActive });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update batch status');
    }
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [viewing, setViewing] = useState(null);
  const sel = useSelection();

  const isTeacher = user?.role === 'teacher';
  const isActiveBatch = (b) => b.isActive !== false;

  const courseOptions = useMemo(() => uniqueOptions(batches.map((b) => b.course?.title)), [batches]);
  const teacherOptions = useMemo(() => uniqueOptions(batches.map((b) => b.teacher?.user?.name)), [batches]);

  const stats = useMemo(() => {
    const students = batches.reduce((sum, b) => sum + (b.enrolledCount || 0), 0);
    return {
      total: trendOf(batches),
      active: trendOf(batches, isActiveBatch),
      students,
      avg: batches.length ? Math.round(students / batches.length) : 0,
    };
  }, [batches]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return batches.filter((b) => {
      if (statusFilter === 'active' && !isActiveBatch(b)) return false;
      if (statusFilter === 'inactive' && isActiveBatch(b)) return false;
      if (courseFilter !== 'all' && b.course?.title !== courseFilter) return false;
      if (teacherFilter !== 'all' && b.teacher?.user?.name !== teacherFilter) return false;
      if (!term) return true;
      return [b.name, b.course?.title, b.teacher?.user?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [batches, search, statusFilter, courseFilter, teacherFilter]);

  const pager = usePagination(filtered, 10);
  const pageIds = pager.pageRows.map((b) => b._id);
  const selectedRows = batches.filter((b) => sel.selected.has(b._id));

  const exportRows = (rows, suffix) =>
    downloadCsv(
      `batches-${suffix}`,
      ['Batch', 'Course', 'Teacher', 'Days', 'Start', 'End', 'Capacity', 'Enrolled', 'Status'],
      rows.map((b) => [
        b.name,
        b.course?.title,
        b.teacher?.user?.name,
        (b.scheduleDays || []).join(' '),
        b.scheduleStartTime,
        b.scheduleEndTime,
        b.capacity,
        b.enrolledCount,
        isActiveBatch(b) ? 'Active' : 'Inactive',
      ])
    );

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCourseFilter('all');
    setTeacherFilter('all');
  };

  const fillPct = (b) => (b.capacity ? Math.min(100, Math.round(((b.enrolledCount || 0) / b.capacity) * 100)) : 0);
  const pageTitle = isTeacher ? 'My Batches' : 'Batches';

  const columns = [
    <Checkbox key="all" checked={sel.allSelected(pageIds)} onChange={() => sel.togglePage(pageIds)} label="Select all on this page" />,
    '#',
    'Batch Name',
    'Course',
    'Teacher',
    'Schedule',
    { label: 'Capacity', className: 'hidden 2xl:table-cell' },
    'Enrolled',
    'Status',
    'Actions',
  ];

  return (
    <Layout title={pageTitle}>
      <div className="space-y-5">
        <PageHeader
          title={pageTitle}
          subtitle={
            isTeacher
              ? 'Your batches, schedule and how many students are enrolled.'
              : 'Manage your course batches, schedule, capacity and enrollment status. Max 20 students each.'
          }
          actions={
            <>
              <ExportMenu
                options={[
                  { label: `Current view (${filtered.length}) · CSV`, onSelect: () => exportRows(filtered, 'filtered') },
                  { label: `All batches (${batches.length}) · CSV`, onSelect: () => exportRows(batches, 'all') },
                  {
                    label: `Selected (${selectedRows.length}) · CSV`,
                    disabled: selectedRows.length === 0,
                    onSelect: () => exportRows(selectedRows, 'selected'),
                  },
                ]}
              />
              {canEdit && (
                <PrimaryButton icon={PlusIcon} onClick={openCreate}>
                  Add Batch
                </PrimaryButton>
              )}
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile icon={LayersIcon} tone="purple" label="Total Batches" value={stats.total.value} change={stats.total.change} sublabel="All batches" />
          <StatTile icon={PlayIcon} tone="green" label="Active Batches" value={stats.active.value} change={stats.active.change} sublabel="Currently running" />
          <StatTile icon={UsersIcon} tone="orange" label="Total Students" value={stats.students} sublabel="Across all batches" />
          <StatTile icon={CalendarIcon} tone="blue" label="Average Batch Size" value={stats.avg} sublabel="Students per batch" />
        </div>

        {error && !showForm && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <Panel>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by batch name, course, or teacher…" className="xl:flex-1" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:items-end">
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                allLabel="All Statuses"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                className="xl:w-36"
              />
              <FilterSelect value={courseFilter} onChange={setCourseFilter} allLabel="All Courses" options={courseOptions} className="xl:w-44" />
              {!isTeacher && (
                <FilterSelect value={teacherFilter} onChange={setTeacherFilter} allLabel="All Teachers" options={teacherOptions} className="xl:w-40" />
              )}
            </div>
            <ResetButton onClick={resetFilters} />
          </Toolbar>

          <SelectionBar count={sel.selected.size} onExport={() => exportRows(selectedRows, 'selected')} onClear={sel.clear} />

          <DataTable columns={columns}>
            {loading ? (
              <TableMessage colSpan={10}>Loading batches…</TableMessage>
            ) : pager.pageRows.length === 0 ? (
              <TableMessage colSpan={10}>No batches found.</TableMessage>
            ) : (
              pager.pageRows.map((b, i) => (
                <tr key={b._id} className={sel.selected.has(b._id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                  <td className="py-3 pl-4 pr-3">
                    <Checkbox checked={sel.selected.has(b._id)} onChange={() => sel.toggle(b._id)} label={`Select ${b.name}`} />
                  </td>
                  <td className="py-3 pr-3 text-slate-500">{pager.offset + i + 1}</td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <IconTile icon={courseIconFor(b.course?.title)} seed={b.course?.title} />
                      <span className="min-w-[9rem] max-w-[12rem] whitespace-normal font-semibold leading-snug text-navy-900">{b.name}</span>
                    </div>
                  </td>
                  <td className="min-w-[7rem] max-w-[8rem] whitespace-normal py-3 pr-3 text-slate-600 2xl:max-w-[10rem]">{b.course?.title || '—'}</td>
                  <td className="py-3 pr-3">
                    {b.teacher?.user?.name ? (
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-slate-700">{b.teacher.user.name}</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                      {(b.scheduleDays || []).join(', ') || '—'}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                      {b.scheduleStartTime} – {b.scheduleEndTime}
                    </div>
                  </td>
                  <td className="hidden py-3 pr-3 text-slate-700 2xl:table-cell">{b.capacity}</td>
                  <td className="py-3 pr-3">
                    <div className="w-20 2xl:w-28">
                      <div className="flex justify-between text-xs">
                        <span className="text-navy-900">
                          {b.enrolledCount || 0}/{b.capacity}
                        </span>
                        <span className="text-slate-500">{fillPct(b)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${fillPct(b)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge tone={isActiveBatch(b) ? 'green' : 'gray'}>{isActiveBatch(b) ? 'Active' : 'Inactive'}</StatusBadge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      {!canEdit && <IconButton label="View details" icon={EyeIcon} onClick={() => setViewing(b)} />}
                      {canEdit && (
                        <>
                          <IconButton label="Edit batch" icon={EditIcon} onClick={() => openEdit(b)} />
                          <IconButton
                            label={isActiveBatch(b) ? 'Deactivate batch' : 'Activate batch'}
                            icon={PowerIcon}
                            tone={isActiveBatch(b) ? 'danger' : 'success'}
                            onClick={() => toggleStatus(b)}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
          <Pagination pager={pager} noun="batches" />
        </Panel>
      </div>

      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          <div className="flex items-center gap-3">
            <IconTile icon={courseIconFor(viewing.course?.title)} seed={viewing.course?.title} />
            <div>
              <h2 className="text-lg font-semibold text-navy-900">{viewing.name}</h2>
              <StatusBadge tone={isActiveBatch(viewing) ? 'green' : 'gray'}>
                {isActiveBatch(viewing) ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Detail label="Course" value={viewing.course?.title} />
            <Detail label="Teacher" value={viewing.teacher?.user?.name} />
            <Detail label="Class days" value={(viewing.scheduleDays || []).join(', ')} />
            <Detail label="Time" value={`${viewing.scheduleStartTime} – ${viewing.scheduleEndTime}`} />
            <Detail label="Enrolled" value={`${viewing.enrolledCount || 0} of ${viewing.capacity}`} />
            <Detail label="Spots left" value={String(viewing.spotsLeft ?? '—')} />
            <Detail label="Created" value={formatDate(viewing.createdAt)} />
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              {editingId ? 'Edit Batch' : 'Add Batch'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">Batch Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                  placeholder="e.g. Batch A – Evening"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">Course</label>
                <select
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  required={!editingId}
                  disabled={Boolean(editingId)}
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none disabled:bg-gray-50"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                  {editingId &&
                    form.course &&
                    !courses.some((c) => c._id === form.course) && (
                      <option value={form.course}>Current course</option>
                    )}
                </select>
                {editingId && (
                  <p className="mt-1 text-xs text-gray-500">Course cannot be changed after creation.</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">Teacher</label>
                <select
                  value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                  required
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  Class Days (teacher-selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.scheduleDays.includes(day)
                          ? 'border-navy-500 bg-navy-500 text-white'
                          : 'border-navy-100 text-gray-600 hover:bg-navy-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">Start Time</label>
                  <input
                    type="time"
                    value={form.scheduleStartTime}
                    onChange={(e) => setForm({ ...form, scheduleStartTime: e.target.value })}
                    required
                    className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">End Time</label>
                  <input
                    type="time"
                    value={form.scheduleEndTime}
                    onChange={(e) => setForm({ ...form, scheduleEndTime: e.target.value })}
                    required
                    className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  Capacity (max 20)
                </label>
                <input
                  type="number"
                  max={20}
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add Batch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Batches;

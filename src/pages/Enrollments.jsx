import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  UserCheckIcon,
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
  uniqueOptions,
  usePagination,
  useSelection,
} from '../components/ui/kit';

const emptyForm = { student: '', course: '', batch: '', courseDurationWeeks: '', status: 'active' };

const Enrollments = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [cyclePeriod, setCyclePeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === 'admin';
  const isFounder = user?.role === 'founder';

  const fetchAll = async () => {
    setLoading(true);
    try {
      const requests = [api.get('/enrollments')];
      if (canEdit) {
        requests.push(
          api.get('/students'),
          api.get('/courses', { params: { activeOnly: true } }),
          api.get('/batches')
        );
      }
      const results = await Promise.all(requests);
      setEnrollments(results[0].data.data);
      setCyclePeriod(results[0].data.period || null);
      if (canEdit) {
        setStudents(results[1].data.data);
        setCourses(results[2].data.data);
        setBatches(results[3].data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const batchesForCourse = batches.filter(
    (b) => b.course?._id === form.course || b.course === form.course
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (enrollment) => {
    setEditingId(enrollment._id);
    setForm({
      student: enrollment.student?._id || '',
      course: enrollment.course?._id || '',
      batch: enrollment.batch?._id || '',
      courseDurationWeeks: enrollment.courseDurationWeeks ?? '',
      status: enrollment.status || 'active',
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
      if (editingId) {
        const payload = {
          status: form.status,
          batch: form.batch,
        };
        if (form.courseDurationWeeks) {
          payload.courseDurationWeeks = Number(form.courseDurationWeeks);
        }
        await api.put(`/enrollments/${editingId}`, payload);
      } else {
        const payload = {
          student: form.student,
          course: form.course,
          batch: form.batch,
        };
        if (form.courseDurationWeeks) {
          payload.courseDurationWeeks = Number(form.courseDurationWeeks);
        }
        await api.post('/enrollments', payload);
      }
      closeForm();
      fetchAll();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingId ? 'Failed to update enrollment' : 'Failed to create enrollment')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewing, setViewing] = useState(null);
  const sel = useSelection();

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const pageTitle = isStudent ? 'My Courses' : isTeacher ? 'My Students' : 'Enrollments';
  const enrolledOn = (e) => e.enrolledAt || e.createdAt;

  const courseOptions = useMemo(() => uniqueOptions(enrollments.map((e) => e.course?.title)), [enrollments]);
  const batchOptions = useMemo(() => uniqueOptions(enrollments.map((e) => e.batch?.name)), [enrollments]);

  const stats = useMemo(() => {
    const durations = enrollments.map((e) => Number(e.courseDurationWeeks)).filter((n) => n > 0);
    return {
      total: trendOf(enrollments),
      active: trendOf(enrollments, (e) => e.status === 'active'),
      completed: trendOf(enrollments, (e) => e.status === 'completed'),
      avgWeeks: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
    };
  }, [enrollments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrollments.filter((e) => {
      if (courseFilter !== 'all' && e.course?.title !== courseFilter) return false;
      if (batchFilter !== 'all' && e.batch?.name !== batchFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (!term) return true;
      return [e.student?.user?.name, e.student?.user?.email, e.course?.title, e.batch?.name, e.teacher?.user?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [enrollments, search, courseFilter, batchFilter, statusFilter]);

  const pager = usePagination(filtered, 10);
  const pageIds = pager.pageRows.map((e) => e._id);
  const selectedRows = enrollments.filter((e) => sel.selected.has(e._id));

  const exportRows = (rows, suffix) =>
    downloadCsv(
      `enrollments-${suffix}`,
      ['Student', 'Email', 'Course', 'Batch', 'Teacher', 'Duration (weeks)', 'Status', 'Enrolled on'],
      rows.map((e) => [
        e.student?.user?.name,
        e.student?.user?.email,
        e.course?.title,
        e.batch?.name,
        e.teacher?.user?.name,
        e.courseDurationWeeks,
        e.status,
        formatDate(enrolledOn(e)),
      ])
    );

  const resetFilters = () => {
    setSearch('');
    setCourseFilter('all');
    setBatchFilter('all');
    setStatusFilter('all');
  };

  const statusTone = { active: 'green', completed: 'blue', dropped: 'red' };
  const showStudent = !isStudent;
  const showTeacher = !isTeacher;

  const columns = [
    <Checkbox key="all" checked={sel.allSelected(pageIds)} onChange={() => sel.togglePage(pageIds)} label="Select all on this page" />,
    '#',
    ...(showStudent ? ['Student'] : []),
    'Course',
    'Batch',
    ...(showTeacher ? ['Teacher'] : []),
    { label: 'Duration', className: 'hidden min-[1700px]:table-cell' },
    'Status',
    { label: 'Enrolled On', className: 'hidden min-[1360px]:table-cell' },
    'Actions',
  ];

  const subtitle = isFounder
    ? `Showing enrollments from this fee cycle${
        cyclePeriod?.start && cyclePeriod?.cycleEnd
          ? ` (${new Date(cyclePeriod.start).toLocaleDateString()} – ${new Date(cyclePeriod.cycleEnd).toLocaleDateString()})`
          : ' (25th to 25th)'
      }.`
    : isStudent
      ? 'Your courses, batches and progress.'
      : isTeacher
        ? 'Students enrolled in your batches.'
        : 'Manage student enrollments, track progress and course participation. Max 2 active per student.';

  return (
    <Layout title={pageTitle}>
      <div className="space-y-5">
        <PageHeader
          title={pageTitle}
          subtitle={subtitle}
          actions={
            <>
              <ExportMenu
                options={[
                  { label: `Current view (${filtered.length}) · CSV`, onSelect: () => exportRows(filtered, 'filtered') },
                  { label: `All (${enrollments.length}) · CSV`, onSelect: () => exportRows(enrollments, 'all') },
                  {
                    label: `Selected (${selectedRows.length}) · CSV`,
                    disabled: selectedRows.length === 0,
                    onSelect: () => exportRows(selectedRows, 'selected'),
                  },
                ]}
              />
              {canEdit && (
                <PrimaryButton icon={PlusIcon} onClick={openCreate}>
                  New Enrollment
                </PrimaryButton>
              )}
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile icon={UsersIcon} tone="blue" label="Total Enrollments" value={stats.total.value} change={stats.total.change} sublabel="Across all courses" />
          <StatTile icon={UserCheckIcon} tone="green" label="Active Enrollments" value={stats.active.value} change={stats.active.change} sublabel="Currently active" />
          <StatTile icon={CheckCircleIcon} tone="purple" label="Completed" value={stats.completed.value} change={stats.completed.change} sublabel="Successfully completed" />
          <StatTile icon={ClockIcon} tone="orange" label="Avg. Duration" value={`${stats.avgWeeks} weeks`} sublabel="Per enrollment" />
        </div>

        {error && !showForm && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <Panel>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by student, course, batch, or teacher…" className="xl:flex-1" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:items-end">
              <FilterSelect value={courseFilter} onChange={setCourseFilter} allLabel="All Courses" options={courseOptions} className="xl:w-44" />
              <FilterSelect value={batchFilter} onChange={setBatchFilter} allLabel="All Batches" options={batchOptions} className="xl:w-44" />
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                allLabel="All Statuses"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'dropped', label: 'Dropped' },
                ]}
                className="xl:w-36"
              />
            </div>
            <ResetButton onClick={resetFilters} />
          </Toolbar>

          <SelectionBar count={sel.selected.size} onExport={() => exportRows(selectedRows, 'selected')} onClear={sel.clear} />

          <DataTable columns={columns}>
            {loading ? (
              <TableMessage colSpan={columns.length}>Loading enrollments…</TableMessage>
            ) : pager.pageRows.length === 0 ? (
              <TableMessage colSpan={columns.length}>No enrollments found.</TableMessage>
            ) : (
              pager.pageRows.map((e, i) => (
                <tr key={e._id} className={sel.selected.has(e._id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                  <td className="py-3 pl-4 pr-3">
                    <Checkbox checked={sel.selected.has(e._id)} onChange={() => sel.toggle(e._id)} label="Select enrollment" />
                  </td>
                  <td className="py-3 pr-3 text-slate-500">{pager.offset + i + 1}</td>
                  {showStudent && (
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold text-navy-900">{e.student?.user?.name || 'Unknown'}</div>
                          {e.student?.user?.email && (
                            <div className="hidden max-w-[12rem] truncate text-xs text-slate-500 2xl:block" title={e.student.user.email}>
                              {e.student.user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="hidden 2xl:block">
                        <IconTile icon={courseIconFor(e.course?.title)} seed={e.course?.title} />
                      </span>
                      <span className="min-w-[7.5rem] max-w-[9rem] whitespace-normal leading-snug text-slate-700">{e.course?.title}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    {e.batch?.name ? <Pill wrap className="min-w-[7rem] max-w-[10rem] bg-blue-50 text-blue-700">{e.batch.name}</Pill> : '—'}
                  </td>
                  {showTeacher && (
                    <td className="py-3 pr-3">
                      {e.teacher?.user?.name ? (
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap text-slate-700">{e.teacher.user.name}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td className="hidden py-3 pr-3 min-[1700px]:table-cell">
                    <Pill icon={ClockIcon}>{e.courseDurationWeeks} weeks</Pill>
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge tone={statusTone[e.status] || 'gray'}>{e.status}</StatusBadge>
                  </td>
                  <td className="hidden py-3 pr-3 text-slate-600 min-[1360px]:table-cell">{formatDate(enrolledOn(e))}</td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <IconButton label="View details" icon={EyeIcon} onClick={() => setViewing(e)} />
                      {canEdit && <IconButton label="Edit enrollment" icon={EditIcon} onClick={() => openEdit(e)} />}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
          <Pagination pager={pager} noun="enrollments" />
        </Panel>
      </div>

      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">{viewing.student?.user?.name || 'Enrollment'}</h2>
              <StatusBadge tone={statusTone[viewing.status] || 'gray'}>{viewing.status}</StatusBadge>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Detail label="Course" value={viewing.course?.title} />
            <Detail label="Batch" value={viewing.batch?.name} />
            <Detail label="Teacher" value={viewing.teacher?.user?.name} />
            <Detail label="Duration" value={`${viewing.courseDurationWeeks} weeks`} />
            <Detail label="Enrolled on" value={formatDate(enrolledOn(viewing))} />
            <Detail label="Expected end" value={formatDate(viewing.expectedEndDate)} />
            {viewing.completedAt && <Detail label="Completed on" value={formatDate(viewing.completedAt)} />}
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
              {editingId ? 'Edit Enrollment' : 'New Enrollment'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {!editingId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">Student</label>
                  <select
                    value={form.student}
                    onChange={(e) => setForm({ ...form, student: e.target.value })}
                    required
                    className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                  >
                    <option value="">Select a student</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.user?.name} ({s.user?.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!editingId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">Course</label>
                  <select
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value, batch: '' })}
                    required
                    className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                  >
                    <option value="">Select a course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingId && (
                <div className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-800">
                  Course is fixed. You can change batch (same course), duration, and status.
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">Batch</label>
                <select
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  required
                  disabled={!form.course}
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none disabled:bg-gray-50"
                >
                  <option value="">Select a batch</option>
                  {batchesForCourse.map((b) => (
                    <option key={b._id} value={b._id} disabled={!editingId && b.spotsLeft <= 0}>
                      {b.name} ({b.enrolledCount}/{b.capacity} filled)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  Course Duration (weeks){editingId ? '' : ' — optional override'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.courseDurationWeeks}
                  onChange={(e) => setForm({ ...form, courseDurationWeeks: e.target.value })}
                  placeholder={editingId ? '' : 'Uses course default if left blank'}
                  required={Boolean(editingId)}
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                />
              </div>

              {editingId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Saving…'
                    : editingId
                      ? 'Save changes'
                      : 'Enroll Student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Enrollments;

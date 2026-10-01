import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ChartIcon, CheckCircleIcon, ClockIcon, SearchIcon, UsersIcon } from '../components/ui/icons';
import {
  DataTable,
  ExportMenu,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  StatTile,
  StatusBadge,
  TableMessage,
  downloadCsv,
  usePagination,
} from '../components/ui/kit';

const todayYmd = () => new Date().toISOString().slice(0, 10);

const courseKey = (title) => String(title || '').trim();

const CourseFilterButtons = ({ courses, selected, onSelect }) => {
  if (!courses.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
          selected === 'all'
            ? 'border-navy-800 bg-navy-800 text-white shadow-sm'
            : 'border-slate-200 bg-white text-navy-900 hover:bg-slate-50'
        }`}
      >
        All
      </button>
      {courses.map((title) => (
        <button
          key={title}
          type="button"
          onClick={() => onSelect(title)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            selected === title
              ? 'border-navy-800 bg-navy-800 text-white shadow-sm'
              : 'border-slate-200 bg-white text-navy-900 hover:bg-slate-50'
          }`}
        >
          {title}
        </button>
      ))}
    </div>
  );
};

const Attendance = () => {
  const { user } = useAuth();
  const canMark = user?.role === 'admin' || user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [statuses, setStatuses] = useState([]);
  const [threshold, setThreshold] = useState(75);
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [sessionDate, setSessionDate] = useState(todayYmd());
  const [roster, setRoster] = useState([]);
  const [session, setSession] = useState(null);
  const [marks, setMarks] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [myStats, setMyStats] = useState([]);
  const [courseFilter, setCourseFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const staffCourses = useMemo(() => {
    const titles = new Set();
    batches.forEach((b) => {
      const t = courseKey(b.course?.title);
      if (t) titles.add(t);
    });
    alerts.forEach((a) => {
      const t = courseKey(a.courseTitle);
      if (t) titles.add(t);
    });
    return [...titles].sort((a, b) => a.localeCompare(b));
  }, [batches, alerts]);

  const studentCourses = useMemo(() => {
    const titles = new Set();
    myStats.forEach((s) => {
      const t = courseKey(s.courseTitle);
      if (t) titles.add(t);
    });
    return [...titles].sort((a, b) => a.localeCompare(b));
  }, [myStats]);

  const filteredBatches = useMemo(() => {
    if (courseFilter === 'all') return batches;
    return batches.filter((b) => courseKey(b.course?.title) === courseFilter);
  }, [batches, courseFilter]);

  const filteredAlerts = useMemo(() => {
    if (courseFilter === 'all') return alerts;
    return alerts.filter((a) => courseKey(a.courseTitle) === courseFilter);
  }, [alerts, courseFilter]);

  const filteredMyStats = useMemo(() => {
    if (courseFilter === 'all') return myStats;
    return myStats.filter((s) => courseKey(s.courseTitle) === courseFilter);
  }, [myStats, courseFilter]);

  const handleCourseFilter = (next) => {
    setCourseFilter(next);
    if (next === 'all') return;
    const stillValid = batches.some(
      (b) => String(b._id) === batchId && courseKey(b.course?.title) === next
    );
    if (!stillValid) {
      setBatchId('');
      setSession(null);
      setRoster([]);
      setMarks({});
    }
  };

  const loadBase = async () => {
    setLoading(true);
    try {
      const statusRes = await api.get('/attendance/statuses');
      setStatuses(statusRes.data.data || []);
      setThreshold(statusRes.data.threshold || 75);

      if (isStudent) {
        const mine = await api.get('/attendance/me');
        setMyStats(mine.data.data || []);
      } else {
        const [batchRes, alertRes] = await Promise.all([
          api.get('/batches'),
          api.get('/attendance/alerts?all=true'),
        ]);
        setBatches(batchRes.data.data || []);
        setAlerts(alertRes.data.data || []);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent]);

  const loadRoster = async () => {
    if (!batchId) return;
    setError('');
    try {
      const { data } = await api.post('/attendance/sessions', { batch: batchId, sessionDate });
      setSession(data.data);
      const rosterRes = await api.get(`/attendance/sessions/${data.data._id}`);
      const rows = rosterRes.data.data.roster || [];
      setRoster(rows);
      const next = {};
      rows.forEach((r) => {
        if (r.statusId) next[r.studentId] = r.statusId;
      });
      setMarks(next);
    } catch (err) {
      setSession(null);
      setRoster([]);
      setMarks({});
      setError(err.response?.data?.message || 'Failed to load class roster');
    }
  };

  const handleSave = async () => {
    if (!session) return;
    const missing = roster.filter((r) => !marks[r.studentId]);
    if (missing.length) {
      setError('Mark Present, Absent, or Leave for every student before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/attendance/sessions/${session._id}`, {
        marks: roster.map((r) => ({
          student: r.studentId,
          enrollment: r.enrollmentId,
          status: marks[r.studentId],
        })),
      });
      await loadRoster();
      const alertRes = await api.get('/attendance/alerts?all=true');
      setAlerts(alertRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const [overviewSearch, setOverviewSearch] = useState('');

  // Present/absent counts for the loaded class, based on the marks currently selected
  const statusById = useMemo(() => {
    const map = {};
    statuses.forEach((s) => {
      map[s._id] = `${s.code || ''} ${s.label || ''}`.toLowerCase();
    });
    return map;
  }, [statuses]);

  const classStats = useMemo(() => {
    const marked = roster.map((r) => statusById[marks[r.studentId]] || '');
    return {
      total: roster.length,
      present: marked.filter((s) => s.includes('present')).length,
      absent: marked.filter((s) => s.includes('absent')).length,
    };
  }, [roster, marks, statusById]);

  const overviewRows = useMemo(() => {
    const term = overviewSearch.trim().toLowerCase();
    if (!term) return filteredAlerts;
    return filteredAlerts.filter((a) =>
      [a.studentName, a.courseTitle, a.batchName].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
    );
  }, [filteredAlerts, overviewSearch]);

  const avgAttendance = useMemo(() => {
    const vals = filteredAlerts.map((a) => a.percent).filter((p) => p != null);
    return vals.length ? Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 10) / 10 : null;
  }, [filteredAlerts]);

  const overviewPager = usePagination(overviewRows, 10);
  const share = (n) => (classStats.total ? `${Math.round((n / classStats.total) * 1000) / 10}%` : null);

  const exportOverview = (rows, suffix) =>
    downloadCsv(
      `attendance-${suffix}`,
      ['Student', 'Course', 'Batch', 'Present', 'Classes', 'Attendance %', 'Status'],
      rows.map((a) => [
        a.studentName,
        a.courseTitle,
        a.batchName,
        a.presentCount,
        a.totalSessions,
        a.percent == null ? '' : a.percent,
        a.percent == null ? 'No classes yet' : a.belowThreshold ? 'Low' : 'Good',
      ])
    );

  const barColor = (p) => (p < 50 ? 'bg-red-500' : p < threshold ? 'bg-amber-400' : 'bg-emerald-500');
  const textColor = (p) => (p < 50 ? 'text-red-600' : p < threshold ? 'text-amber-600' : 'text-emerald-600');

  const pageTitle = isStudent ? 'My Attendance' : "Today's Class";

  return (
    <Layout title={pageTitle}>
      <div className="space-y-5">
        <PageHeader
          title={pageTitle}
          subtitle={
            isStudent
              ? 'Your attendance for each course and batch.'
              : "View and track student attendance for today's class by course and batch."
          }
        />

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        {loading && <p className="text-slate-500">Loading attendance…</p>}

        {isStudent && !loading && (
          <div className="space-y-5">
            <CourseFilterButtons courses={studentCourses} selected={courseFilter} onSelect={setCourseFilter} />
            {filteredMyStats.length === 0 ? (
              <Panel className="p-8 text-center text-sm text-slate-400">
                {myStats.length === 0
                  ? 'No attendance yet. It will appear after your teacher marks a class.'
                  : 'No attendance for this course.'}
              </Panel>
            ) : (
              filteredMyStats.map((s) => (
                <Panel key={s.enrollmentId}>
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-navy-900">{s.courseTitle}</h3>
                      <p className="text-sm text-slate-500">{s.batchName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-navy-800">
                        Present / classes:{' '}
                        <strong>
                          {s.presentCount ?? 0}/{s.totalSessions ?? 0}
                        </strong>
                      </span>
                      <span
                        className={`rounded-lg px-3 py-1.5 font-semibold ${
                          s.belowThreshold ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        Attendance: {s.percent == null ? 'No classes yet' : `${s.percent}%`}
                        {s.belowThreshold ? ` (below ${s.threshold}%)` : ''}
                      </span>
                    </div>
                  </div>
                  {s.percent != null && (
                    <div className="px-5 pb-4">
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${barColor(s.percent)}`} style={{ width: `${Math.min(100, s.percent)}%` }} />
                      </div>
                    </div>
                  )}
                  <DataTable columns={['Date', 'Status']}>
                    {[...(s.records || [])]
                      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
                      .map((r) => (
                        <tr key={`${s.enrollmentId}-${r.date}-${r.code}`}>
                          <td className="py-3 pl-4 pr-3 text-slate-600">{r.date || '—'}</td>
                          <td className="py-3 pr-4">
                            <StatusBadge
                              tone={/present/i.test(`${r.code} ${r.status}`) ? 'green' : /absent/i.test(`${r.code} ${r.status}`) ? 'red' : 'amber'}
                            >
                              {r.status || '—'}
                            </StatusBadge>
                          </td>
                        </tr>
                      ))}
                    {(s.records || []).length === 0 && (
                      <TableMessage colSpan={2}>
                        No class dates marked yet. Percentage will update after attendance is saved.
                      </TableMessage>
                    )}
                  </DataTable>
                </Panel>
              ))
            )}
          </div>
        )}

        {!isStudent && !loading && (
          <>
            <CourseFilterButtons courses={staffCourses} selected={courseFilter} onSelect={handleCourseFilter} />

            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="block rounded-xl border border-slate-100 bg-white p-3 shadow-card">
                <span className="mb-1 block text-sm font-medium text-navy-900">Select Batch</span>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Select a batch</option>
                  {filteredBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b.course?.title ? `· ${b.course.title}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block rounded-xl border border-slate-100 bg-white p-3 shadow-card">
                <span className="mb-1 block text-sm font-medium text-navy-900">Class Date</span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={loadRoster}
                disabled={!batchId}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SearchIcon className="h-4 w-4" />
                Load Class
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatTile icon={UsersIcon} tone="blue" label="Total Students" value={roster.length ? classStats.total : '—'} sublabel={roster.length ? 'In this class' : 'Load a class to see'} />
              <StatTile
                icon={CheckCircleIcon}
                tone="green"
                label="Present"
                value={roster.length ? classStats.present : '—'}
                sublabel="Marked present"
                badge={share(classStats.present) && <StatusBadge tone="green" dot={false}>{share(classStats.present)}</StatusBadge>}
              />
              <StatTile
                icon={ClockIcon}
                tone="orange"
                label="Absent"
                value={roster.length ? classStats.absent : '—'}
                sublabel="Marked absent"
                badge={share(classStats.absent) && <StatusBadge tone="red" dot={false}>{share(classStats.absent)}</StatusBadge>}
              />
              <StatTile
                icon={ChartIcon}
                tone="purple"
                label="Average Attendance"
                value={avgAttendance == null ? '—' : `${avgAttendance}%`}
                sublabel={courseFilter === 'all' ? 'Across all students' : courseFilter}
              />
            </div>

            {roster.length > 0 && (
              <Panel>
                <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-navy-900">Mark attendance</h3>
                    <p className="text-xs text-slate-500">{roster.length} student(s) · mark Present, Absent, or Leave</p>
                  </div>
                  {canMark && (
                    <Button type="button" onClick={handleSave} disabled={saving} className="!bg-blue-600 hover:!bg-blue-700">
                      {saving ? 'Saving…' : 'Save attendance'}
                    </Button>
                  )}
                </div>
                <DataTable columns={['#', 'Student', 'Email', 'Status']}>
                  {roster.map((r, i) => (
                    <tr key={r.studentId} className="hover:bg-slate-50/60">
                      <td className="py-3 pl-4 pr-3 text-slate-500">{i + 1}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-navy-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-600">{r.email}</td>
                      <td className="py-3 pr-4">
                        <select
                          value={marks[r.studentId] || ''}
                          disabled={!canMark}
                          onChange={(e) => setMarks((prev) => ({ ...prev, [r.studentId]: e.target.value }))}
                          className="w-full min-w-[8rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:bg-slate-50"
                        >
                          <option value="">Select</option>
                          {statuses.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </Panel>
            )}

            <Panel>
              <div className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
                <div className="md:mr-auto">
                  <h3 className="text-base font-semibold text-navy-900">Student attendance overview</h3>
                  <p className="text-xs text-slate-500">
                    {courseFilter === 'all'
                      ? `All active enrollments. Below ${threshold}% is highlighted in red.`
                      : `${courseFilter} only. Below ${threshold}% is highlighted in red.`}
                  </p>
                </div>
                <ExportMenu
                  options={[
                    { label: `Current view (${overviewRows.length}) · CSV`, onSelect: () => exportOverview(overviewRows, 'filtered') },
                    { label: `All (${alerts.length}) · CSV`, onSelect: () => exportOverview(alerts, 'all') },
                  ]}
                />
                <SearchInput value={overviewSearch} onChange={setOverviewSearch} placeholder="Search by student name…" className="md:w-72" />
              </div>
              <DataTable columns={['#', 'Student', 'Course', 'Batch', 'Present / Classes', 'Attendance', 'Status']}>
                {overviewPager.pageRows.map((a, i) => (
                  <tr key={a.enrollmentId} className="hover:bg-slate-50/60">
                    <td className="py-3 pl-4 pr-3 text-slate-500">{overviewPager.offset + i + 1}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-navy-900">{a.studentName}</span>
                      </div>
                    </td>
                    <td className="max-w-[10rem] whitespace-normal py-3 pr-3 text-slate-600">{a.courseTitle}</td>
                    <td className="max-w-[10rem] whitespace-normal py-3 pr-3 text-slate-600">{a.batchName}</td>
                    <td className="py-3 pr-3 text-slate-600">
                      {a.presentCount} / {a.totalSessions}
                    </td>
                    <td className="py-3 pr-3">
                      {a.percent == null ? (
                        <span className="text-slate-400">No classes yet</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 rounded-full bg-slate-100">
                            <div className={`h-2 rounded-full ${barColor(a.percent)}`} style={{ width: `${Math.min(100, a.percent)}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${textColor(a.percent)}`}>{a.percent}%</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {a.percent == null ? (
                        <StatusBadge tone="gray" dot={false}>—</StatusBadge>
                      ) : a.belowThreshold ? (
                        <StatusBadge tone="red" dot={false}>Low</StatusBadge>
                      ) : (
                        <StatusBadge tone="green" dot={false}>Good</StatusBadge>
                      )}
                    </td>
                  </tr>
                ))}
                {overviewRows.length === 0 && (
                  <TableMessage colSpan={7}>
                    {alerts.length === 0
                      ? 'No active enrollments yet.'
                      : filteredAlerts.length === 0
                        ? 'No enrollments for this course.'
                        : 'No matching students.'}
                  </TableMessage>
                )}
              </DataTable>
              <Pagination pager={overviewPager} noun="students" />
            </Panel>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;

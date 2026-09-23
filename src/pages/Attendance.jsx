import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const todayYmd = () => new Date().toISOString().slice(0, 10);

const courseKey = (title) => String(title || '').trim();

const CourseFilterButtons = ({ courses, selected, onSelect }) => {
  if (!courses.length) return null;

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
          selected === 'all'
            ? 'border-navy-700 bg-navy-800 text-white'
            : 'border-navy-100 bg-white text-navy-800 hover:border-navy-300'
        }`}
      >
        All
      </button>
      {courses.map((title) => (
        <button
          key={title}
          type="button"
          onClick={() => onSelect(title)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            selected === title
              ? 'border-navy-700 bg-navy-800 text-white'
              : 'border-navy-100 bg-white text-navy-800 hover:border-navy-300'
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

  return (
    <Layout title={isStudent ? 'My attendance' : "Today's class"}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading && <p className="text-gray-500">Loading attendance…</p>}

      {isStudent && !loading && (
        <div className="space-y-6">
          <CourseFilterButtons
            courses={studentCourses}
            selected={courseFilter}
            onSelect={setCourseFilter}
          />
          {filteredMyStats.length === 0 ? (
            <p className="text-sm text-gray-400">
              {myStats.length === 0
                ? 'No attendance yet. It will appear after your teacher marks a class.'
                : 'No attendance for this course.'}
            </p>
          ) : (
            filteredMyStats.map((s) => (
              <div
                key={s.enrollmentId}
                className="rounded-xl border border-navy-100 bg-white p-5 shadow-card"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-sm font-semibold text-navy-900">
                    {s.courseTitle} · {s.batchName}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-lg bg-navy-50 px-3 py-1.5 text-navy-800">
                      Present / classes:{' '}
                      <strong>
                        {s.presentCount ?? 0}/{s.totalSessions ?? 0}
                      </strong>
                    </span>
                    <span
                      className={`rounded-lg px-3 py-1.5 font-semibold ${
                        s.belowThreshold
                          ? 'bg-red-50 text-red-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      Attendance:{' '}
                      {s.percent == null ? 'No classes yet' : `${s.percent}%`}
                      {s.belowThreshold ? ` (below ${s.threshold}%)` : ''}
                    </span>
                  </div>
                </div>

                <Table columns={['Date', 'Status']}>
                  {[...(s.records || [])]
                    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
                    .map((r) => (
                      <tr key={`${s.enrollmentId}-${r.date}-${r.code}`}>
                        <td className="py-3 text-sm text-gray-600">{r.date || '—'}</td>
                        <td className="py-3 text-sm capitalize text-gray-700">
                          {r.status || '—'}
                        </td>
                      </tr>
                    ))}
                  {(s.records || []).length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-400">
                        No class dates marked yet. Percentage will update after attendance is saved.
                      </td>
                    </tr>
                  )}
                </Table>
              </div>
            ))
          )}
        </div>
      )}

      {!isStudent && !loading && (
        <>
          <CourseFilterButtons
            courses={staffCourses}
            selected={courseFilter}
            onSelect={handleCourseFilter}
          />

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-900">Batch</label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
              >
                <option value="">Select a batch</option>
                {filteredBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} {b.course?.title ? `· ${b.course.title}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-900">Class date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={loadRoster} disabled={!batchId} className="w-full sm:w-auto">
                Load class
              </Button>
            </div>
          </div>

          {roster.length > 0 && (
            <div className="mb-8">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  {roster.length} student(s) · mark Present, Absent, or Leave
                </p>
                {canMark && (
                  <Button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save attendance'}
                  </Button>
                )}
              </div>
              <Table columns={['Student', 'Email', 'Status']}>
                {roster.map((r) => (
                  <tr key={r.studentId} className="hover:bg-navy-50/40">
                    <td className="py-3 text-sm font-medium text-navy-900">{r.name}</td>
                    <td className="py-3 text-sm text-gray-600">{r.email}</td>
                    <td className="py-3">
                      <select
                        value={marks[r.studentId] || ''}
                        disabled={!canMark}
                        onChange={(e) => setMarks((prev) => ({ ...prev, [r.studentId]: e.target.value }))}
                        className="w-full min-w-[8rem] rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none disabled:bg-gray-50"
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
              </Table>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-navy-900">
              Student attendance overview
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              {courseFilter === 'all'
                ? `All active enrollments. Below ${threshold}% is highlighted in red.`
                : `${courseFilter} only. Below ${threshold}% is highlighted in red.`}
            </p>
            <Table columns={['Student', 'Course', 'Batch', 'Present / classes', '%']}>
              {filteredAlerts.map((a) => (
                <tr key={a.enrollmentId} className="hover:bg-navy-50/40">
                  <td className="py-3 text-sm font-medium text-navy-900">{a.studentName}</td>
                  <td className="py-3 text-sm text-gray-600">{a.courseTitle}</td>
                  <td className="py-3 text-sm text-gray-600">{a.batchName}</td>
                  <td className="py-3 text-sm text-gray-600">
                    {a.presentCount}/{a.totalSessions}
                  </td>
                  <td
                    className={`py-3 text-sm font-semibold ${
                      a.belowThreshold ? 'text-red-600' : 'text-navy-700'
                    }`}
                  >
                    {a.percent == null ? 'No classes yet' : `${a.percent}%`}
                  </td>
                </tr>
              ))}
              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    {alerts.length === 0
                      ? 'No active enrollments yet.'
                      : 'No enrollments for this course.'}
                  </td>
                </tr>
              )}
            </Table>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Attendance;

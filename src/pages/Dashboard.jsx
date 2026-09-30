import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
};

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newsMsg, setNewsMsg] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const sendAiNews = async () => {
    setNewsMsg('');
    setNewsLoading(true);
    try {
      const { data } = await api.post('/ai-news/dispatch');
      setNewsMsg(data.message || 'Sent to admin for approval.');
    } catch (err) {
      setNewsMsg(err.response?.data?.message || 'Failed to start AI news digest.');
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      if (user?.role === 'student' || user?.role === 'teacher') {
        try {
          const [enrollRes, requestRes] = await Promise.all([
            api.get('/enrollments'),
            user.role === 'student' ? api.get('/enrollment-requests') : Promise.resolve({ data: { data: [] } }),
          ]);
          setMyEnrollments(enrollRes.data.data || []);
          setMyRequests(requestRes.data.data || []);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load dashboard');
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get('/dashboard/summary');
        setSummary(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [user?.role]);

  return (
    <Layout title="Dashboard">
      {user?.role === 'founder' && (
        <div className="mb-5 rounded-lg bg-navy-50 px-4 py-2.5 text-sm text-navy-600">
          You have view-only access to a full organization summary. Contact the admin for changes.
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="mb-5 rounded-xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="text-sm font-semibold text-navy-900">Weekly AI news</h3>
          <p className="mt-1 text-sm text-gray-500">
            Latest AI stories go to you first. After you approve in email, they are sent to all students.
          </p>
          <div className="mt-3">
            <Button type="button" onClick={sendAiNews} disabled={newsLoading}>
              {newsLoading ? 'Sending…' : 'Send this week’s digest for approval'}
            </Button>
          </div>
          {newsMsg && <p className="mt-2 text-sm text-navy-600">{newsMsg}</p>}
        </div>
      )}

      {loading && <p className="text-gray-500">Loading dashboard…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {(user?.role === 'student' || user?.role === 'teacher') && !loading && !error && (
        <div className="space-y-6">
          {user.role === 'student' && (
            <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
              <h3 className="mb-3 text-sm font-semibold text-navy-900">Enrollment requests</h3>
              {myRequests.length === 0 ? (
                <p className="text-sm text-gray-400">No requests yet. Apply for a course to get started.</p>
              ) : (
                <ul className="space-y-2">
                  {myRequests.map((r) => (
                    <li key={r._id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {r.course?.title} · {r.batch?.name}
                      </span>
                      <span className="capitalize text-gray-500">{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">
              {user.role === 'student' ? 'My courses' : 'My students'}
            </h3>
            {myEnrollments.length === 0 ? (
              <p className="text-sm text-gray-400">
                {user.role === 'student'
                  ? 'No classes yet. After admin approval, your course will appear here.'
                  : 'No assigned enrollments yet.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {myEnrollments.map((e) => (
                  <li key={e._id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {user.role === 'student'
                        ? `${e.course?.title} · ${e.batch?.name}`
                        : `${e.student?.user?.name} · ${e.course?.title}`}
                    </span>
                    <span className="capitalize text-gray-500">{e.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Students" value={summary.students.total} accent="navy" />
            <StatCard
              label="Active Students"
              value={summary.students.active}
              sublabel={`${summary.students.pending} pending approval`}
              accent="cyan"
            />
            <StatCard
              label="New (Last 30 Days)"
              value={summary.students.newLast30Days}
              accent="magenta"
            />
            <StatCard label="Total Teachers" value={summary.teachers.total} accent="navy" />
            <StatCard
              label="Active Courses"
              value={summary.courses.active}
              sublabel={`${summary.courses.total} total`}
              accent="cyan"
            />
            <StatCard label="Active Batches" value={summary.batches.total} accent="navy" />
            <StatCard
              label="Certified Students"
              value={summary.enrollments.completed}
              accent="cyan"
              onClick={() => setShowCompleted(true)}
            />
          </div>

          {showCompleted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto overflow-x-hidden rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-navy-900">Certified Students</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {summary.enrollments.completed}{' '}
                      {summary.enrollments.completed === 1 ? 'student' : 'students'} ·{' '}
                      {(summary.enrollments.completedList || []).length} course
                      {(summary.enrollments.completedList || []).length === 1 ? '' : 's'} completed
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => setShowCompleted(false)}>
                    Close
                  </Button>
                </div>

                <Table
                  scrollable={false}
                  columns={['Student', 'Course', 'Batch', 'Completed date']}
                >
                  {(summary.enrollments.completedList || []).map((e) => (
                    <tr key={e._id} className="hover:bg-navy-50/40">
                      <td className="break-words px-3 py-3 text-sm font-medium text-navy-900 md:px-4">
                        {e.studentName}
                        {e.studentEmail ? (
                          <div className="break-all text-xs font-normal text-gray-400">
                            {e.studentEmail}
                          </div>
                        ) : null}
                      </td>
                      <td className="break-words px-3 py-3 text-sm text-gray-600 md:px-4">
                        {e.courseTitle}
                      </td>
                      <td className="break-words px-3 py-3 text-sm text-gray-600 md:px-4">
                        {e.batchName}
                      </td>
                      <td className="break-words px-3 py-3 text-sm text-gray-600 md:px-4">
                        {formatDate(e.completedAt)}
                      </td>
                    </tr>
                  ))}
                  {(summary.enrollments.completedList || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                        No certified students yet.
                      </td>
                    </tr>
                  )}
                </Table>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-navy-100 bg-white p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-navy-900">Students by Course</h3>
            {summary.studentsByCourse.length === 0 ? (
              <p className="text-sm text-gray-400">No active enrollments yet.</p>
            ) : (
              <div className="space-y-3">
                {summary.studentsByCourse.map((c) => {
                  const capacity = c.capacity || 0;
                  const fillPct =
                    capacity > 0 ? Math.min((c.count / capacity) * 100, 100) : 0;
                  return (
                    <div key={c.courseTitle}>
                      <div className="mb-1 flex justify-between text-xs text-gray-600">
                        <span>{c.courseTitle}</span>
                        <span>
                          {c.count}/{capacity || '—'}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-navy-50">
                        <div
                          className="h-2 rounded-full bg-brand-gradient"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-navy-100 bg-white p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-navy-900">
              Low attendance (below {summary.attendance?.threshold ?? 75}%)
            </h3>
            {(summary.attendance?.alerts || []).length === 0 ? (
              <p className="text-sm text-gray-400">No students below the attendance threshold.</p>
            ) : (
              <div className="space-y-2">
                {summary.attendance.alerts.map((a) => (
                  <div key={a.enrollmentId} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-700">
                      {a.studentName} · {a.batchName}
                    </span>
                    <span className="font-semibold text-red-600">{a.percent}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-navy-100 bg-white p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-navy-900">Recent Enrollments</h3>
            {summary.recentEnrollments.length === 0 ? (
              <p className="text-sm text-gray-400">No enrollments yet.</p>
            ) : (
              <div className="space-y-2">
                {summary.recentEnrollments.map((e) => (
                  <div key={e._id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{e.student?.user?.name || 'Unknown'}</span>
                    <span className="text-gray-400">{e.course?.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;

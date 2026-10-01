import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import AdminOverview from '../components/dashboard/AdminOverview';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      {summary && !loading && <AdminOverview user={user} summary={summary} />}
    </Layout>
  );
};

export default Dashboard;

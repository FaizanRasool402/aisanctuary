import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/idCardUpload';

const statusColor = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
};

const EnrollmentRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [actingId, setActingId] = useState('');

  const canReview = user?.role === 'admin';

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? {} : { status: filter };
      const { data } = await api.get('/enrollment-requests', { params });
      setRequests(data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrollment requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const act = async (id, action) => {
    setActingId(id);
    setError('');
    try {
      await api.post(`/enrollment-requests/${id}/${action}`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActingId('');
    }
  };

  return (
    <Layout title="Enrollment requests">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Student signup requests wait here until an admin approves them.
        </p>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none sm:w-40"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading requests…</p>
      ) : (
        <Table columns={['Student', 'Email', 'Course', 'Batch', 'Identity', 'Status', canReview ? 'Actions' : '']}>
          {requests.map((r) => (
            <tr key={r._id} className="hover:bg-navy-50/40">
              <td className="px-4 py-3 text-sm font-medium text-navy-900">
                {r.student?.user?.name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.student?.user?.email}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.course?.title}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.batch?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {r.student?.identityDocType}
                {canReview &&
                  r.student?.identityDocType === 'B-Form' &&
                  (r.student?.identityDocFrontUrl || r.student?.identityDocImageUrl) && (
                    <a
                      href={mediaUrl(r.student.identityDocFrontUrl || r.student.identityDocImageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-xs font-medium text-navy-600 hover:underline"
                    >
                      View
                    </a>
                  )}
                {canReview && r.student?.identityDocType !== 'B-Form' && (r.student?.identityDocFrontUrl || r.student?.identityDocImageUrl) && (
                  <a
                    href={mediaUrl(r.student.identityDocFrontUrl || r.student.identityDocImageUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-xs font-medium text-navy-600 hover:underline"
                  >
                    Front
                  </a>
                )}
                {canReview && r.student?.identityDocType !== 'B-Form' && r.student?.identityDocBackUrl && (
                  <a
                    href={mediaUrl(r.student.identityDocBackUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-xs font-medium text-navy-600 hover:underline"
                  >
                    Back
                  </a>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    statusColor[r.status] || 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {r.status}
                </span>
              </td>
              {canReview && (
                <td className="px-4 py-3">
                  {r.status === 'pending' ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        disabled={actingId === r._id}
                        onClick={() => act(r._id, 'approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        disabled={actingId === r._id}
                        onClick={() => act(r._id, 'reject')}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                No enrollment requests.
              </td>
            </tr>
          )}
        </Table>
      )}
    </Layout>
  );
};

export default EnrollmentRequests;

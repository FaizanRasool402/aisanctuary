import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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

  const statusColor = {
    active: 'bg-green-50 text-green-700',
    completed: 'bg-navy-50 text-navy-600',
    dropped: 'bg-red-50 text-red-600',
  };

  return (
    <Layout title="Enrollments">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {enrollments.length} enrollment(s)
            {!isFounder ? ' · max 2 active per student' : ''}
          </p>
          {isFounder && (
            <p className="mt-1 text-xs text-gray-500">
              Showing enrollments from this fee cycle
              {cyclePeriod?.start && cyclePeriod?.cycleEnd
                ? ` (${new Date(cyclePeriod.start).toLocaleDateString()} – ${new Date(
                    cyclePeriod.cycleEnd
                  ).toLocaleDateString()})`
                : ' (25th to 25th)'}
              .
            </p>
          )}
        </div>
        {canEdit && <Button onClick={openCreate}>+ New Enrollment</Button>}
      </div>

      {error && !showForm && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading enrollments…</p>
      ) : (
        <Table
          columns={['Student', 'Course', 'Batch', 'Teacher', 'Duration', 'Status', canEdit ? 'Actions' : '']}
        >
          {enrollments.map((e) => (
            <tr key={e._id} className="hover:bg-navy-50/40">
              <td className="px-4 py-3 text-sm font-medium text-navy-900">{e.student?.user?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{e.course?.title}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{e.batch?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{e.teacher?.user?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{e.courseDurationWeeks} wks</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    statusColor[e.status] || 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {e.status}
                </span>
              </td>
              {canEdit && (
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openEdit(e)}
                    className="text-xs font-medium text-navy-600 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
          {enrollments.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                No enrollments found.
              </td>
            </tr>
          )}
        </Table>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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

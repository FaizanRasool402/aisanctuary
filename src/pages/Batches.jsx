import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
  }, []);

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      scheduleDays: f.scheduleDays.includes(day)
        ? f.scheduleDays.filter((d) => d !== day)
        : [...f.scheduleDays, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/batches', form);
      setShowForm(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Batches">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">{batches.length} batch(es) · max 20 students each</p>
        {canEdit && <Button onClick={() => setShowForm(true)}>+ Add Batch</Button>}
      </div>

      {error && !showForm && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading batches…</p>
      ) : (
        <Table columns={['Batch', 'Course', 'Teacher', 'Schedule', 'Capacity']}>
          {batches.map((b) => (
            <tr key={b._id} className="hover:bg-navy-50/40">
              <td className="px-4 py-3 text-sm font-medium text-navy-900">{b.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{b.course?.title}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{b.teacher?.user?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {b.scheduleDays?.join(', ')} · {b.scheduleStartTime}–{b.scheduleEndTime}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {b.enrolledCount}/{b.capacity}
              </td>
            </tr>
          ))}
          {batches.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                No batches found.
              </td>
            </tr>
          )}
        </Table>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">Add Batch</h2>

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
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                        form.scheduleDays.includes(day)
                          ? 'bg-navy-500 text-white border-navy-500'
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
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Add Batch'}
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

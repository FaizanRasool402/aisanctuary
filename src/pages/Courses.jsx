import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
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

  return (
    <Layout title="Courses">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">{courses.length} course(s)</p>
        {canEdit && <Button onClick={openCreate}>+ Add Course</Button>}
      </div>

      {error && !showForm && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading courses…</p>
      ) : (
        <Table columns={['Title', 'Description', 'Default Duration', 'Status', canEdit ? 'Actions' : '']}>
          {courses.map((c) => (
            <tr key={c._id} className="hover:bg-navy-50/40">
              <td className="px-4 py-3 text-sm font-medium text-navy-900">{c.title}</td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">{c.description}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{c.defaultDurationWeeks} weeks</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              {canEdit && (
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="text-xs font-medium text-navy-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(c._id)}
                      className="text-xs font-medium text-navy-600 hover:underline"
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {courses.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                No courses found.
              </td>
            </tr>
          )}
        </Table>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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

import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', phone: '', password: '', expertise: '' };

const Teachers = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === 'admin';

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (teacher) => {
    setEditingId(teacher._id);
    setForm({
      name: teacher.user?.name || '',
      email: teacher.user?.email || '',
      phone: teacher.user?.phone || '',
      password: '',
      expertise: (teacher.expertise || []).join(', '),
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
      const expertiseArray = form.expertise
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingId) {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          expertise: expertiseArray,
        };
        if (form.password.trim()) payload.password = form.password;
        await api.put(`/teachers/${editingId}`, payload);
      } else {
        await api.post('/teachers', { ...form, expertise: expertiseArray });
      }
      closeForm();
      fetchTeachers();
    } catch (err) {
      setError(
        err.response?.data?.message || (editingId ? 'Failed to update teacher' : 'Failed to create teacher')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (teacher) => {
    try {
      await api.put(`/teachers/${teacher._id}`, { isActive: !teacher.isActive });
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update teacher status');
    }
  };

  return (
    <Layout title="Teachers">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">{teachers.length} teacher(s)</p>
        {canEdit && <Button onClick={openCreate}>+ Add Teacher</Button>}
      </div>

      {error && !showForm && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading teachers…</p>
      ) : (
        <Table columns={['Name', 'Email', 'Phone', 'Expertise', 'Status', canEdit ? 'Actions' : '']}>
          {teachers.map((t) => (
            <tr key={t._id} className="hover:bg-navy-50/40">
              <td className="px-4 py-3 text-sm font-medium text-navy-900">{t.user?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{t.user?.email}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{t.user?.phone}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                <div className="flex flex-wrap gap-1">
                  {t.expertise?.map((ex) => (
                    <span key={ex} className="rounded-full bg-navy-50 px-2 py-0.5 text-xs text-navy-600">
                      {ex}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    t.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              {canEdit && (
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="text-xs font-medium text-navy-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(t)}
                      className="text-xs font-medium text-navy-600 hover:underline"
                    >
                      {t.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {teachers.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                No teachers found.
              </td>
            </tr>
          )}
        </Table>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              {editingId ? 'Edit Teacher' : 'Add Teacher'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
              />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
              <PasswordInput
                label={editingId ? 'New password (optional)' : 'Temporary Password'}
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                required={!editingId}
                autoComplete="new-password"
              />
              <Field
                label="Expertise (comma-separated, e.g. MERN Stack Developer, Python)"
                value={form.expertise}
                onChange={(v) => setForm({ ...form, expertise: v })}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add Teacher'}
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

export default Teachers;

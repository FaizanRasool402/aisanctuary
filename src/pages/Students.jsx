import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ID_IMAGE_ACCEPT, validateIdImages } from '../utils/idCardUpload';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: '',
  identityDocType: 'CNIC',
  guardianName: '',
  guardianContact: '',
};

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const canEdit = user?.role === 'admin';

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/students', { params: search ? { search } : {} });
      setStudents(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (student) => {
    const name = student.user?.name || 'this student';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    setDeletingId(student._id);
    setError('');
    try {
      await api.delete(`/students/${student._id}`);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeletingId('');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const idError = validateIdImages(frontFile, backFile, form.identityDocType);
    if (idError) {
      setError(idError);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      fd.append('identityDocFront', frontFile);
      if (form.identityDocType === 'CNIC') {
        fd.append('identityDocBack', backFile);
      }

      await api.post('/students', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      setShowForm(false);
      setForm(emptyForm);
      setFrontFile(null);
      setBackFile(null);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register student');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = {
    pending: 'bg-yellow-50 text-yellow-700',
    active: 'bg-green-50 text-green-700',
    completed: 'bg-navy-50 text-navy-600',
    inactive: 'bg-gray-100 text-gray-500',
  };

  return (
    <Layout title="Students">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none sm:w-64"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        {canEdit && (
          <Button onClick={() => setShowForm(true)}>+ Register Student</Button>
        )}
      </div>

      {error && !showForm && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading students…</p>
      ) : (
        <Table columns={['Name', 'Email', 'Phone', 'Identity Doc', 'Status', canEdit ? 'Actions' : '']}>
          {students.map((s) => (
            <tr key={s._id} className="hover:bg-navy-50/40">
              <td className="px-4 py-3 text-sm font-medium text-navy-900">{s.user?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{s.user?.email}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{s.user?.phone}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{s.identityDocType}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    statusColor[s.enrollmentStatus] || 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s.enrollmentStatus}
                </span>
              </td>
              {canEdit && (
                <td className="px-4 py-3">
                  <Button
                    variant="danger"
                    disabled={deletingId === s._id}
                    onClick={() => handleDelete(s)}
                  >
                    {deletingId === s._id ? 'Deleting…' : 'Delete'}
                  </Button>
                </td>
              )}
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-sm text-gray-400">
                No students found.
              </td>
            </tr>
          )}
        </Table>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">Register New Student</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
              <Field
                label="Temporary Password"
                type="password"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                required
              />
              <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">Identity Document</label>
                <select
                  value={form.identityDocType}
                  onChange={(e) => {
                    setForm({ ...form, identityDocType: e.target.value });
                    if (e.target.value === 'B-Form') setBackFile(null);
                  }}
                  className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
                >
                  <option value="CNIC">CNIC</option>
                  <option value="B-Form">B-Form (no CNIC)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  {form.identityDocType === 'B-Form' ? 'B-Form photo' : 'CNIC front photo'}
                </label>
                <input
                  type="file"
                  accept={ID_IMAGE_ACCEPT}
                  onChange={(e) => setFrontFile(e.target.files[0] || null)}
                  className="w-full text-sm"
                  required
                />
              </div>

              {form.identityDocType === 'CNIC' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">
                    CNIC back photo
                  </label>
                  <input
                    type="file"
                    accept={ID_IMAGE_ACCEPT}
                    onChange={(e) => setBackFile(e.target.files[0] || null)}
                    className="w-full text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a clear photo of the front and back of the same CNIC. Other pictures will be rejected.
                  </p>
                </div>
              )}

              {form.identityDocType === 'B-Form' && (
                <p className="text-xs text-gray-500">
                  B-Form has only one side. Upload a clear photo of the B-Form. Other pictures will be rejected.
                </p>
              )}

              {form.identityDocType === 'B-Form' && (
                <>
                  <Field
                    label="Guardian Name"
                    value={form.guardianName}
                    onChange={(v) => setForm({ ...form, guardianName: v })}
                    required
                  />
                  <Field
                    label="Guardian Contact"
                    value={form.guardianContact}
                    onChange={(v) => setForm({ ...form, guardianContact: v })}
                    required
                  />
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? form.identityDocType === 'B-Form'
                      ? 'Checking B-Form photo…'
                      : 'Checking CNIC photos…'
                    : 'Register Student'}
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

export default Students;

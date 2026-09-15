import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ID_IMAGE_ACCEPT, validateIdImages } from '../utils/idCardUpload';

const emptyForm = {
  address: '',
  identityDocType: 'CNIC',
  guardianName: '',
  guardianContact: '',
  course: '',
  batch: '',
};

const ApplyEnrollment = () => {
  const { refreshStudentProfile, user } = useAuth();
  const navigate = useNavigate();
  const [hasProfile, setHasProfile] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesRes, batchesRes] = await Promise.all([
          api.get('/courses', { params: { activeOnly: true } }),
          api.get('/batches'),
        ]);
        setCourses(coursesRes.data.data);
        setBatches((batchesRes.data.data || []).filter((b) => b.isActive !== false));
        try {
          await api.get('/students/me');
          setHasProfile(true);
        } catch {
          setHasProfile(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const batchesForCourse = batches.filter(
    (b) => String(b.course?._id || b.course) === form.course
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasProfile) {
      const idError = validateIdImages(frontFile, backFile, form.identityDocType);
      if (idError) {
        setError(idError);
        return;
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('course', form.course);
      fd.append('batch', form.batch);
      if (!hasProfile) {
        fd.append('address', form.address);
        fd.append('identityDocType', form.identityDocType);
        if (form.identityDocType === 'B-Form') {
          fd.append('guardianName', form.guardianName);
          fd.append('guardianContact', form.guardianContact);
        }
        fd.append('identityDocFront', frontFile);
        if (form.identityDocType === 'CNIC') {
          fd.append('identityDocBack', backFile);
        }
      }

      await api.post('/enrollment-requests', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      await refreshStudentProfile(user?.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit enrollment request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Enrollment form">
      <p className="mb-5 text-sm text-gray-500">
        Choose a course and batch. An admin will review your request before you are enrolled.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading form…</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-lg space-y-3 rounded-xl border border-navy-100 bg-white p-4 shadow-card sm:p-6"
        >
          {!hasProfile && (
            <>
              <Field
                label="Address"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
                required
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">Identity document</label>
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
                    Upload a clear photo of the front and back of the CNIC.
                  </p>
                </div>
              )}

              {form.identityDocType === 'B-Form' && (
                <p className="text-xs text-gray-500">
                  B-Form has only one side. Upload a clear photo of the B-Form.
                </p>
              )}

              {form.identityDocType === 'B-Form' && (
                <>
                  <Field
                    label="Guardian name"
                    value={form.guardianName}
                    onChange={(v) => setForm({ ...form, guardianName: v })}
                    required
                  />
                  <Field
                    label="Guardian contact"
                    value={form.guardianContact}
                    onChange={(v) => setForm({ ...form, guardianContact: v })}
                    required
                  />
                </>
              )}
            </>
          )}

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
                <option key={b._id} value={b._id} disabled={b.spotsLeft <= 0}>
                  {b.name} ({b.enrolledCount}/{b.capacity} filled)
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting
              ? !hasProfile
                ? 'Uploading…'
                : 'Submitting…'
              : 'Submit enrollment request'}
          </Button>
        </form>
      )}
    </Layout>
  );
};

const Field = ({ label, value, onChange, required }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-navy-900">{label}</label>
    <input
      type="text"
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
    />
  </div>
);

export default ApplyEnrollment;

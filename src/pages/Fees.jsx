import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const money = (n) =>
  `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

const defaultCycleEnd = () => {
  const now = new Date();
  const end =
    now.getDate() <= 25
      ? new Date(now.getFullYear(), now.getMonth(), 25)
      : new Date(now.getFullYear(), now.getMonth() + 1, 25);
  return end.toISOString().slice(0, 10);
};

const Fees = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pending, setPending] = useState([]);
  const [summary, setSummary] = useState(null);
  const [periodEnd, setPeriodEnd] = useState(defaultCycleEnd());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [planForm, setPlanForm] = useState({ enrollment: '', monthlyFeeAmount: '' });
  const [payForm, setPayForm] = useState({
    enrollment: '',
    amount: '',
    paidDate: new Date().toISOString().slice(0, 10),
    method: 'cash',
    note: '',
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingPay, setSavingPay] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const requests = [
        api.get('/fees'),
        api.get('/fees/pending', { params: { periodEnd } }),
      ];
      if (!isStudent) {
        requests.push(api.get('/enrollments'), api.get('/fees/summary', { params: { periodEnd } }));
      }
      const results = await Promise.all(requests);
      setPayments(results[0].data.data || []);
      setPending(results[1].data.data || []);
      if (!isStudent) {
        setEnrollments(results[2].data.data || []);
        setSummary(results[3].data.data);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodEnd, isStudent]);

  const handleSetPlan = async (e) => {
    e.preventDefault();
    setSavingPlan(true);
    setError('');
    try {
      await api.put(`/fees/plans/${planForm.enrollment}`, {
        monthlyFeeAmount: Number(planForm.monthlyFeeAmount),
      });
      setPlanForm({ enrollment: '', monthlyFeeAmount: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save fee plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSavingPay(true);
    setError('');
    try {
      await api.post('/fees', payForm);
      setPayForm({
        enrollment: '',
        amount: '',
        paidDate: new Date().toISOString().slice(0, 10),
        method: 'cash',
        note: '',
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSavingPay(false);
    }
  };

  const enrollmentLabel = (e) =>
    `${e.student?.user?.name || 'Student'} — ${e.course?.title || 'Course'}`;

  return (
    <Layout title="Fees">
      <p className="mb-5 text-sm text-gray-500">
        Cycle is 25th to 25th. Split on received amount: teacher 50%, manager 10%, institute 40%.
        Pending means the full monthly fee has not been received in this cycle.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {!isStudent && (
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-900">Cycle ending (25th)</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none sm:w-auto"
            />
          </div>
        </div>
      )}

      {loading && <p className="text-gray-500">Loading fees…</p>}

      {!loading && summary && (
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">
            Monthly summary · {formatDate(summary.period?.start)} – {formatDate(summary.period?.cycleEnd)}
          </h3>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryChip label="Total received" value={money(summary.totalCollected)} />
            <SummaryChip label="Teacher 50%" value={money(summary.teacherShare)} />
            <SummaryChip label="Manager 10%" value={money(summary.managerShare)} />
            <SummaryChip label="Institute 40%" value={money(summary.instituteShare)} />
          </div>
          <Table columns={['Course', 'Teacher', 'Payments', 'Collected', 'Teacher', 'Manager', 'Institute']}>
            {(summary.byCourse || []).map((row) => (
              <tr key={row.courseId} className="hover:bg-navy-50/40">
                <td className="px-4 py-3 text-sm font-medium text-navy-900">{row.courseTitle}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.teacherName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.paymentCount}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{money(row.collected)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{money(row.teacherShare)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{money(row.managerShare)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{money(row.instituteShare)}</td>
              </tr>
            ))}
            {(summary.byCourse || []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  No payments in this cycle.
                </td>
              </tr>
            )}
          </Table>
        </div>
      )}

      {canEdit && (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSetPlan}
            className="space-y-3 rounded-xl border border-navy-100 bg-white p-5 shadow-card"
          >
            <h3 className="text-sm font-semibold text-navy-900">Set student monthly fee</h3>
            <p className="text-xs text-gray-500">Amount 0 means this student has no fee.</p>
            <SelectEnrollment
              enrollments={enrollments}
              value={planForm.enrollment}
              onChange={(v) => {
                const selected = enrollments.find((e) => e._id === v);
                setPlanForm({
                  enrollment: v,
                  monthlyFeeAmount:
                    selected?.monthlyFeeAmount != null ? String(selected.monthlyFeeAmount) : '',
                });
              }}
              label={enrollmentLabel}
            />
            <Field
              label="Monthly fee amount (Rs)"
              type="number"
              min="0"
              value={planForm.monthlyFeeAmount}
              onChange={(v) => setPlanForm({ ...planForm, monthlyFeeAmount: v })}
              required
            />
            <Button type="submit" disabled={savingPlan}>
              {savingPlan ? 'Saving…' : 'Save fee'}
            </Button>
          </form>

          <form
            onSubmit={handlePayment}
            className="space-y-3 rounded-xl border border-navy-100 bg-white p-5 shadow-card"
          >
            <h3 className="text-sm font-semibold text-navy-900">Add payment</h3>
            <p className="text-xs text-gray-500">Cash or bank — admin records what was received.</p>
            <SelectEnrollment
              enrollments={enrollments.filter((e) => Number(e.monthlyFeeAmount) > 0)}
              value={payForm.enrollment}
              onChange={(v) => setPayForm({ ...payForm, enrollment: v })}
              label={enrollmentLabel}
            />
            <Field
              label="Amount received (Rs)"
              type="number"
              min="1"
              value={payForm.amount}
              onChange={(v) => setPayForm({ ...payForm, amount: v })}
              required
            />
            <Field
              label="Date"
              type="date"
              value={payForm.paidDate}
              onChange={(v) => setPayForm({ ...payForm, paidDate: v })}
              required
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-900">Received via</label>
              <select
                value={payForm.method}
                onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank / account</option>
              </select>
            </div>
            <Field
              label="Note (optional)"
              value={payForm.note}
              onChange={(v) => setPayForm({ ...payForm, note: v })}
            />
            <Button type="submit" disabled={savingPay}>
              {savingPay ? 'Saving…' : 'Record payment'}
            </Button>
          </form>
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-navy-900">
          Pending this cycle (full fee not received)
        </h3>
        <Table columns={['Student', 'Course', 'Monthly fee']}>
          {pending.map((e) => (
            <tr key={e._id} className="hover:bg-navy-50/40">
              <td className="px-4 py-3 text-sm font-medium text-navy-900">{e.student?.user?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{e.course?.title}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{money(e.monthlyFeeAmount)}</td>
            </tr>
          ))}
          {pending.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                No pending full fees in this cycle.
              </td>
            </tr>
          )}
        </Table>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy-900">Payment record</h3>
        <Table columns={['Date', 'Student', 'Course', 'Amount', 'Method', 'Note']}>
          {payments.map((p) => (
            <tr key={p._id} className="hover:bg-navy-50/40">
              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.paidDate)}</td>
              <td className="px-4 py-3 text-sm font-medium text-navy-900">{p.student?.user?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.enrollment?.course?.title}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{money(p.amount)}</td>
              <td className="px-4 py-3 text-sm capitalize text-gray-600">{p.method}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.note || '—'}</td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                No payments recorded yet.
              </td>
            </tr>
          )}
        </Table>
      </div>
    </Layout>
  );
};

const SummaryChip = ({ label, value }) => (
  <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-navy-900">{value}</p>
  </div>
);

const SelectEnrollment = ({ enrollments, value, onChange, label }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-navy-900">Student / course</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
    >
      <option value="">Select enrollment</option>
      {enrollments.map((e) => (
        <option key={e._id} value={e._id}>
          {label(e)}
          {Number(e.monthlyFeeAmount) > 0 ? ` (Rs ${e.monthlyFeeAmount})` : ''}
        </option>
      ))}
    </select>
  </div>
);

const Field = ({ label, value, onChange, type = 'text', required, min }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-navy-900">{label}</label>
    <input
      type={type}
      value={value}
      required={required}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
    />
  </div>
);

export default Fees;

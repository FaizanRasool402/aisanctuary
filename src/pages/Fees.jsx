import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  BookIcon,
  BuildingIcon,
  CalendarIcon,
  CardIcon,
  EditIcon,
  GraduationIcon,
  PlusIcon,
  SaveIcon,
  SettingsIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from '../components/ui/icons';
import {
  DataTable,
  EmptyState,
  ExportMenu,
  FilterSelect,
  IconButton,
  IconTile,
  PageHeader,
  Pagination,
  Panel,
  ResetButton,
  SearchInput,
  StatusBadge,
  TableMessage,
  Toolbar,
  courseIconFor,
  downloadCsv,
  tones,
  uniqueOptions,
  usePagination,
} from '../components/ui/kit';

const money = (n) => {
  const value = Math.round(Number(n) || 0);
  return `Rs ${value.toLocaleString('en-PK')}`;
};

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
    feeType: 'course',
    note: '',
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [deletingPayId, setDeletingPayId] = useState('');

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
      const amount = Math.round(Number(String(planForm.monthlyFeeAmount).replace(/,/g, '')));
      await api.put(`/fees/plans/${planForm.enrollment}`, {
        monthlyFeeAmount: amount,
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
      const amount = Math.round(Number(String(payForm.amount).replace(/,/g, '')));
      await api.post('/fees', { ...payForm, amount });
      setPayForm({
        enrollment: '',
        amount: '',
        paidDate: new Date().toISOString().slice(0, 10),
        method: 'cash',
        feeType: 'course',
        note: '',
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSavingPay(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Delete payment of ${money(payment.amount)}?`)) return;
    setDeletingPayId(payment._id);
    setError('');
    try {
      await api.delete(`/fees/${payment._id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment');
    } finally {
      setDeletingPayId('');
    }
  };

  const handleFixPaymentAmount = async (payment) => {
    const next = window.prompt('Enter exact amount (e.g. 1500)', String(payment.amount));
    if (next == null) return;
    const amount = Math.round(Number(String(next).replace(/,/g, '')));
    if (!Number.isFinite(amount) || amount < 1) {
      setError('Enter a valid whole amount like 1500');
      return;
    }
    setError('');
    try {
      await api.put(`/fees/${payment._id}`, { amount });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment');
    }
  };

  const enrollmentLabel = (e) =>
    `${e.student?.user?.name || 'Student'} — ${e.course?.title || 'Course'}`;

  const paymentEnrollments =
    payForm.feeType === 'admission'
      ? enrollments
      : enrollments.filter((e) => Number(e.monthlyFeeAmount) > 0);

  const onSelectPayEnrollment = (v) => {
    const selected = enrollments.find((e) => e._id === v);
    const next = { ...payForm, enrollment: v };
    if (payForm.feeType === 'course' && selected?.monthlyFeeAmount != null) {
      next.amount = String(Math.round(Number(selected.monthlyFeeAmount)));
    }
    setPayForm(next);
  };

  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [paySearch, setPaySearch] = useState('');
  const [payTypeFilter, setPayTypeFilter] = useState('all');

  const byCourse = summary?.byCourse || [];
  const courseOptions = useMemo(() => uniqueOptions(byCourse.map((r) => r.courseTitle)), [byCourse]);
  const teacherOptions = useMemo(() => uniqueOptions(byCourse.map((r) => r.teacherName)), [byCourse]);

  const filteredByCourse = useMemo(() => {
    const term = courseSearch.trim().toLowerCase();
    return byCourse.filter((r) => {
      if (courseFilter !== 'all' && r.courseTitle !== courseFilter) return false;
      if (teacherFilter !== 'all' && r.teacherName !== teacherFilter) return false;
      if (!term) return true;
      return `${r.courseTitle} ${r.teacherName}`.toLowerCase().includes(term);
    });
  }, [byCourse, courseSearch, courseFilter, teacherFilter]);

  const filteredPayments = useMemo(() => {
    const term = paySearch.trim().toLowerCase();
    return payments.filter((p) => {
      if (payTypeFilter !== 'all' && (p.feeType === 'admission' ? 'admission' : 'course') !== payTypeFilter) return false;
      if (!term) return true;
      return [p.student?.user?.name, p.enrollment?.course?.title, p.note, p.method]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [payments, paySearch, payTypeFilter]);

  const payPager = usePagination(filteredPayments, 10);
  const pendingPager = usePagination(pending, 10);

  const exportByCourse = () =>
    downloadCsv(
      'fees-by-course',
      ['Course', 'Teacher', 'Payments', 'Collected', 'Teacher 50%', 'Manager 10%', 'Institute 40%'],
      filteredByCourse.map((r) => [
        r.courseTitle,
        r.teacherName,
        r.paymentCount,
        Math.round(r.collected || 0),
        Math.round(r.teacherShare || 0),
        Math.round(r.managerShare || 0),
        Math.round(r.instituteShare || 0),
      ])
    );

  const exportPayments = (rows, suffix) =>
    downloadCsv(
      `payments-${suffix}`,
      ['Date', 'Student', 'Course', 'Type', 'Amount', 'Method', 'Note'],
      rows.map((p) => [
        formatDate(p.paidDate),
        p.student?.user?.name,
        p.enrollment?.course?.title,
        p.feeType === 'admission' ? 'Admission' : 'Course',
        Math.round(p.amount || 0),
        p.method,
        p.note,
      ])
    );

  const exportPending = () =>
    downloadCsv(
      'pending-fees',
      ['Student', 'Course', 'Monthly fee'],
      pending.map((e) => [e.student?.user?.name, e.course?.title, Math.round(e.monthlyFeeAmount || 0)])
    );

  return (
    <Layout title={isStudent ? 'My Fees' : 'Fees'}>
      <div className="space-y-5">
        <PageHeader
          title={isStudent ? 'My Fees' : 'Fees'}
          subtitle={
            isStudent
              ? 'Your monthly course fee and payment history. Cycle is 25th to 25th.'
              : 'Manage course fees, track payments and view collection summaries. Cycle is 25th to 25th; course fee split teacher 50%, manager 10%, institute 40%; admission fee goes 100% to the institute.'
          }
          actions={
            !isStudent && (
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-card">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <span>
                  <span className="block text-xs font-medium text-slate-500">Cycle ending (25th)</span>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="border-0 bg-transparent p-0 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-0"
                  />
                </span>
              </label>
            )
          }
        />

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        {loading && <p className="text-slate-500">Loading fees…</p>}

        {!loading && summary && (
          <>
            <h3 className="text-base font-semibold text-navy-900">
              Monthly summary · {formatDate(summary.period?.start)} – {formatDate(summary.period?.cycleEnd)}
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
              <MoneyTile
                icon={GraduationIcon}
                tone="purple"
                label="Admission fees (institute)"
                value={money(summary.instituteAdmissionFee ?? summary.admissionFeeCollected)}
                hint="Full admission amount collected this cycle"
                badge="100%"
              />
              <MoneyTile
                icon={BookIcon}
                tone="blue"
                label="Course fee to institute (40%)"
                value={money(summary.instituteCourseFee ?? summary.instituteShare)}
                hint="Institute share from course fees"
              />
              <MoneyTile icon={WalletIcon} tone="green" label="Course fees collected" value={money(summary.courseFeeCollected)} hint="This cycle" />
              <MoneyTile icon={UserIcon} tone="red" label="Teacher 50%" value={money(summary.teacherShare)} hint="Teacher share this cycle" />
              <MoneyTile icon={UsersIcon} tone="orange" label="Manager 10%" value={money(summary.managerShare)} hint="Manager share this cycle" />
              <MoneyTile icon={BuildingIcon} tone="purple" label="Institute 40%" value={money(summary.instituteShare)} hint="Institute share this cycle" />
            </div>

            <Panel>
              <Toolbar>
                <SearchInput value={courseSearch} onChange={setCourseSearch} placeholder="Search by course or teacher…" className="xl:flex-1" />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:items-end">
                  <FilterSelect value={courseFilter} onChange={setCourseFilter} allLabel="All Courses" options={courseOptions} className="xl:w-44" />
                  <FilterSelect value={teacherFilter} onChange={setTeacherFilter} allLabel="All Teachers" options={teacherOptions} className="xl:w-44" />
                </div>
                <div className="flex gap-2 self-end">
                  <ResetButton
                    onClick={() => {
                      setCourseSearch('');
                      setCourseFilter('all');
                      setTeacherFilter('all');
                    }}
                  />
                  <ExportMenu options={[{ label: `By course (${filteredByCourse.length}) · CSV`, onSelect: exportByCourse }]} />
                </div>
              </Toolbar>
              <DataTable columns={['#', 'Course', 'Teacher', 'Payments', 'Collected (Rs)', 'Teacher (50%)', 'Manager (10%)', 'Institute (40%)']}>
                {filteredByCourse.map((row, i) => (
                  <tr key={`${row.courseId}-${row.teacherName}`} className="hover:bg-slate-50/60">
                    <td className="py-3 pl-4 pr-3 text-slate-500">{i + 1}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <IconTile icon={courseIconFor(row.courseTitle)} seed={row.courseTitle} />
                        <span className="font-semibold text-navy-900">{row.courseTitle}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{row.teacherName}</td>
                    <td className="py-3 pr-3 text-slate-600">{row.paymentCount}</td>
                    <td className="py-3 pr-3 font-semibold text-navy-900">{money(row.collected)}</td>
                    <td className="py-3 pr-3 text-slate-600">{money(row.teacherShare)}</td>
                    <td className="py-3 pr-3 text-slate-600">{money(row.managerShare)}</td>
                    <td className="py-3 pr-4 text-slate-600">{money(row.instituteShare)}</td>
                  </tr>
                ))}
              </DataTable>
              {filteredByCourse.length === 0 && (
                <EmptyState
                  variant="money"
                  title={byCourse.length === 0 ? 'No course fee payments in this cycle.' : 'No matching courses.'}
                  text={byCourse.length === 0 ? 'Payments will appear here as you record them.' : 'Try a different search or clear the filters.'}
                />
              )}
            </Panel>
          </>
        )}

        {canEdit && (
          <div className="grid gap-5 lg:grid-cols-2">
            <form onSubmit={handleSetPlan} className="rounded-2xl border border-slate-100 bg-white shadow-card">
              <FormHeader
                icon={SettingsIcon}
                tone="blue"
                title="Set student monthly course fee"
                text="Amount 0 means this student has no monthly course fee."
              />
              <div className="space-y-4 p-5">
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
                  label="Monthly course fee (Rs)"
                  type="number"
                  min="0"
                  suffix="Rs"
                  placeholder="Enter amount"
                  value={planForm.monthlyFeeAmount}
                  onChange={(v) => setPlanForm({ ...planForm, monthlyFeeAmount: v })}
                  required
                />
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <SaveIcon className="h-4 w-4" />
                  {savingPlan ? 'Saving…' : 'Save fee'}
                </button>
              </div>
            </form>

            <form onSubmit={handlePayment} className="rounded-2xl border border-slate-100 bg-white shadow-card">
              <FormHeader
                icon={PlusIcon}
                tone="green"
                title="Add payment"
                text="Course fee is split 50/10/40. Admission fee goes fully to the institute."
              />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Fee type</FieldLabel>
                  <select
                    value={payForm.feeType}
                    onChange={(e) => setPayForm({ ...payForm, feeType: e.target.value, enrollment: '' })}
                    className={inputCls}
                  >
                    <option value="course">Course fee (monthly)</option>
                    <option value="admission">Admission fee</option>
                  </select>
                </div>
                <Field
                  label="Date"
                  type="date"
                  value={payForm.paidDate}
                  onChange={(v) => setPayForm({ ...payForm, paidDate: v })}
                  required
                />
                <SelectEnrollment
                  enrollments={paymentEnrollments}
                  value={payForm.enrollment}
                  onChange={onSelectPayEnrollment}
                  label={enrollmentLabel}
                />
                <div>
                  <FieldLabel>Received via</FieldLabel>
                  <select
                    value={payForm.method}
                    onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                    className={inputCls}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank / account</option>
                  </select>
                </div>
                <Field
                  label="Amount received (Rs)"
                  type="number"
                  min="1"
                  suffix="Rs"
                  placeholder="Enter amount"
                  value={payForm.amount}
                  onChange={(v) => setPayForm({ ...payForm, amount: v })}
                  required
                />
                <Field
                  label="Note (optional)"
                  placeholder="Add a note…"
                  value={payForm.note}
                  onChange={(v) => setPayForm({ ...payForm, note: v })}
                />
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={savingPay}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CardIcon className="h-4 w-4" />
                    {savingPay ? 'Saving…' : 'Record payment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <Panel>
          <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-navy-900">Pending this cycle</h3>
              <p className="text-xs text-slate-500">Monthly course fee not received yet.</p>
            </div>
            <ExportMenu options={[{ label: `Pending (${pending.length}) · CSV`, onSelect: exportPending, disabled: pending.length === 0 }]} />
          </div>
          <DataTable columns={['#', 'Student', 'Course', 'Monthly fee', 'Status']}>
            {pendingPager.pageRows.map((e, i) => (
              <tr key={e._id} className="hover:bg-slate-50/60">
                <td className="py-3 pl-4 pr-3 text-slate-500">{pendingPager.offset + i + 1}</td>
                <td className="py-3 pr-3 font-semibold text-navy-900">{e.student?.user?.name}</td>
                <td className="py-3 pr-3 text-slate-600">{e.course?.title}</td>
                <td className="py-3 pr-3 text-slate-600">{money(e.monthlyFeeAmount)}</td>
                <td className="py-3 pr-4">
                  <StatusBadge tone="amber">Pending</StatusBadge>
                </td>
              </tr>
            ))}
            {pending.length === 0 && <TableMessage colSpan={5}>No pending course fees in this cycle.</TableMessage>}
          </DataTable>
          {pending.length > 10 && <Pagination pager={pendingPager} noun="pending fees" />}
        </Panel>

        <Panel>
          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
            <div className="lg:mr-auto">
              <h3 className="text-base font-semibold text-navy-900">Payment record</h3>
              <p className="text-xs text-slate-500">Every payment recorded, newest first.</p>
            </div>
            <SearchInput value={paySearch} onChange={setPaySearch} placeholder="Search by student, course, or note…" className="lg:w-72" />
            <FilterSelect
              value={payTypeFilter}
              onChange={setPayTypeFilter}
              allLabel="All Types"
              options={[
                { value: 'course', label: 'Course' },
                { value: 'admission', label: 'Admission' },
              ]}
              className="xl:w-36"
            />
            <ExportMenu
              options={[
                { label: `Current view (${filteredPayments.length}) · CSV`, onSelect: () => exportPayments(filteredPayments, 'filtered') },
                { label: `All payments (${payments.length}) · CSV`, onSelect: () => exportPayments(payments, 'all') },
              ]}
            />
          </div>
          <DataTable columns={['Date', 'Student', 'Course', 'Type', 'Amount', 'Method', 'Note', canEdit ? 'Actions' : '']}>
            {payPager.pageRows.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50/60">
                <td className="py-3 pl-4 pr-3 text-slate-600">{formatDate(p.paidDate)}</td>
                <td className="py-3 pr-3 font-semibold text-navy-900">{p.student?.user?.name}</td>
                <td className="py-3 pr-3 text-slate-600">{p.enrollment?.course?.title}</td>
                <td className="py-3 pr-3">
                  <StatusBadge tone={p.feeType === 'admission' ? 'blue' : 'green'} dot={false}>
                    {p.feeType === 'admission' ? 'Admission' : 'Course'}
                  </StatusBadge>
                </td>
                <td className="py-3 pr-3 font-semibold text-navy-900">{money(p.amount)}</td>
                <td className="py-3 pr-3 capitalize text-slate-600">{p.method}</td>
                <td className="max-w-[14rem] truncate py-3 pr-3 text-slate-600" title={p.note || undefined}>
                  {p.note || '—'}
                </td>
                <td className="py-3 pr-4">
                  {canEdit && (
                    <div className="flex gap-2">
                      <IconButton label="Edit amount" icon={EditIcon} onClick={() => handleFixPaymentAmount(p)} />
                      <IconButton
                        label="Delete payment"
                        icon={TrashIcon}
                        tone="danger"
                        disabled={deletingPayId === p._id}
                        onClick={() => handleDeletePayment(p)}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <TableMessage colSpan={8}>
                {payments.length === 0 ? 'No payments recorded yet.' : 'No matching payments.'}
              </TableMessage>
            )}
          </DataTable>
          <Pagination pager={payPager} noun="payments" />
        </Panel>
      </div>
    </Layout>
  );
};

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-sm font-medium text-navy-900">{children}</label>
);

const MoneyTile = ({ icon: Icon, tone, label, value, hint, badge }) => (
  <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-card sm:flex-row sm:items-start sm:gap-3 sm:p-4">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${tones[tone]}`}>
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-lg font-bold text-navy-900 sm:text-xl">{value}</span>
        {badge && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">{badge}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  </div>
);

const FormHeader = ({ icon: Icon, tone, title, text }) => (
  <div
    className={`flex items-start gap-3 rounded-t-2xl border-b border-slate-100 p-5 ${
      tone === 'green' ? 'bg-emerald-50/40' : 'bg-blue-50/40'
    }`}
  >
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{text}</p>
    </div>
  </div>
);

const SelectEnrollment = ({ enrollments, value, onChange, label }) => (
  <div>
    <FieldLabel>Student / course</FieldLabel>
    <select value={value} onChange={(e) => onChange(e.target.value)} required className={inputCls}>
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

const Field = ({ label, value, onChange, type = 'text', required, min, suffix, placeholder }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <div className="flex">
      <input
        type={type}
        value={value}
        required={required}
        min={min}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} ${suffix ? 'rounded-r-none' : ''}`}
      />
      {suffix && (
        <span className="flex items-center rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export default Fees;

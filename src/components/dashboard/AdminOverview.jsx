import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../api/axios';
import Button from '../ui/Button';
import Table from '../ui/Table';
import TrendPill from '../ui/TrendPill';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
};

const timeAgo = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString();
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ---------- Icons ---------- */

const Icon = ({ children, className = 'h-5 w-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const icons = {
  users: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  userCheck: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" />
    </Icon>
  ),
  userPlus: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </Icon>
  ),
  teacher: (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M17 11h5M19.5 8.5v5" />
    </Icon>
  ),
  book: (
    <Icon>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </Icon>
  ),
  layers: (
    <Icon>
      <path d="m12 2 10 5-10 5L2 7z" />
      <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
    </Icon>
  ),
  calendar: (
    <Icon className="h-4 w-4">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icon>
  ),
  chart: (
    <Icon>
      <path d="M6 20V14M12 20V8M18 20V4" />
    </Icon>
  ),
  arrowRight: (
    <Icon className="h-4 w-4">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  ),
  award: (
    <Icon>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
    </Icon>
  ),
};

/* ---------- Building blocks ---------- */

const Card = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white shadow-card ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ icon, iconClass, title, action }) => (
  <div className="mb-5 flex items-center justify-between gap-3">
    <div className="flex items-center gap-2.5">
      <span className={iconClass}>{icon}</span>
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
    </div>
    {action}
  </div>
);

const ViewAll = ({ to }) => (
  <Link
    to={to}
    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy-900 transition hover:bg-slate-50"
  >
    View all
  </Link>
);

const Sparkline = ({ id, data, color }) => {
  const points = (data || []).map((v, i) => ({ i, v }));
  if (points.length < 2) return <div className="h-7" />;
  return (
    <div className="h-7">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const KpiCard = ({ id, icon, tone, label, value, sublabel, trend, to }) => (
  <Link
    to={to}
    className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
  >
    <div className="flex items-center gap-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.text} [&>svg]:h-4 [&>svg]:w-4`}>
        {icon}
      </span>
      <span className="truncate text-xs font-medium text-slate-700">{label}</span>
    </div>
    <div className="mt-2 flex items-center gap-2">
      <span className="text-2xl font-bold text-navy-900">{value}</span>
      <TrendPill change={trend?.change} current={value} />
    </div>
    <div className="mt-0.5 truncate text-xs text-slate-500">{sublabel}</div>
    <div className="mt-1.5">
      <Sparkline id={id} data={trend?.series} color={tone.stroke} />
    </div>
  </Link>
);

const tones = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-500', stroke: '#3B82F6' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-500', stroke: '#10B981' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-500', stroke: '#A855F7' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-500', stroke: '#F59E0B' },
  sky: { bg: 'bg-sky-50', text: 'text-blue-600', stroke: '#2563EB' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-500', stroke: '#EC4899' },
};

const barColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-teal-400',
  'bg-orange-400',
  'bg-pink-400',
  'bg-violet-400',
];

const statusPill = {
  active: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-600' },
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-600' },
  completed: { label: 'Completed', cls: 'bg-blue-50 text-blue-600' },
  inactive: { label: 'Inactive', cls: 'bg-slate-100 text-slate-500' },
};

/* ---------- Hero illustration ---------- */

const NewsIllustration = () => (
  <svg viewBox="0 0 420 170" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="hero-wave" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#C7D7FE" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="hero-ai" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <path d="M0 170 C80 60 160 70 230 110 S360 60 420 90 V170 Z" fill="url(#hero-wave)" />
    {/* back-left doc */}
    <g transform="rotate(-10 150 100)">
      <rect x="120" y="50" width="90" height="115" rx="10" fill="#EEF2FF" stroke="#C7D2FE" />
      <rect x="135" y="68" width="30" height="24" rx="5" fill="#A5B4FC" />
      <rect x="135" y="102" width="58" height="6" rx="3" fill="#C7D2FE" />
      <rect x="135" y="114" width="45" height="6" rx="3" fill="#C7D2FE" />
    </g>
    {/* back-right doc */}
    <g transform="rotate(10 300 100)">
      <rect x="255" y="45" width="90" height="115" rx="10" fill="#EEF2FF" stroke="#C7D2FE" />
      <rect x="282" y="72" width="34" height="26" rx="6" fill="#93C5FD" />
    </g>
    {/* front doc */}
    <rect x="185" y="20" width="110" height="150" rx="12" fill="#FFFFFF" stroke="#E0E7FF" />
    <rect x="200" y="50" width="40" height="6" rx="3" fill="#C7D2FE" />
    <rect x="200" y="64" width="30" height="6" rx="3" fill="#C7D2FE" />
    <rect x="200" y="95" width="80" height="6" rx="3" fill="#C7D2FE" />
    <rect x="200" y="108" width="80" height="6" rx="3" fill="#C7D2FE" />
    <rect x="200" y="121" width="60" height="6" rx="3" fill="#C7D2FE" />
    <circle cx="258" cy="58" r="22" fill="url(#hero-ai)" />
    <text x="258" y="65" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">
      AI
    </text>
    {/* paper plane */}
    <path d="M330 22 L372 10 L352 44 L346 30 Z" fill="#3B82F6" />
    <path d="M346 30 L372 10" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M300 40 Q318 34 330 30" stroke="#93C5FD" strokeDasharray="3 4" fill="none" />
    {/* sparkles */}
    {[
      [95, 30, 6],
      [110, 100, 7],
      [400, 60, 8],
    ].map(([x, y, s]) => (
      <path
        key={`${x}-${y}`}
        d={`M${x} ${y - s} L${x + s / 3} ${y - s / 3} L${x + s} ${y} L${x + s / 3} ${y + s / 3} L${x} ${y + s} L${x - s / 3} ${y + s / 3} L${x - s} ${y} L${x - s / 3} ${y - s / 3} Z`}
        fill="#60A5FA"
      />
    ))}
  </svg>
);

/* ---------- Main ---------- */

const AdminOverview = ({ user, summary }) => {
  const [newsMsg, setNewsMsg] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [trendRange, setTrendRange] = useState(6);

  const isAdmin = user?.role === 'admin';
  const trends = summary.trends || {};

  const sendAiNews = async () => {
    setNewsMsg('');
    setNewsLoading(true);
    try {
      const { data } = await api.post('/ai-news/dispatch');
      setNewsMsg(data.message || 'Sent to admin for approval.');
    } catch (err) {
      setNewsMsg(err.response?.data?.message || 'Failed to start AI news digest.');
    } finally {
      setNewsLoading(false);
    }
  };

  const trendData = useMemo(
    () => (summary.enrollmentTrend?.months || []).slice(-trendRange),
    [summary.enrollmentTrend, trendRange]
  );

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const enrollChange = summary.enrollmentTrend?.change;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 md:text-3xl">
            {greeting()} <span aria-hidden="true">☀️</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your learning community today.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{today}</span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy-900">
            {icons.calendar}
            Last 30 Days
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-100 p-6 md:p-8">
        <div className="relative z-10 max-w-xl">
          {isAdmin ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-navy-900">Weekly AI news</p>
              <h3 className="mt-2 text-xl font-bold text-navy-900 md:text-2xl">
                Latest AI stories go to you first.
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                After you approve in email, they are sent to all students.
              </p>
              <Button
                type="button"
                onClick={sendAiNews}
                disabled={newsLoading}
                className="mt-4 inline-flex items-center gap-2 !bg-blue-600 px-5 py-2.5 hover:!bg-blue-700"
              >
                {newsLoading ? 'Sending…' : 'Send this week’s digest for approval'}
                {!newsLoading && icons.arrowRight}
              </Button>
              {newsMsg && <p className="mt-2 text-sm text-navy-600">{newsMsg}</p>}
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Organization overview
              </p>
              <h3 className="mt-2 text-xl font-bold text-navy-900 md:text-2xl">
                Your full learning community at a glance.
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                You have view-only access. Contact the admin for changes.
              </p>
            </>
          )}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[45%] md:block">
          <NewsIllustration />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          id="students"
          to="/students"
          icon={icons.users}
          tone={tones.blue}
          label="Total Students"
          value={summary.students.total}
          sublabel="All registered students"
          trend={trends.students}
        />
        <KpiCard
          id="active"
          to="/students"
          icon={icons.userCheck}
          tone={tones.green}
          label="Active Students"
          value={summary.students.active}
          sublabel={`${summary.students.pending} pending approval`}
          trend={trends.activeStudents}
        />
        <KpiCard
          id="new"
          to="/students"
          icon={icons.userPlus}
          tone={tones.purple}
          label="New (Last 30 Days)"
          value={summary.students.newLast30Days}
          sublabel="Recent registrations"
          trend={trends.newStudents}
        />
        <KpiCard
          id="teachers"
          to="/teachers"
          icon={icons.teacher}
          tone={tones.orange}
          label="Total Teachers"
          value={summary.teachers.total}
          sublabel="Active instructors"
          trend={trends.teachers}
        />
        <KpiCard
          id="courses"
          to="/courses"
          icon={icons.book}
          tone={tones.sky}
          label="Active Courses"
          value={summary.courses.active}
          sublabel={`Out of ${summary.courses.total} total`}
          trend={trends.courses}
        />
        <KpiCard
          id="batches"
          to="/batches"
          icon={icons.layers}
          tone={tones.pink}
          label="Active Batches"
          value={summary.batches.total}
          sublabel="Ongoing batches"
          trend={trends.batches}
        />
      </div>

      {/* Main panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Students by course */}
        <Card className="p-5 md:p-6">
          <CardHeader
            icon={icons.users}
            iconClass="text-blue-600"
            title="Students by Course"
            action={<ViewAll to="/courses" />}
          />
          {summary.studentsByCourse.length === 0 ? (
            <p className="text-sm text-slate-400">No active enrollments yet.</p>
          ) : (
            <div className="space-y-4">
              {summary.studentsByCourse.map((c, i) => {
                const capacity = c.capacity || 0;
                const fillPct = capacity > 0 ? Math.min((c.count / capacity) * 100, 100) : 0;
                return (
                  <div key={c.courseTitle} className="flex items-end gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 truncate text-sm text-slate-700">{c.courseTitle}</div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${barColors[i % barColors.length]}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-14 shrink-0 text-right text-sm text-slate-700">
                      <span className="font-semibold text-navy-900">{c.count}</span> / {capacity || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Enrollment trend */}
        <Card className="flex flex-col p-5 md:p-6">
          <CardHeader
            icon={icons.chart}
            iconClass="text-blue-600"
            title="Enrollment Trend"
            action={
              <select
                value={trendRange}
                onChange={(e) => setTrendRange(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Enrollment trend range"
              >
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
              </select>
            }
          />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="enroll-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#EEF2F7" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                />
                <Tooltip
                  formatter={(v) => [v, 'Enrollments']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                />
                <Area
                  type="linear"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#enroll-fill)"
                  dot={{ r: 4, fill: '#fff', stroke: '#3B82F6', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50/60 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-600">
                ↑
              </span>
              <div className="min-w-0">
                <div className="text-lg font-bold text-emerald-600">
                  {enrollChange === null || enrollChange === undefined
                    ? summary.enrollmentTrend?.last30Days ?? 0
                    : `${enrollChange > 0 ? '+' : ''}${enrollChange}%`}
                </div>
                <div className="text-xs text-slate-600">New enrollments</div>
                <div className="text-xs text-slate-400">in the last 30 days</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-purple-50/60 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                {icons.users}
              </span>
              <div className="min-w-0">
                <div className="text-lg font-bold text-purple-600">{summary.students.active}</div>
                <div className="text-xs text-slate-600">Active students</div>
                <div className="text-xs text-slate-400">right now</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent registrations */}
        <Card className="p-5 md:p-6 lg:col-span-2 xl:col-span-1">
          <CardHeader
            icon={icons.users}
            iconClass="text-blue-600"
            title="Recent Registrations"
            action={<ViewAll to="/students" />}
          />
          {(summary.recentRegistrations || []).length === 0 ? (
            <p className="text-sm text-slate-400">No registrations yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {summary.recentRegistrations.map((r) => {
                const pill = statusPill[r.status] || statusPill.inactive;
                return (
                  <li key={r._id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-navy-900">{r.name}</div>
                      <div className="text-xs text-slate-500">Student</div>
                    </div>
                    <span className="hidden shrink-0 text-xs text-slate-500 sm:inline">
                      {timeAgo(r.createdAt)}
                    </span>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${pill.cls}`}>
                      {pill.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Secondary panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 md:p-6">
          <CardHeader icon={icons.award} iconClass="text-teal-500" title="Certified Students" />
          <div className="text-3xl font-bold text-navy-900">{summary.enrollments.completed}</div>
          <p className="mt-1 text-sm text-slate-500">Students who completed at least one course</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 inline-flex items-center gap-2"
            onClick={() => setShowCompleted(true)}
          >
            View list {icons.arrowRight}
          </Button>
        </Card>
      </div>

      {showCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto overflow-x-hidden rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Certified Students</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {summary.enrollments.completed}{' '}
                  {summary.enrollments.completed === 1 ? 'student' : 'students'} ·{' '}
                  {(summary.enrollments.completedList || []).length} course
                  {(summary.enrollments.completedList || []).length === 1 ? '' : 's'} completed
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setShowCompleted(false)}>
                Close
              </Button>
            </div>

            <Table scrollable={false} columns={['Student', 'Course', 'Batch', 'Completed date']}>
              {(summary.enrollments.completedList || []).map((e) => (
                <tr key={e._id} className="hover:bg-navy-50/40">
                  <td className="break-words px-3 py-3 text-sm font-medium text-navy-900 md:px-4">
                    {e.studentName}
                    {e.studentEmail ? (
                      <div className="break-all text-xs font-normal text-gray-400">{e.studentEmail}</div>
                    ) : null}
                  </td>
                  <td className="break-words px-3 py-3 text-sm text-gray-600 md:px-4">{e.courseTitle}</td>
                  <td className="break-words px-3 py-3 text-sm text-gray-600 md:px-4">{e.batchName}</td>
                  <td className="break-words px-3 py-3 text-sm text-gray-600 md:px-4">
                    {formatDate(e.completedAt)}
                  </td>
                </tr>
              ))}
              {(summary.enrollments.completedList || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    No certified students yet.
                  </td>
                </tr>
              )}
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;

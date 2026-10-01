import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/idCardUpload';
import { CheckCircleIcon, ClockIcon, FileTextIcon, XCircleIcon } from '../components/ui/icons';
import {
  Checkbox,
  DataTable,
  EmptyState,
  ExportMenu,
  FilterSelect,
  IconButton,
  PageHeader,
  Pagination,
  Panel,
  ResetButton,
  SearchInput,
  SelectionBar,
  StatTile,
  StatusBadge,
  TableMessage,
  Toolbar,
  downloadCsv,
  formatDate,
  uniqueOptions,
  usePagination,
  useSelection,
} from '../components/ui/kit';

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

  // Read-only totals for the stat cards (the table itself still uses the status filter above)
  const [allRequests, setAllRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const sel = useSelection();

  useEffect(() => {
    api
      .get('/enrollment-requests')
      .then(({ data }) => setAllRequests(data.data || []))
      .catch(() => setAllRequests([]));
  }, [requests]);

  const counts = useMemo(() => {
    const by = (s) => allRequests.filter((r) => r.status === s).length;
    return { total: allRequests.length, pending: by('pending'), approved: by('approved'), rejected: by('rejected') };
  }, [allRequests]);

  const courseOptions = useMemo(() => uniqueOptions(requests.map((r) => r.course?.title)), [requests]);
  const batchOptions = useMemo(() => uniqueOptions(requests.map((r) => r.batch?.name)), [requests]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (courseFilter !== 'all' && r.course?.title !== courseFilter) return false;
      if (batchFilter !== 'all' && r.batch?.name !== batchFilter) return false;
      if (!term) return true;
      return [r.student?.user?.name, r.student?.user?.email, r.course?.title, r.batch?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [requests, search, courseFilter, batchFilter]);

  const pager = usePagination(filtered, 10);
  const pageIds = pager.pageRows.map((r) => r._id);
  const selectedRows = requests.filter((r) => sel.selected.has(r._id));

  const exportRows = (rows, suffix) =>
    downloadCsv(
      `enrollment-requests-${suffix}`,
      ['Student', 'Email', 'Course', 'Batch', 'Identity', 'Requested on', 'Status'],
      rows.map((r) => [
        r.student?.user?.name,
        r.student?.user?.email,
        r.course?.title,
        r.batch?.name,
        r.student?.identityDocType,
        formatDate(r.createdAt),
        r.status,
      ])
    );

  const resetFilters = () => {
    setSearch('');
    setCourseFilter('all');
    setBatchFilter('all');
  };

  const statusTone = { pending: 'amber', approved: 'green', rejected: 'red' };
  const docLink = (href, label) => (
    <a href={mediaUrl(href)} target="_blank" rel="noreferrer" className="ml-2 text-xs font-medium text-blue-600 hover:underline">
      {label}
    </a>
  );

  const columns = [
    <Checkbox key="all" checked={sel.allSelected(pageIds)} onChange={() => sel.togglePage(pageIds)} label="Select all on this page" />,
    '#',
    'Student',
    'Email',
    'Course',
    'Batch',
    'Identity',
    'Requested On',
    'Status',
    canReview ? 'Actions' : '',
  ];

  return (
    <Layout title="Enrollment Requests">
      <div className="space-y-5">
        <PageHeader
          title="Enrollment Requests"
          subtitle="Student signup requests wait here until an admin approves them."
          actions={
            <>
              <ExportMenu
                options={[
                  { label: `Current view (${filtered.length}) · CSV`, onSelect: () => exportRows(filtered, 'filtered') },
                  {
                    label: `Selected (${selectedRows.length}) · CSV`,
                    disabled: selectedRows.length === 0,
                    onSelect: () => exportRows(selectedRows, 'selected'),
                  },
                ]}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Request status"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-navy-900 focus:border-blue-400 focus:outline-none sm:w-40"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile icon={FileTextIcon} tone="blue" label="Total Requests" value={counts.total} sublabel="All time requests" />
          <StatTile icon={ClockIcon} tone="orange" label="Pending" value={counts.pending} sublabel="Awaiting approval" />
          <StatTile icon={CheckCircleIcon} tone="green" label="Approved" value={counts.approved} sublabel="Successfully enrolled" />
          <StatTile icon={XCircleIcon} tone="red" label="Rejected" value={counts.rejected} sublabel="Not approved" />
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <Panel>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by student name, email, or course…" className="xl:flex-1" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:items-end">
              <FilterSelect value={courseFilter} onChange={setCourseFilter} allLabel="All Courses" options={courseOptions} className="xl:w-44" />
              <FilterSelect value={batchFilter} onChange={setBatchFilter} allLabel="All Batches" options={batchOptions} className="xl:w-44" />
            </div>
            <ResetButton onClick={resetFilters} />
          </Toolbar>

          <SelectionBar count={sel.selected.size} onExport={() => exportRows(selectedRows, 'selected')} onClear={sel.clear} />

          {!loading && filtered.length === 0 ? (
            <>
              <DataTable columns={columns}>{null}</DataTable>
              <EmptyState
                title={requests.length === 0 ? 'No enrollment requests yet' : 'No matching requests'}
                text={
                  requests.length === 0
                    ? 'Student signup requests will appear here when students register for courses and await your approval.'
                    : 'Try a different search or clear the filters.'
                }
              />
            </>
          ) : (
            <DataTable columns={columns}>
              {loading ? (
                <TableMessage colSpan={10}>Loading requests…</TableMessage>
              ) : (
                pager.pageRows.map((r, i) => (
                  <tr key={r._id} className={sel.selected.has(r._id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                    <td className="py-3 pl-4 pr-3">
                      <Checkbox checked={sel.selected.has(r._id)} onChange={() => sel.toggle(r._id)} label={`Select ${r.student?.user?.name || 'request'}`} />
                    </td>
                    <td className="py-3 pr-3 text-slate-500">{pager.offset + i + 1}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-navy-900">{r.student?.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{r.student?.user?.email}</td>
                    <td className="py-3 pr-3 text-slate-600">{r.course?.title}</td>
                    <td className="py-3 pr-3 text-slate-600">{r.batch?.name}</td>
                    <td className="py-3 pr-3 text-slate-600">
                      {r.student?.identityDocType || '—'}
                      {canReview &&
                        r.student?.identityDocType === 'B-Form' &&
                        (r.student?.identityDocFrontUrl || r.student?.identityDocImageUrl) &&
                        docLink(r.student.identityDocFrontUrl || r.student.identityDocImageUrl, 'View')}
                      {canReview &&
                        r.student?.identityDocType !== 'B-Form' &&
                        (r.student?.identityDocFrontUrl || r.student?.identityDocImageUrl) &&
                        docLink(r.student.identityDocFrontUrl || r.student.identityDocImageUrl, 'Front')}
                      {canReview &&
                        r.student?.identityDocType !== 'B-Form' &&
                        r.student?.identityDocBackUrl &&
                        docLink(r.student.identityDocBackUrl, 'Back')}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{formatDate(r.createdAt)}</td>
                    <td className="py-3 pr-3">
                      <StatusBadge tone={statusTone[r.status] || 'gray'}>{r.status}</StatusBadge>
                    </td>
                    {canReview && (
                      <td className="py-3 pr-4">
                        {r.status === 'pending' ? (
                          <div className="flex gap-2">
                            <IconButton
                              label="Approve"
                              icon={CheckCircleIcon}
                              tone="success"
                              disabled={actingId === r._id}
                              onClick={() => act(r._id, 'approve')}
                            />
                            <IconButton
                              label="Reject"
                              icon={XCircleIcon}
                              tone="danger"
                              disabled={actingId === r._id}
                              onClick={() => act(r._id, 'reject')}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </DataTable>
          )}
          <Pagination pager={pager} noun="requests" />
        </Panel>
      </div>
    </Layout>
  );
};

export default EnrollmentRequests;

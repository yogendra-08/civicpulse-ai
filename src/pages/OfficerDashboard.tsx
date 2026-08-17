import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
  Search,
  Inbox,
  Send,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ComplaintCard, ComplaintDetailModal } from '@/components/ComplaintComponents';
import { LoadingOverlay, EmptyState, StatusBadge } from '@/components/ui';
import { realComplaintService } from '@/services/realComplaintService';
import type { Complaint, ComplaintStatus } from '@/types';

const statusFilters: (ComplaintStatus | 'All')[] = ['All', 'Assigned', 'In Progress', 'Resolved'];

const statusFilterKeys: Record<ComplaintStatus | 'All', string> = {
  All: 'filters.all',
  Submitted: 'complaints.status.submitted',
  Assigned: 'complaints.status.assigned',
  'In Progress': 'complaints.status.inProgress',
  Resolved: 'complaints.status.resolved',
  Closed: 'complaints.status.closed',
};

const nextStatus: Partial<Record<ComplaintStatus, ComplaintStatus | null>> = {
  Submitted: 'Assigned',
  Assigned: 'In Progress',
  'In Progress': 'Resolved',
  Resolved: 'Closed',
  Closed: null,
};

export function OfficerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ComplaintStatus | 'All'>('All');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'officer') return;

    if (!user.officerRecordId) {
      setLoadError(t('officer.profileNotLinked'));
      setComplaints([]);
      return;
    }

    realComplaintService.getOfficerComplaints(user.officerRecordId).then(({ complaints, error }) => {
      if (error) {
        setLoadError(error);
      }
      setComplaints(complaints);
    });
  }, [user]);

  const stats = useMemo(() => {
    if (!complaints) return { total: 0, assigned: 0, inProgress: 0, resolved: 0, critical: 0 };
    return {
      total: complaints.length,
      assigned: complaints.filter((c) => c.status === 'Assigned').length,
      inProgress: complaints.filter((c) => c.status === 'In Progress').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
      critical: complaints.filter((c) => c.severity === 'Critical' && c.status !== 'Resolved').length,
    };
  }, [complaints]);

  const filtered = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter((c) => {
      const matchFilter = filter === 'All' || c.status === filter;
      const q = search.toLowerCase();
      const displayId = (c.complaint_number ?? c.id).toLowerCase();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        displayId.includes(q) ||
        c.location.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [complaints, filter, search]);

  async function handleUpdateStatus() {
    if (!selected || !user || user.role !== 'officer') return;
    const next = nextStatus[selected.status];
    if (!next) return;

    setUpdating(true);
    const { complaint: updated, error } = await realComplaintService.updateComplaintStatus(
      selected.id,
      user.id,
      {
        status: next,
        note: note.trim() || t('officer.updateNote', { status: t(statusFilterKeys[next]) }),
      },
    );
    setUpdating(false);

    if (error || !updated) {
      alert(error || t('officer.updateFailed'));
      return;
    }

    setSelected(updated);
    setComplaints((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? null);
    setNote('');
  }

  if (!complaints) return <DashboardLayout><LoadingOverlay label={t('officer.loadingAssigned')} /></DashboardLayout>;

  const deptName = user?.role === 'officer' ? user.departmentName ?? t('roles.department') : '';
  const next = selected ? nextStatus[selected.status] ?? null : null;

  return (
    <DashboardLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-navy-900">{t('dashboard.officerDashboard')}</h1>
        <p className="text-slate-500 mt-1">
          {deptName} · {user?.role === 'officer' ? user.ward : ''} · {t('roles.badge')} {user?.role === 'officer' ? user.badge : ''}
        </p>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={ClipboardList} label={t('dashboard.totalAssigned')} value={stats.total} color="bg-gov-50 text-gov-600" />
        <StatCard icon={Clock} label={t('dashboard.stats.pending')} value={stats.assigned} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Clock} label={t('dashboard.stats.inProgress')} value={stats.inProgress} color="bg-saffron-50 text-saffron-600" />
        <StatCard icon={CheckCircle2} label={t('dashboard.stats.resolved')} value={stats.resolved} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={AlertTriangle} label={t('dashboard.stats.critical')} value={stats.critical} color="bg-red-50 text-red-600" />
      </div>

      {/* Complaints */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-navy-900">{t('officer.assignedComplaints')}</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="input pl-9 py-2 text-sm w-full sm:w-48"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 overflow-x-auto scrollbar-thin">
              {statusFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                    filter === f ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-700'
                  }`}
                >
                  {t(statusFilterKeys[f])}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-12 w-12" />}
            title={t('officer.noComplaintsAssigned')}
            message={
              complaints.length === 0
                ? t('officer.autoAssignedMessage')
                : t('officer.noFilterMatches')
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((c) => (
              <ComplaintCard key={c.id} complaint={c} onOpen={setSelected} />
            ))}
          </div>
        )}
      </div>

      <ComplaintDetailModal complaint={selected} onClose={() => { setSelected(null); setNote(''); }}>
        {selected && next && (
          <div className="mt-2 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-navy-900 mb-3">{t('officer.updateStatus')}</h4>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={selected.status} />
              <span className="text-slate-400 text-sm">→</span>
              <StatusBadge status={next} />
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('officer.addStatusNote', { status: t(statusFilterKeys[next]) })}
              rows={2}
              className="input resize-none text-sm"
            />
            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="btn-primary w-full mt-3"
            >
              {updating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('officer.updating')}</>
              ) : (
                <><Send className="h-4 w-4" /> {t('officer.markAs', { status: t(statusFilterKeys[next]) })}</>
              )}
            </button>
          </div>
        )}
        {selected && !next && (
          <div className="mt-2 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 className="h-5 w-5" /> {t('officer.resolvedMessage')}
            </div>
          </div>
        )}
      </ComplaintDetailModal>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-3 animate-fade-in">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-navy-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

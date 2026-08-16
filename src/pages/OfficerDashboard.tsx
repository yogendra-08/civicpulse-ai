import { useEffect, useMemo, useState } from 'react';
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
import { complaintService } from '@/services/complaintService';
import { departments } from '@/data/mockData';
import type { Complaint, ComplaintStatus } from '@/types';

const statusFilters: (ComplaintStatus | 'All')[] = ['All', 'Assigned', 'In Progress', 'Resolved'];

const nextStatus: Partial<Record<ComplaintStatus, ComplaintStatus | null>> = {
  Submitted: 'Assigned',
  Assigned: 'In Progress',
  'In Progress': 'Resolved',
  Resolved: 'Closed',
  Closed: null,
};

export function OfficerDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ComplaintStatus | 'All'>('All');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'officer') return;
    complaintService.listByOfficer(user.id).then(setComplaints);
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
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [complaints, filter, search]);

  async function handleUpdateStatus() {
    if (!selected) return;
    const next = nextStatus[selected.status];
    if (!next) return;
    setUpdating(true);
    const updated = await complaintService.updateStatus(
      selected.id,
      next,
      note.trim() || `Status updated to ${next}.`,
      user?.role === 'officer' ? user.name : 'Officer',
    );
    setUpdating(false);
    if (updated) {
      setSelected(updated);
      setComplaints((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? null);
      setNote('');
    }
  }

  if (!complaints) return <DashboardLayout><LoadingOverlay label="Loading assigned complaints..." /></DashboardLayout>;

  const deptName = user?.role === 'officer' ? departments.find((d) => d.id === user.departmentId)?.name : '';
  const next = selected ? nextStatus[selected.status] ?? null : null;

  return (
    <DashboardLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-navy-900">Officer Dashboard</h1>
        <p className="text-slate-500 mt-1">
          {deptName} · {user?.role === 'officer' ? user.ward : ''} · Badge {user?.role === 'officer' ? user.badge : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={ClipboardList} label="Total Assigned" value={stats.total} color="bg-gov-50 text-gov-600" />
        <StatCard icon={Clock} label="Pending" value={stats.assigned} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="bg-saffron-50 text-saffron-600" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={AlertTriangle} label="Critical" value={stats.critical} color="bg-red-50 text-red-600" />
      </div>

      {/* Complaints */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-navy-900">Assigned Complaints</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
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
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-12 w-12" />}
            title="No complaints assigned"
            message="You have no complaints matching the current filter."
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
            <h4 className="text-sm font-bold text-navy-900 mb-3">Update Status</h4>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={selected.status} />
              <span className="text-slate-400 text-sm">→</span>
              <StatusBadge status={next} />
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Add a note for status update to "${next}"...`}
              rows={2}
              className="input resize-none text-sm"
            />
            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="btn-primary w-full mt-3"
            >
              {updating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
              ) : (
                <><Send className="h-4 w-4" /> Mark as {next}</>
              )}
            </button>
          </div>
        )}
        {selected && !next && (
          <div className="mt-2 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 className="h-5 w-5" /> This complaint has been resolved.
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

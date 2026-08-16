import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  ClipboardList,
  TrendingUp,
  Building,
  MapPin,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ComplaintCard, ComplaintDetailModal } from '@/components/ComplaintComponents';
import { LoadingOverlay } from '@/components/ui';
import { realComplaintService } from '@/services/realComplaintService';
import type { Complaint } from '@/types';

export function AdminDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    realComplaintService.getAllComplaints().then(({ complaints, error }) => {
      if (error) {
        console.error('Failed to load admin complaints:', error);
      }
      setComplaints(complaints || []);
    });
  }, []);

  const stats = useMemo(() => {
    if (!complaints) return { total: 0, pending: 0, inProgress: 0, resolved: 0, critical: 0 };
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'Assigned').length,
      inProgress: complaints.filter((c) => c.status === 'In Progress').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
      critical: complaints.filter((c) => c.severity === 'Critical').length,
    };
  }, [complaints]);

  const deptPerformance = useMemo(() => {
    if (!complaints) return [];

    const map = new Map<string, { id: string; name: string; color: string; total: number; resolved: number }>();

    complaints.forEach((c) => {
      const name = c.departmentName || c.departmentId || 'Unassigned';
      const entry = map.get(name) ?? {
        id: c.departmentId || name,
        name,
        color: '#3b82f6',
        total: 0,
        resolved: 0,
      };

      entry.total += 1;
      if (c.status === 'Resolved') entry.resolved += 1;
      map.set(name, entry);
    });

    return Array.from(map.values())
      .map((d) => ({
        ...d,
        pending: d.total - d.resolved,
        rate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [complaints]);

  const wardPerformance = useMemo(() => {
    if (!complaints) return [];
    const map = new Map<string, { total: number; resolved: number }>();
    complaints.forEach((c) => {
      const entry = map.get(c.ward) ?? { total: 0, resolved: 0 };
      entry.total++;
      if (c.status === 'Resolved') entry.resolved++;
      map.set(c.ward, entry);
    });
    return Array.from(map.entries())
      .map(([ward, v]) => ({ ward, ...v, rate: v.total > 0 ? Math.round((v.resolved / v.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [complaints]);

  const recent = useMemo(() => {
    if (!complaints) return [];
    return [...complaints]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [complaints]);

  const filteredRecent = useMemo(() => {
    if (!recent) return [];
    const q = search.toLowerCase();
    if (!q) return recent;
    return recent.filter(
      (c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.ward.toLowerCase().includes(q),
    );
  }, [recent, search]);

  if (!complaints) return <DashboardLayout><LoadingOverlay label="Loading dashboard..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">{user?.role === 'admin' ? user.municipality : ''}</p>
        </div>
        <Link to="/admin/analytics" className="btn-primary text-sm">
          <BarChart3 className="h-4 w-4" /> View Analytics
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={ClipboardList} label="Total Complaints" value={stats.total} color="bg-gov-50 text-gov-600" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="bg-saffron-50 text-saffron-600" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={AlertTriangle} label="Critical" value={stats.critical} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-navy-700" />
            <h2 className="text-lg font-bold text-navy-900">Department Performance</h2>
          </div>
          <div className="space-y-3">
            {deptPerformance.map((d) => (
              <div key={d.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-navy-800">{d.name}</span>
                  <span className="text-xs text-slate-500">{d.resolved}/{d.total} resolved</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${d.rate}%`, backgroundColor: d.color }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{d.rate}% resolution rate</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-navy-700" />
            <h2 className="text-lg font-bold text-navy-900">Ward Performance</h2>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {wardPerformance.map((w) => (
              <div key={w.ward} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100 text-navy-700 text-xs font-bold">
                    {w.ward.replace('Ward ', '')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy-800">{w.ward}</div>
                    <div className="text-xs text-slate-400">{w.total} complaints · {w.resolved} resolved</div>
                  </div>
                </div>
                <span className={`badge ${w.rate >= 75 ? 'bg-emerald-100 text-emerald-700' : w.rate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {w.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-navy-700" />
            <h2 className="text-lg font-bold text-navy-900">Recent Complaints</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recent..."
              className="input pl-9 py-2 text-sm w-full sm:w-48"
            />
          </div>
        </div>
        {filteredRecent.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No matching complaints.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRecent.map((c) => (
              <ComplaintCard key={c.id} complaint={c} onOpen={setSelected} />
            ))}
          </div>
        )}
      </div>

      <ComplaintDetailModal complaint={selected} onClose={() => setSelected(null)} />
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

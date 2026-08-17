import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  FilePlus,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ComplaintCard, ComplaintDetailModal } from '@/components/ComplaintComponents';
import { LoadingOverlay, EmptyState } from '@/components/ui';
import { realComplaintService } from '@/services/realComplaintService';
import type { Complaint, ComplaintStatus } from '@/types';

const statusFilters: (ComplaintStatus | 'All')[] = ['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Overdue'];

const statusFilterKeys: Record<ComplaintStatus | 'All', string> = {
  All: 'filters.all',
  Submitted: 'complaints.status.submitted',
  Assigned: 'complaints.status.assigned',
  'In Progress': 'complaints.status.inProgress',
  Resolved: 'complaints.status.resolved',
  Closed: 'complaints.status.closed',
  Overdue: 'complaints.status.overdue',
};

export function CitizenDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ComplaintStatus | 'All'>('All');

  useEffect(() => {
    if (!user || user.role !== 'citizen') return;

    realComplaintService.getCitizenComplaints(user.id).then(({ complaints, error }) => {
      if (error) {
        console.error('Failed to load complaints:', error);
      }
      setComplaints(complaints);
    });
  }, [user]);

  const stats = useMemo(() => {
    if (!complaints) return { total: 0, assigned: 0, inProgress: 0, resolved: 0 };
    return {
      total: complaints.length,
      assigned: complaints.filter((c) => c.status === 'Assigned').length,
      inProgress: complaints.filter((c) => c.status === 'In Progress').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
      submitted: complaints.filter((c) => c.status === 'Submitted').length,
      overdue: complaints.filter((c) => c.status === 'Overdue').length,
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
        c.location.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [complaints, filter, search]);

  const joinedDate = user?.role === 'citizen'
    ? new Date(user.joinedAt).toLocaleDateString(i18n.language, { month: 'short', year: 'numeric' })
    : '';

  if (!complaints) return <DashboardLayout><LoadingOverlay label={t('dashboard.loadingComplaints')} /></DashboardLayout>;

  return (
    <DashboardLayout>
      {/* Welcome header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-navy-900">
          {t('dashboard.welcomeBackName', { name: user?.role === 'citizen' ? user.name.split(' ')[0] : '' })}
        </h1>
        <p className="text-slate-500 mt-1">{t('dashboard.trackComplaints')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ClipboardList} label={t('dashboard.stats.totalComplaints')} value={stats.total} color="bg-gov-50 text-gov-600" />
        <StatCard icon={Clock} label={t('dashboard.stats.assigned')} value={stats.assigned} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Clock} label={t('dashboard.stats.inProgress')} value={stats.inProgress} color="bg-saffron-50 text-saffron-600" />
        <StatCard icon={CheckCircle2} label={t('dashboard.stats.resolved')} value={stats.resolved} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label={t('complaints.status.overdue')} value={stats.overdue} color="bg-red-50 text-red-600" />
      </div>

      {/* Profile + Quick action */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-white text-xl font-bold">
              {user?.role === 'citizen' ? user.name.charAt(0) : ''}
            </div>
            <div>
              <div className="font-bold text-navy-900 text-lg">{user?.role === 'citizen' ? user.name : ''}</div>
              <div className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {user?.role === 'citizen' ? user.ward : ''}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {t('dashboard.joined', { date: joinedDate })}</span>
              </div>
            </div>
          </div>
        </div>
        <Link to="/citizen/report" className="card p-5 flex items-center gap-4 hover:shadow-card-hover hover:border-gov-300 transition group bg-gov-50/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gov-600 text-white group-hover:scale-105 transition-transform">
            <FilePlus className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-navy-900">{t('navigation.reportComplaint')}</div>
            <div className="text-sm text-slate-500">{t('dashboard.reportComplaintHint')}</div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-gov-500 transition" />
        </Link>
      </div>

      {/* Complaints section */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-navy-900">{t('navigation.myComplaints')}</h2>
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
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
              {statusFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
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
            title={complaints.length === 0 ? t('dashboard.noComplaintsYet') : t('dashboard.noMatchingComplaints')}
            message={complaints.length === 0 ? t('dashboard.reportIssueTrack') : t('dashboard.adjustSearchFilter')}
            action={
              complaints.length === 0 ? (
                <Link to="/citizen/report" className="btn-primary text-sm">
                  <FilePlus className="h-4 w-4" /> {t('navigation.reportComplaint')}
                </Link>
              ) : undefined
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

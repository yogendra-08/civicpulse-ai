import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Building,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingOverlay } from '@/components/ui';
import { realComplaintService } from '@/services/realComplaintService';
import type { Complaint, ComplaintCategory } from '@/types';

const categoryKeys: Record<ComplaintCategory, string> = {
  'Road Issue': 'complaints.categoryLabels.roadIssue',
  'Water Leakage': 'complaints.categoryLabels.waterLeakage',
  Sanitation: 'complaints.categoryLabels.sanitation',
  Electrical: 'complaints.categoryLabels.electrical',
  Drainage: 'complaints.categoryLabels.drainage',
  'Public Sanitation': 'complaints.categoryLabels.publicSanitation',
};

const resolutionTrend = [
  { week: 'W1', assigned: 45, inProgress: 38, resolved: 32 },
  { week: 'W2', assigned: 52, inProgress: 41, resolved: 44 },
  { week: 'W3', assigned: 48, inProgress: 35, resolved: 50 },
  { week: 'W4', assigned: 61, inProgress: 44, resolved: 55 },
  { week: 'W5', assigned: 55, inProgress: 39, resolved: 58 },
  { week: 'W6', assigned: 63, inProgress: 42, resolved: 61 },
];

export function AdminAnalytics() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; complaints: number; resolved: number }>>([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    assigned: 0,
    submitted: 0,
    avgResolutionTime: 0,
    resolutionRate: 0,
  });
  const [deptData, setDeptData] = useState<Array<{ name: string; total: number; resolved: number }>>([]);

  useEffect(() => {
    async function loadData() {
      const [{ complaints: complaintRows, error: complaintError }, statsResult, deptResult, trendResult] = await Promise.all([
        realComplaintService.getAllComplaints(),
        realComplaintService.getStatistics(),
        realComplaintService.getDepartmentStatistics(),
        realComplaintService.getMonthlyTrend(6),
      ]);

      if (complaintError) {
        console.error('Failed to load admin complaints:', complaintError);
      }

      setComplaints(complaintRows || []);
      setStats({
        total: statsResult.total,
        resolved: statsResult.resolved,
        inProgress: statsResult.inProgress,
        assigned: statsResult.assigned,
        submitted: statsResult.submitted,
        avgResolutionTime: statsResult.avgResolutionTime,
        resolutionRate: statsResult.resolutionRate,
      });

      const mappedDeptData = (deptResult.departments || []).map((d) => ({
        name: d.name.replace(/ &.*/, '').replace(/\s.*/, ''),
        fullName: d.name,
        total: d.total,
        resolved: d.resolved,
      }));
      setDeptData(mappedDeptData);

      const mappedTrend = (trendResult.trends || []).map((d) => ({
        month: d.month,
        complaints: d.complaints,
        resolved: d.resolved,
      }));
      setMonthlyTrend(mappedTrend);
    }

    loadData();
  }, []);

  const categoryData = useMemo(() => {
    if (!complaints) return [];
    const map = new Map<ComplaintCategory, number>();
    complaints.forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({
      name: t(categoryKeys[name]),
      value,
      color: {
        'Road Issue': '#f59e0b',
        'Water Leakage': '#3b82f6',
        Sanitation: '#10b981',
        Electrical: '#8b5cf6',
        Drainage: '#22c55e',
        'Public Sanitation': '#14b8a6',
      }[name],
    }));
  }, [complaints, t]);

  const severityData = useMemo(() => {
    if (!complaints) return [];
    const severities = ['Low', 'Medium', 'High', 'Critical'] as const;
    const colors: Record<string, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };
    const severityLabels: Record<string, string> = {
      Low: t('complaints.low'),
      Medium: t('complaints.medium'),
      High: t('complaints.high'),
      Critical: t('complaints.severity.critical'),
    };
    return severities.map((s) => ({
      name: severityLabels[s],
      count: complaints.filter((c) => c.severity === s).length,
      color: colors[s],
    }));
  }, [complaints, t]);

  const wardData = useMemo(() => {
    if (!complaints) return [];
    const map = new Map<string, number>();
    complaints.forEach((c) => map.set(c.ward, (map.get(c.ward) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([ward, count]) => ({ ward, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [complaints]);

  if (!complaints) return <DashboardLayout><LoadingOverlay label={t('admin.loadingAnalytics')} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 transition mb-4">
        <ArrowLeft className="h-4 w-4" /> {t('admin.backToDashboard')}
      </Link>

      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-navy-900 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-gov-600" /> {t('admin.analyticsDashboard')}
        </h1>
        <p className="text-slate-500 mt-1">{t('admin.analyticsDescription')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label={t('dashboard.stats.totalComplaints')} value={stats.total} trend={t('admin.live')} icon={BarChart3} color="bg-gov-50 text-gov-600" />
        <KPICard label={t('admin.avgResolution')} value={`${Math.max(0, Math.round(stats.avgResolutionTime))}d`} trend={t('admin.live')} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <KPICard label={t('admin.resolutionRateLabel')} value={`${Math.round(stats.resolutionRate)}%`} trend={t('admin.live')} icon={TrendingUp} color="bg-saffron-50 text-saffron-600" />
        <KPICard label={t('admin.criticalCases')} value={complaints.filter((c) => c.severity === 'Critical').length} trend={t('admin.live')} icon={AlertTriangle} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title={t('admin.monthlyComplaintTrends')} subtitle={t('admin.monthlySubtitle')} icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gComplaints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3478ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3478ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="complaints" stroke="#3478ff" strokeWidth={2} fill="url(#gComplaints)" name={t('admin.chart.complaints')} />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#gResolved)" name={t('admin.chart.resolved')} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('admin.categoryDistribution')} subtitle={t('admin.categorySubtitle')} icon={PieIcon}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('admin.resolutionTrends')} subtitle={t('admin.resolutionSubtitle')} icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={resolutionTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="assigned" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name={t('admin.chart.assigned')} />
              <Line type="monotone" dataKey="inProgress" stroke="#ff9b32" strokeWidth={2} dot={{ r: 3 }} name={t('admin.chart.inProgress')} />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name={t('admin.chart.resolved')} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('admin.severityBreakdown')} subtitle={t('admin.severitySubtitle')} icon={AlertTriangle}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={severityData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name={t('admin.chart.complaints')}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title={t('admin.departmentPerformance')} subtitle={t('admin.departmentSubtitle')} icon={Building}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total" fill="#3478ff" radius={[4, 4, 0, 0]} name={t('admin.chart.total')} />
              <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name={t('admin.chart.resolved')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('admin.topProblemWards')} subtitle={t('admin.topProblemWardsSubtitle')} icon={MapPin}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={wardData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="ward" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip />
              <Bar dataKey="count" fill="#1c5af5" radius={[0, 4, 4, 0]} name={t('admin.chart.complaints')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}

function KPICard({
  label,
  value,
  trend,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  trend: string;
  icon: typeof BarChart3;
  color: string;
}) {
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`text-xs font-bold ${trend.startsWith('-0') || trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend}
        </span>
      </div>
      <div className="text-2xl font-extrabold text-navy-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof BarChart3;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-1">
        <Icon className="h-5 w-5 text-navy-700" />
        <h3 className="font-bold text-navy-900">{title}</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

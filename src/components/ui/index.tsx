import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const statusKeys: Record<string, string> = {
  Submitted: 'complaints.status.submitted',
  Assigned: 'complaints.status.assigned',
  'In Progress': 'complaints.status.inProgress',
  Resolved: 'complaints.status.resolved',
  Closed: 'complaints.status.closed',
};

const severityKeys: Record<string, string> = {
  Low: 'complaints.low',
  Medium: 'complaints.medium',
  High: 'complaints.high',
  Critical: 'complaints.severity.critical',
};

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`badge ${className}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    Assigned: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-saffron-100 text-saffron-700',
    Resolved: 'bg-emerald-100 text-emerald-700',
  };
  return <span className={`badge ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>{t(statusKeys[status] ?? status)}</span>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-red-100 text-red-700',
  };
  return <span className={`badge ${map[severity] ?? 'bg-slate-100 text-slate-700'}`}>{t(severityKeys[severity] ?? severity)}</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="text-xl font-bold text-navy-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-navy-800">{title}</h3>
      {message && <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function LoadingOverlay({ label = '' }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Spinner className="h-8 w-8 text-gov-500" />
      <p className="mt-3 text-sm text-slate-500">{label || t('common.loading')}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner className="h-10 w-10 text-gov-500" />
    </div>
  );
}

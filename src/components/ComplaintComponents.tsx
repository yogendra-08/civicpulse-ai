import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  ChevronRight,
  Construction,
  Droplets,
  Lightbulb,
  MapPin,
  SprayCan,
  Trash2,
  Waves,
  X,
  Clock,
  User,
  Building,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Complaint, ComplaintCategory } from '@/types';
import { departments, officers } from '@/data/mockData';
import { SeverityBadge, StatusBadge } from '@/components/ui';
import { complaintVoteService } from '@/services/complaintVoteService';

const categoryKeys: Record<ComplaintCategory, string> = {
  'Road Issue': 'complaints.categoryLabels.roadIssue',
  'Water Leakage': 'complaints.categoryLabels.waterLeakage',
  Sanitation: 'complaints.categoryLabels.sanitation',
  Electrical: 'complaints.categoryLabels.electrical',
  Drainage: 'complaints.categoryLabels.drainage',
  'Public Sanitation': 'complaints.categoryLabels.publicSanitation',
};

const iconMap: Record<ComplaintCategory, typeof Construction> = {
  'Road Issue': Construction,
  'Water Leakage': Droplets,
  Sanitation: Trash2,
  Electrical: Lightbulb,
  Drainage: Waves,
  'Public Sanitation': SprayCan,
};

const categoryBg: Record<ComplaintCategory, string> = {
  'Road Issue': 'bg-amber-50 text-amber-600',
  'Water Leakage': 'bg-blue-50 text-blue-600',
  Sanitation: 'bg-emerald-50 text-emerald-600',
  Electrical: 'bg-violet-50 text-violet-600',
  Drainage: 'bg-cyan-50 text-cyan-600',
  'Public Sanitation': 'bg-teal-50 text-teal-600',
};

function deptName(id: string | undefined, fallback: string | undefined, unknown: string) {
  return fallback || departments.find((d) => d.id === id)?.name || unknown;
}
function officerName(id: string | undefined, fallback: string | undefined, unassigned: string) {
  return fallback || officers.find((o) => o.id === id)?.name || unassigned;
}

function formatDate(iso: string, language: string) {
  return new Date(iso).toLocaleDateString(language === 'en' ? 'en-IN' : language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string, language: string) {
  return new Date(iso).toLocaleString(language === 'en' ? 'en-IN' : language, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isOverdue(complaint: Complaint) {
  if (complaint.status === 'Resolved' || complaint.status === 'Closed') return false;
  if (!complaint.expectedResolutionAt) return false;
  return new Date(complaint.expectedResolutionAt).getTime() < Date.now();
}

export function ComplaintCard({
  complaint,
  onOpen,
}: {
  complaint: Complaint;
  onOpen: (c: Complaint) => void;
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [voteSummary, setVoteSummary] = useState(() => complaintVoteService.getSummary(complaint.id));
  const [hasVoted, setHasVoted] = useState(() => complaintVoteService.hasUpvoted(complaint.id, user?.id));
  const Icon = iconMap[complaint.category];
  const overdue = isOverdue(complaint);
  const displayStatus = overdue ? 'Overdue' : complaint.status;

  useEffect(() => {
    const summary = complaintVoteService.getSummary(complaint.id);
    setVoteSummary(summary);
    setHasVoted(complaintVoteService.hasUpvoted(complaint.id, user?.id));
  }, [complaint?.id, user?.id]);

  function handleVote(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (!user || user.role !== 'citizen') return;
    const summary = complaintVoteService.toggleUpvote(complaint.id, user.id);
    setVoteSummary(summary);
    setHasVoted(summary.voters.includes(user.id));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(complaint)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(complaint);
      }}
      className="card text-left p-4 sm:p-5 w-full hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 group animate-fade-in cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${categoryBg[complaint.category]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gov-600 font-mono">{complaint.complaint_number ?? complaint.id}</span>
            <SeverityBadge severity={complaint.severity} />
          </div>
          <h3 className="mt-1 font-semibold text-navy-900 text-sm leading-snug line-clamp-2 group-hover:text-gov-700 transition-colors">
            {complaint.title}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[160px]">{complaint.ward}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(complaint.createdAt, i18n.language)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <StatusBadge status={displayStatus} />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="truncate">
                {complaint.departmentName ?? deptName(complaint.departmentId, complaint.departmentName, t('admin.unknown'))}
              </span>
              <button
                type="button"
                onClick={handleVote}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                  hasVoted ? 'bg-gov-50 text-gov-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-label={hasVoted ? t('complaints.voteRemove') : t('complaints.voteAdd')}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="font-semibold">{voteSummary.upvotes}</span>
              </button>
            </div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-navy-400 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </div>
  );
}

export function ComplaintDetailModal({
  complaint,
  onClose,
  children,
}: {
  complaint: Complaint | null;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const { t: translate, i18n } = useTranslation();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [voteSummary, setVoteSummary] = useState(() => complaint ? complaintVoteService.getSummary(complaint.id) : { upvotes: 0, voters: [] });
  const [hasVoted, setHasVoted] = useState(() => complaint ? complaintVoteService.hasUpvoted(complaint.id, user?.id) : false);
  const complaintId = complaint?.id;

  useEffect(() => {
    if (!complaintId) return;
    const summary = complaintVoteService.getSummary(complaintId);
    setVoteSummary(summary);
    setHasVoted(complaintVoteService.hasUpvoted(complaintId, user?.id));
  }, [complaintId, user?.id]);

  if (!complaint) return null;
  const Icon = iconMap[complaint.category];
  const aiInfo = complaint.ai ?? null;
  const timeline = complaint.timeline ?? [];

  function handleVote() {
    if (!complaintId) return;
    if (!user || user.role !== 'citizen') return;
    const summary = complaintVoteService.toggleUpvote(complaintId, user.id);
    setVoteSummary(summary);
    setHasVoted(summary.voters.includes(user.id));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy-950/50 animate-fade-in-fast" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${categoryBg[complaint.category]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gov-600 font-mono">{complaint.complaint_number ?? complaint.id}</span>
              <SeverityBadge severity={complaint.severity} />
                <StatusBadge status={displayStatus} />
              </div>
              <h2 className="mt-1 text-lg font-bold text-navy-900 leading-snug">{complaint.title}</h2>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleVote}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    hasVoted ? 'bg-gov-50 text-gov-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-label={hasVoted ? translate('complaints.voteRemove') : translate('complaints.voteAdd')}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{translate('complaints.voteCount', { count: voteSummary.upvotes })}</span>
                </button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy-700 transition shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto scrollbar-thin p-5 space-y-5">
          {/* Image */}
          {complaint.imageUrl && !imgError && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={complaint.imageUrl}
                alt={complaint.title}
                className="w-full h-48 object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetaItem icon={MapPin} label={translate('complaints.location')} value={complaint.location} />
            <MetaItem icon={Building} label={translate('complaints.details.department')} value={deptName(complaint.departmentId, complaint.departmentName, translate('admin.unknown'))} />
            <MetaItem icon={User} label={translate('complaints.details.assignedTo')} value={officerName(complaint.officerId, complaint.officerName, translate('officer.noAssignments'))} />
            <MetaItem icon={Calendar} label={translate('complaints.details.filedOn')} value={formatDate(complaint.createdAt, i18n.language)} />
            <MetaItem
              icon={Clock}
              label={translate('complaints.details.expectedBy')}
              value={complaint.expectedResolutionAt ? formatDate(complaint.expectedResolutionAt, i18n.language) : translate('complaints.details.pendingEstimate')}
            />
            <MetaItem
              icon={AlertTriangle}
              label={translate('complaints.details.estimateWindow')}
              value={complaint.resolutionWindow || translate('complaints.details.pendingEstimate')}
            />
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{translate('complaints.description')}</h4>
            <p className="text-sm text-navy-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
              {complaint.description}
            </p>
          </div>

          {/* AI Analysis */}
          {aiInfo ? (
            <div className="rounded-xl border border-gov-200 bg-gov-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gov-600 text-white">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-navy-900">{translate('complaints.details.aiAnalysis')}</div>
                  <div className="text-[11px] text-gov-600 font-medium">
                    {translate('complaints.details.confidence', { value: Math.round(aiInfo.confidence * 100) })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <MetaItem compact label={translate('complaints.category')} value={translate(categoryKeys[aiInfo.category])} />
                <MetaItem compact label={translate('complaints.severityLabel')} value={<SeverityBadge severity={aiInfo.severity} />} />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{translate('complaints.details.aiSummary')}</div>
                <p className="text-sm text-navy-700 leading-relaxed">{aiInfo.summary}</p>
              </div>
            </div>
          ) : null}

          {/* Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{translate('complaints.details.statusTimeline')}</h4>
            <div className="space-y-0">
              {timeline.map((item, i) => {
                const isLast = i === timeline.length - 1;
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : item.status === 'In Progress' ? 'bg-saffron-100 text-saffron-600' : 'bg-blue-100 text-blue-600'}`}>
                        {item.status === 'Resolved' ? <CheckCircle2 className="h-4 w-4" /> : item.status === 'In Progress' ? <Clock className="h-4 w-4" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      </div>
                      {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-slate-400">· {formatDateTime(item.at, i18n.language)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{item.note}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{translate('complaints.details.by', { name: item.by })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action area (officer update form, etc.) */}
          {children}
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  compact,
}: {
  icon?: typeof MapPin;
  label: string;
  value: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : 'flex items-start gap-2.5'}>
      {Icon && !compact && <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm font-medium text-navy-800 truncate">{value}</div>
      </div>
    </div>
  );
}

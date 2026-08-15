import { Building2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-800 shadow-sm transition-transform group-hover:scale-105">
        <ShieldCheck className="h-6 w-6 text-saffron-400" strokeWidth={2.2} />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-civic-green-light border-2 border-navy-800" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-extrabold text-navy-900 text-lg tracking-tight">
            CivicPulse <span className="text-gov-600">AI</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Building2 className="h-2.5 w-2.5" /> Municipal Grievance Portal
          </div>
        </div>
      )}
    </Link>
  );
}

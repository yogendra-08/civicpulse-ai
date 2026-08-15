import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  Users,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/ui';
import type { Role } from '@/types';

const roles: { key: Role; label: string; desc: string; icon: typeof User; id: string; pass: string }[] = [
  { key: 'citizen', label: 'Citizen', desc: 'Report and track complaints', icon: User, id: 'citizen', pass: 'citizen123' },
  { key: 'officer', label: 'Field Officer', desc: 'Handle assigned complaints', icon: ShieldCheck, id: 'officer', pass: 'officer123' },
  { key: 'admin', label: 'Administrator', desc: 'Oversee all operations', icon: Users, id: 'admin', pass: 'admin123' },
];

const dashboards: Record<Role, string> = {
  citizen: '/citizen',
  officer: '/officer',
  admin: '/admin',
};

export function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  function selectRole(r: Role) {
    setSelectedRole(r);
    clearError();
    const roleData = roles.find((x) => x.key === r)!;
    setId(roleData.id);
    setPassword(roleData.pass);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      const user = await login(selectedRole, id, password);
      navigate(dashboards[user.role]);
    } catch {
      // error is set in context
    }
  }

  function fillDemo(r: Role) {
    const roleData = roles.find((x) => x.key === r)!;
    setSelectedRole(r);
    setId(roleData.id);
    setPassword(roleData.pass);
    clearError();
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="relative lg:w-1/2 bg-navy-900 text-white p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gov-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-saffron-500/10 rounded-full blur-[100px]" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2 text-navy-300 hover:text-white transition text-sm mb-12">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Logo />
          <div className="mt-12 max-w-md">
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              Sign in to the<br />
              <span className="text-gov-400">Civic Grievance Portal</span>
            </h1>
            <p className="mt-4 text-navy-200 text-lg leading-relaxed">
              Choose your role to access the dashboard. AI-powered complaint routing, real-time tracking, and analytics — all in one platform.
            </p>
          </div>
        </div>
        <div className="relative mt-12 grid grid-cols-3 gap-4">
          {[
            { v: '12,847', l: 'Resolved' },
            { v: '3.2d', l: 'Avg Time' },
            { v: '94.6%', l: 'Rate' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-navy-800/60 border border-navy-700/50 p-4">
              <div className="text-2xl font-extrabold text-white">{s.v}</div>
              <div className="text-xs text-navy-300 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {!selectedRole ? (
            <>
              <h2 className="text-2xl font-extrabold text-navy-900 mb-1">Select your role</h2>
              <p className="text-slate-500 mb-6">Choose how you'd like to sign in today.</p>
              <div className="space-y-3">
                {roles.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => selectRole(r.key)}
                    className="card w-full p-4 flex items-center gap-4 text-left hover:shadow-card-hover hover:border-gov-300 transition-all group animate-fade-in"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-800 text-white group-hover:bg-gov-600 transition-colors">
                      <r.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-navy-900">{r.label}</div>
                      <div className="text-sm text-slate-500">{r.desc}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-gov-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-lg bg-gov-50 border border-gov-100 p-4 flex gap-3">
                <Info className="h-5 w-5 text-gov-600 shrink-0 mt-0.5" />
                <div className="text-sm text-navy-700">
                  <span className="font-semibold">Demo credentials:</span> Select a role above to auto-fill, or use Citizen ID <code className="font-mono text-gov-700">citizen</code> / password <code className="font-mono text-gov-700">citizen123</code>.
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="animate-fade-in">
              <button
                type="button"
                onClick={() => { setSelectedRole(null); clearError(); }}
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 transition mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Change role
              </button>

              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const r = roles.find((x) => x.key === selectedRole)!;
                  return (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gov-600 text-white">
                        <r.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-extrabold text-navy-900">{r.label} Sign In</h2>
                        <p className="text-sm text-slate-500">{r.desc}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2.5 animate-fade-in-fast">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">User ID</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      placeholder="Enter your user ID"
                      className="input pl-10"
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="input pl-10 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-3 text-base">
                {loading ? (
                  <><Spinner className="h-5 w-5" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <div className="mt-5 rounded-lg bg-slate-100 border border-slate-200 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Demo Credentials</div>
                <div className="space-y-1.5">
                  {roles.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => fillDemo(r.key)}
                      className="w-full flex items-center justify-between text-sm hover:bg-white rounded px-2 py-1 transition"
                    >
                      <span className="font-semibold text-navy-700">{r.label}</span>
                      <span className="font-mono text-xs text-slate-500">{r.id} / {r.pass}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

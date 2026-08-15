import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Cpu,
  FileText,
  Gauge,
  MapPin,
  ShieldCheck,
  Smartphone,
  Users,
  Zap,
  TrendingUp,
  Clock,
  Award,
  Headphones,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const stats = [
  { label: 'AI-Powered Routing', value: 'Automatic', icon: Cpu, color: 'text-gov-600', bg: 'bg-gov-50' },
  { label: 'Real-Time Tracking', value: 'Live Updates', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Mobile Friendly', value: 'Any Device', icon: Smartphone, color: 'text-saffron-600', bg: 'bg-saffron-50' },
  { label: 'Secure & Private', value: 'Protected', icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
];

const workflow = [
  { step: '01', title: 'Citizen Reports', desc: 'Citizens file complaints with photos and location details through the portal.', icon: FileText, color: 'bg-gov-600' },
  { step: '02', title: 'AI Analysis', desc: 'AI engine detects category, severity, and auto-assigns the correct department.', icon: Cpu, color: 'bg-saffron-500' },
  { step: '03', title: 'Officer Action', desc: 'Field officers receive assignments, inspect sites, and update progress in real time.', icon: ClipboardList, color: 'bg-navy-700' },
  { step: '04', title: 'Track & Resolve', desc: 'Citizens track status live; admins monitor performance with analytics dashboards.', icon: BarChart3, color: 'bg-emerald-600' },
];

const citizenBenefits = [
  { title: 'Report in Minutes', desc: 'File a complaint with a photo and location — no paperwork, no office visits.', icon: Zap },
  { title: 'AI-Powered Routing', desc: 'Your complaint is automatically categorized and sent to the right department.', icon: Cpu },
  { title: 'Live Status Tracking', desc: 'Track progress from submission to resolution with real-time status updates.', icon: TrendingUp },
  { title: 'Transparent Process', desc: 'See who is handling your complaint and the full history of actions taken.', icon: ShieldCheck },
];

const municipalBenefits = [
  { title: 'Intelligent Triage', desc: 'AI prioritizes critical issues like school-zone hazards automatically.', icon: Gauge },
  { title: 'Department Analytics', desc: 'Measure resolution times, officer performance, and ward-level trends.', icon: BarChart3 },
  { title: 'Citizen Satisfaction', desc: 'Build trust with transparent, trackable, and responsive grievance handling.', icon: Award },
  { title: 'Resource Optimization', desc: 'Assign field crews efficiently based on severity and workload data.', icon: Building2 },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="section-container h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-navy-700">
            <a href="#how" className="hover:text-gov-600 transition">How It Works</a>
            <a href="#benefits" className="hover:text-gov-600 transition">Benefits</a>
            <a href="#stats" className="hover:text-gov-600 transition">Impact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/login" className="btn-primary text-sm">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gov-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-saffron-500/10 rounded-full blur-[100px]" />
        <div className="relative section-container py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-navy-800 border border-navy-700 px-3 py-1.5 text-xs font-semibold text-saffron-300 mb-6 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-saffron-400 animate-pulse" />
              Government of Springfield · Smart City Initiative
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-balance animate-fade-in">
              AI-Powered Civic Grievance
              <span className="block text-gov-400">Management for Smart Cities</span>
            </h1>
            <p className="mt-6 text-lg text-navy-200 max-w-2xl leading-relaxed animate-fade-in">
              Report potholes, water leaks, garbage, and streetlight issues in minutes.
              Our AI engine automatically categorizes, prioritizes, and routes every complaint
              to the right department — so your city resolves problems faster.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in">
              <Link to="/login" className="btn-accent text-base px-7 py-3.5">
                Report a Complaint <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="btn text-base px-7 py-3.5 bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur">
                Officer / Admin Login
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-navy-300">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure & Verified</div>
              <div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-gov-400" /> Mobile Friendly</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-saffron-400" /> 24/7 Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="section-container py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={s.label} className="card p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.bg} mb-3`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold text-navy-900">{s.value}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="bg-slate-50 border-y border-slate-200 py-16 lg:py-24">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold uppercase tracking-wider text-gov-600 mb-2">The Process</div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-navy-900">How CivicPulse AI Works</h2>
            <p className="mt-4 text-slate-600">
              From citizen report to resolution — a transparent, AI-assisted workflow that keeps everyone informed.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflow.map((w, i) => (
              <div key={w.step} className="relative card p-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${w.color} text-white mb-4`}>
                  <w.icon className="h-6 w-6" />
                </div>
                <div className="text-xs font-bold text-slate-300 mb-1">STEP {w.step}</div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{w.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{w.desc}</p>
                {i < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-slate-300">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="section-container py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gov-600 mb-2">For Citizens</div>
            <h2 className="text-3xl font-extrabold text-navy-900 mb-6">A simpler way to be heard</h2>
            <div className="space-y-4">
              {citizenBenefits.map((b) => (
                <div key={b.title} className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-card-hover transition">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gov-50 text-gov-600">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900">{b.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-saffron-600 mb-2">For Municipalities</div>
            <h2 className="text-3xl font-extrabold text-navy-900 mb-6">Govern smarter with data</h2>
            <div className="space-y-4">
              {municipalBenefits.map((b) => (
                <div key={b.title} className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-card-hover transition">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron-50 text-saffron-600">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900">{b.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-900 text-white py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gov-600/20 rounded-full blur-[120px]" />
        <div className="relative section-container text-center max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-balance">
            Ready to make your city more responsive?
          </h2>
          <p className="mt-4 text-navy-200 text-lg">
            Join thousands of citizens and officers using CivicPulse AI to build cleaner, safer neighborhoods.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/login" className="btn-accent text-base px-7 py-3.5">
              Access the Portal <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-navy-300 py-12">
        <div className="section-container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-800">
                  <ShieldCheck className="h-6 w-6 text-saffron-400" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-lg">CivicPulse AI</div>
                  <div className="text-[10px] uppercase tracking-wider text-navy-400">Municipal Grievance Portal</div>
                </div>
              </div>
              <p className="text-sm text-navy-400 max-w-sm leading-relaxed">
                An AI-powered civic grievance reporting and resolution platform for municipal corporations.
                Built for transparent, efficient, and citizen-friendly governance.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Portal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition">Citizen Login</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Officer Login</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Admin Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Headphones className="h-4 w-4" /> Helpline: 1800-200-0000</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Municipal HQ, Springfield</li>
                <li className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Dept. of Smart Governance</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-navy-400">
            <div>© 2026 CivicPulse AI · Municipal Corporation of Greater Springfield. All rights reserved.</div>
            <div className="flex gap-4">
              <span>Privacy Policy</span>
              <span>Terms of Use</span>
              <span>Accessibility</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

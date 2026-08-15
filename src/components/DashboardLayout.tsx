import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardList,
  FilePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notifications } from '@/data/mockData';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const navByRole: Record<Role, NavItem[]> = {
  citizen: [
    { label: 'Dashboard', to: '/citizen', icon: LayoutDashboard },
    { label: 'Report Complaint', to: '/citizen/report', icon: FilePlus },
    { label: 'My Complaints', to: '/citizen', icon: ClipboardList },
  ],
  officer: [
    { label: 'Dashboard', to: '/officer', icon: LayoutDashboard },
    { label: 'Assigned Complaints', to: '/officer', icon: ClipboardList },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  ],
};

function roleLabel(role: Role): string {
  return role === 'citizen' ? 'Citizen' : role === 'officer' ? 'Field Officer' : 'Administrator';
}

function userMeta(user: ReturnType<typeof useAuth>['user']) {
  if (!user) return { primary: '', secondary: '' };
  if (user.role === 'citizen') return { primary: user.name, secondary: `Resident · ${user.ward}` };
  if (user.role === 'officer') return { primary: user.name, secondary: `${user.rank} · ${user.badge}` };
  return { primary: user.name, secondary: user.municipality };
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;
  const items = navByRole[user.role];
  const meta = userMeta(user);
  const unread = notifications.filter((n) => !n.read).length;

  const isActive = (to: string) =>
    to === `/${user.role}` ? location.pathname === to : location.pathname.startsWith(to);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy-900 text-navy-100 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-navy-700/50">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800">
              <ShieldCheck className="h-5 w-5 text-saffron-400" />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-white text-base">
                CivicPulse <span className="text-gov-400">AI</span>
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-navy-300">
                {roleLabel(user.role)} Portal
              </div>
            </div>
          </Link>
          <button
            className="lg:hidden text-navy-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-navy-400">
            Menu
          </div>
          {items.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gov-600 text-white shadow-sm'
                    : 'text-navy-200 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-navy-700/50">
          <div className="rounded-lg bg-navy-800/60 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-500 text-white text-sm font-bold">
                {meta.primary.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{meta.primary}</div>
                <div className="text-[11px] text-navy-300 truncate">{meta.secondary}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 shadow-nav flex items-center px-4 sm:px-6 gap-3">
          <button
            className="lg:hidden text-navy-700 hover:bg-slate-100 p-2 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search complaints, wards..."
                className="w-full rounded-lg bg-slate-100 border border-transparent pl-9 pr-3 py-2 text-sm text-navy-800 placeholder:text-slate-400 focus:bg-white focus:border-gov-400 focus:outline-none focus:ring-2 focus:ring-gov-100 transition"
              />
            </div>
          </div>

          <div className="flex-1 sm:hidden" />

          <div className="relative">
            <button
              className="relative p-2 rounded-lg text-navy-700 hover:bg-slate-100 transition"
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-saffron-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-card-hover z-40 animate-scale-in origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-navy-900 text-sm">Notifications</span>
                    <span className="text-xs text-slate-400">{unread} unread</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 flex gap-3 ${!n.read ? 'bg-gov-50/50' : ''}`}>
                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-slate-300' : n.type === 'alert' ? 'bg-red-500' : 'bg-gov-500'}`} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-navy-800">{n.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{n.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-slate-100 transition"
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-800 text-white text-sm font-bold">
                {meta.primary.charAt(0)}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-sm font-semibold text-navy-800">{meta.primary.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-400">{roleLabel(user.role)}</div>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-slate-400" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-card-hover z-40 animate-scale-in origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-bold text-navy-900">{meta.primary}</div>
                    <div className="text-xs text-slate-500">{meta.secondary}</div>
                  </div>
                  <div className="py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}

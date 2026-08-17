import type { AuthUser, Role } from '@/types';

const creds: Record<Role, { id: string; password: string }> = {
  citizen: { id: 'citizen', password: 'citizen123' },
  officer: { id: 'officer', password: 'officer123' },
  admin: { id: 'admin', password: 'admin123' },
};

const users: Record<Role, AuthUser> = {
  citizen: {
    role: 'citizen',
    id: 'cit-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@citizen.gov.in',
    ward: 'Ward 12',
    phone: '+91 98765 43210',
    joinedAt: '2026-01-15T00:00:00Z',
  },
  officer: {
    role: 'officer',
    id: 'off-1',
    officerRecordId: 'off-1',
    name: 'Suresh Kamble',
    email: 'suresh.kamble@mcgov.in',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Infrastructure',
    ward: 'Ward 12',
    badge: 'R-2041',
    rank: 'Field Officer',
  },
  admin: {
    role: 'admin',
    id: 'adm-1',
    name: 'Commissioner R. Iyer',
    email: 'commissioner@mcgov.in',
    municipality: 'Municipal Corporation of Greater Springfield',
  },
};

const STORAGE_KEY = 'civicpulse.session';

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const authService = {
  async login(role: Role, id: string, password: string): Promise<AuthUser> {
    await delay(650);
    const expected = creds[role];
    if (id.trim().toLowerCase() !== expected.id || password !== expected.password) {
      throw new Error('Invalid credentials. Please check your ID and password.');
    }
    const user = users[role];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },
  current(): AuthUser | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  logout() {
    sessionStorage.removeItem(STORAGE_KEY);
  },
};

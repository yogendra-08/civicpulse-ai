import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Users,
  Search,
  Shield,
  MoreVertical,
  User,
  Building2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/services/realAuthService';
import type { Role } from '@/types';

type UserRole = 'citizen' | 'officer' | 'admin';

interface UserRow {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  ward?: string;
  department?: string;
  badge?: string;
  created_at: string;
}

export function UserManagementPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState<UserRole | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (filter === 'citizen') {
        const { data, error } = await supabase
          .from('citizen_profiles')
          .select('*, auth.users!inner(email, created_at, raw_user_meta_data)')
          .order('created_at', { ascending: false });

        if (error) throw error;

        type QueryUserRow = {
          user_id?: string;
          id?: string;
          email?: string;
          auth_users?: { email?: string; created_at?: string };
          full_name?: string;
          name?: string;
          ward?: string;
          departments?: { name?: string };
          badge_number?: string;
          created_at?: string;
        };

        const userRows: UserRow[] = ((data || []) as QueryUserRow[]).map((u) => ({
          id: u.user_id || u.id || '',
          email: u.email || u.auth_users?.email || '',
          role: 'citizen',
          name: u.full_name || u.name,
          ward: u.ward,
          department: u.departments?.name,
          badge: u.badge_number,
          created_at: u.created_at || u.auth_users?.created_at || new Date().toISOString(),
        }));

        setUsers(userRows);
        return;
      }

      if (filter === 'officer') {
        const { data, error } = await supabase
          .from('officers')
          .select('*, departments(name), auth.users!inner(email, created_at, raw_user_meta_data)')
          .order('created_at', { ascending: false });

        if (error) throw error;

        type QueryUserRow = {
          user_id?: string;
          id?: string;
          email?: string;
          auth_users?: { email?: string; created_at?: string };
          full_name?: string;
          name?: string;
          ward?: string;
          departments?: { name?: string };
          badge_number?: string;
          created_at?: string;
        };

        const userRows: UserRow[] = ((data || []) as QueryUserRow[]).map((u) => ({
          id: u.user_id || u.id || '',
          email: u.email || u.auth_users?.email || '',
          role: 'officer',
          name: u.full_name || u.name,
          ward: u.ward,
          department: u.departments?.name,
          badge: u.badge_number,
          created_at: u.created_at || u.auth_users?.created_at || new Date().toISOString(),
        }));

        setUsers(userRows);
        return;
      }

      const { data: authUsers } = await supabase.auth.admin.listUsers();

      type AuthUserSummary = {
        id: string;
        email?: string;
        created_at: string;
        user_metadata?: { role?: UserRole; full_name?: string };
      };

      const userRows: UserRow[] = (authUsers?.users ?? []).map((u: AuthUserSummary) => ({
        id: u.id,
        email: u.email || '',
        role: u.user_metadata?.role || 'citizen',
        name: u.user_metadata?.full_name,
        created_at: u.created_at,
      }));

      setUsers(userRows);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const roleLabel = (role: Role) => t(`roles.${role}`);

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      citizen: 'bg-saffron-100 text-saffron-700',
      officer: 'bg-gov-100 text-gov-700',
      admin: 'bg-navy-100 text-navy-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[role]}`}>
        {roleLabel(role)}
      </span>
    );
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === 'officer') return Building2;
    if (role === 'admin') return Shield;
    return User;
  };

  const filterLabel = (role: UserRole | 'all') => {
    if (role === 'all') return t('admin.allUsers');
    return roleLabel(role);
  };

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {t('admin.backToAdminDashboard')}
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 mb-1">{t('admin.userManagement')}</h1>
          <p className="text-slate-500">{t('admin.userManagementDescription')}</p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('admin.searchUsers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'citizen', 'officer', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === role
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filterLabel(role)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">{t('admin.loadingUsers')}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>{t('admin.noUsersFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('admin.user')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('admin.role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('admin.details')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('admin.joined')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((u) => {
                  const RoleIcon = getRoleIcon(u.role);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <RoleIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-navy-900">{u.name || t('admin.unknown')}</div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {u.ward && <div>{t('admin.wardLabel')}: {u.ward}</div>}
                          {u.department && <div>{t('admin.dept')}: {u.department}</div>}
                          {u.badge && <div>{t('admin.badgeLabel')}: {u.badge}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-slate-500">
        {t('admin.showingUsers', { count: filteredUsers.length })}
      </div>
    </DashboardLayout>
  );
}

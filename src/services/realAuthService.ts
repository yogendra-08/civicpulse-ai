import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser, Role } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_KEY = 'civicpulse.session';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  ward?: string;
  address?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const realAuthService = {
  // Register new citizen
  async registerCitizen(data: RegisterData): Promise<{ user: AuthUser; error: string | null }> {
    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'citizen' as Role,
            full_name: data.fullName,
            phone: data.phone,
            ward: data.ward,
            address: data.address,
          },
        },
      });

      if (authError) {
        return { user: null as unknown as AuthUser, error: authError.message };
      }

      if (!authData.user) {
        return { user: null as unknown as AuthUser, error: 'Registration failed' };
      }

      // Create citizen profile
      const { error: profileError } = await supabase
        .from('citizen_profiles')
        .upsert(
          {
            user_id: authData.user.id,
            full_name: data.fullName,
            phone: data.phone,
            ward: data.ward,
            address: data.address,
          },
          { onConflict: 'user_id' }
        );

      if (profileError) {
        // Rollback auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { user: null as unknown as AuthUser, error: profileError.message };
      }

      // Create auth user object
      const authUser: AuthUser = {
        role: 'citizen',
        id: authData.user.id,
        name: data.fullName,
        email: data.email,
        ward: data.ward ?? '',
        phone: data.phone ?? '',
        joinedAt: authData.user.created_at,
      };

      return { user: authUser, error: null };
    } catch (error) {
      return {
        user: null as unknown as AuthUser,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  // Login with email and password
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        return { user: null as unknown as AuthUser, error: authError.message };
      }

      if (!authData.user) {
        return { user: null as unknown as AuthUser, error: 'Login failed' };
      }

      // Get user role from metadata
      const role = authData.user.user_metadata?.role as Role || 'citizen';

      let authUser: AuthUser;

      if (role === 'citizen') {
        // Get citizen profile
        const { data: profile } = await supabase
          .from('citizen_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        authUser = {
          role: 'citizen',
          id: authData.user.id,
          name: profile?.full_name || authData.user.user_metadata?.full_name || 'Citizen',
          email: authData.user.email!,
          ward: profile?.ward ?? '',
          phone: profile?.phone ?? '',
          joinedAt: authData.user.created_at,
        };
      } else if (role === 'officer') {
        // Get officer profile
        const { data: officer } = await supabase
          .from('officers')
          .select('*, departments(*)')
          .eq('user_id', authData.user.id)
          .single();

        authUser = {
          role: 'officer',
          id: authData.user.id,
          officerRecordId: officer?.id ?? '',
          name: authData.user.user_metadata?.full_name || 'Officer',
          email: authData.user.email!,
          departmentId: officer?.department_id ?? '',
          departmentName: officer?.departments?.name ?? '',
          ward: officer?.ward ?? '',
          badge: officer?.badge_number ?? '',
          rank: officer?.rank ?? '',
        };
      } else if (role === 'admin') {
        authUser = {
          role: 'admin',
          id: authData.user.id,
          name: authData.user.user_metadata?.full_name || 'Administrator',
          email: authData.user.email!,
          municipality: authData.user.user_metadata?.municipality || 'Municipal Corporation',
        };
      } else {
        return { user: null as unknown as AuthUser, error: 'Invalid user role' };
      }

      // Store session
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

      // Log login action
      await supabase.from('audit_logs').insert({
        user_id: authData.user.id,
        user_role: role,
        action: 'login',
        table_name: 'auth',
      });

      return { user: authUser, error: null };
    } catch (error) {
      return {
        user: null as unknown as AuthUser,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  // Logout
  async logout(): Promise<{ error: string | null }> {
    try {
      const user = this.current();
      
      // Log logout action if user exists
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          user_role: user.role,
          action: 'logout',
          table_name: 'auth',
        });
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Clear local session
      sessionStorage.removeItem(STORAGE_KEY);

      return { error: error?.message || null };
    } catch (error) {
      sessionStorage.removeItem(STORAGE_KEY);
      return { 
        error: error instanceof Error ? error.message : 'Logout failed' 
      };
    }
  },

  // Get current user from session storage
  current(): AuthUser | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error: error?.message || null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Password reset failed' 
      };
    }
  },

  // Update password
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ error: string | null }> {
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: this.current()?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        return { error: 'Current password is incorrect' };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error: error?.message || null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Password update failed' 
      };
    }
  },

  // Update profile (wrapper for updateCitizenProfile)
  async updateProfile(data: {
    full_name?: string;
    phone?: string;
    ward?: string;
    address?: string;
  }): Promise<{ error: string | null }> {
    const user = this.current();
    if (!user || user.role !== 'citizen') {
      return { error: 'User not authenticated or not a citizen' };
    }

    return this.updateCitizenProfile(user.id, {
      fullName: data.full_name,
      phone: data.phone,
      ward: data.ward,
      address: data.address,
    });
  },

  // Update citizen profile
  async updateCitizenProfile(userId: string, data: {
    fullName?: string;
    phone?: string;
    ward?: string;
    address?: string;
  }): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('citizen_profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          ward: data.ward,
          address: data.address,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Update local session if name changed
      if (data.fullName) {
        const currentUser = this.current();
        if (currentUser && currentUser.id === userId) {
          currentUser.name = data.fullName;
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
        }
      }

      return { error: error?.message || null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.current() !== null;
  },

  // Get user role
  getUserRole(): Role | null {
    const user = this.current();
    return user?.role || null;
  },

  // Refresh session
  async refreshSession(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.refreshSession();
      return { error: error?.message || null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Session refresh failed' 
      };
    }
  },
};

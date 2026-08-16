import { createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { realAuthService } from '@/services/realAuthService';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearError: () => void;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    ward?: string;
    address?: string;
  }) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => realAuthService.current());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = realAuthService.current();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user: authUser, error: loginError } = await realAuthService.login({ email, password });
      
      if (loginError) {
        setError(loginError);
        throw new Error(loginError);
      }
      
      setUser(authUser);
      return authUser;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await realAuthService.logout();
      setUser(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    ward?: string;
    address?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { user: authUser, error: registerError } = await realAuthService.registerCitizen(data);
      
      if (registerError) {
        setError(registerError);
        throw new Error(registerError);
      }
      
      setUser(authUser);
      return authUser;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ user, loading, error, login, logout, register, clearError }),
    [user, loading, error, login, logout, register, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

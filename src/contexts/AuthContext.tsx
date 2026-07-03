import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  authApi,
  STAFF_TOKEN_KEY,
  TENANT_TOKEN_KEY,
  ORG_ID_KEY,
  isApiConfigured,
  type StaffUser,
} from '../lib/api';
import type { TenantProfile } from '../types/database';

interface AuthContextValue {
  staffUser: StaffUser | null;
  loading: boolean;
  isStaff: boolean;
  tenantToken: string | null;
  tenantProfile: TenantProfile | null;
  signInStaff: (organizationId: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOutStaff: () => Promise<void>;
  signInTenant: (organizationId: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOutTenant: () => void;
  refreshTenantProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantToken, setTenantToken] = useState<string | null>(
    () => localStorage.getItem(TENANT_TOKEN_KEY)
  );
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem(STAFF_TOKEN_KEY);
      if (!token || !isApiConfigured) {
        setLoading(false);
        return;
      }
      try {
        const user = await authApi.staffMe();
        setStaffUser(user);
        localStorage.setItem(ORG_ID_KEY, user.organization_id);
      } catch {
        localStorage.removeItem(STAFF_TOKEN_KEY);
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (tenantToken && isApiConfigured) {
      refreshTenantProfile();
    } else {
      setTenantProfile(null);
    }
  }, [tenantToken]);

  async function refreshTenantProfile() {
    if (!tenantToken) return;
    try {
      const profile = await authApi.tenantMe();
      setTenantProfile(profile);
      localStorage.setItem(ORG_ID_KEY, profile.organization_id);
    } catch {
      localStorage.removeItem(TENANT_TOKEN_KEY);
      setTenantToken(null);
      setTenantProfile(null);
    }
  }

  async function signInStaff(organizationId: string, email: string, password: string) {
    try {
      const { token, user } = await authApi.staffLogin(organizationId, email, password);
      localStorage.setItem(STAFF_TOKEN_KEY, token);
      localStorage.setItem(ORG_ID_KEY, user.organization_id);
      setStaffUser(user);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Login failed' };
    }
  }

  async function signOutStaff() {
    await authApi.staffLogout();
    localStorage.removeItem(STAFF_TOKEN_KEY);
    setStaffUser(null);
  }

  async function signInTenant(organizationId: string, email: string, password: string) {
    try {
      const { token, user } = await authApi.tenantLogin(organizationId, email, password);
      localStorage.setItem(TENANT_TOKEN_KEY, token);
      localStorage.setItem(ORG_ID_KEY, user.organization_id);
      setTenantToken(token);
      setTenantProfile(user);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Login failed' };
    }
  }

  function signOutTenant() {
    localStorage.removeItem(TENANT_TOKEN_KEY);
    setTenantToken(null);
    setTenantProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        staffUser,
        loading,
        isStaff: !!staffUser,
        tenantToken,
        tenantProfile,
        signInStaff,
        signOutStaff,
        signInTenant,
        signOutTenant,
        refreshTenantProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

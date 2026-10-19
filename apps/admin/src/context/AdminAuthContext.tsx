import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createApiClient } from '@simply/api-contracts';

export const api = createApiClient('/api/platform');
interface AdminUser {
  userId: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  isPlatformAdmin: boolean;
  fullName?: string;
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
}
interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (identifier: string, secret: string) => Promise<void>;
  logout: () => Promise<void>;
  api: typeof api;
}
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);
export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AdminUser | null>(null),
    [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    // Discard legacy client-trusted sessions. The HttpOnly cookie is validated by the backend.
    localStorage.removeItem('simply_admin_token');
    localStorage.removeItem('simply_admin_user');
    let active = true;
    api.setOnAuthFailure(() => {
      setUser(null);
      void router.replace('/login');
    });
    fetch('/api/admin-session')
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (active) setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      api.setOnAuthFailure(undefined);
    };
  }, []);
  useEffect(() => {
    if (!loading) {
      if (!user && router.pathname !== '/login') void router.replace('/login');
      else if (user && router.pathname === '/login') void router.replace('/');
    }
  }, [user, loading, router.pathname]);
  const login = async (identifier: string, secret: string) => {
    const response = await fetch('/api/admin-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, secret }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message || data.message || 'Login failed.');
    setUser(data.user);
    await router.replace('/');
  };
  const logout = async () => {
    try {
      await fetch('/api/admin-session', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      setUser(null);
      await router.replace('/login');
    }
  };
  const showPage = router.pathname === '/login' || (!loading && user);
  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout, api }}>
      {showPage ? (
        children
      ) : (
        <div role="status" className="p-8 text-sm">
          Checking admin session…
        </div>
      )}
    </AdminAuthContext.Provider>
  );
};
export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('AdminAuthProvider required');
  return ctx;
}

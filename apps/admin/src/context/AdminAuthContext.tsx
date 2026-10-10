import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createApiClient } from '@simply/api-contracts';

export const api = createApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
);

interface AdminUser {
  userId: string;
  email: string | null;
  phone: string | null;
  role: string;
  isPlatformAdmin: boolean;
  fullName?: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, secret: string) => Promise<void>;
  logout: () => void;
  api: typeof api;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('simply_admin_token') : null;
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('simply_admin_user') : null;

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        api.setToken(savedToken);
      } catch {
        localStorage.removeItem('simply_admin_token');
        localStorage.removeItem('simply_admin_user');
      }
    }
    setLoading(false);
  }, []);

  // Route protection
  useEffect(() => {
    if (!loading) {
      const isLoginPage = router.pathname === '/login';
      if (!user && !isLoginPage) {
        router.push('/login');
      } else if (user && isLoginPage) {
        router.push('/');
      }
    }
  }, [user, loading, router.pathname]);

  const login = async (identifier: string, secret: string) => {
    const res = await api.auth.loginAdmin(identifier, secret);
    const tokenStr = res.accessToken || res.tokens?.accessToken;
    const userData = res.user;

    if (!tokenStr) {
      throw new Error('No access token received from authentication server.');
    }

    setToken(tokenStr);
    setUser(userData);
    api.setToken(tokenStr);

    if (typeof window !== 'undefined') {
      localStorage.setItem('simply_admin_token', tokenStr);
      localStorage.setItem('simply_admin_user', JSON.stringify(userData));
    }

    router.push('/');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    api.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('simply_admin_token');
      localStorage.removeItem('simply_admin_user');
    }
    router.push('/login');
  };

  return (
    <AdminAuthContext.Provider value={{ user, token, loading, login, logout, api }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
};

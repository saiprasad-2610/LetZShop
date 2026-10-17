import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { AdminAttentionSummary } from '@simply/api-contracts';
import { useAdminAuth } from './AdminAuthContext';

interface AdminAttentionContextValue {
  attention: AdminAttentionSummary | null;
  loading: boolean;
  refreshAttention: () => Promise<void>;
  setAttention: React.Dispatch<React.SetStateAction<AdminAttentionSummary | null>>;
}

const AdminAttentionContext = createContext<AdminAttentionContextValue | undefined>(
  undefined,
);

export const AdminAttentionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, api } = useAdminAuth();
  const [attention, setAttention] = useState<AdminAttentionSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshAttention = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.request<AdminAttentionSummary>(
        'admin/attention-summary',
      );
      setAttention(data);
    } catch {
      // Graceful degradation when network/backend is briefly unavailable
    } finally {
      setLoading(false);
    }
  }, [user, api]);

  useEffect(() => {
    if (user) {
      void refreshAttention();
    } else {
      setAttention(null);
    }
  }, [user, refreshAttention]);

  // Proactively refresh badges on window focus to ensure multi-tab freshness
  useEffect(() => {
    const onFocus = () => {
      if (user) void refreshAttention();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, refreshAttention]);

  return (
    <AdminAttentionContext.Provider
      value={{ attention, loading, refreshAttention, setAttention }}
    >
      {children}
    </AdminAttentionContext.Provider>
  );
};

export function useAdminAttention() {
  const ctx = useContext(AdminAttentionContext);
  if (!ctx) {
    throw new Error(
      'useAdminAttention must be used within an AdminAttentionProvider',
    );
  }
  return ctx;
}

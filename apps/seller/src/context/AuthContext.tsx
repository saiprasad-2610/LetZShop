import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SimplyApiClient, createApiClient } from '@simply/api-contracts';

export const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
);

// Synchronously initialize token from localStorage in browser context
// so requests triggered during initial component mounts are immediately authenticated
if (typeof window !== 'undefined') {
  try {
    const initToken = localStorage.getItem('simply_seller_token');
    if (initToken) apiClient.setToken(initToken);
    const initRefresh = localStorage.getItem('simply_seller_refresh_token');
    if (initRefresh) apiClient.setRefreshToken(initRefresh);
  } catch (e) {
    // Ignore storage errors
  }
}

interface AuthContextType {
  user: any | null;
  store: any | null;
  token: string | null;
  loading: boolean;
  api: SimplyApiClient;
  login: (token: string, user: any, store?: any, refreshToken?: string) => void;
  logout: () => Promise<void>;
  setStoreContext: (store: any) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  store: null,
  token: null,
  loading: true,
  api: apiClient,
  login: () => {},
  logout: async () => {},
  setStoreContext: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = localStorage.getItem('simply_seller_user');
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [store, setStore] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const s = localStorage.getItem('simply_seller_store');
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('simply_seller_token');
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('simply_seller_token');
    }
    return true;
  });
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('simply_seller_token');
    const savedRefreshToken = localStorage.getItem('simply_seller_refresh_token');
    const savedUser = localStorage.getItem('simply_seller_user');
    const savedStore = localStorage.getItem('simply_seller_store');

    apiClient.setOnTokenRefreshed((newAccess, newRefresh) => {
      setToken(newAccess);
      localStorage.setItem('simply_seller_token', newAccess);
      if (newRefresh) {
        localStorage.setItem('simply_seller_refresh_token', newRefresh);
      }
    });

    if (savedToken) {
      setToken(savedToken);
      apiClient.setToken(savedToken);
      if (savedRefreshToken) {
        apiClient.setRefreshToken(savedRefreshToken);
      }
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedStore) setStore(JSON.parse(savedStore));

      // Validate session and refresh current store
      apiClient.stores
        .getMyStore()
        .then((s) => {
          setStore(s);
          localStorage.setItem('simply_seller_store', JSON.stringify(s));
          setLoading(false);
        })
        .catch(async (err) => {
          if (err?.status === 404) {
            // User is authenticated but store has not been created yet (ONBOARDING_REQUIRED)
            setStore(null);
            localStorage.removeItem('simply_seller_store');
            setLoading(false);
            return;
          }

          if (err?.status === 401 && savedRefreshToken) {
            try {
              const refreshed = await apiClient.auth.refreshSession(savedRefreshToken);
              if (refreshed?.accessToken) {
                setToken(refreshed.accessToken);
                apiClient.setToken(refreshed.accessToken);
                localStorage.setItem('simply_seller_token', refreshed.accessToken);
                if (refreshed.refreshToken) {
                  apiClient.setRefreshToken(refreshed.refreshToken);
                  localStorage.setItem('simply_seller_refresh_token', refreshed.refreshToken);
                }

                try {
                  const s = await apiClient.stores.getMyStore();
                  setStore(s);
                  localStorage.setItem('simply_seller_store', JSON.stringify(s));
                } catch (storeErr: any) {
                  if (storeErr?.status === 404) {
                    setStore(null);
                    localStorage.removeItem('simply_seller_store');
                  }
                }
                setLoading(false);
                return;
              }
            } catch {
              // Refresh token revoked or expired
            }
          }

          // If session invalid and cannot be refreshed, clear expired session
          if (err?.status === 401) {
            setToken(null);
            setUser(null);
            setStore(null);
            apiClient.setToken(null);
            apiClient.setRefreshToken(null);
            localStorage.removeItem('simply_seller_token');
            localStorage.removeItem('simply_seller_refresh_token');
            localStorage.removeItem('simply_seller_user');
            localStorage.removeItem('simply_seller_store');
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: any, newStore?: any, newRefreshToken?: string) => {
    setToken(newToken);
    setUser(newUser);
    if (newStore) {
      setStore(newStore);
    } else {
      setStore(null);
      localStorage.removeItem('simply_seller_store');
    }

    apiClient.setToken(newToken);
    localStorage.setItem('simply_seller_token', newToken);
    localStorage.setItem('simply_seller_user', JSON.stringify(newUser));
    if (newStore) {
      localStorage.setItem('simply_seller_store', JSON.stringify(newStore));
    }
    if (newRefreshToken) {
      apiClient.setRefreshToken(newRefreshToken);
      localStorage.setItem('simply_seller_refresh_token', newRefreshToken);
    }
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setToken(null);
    setUser(null);
    setStore(null);
    apiClient.setToken(null);
    apiClient.setRefreshToken(null);
    localStorage.removeItem('simply_seller_token');
    localStorage.removeItem('simply_seller_refresh_token');
    localStorage.removeItem('simply_seller_user');
    localStorage.removeItem('simply_seller_store');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('simply_onboarding_draft');
    }
    router.push('/login');
  };

  const setStoreContext = (newStore: any) => {
    setStore(newStore);
    localStorage.setItem('simply_seller_store', JSON.stringify(newStore));
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const s = await apiClient.stores.getMyStore();
      setStore(s);
      localStorage.setItem('simply_seller_store', JSON.stringify(s));
    } catch (e) {
      console.error('Failed to refresh store profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        token,
        loading,
        api: apiClient,
        login,
        logout,
        setStoreContext,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SimplyApiClient, createApiClient } from '@simply/api-contracts';

export const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
);

interface AuthContextType {
  user: any | null;
  store: any | null;
  token: string | null;
  loading: boolean;
  api: SimplyApiClient;
  login: (token: string, user: any, store?: any) => void;
  logout: () => void;
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
  logout: () => {},
  setStoreContext: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [store, setStore] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('simply_seller_token');
    const savedUser = localStorage.getItem('simply_seller_user');
    const savedStore = localStorage.getItem('simply_seller_store');

    if (savedToken) {
      setToken(savedToken);
      apiClient.setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedStore) setStore(JSON.parse(savedStore));

      // Validate session and refresh current store
      apiClient.stores
        .getMyStore()
        .then((s) => {
          setStore(s);
          localStorage.setItem('simply_seller_store', JSON.stringify(s));
        })
        .catch(() => {
          // If token expired or invalid, handle gracefully
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: any, newStore?: any) => {
    setToken(newToken);
    setUser(newUser);
    if (newStore) setStore(newStore);

    apiClient.setToken(newToken);
    localStorage.setItem('simply_seller_token', newToken);
    localStorage.setItem('simply_seller_user', JSON.stringify(newUser));
    if (newStore) localStorage.setItem('simply_seller_store', JSON.stringify(newStore));
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
    localStorage.removeItem('simply_seller_token');
    localStorage.removeItem('simply_seller_user');
    localStorage.removeItem('simply_seller_store');
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

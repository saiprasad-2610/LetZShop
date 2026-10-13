import React, { createContext, useContext, useEffect, useState } from 'react';

export type MerchantTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: MerchantTheme;
  setTheme: (theme: MerchantTheme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  mounted: false,
});

export const MERCHANT_THEME_STORAGE_KEY = 'simply_merchant_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<MerchantTheme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MERCHANT_THEME_STORAGE_KEY) as MerchantTheme | null;
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial: MerchantTheme = prefersDark ? 'dark' : 'light';
        setThemeState(initial);
        applyTheme(initial);
      }
    } catch {
      // ignore SSR or storage exceptions
    }
    setMounted(true);
  }, []);

  const applyTheme = (nextTheme: MerchantTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-merchant-theme', nextTheme);
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setTheme = (nextTheme: MerchantTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    try {
      localStorage.setItem(MERCHANT_THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore storage exceptions
    }
  };

  const toggleTheme = () => {
    const nextTheme: MerchantTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useMerchantTheme = () => useContext(ThemeContext);

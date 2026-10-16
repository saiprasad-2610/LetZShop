import React, { createContext, useContext, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
type Theme = 'light' | 'dark';
const Context = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});
const key = 'letzshop_admin_theme';
function apply(theme: Theme) {
  document.documentElement.dataset.adminTheme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}
export function AdminThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    let initial: Theme = 'light';
    try {
      const saved = localStorage.getItem(key);
      initial =
        saved === 'light' || saved === 'dark'
          ? saved
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    } catch {}
    setTheme(initial);
    apply(initial);
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(key, next);
    } catch {}
  };
  return (
    <Context.Provider value={{ theme, toggle }}>{children}</Context.Provider>
  );
}
export function AdminThemeToggle() {
  const { theme, toggle } = useContext(Context);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
      title={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
      className="admin-secondary flex items-center gap-2"
    >
      <span aria-hidden="true">
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </span>
      <span className="hidden sm:inline text-xs">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, LogOut } from 'lucide-react';
import { AdminThemeToggle } from '../context/AdminThemeContext';
import { useAdminAuth } from '../context/AdminAuthContext';
const nav = [
  ['Dashboard', '/'],
  ['Merchants', '/merchants'],
  ['Reviews & Reports', '/reviews'],
  ['Subscriptions', '/billing'],
  ['Payments', '/payments'],
  ['Users', '/users'],
  ['Settings', '/settings'],
  ['Audit Logs', '/audit-logs'],
];
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAdminAuth(),
    router = useRouter(),
    [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-admin-bg">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 bg-admin-header px-4 text-white">
        <div className="flex items-center gap-3">
          <AdminThemeToggle />
          <button
            className="md:hidden p-2"
            aria-label="Toggle admin navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <Link
            href="/"
            className="font-bold tracking-wide text-sm sm:text-base text-white"
          >
            LETZSHOP ADMIN
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-slate-300">
            {user?.fullName || user?.email || user?.phone || 'Platform Admin'}
          </span>
          <button
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-lg bg-admin-primary text-admin-on-primary px-3 py-2 text-xs"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>
      <div className="flex min-w-0">
        <aside
          aria-label="Admin navigation"
          className={`${open ? 'block' : 'hidden'} fixed inset-y-16 left-0 z-30 w-56 overflow-y-auto border-r bg-admin-surface p-4 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] md:shrink-0`}
        >
          <nav className="space-y-1">
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${(href === '/' ? router.pathname === '/' : router.pathname.startsWith(href)) ? 'bg-admin-soft text-admin-accent' : 'text-admin-secondary hover:bg-admin-raised'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <details className="mt-6 text-xs text-admin-muted">
            <summary className="cursor-pointer px-3">Existing tools</summary>
            {[
              ['Commerce', '/commerce'],
              ['Themes', '/themes'],
              ['Analytics', '/analytics'],
              ['Operations', '/operations'],
            ].map(([label, href]) => (
              <Link className="block px-3 py-2" key={href} href={href}>
                {label}
              </Link>
            ))}
          </details>
        </aside>
        <main className="min-w-0 flex-1 max-w-7xl mx-auto p-4 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
};

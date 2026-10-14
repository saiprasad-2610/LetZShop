import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Store, 
  Users,
  ShoppingBag, 
  CreditCard, 
  Palette, 
  BarChart3,
  Sliders,
  Activity, 
  ShieldCheck, 
  LogOut,
  ExternalLink 
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getStorefrontUrl } from '../utils/config';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAdminAuth();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Merchants & Tenants', href: '/merchants', icon: Store },
    { label: 'Users & Governance', href: '/users', icon: Users },
    { label: 'Commerce Monitor', href: '/commerce', icon: ShoppingBag },
    { label: 'Billing & Plans', href: '/billing', icon: CreditCard },
    { label: 'Themes Catalog', href: '/themes', icon: Palette },
    { label: 'SaaS Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Platform Settings', href: '/settings', icon: Sliders },
    { label: 'Operations & Audits', href: '/operations', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Admin Navigation Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-slate-950 font-black text-base flex items-center justify-center shadow-md shadow-emerald-500/20">
              S
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                Shop<span className="text-emerald-400">On</span>Go
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Platform SuperAdmin
              </span>
            </div>
          </Link>
        </div>

        {/* Telemetry & Quick Links & Profile */}
        <div className="flex items-center gap-4 text-xs">
          {/* System Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[11px]">All 4 Systems Online</span>
          </div>

          {/* Cross-App Links */}
          <div className="hidden lg:flex items-center gap-3 border-l border-slate-800 pl-4 text-slate-400">
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition"
              title="Open Seller Portal"
            >
              <span>Seller Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={getStorefrontUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition"
              title="Open Buyer Storefront"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Admin User Profile & Sign Out */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white leading-tight">
                {user?.fullName || 'Platform SuperAdmin'}
              </span>
              <span className="block text-[10px] text-emerald-400 font-mono uppercase">
                {user?.email || 'admin@shopongo.com'}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 text-slate-300 text-xs font-semibold transition cursor-pointer"
              title="Sign Out of SuperAdmin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-6 flex-shrink-0 hidden md:block">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
              Platform Governance
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/' ? router.pathname === '/' : router.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Compliance & Tenant Security Badge */}
          <div className="pt-6 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero-Trust Architecture</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                PostgreSQL RLS tenant isolation enforced across all merchant databases.
              </p>
            </div>
          </div>
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

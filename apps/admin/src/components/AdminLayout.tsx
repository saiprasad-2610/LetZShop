import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingBag, 
  CreditCard, 
  Palette, 
  Activity, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Merchants & Tenants', href: '/merchants', icon: Store },
    { label: 'Commerce Monitor', href: '/commerce', icon: ShoppingBag },
    { label: 'Billing & Plans', href: '/billing', icon: CreditCard },
    { label: 'Themes Catalog', href: '/themes', icon: Palette },
    { label: 'Operations & Audits', href: '/operations', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Admin Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow">
            A
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-none">
              Simply Platform Admin
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              SaaS Control Plane
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">All Systems Operational</span>
          </div>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <span>Seller Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-6 flex-shrink-0 hidden md:block">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
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

          {/* Compliance & Security Callout */}
          <div className="pt-6 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Tenant Isolation</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                PostgreSQL RLS defense-in-depth enforced across all merchant databases.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Package,
  ShoppingBag,
  Users,
  Palette,
  Megaphone,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  CreditCard,
  ShieldCheck,
  Store,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, actions }) => {
  const { user, store, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Orders', href: '/orders', icon: ShoppingBag },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Store Design', href: '/brand-studio', icon: Palette },
    { label: 'Marketing', href: '/marketing', icon: Megaphone },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const getStatusBadge = () => {
    const status = store?.status || 'PRIVATE_PREVIEW';
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            EXPIRED
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            SUSPENDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            PRIVATE PREVIEW
          </span>
        );
    }
  };

  const storefrontUrl = store?.slug
    ? store.status === 'LIVE'
      ? `http://localhost:3000/store/${store.slug}`
      : `http://localhost:3000/store/${store.slug}?preview=true`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar (Left) */}
      <aside
        aria-label="Merchant Navigation"
        className="hidden md:flex flex-col w-64 bg-slate-950 text-slate-100 min-h-screen fixed left-0 top-0 bottom-0 z-30 border-r border-slate-800/80"
      >
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                S
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Simply Commerce
              </span>
            </div>
            <h1 className="text-base font-bold text-white truncate tracking-tight">
              {store?.name || 'Seller Dashboard'}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {getStatusBadge()}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 mr-3 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 space-y-2">
          {store && (
            <button
              onClick={() => router.push('/subscription')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-300 bg-amber-950/30 border border-amber-800/50 rounded-xl hover:bg-amber-900/40 transition-colors"
            >
              <span className="flex items-center">
                <CreditCard className="w-3.5 h-3.5 mr-2" />
                Subscription Plan
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200">
                {store.status === 'LIVE' ? 'ACTIVE' : 'UPGRADE'}
              </span>
            </button>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout ({user?.phone || 'Seller'})
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate tracking-tight">
              {title || 'Dashboard'}
            </h2>
            <div className="md:hidden">{getStatusBadge()}</div>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            {storefrontUrl && (
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {store.status === 'LIVE' ? 'Open Live Store' : 'Private Storefront'}
                </span>
                <span className="sm:hidden">Preview</span>
              </a>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar (360px - 768px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around py-1.5 px-1 shadow-lg"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-xs font-medium transition-colors min-h-[48px] min-w-[48px] ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Eye,
  Package,
  ShoppingBag,
  BarChart3,
  Palette,
  MoreHorizontal,
  LogOut,
  ExternalLink,
  Menu,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, actions }) => {
  const { user, store, logout } = useAuth();
  const router = useRouter();

  // Mobile off-canvas drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  // Tablet collapsed icon rail state (default collapsed on tablet, expandable)
  const [tabletCollapsed, setTabletCollapsed] = useState(true);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Canonical 7 Primary Navigation Items
  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'My Store Preview', href: '/store-preview', icon: Eye },
    { label: 'Inventory', href: '/products', icon: Package },
    { label: 'Orders', href: '/orders', icon: ShoppingBag },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Themes', href: '/brand-studio', icon: Palette },
    { label: 'More', href: '/more', icon: MoreHorizontal },
  ];

  // Helper for active route including nested routes
  const isRouteActive = (itemHref: string) => {
    if (itemHref === '/') return router.pathname === '/';
    if (itemHref === '/products') return router.pathname.startsWith('/products');
    if (itemHref === '/orders') return router.pathname.startsWith('/orders');
    if (itemHref === '/brand-studio') {
      return router.pathname.startsWith('/brand-studio') || router.pathname.startsWith('/themes');
    }
    if (itemHref === '/more') {
      return (
        router.pathname.startsWith('/more') ||
        router.pathname.startsWith('/settings') ||
        router.pathname.startsWith('/subscription')
      );
    }
    return router.pathname.startsWith(itemHref);
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [router.pathname]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const getStatusBadge = (compact = false) => {
    const status = store?.status || 'PRIVATE_PREVIEW';
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {compact ? 'LIVE' : 'Store is Live'}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {compact ? 'EXPIRED' : 'Subscription Expired'}
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            {compact ? 'SUSPENDED' : 'Store Suspended'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {compact ? 'PRIVATE' : 'Private Mode'}
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* =========================================================================
          1. DESKTOP & TABLET LEFT SIDEBAR (Sticky/Fixed)
          - Tablet (768px-1023px): Collapsible icon rail (68px or 240px)
          - Desktop (>= 1024px): 240px expanded sidebar
      ========================================================================= */}
      <aside
        aria-label="Merchant Primary Navigation"
        className={`hidden md:flex flex-col bg-slate-950 text-slate-100 min-h-screen fixed left-0 top-0 bottom-0 z-30 border-r border-slate-800/80 transition-all duration-200 ${
          tabletCollapsed ? 'md:w-[68px] lg:w-60' : 'w-60'
        }`}
      >
        {/* Top Header / Store Identity */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between min-h-[64px]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              S
            </span>
            <div className={`overflow-hidden transition-opacity duration-200 ${tabletCollapsed ? 'md:hidden lg:block' : 'block'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simply</span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] text-slate-400 truncate">{store?.name || 'Store'}</span>
              </div>
              <div className="mt-0.5">{getStatusBadge(true)}</div>
            </div>
          </div>

          {/* Tablet Collapse / Expand Toggle Button (visible only on md) */}
          <button
            type="button"
            onClick={() => setTabletCollapsed(!tabletCollapsed)}
            className="hidden md:flex lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-900 transition-colors"
            title={tabletCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
            aria-label={tabletCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
          >
            {tabletCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 7 Primary Navigation Links */}
        <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                title={item.label}
                aria-label={item.label}
                className={`w-full flex items-center rounded-xl text-xs font-medium transition-all group relative ${
                  tabletCollapsed ? 'md:justify-center md:px-0 lg:justify-start lg:px-3' : 'justify-start px-3'
                } py-2.5 ${
                  active
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tabletCollapsed ? 'md:mr-0 lg:mr-3' : 'mr-3'}`} />
                <span className={`truncate ${tabletCollapsed ? 'md:hidden lg:inline' : 'inline'}`}>
                  {item.label}
                </span>

                {/* Floating tooltip on tablet collapsed rail */}
                {tabletCollapsed && (
                  <span className="hidden md:group-hover:block lg:group-hover:hidden absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md shadow-xl whitespace-nowrap z-50 border border-slate-700 pointer-events-none">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Area: Merchant Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {/* Subscription link */}
          <button
            type="button"
            onClick={() => router.push('/subscription')}
            title="Subscription"
            className={`w-full flex items-center rounded-xl text-xs font-medium text-amber-300 bg-amber-950/30 border border-amber-800/50 hover:bg-amber-900/40 transition-colors ${
              tabletCollapsed ? 'md:justify-center md:px-0 lg:justify-between lg:px-3' : 'justify-between px-3'
            } py-2`}
          >
            <span className="flex items-center">
              <CreditCard className={`w-3.5 h-3.5 ${tabletCollapsed ? 'md:mr-0 lg:mr-2' : 'mr-2'}`} />
              <span className={`truncate ${tabletCollapsed ? 'md:hidden lg:inline' : 'inline'}`}>Plan</span>
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 ${tabletCollapsed ? 'md:hidden lg:inline' : 'inline'}`}>
              {store?.status === 'LIVE' ? 'ACTIVE' : 'UPGRADE'}
            </span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors ${
              tabletCollapsed ? 'md:justify-center md:px-0 lg:justify-start lg:px-3' : 'justify-start px-3'
            } py-2`}
          >
            <LogOut className={`w-3.5 h-3.5 ${tabletCollapsed ? 'md:mr-0 lg:mr-2' : 'mr-2'}`} />
            <span className={`truncate ${tabletCollapsed ? 'md:hidden lg:inline' : 'inline'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. MOBILE TOP APP BAR & OFF-CANVAS LEFT DRAWER (< 768px)
          - NO bottom navigation!
          - Hamburger opens left slide-in drawer
      ========================================================================= */}
      {/* Top App Bar for Mobile */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Navigation Drawer"
            className="p-1.5 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              S
            </span>
            <span className="font-bold text-sm tracking-tight text-white">{title || 'Dashboard'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(true)}
        </div>
      </div>

      {/* Off-Canvas Backdrop */}
      {mobileDrawerOpen && (
        <div
          role="presentation"
          onClick={() => setMobileDrawerOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Left Off-Canvas Drawer */}
      <aside
        ref={drawerRef}
        aria-label="Mobile Left Navigation Drawer"
        aria-modal="true"
        role="dialog"
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-slate-950 text-white z-50 shadow-2xl flex flex-col transition-transform duration-200 ease-in-out ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                S
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simply</span>
            </div>
            <h2 className="text-sm font-bold text-white truncate">{store?.name || 'Merchant'}</h2>
            <div className="mt-1">{getStatusBadge(false)}</div>
          </div>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close Navigation Drawer"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Links (Touch targets >= 44px) */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  router.push(item.href);
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center px-3.5 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                  active
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Drawer Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {storefrontUrl && (
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors min-h-[44px]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Storefront</span>
            </a>
          )}

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout ({user?.phone || 'Seller'})</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          3. MAIN CONTENT AREA
          - Offset margin on desktop/tablet to accommodate fixed left sidebar
      ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          tabletCollapsed ? 'md:ml-[68px] lg:ml-60' : 'md:ml-60'
        }`}
      >
        {/* Main Content Viewport */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

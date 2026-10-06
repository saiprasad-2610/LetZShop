import React, { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth, apiClient } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { ProductEditorDrawer } from '../components/ProductEditorDrawer';
import { formatPaise } from '@simply/ui';
import {
  TrendingUp,
  ShoppingBag,
  MessageSquare,
  Users,
  AlertTriangle,
  Plus,
  Palette,
  Eye,
  Share2,
  Package,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Boxes,
  Check,
  ChevronDown,
  Sparkles,
  Globe,
  CreditCard,
  Truck,
} from 'lucide-react';

type PeriodKey = 'today' | '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '3m', label: '3 Months' },
  { key: '6m', label: '6 Months' },
  { key: '1y', label: '1 Year' },
  { key: 'custom', label: 'Custom' },
];

export default function CompactDashboardPage() {
  const { user, store, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Action State
  const [copiedLink, setCopiedLink] = useState(false);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);

  const isFirstLoad = useRef(true);

  const loadDashboard = useCallback(
    async (period: PeriodKey, isBackground = false, startDate?: string, endDate?: string) => {
      if (!store) return;
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await apiClient.seller.getDashboard({
          period,
          startDate: period === 'custom' ? startDate || customStart : undefined,
          endDate: period === 'custom' ? endDate || customEnd : undefined,
        });
        setDashboardData(res);
      } catch (err: any) {
        console.error('Failed to load merchant dashboard:', err);
        if (!isBackground) {
          setError(err?.message || 'Failed to load business analytics.');
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        isFirstLoad.current = false;
      }
    },
    [store, customStart, customEnd]
  );

  // Initial load and period changes
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !store) {
      router.push('/onboarding');
      return;
    }

    if (store && selectedPeriod !== 'custom') {
      loadDashboard(selectedPeriod, !isFirstLoad.current);
    }
  }, [authLoading, user, store, selectedPeriod, loadDashboard]);

  // Window Focus Refetch
  useEffect(() => {
    const handleFocus = () => {
      if (store && selectedPeriod !== 'custom') {
        loadDashboard(selectedPeriod, true);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [store, selectedPeriod, loadDashboard]);

  // 30-Second Polling while Dashboard is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && store && selectedPeriod !== 'custom') {
        loadDashboard(selectedPeriod, true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [store, selectedPeriod, loadDashboard]);

  const handlePeriodChange = (key: PeriodKey) => {
    setSelectedPeriod(key);
    if (key === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const handleApplyCustomPeriod = () => {
    if (!customStart || !customEnd) return;
    loadDashboard('custom', false, customStart, customEnd);
  };

  const storefrontUrl = store?.slug
    ? store.status === 'LIVE'
      ? `http://localhost:3000/store/${store.slug}`
      : `http://localhost:3000/store/${store.slug}?preview=true`
    : '#';

  const handleShareStore = () => {
    if (!store?.slug) return;
    const url = store.status === 'LIVE'
      ? `http://localhost:3000/store/${store.slug}`
      : `http://localhost:3000/store/${store.slug}?preview=true`;

    if (navigator.share && store.status === 'LIVE') {
      navigator.share({ title: store.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Safe unpacked data
  const metrics = dashboardData?.metrics || {
    revenuePaise: 0,
    orders: 0,
    enquiries: 0,
    customers: 0,
    pendingOrders: 0,
    lowStock: 0,
    activeProducts: 0,
    averageOrderValuePaise: 0,
  };

  const comparison = dashboardData?.comparison || {};
  const attention = dashboardData?.attention || {};
  const returningCount = dashboardData?.customerInsights?.returningCustomers || 0;

  // Real Issues for Thin Attention Strip
  const issues: { text: string; link: string; linkText: string }[] = [];
  if (store?.status !== 'LIVE') {
    issues.push({
      text: 'Store is in Private Mode',
      link: '/subscription',
      linkText: 'Activate store →',
    });
  }
  if (attention.subscriptionRequiresAction) {
    issues.push({
      text: 'Subscription requires action',
      link: '/subscription',
      linkText: 'Renew plan →',
    });
  }
  if (attention.paymentSetupIncomplete) {
    issues.push({
      text: 'Payment setup incomplete',
      link: '/more',
      linkText: 'Configure payments →',
    });
  }
  if (attention.shippingSetupIncomplete) {
    issues.push({
      text: 'Shipping setup incomplete',
      link: '/more',
      linkText: 'Set shipping rates →',
    });
  }
  if (metrics.pendingOrders > 0) {
    issues.push({
      text: `${metrics.pendingOrders} pending order${metrics.pendingOrders > 1 ? 's' : ''}`,
      link: '/orders',
      linkText: 'Fulfill orders →',
    });
  }
  if (metrics.lowStock > 0) {
    issues.push({
      text: `${metrics.lowStock} item${metrics.lowStock > 1 ? 's' : ''} low on stock`,
      link: '/products',
      linkText: 'Restock inventory →',
    });
  }

  const storeStatusText =
    store?.status === 'LIVE'
      ? 'Live'
      : store?.status === 'EXPIRED'
      ? 'Subscription Required'
      : 'Private Mode';

  // =========================================================================
  // DYNAMIC GUIDANCE: YOUR NEXT STEP / GROW YOUR STORE (PRIORITIES 1 TO 6)
  // =========================================================================
  const isLive = store?.status === 'LIVE' || store?.status === 'ACTIVE';
  const isSubscriptionValid = Boolean(
    store?.subscription?.status === 'ACTIVE' ||
    store?.subscriptionStatus === 'ACTIVE' ||
    (store?.status !== 'EXPIRED' && !attention.subscriptionRequiresAction)
  );
  const isStorePublic = Boolean(store?.isPubliclyAccessible && isLive);
  const isBrandingComplete = Boolean(store?.branding?.logoUrl || store?.branding?.heroMediaId);
  const isPaymentConfigured = Boolean(!attention.paymentSetupIncomplete);
  const isShippingConfigured = Boolean(!attention.shippingSetupIncomplete);
  const hasProducts = Boolean(metrics.activeProducts > 0);
  const hasBusinessInfo = Boolean(store?.name && store?.slug);

  const [storePreviewed, setStorePreviewed] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStorePreviewed(localStorage.getItem('simply_store_previewed') === 'true');
    }
  }, []);

  const setupChecklist = [
    { label: 'Business info', done: hasBusinessInfo },
    { label: 'Products added', done: hasProducts },
    { label: 'Store designed', done: isBrandingComplete },
    { label: 'Store previewed', done: storePreviewed },
    { label: 'Payments', done: isPaymentConfigured },
    { label: 'Publish store', done: isStorePublic },
  ];
  const completedSteps = setupChecklist.filter((s) => s.done).length;
  const totalSteps = setupChecklist.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  let nextAction: {
    priority: number;
    title: string;
    description: string;
    primaryCta: { label: string; action: () => void };
    secondaryCta?: { label: string; action: () => void };
    badge: string;
    icon: any;
  };

  if (!isSubscriptionValid || store?.status === 'EXPIRED') {
    nextAction = {
      priority: 1,
      title: 'Ready to take your store live?',
      description: 'Choose a plan and start accepting real customer orders from your own online store.',
      primaryCta: {
        label: 'View Plans / Activate Store',
        action: () => router.push('/subscription'),
      },
      secondaryCta: {
        label: 'Preview Store',
        action: () => {
          if (typeof window !== 'undefined') localStorage.setItem('simply_store_previewed', 'true');
          router.push('/store-preview');
        },
      },
      badge: 'Plan Required',
      icon: Sparkles,
    };
  } else if (!isLive || !isStorePublic) {
    nextAction = {
      priority: 2,
      title: 'Your store is ready to publish',
      description: 'Review your storefront once more and make it available to customers.',
      primaryCta: {
        label: 'Publish Store',
        action: () => router.push('/store-preview'),
      },
      secondaryCta: {
        label: 'Preview Store',
        action: () => {
          if (typeof window !== 'undefined') localStorage.setItem('simply_store_previewed', 'true');
          router.push('/store-preview');
        },
      },
      badge: 'Ready to Publish',
      icon: Globe,
    };
  } else if (!isBrandingComplete) {
    nextAction = {
      priority: 3,
      title: 'Make your storefront stand out',
      description: 'Customize your colors, banner, typography and sections to match your business.',
      primaryCta: {
        label: 'Customize Store',
        action: () => router.push('/brand-studio'),
      },
      secondaryCta: {
        label: 'Preview Store',
        action: () => {
          if (typeof window !== 'undefined') localStorage.setItem('simply_store_previewed', 'true');
          router.push('/store-preview');
        },
      },
      badge: 'Branding',
      icon: Palette,
    };
  } else if (!isPaymentConfigured) {
    nextAction = {
      priority: 4,
      title: 'Set up online payments',
      description: 'Connect your payment account so customers can pay securely online.',
      primaryCta: {
        label: 'Set Up Payments',
        action: () => router.push('/settings'),
      },
      badge: 'Payments',
      icon: CreditCard,
    };
  } else if (!isShippingConfigured) {
    nextAction = {
      priority: 5,
      title: 'Prepare your delivery setup',
      description: 'Configure delivery and pickup preferences before receiving customer orders.',
      primaryCta: {
        label: 'Delivery Settings',
        action: () => router.push('/settings'),
      },
      badge: 'Delivery',
      icon: Truck,
    };
  } else {
    nextAction = {
      priority: 6,
      title: 'Your store is ready for customers',
      description: 'Share your store link with customers and start taking orders.',
      primaryCta: {
        label: 'Share Store',
        action: handleShareStore,
      },
      secondaryCta: {
        label: 'View Store',
        action: () => {
          if (store?.slug) {
            window.open(`http://localhost:3000/store/${store.slug}`, '_blank');
          }
        },
      },
      badge: 'Live & Ready',
      icon: Share2,
    };
  }

  if (authLoading || (loading && !dashboardData)) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Loading Operations Snapshot...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <Head>
        <title>Dashboard | Simply Merchant Portal</title>
      </Head>

      <div className="space-y-4">
        {/* =========================================================================
            PART 3: COMPACT DASHBOARD TITLE BAR (90px-120px max)
            Left: Dashboard, Welcome back, {store.name} · {Status}
            Right: Global period selector + [View Storefront]
        ========================================================================= */}
        <section className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left Info */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Dashboard
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500">
                  {store?.name || 'My Store'} ·{' '}
                  <span className={store?.status === 'LIVE' ? 'text-emerald-600 font-semibold' : 'text-blue-600 font-semibold'}>
                    {storeStatusText}
                  </span>
                </span>
                {isRefreshing && (
                  <span className="inline-flex items-center text-[10px] text-slate-400 gap-1 ml-2">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Updating...</span>
                  </span>
                )}
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 truncate">
                Welcome back, {store?.name || 'Merchant'}
              </h1>
            </div>

            {/* Right Controls: Period Selector + View Store */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Desktop Period Selector: Compact segmented chips */}
              <div className="hidden sm:inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handlePeriodChange(opt.key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      selectedPeriod === opt.key
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Mobile Period Dropdown */}
              <div className="sm:hidden relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value as PeriodKey)}
                  className="appearance-none bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 pr-8 shadow-2xs focus:outline-hidden"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* View Storefront Link */}
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors shrink-0"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                <span>View Storefront</span>
              </a>
            </div>
          </div>

          {/* Custom Date Range Form if selected */}
          {showCustomPicker && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Custom Date Range:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleApplyCustomPeriod}
                className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
          )}
        </section>

        {/* =========================================================================
            PART 4: NEEDS IMMEDIATE ATTENTION — ONE THIN HORIZONTAL STRIP
            Target height ~40px-50px max. Shows count + high-priority issues
        ========================================================================= */}
        {issues.length > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-amber-950 shrink-0">
                Needs Immediate Attention ({issues.length})
              </span>
              <span className="text-amber-400 hidden sm:inline">•</span>
              <div className="hidden sm:flex items-center gap-2 truncate text-amber-800">
                <span>{issues[0].text}</span>
                {issues.length > 1 && (
                  <span className="text-[11px] bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-900 font-semibold">
                    +{issues.length - 1} more
                  </span>
                )}
              </div>
            </div>

            <a
              href={issues[0].link}
              onClick={(e) => {
                e.preventDefault();
                router.push(issues[0].link);
              }}
              className="text-xs font-bold text-amber-700 hover:text-amber-950 underline underline-offset-2 shrink-0 ml-3"
            >
              {issues[0].linkText}
            </a>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2 text-xs text-emerald-800 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-950">Everything looks good</span>
            <span className="text-emerald-700 hidden sm:inline">— No operational blocks or urgent inventory alerts.</span>
          </div>
        )}

        {/* =========================================================================
            PART 5 & 6: DASHBOARD METRICS — EXACTLY EIGHT CARDS
            Row 1: Total Sales, Orders, Enquiries / RFQs, Customers
            Row 2: Pending Orders, Low Stock, Active Products, Avg Order Value
            Height: ~95-115px each. 4 across on desktop; 2x4 on mobile/tablet.
        ========================================================================= */}
        <section aria-label="Business and Operational Metrics" className="space-y-3">
          {/* Row 1 — Business Performance */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Total Sales */}
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Sales
                </span>
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1">
                <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {formatPaise(metrics.revenuePaise)}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                  <span>Paid eligible orders</span>
                  {comparison.revenuePercent !== null && comparison.revenuePercent !== undefined && (
                    <span
                      className={`font-semibold flex items-center text-[10px] ${
                        comparison.revenuePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {comparison.revenuePercent >= 0 ? '+' : ''}
                      {comparison.revenuePercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Orders */}
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Orders
                </span>
                <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1">
                <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {metrics.orders}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                  <span>Total placed orders</span>
                  {comparison.ordersPercent !== null && comparison.ordersPercent !== undefined && (
                    <span
                      className={`font-semibold flex items-center text-[10px] ${
                        comparison.ordersPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {comparison.ordersPercent >= 0 ? '+' : ''}
                      {comparison.ordersPercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Enquiries / RFQs */}
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Enquiries / RFQs
                </span>
                <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1">
                <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {metrics.enquiries}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  B2B quotation requests
                </div>
              </div>
            </div>

            {/* 4. Customers */}
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Customers
                </span>
                <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1">
                <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {metrics.customers}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  <span className="font-semibold text-emerald-700">{returningCount}</span> returning
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 — Operations */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 5. Pending Orders */}
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Pending Orders
                </span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div>
                  <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                    {metrics.pendingOrders}
                  </div>
                  <div className="text-[11px] text-slate-400">Needs fulfillment</div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/orders')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Manage →
                </button>
              </div>
            </div>

            {/* 6. Low Stock (≤ 5) */}
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Low Stock (≤ 5)
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div>
                  <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                    {metrics.lowStock}
                  </div>
                  <div className="text-[11px] text-slate-400">Variants to restock</div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/products')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Restock →
                </button>
              </div>
            </div>

            {/* 7. Active Products */}
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Products
                </span>
                <Boxes className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div>
                  <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                    {metrics.activeProducts}
                  </div>
                  <div className="text-[11px] text-slate-400">Live in catalog</div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/products')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Catalog →
                </button>
              </div>
            </div>

            {/* 8. Avg Order Value */}
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Avg Order Value
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="mt-1">
                <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {formatPaise(metrics.averageOrderValuePaise)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Per order
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PART 9: QUICK ACTIONS — EXACTLY FOUR
            Add Product, Manage Orders, Customize Store, Share Store
            Dashboard stops here! No analytics charts or store previews below.
        ========================================================================= */}
        <section aria-label="Quick Actions" className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Actions
            </h2>
            <button
              type="button"
              onClick={() => router.push('/analytics')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Business Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Action 1: Add Product */}
            <button
              type="button"
              onClick={() => setProductDrawerOpen(true)}
              className="p-3.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 text-left transition-colors group flex items-start justify-between min-h-[76px]"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Add Product
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">1–3 Images</div>
              </div>
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" />
              </span>
            </button>

            {/* Action 2: Manage Orders */}
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 text-left transition-colors group flex items-start justify-between min-h-[76px]"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Manage Orders
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Fulfillment</div>
              </div>
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </span>
            </button>

            {/* Action 3: Customize Store */}
            <button
              type="button"
              onClick={() => router.push('/brand-studio')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 text-left transition-colors group flex items-start justify-between min-h-[76px]"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Customize Store
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Themes & Design</div>
              </div>
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4" />
              </span>
            </button>

            {/* Action 4: Share Store */}
            <button
              type="button"
              onClick={handleShareStore}
              className="p-3.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 text-left transition-colors group flex items-start justify-between min-h-[76px]"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {copiedLink ? 'Copied to Clipboard!' : 'Share Store'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">WhatsApp & Direct</div>
              </div>
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              </span>
            </button>
          </div>
        </section>

        {/* =========================================================================
            PART 10: YOUR NEXT STEP / GROW YOUR STORE
            Dynamically guides the merchant toward their most important next action.
            Height: ~120-170px on desktop. Fills lower area cleanly without clutter.
        ========================================================================= */}
        <section
          aria-label="Your Next Step"
          className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs border border-slate-800 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Dynamic Message */}
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-500/20 text-blue-300">
                  <nextAction.icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Your Next Step • {nextAction.badge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {nextAction.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {nextAction.description}
              </p>
            </div>

            {/* Right: Progress Indicator + CTAs */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 md:pl-6 md:border-l md:border-slate-800">
              {/* Compact Progress */}
              <div className="space-y-1.5 min-w-[140px]">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                  <span>Store setup</span>
                  <span className="font-bold text-white">{completedSteps}/{totalSteps}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {nextAction.secondaryCta && (
                  <button
                    type="button"
                    onClick={nextAction.secondaryCta.action}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 transition-colors shadow-2xs whitespace-nowrap"
                  >
                    {nextAction.secondaryCta.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={nextAction.primaryCta.action}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-white hover:bg-blue-50 transition-colors shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                >
                  <span>{nextAction.primaryCta.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Product Editor Drawer for seamless Add Product */}
      <ProductEditorDrawer
        isOpen={productDrawerOpen}
        productId={null}
        onClose={() => setProductDrawerOpen(false)}
        onSaved={() => {
          setProductDrawerOpen(false);
          loadDashboard(selectedPeriod, true);
        }}
      />
    </Layout>
  );
}

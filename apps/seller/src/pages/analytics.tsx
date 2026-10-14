import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth, apiClient } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { SafeImage } from '../components/ui/SafeImage';
import { formatPaise } from '@simply/ui';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  RefreshCw,
  MapPin,
  ArrowRight,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Package,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

type PeriodKey = '7d' | '30d' | '90d' | '6m' | '1y';

interface PeriodOption {
  key: PeriodKey;
  label: string;
  comparisonLabel: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: '7d', label: '7 Days', comparisonLabel: 'prev 7d' },
  { key: '30d', label: '30 Days', comparisonLabel: 'prev 30d' },
  { key: '90d', label: '90 Days', comparisonLabel: 'prev 90d' },
  { key: '6m', label: '6 Months', comparisonLabel: 'prev 6m' },
  { key: '1y', label: '12 Months', comparisonLabel: 'prev 12m' },
];

/**
 * Formats paise into compact abbreviated string for chart axes (e.g. ₹1.2K, ₹25K, ₹1.5L)
 */
function formatPaiseCompact(paise: number): string {
  if (!paise || paise <= 0) return '₹0';
  const rupees = paise / 100;
  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `₹${Math.round(rupees)}`;
}

/**
 * Deterministic business insight generator based purely on verified analytics numbers
 */
function generateBusinessInsight(
  metrics: any,
  comparison: any,
  customerInsights: any,
  topProducts: any,
  topLocations: any[],
  periodLabel: string
): string {
  if (!metrics || metrics.orders === 0) {
    return 'No order activity recorded in this period yet. Share your store link with customers to begin generating sales trends.';
  }

  const parts: string[] = [];

  // 1. Revenue trajectory
  if (typeof comparison?.revenuePercent === 'number') {
    if (comparison.revenuePercent > 0) {
      parts.push(`Revenue is up ${comparison.revenuePercent}% compared with the previous ${periodLabel.toLowerCase()}.`);
    } else if (comparison.revenuePercent < 0) {
      parts.push(`Revenue is down ${Math.abs(comparison.revenuePercent)}% compared with the previous ${periodLabel.toLowerCase()}.`);
    } else {
      parts.push(`Revenue is consistent with the previous ${periodLabel.toLowerCase()}.`);
    }
  } else {
    parts.push(`Generated ${formatPaise(metrics.revenuePaise)} across ${metrics.orders} order${metrics.orders === 1 ? '' : 's'} in this period.`);
  }

  // 2. Best seller product
  const topProd = topProducts?.byRevenue?.[0];
  if (topProd && topProd.quantitySold > 0) {
    parts.push(`"${topProd.name}" is your top seller with ${topProd.quantitySold} units sold (${formatPaise(topProd.revenuePaise)}).`);
  }

  // 3. Buyer loyalty
  if (customerInsights?.repeatRate > 0) {
    parts.push(`${customerInsights.repeatRate}% of buyers are returning customers.`);
  } else if (customerInsights?.newCustomers > 0) {
    parts.push('All shoppers in this period are first-time buyers.');
  }

  // 4. Geographic concentration
  const topLoc = topLocations?.[0];
  if (topLoc && topLoc.ordersCount > 0 && topLoc.state && topLoc.state !== 'Other') {
    parts.push(`Most orders originated from ${topLoc.state} (${topLoc.ordersCount} orders).`);
  }

  return parts.slice(0, 3).join(' ') || 'More order history is needed to generate meaningful trends.';
}

export default function AnalyticsPage() {
  const { user, store, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('30d');
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toggles
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [topProductMetric, setTopProductMetric] = useState<'revenue' | 'quantity'>('revenue');
  const [locationMetric, setLocationMetric] = useState<'state' | 'city'>('state');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const loadAnalytics = useCallback(
    async (period: PeriodKey) => {
      if (!store) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.seller.getDashboard({
          period,
        });
        setDashboardData(res);
      } catch (err: any) {
        console.error('Failed to load business analytics:', err);
        setError(err?.message || 'We could not load your business insights right now.');
      } finally {
        setLoading(false);
      }
    },
    [store]
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !store) {
      router.push('/onboarding');
      return;
    }
    if (store) {
      loadAnalytics(selectedPeriod);
    }
  }, [authLoading, user, store, selectedPeriod, loadAnalytics]);

  // Unpacked data with safe defaults
  const metrics = dashboardData?.metrics || {
    revenuePaise: 0,
    orders: 0,
    averageOrderValuePaise: 0,
  };
  const comparison = dashboardData?.comparison || {};
  const salesSeries: any[] = dashboardData?.salesSeries || [];
  const topProducts = dashboardData?.topProducts || { byRevenue: [], byQuantity: [] };
  const customerInsights = dashboardData?.customerInsights || {
    newCustomers: 0,
    returningCustomers: 0,
    repeatRate: 0,
    topCustomers: [],
  };
  const topLocations: any[] = dashboardData?.topLocations || [];
  const topCities: any[] = dashboardData?.topCities || [];
  const paymentMix: any[] = dashboardData?.paymentMix || [];

  const currentPeriodConfig =
    PERIOD_OPTIONS.find((p) => p.key === selectedPeriod) || PERIOD_OPTIONS[1];

  // SVG Area/Line Chart Calculations
  const chartPoints = useMemo(() => {
    if (!salesSeries || salesSeries.length === 0) return [];
    const values = salesSeries.map((s) =>
      chartMetric === 'revenue' ? s.revenuePaise : s.orders
    );
    const maxVal = Math.max(...values, chartMetric === 'revenue' ? 10000 : 5);

    const width = 640;
    const height = 150;
    const paddingX = 24;
    const paddingY = 16;

    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;
    const count = salesSeries.length;

    return salesSeries.map((item, index) => {
      const val = chartMetric === 'revenue' ? item.revenuePaise : item.orders;
      const x = paddingX + (count > 1 ? (index / (count - 1)) * innerWidth : innerWidth / 2);
      const y = height - paddingY - (val / maxVal) * innerHeight;
      return {
        x,
        y,
        val,
        item,
      };
    });
  }, [salesSeries, chartMetric]);

  const chartPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  }, [chartPoints]);

  const chartAreaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    return `${chartPath} L ${last.x} 134 L ${first.x} 134 Z`;
  }, [chartPoints, chartPath]);

  // Max value calculation for Y axis ticks
  const chartMaxVal = useMemo(() => {
    if (!salesSeries || salesSeries.length === 0) return 0;
    return Math.max(
      ...salesSeries.map((s) => (chartMetric === 'revenue' ? s.revenuePaise : s.orders)),
      chartMetric === 'revenue' ? 10000 : 5
    );
  }, [salesSeries, chartMetric]);

  // Payment Mix Donut Segments
  const paymentSegments = useMemo(() => {
    const totalCount = paymentMix.reduce((acc, m) => acc + (m.ordersCount || 0), 0) || 1;
    const circumference = 2 * Math.PI * 38; // r = 38
    let accumulatedOffset = 0;

    return paymentMix.map((m, index) => {
      const pct = (m.ordersCount / totalCount) * 100;
      const strokeLength = (pct / 100) * circumference;
      const dashArray = `${strokeLength} ${circumference}`;
      const dashOffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      const isCod = m.method === 'COD';
      const color = isCod ? '#F59E0B' : 'var(--merchant-primary)';

      return {
        ...m,
        color,
        pct: Number(pct.toFixed(1)),
        dashArray,
        dashOffset,
      };
    });
  }, [paymentMix]);

  // Customer Mix Donut Segments
  const customerSegments = useMemo(() => {
    const totalBuyers =
      (customerInsights.newCustomers || 0) + (customerInsights.returningCustomers || 0) || 1;
    const newPct = ((customerInsights.newCustomers || 0) / totalBuyers) * 100;
    const retPct = ((customerInsights.returningCustomers || 0) / totalBuyers) * 100;
    const circumference = 2 * Math.PI * 34; // r = 34

    const newLength = (newPct / 100) * circumference;
    const retLength = (retPct / 100) * circumference;

    return {
      totalBuyers: (customerInsights.newCustomers || 0) + (customerInsights.returningCustomers || 0),
      newPct: Number(newPct.toFixed(0)),
      retPct: Number(retPct.toFixed(0)),
      newDash: `${newLength} ${circumference}`,
      retDash: `${retLength} ${circumference}`,
      retOffset: -newLength,
    };
  }, [customerInsights]);

  // Top products displayed by metric
  const displayedTopProducts = useMemo(() => {
    const list =
      topProductMetric === 'revenue' ? topProducts.byRevenue : topProducts.byQuantity;
    return list || [];
  }, [topProductMetric, topProducts]);

  const maxProductVal = useMemo(() => {
    if (displayedTopProducts.length === 0) return 1;
    return Math.max(
      ...displayedTopProducts.map((p: any) =>
        topProductMetric === 'revenue' ? p.revenuePaise : p.quantitySold
      ),
      1
    );
  }, [displayedTopProducts, topProductMetric]);

  // Top locations displayed by metric (State vs City)
  const displayedLocations = useMemo(() => {
    return locationMetric === 'state' ? topLocations : topCities;
  }, [locationMetric, topLocations, topCities]);

  const maxLocationCount = useMemo(() => {
    if (displayedLocations.length === 0) return 1;
    return Math.max(...displayedLocations.map((l: any) => l.ordersCount || 1), 1);
  }, [displayedLocations]);

  // Deterministic summary text
  const businessInsightText = useMemo(() => {
    return generateBusinessInsight(
      metrics,
      comparison,
      customerInsights,
      topProducts,
      topLocations,
      currentPeriodConfig.label
    );
  }, [metrics, comparison, customerInsights, topProducts, topLocations, currentPeriodConfig]);

  // Comparison pill renderer
  const renderComparisonPill = (percent: number | null | undefined, labelSuffix: string = '') => {
    if (typeof percent !== 'number' || isNaN(percent) || !isFinite(percent)) {
      return (
        <span className="inline-flex items-center text-[10px] font-medium text-[var(--merchant-text-muted)] bg-[var(--merchant-surface-muted)] px-1.5 py-0.5 rounded-md">
          New · {currentPeriodConfig.comparisonLabel}
        </span>
      );
    }

    const isPositive = percent > 0;
    const isZero = percent === 0;

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
          isZero
            ? 'text-[var(--merchant-text-muted)] bg-[var(--merchant-surface-muted)]'
            : isPositive
            ? 'text-emerald-600 bg-emerald-500/10'
            : 'text-rose-600 bg-rose-500/10'
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
        ) : isZero ? null : (
          <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
        )}
        <span>
          {isPositive ? '+' : ''}
          {percent}% {labelSuffix || currentPeriodConfig.comparisonLabel}
        </span>
      </span>
    );
  };

  return (
    <Layout title="Analytics">
      <Head>
        <title>Analytics | LetzShop Merchant Portal</title>
      </Head>

      <div className="space-y-4 md:space-y-5 max-w-7xl mx-auto">
        {/* ========================================================================= */}
        {/* 1. COMPACT HEADER BAR & PERIOD SELECTOR */}
        {/* ========================================================================= */}
        <section className="bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 md:p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--merchant-text)]">
                Analytics
              </h1>
              <span className="hidden sm:inline-flex items-center text-[11px] font-medium text-[var(--merchant-text-muted)] bg-[var(--merchant-surface-muted)] px-2 py-0.5 rounded-md border border-[var(--merchant-border)]">
                Store Overview
              </span>
            </div>
            <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
              Live business pulse, sales performance, product mix, and buyer geography.
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Desktop Segmented Chips */}
            <div className="hidden sm:inline-flex items-center bg-[var(--merchant-surface-muted)] p-1 rounded-xl border border-[var(--merchant-border)]">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedPeriod(opt.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    selectedPeriod === opt.key
                      ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)] shadow-xs'
                      : 'text-[var(--merchant-text-secondary)] hover:text-[var(--merchant-text)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="sm:hidden relative w-full">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodKey)}
                aria-label="Select analytics reporting period"
                className="w-full appearance-none bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] text-[var(--merchant-text)] text-xs font-semibold rounded-xl px-3 py-2 pr-8 shadow-2xs focus:outline-hidden"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--merchant-text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. ERROR STATE / RETRY */}
        {/* ========================================================================= */}
        {error && !loading && (
          <section className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[var(--merchant-text)]">
              Analytics unavailable
            </h3>
            <p className="text-xs text-[var(--merchant-text-muted)] mt-1 max-w-md mx-auto">
              {error}
            </p>
            <button
              type="button"
              onClick={() => loadAnalytics(selectedPeriod)}
              className="mt-3.5 px-4 py-1.5 text-xs font-semibold bg-[var(--merchant-primary)] text-white rounded-lg hover:bg-[var(--merchant-primary-hover)] inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 3. SKELETON LOADING STATE */}
        {/* ========================================================================= */}
        {loading && (
          <div className="space-y-4">
            {/* Top 4 KPI Skeletons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 border border-[var(--merchant-border)] animate-pulse"
                >
                  <div className="h-3 w-20 bg-[var(--merchant-surface-muted)] rounded-sm mb-3" />
                  <div className="h-6 w-28 bg-[var(--merchant-surface-muted)] rounded-md mb-2" />
                  <div className="h-3.5 w-24 bg-[var(--merchant-surface-muted)] rounded-sm" />
                </div>
              ))}
            </div>

            {/* Row 2 Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] h-[280px] animate-pulse flex flex-col justify-between">
                <div className="h-4 w-36 bg-[var(--merchant-surface-muted)] rounded-sm" />
                <div className="h-40 w-full bg-[var(--merchant-surface-muted)] rounded-xl" />
              </div>
              <div className="lg:col-span-4 bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] h-[280px] animate-pulse flex flex-col justify-between">
                <div className="h-4 w-28 bg-[var(--merchant-surface-muted)] rounded-sm" />
                <div className="w-32 h-32 rounded-full bg-[var(--merchant-surface-muted)] mx-auto" />
                <div className="h-4 w-full bg-[var(--merchant-surface-muted)] rounded-sm" />
              </div>
            </div>

            {/* Row 3 Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] h-[260px] animate-pulse" />
              <div className="lg:col-span-3 bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] h-[260px] animate-pulse" />
              <div className="lg:col-span-4 bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] h-[260px] animate-pulse" />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. MAIN DASHBOARD CONTENT */}
        {/* ========================================================================= */}
        {!loading && !error && (
          <>
            {/* ROW 1: TOP 4 KPI CARDS */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* KPI 1: Revenue */}
              <div className="bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between transition-shadow hover:shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--merchant-text-muted)] font-medium">
                    <span>Revenue</span>
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--merchant-primary)]" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-[var(--merchant-text)] tracking-tight mt-1">
                    {formatPaise(metrics.revenuePaise)}
                  </div>
                </div>
                <div className="mt-2.5">
                  {renderComparisonPill(comparison.revenuePercent)}
                </div>
              </div>

              {/* KPI 2: Orders */}
              <div className="bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between transition-shadow hover:shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--merchant-text-muted)] font-medium">
                    <span>Orders</span>
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-[var(--merchant-text)] tracking-tight mt-1">
                    {metrics.orders}
                  </div>
                </div>
                <div className="mt-2.5">
                  {renderComparisonPill(comparison.ordersPercent)}
                </div>
              </div>

              {/* KPI 3: Average Order Value (AOV) */}
              <div className="bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between transition-shadow hover:shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--merchant-text-muted)] font-medium">
                    <span>Avg Order Value</span>
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-[var(--merchant-text)] tracking-tight mt-1">
                    {formatPaise(metrics.averageOrderValuePaise)}
                  </div>
                </div>
                <div className="mt-2.5">
                  {renderComparisonPill(comparison.aovPercent)}
                </div>
              </div>

              {/* KPI 4: Repeat Customer Rate */}
              <div className="bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between transition-shadow hover:shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--merchant-text-muted)] font-medium">
                    <span>Repeat Customers</span>
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-[var(--merchant-text)] tracking-tight mt-1">
                    {customerInsights.repeatRate}%
                  </div>
                </div>
                <div className="mt-2.5">
                  {renderComparisonPill(
                    comparison.repeatRatePercent ?? comparison.repeatRateDelta,
                    comparison.repeatRatePercent !== null ? undefined : 'pts vs prev'
                  )}
                </div>
              </div>
            </section>

            {/* ROW 2: SALES PERFORMANCE (70%) + PAYMENT MIX DONUT (30%) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* SALES PERFORMANCE LINE/AREA CHART (~70%) */}
              <div className="lg:col-span-8 bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 md:p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between">
                <div>
                  {/* Card Header & Toggle */}
                  <div className="flex flex-row items-center justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[var(--merchant-primary)]" />
                        <span>Sales Performance</span>
                      </h2>
                      <p className="text-[11px] text-[var(--merchant-text-muted)]">
                        Trend across {currentPeriodConfig.label.toLowerCase()}
                      </p>
                    </div>

                    <div className="inline-flex items-center bg-[var(--merchant-surface-muted)] p-0.5 rounded-lg border border-[var(--merchant-border)]">
                      <button
                        type="button"
                        data-testid="toggle-sales-revenue"
                        onClick={() => setChartMetric('revenue')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                          chartMetric === 'revenue'
                            ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] shadow-xs font-bold'
                            : 'text-[var(--merchant-text-secondary)] hover:text-[var(--merchant-text)]'
                        }`}
                      >
                        Revenue
                      </button>
                      <button
                        type="button"
                        data-testid="toggle-sales-orders"
                        onClick={() => setChartMetric('orders')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                          chartMetric === 'orders'
                            ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] shadow-xs font-bold'
                            : 'text-[var(--merchant-text-secondary)] hover:text-[var(--merchant-text)]'
                        }`}
                      >
                        Orders
                      </button>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  {chartPoints.length > 0 && chartMaxVal > 0 ? (
                    <div className="relative">
                      <div className="w-full aspect-[21/8] max-h-[200px] overflow-visible">
                        <svg viewBox="0 0 640 180" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="letzShopChartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--merchant-primary)" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="var(--merchant-primary)" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Gridlines & Y-axis labels */}
                          <line x1="24" y1="24" x2="616" y2="24" stroke="var(--merchant-border)" strokeDasharray="3 3" opacity="0.6" />
                          <text x="24" y="20" fill="var(--merchant-text-muted)" fontSize="9" fontWeight="600" opacity="0.8">
                            {chartMetric === 'revenue' ? formatPaiseCompact(chartMaxVal) : chartMaxVal}
                          </text>

                          <line x1="24" y1="90" x2="616" y2="90" stroke="var(--merchant-border)" strokeDasharray="3 3" opacity="0.6" />
                          <text x="24" y="86" fill="var(--merchant-text-muted)" fontSize="9" fontWeight="600" opacity="0.8">
                            {chartMetric === 'revenue' ? formatPaiseCompact(Math.round(chartMaxVal / 2)) : Math.round(chartMaxVal / 2)}
                          </text>

                          <line x1="24" y1="156" x2="616" y2="156" stroke="var(--merchant-border)" opacity="0.8" />
                          <text x="24" y="170" fill="var(--merchant-text-muted)" fontSize="9" fontWeight="600" opacity="0.8">
                            0
                          </text>

                          {/* Area Fill */}
                          <path d={chartAreaPath} fill="url(#letzShopChartGradient)" />

                          {/* Line Stroke */}
                          <path
                            d={chartPath}
                            fill="none"
                            stroke="var(--merchant-primary)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Data Points */}
                          {chartPoints.map((pt, i) => (
                            <circle
                              key={i}
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredPointIndex === i ? 5 : 3}
                              fill="var(--merchant-primary)"
                              className={`transition-all cursor-pointer ${
                                hoveredPointIndex === i
                                  ? 'stroke-[var(--merchant-surface)] stroke-2'
                                  : ''
                              }`}
                              onMouseEnter={() => setHoveredPointIndex(i)}
                              onMouseLeave={() => setHoveredPointIndex(null)}
                            />
                          ))}
                        </svg>
                      </div>

                      {/* Tooltip on hover */}
                      {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                        <div className="absolute top-1 right-2 bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)] text-xs px-3 py-1.5 rounded-lg shadow-md border border-[var(--merchant-border)] pointer-events-none transition-all">
                          <div className="text-[10px] font-semibold text-[var(--merchant-text-muted)]">
                            {chartPoints[hoveredPointIndex].item.label || chartPoints[hoveredPointIndex].item.date}
                          </div>
                          <div className="font-bold text-[var(--merchant-text)] text-xs mt-0.5">
                            {formatPaise(chartPoints[hoveredPointIndex].item.revenuePaise)} · {chartPoints[hoveredPointIndex].item.orders} orders
                          </div>
                        </div>
                      )}

                      {/* X-Axis Labels */}
                      <div className="flex justify-between items-center text-[10px] text-[var(--merchant-text-muted)] font-mono mt-2 px-6">
                        <span>{salesSeries[0]?.label || salesSeries[0]?.date}</span>
                        {salesSeries.length > 2 && (
                          <span>{salesSeries[Math.floor(salesSeries.length / 2)]?.label}</span>
                        )}
                        <span>{salesSeries[salesSeries.length - 1]?.label || salesSeries[salesSeries.length - 1]?.date}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <ShoppingBag className="w-8 h-8 text-[var(--merchant-text-muted)] opacity-40 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[var(--merchant-text)]">
                        No sales recorded in this period
                      </p>
                      <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                        Completed transactions will appear on this timeline.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* PAYMENT MIX DONUT (~30%) */}
              <div className="lg:col-span-4 bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 md:p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="mb-3">
                    <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <span>Payment Mix</span>
                    </h2>
                    <p className="text-[11px] text-[var(--merchant-text-muted)]">
                      Order volume by payment channel
                    </p>
                  </div>

                  {paymentMix.length > 0 ? (
                    <div className="flex flex-col items-center">
                      {/* Donut SVG */}
                      <div className="relative w-36 h-36 my-1">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          {/* Background Track */}
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke="var(--merchant-surface-muted)"
                            strokeWidth="11"
                          />
                          {/* Segment Rings */}
                          {paymentSegments.map((seg, i) => (
                            <circle
                              key={i}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke={seg.color}
                              strokeWidth="11"
                              strokeDasharray={seg.dashArray}
                              strokeDashoffset={seg.dashOffset}
                              className="transition-all duration-500"
                            />
                          ))}
                        </svg>

                        {/* Center Stat */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          <span className="text-base font-black text-[var(--merchant-text)] tracking-tight leading-tight">
                            {metrics.orders}
                          </span>
                          <span className="text-[9px] font-bold text-[var(--merchant-text-muted)] uppercase tracking-wider">
                            Orders
                          </span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="w-full space-y-2 mt-2 pt-2 border-t border-[var(--merchant-border)]">
                        {paymentSegments.map((seg, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: seg.color }}
                              />
                              <span className="font-semibold text-[var(--merchant-text)] truncate">
                                {seg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--merchant-text-muted)] shrink-0">
                              <span>{seg.ordersCount}</span>
                              <span className="font-bold text-[var(--merchant-text)]">
                                ({seg.pct}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <CreditCard className="w-8 h-8 text-[var(--merchant-text-muted)] opacity-40 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[var(--merchant-text)]">
                        No payments yet
                      </p>
                      <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                        Payment breakdown will display when orders are placed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ROW 3: TOP PRODUCTS (~42%) + CUSTOMERS (~25%) + TOP LOCATIONS (~33%) */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
              {/* 1. TOP PRODUCTS (Horizontal Bar Chart) */}
              <div className="lg:col-span-5 bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 md:p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[var(--merchant-primary)]" />
                        <span>Top Products</span>
                      </h2>
                      <p className="text-[11px] text-[var(--merchant-text-muted)]">
                        Top 5 best performing items
                      </p>
                    </div>

                    <div className="inline-flex items-center bg-[var(--merchant-surface-muted)] p-0.5 rounded-lg border border-[var(--merchant-border)]">
                      <button
                        type="button"
                        data-testid="toggle-product-revenue"
                        onClick={() => setTopProductMetric('revenue')}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                          topProductMetric === 'revenue'
                            ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] font-bold shadow-xs'
                            : 'text-[var(--merchant-text-secondary)]'
                        }`}
                      >
                        Revenue
                      </button>
                      <button
                        type="button"
                        data-testid="toggle-product-quantity"
                        onClick={() => setTopProductMetric('quantity')}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                          topProductMetric === 'quantity'
                            ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] font-bold shadow-xs'
                            : 'text-[var(--merchant-text-secondary)]'
                        }`}
                      >
                        Units
                      </button>
                    </div>
                  </div>

                  {displayedTopProducts.length > 0 ? (
                    <div className="space-y-2.5">
                      {displayedTopProducts.slice(0, 5).map((p: any, i: number) => {
                        const val =
                          topProductMetric === 'revenue' ? p.revenuePaise : p.quantitySold;
                        const fillPercent = Math.min(100, Math.max(6, Math.round((val / maxProductVal) * 100)));

                        return (
                          <div key={p.id || i} className="text-xs group">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-[10px] text-[var(--merchant-text-muted)] w-3 text-center">
                                  {i + 1}
                                </span>
                                <div className="w-6 h-6 rounded-md bg-[var(--merchant-surface-muted)] overflow-hidden shrink-0 border border-[var(--merchant-border)]">
                                  {p.imageUrl ? (
                                    <SafeImage
                                      src={p.imageUrl}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--merchant-text-muted)]">
                                      <Package className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                                <span className="font-semibold text-[var(--merchant-text)] truncate max-w-[170px]">
                                  {p.name}
                                </span>
                              </div>

                              <div className="text-right shrink-0 font-bold text-[var(--merchant-text)] text-xs">
                                {topProductMetric === 'revenue'
                                  ? formatPaise(p.revenuePaise)
                                  : `${p.quantitySold} units`}
                              </div>
                            </div>

                            {/* Horizontal Bar */}
                            <div className="w-full bg-[var(--merchant-surface-muted)] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[var(--merchant-primary)] h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-[var(--merchant-text-muted)]">
                      No product sales recorded in this period.
                    </div>
                  )}
                </div>
              </div>

              {/* 2. CUSTOMERS VISUAL (~25%) */}
              <div className="lg:col-span-3 bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 md:p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="mb-3">
                    <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>Customers</span>
                    </h2>
                    <p className="text-[11px] text-[var(--merchant-text-muted)]">
                      New vs returning buyer split
                    </p>
                  </div>

                  {customerSegments.totalBuyers > 0 ? (
                    <div className="flex flex-col items-center">
                      {/* Customer Split Donut */}
                      <div className="relative w-28 h-28 my-1">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                          {/* Background Track */}
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            fill="transparent"
                            stroke="var(--merchant-surface-muted)"
                            strokeWidth="9"
                          />
                          {/* New Customers Segment */}
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            fill="transparent"
                            stroke="var(--merchant-primary)"
                            strokeWidth="9"
                            strokeDasharray={customerSegments.newDash}
                            className="transition-all duration-500"
                          />
                          {/* Returning Customers Segment */}
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            fill="transparent"
                            stroke="#10B981"
                            strokeWidth="9"
                            strokeDasharray={customerSegments.retDash}
                            strokeDashoffset={customerSegments.retOffset}
                            className="transition-all duration-500"
                          />
                        </svg>

                        {/* Center Repeat Rate */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          <span className="text-sm font-black text-[var(--merchant-text)] tracking-tight leading-tight">
                            {customerInsights.repeatRate}%
                          </span>
                          <span className="text-[8px] font-bold text-[var(--merchant-text-muted)] uppercase tracking-wider">
                            Repeat
                          </span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="w-full space-y-1.5 mt-2 pt-2 border-t border-[var(--merchant-border)] text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--merchant-primary)] shrink-0" />
                            <span className="text-[var(--merchant-text)]">New Buyers</span>
                          </div>
                          <span className="font-semibold text-[var(--merchant-text)]">
                            {customerInsights.newCustomers} ({customerSegments.newPct}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-[var(--merchant-text)]">Returning</span>
                          </div>
                          <span className="font-semibold text-emerald-600">
                            {customerInsights.returningCustomers} ({customerSegments.retPct}%)
                          </span>
                        </div>
                      </div>

                      {/* Optional Top Buyer secondary snippet */}
                      {customerInsights.topCustomers?.[0] && (
                        <div className="w-full mt-2.5 pt-2 border-t border-[var(--merchant-border)] text-[11px] text-[var(--merchant-text-muted)] truncate">
                          <span className="font-semibold text-[var(--merchant-text)]">Top Customer:</span>{' '}
                          {customerInsights.topCustomers[0].name} · {customerInsights.topCustomers[0].ordersCount} orders · {formatPaise(customerInsights.topCustomers[0].totalSpendPaise)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-[var(--merchant-text-muted)]">
                      No customer orders recorded in this period.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. TOP LOCATIONS (~33%) */}
              <div className="lg:col-span-4 bg-[var(--merchant-surface)] rounded-xl md:rounded-2xl p-4 md:p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>Top Locations</span>
                      </h2>
                      <p className="text-[11px] text-[var(--merchant-text-muted)]">
                        Normalized geography
                      </p>
                    </div>

                    {topCities.length > 0 && (
                      <div className="inline-flex items-center bg-[var(--merchant-surface-muted)] p-0.5 rounded-lg border border-[var(--merchant-border)]">
                        <button
                          type="button"
                          onClick={() => setLocationMetric('state')}
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                            locationMetric === 'state'
                              ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] font-bold shadow-xs'
                              : 'text-[var(--merchant-text-secondary)]'
                          }`}
                        >
                          State
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationMetric('city')}
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                            locationMetric === 'city'
                              ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] font-bold shadow-xs'
                              : 'text-[var(--merchant-text-secondary)]'
                          }`}
                        >
                          City
                        </button>
                      </div>
                    )}
                  </div>

                  {displayedLocations.length > 0 ? (
                    <div className="space-y-2.5">
                      {displayedLocations.slice(0, 5).map((loc: any, i: number) => {
                        const label = locationMetric === 'state' ? loc.state : loc.city;
                        const fillPercent = Math.min(
                          100,
                          Math.max(6, Math.round((loc.ordersCount / maxLocationCount) * 100))
                        );

                        return (
                          <div key={i} className="text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-[var(--merchant-text)] truncate max-w-[160px]">
                                {label}
                              </span>
                              <span className="font-mono text-[11px] text-[var(--merchant-text-muted)]">
                                {loc.ordersCount} ord · {formatPaise(loc.revenuePaise)}
                              </span>
                            </div>

                            {/* Horizontal Bar */}
                            <div className="w-full bg-[var(--merchant-surface-muted)] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-[var(--merchant-text-muted)]">
                      No geographic order data recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ROW 4: DETERMINISTIC BUSINESS INSIGHT STRIP */}
            <section className="bg-[var(--merchant-surface-muted)] rounded-xl md:rounded-2xl p-4 md:p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--merchant-primary)]/10 text-[var(--merchant-primary)] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--merchant-text)] tracking-tight uppercase">
                    Business Insight
                  </h3>
                  <p className="text-xs text-[var(--merchant-text-secondary)] mt-0.5 leading-relaxed max-w-3xl">
                    {businessInsightText}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push('/orders')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--merchant-primary)] hover:text-[var(--merchant-primary-hover)] shrink-0 self-start sm:self-auto transition-colors"
              >
                <span>View Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

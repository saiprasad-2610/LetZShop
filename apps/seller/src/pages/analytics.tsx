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
  Calendar,
  ArrowRight,
  UserCheck,
  ChevronDown,
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

export default function AnalyticsPage() {
  const { user, store, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toggles
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [topProductMetric, setTopProductMetric] = useState<'revenue' | 'quantity'>('revenue');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const loadAnalytics = useCallback(
    async (period: PeriodKey, startDate?: string, endDate?: string) => {
      if (!store) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.seller.getDashboard({
          period,
          startDate: period === 'custom' ? startDate || customStart : undefined,
          endDate: period === 'custom' ? endDate || customEnd : undefined,
        });
        setDashboardData(res);
      } catch (err: any) {
        console.error('Failed to load business analytics:', err);
        setError(err?.message || 'Failed to load business analytics.');
      } finally {
        setLoading(false);
      }
    },
    [store, customStart, customEnd]
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
    if (store && selectedPeriod !== 'custom') {
      loadAnalytics(selectedPeriod);
    }
  }, [authLoading, user, store, selectedPeriod, loadAnalytics]);

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
    loadAnalytics('custom', customStart, customEnd);
  };

  const salesSeries: any[] = dashboardData?.salesSeries || [];
  const topProducts = dashboardData?.topProducts || { byRevenue: [], byQuantity: [] };
  const customerInsights = dashboardData?.customerInsights || {
    newCustomers: 0,
    returningCustomers: 0,
    repeatRate: 0,
    topCustomers: [],
  };
  const topLocations: any[] = dashboardData?.topLocations || [];
  const recentOrders: any[] = dashboardData?.recentOrders || [];

  // SVG Chart Computations
  const chartPoints = useMemo(() => {
    if (!salesSeries || salesSeries.length === 0) return [];
    const maxVal = Math.max(
      ...salesSeries.map((s) => (chartMetric === 'revenue' ? s.revenuePaise : s.orders)),
      chartMetric === 'revenue' ? 10000 : 5
    );

    const width = 600;
    const height = 180;
    const paddingX = 20;
    const paddingY = 20;

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
    return `${chartPath} L ${last.x} 160 L ${first.x} 160 Z`;
  }, [chartPoints, chartPath]);

  const displayedTopProducts =
    topProductMetric === 'revenue' ? topProducts.byRevenue : topProducts.byQuantity;

  return (
    <Layout title="Analytics">
      <Head>
        <title>Analytics | Simply Merchant Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Header Bar */}
        <section className="bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--merchant-text)]">
              Analytics
            </h1>
            <p className="text-xs sm:text-sm text-[var(--merchant-text-muted)] mt-1">
              Understand how your business is performing over time.
            </p>
          </div>

          {/* Period Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop chips */}
            <div className="hidden sm:inline-flex items-center bg-[var(--merchant-surface-muted)] p-1 rounded-xl border border-[var(--merchant-border)]">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handlePeriodChange(opt.key)}
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

            {/* Mobile dropdown */}
            <div className="sm:hidden relative">
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value as PeriodKey)}
                className="appearance-none bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] text-[var(--merchant-text)] text-xs font-semibold rounded-xl px-3 py-2 pr-8 shadow-2xs focus:outline-hidden"
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

        {/* Custom Date Range if active */}
        {showCustomPicker && (
          <div className="bg-[var(--merchant-surface)] p-4 rounded-xl border border-[var(--merchant-border)] flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--merchant-text)]">Custom Date Range:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-xs"
            />
            <span className="text-[var(--merchant-text-muted)]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-xs"
            />
            <button
              type="button"
              onClick={handleApplyCustomPeriod}
              className="px-3 py-1 bg-[var(--merchant-primary)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--merchant-primary-hover)]"
            >
              Apply Filter
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh] bg-[var(--merchant-surface)] rounded-2xl border border-[var(--merchant-border)]">
            <div className="text-center">
              <RefreshCw className="h-7 w-7 animate-spin text-[var(--merchant-text-muted)] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[var(--merchant-text-muted)] uppercase tracking-wider">
                Loading Analytics...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 1. SALES PERFORMANCE CHART */}
            <section className="bg-[var(--merchant-surface)] rounded-2xl p-5 md:p-6 border border-[var(--merchant-border)] shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-base font-bold text-[var(--merchant-text)] tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--merchant-primary)]" />
                    <span>Sales Performance</span>
                  </h2>
                  <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                    Revenue and order volume trends over {selectedPeriod}
                  </p>
                </div>

                <div className="inline-flex items-center bg-[var(--merchant-surface-muted)] p-1 rounded-xl border border-[var(--merchant-border)] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setChartMetric('revenue')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      chartMetric === 'revenue'
                        ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] font-bold shadow-xs'
                        : 'text-[var(--merchant-text-secondary)] hover:text-[var(--merchant-text)]'
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('orders')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      chartMetric === 'orders'
                        ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] font-bold shadow-xs'
                        : 'text-[var(--merchant-text-secondary)] hover:text-[var(--merchant-text)]'
                    }`}
                  >
                    Orders
                  </button>
                </div>
              </div>

              {chartPoints.length > 0 ? (
                <div className="relative">
                  <div className="w-full aspect-[21/9] max-h-[260px] overflow-hidden">
                    <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--merchant-primary)" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="var(--merchant-primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Gridlines */}
                      <line x1="20" y1="30" x2="580" y2="30" stroke="var(--merchant-border)" strokeDasharray="3 3" />
                      <line x1="20" y1="90" x2="580" y2="90" stroke="var(--merchant-border)" strokeDasharray="3 3" />
                      <line x1="20" y1="160" x2="580" y2="160" stroke="var(--merchant-border)" />

                      {/* Area Fill */}
                      <path d={chartAreaPath} fill="url(#chartGradient)" />

                      {/* Line */}
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
                    <div className="absolute top-2 right-4 bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)] text-xs px-3 py-1.5 rounded-lg shadow-lg border border-[var(--merchant-border)] pointer-events-none">
                      <div className="font-semibold text-[var(--merchant-text-muted)]">
                        {chartPoints[hoveredPointIndex].item.label || chartPoints[hoveredPointIndex].item.date}
                      </div>
                      <div className="font-bold text-[var(--merchant-text)] text-sm">
                        {chartMetric === 'revenue'
                          ? formatPaise(chartPoints[hoveredPointIndex].item.revenuePaise)
                          : `${chartPoints[hoveredPointIndex].item.orders} orders`}
                      </div>
                    </div>
                  )}

                  {/* X-Axis Labels */}
                  <div className="flex justify-between items-center text-[10px] text-[var(--merchant-text-muted)] font-mono mt-3 px-2">
                    <span>{salesSeries[0]?.label || salesSeries[0]?.date}</span>
                    {salesSeries.length > 2 && (
                      <span>{salesSeries[Math.floor(salesSeries.length / 2)]?.label}</span>
                    )}
                    <span>{salesSeries[salesSeries.length - 1]?.label || salesSeries[salesSeries.length - 1]?.date}</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[var(--merchant-text-muted)] text-xs">
                  No sales data recorded in this period.
                </div>
              )}
            </section>

            {/* 2. TWO-COLUMN: TOP PRODUCTS & CUSTOMER INSIGHTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <section className="bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight">Top Products</h2>
                      <p className="text-xs text-[var(--merchant-text-muted)]">Best performing items in selected period</p>
                    </div>

                    <div className="inline-flex items-center bg-[var(--merchant-surface-muted)] p-0.5 rounded-lg text-xs border border-[var(--merchant-border)]">
                      <button
                        type="button"
                        onClick={() => setTopProductMetric('revenue')}
                        className={`px-2 py-1 rounded-md font-semibold transition-all ${
                          topProductMetric === 'revenue' ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] shadow-xs font-bold' : 'text-[var(--merchant-text-secondary)]'
                        }`}
                      >
                        Revenue
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopProductMetric('quantity')}
                        className={`px-2 py-1 rounded-md font-semibold transition-all ${
                          topProductMetric === 'quantity' ? 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-primary)] shadow-xs font-bold' : 'text-[var(--merchant-text-secondary)]'
                        }`}
                      >
                        Quantity
                      </button>
                    </div>
                  </div>

                  {displayedTopProducts.length > 0 ? (
                    <div className="divide-y divide-[var(--merchant-border)]">
                      {displayedTopProducts.map((p: any, i: number) => (
                        <div key={p.id || i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[var(--merchant-text-muted)] font-bold w-4 text-center">{i + 1}</span>
                            <div className="w-9 h-9 rounded-lg bg-[var(--merchant-surface-muted)] overflow-hidden shrink-0 border border-[var(--merchant-border)]">
                              <SafeImage src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-[var(--merchant-text)] truncate">{p.name}</div>
                              <div className="text-[11px] text-[var(--merchant-text-muted)]">{p.quantitySold} units sold</div>
                            </div>
                          </div>
                          <div className="font-bold text-[var(--merchant-text)] shrink-0">
                            {formatPaise(p.revenuePaise)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-[var(--merchant-text-muted)] text-xs">
                      No product sales in this period.
                    </div>
                  )}
                </div>
              </section>

              {/* Customer Insights */}
              <section className="bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="mb-4">
                    <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight">Customer Insights</h2>
                    <p className="text-xs text-[var(--merchant-text-muted)]">Retention and high-value customer patterns</p>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--merchant-surface-muted)] rounded-xl border border-[var(--merchant-border)] mb-4 text-center">
                    <div>
                      <div className="text-[10px] font-bold text-[var(--merchant-text-muted)] uppercase">New</div>
                      <div className="text-base font-black text-[var(--merchant-text)] mt-0.5">
                        {customerInsights.newCustomers}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[var(--merchant-text-muted)] uppercase">Returning</div>
                      <div className="text-base font-black text-emerald-500 mt-0.5">
                        {customerInsights.returningCustomers}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[var(--merchant-text-muted)] uppercase">Repeat Rate</div>
                      <div className="text-base font-black text-[var(--merchant-primary)] mt-0.5">
                        {customerInsights.repeatRate}%
                      </div>
                    </div>
                  </div>

                  {/* Top Spenders */}
                  <div className="text-xs font-bold text-[var(--merchant-text-muted)] uppercase tracking-wider mb-2">
                    Top Spenders
                  </div>
                  {customerInsights.topCustomers && customerInsights.topCustomers.length > 0 ? (
                    <div className="divide-y divide-[var(--merchant-border)]">
                      {customerInsights.topCustomers.map((cust: any) => (
                        <div key={cust.id} className="py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)] font-bold flex items-center justify-center text-[10px] border border-[var(--merchant-border)]">
                              {cust.name?.[0] || 'C'}
                            </span>
                            <div>
                              <div className="font-semibold text-[var(--merchant-text)]">{cust.name}</div>
                              <div className="text-[10px] text-[var(--merchant-text-muted)]">{cust.ordersCount} orders</div>
                            </div>
                          </div>
                          <div className="font-bold text-[var(--merchant-text)]">
                            {formatPaise(cust.totalSpendPaise)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-[var(--merchant-text-muted)] text-xs">
                      No customer orders recorded in this period.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* 3. TWO-COLUMN: TOP LOCATIONS & RECENT ORDERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Locations */}
              <section className="bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] shadow-2xs">
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>Top Locations</span>
                  </h2>
                  <p className="text-xs text-[var(--merchant-text-muted)]">Pan-India state & city order concentration</p>
                </div>

                {topLocations.length > 0 ? (
                  <div className="space-y-3">
                    {topLocations.map((loc: any, i: number) => (
                      <div key={i} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[var(--merchant-text)]">{loc.state}</span>
                          <span className="text-[var(--merchant-text-muted)]">
                            {loc.ordersCount} orders · {formatPaise(loc.revenuePaise)}
                          </span>
                        </div>
                        <div className="w-full bg-[var(--merchant-surface-muted)] rounded-full h-2 overflow-hidden border border-[var(--merchant-border)]">
                          <div
                            className="bg-[var(--merchant-primary)] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, loc.percentage || 10))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-[var(--merchant-text-muted)] text-xs">
                    No geographic order data recorded yet.
                  </div>
                )}
              </section>

              {/* Recent Orders */}
              <section className="bg-[var(--merchant-surface)] rounded-2xl p-5 border border-[var(--merchant-border)] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--merchant-text)] tracking-tight">Recent Orders</h2>
                      <p className="text-xs text-[var(--merchant-text-muted)]">Latest 5 customer transactions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/orders')}
                      className="text-xs font-bold text-[var(--merchant-primary)] hover:text-[var(--merchant-primary-hover)] flex items-center gap-1"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {recentOrders.length > 0 ? (
                    <div className="divide-y divide-[var(--merchant-border)]">
                      {recentOrders.map((ord: any) => (
                        <div
                          key={ord.id}
                          onClick={() => router.push('/orders')}
                          className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-[var(--merchant-surface-muted)] rounded-lg px-2 -mx-2 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[var(--merchant-text)]">{ord.orderNumber}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                  ord.paymentStatus === 'PAID'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}
                              >
                                {ord.paymentStatus}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                              {ord.customerName || ord.customer?.fullName || 'Customer'}
                            </div>
                          </div>
                          <div className="font-bold text-[var(--merchant-text)]">
                            {formatPaise(ord.totalPaise)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-[var(--merchant-text-muted)] text-xs">
                      No orders recorded in this period.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

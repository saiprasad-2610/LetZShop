import React, { useState, useMemo, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Building2,
  Store,
  DollarSign,
  Package,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  Filter,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Percent,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react';
import type {
  AdminAnalytics,
  AdminAnalyticsPerformanceSeries,
  AdminRange,
} from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, useAdminQuery } from '../components/AdminUI';

type ChartMetric = 'gmv' | 'orders' | 'subscriptions' | 'merchants';

interface FilterOption {
  id: string;
  name: string;
}

function CompactFilterCombobox({
  icon: Icon,
  placeholder,
  value,
  onChange,
  options,
  widthClass = 'w-full sm:w-[240px]',
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  widthClass?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(term));
  }, [options, searchTerm]);

  return (
    <div className={`relative ${widthClass}`} ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`admin-input text-xs h-9 py-1 px-2.5 w-full flex items-center justify-between cursor-pointer select-none transition-colors ${
          value ? 'border-admin-accent/60 bg-admin-soft/40' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Icon className="w-3.5 h-3.5 text-admin-muted shrink-0" />
          <span className={selectedOption ? 'text-admin-text font-semibold truncate' : 'text-admin-muted truncate'}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchTerm('');
              }}
              className="p-0.5 rounded hover:bg-admin-raised text-admin-muted hover:text-admin-text"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className="w-3 h-3 text-admin-muted" />
        </div>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-admin-surface border border-admin-border rounded-xl shadow-2xl z-50 p-2 space-y-1.5 text-xs min-w-[200px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-admin-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              className="admin-input pl-8 pr-2 py-1 text-xs w-full"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 admin-scrollbar">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setSearchTerm('');
              }}
              className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between hover:bg-admin-raised transition-colors ${
                !value ? 'bg-admin-soft font-semibold text-admin-accent' : 'text-admin-secondary'
              }`}
            >
              <span className="truncate">{placeholder}</span>
              {!value && <Check className="w-3 h-3 text-admin-accent shrink-0" />}
            </button>
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-admin-muted text-[11px]">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between hover:bg-admin-raised transition-colors ${
                      isSelected ? 'bg-admin-soft font-semibold text-admin-accent' : 'text-admin-text'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-admin-accent shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<AdminRange>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeFrom, setActiveFrom] = useState('');
  const [activeTo, setActiveTo] = useState('');

  // Optional compact filters
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');

  // Active chart tab
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('gmv');

  // Hovered data point for tooltip
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const queryParams = useMemo(() => {
    const p: Record<string, any> = { range };
    if (range === 'custom') {
      if (activeFrom) p.from = activeFrom;
      if (activeTo) p.to = activeTo;
    }
    if (selectedMerchant) p.tenantId = selectedMerchant;
    if (selectedStore) p.storeId = selectedStore;
    if (selectedPlan) p.planId = selectedPlan;
    return p;
  }, [range, activeFrom, activeTo, selectedMerchant, selectedStore, selectedPlan]);

  const { data, loading, error, reload } = useAdminQuery<AdminAnalytics>(
    'admin/analytics',
    queryParams,
  );

  // Filter stores based on selected merchant
  const availableStores = useMemo(() => {
    if (!data?.filterOptions?.stores) return [];
    if (!selectedMerchant) return data.filterOptions.stores;
    return data.filterOptions.stores.filter((s) => s.tenantId === selectedMerchant);
  }, [data?.filterOptions?.stores, selectedMerchant]);

  const handleMerchantChange = (merchantId: string) => {
    setSelectedMerchant(merchantId);
    if (selectedStore && merchantId) {
      const storeStillBelongs = data?.filterOptions?.stores?.some(
        (s) => s.id === selectedStore && s.tenantId === merchantId
      );
      if (!storeStillBelongs) {
        setSelectedStore('');
      }
    }
  };

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      setActiveFrom(customFrom);
      setActiveTo(customTo);
      setRange('custom');
    }
  };

  const handleResetCustom = () => {
    setCustomFrom('');
    setCustomTo('');
    setActiveFrom('');
    setActiveTo('');
    setRange('30d');
  };

  // Performance chart points
  const points: AdminAnalyticsPerformanceSeries[] = data?.performanceChart?.series || [];
  const hasPoints = points.length > 0;

  const currentMetricValues = useMemo(() => {
    if (!hasPoints) return [];
    return points.map((p: AdminAnalyticsPerformanceSeries) => {
      switch (activeMetric) {
        case 'gmv':
          return p.gmvPaise;
        case 'orders':
          return p.ordersCount;
        case 'subscriptions':
          return p.subscriptionRevenuePaise;
        case 'merchants':
          return p.merchantsCount;
      }
    });
  }, [points, activeMetric, hasPoints]);

  const maxMetricValue = Math.max(...currentMetricValues, 1);

  const isMoneyMetric = activeMetric === 'gmv' || activeMetric === 'subscriptions';

  const formatMetricValue = (val: number) => {
    if (isMoneyMetric) return formatPaise(val);
    return val.toLocaleString('en-IN');
  };

  return (
    <AdminLayout>
      <Head>
        <title>Platform Analytics — LetzShop Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header with Title and Range Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-admin-accent" />
              <h1 className="text-2xl font-bold tracking-tight text-admin-text">
                Platform Analytics
              </h1>
            </div>
            <p className="text-sm text-admin-muted mt-1">
              Understand marketplace growth, customer sales, and SaaS revenue with real PostgreSQL aggregates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Range Buttons */}
            <div className="inline-flex rounded-xl p-1 bg-admin-raised border border-admin-border text-xs">
              {(
                [
                  ['7d', '7D'],
                  ['30d', '30D'],
                  ['90d', '90D'],
                  ['12m', '12M'],
                  ['CUSTOM', 'Custom'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => {
                    setRange(val as AdminRange);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    range === val
                      ? 'bg-admin-surface text-admin-accent shadow-xs'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => reload()}
              className="admin-secondary text-xs flex items-center gap-1.5 px-3 py-2"
              title="Refresh analytics data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {range === 'custom' && (
          <div className="p-4 rounded-xl border border-admin-border bg-admin-surface flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-admin-muted" />
              <span className="font-semibold text-admin-secondary">From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="admin-input text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-admin-secondary">To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="admin-input text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyCustom}
                disabled={!customFrom || !customTo}
                className="btn-admin-primary px-3 py-1.5 font-semibold text-xs disabled:opacity-50"
              >
                Apply Range
              </button>
              <button
                onClick={handleResetCustom}
                className="admin-secondary px-3 py-1.5 text-xs font-semibold"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Compact Filters Bar (Single-line toolbar on desktop) */}
        {data?.filterOptions && (
          <div className="p-2.5 sm:p-3 rounded-xl border border-admin-border/80 bg-admin-surface/70 flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-admin-muted font-semibold uppercase text-[10px] tracking-wider shrink-0 pr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Merchant Filter: 220–260px */}
            <CompactFilterCombobox
              icon={Building2}
              placeholder="All Merchants"
              value={selectedMerchant}
              onChange={handleMerchantChange}
              options={data.filterOptions.merchants}
              widthClass="w-full sm:w-[240px]"
            />

            {/* Store Filter: 220–260px (Cascades from Merchant) */}
            <CompactFilterCombobox
              icon={Store}
              placeholder="All Stores"
              value={selectedStore}
              onChange={setSelectedStore}
              options={availableStores}
              widthClass="w-full sm:w-[240px]"
            />

            {/* Plan Filter: 180–220px */}
            <CompactFilterCombobox
              icon={CreditCard}
              placeholder="All Plans"
              value={selectedPlan}
              onChange={setSelectedPlan}
              options={data.filterOptions.plans}
              widthClass="w-full sm:w-[200px]"
            />

            {(selectedMerchant || selectedStore || selectedPlan) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMerchant('');
                  setSelectedStore('');
                  setSelectedPlan('');
                }}
                className="text-admin-muted hover:text-admin-accent flex items-center gap-1 font-semibold sm:ml-auto px-2 py-1 rounded hover:bg-admin-raised transition-colors"
                title="Clear all filters"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        )}

        <Feedback error={error} loading={loading && !data} />

        {/* PRIMARY KPIs */}
        {data?.kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. GMV */}
            <div className="p-4 rounded-xl border border-admin-border bg-admin-surface shadow-xs">
              <div className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-admin-accent" />
                <span>GMV</span>
              </div>
              <div
                className="text-xl sm:text-2xl font-bold text-admin-text mt-1.5 truncate tabular-nums"
                data-kpi="Paid customer order GMV"
              >
                {formatPaise(data.kpis.totalGmvPaise)}
              </div>
              <div className="text-[10px] text-admin-muted mt-1">Paid customer orders</div>
            </div>

            {/* 2. Orders */}
            <div className="p-4 rounded-xl border border-admin-border bg-admin-surface shadow-xs">
              <div className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                <span>Orders</span>
              </div>
              <div
                className="text-xl sm:text-2xl font-bold text-admin-text mt-1.5 truncate tabular-nums"
                data-kpi="Orders"
              >
                {data.kpis.totalOrders.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-admin-muted mt-1">Created in range</div>
            </div>

            {/* 3. AOV */}
            <div className="p-4 rounded-xl border border-admin-border bg-admin-surface shadow-xs">
              <div className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-500" />
                <span>AOV</span>
              </div>
              <div
                className="text-xl sm:text-2xl font-bold text-admin-text mt-1.5 truncate tabular-nums"
                data-kpi="Paid order average"
              >
                {formatPaise(data.kpis.averageOrderValuePaise)}
              </div>
              <div className="text-[10px] text-admin-muted mt-1">Avg paid order value</div>
            </div>

            {/* 4. Subscription Revenue */}
            <div className="p-4 rounded-xl border border-admin-border bg-admin-surface shadow-xs">
              <div className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>SaaS Revenue</span>
              </div>
              <div
                className="text-xl sm:text-2xl font-bold text-admin-text mt-1.5 truncate tabular-nums"
                data-kpi="Subscription revenue"
              >
                {formatPaise(data.kpis.subscriptionRevenuePaise)}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                SaaS platform subs
              </div>
            </div>

            {/* 5. Merchants */}
            <div className="p-4 rounded-xl border border-admin-border bg-admin-surface shadow-xs">
              <div className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Merchants</span>
              </div>
              <div
                className="text-xl sm:text-2xl font-bold text-admin-text mt-1.5 truncate tabular-nums"
                data-kpi="Merchants"
              >
                {(data.kpis.merchantsCreated ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-admin-muted mt-1">Created in range</div>
            </div>

            {/* 6. Active Stores */}
            <div className="p-4 rounded-xl border border-admin-border bg-admin-surface shadow-xs">
              <div className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-purple-500" />
                <span>Active Stores</span>
              </div>
              <div
                className="text-xl sm:text-2xl font-bold text-admin-text mt-1.5 truncate tabular-nums"
                data-kpi="Active Stores"
              >
                {(data.kpis.activeStores ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-admin-muted mt-1">Live active stores</div>
            </div>
          </div>
        )}

        {/* MAIN PERFORMANCE CHART */}
        <div className="p-5 rounded-2xl border border-admin-border bg-admin-surface shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-admin-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-admin-text">Platform Performance</h2>
              <p className="text-xs text-admin-muted mt-0.5">
                Aggregated time-series trend across customer commerce and platform SaaS.
              </p>
            </div>

            {/* Metric Switcher Tabs */}
            <div className="inline-flex rounded-xl p-1 bg-admin-raised border border-admin-border text-xs self-start sm:self-auto">
              {(
                [
                  ['gmv', 'GMV'],
                  ['orders', 'Orders'],
                  ['subscriptions', 'Subscriptions'],
                  ['merchants', 'Merchants'],
                ] as const
              ).map(([metricKey, label]) => (
                <button
                  key={metricKey}
                  onClick={() => {
                    setActiveMetric(metricKey);
                    setHoveredIndex(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    activeMetric === metricKey
                      ? 'bg-admin-surface text-admin-accent shadow-xs'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart Area */}
          {!hasPoints || !currentMetricValues.some((v) => (v || 0) > 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-sm text-admin-muted border border-dashed border-admin-border/70 rounded-xl bg-admin-raised/20 p-6 text-center space-y-2">
              <AlertCircle className="w-7 h-7 text-admin-muted/60" />
              <div className="font-semibold text-admin-text">
                No {activeMetric === 'gmv' ? 'GMV' : activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} recorded for this period
              </div>
              <p className="text-xs text-admin-muted max-w-sm">
                There are zero recorded events in the selected range. Try switching to a broader timeframe (e.g. 90D or 12M) or clearing active filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Metric Summary & Tooltip Display */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-admin-secondary uppercase tracking-wider text-[11px]">
                    {activeMetric === 'gmv' && 'Customer Order GMV'}
                    {activeMetric === 'orders' && 'Customer Orders'}
                    {activeMetric === 'subscriptions' && 'SaaS Subscription Revenue'}
                    {activeMetric === 'merchants' && 'New Merchant Onboardings'}
                  </span>
                  {hoveredIndex !== null && points[hoveredIndex] && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md animate-in fade-in duration-100">
                      {points[hoveredIndex].date}: {formatMetricValue(currentMetricValues[hoveredIndex])}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-admin-muted font-mono">
                  <span>Peak: {formatMetricValue(maxMetricValue)}</span>
                  <span>Interval: {data?.performanceChart?.interval ? (data.performanceChart.interval.charAt(0).toUpperCase() + data.performanceChart.interval.slice(1) + 'ly') : 'Daily'}</span>
                </div>
              </div>

              {/* Chart Plot Container with Visible High-Contrast Marks */}
              <div className="h-60 w-full flex flex-col pt-3 pb-2 px-1 relative">
                {/* Background scale gridlines */}
                <div className="absolute inset-x-1 top-3 bottom-7 flex flex-col justify-between pointer-events-none opacity-25">
                  <div className="border-b border-dashed border-admin-border w-full" />
                  <div className="border-b border-dashed border-admin-border w-full" />
                  <div className="border-b border-dashed border-admin-border w-full" />
                </div>

                {/* Bars track */}
                <div className="flex-1 w-full flex items-end gap-1 sm:gap-1.5 overflow-x-auto admin-scrollbar relative z-10">
                  {points.map((p: AdminAnalyticsPerformanceSeries, idx: number) => {
                    const val = currentMetricValues[idx] || 0;
                    // Ensure non-zero values have minimum visible height (at least 10% of chart height)
                    const heightPercent = val > 0 ? Math.max(Math.round((val / maxMetricValue) * 100), 10) : 0;
                    const isHovered = hoveredIndex === idx;

                    return (
                      <div
                        key={p.date}
                        className="flex-1 min-w-[14px] sm:min-w-[18px] max-w-[48px] h-full flex flex-col justify-end items-center group cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Bar Track & Fill */}
                        <div className="flex-1 w-full min-h-0 relative flex items-end justify-center">
                          {val > 0 ? (
                            <div
                              className={`w-full rounded-t-sm transition-all duration-150 ${
                                isHovered
                                  ? 'bg-emerald-400 dark:bg-emerald-300 ring-2 ring-emerald-400/50 shadow-md'
                                  : 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 shadow-xs border-t border-emerald-400/40'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          ) : (
                            <div className="w-full h-0.5 bg-admin-border/50 rounded-full" />
                          )}
                        </div>

                        {/* X-axis Date Label (truncated) */}
                        <div className="text-[10px] text-admin-muted truncate w-full text-center mt-1.5 font-mono select-none">
                          {p.date.slice(5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECONDARY ANALYTICS GRID (Balanced 2-column lower grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Order Status Mix */}
          <div className="p-5 rounded-2xl border border-admin-border bg-admin-surface shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-admin-border/60 pb-3">
              <h3 className="text-sm font-bold text-admin-text uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-admin-accent" />
                <span>Order Status Mix</span>
              </h3>
              <span className="text-xs text-admin-muted font-mono">
                {data?.orderStatusMix?.reduce((acc, i) => acc + i.count, 0) || 0} total
              </span>
            </div>

            {data?.orderStatusMix && data.orderStatusMix.length > 0 ? (
              <div className="space-y-3">
                {/* Visual Proportion Bar */}
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-admin-raised">
                  {data.orderStatusMix.map((item, idx) => {
                    const colors = [
                      'bg-emerald-500',
                      'bg-blue-500',
                      'bg-purple-500',
                      'bg-amber-500',
                      'bg-indigo-500',
                      'bg-rose-500',
                      'bg-slate-400',
                    ];
                    return (
                      <div
                        key={item.status}
                        title={`${item.status}: ${item.count} (${item.percentage}%)`}
                        className={`${colors[idx % colors.length]} h-full transition-all`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    );
                  })}
                </div>

                {/* Status Breakdown Table */}
                <div className="divide-y divide-admin-border/60 text-xs">
                  {data.orderStatusMix.map((item) => (
                    <div key={item.status} className="py-2 flex items-center justify-between">
                      <span className="font-semibold text-admin-text">{item.status}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-admin-muted font-mono">{item.count} orders</span>
                        <span className="font-bold text-admin-text w-12 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-admin-muted">
                No customer orders recorded in this date range.
              </div>
            )}
          </div>

          {/* 2. Payment Mix */}
          <div className="p-5 rounded-2xl border border-admin-border bg-admin-surface shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-admin-border/60 pb-3">
              <h3 className="text-sm font-bold text-admin-text uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-admin-accent" />
                <span>Payment Mix</span>
              </h3>
              <span className="text-xs text-admin-muted font-mono">
                {data?.paymentMix?.reduce((acc, i) => acc + i.count, 0) || 0} orders
              </span>
            </div>

            {data?.paymentMix && data.paymentMix.length > 0 ? (
              <div className="space-y-3">
                {/* Visual Proportion Bar */}
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-admin-raised">
                  {data.paymentMix.map((item, idx) => {
                    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                    return (
                      <div
                        key={item.method}
                        title={`${item.method}: ${item.count} (${item.percentage}%)`}
                        className={`${colors[idx % colors.length]} h-full transition-all`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    );
                  })}
                </div>

                {/* Payment Breakdown Table */}
                <div className="divide-y divide-admin-border/60 text-xs">
                  {data.paymentMix.map((item) => (
                    <div key={item.method} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-admin-text block">{item.method}</span>
                        <span className="text-[11px] text-admin-muted font-mono">
                          {formatPaise(item.totalPaise)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-admin-muted font-mono">{item.count} orders</span>
                        <span className="font-bold text-admin-text w-12 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-admin-muted">
                No payment transactions recorded in this date range.
              </div>
            )}
          </div>

          {/* 3. Top Stores */}
          <div className="p-5 rounded-2xl border border-admin-border bg-admin-surface shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-admin-border/60 pb-3">
              <h3 className="text-sm font-bold text-admin-text uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-admin-accent" />
                <span>Top Stores by Volume</span>
              </h3>
              <span className="text-xs text-admin-muted">Ranked by orders & GMV</span>
            </div>

            {data?.topStores && data.topStores.length > 0 ? (
              <div className="overflow-x-auto admin-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-admin-raised text-admin-muted font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Store / Merchant</th>
                      <th className="px-3 py-2 text-right">Orders</th>
                      <th className="px-3 py-2 text-right">GMV</th>
                      <th className="px-3 py-2 text-right">AOV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/60">
                    {data.topStores.map((s) => (
                      <tr key={s.id} className="hover:bg-admin-raised/40 transition-colors">
                        <td className="px-3 py-2.5">
                          {s.tenantId ? (
                            <Link
                              href={`/merchants/${s.tenantId}`}
                              className="font-semibold text-admin-text hover:text-admin-accent hover:underline block"
                            >
                              {s.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-admin-text block">{s.name}</span>
                          )}
                          <span className="text-[11px] text-admin-muted">{s.merchantName || '—'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-admin-secondary">
                          {s.ordersCount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-admin-text">
                          {formatPaise(s.gmvPaise)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-admin-muted">
                          {formatPaise(s.aovPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-admin-muted">
                No orders recorded in this date range.
              </div>
            )}
          </div>

          {/* 4. Top Products */}
          <div className="p-5 rounded-2xl border border-admin-border bg-admin-surface shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-admin-border/60 pb-3">
              <h3 className="text-sm font-bold text-admin-text uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-admin-accent" />
                <span>Top Products by Units Sold</span>
              </h3>
              <span className="text-xs text-admin-muted">Ranked by volume</span>
            </div>

            {data?.topProducts && data.topProducts.length > 0 ? (
              <div className="overflow-x-auto admin-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-admin-raised text-admin-muted font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Store</th>
                      <th className="px-3 py-2 text-right">Units</th>
                      <th className="px-3 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/60">
                    {data.topProducts.map((p) => (
                      <tr key={p.productId || p.sku} className="hover:bg-admin-raised/40 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-admin-text max-w-[180px] truncate">
                          {p.productName}
                        </td>
                        <td className="px-3 py-2.5 text-admin-secondary text-[11px]">
                          {p.storeName}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-admin-text">
                          {p.unitsSold}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-admin-secondary">
                          {formatPaise(p.revenuePaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-admin-muted">
                No product items sold in this date range.
              </div>
            )}
          </div>

          {/* 5. Review Moderation Analytics */}
          <div className="p-5 rounded-2xl border border-admin-border bg-admin-surface shadow-xs space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-admin-border/60 pb-3">
              <h3 className="text-sm font-bold text-admin-text uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-admin-accent" />
                <span>Review Moderation Health</span>
              </h3>
              <Link
                href="/reviews"
                className="text-xs text-admin-accent hover:underline font-semibold flex items-center gap-1"
              >
                <span>Moderate Reviews</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.reviewModeration ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl border border-admin-border bg-admin-raised/40">
                  <div className="text-[10px] uppercase font-bold text-admin-muted tracking-wider">
                    Reviews Created
                  </div>
                  <div className="text-xl font-bold text-admin-text mt-1">
                    {data.reviewModeration.reviewsCreated}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                    Reports Filed
                  </div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                    {data.reviewModeration.reportsCreated}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                  <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Reports Resolved
                  </div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    {data.reviewModeration.reportsResolved}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5">
                  <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                    Reviews Removed
                  </div>
                  <div className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                    {data.reviewModeration.reviewsRemoved}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-admin-border bg-admin-raised/40 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-admin-muted tracking-wider">
                    Avg Resolution Time
                  </div>
                  <div className="text-xl font-bold text-admin-text mt-1">
                    {data.reviewModeration.averageResolutionMinutes !== null && data.reviewModeration.averageResolutionMinutes !== undefined
                      ? `${Math.round(data.reviewModeration.averageResolutionMinutes / 60)}h`
                      : '—'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-admin-muted">
                No review moderation activity in this date range.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

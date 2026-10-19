import { useRouter } from 'next/router';
import Link from 'next/link';
import type { AdminPayment, AdminPaymentsResponse, AdminPlan } from '@simply/api-contracts';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, useAdminQuery } from '../components/AdminUI';
import { useAdminAttention } from '../context/AdminAttentionContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatPaise } from '@simply/ui';

export default function Payments() {
  const router = useRouter();
  const { api } = useAdminAuth();
  const { refreshAttention } = useAdminAttention();

  // Filter & Search states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [planId, setPlanId] = useState('ALL');
  const [gateway, setGateway] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customDateError, setCustomDateError] = useState('');
  const [sort, setSort] = useState('newest');

  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileMessage, setReconcileMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Synchronize status with router query
  useEffect(() => {
    const qStatus = router.query.status;
    if (typeof qStatus === 'string' && ['ALL', 'PAID', 'PENDING', 'FAILED', 'SUCCESS'].includes(qStatus.toUpperCase())) {
      setStatus(qStatus.toUpperCase() === 'PAID' ? 'SUCCESS' : qStatus.toUpperCase());
      setPage(1);
    }
  }, [router.query.status]);

  // Close filter popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch subscription payments query
  const queryParams: Record<string, any> = {
    page,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    status: status !== 'ALL' ? status : undefined,
    planId: planId !== 'ALL' ? planId : undefined,
    gateway: gateway !== 'ALL' ? gateway : undefined,
    range: dateRange !== 'ALL' ? dateRange : undefined,
    from: dateRange === 'CUSTOM' && customFrom ? customFrom : undefined,
    to: dateRange === 'CUSTOM' && customTo ? customTo : undefined,
    sort,
  };

  const { data, loading, error, reload } = useAdminQuery<AdminPaymentsResponse>(
    'admin/payments',
    queryParams,
  );

  // Fetch plans for filter dropdown
  const { data: plansData } = useAdminQuery<AdminPlan[]>('admin/plans');
  const plans = Array.isArray(plansData) ? plansData : [];

  // Active filters count & chips
  const activeFilters = [
    status !== 'ALL' && { key: 'status', label: `Status: ${status === 'SUCCESS' ? 'Successful' : status}`, clear: () => setStatus('ALL') },
    planId !== 'ALL' && {
      key: 'plan',
      label: `Plan: ${plans.find((p) => p.id === planId || p.code === planId)?.name || planId}`,
      clear: () => setPlanId('ALL'),
    },
    gateway !== 'ALL' && { key: 'gateway', label: `Gateway: ${gateway}`, clear: () => setGateway('ALL') },
    dateRange !== 'ALL' && {
      key: 'range',
      label: `Date: ${
        dateRange === 'TODAY'
          ? 'Today'
          : dateRange === '7d'
          ? 'Last 7 Days'
          : dateRange === '30d'
          ? 'Last 30 Days'
          : dateRange === '90d'
          ? 'Last 90 Days'
          : dateRange === 'THIS_MONTH'
          ? 'This Month'
          : dateRange === 'LAST_MONTH'
          ? 'Last Month'
          : `Custom (${customFrom || '...'} to ${customTo || '...'})`
      }`,
      clear: () => {
        setDateRange('ALL');
        setCustomFrom('');
        setCustomTo('');
        setCustomDateError('');
      },
    },
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  const clearAllFilters = () => {
    setStatus('ALL');
    setPlanId('ALL');
    setGateway('ALL');
    setDateRange('ALL');
    setCustomFrom('');
    setCustomTo('');
    setCustomDateError('');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  // Reconcile payment handler
  const handleReconcilePayment = async (paymentId: string) => {
    setReconciling(true);
    setReconcileMessage(null);
    try {
      const res = await api.admin.reconcileSubscriptionPayment(paymentId);
      setReconcileMessage({
        text: res.message || `Reconciliation completed: ${res.status}`,
        isError: false,
      });
      if (res.payment) {
        setSelectedPayment(res.payment);
      }
      reload();
      void refreshAttention();
    } catch (err: any) {
      setReconcileMessage({
        text: err?.message || 'Failed to reconcile payment with gateway.',
        isError: true,
      });
    } finally {
      setReconciling(false);
    }
  };

  const kpis = data?.kpis;
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const startRow = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalItems);

  return (
    <AdminLayout>
      <Head>
        <title>Subscription Payments — LetzShop Admin</title>
      </Head>

      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-admin-text">Subscription Payments</h1>
            <p className="mt-1 text-sm text-admin-muted">
              Track LetzShop subscription collections and payment issues
            </p>
          </div>
          <button
            className="admin-secondary flex items-center gap-2"
            onClick={() => {
              reload();
              void refreshAttention();
            }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Real KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-admin-border bg-admin-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                Collected Revenue
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                ₹
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-admin-text">
              {formatPaise(kpis?.collectedRevenuePaise || 0)}
            </div>
            <p className="mt-1 text-xs text-admin-muted">
              Successful subscription collections
            </p>
          </div>

          <div className="rounded-xl border border-admin-border bg-admin-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                Successful Payments
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-admin-text">
              {kpis?.successfulCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-admin-muted">Paid & verified invoices</p>
          </div>

          <div className="rounded-xl border border-admin-border bg-admin-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                Pending Payments
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-admin-text">
              {kpis?.pendingCount ?? 0}
            </div>
            <p
              className="mt-1 text-xs text-admin-muted cursor-help"
              title="Pending means LetzShop has created/received a payment attempt, but the gateway has not yet confirmed successful capture or final failure."
            >
              Payment initiated but not yet confirmed by the gateway.
            </p>
          </div>

          <div className="rounded-xl border border-admin-border bg-admin-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                Failed Payments
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-admin-text">
              {kpis?.failedCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-admin-muted">Actionable payment issues</p>
          </div>
        </div>

        {/* Toolbar: Search, Filters Popover, Sort */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[260px] flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-admin-muted">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                className="admin-input pl-9"
                placeholder="Search merchant, store, invoice, payment ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-admin-muted hover:text-admin-text"
                  onClick={() => setSearchInput('')}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Compact Filters Popover */}
            <div className="relative" ref={filtersRef}>
              <button
                type="button"
                className={`admin-secondary flex items-center gap-2 ${activeFilters.length > 0 ? 'border-admin-accent text-admin-accent' : ''}`}
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {activeFilters.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-admin-accent text-[11px] font-bold text-white">
                    {activeFilters.length}
                  </span>
                )}
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {filtersOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-80 space-y-4 rounded-xl border border-admin-border bg-admin-surface p-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-admin-border pb-2">
                    <span className="font-semibold text-admin-text">Filter Payments</span>
                    {activeFilters.length > 0 && (
                      <button
                        className="text-xs text-admin-accent hover:underline"
                        onClick={clearAllFilters}
                      >
                        Reset all
                      </button>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-admin-secondary mb-1">
                      Payment Status
                    </label>
                    <select
                      className="admin-input text-xs"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUCCESS">Successful / Paid</option>
                      <option value="PENDING">Pending</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>

                  {/* Plan */}
                  <div>
                    <label className="block text-xs font-medium text-admin-secondary mb-1">
                      Subscription Plan
                    </label>
                    <select
                      className="admin-input text-xs"
                      value={planId}
                      onChange={(e) => {
                        setPlanId(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="ALL">All Plans</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gateway */}
                  <div>
                    <label className="block text-xs font-medium text-admin-secondary mb-1">
                      Payment Gateway
                    </label>
                    <select
                      className="admin-input text-xs"
                      value={gateway}
                      onChange={(e) => {
                        setGateway(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="ALL">All Gateways</option>
                      <option value="RAZORPAY">Razorpay</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-xs font-medium text-admin-secondary mb-1">
                      Date Range
                    </label>
                    <select
                      className="admin-input text-xs"
                      value={dateRange}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDateRange(val);
                        setCustomDateError('');
                        if (val !== 'CUSTOM') {
                          setCustomFrom('');
                          setCustomTo('');
                          setPage(1);
                        }
                      }}
                    >
                      <option value="ALL">All Time</option>
                      <option value="TODAY">Today</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="THIS_MONTH">This Month</option>
                      <option value="LAST_MONTH">Last Month</option>
                      <option value="CUSTOM">Custom Date Range</option>
                    </select>
                  </div>

                  {/* Custom Date Range Picker */}
                  {dateRange === 'CUSTOM' && (
                    <div className="space-y-2 rounded-lg border border-admin-border bg-admin-raised/40 p-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-admin-muted mb-1">From Date</label>
                          <input
                            type="date"
                            className="admin-input text-xs py-1 px-2"
                            value={customFrom}
                            onChange={(e) => {
                              setCustomFrom(e.target.value);
                              setCustomDateError('');
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-admin-muted mb-1">To Date</label>
                          <input
                            type="date"
                            className="admin-input text-xs py-1 px-2"
                            value={customTo}
                            onChange={(e) => {
                              setCustomTo(e.target.value);
                              setCustomDateError('');
                            }}
                          />
                        </div>
                      </div>
                      {customDateError && (
                        <p className="text-[11px] text-rose-500 font-medium">{customDateError}</p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          className="text-[11px] text-admin-muted hover:text-admin-text"
                          onClick={() => {
                            setCustomFrom('');
                            setCustomTo('');
                            setCustomDateError('');
                            setDateRange('ALL');
                            setPage(1);
                          }}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className="admin-button text-[11px] py-1 px-2.5"
                          onClick={() => {
                            if (!customFrom || !customTo) {
                              setCustomDateError('Both From and To dates are required.');
                              return;
                            }
                            if (customFrom > customTo) {
                              setCustomDateError('From Date must be earlier than or equal to To Date.');
                              return;
                            }
                            setCustomDateError('');
                            setPage(1);
                            setFiltersOpen(false);
                          }}
                        >
                          Apply Custom
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-admin-border flex justify-end">
                    <button
                      className="admin-button text-xs py-1.5 px-3"
                      onClick={() => {
                        if (dateRange === 'CUSTOM') {
                          if (!customFrom || !customTo) {
                            setCustomDateError('Both From and To dates are required.');
                            return;
                          }
                          if (customFrom > customTo) {
                            setCustomDateError('From Date must be earlier than or equal to To Date.');
                            return;
                          }
                        }
                        setFiltersOpen(false);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-admin-muted hidden sm:inline">Sort:</span>
              <select
                className="admin-input text-xs w-auto min-w-[140px]"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_desc">Amount: High → Low</option>
                <option value="amount_asc">Amount: Low → High</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-admin-muted">Active filters:</span>
              {activeFilters.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-admin-raised border border-admin-border px-3 py-1 text-xs text-admin-text"
                >
                  {chip.label}
                  <button
                    type="button"
                    className="hover:text-admin-danger"
                    onClick={() => {
                      chip.clear();
                      setPage(1);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="text-xs text-admin-muted hover:text-admin-text underline ml-1"
                onClick={clearAllFilters}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <Feedback error={error} loading={loading} onRetry={reload} />

        {/* Scrollable Table Container */}
        <div className="rounded-xl border border-admin-border bg-admin-surface overflow-hidden shadow-sm">
          <div className="max-h-[580px] overflow-y-auto overflow-x-auto admin-scrollbar">
            <table className="admin-table w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-admin-raised shadow-[0_1px_0_0_var(--admin-border)]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Merchant</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Gateway</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Payment / Invoice</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {data?.items?.map((p) => {
                  const isSuccess = p.status === 'SUCCESS' || p.status === 'PAID';
                  const isPending = p.status === 'PENDING';
                  const isFailed = p.status === 'FAILED';

                  const merchantName = p.invoice?.tenant?.name || 'Unknown Merchant';
                  const merchantId = p.invoice?.tenant?.id;
                  const storeName = p.invoice?.tenant?.stores?.[0]?.name;
                  const planName = p.invoice?.subscription?.plan?.name || 'Standard';

                  return (
                    <tr key={p.id} className="hover:bg-admin-raised/60 transition-colors">
                      {/* Merchant */}
                      <td className="px-4 py-3.5 align-middle">
                        {merchantId ? (
                          <Link
                            href={`/merchants/${merchantId}`}
                            className="font-medium text-admin-text hover:text-admin-accent hover:underline block"
                          >
                            {merchantName}
                          </Link>
                        ) : (
                          <span className="font-medium text-admin-text">{merchantName}</span>
                        )}
                        {storeName && storeName !== merchantName && (
                          <span className="text-xs text-admin-muted block mt-0.5">{storeName}</span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5 align-middle">
                        <span className="inline-flex items-center rounded-md bg-admin-raised px-2 py-0.5 text-xs font-medium text-admin-secondary">
                          {planName}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 align-middle font-medium text-admin-text whitespace-nowrap">
                        {formatPaise(p.amountPaise)} {p.invoice?.currency || 'INR'}
                      </td>

                      {/* Gateway */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono text-admin-secondary">
                          {p.paymentMethod || 'RAZORPAY'}
                        </span>
                      </td>

                      {/* Payment / Invoice */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="font-mono text-xs text-admin-text truncate max-w-[180px]">
                          {p.providerPaymentId || <span className="text-admin-muted italic">Pending ID</span>}
                        </div>
                        {p.invoice?.invoiceNumber && (
                          <div className="text-xs text-admin-muted font-mono mt-0.5">
                            {p.invoice.invoiceNumber}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : isPending
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                : isFailed
                                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                  : 'bg-slate-500/10 text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSuccess ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                          {isSuccess ? 'Successful' : p.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 align-middle text-xs text-admin-muted whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="admin-secondary text-xs px-2.5 py-1"
                          onClick={() => {
                            setSelectedPayment(p);
                            setReconcileMessage(null);
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {!error && !loading && (!data?.items || data.items.length === 0) && (
              <div className="p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-admin-muted opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-3 text-base font-medium text-admin-text">No subscription payments found.</p>
                <p className="mt-1 text-xs text-admin-muted">
                  {activeFilters.length > 0 || debouncedSearch
                    ? 'Try adjusting your search criteria or clearing filters.'
                    : 'Subscription payment records will appear here as merchants subscribe.'}
                </p>
                {(activeFilters.length > 0 || debouncedSearch) && (
                  <button
                    className="mt-4 admin-secondary text-xs"
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* External Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-admin-border bg-admin-surface px-4 py-3 text-xs text-admin-muted">
            <div className="flex items-center gap-3">
              <span>
                Showing {startRow}–{endRow} of {totalItems}
              </span>
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  className="admin-input text-xs py-1 px-2 w-auto"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="admin-secondary px-2.5 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="font-medium text-admin-text">
                Page {page} of {totalPages}
              </span>
              <button
                className="admin-secondary px-2.5 py-1 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Detail Drawer / Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-admin-overlay p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-xl border border-admin-border bg-admin-surface p-6 shadow-2xl admin-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-admin-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-admin-text">Payment Details</h2>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selectedPayment.status === 'SUCCESS' || selectedPayment.status === 'PAID'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : selectedPayment.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {selectedPayment.status === 'SUCCESS' ? 'Successful' : selectedPayment.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-admin-muted">
                  ID: {selectedPayment.id}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-admin-muted hover:bg-admin-raised hover:text-admin-text"
                onClick={() => setSelectedPayment(null)}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Reconciliation Feedback message */}
            {reconcileMessage && (
              <div
                className={`rounded-lg p-3 text-xs ${
                  reconcileMessage.isError
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {reconcileMessage.text}
              </div>
            )}

            {/* Detail sections */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Merchant Context */}
              <div className="space-y-3 rounded-lg border border-admin-border bg-admin-raised/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                  Merchant & Store
                </span>
                <div>
                  <div className="text-xs text-admin-muted">Business Name</div>
                  <div className="text-sm font-semibold text-admin-text mt-0.5">
                    {selectedPayment.invoice?.tenant?.name || '—'}
                  </div>
                </div>
                {selectedPayment.invoice?.tenant?.stores?.[0]?.name && (
                  <div>
                    <div className="text-xs text-admin-muted">Store Name</div>
                    <div className="text-sm text-admin-text mt-0.5">
                      {selectedPayment.invoice.tenant.stores[0].name}
                    </div>
                  </div>
                )}
                {selectedPayment.invoice?.tenant?.id && (
                  <Link
                    href={`/merchants/${selectedPayment.invoice.tenant.id}`}
                    className="inline-flex items-center gap-1 text-xs text-admin-accent hover:underline font-medium"
                  >
                    View Merchant Profile →
                  </Link>
                )}
              </div>

              {/* Subscription Context */}
              <div className="space-y-3 rounded-lg border border-admin-border bg-admin-raised/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                  Subscription Plan
                </span>
                <div>
                  <div className="text-xs text-admin-muted">Plan</div>
                  <div className="text-sm font-semibold text-admin-text mt-0.5">
                    {selectedPayment.invoice?.subscription?.plan?.name || 'Standard'} (
                    {selectedPayment.invoice?.subscription?.plan?.code || 'TIER'})
                  </div>
                </div>
                {selectedPayment.invoice?.subscription?.currentPeriodStart && (
                  <div>
                    <div className="text-xs text-admin-muted">Billing Period</div>
                    <div className="text-xs text-admin-text mt-0.5">
                      {new Date(selectedPayment.invoice.subscription.currentPeriodStart).toLocaleDateString()} —{' '}
                      {new Date(selectedPayment.invoice.subscription.currentPeriodEnd || '').toLocaleDateString()}
                    </div>
                  </div>
                )}
                <Link
                  href="/subscriptions"
                  className="inline-flex items-center gap-1 text-xs text-admin-accent hover:underline font-medium"
                >
                  Manage Subscriptions →
                </Link>
              </div>

              {/* Financial & Invoice */}
              <div className="space-y-3 rounded-lg border border-admin-border bg-admin-raised/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                  Financial Record
                </span>
                <div>
                  <div className="text-xs text-admin-muted">Amount Paid</div>
                  <div className="text-base font-bold text-admin-text mt-0.5">
                    {formatPaise(selectedPayment.amountPaise)} {selectedPayment.invoice?.currency || 'INR'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-admin-muted">Invoice Number</div>
                  <div className="font-mono text-xs text-admin-text mt-0.5">
                    {selectedPayment.invoice?.invoiceNumber || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-admin-muted">Completed Date</div>
                  <div className="text-xs text-admin-text mt-0.5">
                    {selectedPayment.invoice?.paidAt
                      ? new Date(selectedPayment.invoice.paidAt).toLocaleString()
                      : 'Not completed'}
                  </div>
                </div>
                {selectedPayment.invoice?.id && (
                  <a
                    href={`/api/platform/admin/invoices/${selectedPayment.invoice.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-admin-accent hover:underline font-medium"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Invoice PDF
                  </a>
                )}
              </div>

              {/* Gateway Operations */}
              <div className="space-y-3 rounded-lg border border-admin-border bg-admin-raised/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                  Gateway Details
                </span>
                <div>
                  <div className="text-xs text-admin-muted">Payment Method</div>
                  <div className="text-xs font-mono text-admin-text mt-0.5">
                    {selectedPayment.paymentMethod || 'RAZORPAY'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-admin-muted">Gateway Payment ID</div>
                  <div className="font-mono text-xs text-admin-text break-all mt-0.5">
                    {selectedPayment.providerPaymentId || 'None registered'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-admin-muted">Created Timestamp</div>
                  <div className="text-xs text-admin-text mt-0.5">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </div>
                </div>
                {selectedPayment.metadata && typeof selectedPayment.metadata === 'object' && (
                  <div>
                    <div className="text-xs text-admin-muted">Gateway Metadata</div>
                    <pre className="mt-1 max-h-24 overflow-y-auto rounded bg-admin-surface p-2 font-mono text-[11px] text-admin-muted admin-scrollbar">
                      {JSON.stringify(selectedPayment.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Reconciliation Action for Failed or Pending payments */}
            {(selectedPayment.status === 'FAILED' || selectedPayment.status === 'PENDING') && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-admin-text">Reconciliation Action</h4>
                  <p className="text-xs text-admin-muted mt-0.5">
                    Verify this transaction against gateway records and update invoice state if verified.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-button text-xs py-2 px-4 disabled:opacity-50"
                  disabled={reconciling}
                  onClick={() => handleReconcilePayment(selectedPayment.id)}
                >
                  {reconciling ? 'Reconciling…' : 'Reconcile Payment'}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-admin-border pt-4">
              <button
                type="button"
                className="admin-secondary text-xs px-4 py-2"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

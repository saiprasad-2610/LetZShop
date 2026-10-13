import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { OrderDetailsDrawer } from '../components/OrderDetailsDrawer';
import { TableSkeleton } from '../components/ui/Skeletons';
import { formatPaise } from '@simply/ui';

// Canonical Order Status badge styling
const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  NEW: { label: 'New', bgClass: 'bg-blue-50 border border-blue-200', textClass: 'text-blue-700' },
  CONFIRMED: { label: 'Confirmed', bgClass: 'bg-indigo-50 border border-indigo-200', textClass: 'text-indigo-700' },
  ACCEPTED: { label: 'Accepted', bgClass: 'bg-cyan-50 border border-cyan-200', textClass: 'text-cyan-700' },
  READY: { label: 'Ready to Ship', bgClass: 'bg-amber-50 border border-amber-200', textClass: 'text-amber-800' },
  DISPATCHED: { label: 'Dispatched', bgClass: 'bg-purple-50 border border-purple-200', textClass: 'text-purple-700' },
  COMPLETED: { label: 'Completed', bgClass: 'bg-emerald-50 border border-emerald-200', textClass: 'text-emerald-700' },
  CANCELLED: { label: 'Cancelled', bgClass: 'bg-rose-50 border border-rose-200', textClass: 'text-rose-700' },
  RETURN_REQUESTED: { label: 'Return Req.', bgClass: 'bg-amber-50 border border-amber-200', textClass: 'text-amber-700' },
  RETURNED: { label: 'Returned', bgClass: 'bg-slate-100 border border-slate-200', textClass: 'text-slate-700' },
};

// Canonical Payment Status badge styling
const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  PAID: { label: 'Paid', bgClass: 'bg-emerald-50 border border-emerald-200', textClass: 'text-emerald-700' },
  PENDING: { label: 'Pending', bgClass: 'bg-amber-50 border border-amber-200', textClass: 'text-amber-700' },
  AUTHORIZED: { label: 'Authorized', bgClass: 'bg-blue-50 border border-blue-200', textClass: 'text-blue-700' },
  FAILED: { label: 'Failed', bgClass: 'bg-rose-50 border border-rose-200', textClass: 'text-rose-700' },
  REFUNDED: { label: 'Refunded', bgClass: 'bg-slate-100 border border-slate-200', textClass: 'text-slate-700' },
  PARTIALLY_REFUNDED: { label: 'Partial Ref.', bgClass: 'bg-slate-100 border border-slate-200', textClass: 'text-slate-700' },
};

export default function OrdersPage() {
  const { api, token, loading: authLoading } = useAuth();
  const router = useRouter();

  // Orders and Pagination state
  const [orders, setOrders] = useState<any[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<{
    all: number;
    needsAction: number;
    ready: number;
    dispatched: number;
    completed: number;
    cancelled: number;
  }>({
    all: 0,
    needsAction: 0,
    ready: 0,
    dispatched: 0,
    completed: 0,
    cancelled: 0,
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('ALL');

  // Loading and Drawer state
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync orderId query parameter with selectedOrder drawer
  useEffect(() => {
    if (router.query.orderId && orders.length > 0 && !selectedOrder) {
      const found = orders.find(
        (o) => o.id === router.query.orderId || o.orderNumber === router.query.orderId
      );
      if (found) setSelectedOrder(found);
    }
  }, [router.query.orderId, orders, selectedOrder]);

  // Compute date range ISO strings
  const computedDateRange = useMemo(() => {
    if (dateRange === 'ALL') return {};
    const now = new Date();
    let start = new Date();

    if (dateRange === 'TODAY') {
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === '7D') {
      start.setDate(now.getDate() - 7);
    } else if (dateRange === '30D') {
      start.setDate(now.getDate() - 30);
    }
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }, [dateRange]);

  // Fetch orders from API
  const fetchOrders = useCallback(
    async (isBackground = false) => {
      if (authLoading || !token) return;

      if (!isBackground) {
        if (orders.length === 0) setInitialLoading(true);
      }
      setRefreshing(true);
      setError(null);

      try {
        const queryParams: any = {
          page,
          pageSize,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          paymentStatus: paymentStatusFilter || undefined,
          startDate: computedDateRange.startDate,
          endDate: computedDateRange.endDate,
        };

        const res = await api.orders.getOrders(queryParams);
        const fetchedItems = res?.items || (Array.isArray(res) ? res : []);
        setOrders(fetchedItems);
        setTotalCount(res?.total ?? fetchedItems.length);
        setTotalPages(res?.totalPages ?? 1);
        setError(null);

        if (res?.summaryCounts) {
          setSummaryCounts(res.summaryCounts);
        }

        // If an order is currently selected, refresh its reference
        if (selectedOrder) {
          const updated = fetchedItems.find((it: any) => it.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      } catch (err: any) {
        console.error('Failed to load orders', err);
        setError(err.message || 'Failed to load orders. Please check your connection.');
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [api, token, authLoading, page, pageSize, debouncedSearch, statusFilter, paymentStatusFilter, computedDateRange, selectedOrder]
  );

  useEffect(() => {
    if (!authLoading && token) {
      fetchOrders();
    }
  }, [authLoading, token, page, debouncedSearch, statusFilter, paymentStatusFilter, dateRange]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count += 1;
    if (statusFilter) count += 1;
    if (paymentStatusFilter) count += 1;
    if (dateRange !== 'ALL') count += 1;
    return count;
  }, [debouncedSearch, statusFilter, paymentStatusFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setDateRange('ALL');
    setPage(1);
    setMobileFilterOpen(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const config = ORDER_STATUS_CONFIG[status] || {
      label: status,
      bgClass: 'bg-slate-100 border border-slate-200',
      textClass: 'text-slate-800',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${config.bgClass} ${config.textClass}`}
      >
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string, method?: string) => {
    const config = PAYMENT_STATUS_CONFIG[status] || {
      label: status,
      bgClass: 'bg-slate-100 border border-slate-200',
      textClass: 'text-slate-700',
    };
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bgClass} ${config.textClass}`}
        >
          {config.label}
        </span>
        {method && method !== 'MANUAL' && (
          <span className="text-[10px] font-semibold text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
            {method}
          </span>
        )}
      </div>
    );
  };

  return (
    <Layout title="Orders">
      <Head>
        <title>Orders | Simply Seller</title>
      </Head>

      <div className="space-y-5">
        {/* ================================================== */}
        {/* SECTION 3: PAGE HEADER                             */}
        {/* ================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--merchant-text)] tracking-tight">
              Orders
            </h1>
            <p className="text-xs sm:text-sm text-[var(--merchant-text-muted)] mt-0.5">
              Manage customer orders and fulfillment
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--merchant-text)] bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-xl hover:bg-[var(--merchant-surface-muted)] active:bg-[var(--merchant-surface-raised)] transition shadow-2xs disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[var(--merchant-primary)]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ================================================== */}
        {/* SECTION 4: ORDER SUMMARY COUNTS                    */}
        {/* ================================================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {[
            { key: '', label: 'All Orders', count: summaryCounts.all },
            { key: 'NEEDS_ACTION', label: 'Needs Action', count: summaryCounts.needsAction, highlight: summaryCounts.needsAction > 0 },
            { key: 'READY', label: 'Ready to Ship', count: summaryCounts.ready },
            { key: 'DISPATCHED', label: 'Dispatched', count: summaryCounts.dispatched },
            { key: 'COMPLETED', label: 'Completed', count: summaryCounts.completed },
            { key: 'CANCELLED', label: 'Cancelled', count: summaryCounts.cancelled },
          ].map((pill) => {
            const isSelected = statusFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => {
                  setStatusFilter(pill.key);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-[var(--merchant-primary)] text-white border-[var(--merchant-primary)] shadow-xs font-bold'
                    : 'bg-[var(--merchant-surface)] text-[var(--merchant-text)] border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)]'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    isSelected
                      ? 'bg-black/20 text-white'
                      : pill.highlight
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)]'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================================================== */}
        {/* SECTION 5: SEARCH + FILTER BAR (DESKTOP + MOBILE)  */}
        {/* ================================================== */}
        <div className="bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl p-3 shadow-2xs space-y-3">
          {/* Main search and quick filters row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--merchant-text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by order #, customer name, phone..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[var(--merchant-focus-ring)]/20 focus:border-[var(--merchant-focus-ring)] transition"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-2.5 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-2">
              {/* Order Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl px-2.5 py-2 font-medium hover:border-[var(--merchant-border-strong)] focus:outline-hidden focus:ring-2 focus:ring-[var(--merchant-focus-ring)]/20"
              >
                <option value="">All Statuses</option>
                <option value="NEEDS_ACTION">Needs Action (New/Accepted)</option>
                <option value="NEW">New</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="READY">Ready to Ship</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Payment Status Select */}
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl px-2.5 py-2 font-medium hover:border-[var(--merchant-border-strong)] focus:outline-hidden focus:ring-2 focus:ring-[var(--merchant-focus-ring)]/20"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
              </select>

              {/* Date Range Select */}
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl px-2.5 py-2 font-medium hover:border-[var(--merchant-border-strong)] focus:outline-hidden focus:ring-2 focus:ring-[var(--merchant-focus-ring)]/20"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="7D">Past 7 Days</option>
                <option value="30D">Past 30 Days</option>
              </select>

              {/* Clear Filters (Desktop) */}
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="px-2.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <div className="flex md:hidden items-center justify-between gap-2">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-semibold transition ${
                  activeFilterCount > 0
                    ? 'bg-[var(--merchant-primary-soft)] text-[var(--merchant-primary)] border-[var(--merchant-primary)]'
                    : 'bg-[var(--merchant-surface)] text-[var(--merchant-text)] border-[var(--merchant-border)]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters Modal / Sheet */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            <div className="bg-[var(--merchant-surface)] rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-[var(--merchant-border)] animate-in slide-in-from-bottom duration-200 text-[var(--merchant-text)]">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--merchant-border)]">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[var(--merchant-primary)]" />
                  <h3 className="font-bold text-[var(--merchant-text)] text-sm">Filter Orders</h3>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-[var(--merchant-text)] mb-1">
                  Order Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl p-2.5 font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="NEEDS_ACTION">Needs Action (New/Accepted)</option>
                  <option value="NEW">New</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="READY">Ready to Ship</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div>
                <label className="block text-xs font-semibold text-[var(--merchant-text)] mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="w-full text-xs bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl p-2.5 font-medium"
                >
                  <option value="">All Payments</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="AUTHORIZED">Authorized</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs font-semibold text-[var(--merchant-text)] mb-1">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'ALL', label: 'All Time' },
                    { key: 'TODAY', label: 'Today' },
                    { key: '7D', label: '7 Days' },
                    { key: '30D', label: '30 Days' },
                  ].map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setDateRange(d.key)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition ${
                        dateRange === d.key
                          ? 'bg-[var(--merchant-primary)] text-white border-[var(--merchant-primary)] font-bold'
                          : 'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text)] border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-raised)]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 py-2 text-xs font-semibold text-[var(--merchant-text-muted)] bg-[var(--merchant-surface-muted)] hover:bg-[var(--merchant-surface-raised)] rounded-xl transition"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setMobileFilterOpen(false);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] rounded-xl shadow-xs transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* SECTION 31: ERROR STATE                           */}
        {/* ================================================== */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-600 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[var(--merchant-text)]">Unable to load orders</p>
              <p className="text-rose-500 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => fetchOrders()}
              className="px-3 py-1 bg-[var(--merchant-surface)] border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-lg font-semibold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* ORDER CONTENT: DESKTOP TABLE & MOBILE CARDS       */}
        {/* ================================================== */}
        {initialLoading ? (
          <TableSkeleton columns={7} rows={6} />
        ) : orders.length === 0 ? (
          /* SECTION 10: EMPTY STATES */
          <div className="bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl p-8 sm:p-12 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[var(--merchant-surface-muted)] flex items-center justify-center mx-auto mb-3 text-[var(--merchant-text-muted)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            {activeFilterCount > 0 ? (
              <>
                <h3 className="text-base font-bold text-[var(--merchant-text)]">No orders match these filters</h3>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-1 max-w-sm mx-auto">
                  Try adjusting or clearing your search criteria, order status, or date range.
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-xl text-xs font-semibold transition shadow-xs"
                  >
                    Clear Filters
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-[var(--merchant-text)]">No orders yet</h3>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-1 max-w-sm mx-auto">
                  Customer orders will appear here once your store starts receiving them.
                </p>
                <div className="mt-4">
                  <Link
                    href="/store-preview"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-xl text-xs font-semibold transition shadow-xs"
                  >
                    <span>Preview Store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* -------------------------------------------------- */}
            {/* SECTION 6 & 7: DESKTOP TABLE (1024px and up)      */}
            {/* -------------------------------------------------- */}
            <div className="hidden lg:block bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--merchant-surface-muted)] border-b border-[var(--merchant-border)] text-[var(--merchant-text-muted)] font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Fulfillment / Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--merchant-border)]">
                    {orders.map((o) => {
                      const dt = formatDate(o.createdAt);
                      const itemsCount = o.itemsCount || o.items?.length || 1;
                      const summary =
                        o.itemsSummary ||
                        o.items?.[0]?.productName ||
                        o.items?.[0]?.variantTitle ||
                        o.items?.[0]?.titleSnapshot ||
                        'Order items';
                      const customerDisplayName =
                        o.customerName ||
                        o.customer?.fullName ||
                        o.orderAddress?.fullName ||
                        (o.deliveryAddress as any)?.fullName ||
                        'Guest Customer';
                      const customerDisplayPhone =
                        o.customerPhone ||
                        o.customer?.phone ||
                        o.orderAddress?.phone ||
                        (o.deliveryAddress as any)?.phone ||
                        '—';

                      return (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className="hover:bg-[var(--merchant-surface-muted)] transition cursor-pointer group"
                        >
                          {/* Order Number */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[var(--merchant-text)]">
                            #{o.orderNumber}
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[var(--merchant-text)] group-hover:text-[var(--merchant-primary)] transition">
                              {customerDisplayName}
                            </div>
                            <div className="text-[11px] text-[var(--merchant-text-muted)] font-mono">
                              {customerDisplayPhone}
                            </div>
                          </td>

                          {/* Items */}
                          <td className="py-3.5 px-4 max-w-xs truncate text-[var(--merchant-text-secondary)]">
                            <span className="font-semibold text-[var(--merchant-text)]">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                            </span>
                            <span className="text-[var(--merchant-text-muted)] block text-[11px] truncate">
                              {summary}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[var(--merchant-text)] text-sm whitespace-nowrap">
                            {formatPaise(o.totalAmountPaise ?? o.totalPaise ?? 0)}
                          </td>

                          {/* Payment */}
                          <td className="py-3.5 px-4">
                            {getPaymentStatusBadge(o.paymentStatus, o.paymentMethod)}
                          </td>

                          {/* Order Status */}
                          <td className="py-3.5 px-4">
                            {getOrderStatusBadge(o.status)}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-[var(--merchant-text-muted)] whitespace-nowrap">
                            <div className="font-medium text-[var(--merchant-text)]">{dt.date}</div>
                            <div className="text-[10px] text-[var(--merchant-text-muted)]">{dt.time}</div>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(o);
                              }}
                              className="px-3 py-1.5 bg-[var(--merchant-surface-muted)] hover:bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)] rounded-lg font-semibold text-xs transition inline-flex items-center gap-1 group-hover:bg-[var(--merchant-primary-soft)] group-hover:text-[var(--merchant-primary)]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* -------------------------------------------------- */}
            {/* SECTION 8: TABLET & MOBILE CARDS (<1024px)         */}
            {/* -------------------------------------------------- */}
            <div className="lg:hidden space-y-3">
              {orders.map((o) => {
                const dt = formatDate(o.createdAt);
                const itemsCount = o.itemsCount || o.items?.length || 1;
                const summary =
                  o.itemsSummary ||
                  o.items?.[0]?.productName ||
                  o.items?.[0]?.variantTitle ||
                  o.items?.[0]?.titleSnapshot ||
                  'Order items';
                const customerDisplayName =
                  o.customerName ||
                  o.customer?.fullName ||
                  o.orderAddress?.fullName ||
                  (o.deliveryAddress as any)?.fullName ||
                  'Guest Customer';
                const customerDisplayPhone =
                  o.customerPhone ||
                  o.customer?.phone ||
                  o.orderAddress?.phone ||
                  (o.deliveryAddress as any)?.phone ||
                  '—';

                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl p-4 shadow-2xs space-y-3 hover:border-[var(--merchant-border-strong)] transition cursor-pointer"
                  >
                    {/* Header Row: Order # and Total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--merchant-text)] text-sm">
                          #{o.orderNumber}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[var(--merchant-text)] text-sm">
                        {formatPaise(o.totalAmountPaise ?? o.totalPaise ?? 0)}
                      </span>
                    </div>

                    {/* Middle Row: Customer and Items */}
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--merchant-text)]">
                          {customerDisplayName}
                        </span>
                        <span className="text-[11px] text-[var(--merchant-text-muted)] font-medium">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      {customerDisplayPhone !== '—' && (
                        <p className="text-[11px] text-[var(--merchant-text-muted)] font-mono">
                          {customerDisplayPhone}
                        </p>
                      )}
                      <p className="text-[11px] text-[var(--merchant-text-muted)] truncate pt-0.5">
                        {summary}
                      </p>
                    </div>

                    {/* Badges Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--merchant-border)] flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {getPaymentStatusBadge(o.paymentStatus, o.paymentMethod)}
                        {getOrderStatusBadge(o.status)}
                      </div>
                    </div>

                    {/* Footer Row: Timestamp & View Order Button */}
                    <div className="flex items-center justify-between pt-2 text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-[var(--merchant-text-muted)]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {dt.date} · {dt.time}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(o);
                        }}
                        className="px-3 py-1 bg-[var(--merchant-surface-muted)] hover:bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)] rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Order</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ================================================== */}
            {/* SECTION 9: SERVER-SIDE PAGINATION                 */}
            {/* ================================================== */}
            {totalPages > 1 && (
              <div className="bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <p className="text-xs text-[var(--merchant-text-muted)] order-2 sm:order-1">
                  Showing{' '}
                  <span className="font-semibold text-[var(--merchant-text)]">
                    {(page - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-[var(--merchant-text)]">
                    {Math.min(page * pageSize, totalCount)}
                  </span>{' '}
                  of <span className="font-semibold text-[var(--merchant-text)]">{totalCount}</span> orders
                </p>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-semibold text-[var(--merchant-text)] bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-xl hover:bg-[var(--merchant-surface-muted)] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-semibold text-[var(--merchant-text)] px-2 font-mono">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs font-semibold text-[var(--merchant-text)] bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-xl hover:bg-[var(--merchant-surface-muted)] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* SECTION 11-18: ORDER DETAILS DRAWER               */}
      {/* ================================================== */}
      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => {
          setSelectedOrder(null);
          // Clean up router query if orderId was set
          if (router.query.orderId) {
            const { orderId, ...rest } = router.query;
            router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
          }
        }}
        onStatusUpdated={() => fetchOrders(true)}
      />
    </Layout>
  );
}

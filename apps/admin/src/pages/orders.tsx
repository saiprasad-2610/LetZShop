import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ShoppingBag,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  Clock,
  CreditCard,
  Truck,
  Building2,
  Store,
  User,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  Eye,
  Calendar,
  Check,
  ChevronDown,
} from 'lucide-react';
import type {
  AdminOrdersResponse,
  AdminOrder,
  AdminOrderDetail,
  AdminRange,
} from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, Pagination, useAdminQuery } from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';

function StatusBadge({ status, category = 'order' }: { status: string; category?: 'order' | 'payment' | 'fulfillment' }) {
  const s = (status || '').toUpperCase();
  let color = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

  if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'PAID') {
    color = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
  } else if (s === 'PROCESSING' || s === 'ACCEPTED' || s === 'SHIPPED' || s === 'AUTHORIZED') {
    color = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
  } else if (s === 'NEW' || s === 'PENDING') {
    color = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
  } else if (s === 'CANCELLED' || s === 'FAILED' || s === 'REFUNDED') {
    color = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${color} uppercase tracking-wider`}>
      {status || 'Unknown'}
    </span>
  );
}

interface StoreOption {
  id: string;
  name: string;
  slug?: string;
}

function SearchableStoreCombobox({
  value,
  onChange,
  stores,
}: {
  value: string;
  onChange: (storeId: string) => void;
  stores: StoreOption[];
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedStore = stores.find((s) => s.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStores = stores.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || (s.slug && s.slug.toLowerCase().includes(term));
  });

  return (
    <div className="relative w-full sm:w-64" ref={wrapperRef}>
      <div
        onClick={() => setOpen(!open)}
        className={`admin-input text-xs py-2 w-full flex items-center justify-between cursor-pointer select-none ${
          value ? 'border-admin-accent/60 bg-admin-soft/40' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Store className="w-3.5 h-3.5 text-admin-muted shrink-0" />
          <span className={selectedStore ? 'text-admin-text font-semibold truncate' : 'text-admin-muted truncate'}>
            {selectedStore ? selectedStore.name : 'All Stores'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchTerm('');
              }}
              className="p-0.5 rounded hover:bg-admin-raised text-admin-muted hover:text-admin-text"
              title="Clear store"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-admin-muted" />
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-admin-surface border border-admin-border rounded-xl shadow-2xl z-50 p-2 space-y-1.5 text-xs max-w-xs sm:max-w-none">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-admin-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search store name..."
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

          <div className="max-h-48 overflow-y-auto space-y-0.5 subtle-scrollbar pt-1">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setSearchTerm('');
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                !value ? 'bg-admin-soft text-admin-accent font-semibold' : 'text-admin-text hover:bg-admin-raised'
              }`}
            >
              <span>All Stores</span>
              {!value && <Check className="w-3.5 h-3.5 text-admin-accent" />}
            </button>

            {filteredStores.map((store) => (
              <button
                key={store.id}
                type="button"
                onClick={() => {
                  onChange(store.id);
                  setOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                  value === store.id ? 'bg-admin-soft text-admin-accent font-semibold' : 'text-admin-text hover:bg-admin-raised'
                }`}
              >
                <div className="truncate">
                  <div className="truncate font-medium">{store.name}</div>
                  {store.slug && <div className="text-[10px] text-admin-muted truncate font-mono">{store.slug}</div>}
                </div>
                {value === store.id && <Check className="w-3.5 h-3.5 text-admin-accent shrink-0 ml-1" />}
              </button>
            ))}

            {filteredStores.length === 0 && (
              <div className="p-3 text-center text-admin-muted text-xs">
                No stores match "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { api } = useAdminAuth();

  // Load actual PostgreSQL stores list for filter
  const filtersQuery = useAdminQuery<{ stores: Array<{ id: string; name: string; slug: string; tenantId: string }> }>(
    'admin/reviews/filters',
  );
  const stores = filtersQuery.data?.stores || [];

  // URL query sync
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(1);
  const [range, setRange] = useState<AdminRange>('30d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Quick detail drawer
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [drawerOrder, setDrawerOrder] = useState<AdminOrderDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.search === 'string') setSearch(router.query.search);
    if (typeof router.query.storeId === 'string') setStoreId(router.query.storeId);
    if (typeof router.query.status === 'string') setStatus(router.query.status);
    if (typeof router.query.range === 'string') setRange(router.query.range as AdminRange);
    if (typeof router.query.sort === 'string') setSort(router.query.sort);
    if (typeof router.query.page === 'string') setPage(parseInt(router.query.page, 10) || 1);
  }, [router.isReady, router.query]);

  // Construct query params
  const queryParams = useMemo(() => {
    const p: Record<string, any> = {
      page,
      pageSize: 20,
      sort,
    };
    if (search.trim()) p.search = search.trim();
    if (storeId) p.storeId = storeId;
    if (status) p.status = status;
    if (paymentStatus) p.paymentStatus = paymentStatus;
    if (paymentMethod) p.paymentMethod = paymentMethod;
    if (range) p.range = range;
    if (range === 'custom') {
      if (fromDate) p.from = fromDate;
      if (toDate) p.to = toDate;
    }
    return p;
  }, [page, sort, search, storeId, status, paymentStatus, paymentMethod, range, fromDate, toDate]);

  const { data, loading, error, reload } = useAdminQuery<AdminOrdersResponse>(
    'admin/orders',
    queryParams,
  );

  // Load drawer data when drawerOrderId changes
  useEffect(() => {
    if (!drawerOrderId) {
      setDrawerOrder(null);
      return;
    }
    let cancelled = false;
    setDrawerLoading(true);
    api.admin
      .getOrderDetail(drawerOrderId)
      .then((res) => {
        if (!cancelled) setDrawerOrder(res);
      })
      .catch((err) => {
        console.error('Failed to load order details for drawer', err);
      })
      .finally(() => {
        if (!cancelled) setDrawerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [drawerOrderId, api]);

  const activeFiltersCount = [
    status,
    paymentStatus,
    paymentMethod,
    storeId,
    range !== '30d' ? range : null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatus('');
    setPaymentStatus('');
    setPaymentMethod('');
    setStoreId('');
    setRange('30d');
    setFromDate('');
    setToDate('');
    setSearch('');
    setSort('newest');
    setPage(1);
  };

  return (
    <AdminLayout>
      <Head>
        <title>Customer Orders — LetzShop Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-admin-accent" />
              <h1 className="text-2xl font-bold tracking-tight text-admin-text">Orders</h1>
            </div>
            <p className="text-sm text-admin-muted mt-1">
              Monitor and inspect customer orders across all LetzShop merchant stores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => reload()}
              className="admin-secondary text-xs flex items-center gap-1.5 px-3 py-2"
              title="Refresh order data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-xl border border-admin-border bg-admin-surface shadow-xs">
              <div className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider">
                Total Orders
              </div>
              <div className="text-2xl font-bold text-admin-text mt-1">
                {data.summary.totalOrders.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-admin-muted mt-0.5">Platform lifetime</div>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-xs">
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Action Required
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {data.summary.newOrders.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                New pending merchant action
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 shadow-xs">
              <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                In Fulfillment
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                {data.summary.inFulfillmentOrders.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                Accepted, packed or in transit
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-xs">
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {data.summary.completedOrders.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Delivered & settled
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                Cancelled
              </div>
              <div className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                {data.summary.cancelledOrders.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                Cancelled or refunded
              </div>
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-admin-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order #, customer, phone, store, merchant..."
                className="admin-input w-full pl-9 text-xs"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-2.5 text-admin-muted hover:text-admin-text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Store Searchable Combobox in Toolbar */}
            <SearchableStoreCombobox
              value={storeId}
              onChange={(s) => {
                setStoreId(s);
                setPage(1);
              }}
              stores={stores}
            />

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`admin-secondary text-xs flex items-center gap-2 px-3 py-2 ${
                activeFiltersCount > 0 ? 'border-admin-accent text-admin-accent font-semibold' : ''
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-admin-accent text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-admin-muted shrink-0 hidden sm:block" />
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="admin-input text-xs py-2"
                aria-label="Sort orders"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-4">
              <div className="flex items-center justify-between border-b border-admin-border/60 pb-2">
                <span className="text-xs font-semibold text-admin-text uppercase tracking-wider">
                  Filter Orders
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-admin-muted hover:text-admin-accent font-medium"
                >
                  Reset all
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Store Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-admin-muted mb-1 uppercase tracking-wider">
                    Store
                  </label>
                  <SearchableStoreCombobox
                    value={storeId}
                    onChange={(s) => {
                      setStoreId(s);
                      setPage(1);
                    }}
                    stores={stores}
                  />
                </div>

                {/* Order Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-admin-muted mb-1 uppercase tracking-wider">
                    Order Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    className="admin-input w-full text-xs"
                  >
                    <option value="">All Statuses</option>
                    <option value="NEW">New (Action Required)</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-admin-muted mb-1 uppercase tracking-wider">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      setPaymentStatus(e.target.value);
                      setPage(1);
                    }}
                    className="admin-input w-full text-xs"
                  >
                    <option value="">All Payment States</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-semibold text-admin-muted mb-1 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setPage(1);
                    }}
                    className="admin-input w-full text-xs"
                  >
                    <option value="">All Payment Methods</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="RAZORPAY">Razorpay / Online</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-[11px] font-semibold text-admin-muted mb-1 uppercase tracking-wider">
                    Date Range
                  </label>
                  <select
                    value={range}
                    onChange={(e) => {
                      setRange(e.target.value as AdminRange);
                      setPage(1);
                    }}
                    className="admin-input w-full text-xs"
                  >
                    <option value="7D">Last 7 Days</option>
                    <option value="30D">Last 30 Days</option>
                    <option value="90D">Last 90 Days</option>
                    <option value="12M">Last 12 Months</option>
                    <option value="ALL">Lifetime (All)</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Pickers */}
              {range === 'custom' && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-admin-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-admin-muted">From:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setPage(1);
                      }}
                      className="admin-input text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-admin-muted">To:</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setPage(1);
                      }}
                      className="admin-input text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-admin-muted font-medium">Active Filters:</span>
              {status && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-admin-soft text-admin-accent border border-admin-border">
                  <span>Status: {status}</span>
                  <button onClick={() => setStatus('')} className="hover:opacity-75">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {paymentStatus && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-admin-soft text-admin-accent border border-admin-border">
                  <span>Payment: {paymentStatus}</span>
                  <button onClick={() => setPaymentStatus('')} className="hover:opacity-75">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {paymentMethod && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-admin-soft text-admin-accent border border-admin-border">
                  <span>Method: {paymentMethod}</span>
                  <button onClick={() => setPaymentMethod('')} className="hover:opacity-75">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {range !== '30d' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-admin-soft text-admin-accent border border-admin-border">
                  <span>Range: {range}</span>
                  <button onClick={() => setRange('30d')} className="hover:opacity-75">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-admin-muted hover:text-admin-accent underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Feedback / Error */}
        <Feedback error={error} loading={loading && !data} />

        {/* Orders Table Panel */}
        <div className="rounded-xl border border-admin-border bg-admin-surface shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[640px] admin-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-admin-raised text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border shadow-xs">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/60">
                {data?.items && data.items.length > 0 ? (
                  data.items.map((order: AdminOrder) => (
                    <tr
                      key={order.id}
                      className="hover:bg-admin-raised/40 transition-colors cursor-pointer"
                      onClick={() => setDrawerOrderId(order.id)}
                    >
                      {/* Order Number */}
                      <td className="px-4 py-3 font-mono font-bold text-admin-text whitespace-nowrap">
                        <Link
                          href={`/orders/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-admin-accent hover:underline flex items-center gap-1.5"
                        >
                          <span>{order.orderNumber}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                        <span className="text-[10px] text-admin-muted font-normal block">
                          {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 text-admin-text">
                        <div className="font-semibold">{order.customer?.fullName || 'Guest Customer'}</div>
                        <div className="text-[11px] text-admin-muted">{order.customer?.phone || order.customer?.email || '—'}</div>
                      </td>

                      {/* Store */}
                      <td className="px-4 py-3 text-admin-secondary">
                        <div className="font-medium text-admin-text">{order.store?.name || '—'}</div>
                        {order.store?.slug && (
                          <span className="text-[10px] text-admin-muted font-mono">{order.store.slug}</span>
                        )}
                      </td>

                      {/* Merchant */}
                      <td className="px-4 py-3 text-admin-secondary">
                        {order.tenant?.slug ? (
                          <Link
                            href={`/merchants/${order.tenant.id || order.tenant.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-admin-accent hover:underline flex items-center gap-1"
                          >
                            <Building2 className="w-3 h-3" />
                            <span>{order.tenant.name || order.tenant.slug}</span>
                          </Link>
                        ) : (
                          <span>{order.tenant?.name || '—'}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold tabular-nums text-admin-text">
                          {formatPaise(order.totalPaise)}
                        </div>
                        {(order.discountPaise ?? 0) > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Disc: {formatPaise(order.discountPaise!)}
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={order.paymentStatus} category="payment" />
                        <div className="text-[10px] text-admin-muted mt-0.5">
                          {order.paymentMethod || 'Prepaid'}
                        </div>
                      </td>

                      {/* Fulfillment */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={order.fulfillmentStatus} category="fulfillment" />
                      </td>

                      {/* Order Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={order.status} category="order" />
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 whitespace-nowrap text-admin-muted">
                        <div>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px]">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDrawerOrderId(order.id)}
                            className="admin-secondary px-2 py-1 text-xs font-semibold inline-flex items-center gap-1"
                            title="Quick Drawer View"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                          <Link
                            href={`/orders/${order.id}`}
                            className="btn-admin-primary px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <span>Detail</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-admin-muted">
                      {loading ? (
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-admin-accent" />
                          <span>Loading orders…</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <ShoppingBag className="w-8 h-8 mx-auto text-admin-muted/60 mb-2" />
                          <div className="text-sm font-semibold text-admin-text">No orders found</div>
                          <div className="text-xs">
                            {activeFiltersCount > 0 || search
                              ? 'No customer orders match your current filters and search criteria.'
                              : 'No customer orders recorded in this date range.'}
                          </div>
                          {(activeFiltersCount > 0 || search) && (
                            <button
                              onClick={clearAllFilters}
                              className="btn-admin-primary text-xs mt-3 px-3 py-1.5"
                            >
                              Reset Filters
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > 0 && (
            <div className="p-3 border-t border-admin-border bg-admin-surface flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-admin-muted">
                Showing{' '}
                <strong className="text-admin-text">
                  {(data.page - 1) * data.pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-admin-text">
                  {Math.min(data.page * data.pageSize, data.total)}
                </strong>{' '}
                of <strong className="text-admin-text">{data.total}</strong> orders
              </span>
              <Pagination
                page={data.page}
                totalPages={Math.ceil(data.total / data.pageSize)}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Order Detail Drawer */}
      {drawerOrderId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-admin-surface border-l border-admin-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-admin-border flex items-center justify-between bg-admin-raised/50">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-admin-accent" />
                <div>
                  <h2 className="text-base font-bold text-admin-text flex items-center gap-2">
                    <span>Order #{drawerOrder?.orderNumber || '...'}</span>
                    {drawerOrder && <StatusBadge status={drawerOrder.status} category="order" />}
                  </h2>
                  <span className="text-[11px] text-admin-muted">
                    Platform Order Quick Inspection
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/orders/${drawerOrderId}`}
                  className="admin-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Page
                </Link>
                <button
                  onClick={() => setDrawerOrderId(null)}
                  className="p-1.5 rounded-lg text-admin-muted hover:bg-admin-raised hover:text-admin-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 admin-scrollbar">
              {drawerLoading ? (
                <div className="p-12 text-center text-admin-muted flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-admin-accent" />
                  <span>Loading order details…</span>
                </div>
              ) : drawerOrder ? (
                <>
                  {/* Store & Merchant Context */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-admin-border bg-admin-raised/40 text-xs">
                    <div>
                      <span className="text-admin-muted text-[10px] uppercase font-bold tracking-wider block">
                        Store
                      </span>
                      <span className="font-semibold text-admin-text">
                        {drawerOrder.store?.name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-admin-muted text-[10px] uppercase font-bold tracking-wider block">
                        Merchant
                      </span>
                      {drawerOrder.tenant ? (
                        <Link
                          href={`/merchants/${drawerOrder.tenant.id}`}
                          className="font-semibold text-admin-accent hover:underline flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3" />
                          <span>{drawerOrder.tenant.name}</span>
                        </Link>
                      ) : (
                        <span className="font-semibold text-admin-text">Platform</span>
                      )}
                    </div>
                  </div>

                  {/* Customer & Delivery */}
                  <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface space-y-2 text-xs">
                    <div className="font-bold text-admin-text uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-admin-accent" />
                      Customer Information
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-admin-muted text-[10px] block">Name</span>
                        <span className="font-medium text-admin-text">
                          {drawerOrder.customer?.fullName || 'Guest Customer'}
                        </span>
                      </div>
                      <div>
                        <span className="text-admin-muted text-[10px] block">Phone / Contact</span>
                        <span className="font-medium text-admin-text">
                          {drawerOrder.customer?.phone || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    <div className="font-bold text-admin-text uppercase text-[11px] tracking-wider">
                      Ordered Items ({drawerOrder.items?.length || 0})
                    </div>
                    <div className="border border-admin-border rounded-xl divide-y divide-admin-border/60 overflow-hidden bg-admin-surface">
                      {drawerOrder.items?.map((item: any) => (
                        <div key={item.id} className="p-3 text-xs flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-admin-text truncate">
                              {item.productName || item.product?.title || 'Product'}
                            </div>
                            <div className="text-[11px] text-admin-muted">
                              Qty: {item.quantity} × {formatPaise(item.pricePaise)}
                            </div>
                          </div>
                          <div className="font-bold tabular-nums text-admin-text">
                            {formatPaise(item.totalPaise || item.pricePaise * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface space-y-2 text-xs">
                    <div className="font-bold text-admin-text uppercase text-[11px] tracking-wider mb-2">
                      Payment Breakdown
                    </div>
                    <div className="space-y-1.5 text-admin-secondary">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono tabular-nums">{formatPaise(drawerOrder.subtotalPaise)}</span>
                      </div>
                      {drawerOrder.discountPaise > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Discount Applied</span>
                          <span className="font-mono tabular-nums">-{formatPaise(drawerOrder.discountPaise)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping Fee</span>
                        <span className="font-mono tabular-nums">{formatPaise(drawerOrder.shippingPaise)}</span>
                      </div>
                      {drawerOrder.taxPaise > 0 && (
                        <div className="flex justify-between">
                          <span>Estimated Tax</span>
                          <span className="font-mono tabular-nums">{formatPaise(drawerOrder.taxPaise)}</span>
                        </div>
                      )}
                      <div className="border-t border-admin-border/60 pt-2 flex justify-between font-bold text-admin-text text-sm">
                        <span>Total Paid</span>
                        <span className="font-mono tabular-nums text-admin-accent">
                          {formatPaise(drawerOrder.totalPaise)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Tracking */}
                  {drawerOrder.shipments && drawerOrder.shipments.length > 0 && (
                    <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface space-y-2 text-xs">
                      <div className="font-bold text-admin-text uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        Shipment & Tracking
                      </div>
                      {drawerOrder.shipments.map((s: any) => (
                        <div key={s.id} className="p-2.5 rounded-lg bg-admin-raised/40 space-y-1">
                          <div className="flex justify-between">
                            <span className="font-semibold text-admin-text">{s.carrier || 'Standard Courier'}</span>
                            <StatusBadge status={s.status} category="fulfillment" />
                          </div>
                          {s.trackingNumber && (
                            <div className="text-[11px] text-admin-muted font-mono">
                              AWB / Tracking: {s.trackingNumber}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status Timeline */}
                  {drawerOrder.statusHistory && drawerOrder.statusHistory.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-bold text-admin-text uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-admin-accent" />
                        Status History Timeline
                      </div>
                      <div className="border-l-2 border-admin-border ml-3 pl-4 space-y-3 text-xs">
                        {drawerOrder.statusHistory.map((h: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="w-2 h-2 rounded-full bg-admin-accent absolute -left-[21px] top-1"></div>
                            <div className="font-semibold text-admin-text">{h.status}</div>
                            <div className="text-[10px] text-admin-muted">
                              {new Date(h.createdAt).toLocaleString('en-IN')}
                              {h.note && ` — ${h.note}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-admin-muted">Failed to load order.</div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-admin-border bg-admin-raised/30 flex items-center justify-between">
              <span className="text-[11px] text-admin-muted">
                Admin inspection mode (read-only)
              </span>
              <Link
                href={`/orders/${drawerOrderId}`}
                className="btn-admin-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Full Order Details</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Store,
  User,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import type {
  AdminPage,
  AdminMerchant,
  AdminPlan,
} from '@simply/api-contracts';
import { AdminLayout } from '../../components/AdminLayout';
import { useAdminQuery, Feedback } from '../../components/AdminUI';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { MerchantActionMenu } from '../../components/merchants/MerchantActionMenu';
import { SendMessageModal } from '../../components/merchants/SendMessageModal';
import { SuspendMerchantModal } from '../../components/merchants/SuspendMerchantModal';
import { ReactivateMerchantModal } from '../../components/merchants/ReactivateMerchantModal';
import { ArchiveMerchantModal } from '../../components/merchants/ArchiveMerchantModal';
import { getStorefrontUrl } from '../../utils/config';

const STORE_STATUSES = [
  { label: 'All store statuses', value: 'ALL' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Private Preview', value: 'PRIVATE_PREVIEW' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const SUBSCRIPTION_STATUSES = [
  { label: 'All subscription statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Trialing', value: 'TRIALING' },
  { label: 'Past Due', value: 'PAST_DUE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Canceled', value: 'CANCELED' },
  { label: 'Unpaid', value: 'UNPAID' },
  { label: 'No Subscription', value: 'NO_SUBSCRIPTION' },
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Business A–Z', value: 'alpha_asc' },
  { label: 'Business Z–A', value: 'alpha_desc' },
];

export default function MerchantsPage() {
  const router = useRouter();

  // Query state initialized from URL or defaults
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [planId, setPlanId] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('ALL');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters Popover open/close state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [activeMessageMerchant, setActiveMessageMerchant] = useState<AdminMerchant | null>(null);
  const [activeSuspendMerchant, setActiveSuspendMerchant] = useState<AdminMerchant | null>(null);
  const [activeReactivateMerchant, setActiveReactivateMerchant] = useState<AdminMerchant | null>(null);
  const [activeArchiveMerchant, setActiveArchiveMerchant] = useState<AdminMerchant | null>(null);

  // Handle URL query parameters on initial mount & back/forward
  useEffect(() => {
    if (!router.isReady) return;
    const {
      search: qSearch,
      status: qStatus,
      plan: qPlan,
      subscriptionStatus: qSub,
      sort: qSort,
      page: qPage,
      pageSize: qPageSize,
    } = router.query;

    if (typeof qSearch === 'string') {
      setSearchInput(qSearch);
      setDebouncedSearch(qSearch);
    }
    if (typeof qStatus === 'string') setStatus(qStatus);
    if (typeof qPlan === 'string') setPlanId(qPlan);
    if (typeof qSub === 'string') setSubscriptionStatus(qSub);
    if (typeof qSort === 'string') setSort(qSort);
    if (typeof qPage === 'string' && !isNaN(Number(qPage))) setPage(Math.max(1, Number(qPage)));
    if (typeof qPageSize === 'string' && !isNaN(Number(qPageSize))) setPageSize(Number(qPageSize));
  }, [router.isReady]);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync state to URL query parameters
  useEffect(() => {
    if (!router.isReady) return;
    const query: Record<string, string> = {};
    if (debouncedSearch.trim()) query.search = debouncedSearch.trim();
    if (status !== 'ALL') query.status = status;
    if (planId) query.plan = planId;
    if (subscriptionStatus !== 'ALL') query.subscriptionStatus = subscriptionStatus;
    if (sort !== 'newest') query.sort = sort;
    if (page > 1) query.page = String(page);
    if (pageSize !== 20) query.pageSize = String(pageSize);

    void router.replace({ pathname: '/merchants', query }, undefined, { shallow: true });
  }, [debouncedSearch, status, planId, subscriptionStatus, sort, page, pageSize]);

  // Close filters popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    }
    if (filtersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filtersOpen]);

  // Fetch real plans list
  const plansQuery = useAdminQuery<AdminPlan[]>('admin/plans');

  // Fetch real merchants
  const { data, loading, error, reload } = useAdminQuery<AdminPage<AdminMerchant>>(
    'admin/merchants',
    {
      search: debouncedSearch.trim() || undefined,
      status: status !== 'ALL' ? status : undefined,
      planId: planId || undefined,
      subscriptionStatus: subscriptionStatus !== 'ALL' ? subscriptionStatus : undefined,
      sort,
      page,
      pageSize,
    },
  );

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (status !== 'ALL') count++;
    if (planId) count++;
    if (subscriptionStatus !== 'ALL') count++;
    return count;
  }, [status, planId, subscriptionStatus]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setStatus('ALL');
    setPlanId('');
    setSubscriptionStatus('ALL');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  // Helper to get plan name
  const getPlanLabel = (id: string) => {
    if (id === 'LAUNCH') return 'Launch Plan';
    if (id === 'GROWTH') return 'Growth Plan';
    if (id === 'CUSTOM') return 'Custom Plan';
    if (id === 'NO_SUBSCRIPTION') return 'No Subscription';
    const found = plansQuery.data?.find((p) => p.id === id);
    return found ? found.name : id;
  };

  // Pagination bounds calculation
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages || Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <AdminLayout>
      <Head>
        <title>Merchants — LetzShop Admin</title>
      </Head>

      <div className="space-y-4">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-admin-text">Merchants</h1>
            <p className="text-sm text-admin-muted">
              Manage businesses, subscriptions and store access
            </p>
          </div>
          <button
            type="button"
            className="admin-secondary flex items-center gap-1.5"
            onClick={() => reload()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Compact Operational Toolbar */}
        <div className="admin-panel p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted pointer-events-none" />
              <input
                aria-label="Search merchants"
                placeholder="Search business, owner, email, phone or slug…"
                className="admin-input pl-9 pr-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text p-0.5 rounded"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Filters Popover Trigger */}
              <div className="relative" ref={filtersRef}>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  className={`admin-secondary flex items-center gap-2 ${
                    activeFiltersCount > 0
                      ? 'border-admin-accent bg-admin-soft text-admin-accent font-medium'
                      : ''
                  }`}
                  aria-expanded={filtersOpen}
                  aria-label="Toggle filters popover"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-admin-accent text-[11px] font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Filters Popover Content */}
                {filtersOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-admin-border bg-admin-surface p-4 shadow-2xl z-40 space-y-4">
                    <div className="flex items-center justify-between border-b border-admin-border pb-2">
                      <span className="text-sm font-semibold text-admin-text">Filter Merchants</span>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatus('ALL');
                            setPlanId('');
                            setSubscriptionStatus('ALL');
                            setPage(1);
                          }}
                          className="text-xs text-admin-accent hover:underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Store Status */}
                    <div className="space-y-1.5">
                      <label htmlFor="filter-store-status" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary">
                        Store Status
                      </label>
                      <select
                        id="filter-store-status"
                        className="admin-input text-xs"
                        value={status}
                        onChange={(e) => {
                          setStatus(e.target.value);
                          setPage(1);
                        }}
                      >
                        {STORE_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Plan */}
                    <div className="space-y-1.5">
                      <label htmlFor="filter-plan" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary">
                        Subscription Plan
                      </label>
                      <select
                        id="filter-plan"
                        className="admin-input text-xs"
                        value={planId}
                        onChange={(e) => {
                          setPlanId(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="">All plans</option>
                        <option value="LAUNCH">Launch Plan</option>
                        <option value="GROWTH">Growth Plan</option>
                        <option value="CUSTOM">Custom Plan</option>
                        <option value="NO_SUBSCRIPTION">No Subscription</option>
                        {plansQuery.data
                          ?.filter((p) => !['LAUNCH', 'GROWTH', 'CUSTOM'].includes(p.code?.toUpperCase() || ''))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Subscription Status */}
                    <div className="space-y-1.5">
                      <label htmlFor="filter-sub-status" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary">
                        Subscription Status
                      </label>
                      <select
                        id="filter-sub-status"
                        className="admin-input text-xs"
                        value={subscriptionStatus}
                        onChange={(e) => {
                          setSubscriptionStatus(e.target.value);
                          setPage(1);
                        }}
                      >
                        {SUBSCRIPTION_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2 border-t border-admin-border flex justify-end">
                      <button
                        type="button"
                        onClick={() => setFiltersOpen(false)}
                        className="admin-button text-xs py-1.5 px-3"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  aria-label="Sort merchants"
                  className="admin-input py-2 text-xs font-medium cursor-pointer"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(activeFiltersCount > 0 || debouncedSearch.trim()) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-admin-border/60">
              <span className="text-xs font-medium text-admin-muted">Active:</span>

              {debouncedSearch.trim() && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-raised px-2.5 py-0.5 text-xs text-admin-text border border-admin-border">
                  <span>Search: &quot;{debouncedSearch.trim()}&quot;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setDebouncedSearch('');
                      setPage(1);
                    }}
                    className="hover:text-red-500"
                    aria-label="Remove search filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {status !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-raised px-2.5 py-0.5 text-xs text-admin-text border border-admin-border">
                  <span>Status: {status}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('ALL');
                      setPage(1);
                    }}
                    className="hover:text-red-500"
                    aria-label="Remove status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {planId && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-raised px-2.5 py-0.5 text-xs text-admin-text border border-admin-border">
                  <span>Plan: {getPlanLabel(planId)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPlanId('');
                      setPage(1);
                    }}
                    className="hover:text-red-500"
                    aria-label="Remove plan filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {subscriptionStatus !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-raised px-2.5 py-0.5 text-xs text-admin-text border border-admin-border">
                  <span>Sub: {subscriptionStatus}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSubscriptionStatus('ALL');
                      setPage(1);
                    }}
                    className="hover:text-red-500"
                    aria-label="Remove subscription status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-semibold text-admin-accent hover:underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Feedback / Error state */}
        <Feedback
          loading={loading && !data}
          error={error}
          onRetry={() => reload()}
        />

        {/* Results Container */}
        {data && (
          <div className="space-y-3">
            {/* Total Results Count */}
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-admin-text">
                {totalItems} {totalItems === 1 ? 'Merchant' : 'Merchants'}
              </p>
            </div>

            {/* Merchant Table Card (Fixed/controlled height with internal scrollbar) */}
            <div className="rounded-xl border border-admin-border bg-admin-surface shadow-sm overflow-hidden flex flex-col">
              {/* Internal vertical scrolling body with .admin-scrollbar */}
              <div className="h-[520px] max-h-[70vh] min-h-[320px] overflow-y-auto overflow-x-auto admin-scrollbar">
                {data.items.length === 0 ? (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center text-admin-muted">
                    <Store className="h-10 w-10 text-admin-border mb-3" />
                    <p className="text-base font-semibold text-admin-text">No merchants found</p>
                    <p className="text-xs mt-1 max-w-sm">
                      {activeFiltersCount > 0 || debouncedSearch
                        ? 'Try adjusting or clearing your search or filter criteria.'
                        : 'No merchant businesses currently registered.'}
                    </p>
                    {(activeFiltersCount > 0 || debouncedSearch) && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="admin-secondary mt-4 text-xs"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View (>= 768px) */}
                    <table className="hidden md:table w-full text-left text-sm">
                      <thead className="sticky top-0 z-20 bg-admin-raised text-xs font-semibold uppercase tracking-wider text-admin-secondary border-b border-admin-border shadow-sm">
                        <tr>
                          <th className="px-4 py-3">Merchant / Store</th>
                          <th className="px-4 py-3">Owner</th>
                          <th className="px-4 py-3">Contact</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Plan</th>
                          <th className="px-4 py-3">Joined</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-admin-border/60">
                        {data.items.map((m) => {
                          const storeName = m.store?.name || m.name;
                          const slug = m.store?.slug || m.slug;
                          const ownerName = m.owner?.fullName || '—';
                          const ownerEmail = m.owner?.email;
                          const ownerPhone = m.owner?.phone;
                          const storeStatus = m.store?.status || m.status;
                          const planName = m.subscription?.plan?.name || (m as any).plan || 'No subscription';
                          const subStatus = m.subscription?.status;

                          return (
                            <tr
                              key={m.id}
                              className="hover:bg-admin-raised/50 transition-colors group"
                            >
                              {/* Merchant / Store */}
                              <td className="px-4 py-3">
                                <Link
                                  href={`/merchants/${m.id}`}
                                  className="font-medium text-admin-accent hover:underline block truncate max-w-[220px]"
                                >
                                  {storeName}
                                </Link>
                                {m.store && m.store.name !== m.name && (
                                  <p className="text-xs text-admin-muted truncate max-w-[220px]">
                                    {m.name}
                                  </p>
                                )}
                                <p className="text-xs text-admin-muted font-mono mt-0.5 truncate max-w-[220px]">
                                  {slug}
                                </p>
                              </td>

                              {/* Owner */}
                              <td className="px-4 py-3 text-admin-text font-medium text-xs">
                                {ownerName}
                              </td>

                              {/* Contact */}
                              <td className="px-4 py-3 text-xs space-y-0.5">
                                {ownerEmail ? (
                                  <p className="text-admin-text truncate max-w-[190px]">{ownerEmail}</p>
                                ) : null}
                                {ownerPhone ? (
                                  <p className="text-admin-muted">{ownerPhone}</p>
                                ) : null}
                                {!ownerEmail && !ownerPhone && (
                                  <span className="text-admin-muted">Not provided</span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-4 py-3">
                                <StatusBadge status={storeStatus} category="store" />
                                {m.status !== storeStatus && (
                                  <p className="text-[10px] text-admin-muted mt-1 uppercase">
                                    Account: {m.status}
                                  </p>
                                )}
                              </td>

                              {/* Plan */}
                              <td className="px-4 py-3 text-xs">
                                <p className="font-semibold text-admin-text">{planName}</p>
                                {subStatus && (
                                  <p className="text-admin-muted text-[11px] capitalize mt-0.5">
                                    {subStatus.toLowerCase()}
                                  </p>
                                )}
                              </td>

                              {/* Joined */}
                              <td className="px-4 py-3 text-xs text-admin-muted whitespace-nowrap tabular-nums">
                                {new Date(m.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 text-right">
                                <MerchantActionMenu
                                  merchant={m}
                                  onSendMessage={() => setActiveMessageMerchant(m)}
                                  onSuspend={() => setActiveSuspendMerchant(m)}
                                  onReactivate={() => setActiveReactivateMerchant(m)}
                                  onArchive={() => setActiveArchiveMerchant(m)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile Card List View (< 768px) */}
                    <div className="md:hidden divide-y divide-admin-border/60">
                      {data.items.map((m) => {
                        const storeName = m.store?.name || m.name;
                        const slug = m.store?.slug || m.slug;
                        const ownerName = m.owner?.fullName || 'Not provided';
                        const ownerPhone = m.owner?.phone;
                        const storeStatus = m.store?.status || m.status;
                        const planName = m.subscription?.plan?.name || (m as any).plan || 'No subscription';

                        return (
                          <div key={m.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link
                                  href={`/merchants/${m.id}`}
                                  className="text-base font-semibold text-admin-accent hover:underline block"
                                >
                                  {storeName}
                                </Link>
                                <span className="text-xs text-admin-muted font-mono">{slug}</span>
                              </div>
                              <StatusBadge status={storeStatus} category="store" />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-admin-muted">
                              <div>
                                <span className="text-admin-secondary font-medium">Owner:</span>{' '}
                                <span className="text-admin-text">{ownerName}</span>
                              </div>
                              {ownerPhone && (
                                <div>
                                  <span className="text-admin-secondary font-medium">Phone:</span>{' '}
                                  <span className="text-admin-text">{ownerPhone}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-admin-secondary font-medium">Plan:</span>{' '}
                                <span className="text-admin-text font-medium">{planName}</span>
                              </div>
                              <div>
                                <span className="text-admin-secondary font-medium">Joined:</span>{' '}
                                <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-admin-border/40">
                              <Link
                                href={`/merchants/${m.id}`}
                                className="admin-secondary text-xs py-1 px-3"
                              >
                                View Details
                              </Link>
                              <MerchantActionMenu
                                merchant={m}
                                onSendMessage={() => setActiveMessageMerchant(m)}
                                onSuspend={() => setActiveSuspendMerchant(m)}
                                onReactivate={() => setActiveReactivateMerchant(m)}
                                onArchive={() => setActiveArchiveMerchant(m)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* External Pagination Outside Scroll Container */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 text-sm text-admin-muted">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-admin-text">{startItem}</strong>–<strong className="text-admin-text">{endItem}</strong> of{' '}
                  <strong className="text-admin-text">{totalItems}</strong>
                </span>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded border border-admin-border bg-admin-surface px-2 py-1 text-xs text-admin-text focus:outline-none focus:ring-1 focus:ring-admin-accent"
                    aria-label="Items per page"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per page</span>
                </div>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1.5 text-xs font-medium text-admin-text hover:bg-admin-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-xs text-admin-muted">…</span>}
                          <button
                            type="button"
                            onClick={() => setPage(p)}
                            className={`min-w-[28px] h-7 rounded text-xs font-semibold transition-colors ${
                              page === p
                                ? 'bg-admin-primary text-admin-on-primary'
                                : 'border border-admin-border bg-admin-surface text-admin-text hover:bg-admin-raised'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1.5 text-xs font-medium text-admin-text hover:bg-admin-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Flows */}
      {activeMessageMerchant && (
        <SendMessageModal
          merchantId={activeMessageMerchant.id}
          merchantName={activeMessageMerchant.store?.name || activeMessageMerchant.name}
          recipientEmail={activeMessageMerchant.owner?.email}
          recipientPhone={activeMessageMerchant.owner?.phone}
          onClose={() => setActiveMessageMerchant(null)}
          onSuccess={() => reload()}
        />
      )}

      {activeSuspendMerchant && (
        <SuspendMerchantModal
          merchantId={activeSuspendMerchant.id}
          merchantName={activeSuspendMerchant.store?.name || activeSuspendMerchant.name}
          recipientEmail={activeSuspendMerchant.owner?.email}
          recipientPhone={activeSuspendMerchant.owner?.phone}
          stores={
            activeSuspendMerchant.store
              ? [{ id: activeSuspendMerchant.store.id || activeSuspendMerchant.id, name: activeSuspendMerchant.store.name || activeSuspendMerchant.name }]
              : []
          }
          onClose={() => setActiveSuspendMerchant(null)}
          onSuccess={() => reload()}
        />
      )}

      {activeReactivateMerchant && (
        <ReactivateMerchantModal
          merchantId={activeReactivateMerchant.id}
          merchantName={activeReactivateMerchant.store?.name || activeReactivateMerchant.name}
          recipientEmail={activeReactivateMerchant.owner?.email}
          recipientPhone={activeReactivateMerchant.owner?.phone}
          onClose={() => setActiveReactivateMerchant(null)}
          onSuccess={() => reload()}
        />
      )}

      {activeArchiveMerchant && (
        <ArchiveMerchantModal
          merchantId={activeArchiveMerchant.id}
          merchantName={activeArchiveMerchant.store?.name || activeArchiveMerchant.name}
          recipientEmail={activeArchiveMerchant.owner?.email}
          recipientPhone={activeArchiveMerchant.owner?.phone}
          onClose={() => setActiveArchiveMerchant(null)}
          onSuccess={() => reload()}
        />
      )}
    </AdminLayout>
  );
}

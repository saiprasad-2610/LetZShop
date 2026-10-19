import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { AdminPage, AdminSubscription, AdminPlan } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { Feedback, Pagination, useAdminQuery } from './AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Search,
  Filter,
  Calendar,
  FileText,
  Download,
  Check,
  AlertTriangle,
  X,
  ExternalLink,
  RefreshCw,
  Edit2,
  Clock,
  Ban,
  ShieldAlert,
  ChevronDown,
  ArrowUpDown,
  Tag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export function SubscriptionList({ tenantId }: { tenantId?: string }) {
  const { api } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [planId, setPlanId] = useState('ALL');
  const [range, setRange] = useState('ALL');
  const [sort, setSort] = useState('createdAt_desc');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1);
  }, [tenantId, search, status, planId, range, sort, pageSize]);

  // Handle outside clicks for filter popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setFilterPopoverOpen(false);
      }
    }
    if (filterPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterPopoverOpen]);

  // Query subscriptions
  const { data, loading, error, reload } = useAdminQuery<
    AdminPage<AdminSubscription>
  >('admin/subscriptions', {
    tenantId,
    page,
    pageSize,
    search: search.trim() || undefined,
    status: status !== 'ALL' ? status : undefined,
    planId: planId !== 'ALL' ? planId : undefined,
    range: range !== 'ALL' ? range : undefined,
    sort: sort || undefined,
  });

  // Query plans for filter dropdown and plan change modal
  const plansQuery = useAdminQuery<AdminPlan[]>('admin/plans');

  // Modal State for Subscription Inspect & Actions
  const [selectedSub, setSelectedSub] = useState<AdminSubscription | null>(null);
  const [manageTab, setManageTab] = useState<'OVERVIEW' | 'CHANGE_PLAN' | 'EXTEND' | 'CANCEL'>('OVERVIEW');
  const [newPlanId, setNewPlanId] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const openManageModal = (sub: AdminSubscription) => {
    setSelectedSub(sub);
    setManageTab('OVERVIEW');
    setNewPlanId(sub.plan.id);
    const currEnd = new Date(sub.currentPeriodEnd);
    const nextMonth = new Date(currEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
    setNewExpiryDate(nextMonth.toISOString().split('T')[0]);
    setActionReason('');
    setActionError('');
    setActionSuccess('');
  };

  const closeManageModal = () => {
    setSelectedSub(null);
    setActionBusy(false);
    setActionError('');
    setActionSuccess('');
  };

  const handleChangePlan = async () => {
    if (!selectedSub) return;
    if (!actionReason.trim()) {
      setActionError('Please provide a reason for changing the plan.');
      return;
    }
    if (newPlanId === selectedSub.plan.id) {
      setActionError('Please select a different plan.');
      return;
    }

    try {
      setActionBusy(true);
      setActionError('');
      await api.request(`admin/subscriptions/${selectedSub.id}/plan`, {
        method: 'PATCH',
        body: { planId: newPlanId, reason: actionReason.trim() },
      });
      setActionSuccess('Plan successfully updated.');
      reload();
      setTimeout(() => {
        closeManageModal();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || 'Failed to change subscription plan.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleExtendExpiry = async () => {
    if (!selectedSub) return;
    if (!actionReason.trim()) {
      setActionError('Please provide a reason for adjusting validity.');
      return;
    }
    if (!newExpiryDate) {
      setActionError('Please pick a valid expiry date.');
      return;
    }

    try {
      setActionBusy(true);
      setActionError('');
      await api.request(`admin/subscriptions/${selectedSub.id}/expiry`, {
        method: 'PATCH',
        body: { newEnd: new Date(newExpiryDate).toISOString(), reason: actionReason.trim() },
      });
      setActionSuccess('Subscription validity successfully extended.');
      reload();
      setTimeout(() => {
        closeManageModal();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || 'Failed to extend expiry.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSub) return;
    if (!actionReason.trim()) {
      setActionError('Please provide a cancellation reason.');
      return;
    }

    try {
      setActionBusy(true);
      setActionError('');
      await api.request(`admin/subscriptions/${selectedSub.id}/cancel`, {
        method: 'POST',
        body: { reason: actionReason.trim() },
      });
      setActionSuccess('Subscription deactivated successfully.');
      reload();
      setTimeout(() => {
        closeManageModal();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel subscription.');
    } finally {
      setActionBusy(false);
    }
  };

  const activeFilterCount =
    (status !== 'ALL' ? 1 : 0) +
    (planId !== 'ALL' ? 1 : 0) +
    (range !== 'ALL' ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPlanId('ALL');
    setRange('ALL');
    setSort('createdAt_desc');
  };

  const selectedPlanObj = plansQuery.data?.find((p) => p.id === planId);

  return (
    <section className="bg-admin-surface rounded-3xl border border-admin-border p-5 space-y-4 shadow-xs">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-admin-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-admin-text">Merchant Subscriptions</h2>
          <p className="text-xs text-admin-muted mt-0.5">
            PostgreSQL-backed active and past merchant subscription records
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-admin-raised border border-admin-border text-admin-text focus:outline-none"
            title="Records per page"
          >
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-admin-raised hover:bg-admin-border/60 text-admin-secondary text-xs font-semibold border border-admin-border transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-admin-accent" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 11. STREAMLINED TOOLBAR: Search, Filters Popover, Sort */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-admin-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, store, plan, or invoice #..."
            className="w-full pl-9 pr-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs font-medium text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-border"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Popover Button */}
        <div className="relative" ref={filterPopoverRef}>
          <button
            type="button"
            onClick={() => setFilterPopoverOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              activeFilterCount > 0
                ? 'bg-admin-accent/10 border-admin-accent/30 text-admin-accent'
                : 'bg-admin-bg border-admin-border text-admin-secondary hover:bg-admin-raised'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-admin-accent text-admin-on-primary text-[10px] font-bold flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-60" />
          </button>

          {/* Popover Card */}
          {filterPopoverOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-admin-surface border border-admin-border rounded-2xl shadow-2xl z-30 space-y-3.5">
              <div className="flex items-center justify-between border-b border-admin-border/60 pb-2">
                <span className="font-bold text-xs text-admin-text">Filter Subscriptions</span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('ALL');
                      setPlanId('ALL');
                      setRange('ALL');
                    }}
                    className="text-[11px] text-admin-accent hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold text-admin-muted mb-1">
                  Subscription Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIALING">TRIALING</option>
                  <option value="PAST_DUE">PAST DUE</option>
                  <option value="CANCELED">CANCELED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              {/* Plan */}
              <div>
                <label className="block text-[11px] font-semibold text-admin-muted mb-1">
                  Subscription Tier
                </label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                >
                  <option value="ALL">All Plans</option>
                  {plansQuery.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiry Range */}
              <div>
                <label className="block text-[11px] font-semibold text-admin-muted mb-1">
                  Validity Window
                </label>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                >
                  <option value="ALL">Any Validity</option>
                  <option value="EXPIRING_SOON">Expiring in ≤ 7 Days</option>
                  <option value="EXPIRED">Already Expired</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 bg-admin-bg border border-admin-border rounded-xl px-2.5 py-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-admin-muted" />
          <span className="text-[11px] text-admin-muted font-medium">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent text-xs text-admin-text font-semibold focus:outline-none cursor-pointer py-1"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="expiry_asc">Expiry (Soonest First)</option>
            <option value="expiry_desc">Expiry (Latest First)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(search || activeFilterCount > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-admin-muted font-medium">Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-admin-raised border border-admin-border text-admin-text text-[11px]">
              Search: "{search}"
              <button onClick={() => setSearch('')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {status !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-admin-raised border border-admin-border text-admin-text text-[11px]">
              Status: {status}
              <button onClick={() => setStatus('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {planId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-admin-raised border border-admin-border text-admin-text text-[11px]">
              Plan: {selectedPlanObj ? selectedPlanObj.name : planId}
              <button onClick={() => setPlanId('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {range !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-admin-raised border border-admin-border text-admin-text text-[11px]">
              Window: {range === 'EXPIRING_SOON' ? 'Expiring in ≤ 7 days' : 'Expired'}
              <button onClick={() => setRange('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] text-admin-accent hover:underline font-semibold ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      <Feedback error={error} loading={loading} onRetry={reload} />

      {/* 12. MERCHANT SUBSCRIPTIONS TABLE (Internal Scroll, Sticky Header) */}
      {data && !loading && (
        <>
          <div className="overflow-x-auto overflow-y-auto max-h-[560px] border border-admin-border rounded-2xl admin-scrollbar">
            <table className="w-full text-left text-xs divide-y divide-admin-border">
              <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Billing Period</th>
                  <th className="px-4 py-3">Valid Through</th>
                  <th className="px-4 py-3">Latest Invoice</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/60 bg-admin-surface">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-admin-muted text-xs">
                      No merchant subscription records match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  data.items.map((s) => {
                    const now = new Date();
                    const periodEnd = new Date(s.currentPeriodEnd);
                    const daysRemaining = Math.ceil(
                      (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                    );
                    const isExpired = s.status === 'ACTIVE' && periodEnd <= now;
                    const isExpiringSoon = s.status === 'ACTIVE' && !isExpired && daysRemaining <= 7 && daysRemaining >= 0;
                    const latestInvoice = s.invoices?.[0];

                    return (
                      <tr key={s.id} className="hover:bg-admin-raised/40 transition-colors">
                        {/* Merchant */}
                        <td className="px-4 py-3">
                          <Link
                            className="font-bold text-admin-accent hover:underline inline-flex items-center gap-1 text-sm"
                            href={`/merchants/${s.tenant.id}`}
                          >
                            {s.tenant.name}
                            <ExternalLink className="h-3 w-3 text-admin-muted" />
                          </Link>
                          {s.tenant.slug && (
                            <span className="text-[10px] text-admin-muted block font-mono mt-0.5">
                              {s.tenant.slug}
                            </span>
                          )}
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3">
                          <span className="font-semibold text-admin-text block">
                            {s.plan.name}
                          </span>
                          <span className="text-[10px] text-admin-muted block font-mono">
                            {s.plan.code}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {isExpired ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                              EXPIRED
                            </span>
                          ) : isExpiringSoon ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                ACTIVE
                              </span>
                              <span className="block text-[10px] text-amber-500 font-semibold">
                                Expiring in {daysRemaining}d
                              </span>
                            </div>
                          ) : s.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              ACTIVE
                            </span>
                          ) : s.status === 'CANCELED' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                              CANCELED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {s.status}
                            </span>
                          )}
                        </td>

                        {/* Billing Period */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-admin-secondary block">
                            {new Date(s.currentPeriodStart).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            –{' '}
                            {new Date(s.currentPeriodEnd).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>

                        {/* Valid Through */}
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold ${
                              isExpired
                                ? 'text-red-500'
                                : isExpiringSoon
                                  ? 'text-amber-500'
                                  : 'text-admin-text'
                            }`}
                          >
                            {new Date(s.currentPeriodEnd).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>

                        {/* Latest Invoice */}
                        <td className="px-4 py-3">
                          {latestInvoice ? (
                            <div className="space-y-0.5">
                              <span className="font-mono text-xs font-semibold text-admin-text block">
                                {latestInvoice.invoiceNumber || 'INV-CURRENT'}
                              </span>
                              {latestInvoice.id && (
                                <a
                                  href={`/api/platform/admin/invoices/${latestInvoice.id}/pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-admin-accent hover:underline inline-flex items-center gap-1 font-medium"
                                >
                                  <Download className="h-2.5 w-2.5" />
                                  PDF
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-admin-muted text-[11px]">None</span>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-3">
                          {latestInvoice ? (
                            <div className="space-y-0.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  latestInvoice.status === 'PAID'
                                    ? 'bg-emerald-500/15 text-emerald-500'
                                    : 'bg-amber-500/15 text-amber-500'
                                }`}
                              >
                                {latestInvoice.status}
                              </span>
                              {latestInvoice.amountPaise ? (
                                <span className="font-mono text-[11px] text-admin-text font-bold block mt-0.5">
                                  {formatPaise(latestInvoice.amountPaise)}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-admin-muted text-[11px]">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openManageModal(s)}
                            className="px-3 py-1 text-xs font-semibold rounded-xl bg-admin-raised hover:bg-admin-surface text-admin-secondary hover:text-admin-accent border border-admin-border hover:border-admin-accent/40 transition cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {data.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-admin-muted">
              <div>
                Showing{' '}
                <strong className="text-admin-text font-semibold">
                  {(data.page - 1) * data.pageSize + 1}–
                  {Math.min(data.page * data.pageSize, data.total)}
                </strong>{' '}
                of <strong className="text-admin-text font-semibold">{data.total}</strong> subscriptions
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* 13. SUBSCRIPTION MANAGEMENT MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay backdrop-blur-sm animate-in fade-in">
          <div className="bg-admin-surface border border-admin-border rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-admin-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-admin-text">
                  Manage Subscription · {selectedSub.tenant.name}
                </h3>
                <span className="text-[11px] text-admin-muted font-mono mt-0.5 block">
                  Subscription ID: {selectedSub.id}
                </span>
              </div>
              <button
                type="button"
                onClick={closeManageModal}
                className="p-1.5 rounded-xl text-admin-muted hover:text-admin-text hover:bg-admin-raised"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-admin-border bg-admin-raised/40 text-xs font-semibold px-5 pt-2 gap-4">
              <button
                type="button"
                onClick={() => setManageTab('OVERVIEW')}
                className={`pb-2 border-b-2 transition-colors ${
                  manageTab === 'OVERVIEW'
                    ? 'border-admin-accent text-admin-accent font-bold'
                    : 'border-transparent text-admin-muted hover:text-admin-text'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setManageTab('CHANGE_PLAN')}
                className={`pb-2 border-b-2 transition-colors ${
                  manageTab === 'CHANGE_PLAN'
                    ? 'border-admin-accent text-admin-accent font-bold'
                    : 'border-transparent text-admin-muted hover:text-admin-text'
                }`}
              >
                Change Plan
              </button>
              <button
                type="button"
                onClick={() => setManageTab('EXTEND')}
                className={`pb-2 border-b-2 transition-colors ${
                  manageTab === 'EXTEND'
                    ? 'border-admin-accent text-admin-accent font-bold'
                    : 'border-transparent text-admin-muted hover:text-admin-text'
                }`}
              >
                Extend Validity
              </button>
              <button
                type="button"
                onClick={() => setManageTab('CANCEL')}
                className={`pb-2 border-b-2 transition-colors ${
                  manageTab === 'CANCEL'
                    ? 'border-red-500 text-red-500 font-bold'
                    : 'border-transparent text-admin-muted hover:text-admin-text'
                }`}
              >
                Deactivate
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {actionError && (
                <div className="p-3 rounded-2xl bg-admin-danger-soft border border-admin-border text-admin-danger text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 rounded-2xl bg-admin-soft border border-admin-border text-admin-accent text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {manageTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 bg-admin-raised/40 p-4 rounded-2xl border border-admin-border">
                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block font-bold">
                        Merchant
                      </span>
                      <span className="font-bold text-admin-text block">{selectedSub.tenant.name}</span>
                      <Link
                        href={`/merchants/${selectedSub.tenant.id}`}
                        className="text-[11px] text-admin-accent hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                      >
                        View Merchant
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>

                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block font-bold">
                        Current Plan
                      </span>
                      <span className="font-bold text-admin-text block">{selectedSub.plan.name}</span>
                      <span className="text-[11px] text-admin-muted font-mono block mt-0.5">
                        Code: {selectedSub.plan.code}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block font-bold">
                        Status
                      </span>
                      <span className="font-bold text-admin-text block">{selectedSub.status}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block font-bold">
                        Valid Through
                      </span>
                      <span className="font-bold text-admin-text block">
                        {new Date(selectedSub.currentPeriodEnd).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Latest Invoice Detail */}
                  {selectedSub.invoices?.[0] && (
                    <div className="p-4 rounded-2xl bg-admin-raised/40 border border-admin-border space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-admin-accent" />
                        Latest Invoice
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-admin-text block">
                            {selectedSub.invoices[0].invoiceNumber || 'INV-CURRENT'}
                          </span>
                          <span className="text-[11px] text-admin-muted block mt-0.5">
                            Status: {selectedSub.invoices[0].status}
                            {selectedSub.invoices[0].amountPaise
                              ? ` · ${formatPaise(selectedSub.invoices[0].amountPaise)}`
                              : ''}
                          </span>
                        </div>
                        {selectedSub.invoices[0].id && (
                          <a
                            href={`/api/platform/admin/invoices/${selectedSub.invoices[0].id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-admin-primary text-admin-on-primary font-semibold text-xs inline-flex items-center gap-1.5"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download PDF
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 14. PLAN CHANGE WITH AUDIT REASON */}
              {manageTab === 'CHANGE_PLAN' && (
                <div className="space-y-3">
                  <p className="text-admin-muted leading-relaxed">
                    Switch merchant to a different SaaS subscription tier. New plan limits apply immediately to Seller Billing, while historical invoices and payments remain strictly immutable.
                  </p>

                  <div className="space-y-1">
                    <label className="font-semibold text-admin-text">Select New Plan</label>
                    <select
                      value={newPlanId}
                      onChange={(e) => setNewPlanId(e.target.value)}
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text font-medium"
                    >
                      {plansQuery.data?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) — {p.pricePaise > 0 ? formatPaise(p.pricePaise) : 'Free/Custom'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-admin-text">
                      Administrative Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Upgraded to Growth plan per merchant request"
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={closeManageModal}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-admin-secondary hover:bg-admin-raised"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={handleChangePlan}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-admin-primary text-admin-on-primary"
                    >
                      {actionBusy ? 'Updating...' : 'Save Plan Change'}
                    </button>
                  </div>
                </div>
              )}

              {/* EXTEND VALIDITY */}
              {manageTab === 'EXTEND' && (
                <div className="space-y-3">
                  <p className="text-admin-muted leading-relaxed">
                    Extend subscription validity. Updates store access expiration without modifying historical payments.
                  </p>

                  <div className="space-y-1">
                    <label className="font-semibold text-admin-text">New Expiry Date</label>
                    <input
                      type="date"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-admin-text">
                      Reason for Validity Adjustment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Promotional 30-day grace extension"
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={closeManageModal}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-admin-secondary hover:bg-admin-raised"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={handleExtendExpiry}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-admin-primary text-admin-on-primary"
                    >
                      {actionBusy ? 'Saving...' : 'Save Expiry Date'}
                    </button>
                  </div>
                </div>
              )}

              {/* CANCEL / DEACTIVATE */}
              {manageTab === 'CANCEL' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                    <span className="font-bold block mb-1">Warning: Deactivating Subscription</span>
                    Deactivating will mark this subscription as CANCELED. Historical invoices remain preserved. Store access continues according to canonical subscription rules.
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-admin-text">
                      Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Merchant voluntary deactivation"
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={closeManageModal}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-admin-secondary hover:bg-admin-raised"
                    >
                      Keep Active
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={handleCancelSubscription}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                    >
                      {actionBusy ? 'Canceling...' : 'Confirm Deactivation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

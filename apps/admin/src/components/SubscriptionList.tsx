import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export function SubscriptionList({ tenantId }: { tenantId?: string }) {
  const { api } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [planId, setPlanId] = useState('ALL');

  useEffect(() => {
    setPage(1);
  }, [tenantId, search, status, planId]);

  // Query subscriptions
  const { data, loading, error, reload } = useAdminQuery<
    AdminPage<AdminSubscription>
  >('admin/subscriptions', {
    tenantId,
    page,
    search: search.trim() || undefined,
    status: status !== 'ALL' ? status : undefined,
    planId: planId !== 'ALL' ? planId : undefined,
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
    // default next month
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

  return (
    <section className="admin-panel space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-admin-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-admin-text">Merchant Subscriptions</h2>
          <p className="text-xs text-admin-muted">
            PostgreSQL-backed active and past merchant subscription records
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="admin-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 self-start sm:self-auto font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5 text-admin-accent" />
          Refresh
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-admin-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, plan, or invoice #..."
            className="admin-input pl-8 pr-2 py-1.5 w-full text-xs"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="admin-input py-1.5 text-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="TRIALING">TRIALING</option>
          <option value="PAST_DUE">PAST DUE</option>
          <option value="CANCELED">CANCELED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>

        {/* Plan Filter */}
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="admin-input py-1.5 text-xs"
        >
          <option value="ALL">All Plans</option>
          {plansQuery.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {(search || status !== 'ALL' || planId !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatus('ALL');
              setPlanId('ALL');
            }}
            className="text-xs text-admin-accent hover:underline font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      <Feedback error={error} loading={loading} onRetry={reload} />

      {data && !loading && (
        <>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  {[
                    'Merchant',
                    'Plan',
                    'Status',
                    'Start Date',
                    'Valid Through',
                    'Latest Invoice',
                    'Actions',
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => {
                  const isExpired =
                    s.status === 'ACTIVE' && new Date(s.currentPeriodEnd) <= new Date();
                  const latestInvoice = s.invoices?.[0];

                  return (
                    <tr key={s.id}>
                      <td>
                        <Link
                          className="font-bold text-admin-accent hover:underline inline-flex items-center gap-1"
                          href={'/merchants/' + s.tenant.id}
                        >
                          {s.tenant.name}
                          <ExternalLink className="h-3 w-3 text-admin-muted" />
                        </Link>
                      </td>
                      <td>
                        <span className="font-semibold text-admin-text">{s.plan.name}</span>
                        <span className="text-[10px] text-admin-muted block font-mono">
                          {s.plan.code}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'ACTIVE' && !isExpired
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : s.status === 'CANCELED'
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {s.status}
                          {isExpired && ' (EXPIRED)'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-admin-secondary">
                          {new Date(s.currentPeriodStart).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`text-xs font-medium ${
                            isExpired ? 'text-red-500 font-bold' : 'text-admin-text'
                          }`}
                        >
                          {new Date(s.currentPeriodEnd).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        {latestInvoice ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  latestInvoice.status === 'PAID'
                                    ? 'bg-emerald-500/15 text-emerald-500'
                                    : 'bg-amber-500/15 text-amber-500'
                                }`}
                              >
                                {latestInvoice.status}
                              </span>
                              {latestInvoice.amountPaise ? (
                                <span className="font-mono text-[11px] text-admin-text font-bold">
                                  {formatPaise(latestInvoice.amountPaise)}
                                </span>
                              ) : null}
                            </div>
                            {latestInvoice.id && (
                              <a
                                href={`/api/admin/invoices/${latestInvoice.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-admin-accent hover:underline flex items-center gap-1"
                              >
                                <Download className="h-2.5 w-2.5" />
                                Download PDF
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-admin-muted text-[11px]">No invoice</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openManageModal(s)}
                          className="admin-secondary text-xs px-2.5 py-1 font-semibold hover:border-admin-accent hover:text-admin-accent inline-flex items-center gap-1"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!data.items.length && (
            <p className="text-xs text-admin-muted py-4 text-center">
              No subscription records match your search criteria.
            </p>
          )}

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={setPage}
          />
        </>
      )}

      {/* Subscription Management Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-admin-surface border border-admin-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-admin-panel border-b border-admin-border/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-admin-text">
                  Manage Subscription · {selectedSub.tenant.name}
                </h3>
                <span className="text-[11px] text-admin-muted font-mono">
                  Subscription ID: {selectedSub.id}
                </span>
              </div>
              <button
                type="button"
                onClick={closeManageModal}
                className="text-admin-muted hover:text-admin-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-admin-border/60 bg-admin-raised/40 text-xs font-semibold px-4 pt-2 gap-4">
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
                Adjust Validity
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
                Cancel / Deactivate
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {actionError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {manageTab === 'OVERVIEW' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 bg-admin-panel p-3 rounded-xl border border-admin-border/50">
                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block font-bold">
                        Merchant
                      </span>
                      <span className="font-bold text-admin-text block">{selectedSub.tenant.name}</span>
                      <Link
                        href={`/merchants/${selectedSub.tenant.id}`}
                        className="text-[11px] text-admin-accent hover:underline flex items-center gap-1 mt-0.5"
                      >
                        View Merchant Profile
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>

                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block font-bold">
                        Current Plan
                      </span>
                      <span className="font-bold text-admin-text block">{selectedSub.plan.name}</span>
                      <span className="text-[11px] text-admin-muted font-mono block">
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
                        Validity Through
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
                    <div className="p-3 rounded-xl bg-admin-panel border border-admin-border/50 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-admin-accent" />
                        Latest Invoice
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-admin-text block">
                            {selectedSub.invoices[0].invoiceNumber || 'INV-CURRENT'}
                          </span>
                          <span className="text-[11px] text-admin-muted block">
                            Status: {selectedSub.invoices[0].status}
                            {selectedSub.invoices[0].amountPaise ? ` · ${formatPaise(selectedSub.invoices[0].amountPaise)}` : ''}
                          </span>
                        </div>
                        {selectedSub.invoices[0].id && (
                          <a
                            href={`/api/admin/invoices/${selectedSub.invoices[0].id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-button text-xs px-3 py-1.5 font-semibold inline-flex items-center gap-1.5"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download Invoice PDF
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {manageTab === 'CHANGE_PLAN' && (
                <div className="space-y-3">
                  <p className="text-admin-muted">
                    Switch merchant to a different SaaS subscription tier. Product limits and entitlements will update immediately.
                  </p>

                  <div className="space-y-1">
                    <label className="font-semibold text-admin-text">Select New Plan</label>
                    <select
                      value={newPlanId}
                      onChange={(e) => setNewPlanId(e.target.value)}
                      className="admin-input text-xs w-full py-2"
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
                      className="admin-input text-xs w-full py-2"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={closeManageModal}
                      className="admin-secondary text-xs px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={handleChangePlan}
                      className="admin-button text-xs px-4 py-1.5 font-bold"
                    >
                      {actionBusy ? 'Updating...' : 'Save Plan Change'}
                    </button>
                  </div>
                </div>
              )}

              {manageTab === 'EXTEND' && (
                <div className="space-y-3">
                  <p className="text-admin-muted">
                    Extend or adjust subscription validity. Does NOT mutate historical payment records or invoices.
                  </p>

                  <div className="space-y-1">
                    <label className="font-semibold text-admin-text">New Expiry Date</label>
                    <input
                      type="date"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="admin-input text-xs w-full py-2"
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
                      className="admin-input text-xs w-full py-2"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={closeManageModal}
                      className="admin-secondary text-xs px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={handleExtendExpiry}
                      className="admin-button text-xs px-4 py-1.5 font-bold"
                    >
                      {actionBusy ? 'Saving...' : 'Save Expiry Date'}
                    </button>
                  </div>
                </div>
              )}

              {manageTab === 'CANCEL' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                    <span className="font-bold block mb-1">Warning: Deactivating Subscription</span>
                    Deactivating will mark the merchant subscription as CANCELED. Store access will follow canonical platform subscription rules.
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-admin-text">
                      Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Terms violation or merchant voluntary deactivation"
                      className="admin-input text-xs w-full py-2"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={closeManageModal}
                      className="admin-secondary text-xs px-3 py-1.5"
                    >
                      Keep Active
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={handleCancelSubscription}
                      className="admin-button text-xs px-4 py-1.5 font-bold bg-red-600 hover:bg-red-700 text-white"
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


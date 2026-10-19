import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { AdminUser, AdminUsersResponse } from '@simply/api-contracts';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, ActionModal, useAdminQuery, errorMessage } from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminAttention } from '../context/AdminAttentionContext';

export default function Users() {
  const { api, user: currentAdmin } = useAdminAuth();
  const { refreshAttention } = useAdminAttention();

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Search, Filter & Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('newest');

  // UI modal / drawer state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const filtersRef = useRef<HTMLDivElement>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  const queryParams: Record<string, any> = {
    page,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    role: role !== 'ALL' ? role : undefined,
    status: status !== 'ALL' ? status : undefined,
    sort,
  };

  const { data, loading, error, reload } = useAdminQuery<AdminUsersResponse>(
    'admin/users',
    queryParams,
  );

  // Active filter chips
  const activeFilters = [
    role !== 'ALL' && {
      key: 'role',
      label: `Role: ${role === 'PLATFORM_ADMIN' ? 'Platform Admin' : role === 'SELLER_OWNER' ? 'Merchant Owner' : 'Merchant Staff'}`,
      clear: () => setRole('ALL'),
    },
    status !== 'ALL' && {
      key: 'status',
      label: `Status: ${status === 'ACTIVE' ? 'Active' : 'Suspended'}`,
      clear: () => setStatus('ALL'),
    },
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  const clearAllFilters = () => {
    setRole('ALL');
    setStatus('ALL');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  // Suspend / Reactivate handler
  async function confirmToggleStatus() {
    if (!statusModalUser) return;
    if (!suspendReason.trim()) {
      setActionError('Reason is required for account status change.');
      return;
    }
    const wasActive = statusModalUser.isActive;
    setBusy(true);
    setActionError('');
    try {
      await api.admin.toggleUserStatus(statusModalUser.id, {
        reason: suspendReason.trim(),
        internalNote: internalNote.trim() || undefined,
      });
      setStatusModalUser(null);
      setSuspendReason('');
      setInternalNote('');
      if (selectedUser?.id === statusModalUser.id) {
        setSelectedUser({
          ...selectedUser,
          isActive: !selectedUser.isActive,
        });
      }
      setToastMessage({
        type: 'success',
        text: wasActive
          ? 'Merchant account suspended. Active sessions revoked.'
          : 'Merchant account reactivated.',
      });
      setTimeout(() => setToastMessage(null), 5000);
      void refreshAttention();
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  // Friendly role formatter
  const formatRole = (r: string) => {
    switch (r) {
      case 'PLATFORM_ADMIN':
        return 'Platform Admin';
      case 'SELLER_OWNER':
        return 'Merchant Owner';
      case 'SELLER_STAFF':
        return 'Merchant Staff';
      default:
        return r;
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
        <title>Users & Access — LetzShop Admin</title>
      </Head>

      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-admin-text">Users & Access</h1>
            <p className="mt-1 text-sm text-admin-muted">
              Manage platform accounts, roles and account status
            </p>
          </div>
          <button
            className="admin-secondary flex items-center gap-2"
            onClick={reload}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Users
          </button>
        </div>

        {/* Action Toast Notification */}
        {toastMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="opacity-70 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Real KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
              Total Users
            </span>
            <div className="mt-2 text-2xl font-bold text-admin-text">
              {kpis?.totalUsers ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-admin-muted">All active & suspended</p>
          </div>

          <div className="rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Merchant Owners
            </span>
            <div className="mt-2 text-2xl font-bold text-admin-text">
              {kpis?.merchantOwners ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-admin-muted">Primary sellers</p>
          </div>

          <div className="rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Staff Users
            </span>
            <div className="mt-2 text-2xl font-bold text-admin-text">
              {kpis?.staffUsers ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-admin-muted">Merchant store staff</p>
          </div>

          <div className="rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Platform Admins
            </span>
            <div className="mt-2 text-2xl font-bold text-admin-text">
              {kpis?.platformAdmins ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-admin-muted">System administrators</p>
          </div>

          <div className="rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Suspended
            </span>
            <div className="mt-2 text-2xl font-bold text-admin-text">
              {kpis?.suspendedUsers ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-admin-muted">Login blocked</p>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sort */}
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
                placeholder="Search name, email, phone, or merchant..."
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
                <div className="absolute right-0 top-full z-30 mt-2 w-72 space-y-4 rounded-xl border border-admin-border bg-admin-surface p-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-admin-border pb-2">
                    <span className="font-semibold text-admin-text">Filter Users</span>
                    {activeFilters.length > 0 && (
                      <button
                        className="text-xs text-admin-accent hover:underline"
                        onClick={clearAllFilters}
                      >
                        Reset all
                      </button>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-medium text-admin-secondary mb-1">
                      Account Role
                    </label>
                    <select
                      className="admin-input text-xs"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="ALL">All Roles</option>
                      <option value="PLATFORM_ADMIN">Platform Admin</option>
                      <option value="SELLER_OWNER">Merchant Owner</option>
                      <option value="SELLER_STAFF">Merchant Staff</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-admin-secondary mb-1">
                      Account Status
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
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Suspended</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-admin-border flex justify-end">
                    <button
                      className="admin-button text-xs py-1.5 px-3"
                      onClick={() => setFiltersOpen(false)}
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
                className="admin-input text-xs w-auto min-w-[130px]"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name A → Z</option>
                <option value="name_desc">Name Z → A</option>
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

        <Feedback loading={loading} error={error} onRetry={reload} />

        {/* Users Table / List */}
        <div className="rounded-xl border border-admin-border bg-admin-surface overflow-hidden shadow-sm">
          {/* Desktop & Tablet Table */}
          <div className="hidden md:block max-h-[580px] overflow-y-auto overflow-x-auto admin-scrollbar">
            <table className="admin-table w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-admin-raised shadow-[0_1px_0_0_var(--admin-border)]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Merchant / Store</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Last Login</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 font-semibold text-admin-secondary text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {data?.items?.map((u) => {
                  const isPlatformAdmin = u.role === 'PLATFORM_ADMIN';
                  const isSelf = currentAdmin?.userId === u.id;
                  const merchantName = u.tenant?.name;
                  const merchantId = u.tenant?.id;
                  const storeName = u.store?.name;

                  return (
                    <tr key={u.id} className="hover:bg-admin-raised/60 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-raised text-xs font-semibold text-admin-secondary uppercase">
                            {u.fullName?.substring(0, 2) || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-admin-text block">
                              {u.fullName || 'Unnamed Account'}
                            </span>
                            {u.isSuperAdmin && (
                              <span className="inline-block text-[10px] uppercase font-bold text-admin-accent mt-0.5">
                                SuperAdmin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 align-middle text-xs">
                        <div className="font-mono text-admin-text">{u.phone || '—'}</div>
                        <div className="text-admin-muted truncate max-w-[170px] mt-0.5">
                          {u.email || <span className="italic">No email</span>}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            isPlatformAdmin
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                              : u.role === 'SELLER_OWNER'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {formatRole(u.role)}
                        </span>
                      </td>

                      {/* Merchant / Store */}
                      <td className="px-4 py-3.5 align-middle text-xs">
                        {isPlatformAdmin ? (
                          <span className="inline-flex items-center rounded bg-admin-raised px-2 py-0.5 font-medium text-admin-muted">
                            Platform
                          </span>
                        ) : merchantName ? (
                          <div>
                            {merchantId ? (
                              <Link
                                href={`/merchants/${merchantId}`}
                                className="font-medium text-admin-text hover:text-admin-accent hover:underline block truncate max-w-[180px]"
                              >
                                {merchantName}
                              </Link>
                            ) : (
                              <span className="font-medium text-admin-text block truncate max-w-[180px]">
                                {merchantName}
                              </span>
                            )}
                            {storeName && storeName !== merchantName && (
                              <span className="text-[11px] text-admin-muted block mt-0.5 truncate max-w-[180px]">
                                {storeName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-admin-muted">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3.5 align-middle text-xs text-admin-muted whitespace-nowrap">
                        {u.lastLoginAt ? (
                          new Date(u.lastLoginAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-admin-muted/60">—</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 align-middle text-xs text-admin-muted whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="admin-secondary text-xs px-2.5 py-1"
                            onClick={() => setSelectedUser(u)}
                          >
                            View Details
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                u.isActive
                                  ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              onClick={() => {
                                setStatusModalUser(u);
                                setSuspendReason('');
                                setInternalNote('');
                                setActionError('');
                              }}
                            >
                              {u.isActive ? 'Suspend' : 'Reactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Account Cards */}
          <div className="md:hidden divide-y divide-admin-border">
            {data?.items?.map((u) => {
              const isPlatformAdmin = u.role === 'PLATFORM_ADMIN';
              const isSelf = currentAdmin?.userId === u.id;
              const merchantName = u.tenant?.name;

              return (
                <div key={u.id} className="p-4 space-y-3 hover:bg-admin-raised/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-admin-raised text-xs font-semibold uppercase text-admin-secondary">
                        {u.fullName?.substring(0, 2) || 'U'}
                      </div>
                      <span className="font-semibold text-sm text-admin-text">
                        {u.fullName || 'Unnamed Account'}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        u.isActive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-admin-muted block">Phone:</span>
                      <span className="font-mono text-admin-text">{u.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-admin-muted block">Role:</span>
                      <span className="font-medium text-admin-text">{formatRole(u.role)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-admin-muted block">Merchant / Store:</span>
                      <span className="text-admin-text">
                        {isPlatformAdmin ? 'Platform' : merchantName || 'No associated store'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      className="admin-secondary text-xs px-3 py-1.5"
                      onClick={() => setSelectedUser(u)}
                    >
                      View
                    </button>
                    {!isSelf && (
                      <button
                        type="button"
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                          u.isActive
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                        onClick={() => {
                          setStatusModalUser(u);
                          setSuspendReason('');
                          setInternalNote('');
                          setActionError('');
                        }}
                      >
                        {u.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {!error && !loading && (!data?.items || data.items.length === 0) && (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-admin-muted opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-3 text-base font-medium text-admin-text">No platform users found.</p>
              <p className="mt-1 text-xs text-admin-muted">
                {activeFilters.length > 0 || debouncedSearch
                  ? 'Try modifying your search query or reset filters.'
                  : 'Users registered across merchants and administration will appear here.'}
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

          {/* Pagination Footer */}
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

      {/* User Detail Drawer */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-admin-overlay p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-xl border border-admin-border bg-admin-surface p-6 shadow-2xl admin-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-admin-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-admin-raised text-base font-bold text-admin-secondary uppercase">
                  {selectedUser.fullName?.substring(0, 2) || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-admin-text">{selectedUser.fullName || 'User Details'}</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        selectedUser.isActive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {selectedUser.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-admin-muted">
                    ID: {selectedUser.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-admin-muted hover:bg-admin-raised hover:text-admin-text"
                onClick={() => setSelectedUser(null)}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Safe Account Information Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-admin-border bg-admin-raised/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                  Account Credentials & Contact
                </span>
                <div>
                  <div className="text-xs text-admin-muted">Phone Number</div>
                  <div className="font-mono text-sm font-semibold text-admin-text mt-0.5">
                    {selectedUser.phone || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-admin-muted">Email Address</div>
                  <div className="text-sm text-admin-text mt-0.5">
                    {selectedUser.email || <span className="italic text-admin-muted">Not provided</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-admin-muted">Account Role</div>
                  <div className="text-sm font-semibold text-admin-text mt-0.5">
                    {formatRole(selectedUser.role)} {selectedUser.isSuperAdmin && '(Super Admin)'}
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-admin-border bg-admin-raised/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                  Activity & Access Timestamps
                </span>
                <div>
                  <div className="text-xs text-admin-muted">Created On</div>
                  <div className="text-xs text-admin-text mt-0.5">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-admin-muted">Last Login / Activity</div>
                  <div className="text-xs font-medium text-admin-text mt-0.5">
                    {selectedUser.lastLoginAt ? (
                      new Date(selectedUser.lastLoginAt).toLocaleString()
                    ) : (
                      <span className="text-admin-muted italic">Never recorded</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-admin-muted">Account Status</div>
                  <div className="text-xs font-medium text-admin-text mt-0.5">
                    {selectedUser.isActive ? 'Active (Full access)' : 'Suspended (Access blocked)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tenancy & Association */}
            <div className="rounded-lg border border-admin-border bg-admin-raised/40 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                Merchant & Store Membership
              </span>
              {selectedUser.role === 'PLATFORM_ADMIN' ? (
                <p className="text-xs text-admin-muted">
                  This user is a platform administrator with access across all LetzShop operations.
                </p>
              ) : selectedUser.tenant ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-admin-muted block">Merchant Organization:</span>
                    <span className="text-sm font-semibold text-admin-text">{selectedUser.tenant.name}</span>
                    {selectedUser.store?.name && selectedUser.store.name !== selectedUser.tenant.name && (
                      <span className="text-xs text-admin-muted block mt-0.5">Store: {selectedUser.store.name}</span>
                    )}
                  </div>
                  <Link
                    href={`/merchants/${selectedUser.tenant.id}`}
                    className="admin-secondary text-xs"
                  >
                    View Merchant Profile →
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-admin-muted italic">
                  No active merchant or store membership associated with this account.
                </p>
              )}
            </div>

            {/* Recent Safe Account Activity / Audit trail */}
            {selectedUser.recentActivity && selectedUser.recentActivity.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                  Recent Account Audit Trail
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto admin-scrollbar">
                  {selectedUser.recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="rounded-lg border border-admin-border bg-admin-surface p-2.5 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="font-semibold text-admin-text">{act.action}</span>
                        {act.reason && <p className="text-admin-muted mt-0.5">{act.reason}</p>}
                      </div>
                      <span className="text-[11px] text-admin-muted whitespace-nowrap">
                        {new Date(act.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border pt-4">
              <div>
                {currentAdmin?.userId !== selectedUser.id && (
                  <button
                    type="button"
                    className={`text-xs px-3 py-2 rounded-lg font-medium border ${
                      selectedUser.isActive
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    onClick={() => {
                      setStatusModalUser(selectedUser);
                      setSuspendReason('');
                      setInternalNote('');
                      setActionError('');
                    }}
                  >
                    {selectedUser.isActive ? 'Suspend User Account' : 'Reactivate User Account'}
                  </button>
                )}
              </div>
              <button
                type="button"
                className="admin-secondary text-xs px-4 py-2"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      {statusModalUser && (
        <ActionModal
          title={statusModalUser.isActive ? 'Suspend User Account' : 'Reactivate User Account'}
          busy={busy}
          error={actionError}
          confirmLabel={statusModalUser.isActive ? 'Suspend Account' : 'Reactivate Account'}
          onClose={() => {
            setStatusModalUser(null);
            setActionError('');
          }}
          onConfirm={() => void confirmToggleStatus()}
        >
          <div className="space-y-4">
            <div
              className={`rounded-lg p-3 text-xs ${
                statusModalUser.isActive
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              }`}
            >
              {statusModalUser.isActive ? (
                <p>
                  <strong>Notice:</strong> Suspending this account blocks login and terminates active sessions immediately.
                  Storefront operations and customer orders remain untouched.
                </p>
              ) : (
                <p>
                  <strong>Notice:</strong> Reactivating this account will allow the user to authenticate and access their dashboard.
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-admin-text">
                Target Account: <strong>{statusModalUser.fullName || statusModalUser.phone}</strong> (
                {formatRole(statusModalUser.role)})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-admin-secondary mb-1">
                Reason for {statusModalUser.isActive ? 'Suspension' : 'Reactivation'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                className="admin-input text-xs"
                placeholder={
                  statusModalUser.isActive
                    ? 'e.g. Terms violation, requested by merchant owner, security alert'
                    : 'e.g. Verification completed, dispute resolved'
                }
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-admin-secondary mb-1">
                Internal Administrative Note (Optional)
              </label>
              <textarea
                className="admin-input text-xs h-20"
                placeholder="Internal audit notes, reference ticket IDs, or specific context..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
              />
            </div>
          </div>
        </ActionModal>
      )}
    </AdminLayout>
  );
}

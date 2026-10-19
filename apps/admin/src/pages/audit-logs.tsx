import type { AdminAudit, AdminAuditKpis, AdminAuditPageResult } from '@simply/api-contracts';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  User,
  Shield,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Activity,
  Layers,
  Globe,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback } from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';

const AUDIT_MODULES = [
  'All Modules',
  'Authentication',
  'Sub Admins',
  'Merchants',
  'Users',
  'Reviews',
  'Subscriptions',
  'Payments',
  'Business Verification',
  'Settings',
  'Themes',
  'Orders',
  'System',
];

export default function AuditLogsPage() {
  const { api } = useAdminAuth();

  const [items, setItems] = useState<AdminAudit[]>([]);
  const [kpis, setKpis] = useState<AdminAuditKpis>({
    actionsToday: 0,
    adminActions: 0,
    securityEvents: 0,
    failedActions: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected audit log for slide-over drawer
  const [selectedLog, setSelectedLog] = useState<AdminAudit | null>(null);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getAuditLogs({
        search: search.trim() || undefined,
        module: moduleFilter === 'All Modules' ? undefined : moduleFilter,
        result: resultFilter === 'ALL' ? undefined : resultFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize,
      });

      setItems(res.items || (res as any).data || []);
      setTotal(res.total || 0);
      if (res.kpis) {
        setKpis(res.kpis);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [page, pageSize, moduleFilter, resultFilter, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAuditLogs();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <AdminLayout>
      <Head>
        <title>Audit Logs — LetzShop Admin</title>
      </Head>

      <div className="space-y-5">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-admin-text">Audit Logs</h1>
          <p className="text-sm text-admin-muted mt-1">
            Track administrative and platform-sensitive actions with immutable verification telemetry.
          </p>
        </div>

        {/* Top Compact KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider block">
                Actions Today
              </span>
              <span className="text-lg font-bold text-admin-text">{kpis.actionsToday}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider block">
                Admin Actions
              </span>
              <span className="text-lg font-bold text-admin-text">{kpis.adminActions}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider block">
                Security Events
              </span>
              <span className="text-lg font-bold text-admin-text">{kpis.securityEvents}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider block">
                Failed / Denied
              </span>
              <span className="text-lg font-bold text-admin-text">{kpis.failedActions}</span>
            </div>
          </div>
        </div>

        {/* Compact Search & Filter Toolbar */}
        <div className="admin-panel p-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-admin-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search actor, action, merchant, invoice..."
                  className="admin-input w-full pl-9 text-xs"
                />
              </div>
              <button type="submit" className="btn-admin-raised text-xs px-3">
                Search
              </button>
            </form>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Module Filter */}
              <div className="flex items-center gap-1 bg-admin-surface border border-admin-border rounded-lg px-2 py-1">
                <span className="text-admin-muted text-[11px]">Module:</span>
                <select
                  value={moduleFilter}
                  onChange={(e) => {
                    setModuleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-admin-text focus:outline-none cursor-pointer"
                >
                  {AUDIT_MODULES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Result Filter */}
              <div className="flex items-center gap-1 bg-admin-surface border border-admin-border rounded-lg px-2 py-1">
                <span className="text-admin-muted text-[11px]">Result:</span>
                <select
                  value={resultFilter}
                  onChange={(e) => {
                    setResultFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-admin-text focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Results</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed / Denied</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="admin-input text-xs py-1 px-2"
                  title="From Date"
                />
                <span className="text-admin-muted text-xs">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="admin-input text-xs py-1 px-2"
                  title="To Date"
                />
              </div>

              {/* Page Size */}
              <div className="flex items-center gap-1 bg-admin-surface border border-admin-border rounded-lg px-2 py-1">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-admin-text focus:outline-none cursor-pointer"
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSearch('');
                  setModuleFilter('All Modules');
                  setResultFilter('ALL');
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                  loadAuditLogs();
                }}
                className="btn-admin-raised p-2"
                title="Reset filters"
              >
                <RotateCw className="w-3.5 h-3.5 text-admin-muted" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback / Error */}
        <Feedback error={error || undefined} loading={loading} />

        {/* Audit Table with Fixed Height, Internal Scrolling, Sticky Header */}
        {!loading && items.length === 0 && (
          <div className="admin-panel text-center py-12 text-admin-muted space-y-2">
            <FileText className="w-8 h-8 mx-auto text-admin-muted/60" />
            <div className="text-sm font-semibold text-admin-text">No audit events found</div>
            <p className="text-xs">Try adjusting your search criteria or date filters.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="admin-panel p-0 overflow-hidden flex flex-col border border-admin-border">
            {/* Scrollable Container with Controlled Height */}
            <div className="overflow-y-auto overflow-x-auto max-h-[580px] subtle-scrollbar relative">
              <table className="w-full text-left text-xs border-collapse">
                {/* Sticky Header */}
                <thead className="bg-admin-surface/95 backdrop-blur-md sticky top-0 z-10 border-b border-admin-border text-admin-muted uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3.5 py-3 font-semibold">Time</th>
                    <th className="px-3.5 py-3 font-semibold">Actor</th>
                    <th className="px-3.5 py-3 font-semibold">Role</th>
                    <th className="px-3.5 py-3 font-semibold">Action</th>
                    <th className="px-3.5 py-3 font-semibold">Target</th>
                    <th className="px-3.5 py-3 font-semibold">Module</th>
                    <th className="px-3.5 py-3 font-semibold">Result</th>
                    <th className="px-3.5 py-3 font-semibold">IP / Source</th>
                    <th className="px-3.5 py-3 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {items.map((log) => {
                    const isFailed = log.result === 'FAILED' || log.result === 'DENIED' || log.action.includes('FAILED');
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-admin-raised/40 transition-colors cursor-pointer"
                      >
                        {/* 1. Time */}
                        <td className="px-3.5 py-3 text-admin-muted whitespace-nowrap text-[11px]">
                          <div className="font-semibold text-admin-text">
                            {new Date(log.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-admin-muted flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>

                        {/* 2. Actor */}
                        <td className="px-3.5 py-3">
                          <div className="font-semibold text-admin-text text-xs">
                            {log.actorName || 'System'}
                          </div>
                          {log.actorEmail && (
                            <div className="text-admin-muted font-mono text-[10px] truncate max-w-[130px]">
                              {log.actorEmail}
                            </div>
                          )}
                        </td>

                        {/* 3. Role */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              log.actorRole === 'Super Admin'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                : log.actorRole === 'Sub Admin'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                                : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                            }`}
                          >
                            {log.actorRole || 'System'}
                          </span>
                        </td>

                        {/* 4. Action */}
                        <td className="px-3.5 py-3 font-mono text-[11px] text-admin-text">
                          <span className="bg-admin-raised px-1.5 py-0.5 rounded border border-admin-border font-bold">
                            {log.action}
                          </span>
                        </td>

                        {/* 5. Target */}
                        <td className="px-3.5 py-3 text-[11px] max-w-[140px] truncate">
                          <span className="font-semibold text-admin-text block truncate">
                            {log.targetName || log.entityId || '—'}
                          </span>
                          <span className="text-[10px] text-admin-muted block">
                            {log.entityType}
                          </span>
                        </td>

                        {/* 6. Module */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-admin-raised/60 text-admin-secondary border border-admin-border">
                            {log.module || log.entityType}
                          </span>
                        </td>

                        {/* 7. Result */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                              isFailed
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isFailed ? (
                              <X className="w-3 h-3 text-rose-500" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            )}
                            <span>{isFailed ? 'FAILED' : 'SUCCESS'}</span>
                          </span>
                        </td>

                        {/* 8. IP / Source */}
                        <td className="px-3.5 py-3 text-admin-muted text-[11px] whitespace-nowrap">
                          {log.ipAddress ? (
                            <span className="font-mono text-[10px]">{log.ipAddress}</span>
                          ) : (
                            <span className="italic text-[10px]">internal</span>
                          )}
                        </td>

                        {/* 9. Details Action */}
                        <td className="px-3.5 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="p-1.5 rounded-lg hover:bg-admin-raised text-admin-muted hover:text-admin-text transition-colors"
                            title="Inspect event details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer Outside Scrolling Body */}
            <div className="p-3.5 border-t border-admin-border bg-admin-surface/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-admin-muted">
              <div>
                Showing <strong>{items.length}</strong> of <strong>{total}</strong> audit events
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="btn-admin-raised p-1.5 disabled:opacity-40"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-admin-text px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn-admin-raised p-1.5 disabled:opacity-40"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AUDIT DETAIL SLIDE-OVER DRAWER */}
        {/* ========================================================================= */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-lg bg-admin-surface border-l border-admin-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-4 border-b border-admin-border flex items-center justify-between bg-admin-surface/90">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-admin-accent" />
                  <h3 className="text-base font-bold text-admin-text">Audit Event Investigation</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-admin-muted hover:text-admin-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 subtle-scrollbar text-xs">
                {/* Event Summary Card */}
                <div className="p-4 rounded-xl bg-admin-raised/40 border border-admin-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-admin-text bg-admin-surface px-2 py-0.5 rounded border border-admin-border">
                      {selectedLog.action}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedLog.result === 'FAILED' || selectedLog.result === 'DENIED'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {selectedLog.result || 'SUCCESS'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-admin-muted block text-[10px]">Timestamp</span>
                      <span className="font-semibold text-admin-text">
                        {new Date(selectedLog.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-admin-muted block text-[10px]">Module</span>
                      <span className="font-semibold text-admin-text">{selectedLog.module || selectedLog.entityType}</span>
                    </div>
                  </div>
                </div>

                {/* Actor & Source Telemetry */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider">
                    Actor & Origin Telemetry
                  </div>
                  <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-admin-muted">Actor Name:</span>
                      <span className="font-semibold text-admin-text">{selectedLog.actorName || 'System'}</span>
                    </div>
                    {selectedLog.actorEmail && (
                      <div className="flex justify-between items-center">
                        <span className="text-admin-muted">Actor Email:</span>
                        <span className="font-mono text-admin-text">{selectedLog.actorEmail}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-admin-muted">Actor Role:</span>
                      <span className="font-semibold text-admin-text">{selectedLog.actorRole || 'System'}</span>
                    </div>
                    {selectedLog.actorId && (
                      <div className="flex justify-between items-center">
                        <span className="text-admin-muted">Actor ID:</span>
                        <span className="font-mono text-[10px] text-admin-muted">{selectedLog.actorId}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-admin-muted">IP Address:</span>
                      <span className="font-mono text-admin-text">{selectedLog.ipAddress || 'Internal Service'}</span>
                    </div>
                    {selectedLog.userAgent && (
                      <div className="pt-1 border-t border-admin-border/50">
                        <span className="text-admin-muted block text-[10px]">User Agent:</span>
                        <span className="font-mono text-[10px] text-admin-muted break-all">{selectedLog.userAgent}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Information */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider">
                    Target Entity
                  </div>
                  <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-admin-muted">Target Entity:</span>
                      <span className="font-semibold text-admin-text">{selectedLog.entityType}</span>
                    </div>
                    {selectedLog.targetName && (
                      <div className="flex justify-between items-center">
                        <span className="text-admin-muted">Target Name:</span>
                        <span className="font-semibold text-admin-text">{selectedLog.targetName}</span>
                      </div>
                    )}
                    {selectedLog.entityId && (
                      <div className="flex justify-between items-center">
                        <span className="text-admin-muted">Target ID:</span>
                        <span className="font-mono text-[10px] text-admin-muted">{selectedLog.entityId}</span>
                      </div>
                    )}
                    {selectedLog.reason && (
                      <div className="pt-1 border-t border-admin-border/50">
                        <span className="text-admin-muted block text-[10px]">Reason:</span>
                        <span className="text-admin-text font-medium">{selectedLog.reason}</span>
                      </div>
                    )}
                    {selectedLog.previousStatus && selectedLog.status && (
                      <div className="pt-1 border-t border-admin-border/50 flex items-center gap-2">
                        <span className="text-admin-muted text-[10px]">Status Transition:</span>
                        <span className="font-mono text-xs">{selectedLog.previousStatus} → <strong>{selectedLog.status}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Value Diffs / Changes */}
                {(selectedLog.beforeValue || selectedLog.afterValue) && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider">
                      Recorded State Changes
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                      {selectedLog.beforeValue && (
                        <div className="p-3 rounded-lg border border-admin-border bg-admin-raised/40 overflow-x-auto subtle-scrollbar">
                          <span className="font-sans font-bold text-admin-muted uppercase text-[9px] block mb-1">
                            Before State:
                          </span>
                          <pre>{JSON.stringify(selectedLog.beforeValue, null, 2)}</pre>
                        </div>
                      )}
                      {selectedLog.afterValue && (
                        <div className="p-3 rounded-lg border border-admin-border bg-admin-raised/40 overflow-x-auto subtle-scrollbar">
                          <span className="font-sans font-bold text-admin-muted uppercase text-[9px] block mb-1">
                            After State:
                          </span>
                          <pre>{JSON.stringify(selectedLog.afterValue, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Complete Sanitized Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider">
                      Complete Event Payload (Sanitized)
                    </div>
                    <div className="p-3 rounded-xl border border-admin-border bg-admin-surface overflow-x-auto subtle-scrollbar font-mono text-[10px]">
                      <pre className="text-admin-secondary">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Immutable Notice */}
                <div className="p-3 rounded-xl bg-zinc-500/10 border border-zinc-500/20 text-zinc-600 dark:text-zinc-400 text-[11px] flex items-center gap-2">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>
                    Audit records are strictly immutable and protected by PostgreSQL constraints. Records cannot be modified or deleted by administrators.
                  </span>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-admin-border bg-admin-surface/90 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="btn-admin-raised text-xs px-4"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

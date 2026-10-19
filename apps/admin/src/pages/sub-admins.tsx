import type { AdminSubAdmin, CreateSubAdminDto } from '@simply/api-contracts';
import { AdminPermission } from '@simply/types';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  MoreVertical,
  Lock,
  KeyRound,
  Send,
  X,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback } from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';

const ALL_PERMISSIONS: { key: AdminPermission; label: string; category: string }[] = [
  { key: AdminPermission.DASHBOARD_VIEW, label: 'Dashboard View', category: 'General' },
  { key: AdminPermission.MERCHANTS_VIEW, label: 'View Merchants', category: 'Merchants' },
  { key: AdminPermission.MERCHANTS_CONTACT, label: 'Contact Merchants', category: 'Merchants' },
  { key: AdminPermission.MERCHANTS_SUSPEND, label: 'Suspend / Reactivate Merchants', category: 'Merchants' },
  { key: AdminPermission.REVIEWS_VIEW, label: 'View Reviews & Reports', category: 'Moderation' },
  { key: AdminPermission.REVIEWS_MODERATE, label: 'Moderate Reviews', category: 'Moderation' },
  { key: AdminPermission.SUBSCRIPTIONS_VIEW, label: 'View Subscriptions', category: 'Finance' },
  { key: AdminPermission.SUBSCRIPTIONS_MANAGE, label: 'Manage Subscriptions', category: 'Finance' },
  { key: AdminPermission.PAYMENTS_VIEW, label: 'View Payments', category: 'Finance' },
  { key: AdminPermission.PAYMENTS_RECONCILE, label: 'Reconcile Payments', category: 'Finance' },
  { key: AdminPermission.USERS_VIEW, label: 'View Users', category: 'Users' },
  { key: AdminPermission.USERS_MANAGE, label: 'Manage Users', category: 'Users' },
  { key: AdminPermission.BUSINESS_VERIFICATION_VIEW as any || AdminPermission.VERIFICATION_VIEW, label: 'View Verifications', category: 'Verifications' },
  { key: AdminPermission.BUSINESS_VERIFICATION_APPROVE as any || AdminPermission.VERIFICATION_APPROVE, label: 'Approve Verifications', category: 'Verifications' },
  { key: AdminPermission.SETTINGS_VIEW, label: 'View Platform Settings', category: 'Settings' },
  { key: AdminPermission.SETTINGS_MANAGE, label: 'Modify Platform Settings', category: 'Settings' },
  { key: AdminPermission.SUB_ADMINS_MANAGE, label: 'Manage Sub Admins', category: 'Delegation' },
  { key: AdminPermission.AUDIT_LOGS_VIEW, label: 'View Audit Logs', category: 'Audit' },
];

const PRESETS: Record<string, { label: string; permissions: AdminPermission[] }> = {
  SUPPORT_ADMIN: {
    label: 'Support Admin',
    permissions: [
      AdminPermission.DASHBOARD_VIEW,
      AdminPermission.MERCHANTS_VIEW,
      AdminPermission.MERCHANTS_CONTACT,
      AdminPermission.USERS_VIEW,
    ],
  },
  FINANCE_ADMIN: {
    label: 'Finance Admin',
    permissions: [
      AdminPermission.DASHBOARD_VIEW,
      AdminPermission.PAYMENTS_VIEW,
      AdminPermission.PAYMENTS_RECONCILE,
      AdminPermission.SUBSCRIPTIONS_VIEW,
      AdminPermission.SUBSCRIPTIONS_MANAGE,
    ],
  },
  MODERATION_ADMIN: {
    label: 'Moderation Admin',
    permissions: [
      AdminPermission.DASHBOARD_VIEW,
      AdminPermission.REVIEWS_VIEW,
      AdminPermission.REVIEWS_MODERATE,
      AdminPermission.MERCHANTS_VIEW,
    ],
  },
  OPERATIONS_ADMIN: {
    label: 'Operations Admin',
    permissions: [
      AdminPermission.DASHBOARD_VIEW,
      AdminPermission.MERCHANTS_VIEW,
      AdminPermission.MERCHANTS_SUSPEND,
      AdminPermission.BUSINESS_VERIFICATION_VIEW,
      AdminPermission.BUSINESS_VERIFICATION_APPROVE,
    ],
  },
};

export default function SubAdminsPage() {
  const { api, user: currentUser } = useAdminAuth();

  const [items, setItems] = useState<AdminSubAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'INVITED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminSubAdmin | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateSubAdminDto>({
    fullName: '',
    email: '',
    phone: '',
    permissions: [...PRESETS.SUPPORT_ADMIN.permissions],
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('SUPPORT_ADMIN');

  const fetchSubAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getSubAdmins({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load sub admins list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubAdmins();
  };

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (PRESETS[presetKey]) {
      setCreateForm((prev) => ({
        ...prev,
        permissions: [...PRESETS[presetKey].permissions],
      }));
    }
  };

  const togglePermission = (perm: AdminPermission, isEditing = false) => {
    if (isEditing && editingAdmin) {
      const perms = editingAdmin.permissions.includes(perm)
        ? editingAdmin.permissions.filter((p) => p !== perm)
        : [...editingAdmin.permissions, perm];
      setEditingAdmin({ ...editingAdmin, permissions: perms });
    } else {
      setSelectedPreset('CUSTOM');
      const perms = createForm.permissions.includes(perm)
        ? createForm.permissions.filter((p) => p !== perm)
        : [...createForm.permissions, perm];
      setCreateForm({ ...createForm, permissions: perms });
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await api.admin.createSubAdmin(createForm);
      setShowCreateModal(false);
      setActionMessage({
        type: 'success',
        text: `Invitation created for ${createForm.email}. An activation link has been sent.`,
      });
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        permissions: [...PRESETS.SUPPORT_ADMIN.permissions],
      });
      fetchSubAdmins();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to create sub admin.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingAdmin) return;
    setActionLoading(true);
    try {
      await api.admin.updateSubAdmin(editingAdmin.id, {
        permissions: editingAdmin.permissions,
      });
      setEditingAdmin(null);
      setActionMessage({
        type: 'success',
        text: `Permissions updated for ${editingAdmin.fullName || editingAdmin.email}.`,
      });
      fetchSubAdmins();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to update permissions.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (admin: AdminSubAdmin) => {
    const isSuspending = admin.status === 'ACTIVE';
    const confirmText = isSuspending
      ? `Are you sure you want to suspend ${admin.fullName || admin.email}? Active sessions will be terminated immediately.`
      : `Reactivate ${admin.fullName || admin.email}?`;
    if (!window.confirm(confirmText)) return;

    setActionLoading(true);
    try {
      await api.admin.toggleSubAdminStatus(admin.id, {
        reason: isSuspending ? 'Suspended by Super Admin' : 'Reactivated by Super Admin',
      });
      setActionMessage({
        type: 'success',
        text: `${admin.fullName || admin.email} has been ${isSuspending ? 'suspended' : 'reactivated'}.`,
      });
      fetchSubAdmins();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to update account status.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSessions = async (admin: AdminSubAdmin) => {
    if (!window.confirm(`Revoke all active sessions for ${admin.fullName || admin.email}?`)) return;
    setActionLoading(true);
    try {
      const res = await api.admin.revokeSubAdminSessions(admin.id);
      setActionMessage({
        type: 'success',
        text: `Revoked ${res.revokedCount} active session(s) for ${admin.fullName || admin.email}.`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to revoke sessions.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    setActionLoading(true);
    try {
      const res = await api.admin.resendSubAdminInvite(inviteId);
      setActionMessage({
        type: 'success',
        text: res.activationLink
          ? `Invitation resent. Link: ${res.activationLink}`
          : 'Invitation resent successfully.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to resend invitation.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <AdminLayout>
      <Head>
        <title>Sub Admins — LetzShop Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-admin-text">
              Sub Admin Management
            </h1>
            <p className="text-sm text-admin-muted mt-1">
              Delegate administrative operational tasks with fine-grained access permissions and secure onboarding.
            </p>
          </div>
          {currentUser?.isSuperAdmin && (
            <button
              onClick={() => {
                setShowCreateModal(true);
                setActionMessage(null);
              }}
              className="btn-admin-primary flex items-center gap-2 text-xs self-start"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Sub Admin</span>
            </button>
          )}
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span className="flex-1">{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-admin-muted hover:text-admin-text p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="admin-panel space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-admin-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or user ID..."
                  className="admin-input w-full pl-9 text-xs"
                />
              </div>
              <button type="submit" className="btn-admin-raised text-xs px-3">
                Search
              </button>
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'ACTIVE', 'SUSPENDED', 'INVITED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-admin-soft text-admin-accent border border-admin-accent/30'
                      : 'text-admin-secondary hover:bg-admin-raised hover:text-admin-text border border-transparent'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All Admins'
                    : st === 'ACTIVE'
                    ? 'Active'
                    : st === 'SUSPENDED'
                    ? 'Suspended'
                    : 'Pending Invite'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / List */}
        <Feedback error={error || undefined} loading={loading} />

        {!loading && items.length === 0 && (
          <div className="admin-panel text-center py-12 text-admin-muted space-y-2">
            <Shield className="w-8 h-8 mx-auto text-admin-muted/60" />
            <div className="text-sm font-semibold text-admin-text">No administrators found</div>
            <p className="text-xs">Adjust your search query or status filter.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="admin-panel p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-admin-surface/80 border-b border-admin-border text-admin-muted uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Administrator</th>
                    <th className="px-4 py-3 font-semibold">Role & Status</th>
                    <th className="px-4 py-3 font-semibold">Granted Permissions</th>
                    <th className="px-4 py-3 font-semibold">Activity</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {items.map((admin) => {
                    const isSuper = admin.isSuperAdmin;
                    return (
                      <tr key={admin.id} className="hover:bg-admin-raised/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-admin-text text-sm">
                            {admin.fullName || 'Invited Administrator'}
                          </div>
                          <div className="text-admin-muted font-mono text-[11px]">
                            {admin.email || admin.phone || 'No email provided'}
                          </div>
                          <div className="text-[10px] text-admin-muted/70 font-mono mt-0.5">
                            ID: {admin.id.slice(0, 14)}…
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isSuper
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                              }`}
                            >
                              {isSuper ? 'Super Admin' : 'Sub Admin'}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                admin.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : admin.status === 'SUSPENDED'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {admin.status === 'ACTIVE'
                                ? 'Active'
                                : admin.status === 'SUSPENDED'
                                ? 'Suspended'
                                : 'Pending Invite'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 max-w-xs">
                          {isSuper ? (
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                              Unrestricted Full Access
                            </span>
                          ) : admin.permissions.length === 0 ? (
                            <span className="text-admin-muted italic text-[11px]">
                              No permissions granted
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {admin.permissions.slice(0, 3).map((p) => (
                                <span
                                  key={p}
                                  className="px-1.5 py-0.5 bg-admin-surface border border-admin-border rounded text-[10px] text-admin-secondary font-mono"
                                >
                                  {p.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {admin.permissions.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-admin-soft text-admin-accent rounded text-[10px] font-bold">
                                  +{admin.permissions.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-[11px] text-admin-muted">
                          <div>
                            Created:{' '}
                            <span className="text-admin-text">
                              {new Date(admin.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            Last login:{' '}
                            <span className="text-admin-text">
                              {admin.lastLoginAt
                                ? new Date(admin.lastLoginAt).toLocaleDateString()
                                : 'Never'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          {isSuper ? (
                            <span className="text-[11px] text-admin-muted italic">Protected</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {admin.inviteId ? (
                                <button
                                  onClick={() => handleResendInvite(admin.inviteId!)}
                                  className="btn-admin-raised text-[11px] py-1 px-2.5 flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  Resend
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingAdmin(admin)}
                                    className="btn-admin-raised text-[11px] py-1 px-2.5 flex items-center gap-1"
                                  >
                                    <KeyRound className="w-3 h-3" />
                                    Permissions
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(admin)}
                                    className={`text-[11px] py-1 px-2.5 rounded-lg font-semibold border transition-colors ${
                                      admin.status === 'ACTIVE'
                                        ? 'border-rose-500/30 text-rose-600 hover:bg-rose-500/10'
                                        : 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                                    }`}
                                  >
                                    {admin.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                                  </button>
                                  <button
                                    onClick={() => handleRevokeSessions(admin)}
                                    title="Revoke active sessions"
                                    className="p-1 rounded text-admin-muted hover:text-admin-text hover:bg-admin-raised"
                                  >
                                    <ShieldAlert className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-admin-border flex items-center justify-between text-xs text-admin-muted">
              <div>
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, total)} of {total} administrators
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="btn-admin-raised p-1.5 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-admin-text">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn-admin-raised p-1.5 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Sub Admin */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-admin-surface border border-admin-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-admin-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-admin-text">Create Delegated Administrator</h2>
                  <p className="text-xs text-admin-muted">
                    An activation invitation will be emailed. No permanent passwords are required.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-admin-muted hover:text-admin-text rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubAdmin} className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-admin-text mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.fullName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, fullName: e.target.value })
                      }
                      placeholder="e.g. Rahul Sharma"
                      className="admin-input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-admin-text mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      placeholder="rahul@letzshop.in"
                      className="admin-input w-full text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-admin-text mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={createForm.phone || ''}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, phone: e.target.value })
                      }
                      placeholder="+91 9876543210"
                      className="admin-input w-full text-xs"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="pt-2 border-t border-admin-border">
                  <label className="block text-xs font-semibold text-admin-text mb-2">
                    Permission Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(PRESETS).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleApplyPreset(key)}
                        className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                          selectedPreset === key
                            ? 'bg-admin-soft text-admin-accent border-admin-accent'
                            : 'border-admin-border text-admin-secondary hover:bg-admin-raised'
                        }`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Permissions List */}
                <div className="pt-2 border-t border-admin-border space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-admin-text">
                      Granular Delegated Permissions ({createForm.permissions.length} selected)
                    </label>
                    <span className="text-[11px] text-admin-muted font-mono">
                      Preset: {selectedPreset}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border rounded-lg bg-admin-surface/50">
                    {ALL_PERMISSIONS.map((perm) => {
                      const checked = createForm.permissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            checked
                              ? 'bg-admin-soft/40 border-admin-accent/40 text-admin-text'
                              : 'border-admin-border/50 text-admin-muted hover:bg-admin-raised'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(perm.key, false)}
                            className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                          />
                          <span className="truncate">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-admin-surface/70 border border-admin-border text-[11px] text-admin-muted space-y-1">
                  <strong>Security Note:</strong> Sub-admins cannot elevate their own permissions or manage Super Admin accounts. Permissions are cryptographically verified on every API request.
                </div>

                <div className="pt-3 border-t border-admin-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-admin-raised text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-admin-primary flex items-center gap-1.5 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {actionLoading ? 'Creating...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Permissions */}
        {editingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-admin-surface border border-admin-border rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-admin-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-admin-text">
                    Edit Permissions: {editingAdmin.fullName || editingAdmin.email}
                  </h2>
                  <p className="text-xs text-admin-muted">
                    Update fine-grained permissions for this delegated administrator.
                  </p>
                </div>
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="p-1 text-admin-muted hover:text-admin-text rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1 border rounded-lg bg-admin-surface/50">
                  {ALL_PERMISSIONS.map((perm) => {
                    const checked = editingAdmin.permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-admin-soft/40 border-admin-accent/40 text-admin-text'
                            : 'border-admin-border/50 text-admin-muted hover:bg-admin-raised'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(perm.key, true)}
                          className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                        />
                        <span className="truncate">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-admin-border">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="btn-admin-raised text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleUpdatePermissions}
                    className="btn-admin-primary flex items-center gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {actionLoading ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

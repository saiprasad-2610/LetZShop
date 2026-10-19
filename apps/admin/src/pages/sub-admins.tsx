import type { AdminSubAdmin, CreateSubAdminDto, UpdateSubAdminDto } from '@simply/api-contracts';
import { AdminPermission } from '@simply/types';
import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  Mail,
  Phone,
  Calendar,
  Clock,
  Activity,
  Check,
  Trash2,
  Power,
  RefreshCw,
  ExternalLink,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback } from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';
import { FloatingPortal } from '../components/FloatingPortal';

interface PermissionMeta {
  key: AdminPermission;
  label: string;
  category: string;
}

const ALL_PERMISSION_METAS: PermissionMeta[] = [
  // Dashboard & General
  { key: AdminPermission.DASHBOARD_VIEW, label: 'View Dashboard', category: 'General' },
  // Merchants
  { key: AdminPermission.MERCHANTS_VIEW, label: 'View Merchants', category: 'Merchants' },
  { key: AdminPermission.MERCHANTS_CONTACT, label: 'Contact Merchants', category: 'Merchants' },
  { key: AdminPermission.MERCHANTS_SUSPEND, label: 'Suspend / Reactivate Merchants', category: 'Merchants' },
  // Reviews & Moderation
  { key: AdminPermission.REVIEWS_VIEW, label: 'View Reviews & Reports', category: 'Reviews' },
  { key: AdminPermission.REVIEWS_MODERATE, label: 'Moderate Reviews', category: 'Reviews' },
  // Subscriptions & Finance
  { key: AdminPermission.SUBSCRIPTIONS_VIEW, label: 'View Subscriptions', category: 'Subscriptions' },
  { key: AdminPermission.SUBSCRIPTIONS_MANAGE, label: 'Manage Subscriptions', category: 'Subscriptions' },
  { key: AdminPermission.PAYMENTS_VIEW, label: 'View Payments', category: 'Payments' },
  { key: AdminPermission.PAYMENTS_RECONCILE, label: 'Reconcile Payments', category: 'Payments' },
  // Users
  { key: AdminPermission.USERS_VIEW, label: 'View Users', category: 'Users' },
  { key: AdminPermission.USERS_MANAGE, label: 'Manage Users', category: 'Users' },
  // Business Verification
  { key: AdminPermission.BUSINESS_VERIFICATION_VIEW, label: 'View Verifications', category: 'Business Verification' },
  { key: AdminPermission.BUSINESS_VERIFICATION_APPROVE, label: 'Approve / Reject Verifications', category: 'Business Verification' },
  // Settings
  { key: AdminPermission.SETTINGS_VIEW, label: 'View Platform Settings', category: 'Settings' },
  { key: AdminPermission.SETTINGS_MANAGE, label: 'Modify Platform Settings', category: 'Settings' },
  // Delegation
  { key: AdminPermission.SUB_ADMINS_MANAGE, label: 'Manage Sub Admins', category: 'Sub Admins' },
  // Audit
  { key: AdminPermission.AUDIT_LOGS_VIEW, label: 'View Audit Logs', category: 'Audit Logs' },
  // Future Capabilities (Themes, Orders, Analytics)
  { key: AdminPermission.THEMES_VIEW, label: 'View Themes', category: 'Themes' },
  { key: AdminPermission.THEMES_MANAGE, label: 'Manage Themes', category: 'Themes' },
  { key: AdminPermission.ANALYTICS_VIEW, label: 'View Analytics', category: 'Analytics' },
  { key: AdminPermission.ORDERS_VIEW, label: 'View Orders', category: 'Orders' },
  { key: AdminPermission.ORDERS_MANAGE, label: 'Manage Orders', category: 'Orders' },
];

const CATEGORIES = Array.from(new Set(ALL_PERMISSION_METAS.map((p) => p.category)));

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
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING_INVITE' | 'DEACTIVATED'>('ALL');
  const [permissionFilter, setPermissionFilter] = useState<string>('ALL');
  const [sortFilter, setSortFilter] = useState<'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'LAST_LOGIN'>('NEWEST');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail drawer state
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Interactive permissions modal / popover
  const [permissionsModalAdmin, setPermissionsModalAdmin] = useState<AdminSubAdmin | null>(null);

  // Create Sub Admin modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    temporaryPassword: string;
    permissions: AdminPermission[];
    forcePasswordChange: boolean;
  }>({
    fullName: '',
    email: '',
    phone: '',
    temporaryPassword: '',
    permissions: [AdminPermission.DASHBOARD_VIEW, AdminPermission.MERCHANTS_VIEW],
    forcePasswordChange: true,
  });
  const [createdCredentialsAlert, setCreatedCredentialsAlert] = useState<{
    email: string;
    tempPass: string;
  } | null>(null);

  // Edit permissions modal
  const [editAdmin, setEditAdmin] = useState<AdminSubAdmin | null>(null);
  const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([]);

  // Reset temporary password modal
  const [resetTempAdmin, setResetTempAdmin] = useState<AdminSubAdmin | null>(null);
  const [resetTempPassword, setResetTempPassword] = useState('');

  // Delete / Archive confirmation modal
  const [deleteAdmin, setDeleteAdmin] = useState<AdminSubAdmin | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Action status / banner
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Floating portal states for Action Menu and Permissions Popover
  const [actionMenuState, setActionMenuState] = useState<{
    admin: AdminSubAdmin;
    triggerEl: HTMLElement;
  } | null>(null);

  const [permsPopoverState, setPermsPopoverState] = useState<{
    admin: AdminSubAdmin;
    triggerEl: HTMLElement;
  } | null>(null);

  const loadSubAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getSubAdmins({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        permission: permissionFilter === 'ALL' ? undefined : permissionFilter,
        sort: sortFilter,
        page,
        pageSize,
      });
      setItems(res.items || (res as any).data || []);
      setTotal(res.total ?? (res.items?.length || 0));
    } catch (err: any) {
      setError(err.message || 'Failed to load platform administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubAdmins();
  }, [page, pageSize, statusFilter, permissionFilter, sortFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSubAdmins();
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = 'Adm!';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += Math.floor(10 + Math.random() * 89);
    return pass;
  };

  // Open detail drawer
  const openDetailDrawer = async (adminId: string) => {
    setSelectedAdminId(adminId);
    setDetailLoading(true);
    try {
      const data = await api.admin.getSubAdminDetail(adminId);
      setDetailData(data);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to load administrator details.',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailDrawer = () => {
    setSelectedAdminId(null);
    setDetailData(null);
  };

  // Handle Sub Admin Creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);
    try {
      const tempPass = createForm.temporaryPassword.trim() || generateSecurePassword();
      const res = await api.admin.createSubAdmin({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || undefined,
        temporaryPassword: tempPass,
        forcePasswordChange: true,
        permissions: createForm.permissions,
      });

      setCreatedCredentialsAlert({
        email: createForm.email.trim(),
        tempPass,
      });

      setActionMessage({
        type: 'success',
        text: `Sub Admin created successfully! Login details emailed to ${createForm.email}.`,
      });
      setShowCreateModal(false);
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        temporaryPassword: '',
        permissions: [AdminPermission.DASHBOARD_VIEW, AdminPermission.MERCHANTS_VIEW],
        forcePasswordChange: true,
      });
      loadSubAdmins();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to create sub administrator.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Permissions
  const handleSavePermissions = async () => {
    if (!editAdmin) return;
    setActionLoading(true);
    try {
      await api.admin.updateSubAdmin(editAdmin.id, {
        permissions: editPermissions,
      });
      setActionMessage({
        type: 'success',
        text: `Permissions for ${editAdmin.fullName} updated and enforced immediately.`,
      });
      setEditAdmin(null);
      loadSubAdmins();
      if (selectedAdminId === editAdmin.id) {
        openDetailDrawer(editAdmin.id);
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to update permissions.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Suspend / Reactivate
  const handleToggleStatus = async (admin: AdminSubAdmin) => {
    setActionLoading(true);
    try {
      const res = await api.admin.toggleSubAdminStatus(admin.id, {
        reason: admin.isActive ? 'Suspended by Super Admin' : 'Reactivated by Super Admin',
      });
      setActionMessage({
        type: 'success',
        text: res.isActive
          ? `Administrator ${admin.fullName} reactivated successfully.`
          : `Administrator ${admin.fullName} suspended. Active sessions revoked.`,
      });
      loadSubAdmins();
      if (selectedAdminId === admin.id) {
        openDetailDrawer(admin.id);
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to toggle administrator status.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset Temporary Password
  const handleResetTempPassword = async () => {
    if (!resetTempAdmin) return;
    setActionLoading(true);
    try {
      const temp = resetTempPassword.trim() || generateSecurePassword();
      await api.admin.resetSubAdminTempPassword(resetTempAdmin.id, {
        temporaryPassword: temp,
      });
      setActionMessage({
        type: 'success',
        text: `New temporary password generated and delivered to ${resetTempAdmin.email}.`,
      });
      setResetTempAdmin(null);
      setResetTempPassword('');
      loadSubAdmins();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to reset temporary password.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Revoke Sessions
  const handleRevokeSessions = async (admin: AdminSubAdmin) => {
    setActionLoading(true);
    try {
      const res = await api.admin.revokeSubAdminSessions(admin.id);
      setActionMessage({
        type: 'success',
        text: `Revoked ${res.revokedCount} active session(s) for ${admin.fullName || admin.email}. Super Admin and seller sessions untouched.`,
      });
      if (selectedAdminId === admin.id) {
        openDetailDrawer(admin.id);
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to revoke sessions.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Deactivate
  const handleDeactivate = async (admin: AdminSubAdmin) => {
    setActionLoading(true);
    try {
      await api.admin.deactivateSubAdmin(admin.id, {
        reason: 'Administrator access revoked by Super Admin',
      });
      setActionMessage({
        type: 'success',
        text: `Access permanently revoked/deactivated for ${admin.fullName}. Sessions cleared.`,
      });
      loadSubAdmins();
      if (selectedAdminId === admin.id) {
        openDetailDrawer(admin.id);
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to deactivate administrator.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteAdmin) return;
    const isInvite = deleteAdmin.id.startsWith('invite-');
    const expectedConfirm = isInvite ? 'DELETE' : deleteAdmin.email || deleteAdmin.fullName;

    if (
      deleteConfirmationInput.trim().toUpperCase() !== 'DELETE' &&
      deleteConfirmationInput.trim() !== deleteAdmin.email &&
      deleteConfirmationInput.trim() !== deleteAdmin.fullName
    ) {
      setActionMessage({
        type: 'error',
        text: `Confirmation mismatch. Please type DELETE or "${expectedConfirm}" to confirm.`,
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.admin.deleteSubAdmin(deleteAdmin.id);
      setActionMessage({
        type: 'success',
        text: res.message || 'Administrator removed/archived safely.',
      });
      setDeleteAdmin(null);
      setDeleteConfirmationInput('');
      closeDetailDrawer();
      loadSubAdmins();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to delete sub administrator.',
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
        text: res.activationUrl
          ? `Invitation resent. Link: ${res.activationUrl}`
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
        <title>Sub Admin Management — LetzShop Admin</title>
      </Head>

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-admin-text">
              Sub Admin Management
            </h1>
            <p className="text-sm text-admin-muted mt-1">
              Delegate operational authorities with granular permissions, temporary credentials, and session lifecycle control.
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
            <span className="flex-1 font-medium">{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-admin-muted hover:text-admin-text p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Temporary Credentials Banner (Shown only once after creation) */}
        {createdCredentialsAlert && (
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-admin-text text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Initial Temporary Credentials Created
              </span>
              <button
                onClick={() => setCreatedCredentialsAlert(null)}
                className="text-admin-muted hover:text-admin-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-admin-muted leading-relaxed">
              Login details have been dispatched to <strong>{createdCredentialsAlert.email}</strong>. For your immediate reference:
            </p>
            <div className="flex items-center gap-2 bg-admin-surface p-2.5 rounded-lg border border-admin-border font-mono text-[11px] select-all">
              <span>Temp Password: <strong>{createdCredentialsAlert.tempPass}</strong></span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdCredentialsAlert.tempPass);
                  setActionMessage({ type: 'success', text: 'Temporary password copied to clipboard.' });
                }}
                className="ml-auto p-1 text-admin-muted hover:text-admin-accent"
                title="Copy password"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Compact Toolbar: Search + Status + Permission + Sort + PageSize */}
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
                  placeholder="Search admin by name, email, phone..."
                  className="admin-input w-full pl-9 text-xs"
                />
              </div>
              <button type="submit" className="btn-admin-raised text-xs px-3">
                Search
              </button>
            </form>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-admin-surface border border-admin-border rounded-lg px-2 py-1">
                <span className="text-admin-muted text-[11px]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-admin-text focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="PENDING_INVITE">Pending Invite</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </div>

              {/* Permission Filter */}
              <div className="flex items-center gap-1 bg-admin-surface border border-admin-border rounded-lg px-2 py-1">
                <span className="text-admin-muted text-[11px]">Permission:</span>
                <select
                  value={permissionFilter}
                  onChange={(e) => {
                    setPermissionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-admin-text focus:outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="ALL">All Permissions</option>
                  {ALL_PERMISSION_METAS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-1 bg-admin-surface border border-admin-border rounded-lg px-2 py-1">
                <span className="text-admin-muted text-[11px]">Sort:</span>
                <select
                  value={sortFilter}
                  onChange={(e) => {
                    setSortFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-admin-text focus:outline-none cursor-pointer"
                >
                  <option value="NEWEST">Newest</option>
                  <option value="OLDEST">Oldest</option>
                  <option value="NAME_ASC">Name A–Z</option>
                  <option value="LAST_LOGIN">Last Login</option>
                </select>
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
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              <button
                onClick={() => loadSubAdmins()}
                className="btn-admin-raised p-2"
                title="Refresh list"
              >
                <RotateCw className="w-3.5 h-3.5 text-admin-muted" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback / Error */}
        <Feedback error={error || undefined} loading={loading} />

        {/* Sub Admin Table with Fixed Height, Internal Scrolling, Sticky Header */}
        {!loading && items.length === 0 && (
          <div className="admin-panel text-center py-12 text-admin-muted space-y-2">
            <Shield className="w-8 h-8 mx-auto text-admin-muted/60" />
            <div className="text-sm font-semibold text-admin-text">No administrators found</div>
            <p className="text-xs">Adjust your search query or filter options.</p>
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
                    <th className="px-4 py-3 font-semibold">Administrator</th>
                    <th className="px-4 py-3 font-semibold">Role / Status</th>
                    <th className="px-4 py-3 font-semibold">Permissions</th>
                    <th className="px-4 py-3 font-semibold">Last Login</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {items.map((admin) => {
                    const isSuper = admin.isSuperAdmin;
                    const isInvite = admin.id.startsWith('invite-');
                    const perms = admin.permissions || admin.adminPermissions || [];
                    const displayPerms = perms.slice(0, 3);
                    const remainingCount = perms.length - 3;

                    return (
                      <tr key={admin.id} className="hover:bg-admin-raised/40 transition-colors">
                        {/* 1. Administrator Cell (Name, Email, Phone) */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-admin-text text-sm">
                            {admin.fullName || (isInvite ? 'Invited Administrator' : 'Sub Admin')}
                          </div>
                          <div className="text-admin-muted font-mono text-[11px]">
                            {admin.email || '—'}
                          </div>
                          {admin.phone && (
                            <div className="text-[11px] text-admin-muted/80 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{admin.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* 2. Role / Status */}
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
                                  ? (admin as any).isDeactivated
                                    ? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {admin.status === 'ACTIVE'
                                ? 'Active'
                                : admin.status === 'SUSPENDED'
                                ? (admin as any).isDeactivated
                                  ? 'Deactivated'
                                  : 'Suspended'
                                : 'Pending Invite'}
                            </span>
                          </div>
                        </td>

                        {/* 3. Granted Permissions with Interactive "+N more" */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="flex flex-wrap gap-1 items-center">
                            {displayPerms.map((p) => (
                              <span
                                key={p}
                                className="px-2 py-0.5 rounded bg-admin-raised border border-admin-border text-[10px] text-admin-secondary font-mono"
                              >
                                {p.replace(/_/g, ' ')}
                              </span>
                            ))}

                            {remainingCount > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (permsPopoverState?.admin.id === admin.id) {
                                    setPermsPopoverState(null);
                                  } else {
                                    setPermsPopoverState({ admin, triggerEl: e.currentTarget });
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-admin-soft text-admin-accent hover:bg-admin-soft/80 border border-admin-accent/30 text-[10px] font-bold cursor-pointer transition-colors"
                                title="Click to view authorities"
                              >
                                +{remainingCount} more
                              </button>
                            ) : perms.length > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (permsPopoverState?.admin.id === admin.id) {
                                    setPermsPopoverState(null);
                                  } else {
                                    setPermsPopoverState({ admin, triggerEl: e.currentTarget });
                                  }
                                }}
                                className="text-[10px] text-admin-accent hover:underline ml-1"
                              >
                                View All
                              </button>
                            ) : (
                              <span className="text-[11px] text-admin-muted italic">None</span>
                            )}
                          </div>
                        </td>

                        {/* 4. Last Login */}
                        <td className="px-4 py-3.5 text-admin-muted text-[11px] whitespace-nowrap">
                          {admin.lastLoginAt ? (
                            <div className="flex items-center gap-1 text-admin-text">
                              <Clock className="w-3.5 h-3.5 text-admin-muted shrink-0" />
                              <span>{new Date(admin.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          ) : (
                            <span className="italic text-admin-muted">Never</span>
                          )}
                        </td>

                        {/* 5. Created */}
                        <td className="px-4 py-3.5 text-admin-muted text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-admin-muted shrink-0" />
                            <span>{new Date(admin.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </td>

                        {/* 6. Actions (⋮ Menu) */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (actionMenuState?.admin.id === admin.id) {
                                setActionMenuState(null);
                              } else {
                                setActionMenuState({ admin, triggerEl: e.currentTarget });
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-admin-raised text-admin-muted hover:text-admin-text transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
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
                Showing <strong>{items.length}</strong> of <strong>{total}</strong> administrators
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

        {/* Floating Portal: Action Menu (Outside table overflow) */}
        {actionMenuState && (
          <FloatingPortal
            isOpen={true}
            triggerEl={actionMenuState.triggerEl}
            onClose={() => setActionMenuState(null)}
            align="right"
            minWidth={208}
            className="w-52 rounded-xl bg-admin-surface border border-admin-border shadow-2xl py-1.5 text-left text-xs divide-y divide-admin-border/50"
          >
            {(() => {
              const admin = actionMenuState.admin;
              const isSuper = admin.isSuperAdmin;
              const isInvite = admin.id.startsWith('invite-');
              const perms = admin.permissions || admin.adminPermissions || [];

              return (
                <>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        const id = admin.id;
                        setActionMenuState(null);
                        openDetailDrawer(id);
                      }}
                      className="w-full px-3 py-1.5 hover:bg-admin-raised text-admin-text flex items-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5 text-admin-muted" />
                      <span>View Details</span>
                    </button>

                    {currentUser?.isSuperAdmin && !isSuper && (
                      <button
                        onClick={() => {
                          setActionMenuState(null);
                          setEditAdmin(admin);
                          setEditPermissions(perms as AdminPermission[]);
                        }}
                        className="w-full px-3 py-1.5 hover:bg-admin-raised text-admin-text flex items-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5 text-admin-muted" />
                        <span>Edit Permissions</span>
                      </button>
                    )}

                    {admin.email && (
                      <a
                        href={`mailto:${admin.email}`}
                        onClick={() => setActionMenuState(null)}
                        className="w-full px-3 py-1.5 hover:bg-admin-raised text-admin-text flex items-center gap-2"
                      >
                        <Mail className="w-3.5 h-3.5 text-admin-muted" />
                        <span>Send Message</span>
                      </a>
                    )}
                  </div>

                  {currentUser?.isSuperAdmin && !isSuper && (
                    <div className="py-1">
                      {isInvite ? (
                        <>
                          <button
                            onClick={() => {
                              const id = admin.inviteId || admin.id;
                              setActionMenuState(null);
                              handleResendInvite(id);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-admin-raised text-admin-text flex items-center gap-2"
                          >
                            <Send className="w-3.5 h-3.5 text-admin-accent" />
                            <span>Resend Invite</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuState(null);
                              setDeleteAdmin(admin);
                              setDeleteConfirmationInput('');
                            }}
                            className="w-full px-3 py-1.5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Revoke / Delete Invite</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setActionMenuState(null);
                              setResetTempAdmin(admin);
                              setResetTempPassword('');
                            }}
                            className="w-full px-3 py-1.5 hover:bg-admin-raised text-admin-text flex items-center gap-2"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                            <span>Reset Temp Password</span>
                          </button>

                          <button
                            onClick={() => {
                              setActionMenuState(null);
                              handleRevokeSessions(admin);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-admin-raised text-admin-text flex items-center gap-2"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-admin-muted" />
                            <span>Revoke Sessions</span>
                          </button>

                          {admin.status === 'ACTIVE' ? (
                            <button
                              onClick={() => {
                                setActionMenuState(null);
                                handleToggleStatus(admin);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                            >
                              <Power className="w-3.5 h-3.5 text-rose-500" />
                              <span>Suspend Access</span>
                            </button>
                          ) : admin.status === 'SUSPENDED' && !(admin as any).isDeactivated ? (
                            <button
                              onClick={() => {
                                setActionMenuState(null);
                                handleToggleStatus(admin);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Reactivate Access</span>
                            </button>
                          ) : null}

                          {!(admin as any).isDeactivated && (
                            <button
                              onClick={() => {
                                setActionMenuState(null);
                                handleDeactivate(admin);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                              <span>Deactivate / Revoke</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActionMenuState(null);
                              setDeleteAdmin(admin);
                              setDeleteConfirmationInput('');
                            }}
                            className="w-full px-3 py-1.5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete Sub Admin</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </FloatingPortal>
        )}

        {/* Floating Portal: Permissions Popover (Outside table overflow) */}
        {permsPopoverState && (
          <FloatingPortal
            isOpen={true}
            triggerEl={permsPopoverState.triggerEl}
            onClose={() => setPermsPopoverState(null)}
            align="left"
            minWidth={240}
            className="w-80 max-w-[90vw] p-3 rounded-xl bg-admin-surface border border-admin-border shadow-2xl text-xs space-y-2.5"
          >
            {(() => {
              const admin = permsPopoverState.admin;
              const perms = admin.permissions || [];
              return (
                <>
                  <div className="flex items-center justify-between pb-1.5 border-b border-admin-border">
                    <span className="font-semibold text-admin-text">
                      Authorities ({perms.length})
                    </span>
                    <button
                      onClick={() => {
                        setPermsPopoverState(null);
                        setPermissionsModalAdmin(admin);
                      }}
                      className="text-[11px] text-admin-accent hover:underline font-medium"
                    >
                      Expand All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto py-1 subtle-scrollbar">
                    {perms.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded bg-admin-raised border border-admin-border text-[10px] text-admin-secondary font-mono"
                      >
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </FloatingPortal>
        )}

        {/* ========================================================================= */}
        {/* VIEW ALL PERMISSIONS MODAL (Interactive +N More Popover) */}
        {/* ========================================================================= */}
        {permissionsModalAdmin && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-admin-surface border border-admin-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-admin-border">
                <div>
                  <h3 className="text-base font-bold text-admin-text">
                    Granted Authorities: {permissionsModalAdmin.fullName}
                  </h3>
                  <p className="text-xs text-admin-muted mt-0.5">
                    Platform permissions grouped by functional area.
                  </p>
                </div>
                <button
                  onClick={() => setPermissionsModalAdmin(null)}
                  className="p-1 rounded-lg text-admin-muted hover:text-admin-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grouped Checklist */}
              <div className="overflow-y-auto space-y-4 flex-1 pr-1 subtle-scrollbar">
                {CATEGORIES.map((category) => {
                  const catPerms = ALL_PERMISSION_METAS.filter((p) => p.category === category);
                  const adminPerms = permissionsModalAdmin.permissions || permissionsModalAdmin.adminPermissions || [];
                  return (
                    <div key={category} className="rounded-xl border border-admin-border/60 bg-admin-raised/30 p-3 space-y-2">
                      <div className="text-xs font-bold text-admin-text uppercase tracking-wider text-[11px] flex items-center justify-between">
                        <span>{category}</span>
                        <span className="text-[10px] text-admin-muted font-normal">
                          {catPerms.filter((p) => adminPerms.includes(p.key)).length} of {catPerms.length} granted
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {catPerms.map((perm) => {
                          const isGranted = adminPerms.includes(perm.key);
                          return (
                            <div
                              key={perm.key}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                                isGranted
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                  : 'bg-admin-surface/50 border-admin-border/40 text-admin-muted'
                              }`}
                            >
                              {isGranted ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 font-bold" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-admin-muted/60 shrink-0" />
                              )}
                              <span className="truncate">{perm.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-admin-border flex justify-end">
                <button
                  onClick={() => setPermissionsModalAdmin(null)}
                  className="btn-admin-raised text-xs px-4"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CREATE SUB ADMIN MODAL */}
        {/* ========================================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-admin-surface border border-admin-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-admin-border">
                <div>
                  <h3 className="text-lg font-bold text-admin-text">Create Delegated Administrator</h3>
                  <p className="text-xs text-admin-muted mt-0.5">
                    Configure initial temporary credentials and fine-grained module access.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-admin-muted hover:text-admin-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 subtle-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-xs font-semibold text-admin-secondary">
                    Full Name *
                    <input
                      type="text"
                      required
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="admin-input w-full mt-1 text-xs"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-admin-secondary">
                    Email Address *
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="subadmin@company.com"
                      className="admin-input w-full mt-1 text-xs"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-xs font-semibold text-admin-secondary">
                    Phone (Optional)
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="admin-input w-full mt-1 text-xs"
                    />
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-admin-secondary">
                      Temporary Password *
                    </label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        required
                        value={createForm.temporaryPassword}
                        onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })}
                        placeholder="Click Generate or enter password"
                        className="admin-input flex-1 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const pass = generateSecurePassword();
                          setCreateForm({ ...createForm, temporaryPassword: pass });
                        }}
                        className="btn-admin-raised text-[11px] whitespace-nowrap px-2.5 flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Force Password Change Indicator */}
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-3 flex items-start gap-2.5 text-xs text-blue-700 dark:text-blue-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                  <div>
                    <span className="font-bold">Force Password Change on First Login:</span>
                    <p className="text-[11px] text-blue-600/90 dark:text-blue-300/90 mt-0.5 leading-relaxed">
                      Required for temporary credentials. The Sub Admin will be redirected to create a new password immediately upon logging in with this temporary password.
                    </p>
                  </div>
                </div>

                {/* Role Presets */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-admin-secondary">Quick-Pick Permission Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, permissions: preset.permissions })}
                        className="px-2.5 py-1 rounded-lg bg-admin-raised border border-admin-border text-admin-text hover:border-admin-accent hover:text-admin-accent text-[11px] transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Permission Checklist */}
                <div className="space-y-3 pt-2 border-t border-admin-border">
                  <div className="flex items-center justify-between text-xs font-semibold text-admin-secondary">
                    <span>Granular Authorities:</span>
                    <span className="text-[11px] text-admin-accent">{createForm.permissions.length} selected</span>
                  </div>

                  <div className="space-y-3">
                    {CATEGORIES.map((category) => {
                      const catPerms = ALL_PERMISSION_METAS.filter((p) => p.category === category);
                      return (
                        <div key={category} className="rounded-xl border border-admin-border/60 bg-admin-raised/20 p-2.5">
                          <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider mb-2">
                            {category}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {catPerms.map((perm) => {
                              const checked = createForm.permissions.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-admin-raised/40 p-1.5 rounded-lg transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCreateForm({
                                          ...createForm,
                                          permissions: [...createForm.permissions, perm.key],
                                        });
                                      } else {
                                        setCreateForm({
                                          ...createForm,
                                          permissions: createForm.permissions.filter((k) => k !== perm.key),
                                        });
                                      }
                                    }}
                                    className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                                  />
                                  <span className="text-[11px] text-admin-text">{perm.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-admin-border flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-admin-raised text-xs px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || createForm.permissions.length === 0}
                    className="btn-admin-primary text-xs px-4 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'Creating…' : 'Create & Send Login Details'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT PERMISSIONS MODAL */}
        {/* ========================================================================= */}
        {editAdmin && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-admin-surface border border-admin-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-admin-border">
                <div>
                  <h3 className="text-base font-bold text-admin-text">
                    Edit Permissions: {editAdmin.fullName}
                  </h3>
                  <p className="text-xs text-admin-muted mt-0.5">
                    Modifications will be enforced server-side immediately and active sessions refreshed.
                  </p>
                </div>
                <button
                  onClick={() => setEditAdmin(null)}
                  className="p-1 rounded-lg text-admin-muted hover:text-admin-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Granular Permission Checklist */}
              <div className="overflow-y-auto space-y-3 flex-1 pr-1 subtle-scrollbar">
                {CATEGORIES.map((category) => {
                  const catPerms = ALL_PERMISSION_METAS.filter((p) => p.category === category);
                  return (
                    <div key={category} className="rounded-xl border border-admin-border/60 bg-admin-raised/20 p-3">
                      <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider mb-2">
                        {category}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {catPerms.map((perm) => {
                          const checked = editPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className="flex items-center gap-2 cursor-pointer hover:bg-admin-raised/40 p-1.5 rounded-lg transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditPermissions([...editPermissions, perm.key]);
                                  } else {
                                    setEditPermissions(editPermissions.filter((k) => k !== perm.key));
                                  }
                                }}
                                className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                              />
                              <span className="text-[11px] text-admin-text">{perm.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-admin-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditPermissions([])}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Revoke All Authorities
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditAdmin(null)}
                    className="btn-admin-raised text-xs px-4"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    disabled={actionLoading}
                    className="btn-admin-primary text-xs px-4"
                  >
                    {actionLoading ? 'Saving…' : 'Save & Enforce'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RESET TEMPORARY PASSWORD MODAL */}
        {/* ========================================================================= */}
        {resetTempAdmin && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-admin-surface border border-admin-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-admin-border">
                <div className="flex items-center gap-2 text-amber-500">
                  <KeyRound className="w-5 h-5" />
                  <h3 className="text-base font-bold text-admin-text">Regenerate Temp Password</h3>
                </div>
                <button
                  onClick={() => setResetTempAdmin(null)}
                  className="p-1 rounded-lg text-admin-muted hover:text-admin-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-admin-muted leading-relaxed">
                Generating a new temporary password for <strong>{resetTempAdmin.fullName || resetTempAdmin.email}</strong> will immediately invalidate previous credentials, revoke existing active sessions, and dispatch fresh login instructions via email.
              </p>

              <div>
                <label className="block text-xs font-semibold text-admin-secondary mb-1">
                  New Temporary Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resetTempPassword}
                    onChange={(e) => setResetTempPassword(e.target.value)}
                    placeholder="Auto-generated if left empty"
                    className="admin-input flex-1 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setResetTempPassword(generateSecurePassword())}
                    className="btn-admin-raised text-[11px] px-2.5"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-admin-border flex justify-end gap-2">
                <button
                  onClick={() => setResetTempAdmin(null)}
                  className="btn-admin-raised text-xs px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetTempPassword}
                  disabled={actionLoading}
                  className="btn-admin-primary text-xs px-4"
                >
                  {actionLoading ? 'Regenerating…' : 'Reset & Send Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
        {/* ========================================================================= */}
        {deleteAdmin && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-admin-surface border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-500 pb-3 border-b border-admin-border">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-admin-text">
                  {deleteAdmin.id.startsWith('invite-') ? 'Revoke & Delete Invitation' : 'Delete / Deactivate Administrator'}
                </h3>
              </div>

              <p className="text-xs text-admin-muted leading-relaxed">
                {deleteAdmin.id.startsWith('invite-') ? (
                  <>
                    Are you sure you want to delete the pending invitation for <strong>{deleteAdmin.email}</strong>? The invitation token will become permanently invalid.
                  </>
                ) : (
                  <>
                    You are removing administrator access for <strong>{deleteAdmin.fullName} ({deleteAdmin.email})</strong>.
                    <br /><br />
                    <strong>Accountability Rule:</strong> If this administrator has performed sensitive platform actions, the system will safely deactivate access and revoke sessions while preserving historical audit log attribution. If no operational history exists, it will be permanently deleted.
                  </>
                )}
              </p>

              <div>
                <label className="block text-xs font-semibold text-admin-secondary mb-1">
                  Type <strong>DELETE</strong> or administrator email to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder="DELETE"
                  className="admin-input w-full text-xs"
                />
              </div>

              <div className="pt-3 border-t border-admin-border flex justify-end gap-2">
                <button
                  onClick={() => setDeleteAdmin(null)}
                  className="btn-admin-raised text-xs px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading || !deleteConfirmationInput}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  {actionLoading ? 'Processing…' : 'Confirm Deletion'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW SUB ADMIN DETAILS SLIDE-OVER DRAWER */}
        {/* ========================================================================= */}
        {selectedAdminId && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-admin-surface border-l border-admin-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-4 border-b border-admin-border flex items-center justify-between bg-admin-surface/90">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-admin-accent" />
                  <h3 className="text-base font-bold text-admin-text">Administrator Details</h3>
                </div>
                <button
                  onClick={closeDetailDrawer}
                  className="p-1 rounded-lg text-admin-muted hover:text-admin-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 subtle-scrollbar">
                {detailLoading ? (
                  <div className="py-12 text-center text-xs text-admin-muted">
                    Loading administrator profile…
                  </div>
                ) : detailData ? (
                  <>
                    {/* Identity Card */}
                    <div className="p-4 rounded-xl bg-admin-raised/40 border border-admin-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-admin-text">{detailData.fullName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            detailData.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : detailData.status === 'SUSPENDED'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {detailData.status}
                        </span>
                      </div>
                      <div className="text-xs text-admin-muted font-mono">{detailData.email}</div>
                      {detailData.phone && (
                        <div className="text-xs text-admin-muted flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{detailData.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Operational Telemetry */}
                    <div className="space-y-2 text-xs">
                      <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider">
                        Operational Telemetry
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-lg border border-admin-border bg-admin-surface">
                          <span className="text-admin-muted text-[10px]">Created Date</span>
                          <div className="font-semibold text-admin-text mt-0.5">
                            {new Date(detailData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg border border-admin-border bg-admin-surface">
                          <span className="text-admin-muted text-[10px]">Activated At</span>
                          <div className="font-semibold text-admin-text mt-0.5">
                            {detailData.activatedAt
                              ? new Date(detailData.activatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'Pending'}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg border border-admin-border bg-admin-surface">
                          <span className="text-admin-muted text-[10px]">Last Login</span>
                          <div className="font-semibold text-admin-text mt-0.5">
                            {detailData.lastLoginAt
                              ? new Date(detailData.lastLoginAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : 'Never'}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg border border-admin-border bg-admin-surface">
                          <span className="text-admin-muted text-[10px]">Active Sessions</span>
                          <div className="font-semibold text-admin-text mt-0.5">
                            {detailData.sessions?.active ?? 0} active
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Permissions Summary */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-admin-muted uppercase tracking-wider">
                          Granted Authorities ({detailData.permissions?.length || 0})
                        </span>
                        {currentUser?.isSuperAdmin && (
                          <button
                            onClick={() => {
                              setEditAdmin(detailData);
                              setEditPermissions(detailData.permissions || []);
                            }}
                            className="text-[11px] text-admin-accent hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-admin-border bg-admin-surface max-h-36 overflow-y-auto subtle-scrollbar">
                        {detailData.permissions && detailData.permissions.length > 0 ? (
                          detailData.permissions.map((p: string) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded bg-admin-raised border border-admin-border text-[10px] font-mono text-admin-secondary"
                            >
                              {p.replace(/_/g, ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-admin-muted italic text-[11px]">No active permissions granted</span>
                        )}
                      </div>
                    </div>

                    {/* Recent Admin Actions */}
                    <div className="space-y-2 text-xs">
                      <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider">
                        Recent Operational Audit Events
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto subtle-scrollbar">
                        {detailData.recentActions && detailData.recentActions.length > 0 ? (
                          detailData.recentActions.map((act: any) => (
                            <div
                              key={act.id}
                              className="p-2 rounded-lg border border-admin-border bg-admin-surface text-[11px] flex items-center justify-between"
                            >
                              <div>
                                <span className="font-semibold text-admin-text">{act.action}</span>
                                <div className="text-[10px] text-admin-muted font-mono">{act.entityType} ({act.entityId?.slice(0, 8)})</div>
                              </div>
                              <span className="text-[10px] text-admin-muted">
                                {new Date(act.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-admin-muted italic text-[11px] border border-admin-border rounded-lg bg-admin-surface">
                            No operational actions recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Drawer Footer Actions */}
              {detailData && currentUser?.isSuperAdmin && !detailData.isSuperAdmin && (
                <div className="p-4 border-t border-admin-border bg-admin-surface/90 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setEditAdmin(detailData);
                      setEditPermissions(detailData.permissions || []);
                    }}
                    className="btn-admin-raised text-xs px-3 flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Permissions</span>
                  </button>

                  <button
                    onClick={() => handleRevokeSessions(detailData)}
                    className="btn-admin-raised text-xs px-3 flex-1 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Revoke</span>
                  </button>

                  {detailData.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleToggleStatus(detailData)}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Suspend</span>
                    </button>
                  ) : detailData.status === 'SUSPENDED' && !detailData.isDeactivated ? (
                    <button
                      onClick={() => handleToggleStatus(detailData)}
                      className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 flex-1 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Reactivate</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

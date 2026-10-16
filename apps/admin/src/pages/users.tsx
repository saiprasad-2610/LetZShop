import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  RefreshCw,
  Store,
  Mail,
  Phone,
  Calendar,
  Lock,
  ExternalLink
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getStorefrontUrl } from '../utils/config';

export default function AdminUsersPage() {
  const { api } = useAdminAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getUsers(searchTerm || undefined, selectedRole || undefined);
      setUsers(res || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleToggleStatus = async (user: any) => {
    const confirmMsg = user.isActive
      ? `Are you sure you want to deactivate ${user.fullName || user.email || 'this user'}?`
      : `Reactivate ${user.fullName || user.email || 'this user'}?`;
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(user.id);
    try {
      await api.admin.toggleUserStatus(user.id);
      await loadUsers();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Could not update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Users & Governance | LetzShop Admin</title>
      </Head>

      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Users & Governance</h1>
            <p className="text-xs text-slate-500 mt-1">
              Cross-tenant identity management, superadmins, merchant owners, and staff accounts
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh Users</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Role Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {[
              { label: 'All Roles', value: '' },
              { label: 'SuperAdmins', value: 'PLATFORM_ADMIN' },
              { label: 'Merchant Owners', value: 'SELLER_OWNER' },
              { label: 'Store Staff', value: 'SELLER_STAFF' },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedRole === r.value
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-72 relative">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block mr-2" />
              Loading platform user records...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No users found matching current criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Associated Store</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      {/* Name & Avatar */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === 'PLATFORM_ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {(u.fullName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {u.fullName || 'Unnamed User'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {u.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'PLATFORM_ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : u.role === 'SELLER_OWNER'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Associated Store */}
                      <td className="py-3 px-4">
                        {u.store ? (
                          <a
                            href={`${getStorefrontUrl()}/store/${u.store.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            <span>{u.store.name}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">None (Platform Staff)</span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        {u.role !== 'PLATFORM_ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoading === u.id}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                              u.isActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {actionLoading === u.id
                              ? 'Updating...'
                              : u.isActive
                              ? 'Suspend'
                              : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

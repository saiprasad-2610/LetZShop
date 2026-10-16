import React, { useState } from 'react';
import Head from 'next/head';
import type { AdminUser, AdminPage } from '@simply/api-contracts';
import { AdminLayout } from '../components/AdminLayout';
import {
  Feedback,
  Pagination,
  ActionModal,
  useAdminQuery,
  errorMessage,
} from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';
export default function Users() {
  const { api } = useAdminAuth();
  const [search, setSearch] = useState(''),
    [role, setRole] = useState(''),
    [status, setStatus] = useState(''),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<AdminUser | null>(null),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState('');
  const { data, loading, error, reload } = useAdminQuery<AdminPage<AdminUser>>(
    'admin/users',
    { search, role, status, page },
  );
  async function confirm() {
    if (!selected) return;
    setBusy(true);
    setActionError('');
    try {
      await api.admin.toggleUserStatus(selected.id);
      setSelected(null);
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminLayout>
      <Head>
        <title>Users — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h1 className="text-2xl font-bold">Platform Users & Governance</h1>
          <button className="admin-secondary" onClick={reload}>
            Refresh Users
          </button>
        </div>
        <div className="admin-panel flex flex-wrap gap-3">
          <input
            aria-label="Search users"
            className="admin-input min-w-0 flex-1"
            placeholder="Search name, email or phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Role"
            className="admin-input"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {['PLATFORM_ADMIN', 'SELLER_OWNER', 'SELLER_STAFF'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            aria-label="User status"
            className="admin-input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option>ACTIVE</option>
            <option>INACTIVE</option>
          </select>
        </div>
        <Feedback loading={loading} error={error} onRetry={reload} />
        {data && !loading && (
          <>
            <p className="text-sm text-admin-muted">{data.total} user(s)</p>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    {[
                      'Name',
                      'Email',
                      'Phone',
                      'Role',
                      'Store',
                      'Status',
                      'Created',
                      'Actions',
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName || 'Not provided'}</td>
                      <td>{u.email || 'Not provided'}</td>
                      <td>{u.phone || 'Not provided'}</td>
                      <td>
                        {u.role}
                        {u.isSuperAdmin && (
                          <p className="text-admin-muted">Super admin</p>
                        )}
                      </td>
                      <td>{u.store?.name || 'No associated store'}</td>
                      <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        {u.role !== 'PLATFORM_ADMIN' && !u.isSuperAdmin && (
                          <button
                            className="admin-secondary"
                            onClick={() => {
                              setSelected(u);
                              setActionError('');
                            }}
                          >
                            {u.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.items.length && (
                <p className="p-6 text-admin-muted">No users found.</p>
              )}
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={setPage}
            />
          </>
        )}
      </div>
      {selected && (
        <ActionModal
          title={selected.isActive ? 'Deactivate user' : 'Reactivate user'}
          busy={busy}
          error={actionError}
          onClose={() => setSelected(null)}
          onConfirm={() => void confirm()}
        >
          <p>Change account access for {selected.fullName || selected.id}?</p>
        </ActionModal>
      )}
    </AdminLayout>
  );
}

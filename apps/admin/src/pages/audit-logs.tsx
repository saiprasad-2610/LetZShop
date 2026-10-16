import type { AdminPage, AdminAudit } from '@simply/api-contracts';
import React, { useState } from 'react';
import Head from 'next/head';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, Pagination, useAdminQuery } from '../components/AdminUI';
export default function AuditLogs() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState('');
  const { data, loading, error } = useAdminQuery<AdminPage<AdminAudit>>(
    'admin/audit-logs',
    {
      page,
      search,
    },
  );
  return (
    <AdminLayout>
      <Head>
        <title>Audit Logs — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <label className="block max-w-lg text-sm">
          Search action, target or admin ID
          <input
            className="admin-input mt-1"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <Feedback error={error} loading={loading} />
        <div className="admin-panel overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                {[
                  'Admin / Actor',
                  'Action',
                  'Target',
                  'Date',
                  'Reason / Status',
                ].map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.actorName}
                    <span className="block text-xs text-admin-muted break-all">
                      {a.actorId}
                    </span>
                  </td>
                  <td>{a.action}</td>
                  <td>
                    {a.entityType}
                    <span className="block text-xs text-admin-muted break-all">
                      {a.entityId}
                    </span>
                  </td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="max-w-sm break-words">
                    {a.reason}
                    {a.status && (
                      <p>
                        {a.previousStatus} → {a.status}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!error && !loading && data && !data.items.length && (
            <p className="py-5 text-sm text-admin-muted">
              No audit events match.
            </p>
          )}
        </div>
        <Pagination
          page={page}
          totalPages={data?.totalPages || 1}
          onChange={setPage}
        />
      </div>
    </AdminLayout>
  );
}

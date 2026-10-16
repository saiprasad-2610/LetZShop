import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { AdminPage, AdminSubscription } from '@simply/api-contracts';
import { Feedback, Pagination, useAdminQuery } from './AdminUI';
export function SubscriptionList({ tenantId }: { tenantId?: string }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tenantId]);
  const { data, loading, error, reload } = useAdminQuery<
    AdminPage<AdminSubscription>
  >('admin/subscriptions', { tenantId, page });
  return (
    <section className="admin-panel space-y-4">
      <h2 className="text-lg font-semibold">Merchant Subscriptions</h2>
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
                    'Start',
                    'Valid through',
                    'Latest invoice',
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link
                        className="text-admin-accent underline"
                        href={'/merchants/' + s.tenant.id}
                      >
                        {s.tenant.name}
                      </Link>
                    </td>
                    <td>{s.plan.name}</td>
                    <td>
                      {s.status}
                      {s.status === 'ACTIVE' &&
                      new Date(s.currentPeriodEnd) <= new Date()
                        ? ' (expired validity)'
                        : ''}
                    </td>
                    <td>
                      {new Date(s.currentPeriodStart).toLocaleDateString()}
                    </td>
                    <td>{new Date(s.currentPeriodEnd).toLocaleDateString()}</td>
                    <td>{s.invoices?.[0]?.status || 'No invoice'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.items.length && (
            <p className="text-sm text-admin-muted">
              No subscriptions recorded.
            </p>
          )}
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={setPage}
          />
        </>
      )}
    </section>
  );
}

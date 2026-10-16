import React from 'react';
import Link from 'next/link';
import { Feedback, useAdminQuery } from './AdminUI';
export function SubscriptionList({ tenantId }: { tenantId?: string }) {
  const { data, loading, error } = useAdminQuery('admin/subscriptions', {
    tenantId,
  });
  return (
    <section className="admin-panel space-y-4 overflow-x-auto">
      <h2 className="text-lg font-semibold">Merchant Subscriptions</h2>
      <Feedback error={error} loading={loading} />
      <table className="admin-table">
        <thead>
          <tr>
            <th>Merchant</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Valid through</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((s: any) => (
            <tr key={s.id}>
              <td>
                <Link
                  className="text-emerald-800 underline"
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
              <td>{new Date(s.currentPeriodEnd).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && !data?.length && (
        <p className="text-sm text-slate-500">No subscriptions recorded.</p>
      )}
    </section>
  );
}

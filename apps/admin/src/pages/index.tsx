import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { AdminOverview, AdminRange } from '@simply/api-contracts';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminQuery, Feedback } from '../components/AdminUI';
import { AdminCharts, DateRange } from '../components/AdminCharts';
import { formatPaise } from '@simply/ui';
export default function Dashboard() {
  const [range, setRange] = useState<AdminRange>('30d');
  const { data, loading, error, reload } = useAdminQuery<AdminOverview>(
    'admin/overview',
    { range },
  );
  const k = data?.kpis;
  const cards = k
    ? Object.entries({
        'Total Merchants': k.totalMerchants,
        'Live Stores': k.liveStores,
        'Draft / Private Stores': k.privateStores,
        'Suspended Stores': k.suspendedStores,
        'Active Subscriptions': k.activeSubscriptions,
        'Total Products': k.totalProducts,
        'Total Orders': k.totalOrders,
        'Total Customers': k.totalCustomers,
        'Total Reviews': k.totalReviews,
        'Pending Review Reports': k.pendingReviewReports,
        'Subscription Revenue': formatPaise(k.subscriptionRevenuePaise),
      })
    : [];
  return (
    <AdminLayout>
      <Head>
        <title>Dashboard — LetzShop Admin</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {data && (
              <p className="mt-1 text-xs text-admin-muted">
                Last updated{' '}
                <time dateTime={data.generatedAt}>
                  {new Date(data.generatedAt).toLocaleString('en-IN', {
                    timeZone: 'UTC',
                  })}{' '}
                  UTC
                </time>
              </p>
            )}
          </div>
          <button className="admin-secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        <Feedback
          loading={loading}
          error={error ? 'Unable to load dashboard data. ' + error : ''}
          onRetry={reload}
        />
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(([label, value]) => (
                <div className="admin-panel" key={label}>
                  <p className="text-sm text-admin-muted">{label}</p>
                  <p className="mt-2 text-2xl font-bold" data-kpi={label}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <details className="admin-panel text-sm">
              <summary className="cursor-pointer font-medium">
                Metric definitions
              </summary>
              {Object.entries(data.definitions).map(([key, value]) => (
                <p className="mt-2 text-admin-secondary" key={key}>
                  {value}
                </p>
              ))}
            </details>
            <DateRange value={range} onChange={setRange} />
            <p className="text-sm text-admin-muted">
              Current totals above; charts show activity in the selected range.
              Dates use UTC.
            </p>
            <AdminCharts data={data.charts} />
            <section className="admin-panel space-y-4">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-lg font-semibold">Review Moderation</h2>
                <Link href="/reviews" className="text-admin-accent underline">
                  View All Reports
                </Link>
              </div>
              <div className="flex flex-wrap gap-5 text-sm">
                <span>
                  Pending Reports:{' '}
                  <strong>{data.reviewModeration.pendingReports}</strong>
                </span>
                <span>
                  Removed This Month:{' '}
                  <strong>{data.reviewModeration.removedThisMonth}</strong>
                </span>
                <span>
                  Resolved Reports:{' '}
                  <strong>{data.reviewModeration.resolvedReports}</strong>
                </span>
              </div>
              {data.reviewModeration.latestPendingReports.map((r) => (
                <div key={r.id} className="border-t py-3 text-sm">
                  <Link
                    href={'/reviews?search=' + encodeURIComponent(r.review.id)}
                    className="text-admin-accent underline"
                  >
                    {r.review.store.name} · {r.review.product.name}
                  </Link>
                  <p>
                    {r.reason} · {r.status.replaceAll('_', ' ')}
                  </p>
                </div>
              ))}
              {!data.reviewModeration.latestPendingReports.length && (
                <p className="text-admin-muted">No pending reports.</p>
              )}
            </section>
            <section className="admin-panel">
              <h2 className="mb-3 text-lg font-semibold">
                Recently Joined Merchants
              </h2>
              {data.recentlyJoinedMerchants.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap justify-between gap-2 border-t py-3 text-sm"
                >
                  <Link
                    className="text-admin-accent underline"
                    href={'/merchants/' + m.id}
                  >
                    {m.name}
                  </Link>
                  <time>
                    {new Date(m.createdAt).toLocaleDateString('en-IN', {
                      timeZone: 'UTC',
                    })}
                  </time>
                </div>
              ))}
              {!data.recentlyJoinedMerchants.length && (
                <p className="text-admin-muted">No merchants yet.</p>
              )}
            </section>
            <section className="admin-panel">
              <h2 className="font-semibold">Recent Orders</h2>
              {data.recentOrders.map((o) => (
                <p key={o.id} className="border-t py-3 text-sm">
                  {o.orderNumber} · {o.store.name} · {formatPaise(o.totalPaise)}{' '}
                  · {o.paymentStatus}
                </p>
              ))}
              {!data.recentOrders.length && (
                <p className="text-admin-muted">No orders yet.</p>
              )}
              <Link className="text-admin-accent underline" href="/commerce">
                View all orders
              </Link>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

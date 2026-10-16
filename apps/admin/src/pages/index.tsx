import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminQuery, Feedback } from '../components/AdminUI';
import { formatPaise } from '@simply/ui';
export default function Dashboard() {
  const { data, loading, error, reload } = useAdminQuery('admin/overview'),
    k = data?.kpis || {},
    m = data?.reviewModeration || {};
  const cards = [
    ['Total Merchants', k.totalMerchants],
    ['Live Stores', k.liveStores],
    ['Trial / Private Stores', k.privateStores],
    ['Active Subscriptions', k.activeSubscriptions],
    ['Subscription Revenue', formatPaise(k.subscriptionRevenuePaise || 0)],
    ['Total Orders', k.totalOrders],
    ['Pending Review Reports', k.pendingReviewReports],
  ];
  return (
    <AdminLayout>
      <Head>
        <title>Dashboard — LetzShop Admin</title>
      </Head>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button className="admin-secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        <Feedback loading={loading} error={error} />
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(([label, value]) => (
                <div className="admin-panel" key={label}>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold" data-kpi={label}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <section className="admin-panel space-y-4">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-lg font-semibold">Review Moderation</h2>
                <Link
                  href="/reviews"
                  className="text-sm text-emerald-800 underline"
                >
                  View All Reports
                </Link>
              </div>
              <div className="flex flex-wrap gap-5 text-sm">
                <span>
                  Pending Reports: <strong>{m.pendingReports}</strong>
                </span>
                <span>
                  Removed This Month: <strong>{m.removedThisMonth}</strong>
                </span>
                <span>
                  Resolved Reports: <strong>{m.resolvedReports}</strong>
                </span>
              </div>
              <ul className="divide-y">
                {m.latestPendingReports?.map((r: any) => (
                  <li key={r.id} className="py-3 text-sm">
                    <Link
                      href={
                        '/reviews?search=' + encodeURIComponent(r.review.id)
                      }
                      className="font-medium text-emerald-800 underline"
                    >
                      {r.review.store.name} · {r.review.product.name}
                    </Link>
                    <p className="text-slate-600">
                      {r.reason} · {r.status.replaceAll('_', ' ')}
                    </p>
                  </li>
                ))}
              </ul>
              {!m.latestPendingReports?.length && (
                <p className="text-sm text-slate-500">No pending reports.</p>
              )}
            </section>
            <section className="admin-panel">
              <h2 className="mb-3 text-lg font-semibold">
                Recently Joined Merchants
              </h2>
              <ul className="divide-y">
                {data.recentlyJoinedMerchants?.map((m: any) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                  >
                    <Link
                      className="text-emerald-800 underline"
                      href={'/merchants/' + m.id}
                    >
                      {m.name}
                    </Link>
                    <time>{new Date(m.createdAt).toLocaleDateString()}</time>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

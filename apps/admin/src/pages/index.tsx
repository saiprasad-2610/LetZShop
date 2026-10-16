import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import type { AdminOverview, AdminRange } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminQuery, Feedback } from '../components/AdminUI';
import {
  DashboardActivity,
  ActivityMetric,
} from '../components/DashboardActivity';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-admin-raised px-2 py-0.5 text-xs font-medium text-admin-secondary">
      {children}
    </span>
  );
}

function Skeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard data"
      className="animate-pulse space-y-6"
    >
      <span className="sr-only">Loading dashboard data…</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-admin-raised" />
        ))}
      </div>
      <div className="h-20 rounded-xl bg-admin-raised" />
      <div className="h-16 rounded-xl bg-admin-raised" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-80 rounded-xl bg-admin-raised" />
        <div className="h-80 rounded-xl bg-admin-raised" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-64 rounded-xl bg-admin-raised" />
        <div className="h-64 rounded-xl bg-admin-raised" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState<AdminRange>('30d'),
    [metric, setMetric] = useState<ActivityMetric>('merchants');
  const { data, loading, error, reload } = useAdminQuery<AdminOverview>(
    'admin/overview',
    { range },
  );

  const k = data?.kpis;
  const growth = data?.growth;

  const primaryCards = k
    ? [
        {
          label: 'Merchants',
          dataKpi: 'Total Merchants',
          value: k.totalMerchants.toLocaleString('en-IN'),
          growth:
            growth?.merchantsThisMonth && growth.merchantsThisMonth > 0
              ? `+${growth.merchantsThisMonth.toLocaleString('en-IN')} this month`
              : '—',
        },
        {
          label: 'Live Stores',
          dataKpi: 'Live Stores',
          value: k.liveStores.toLocaleString('en-IN'),
          growth: '—',
        },
        {
          label: 'Active Subscriptions',
          dataKpi: 'Active Subscriptions',
          value: k.activeSubscriptions.toLocaleString('en-IN'),
          growth: '—',
        },
        {
          label: 'Orders',
          dataKpi: 'Total Orders',
          value: k.totalOrders.toLocaleString('en-IN'),
          growth:
            growth?.ordersThisMonth && growth.ordersThisMonth > 0
              ? `+${growth.ordersThisMonth.toLocaleString('en-IN')} this month`
              : '—',
        },
        {
          label: 'Platform Revenue',
          dataKpi: 'Subscription Revenue',
          value: formatPaise(k.subscriptionRevenuePaise),
          growth:
            growth?.revenueThisMonthPaise && growth.revenueThisMonthPaise > 0
              ? `+${formatPaise(growth.revenueThisMonthPaise)} this month`
              : '—',
        },
        {
          label: 'Pending Reports',
          dataKpi: 'Pending Review Reports',
          value: k.pendingReviewReports.toLocaleString('en-IN'),
          growth: k.pendingReviewReports > 0 ? 'Requires action' : '—',
        },
      ]
    : [];

  const attentionItems = data
    ? [
        {
          id: 'reports',
          label: 'Review Reports',
          count: data.kpis.pendingReviewReports,
          href: '/reviews',
          urgent: data.kpis.pendingReviewReports > 0,
        },
        {
          id: 'suspended',
          label: 'Suspended Stores',
          count: data.kpis.suspendedStores,
          href: '/merchants?status=SUSPENDED',
          urgent: data.kpis.suspendedStores > 0,
        },
        {
          id: 'failed-payments',
          label: 'Failed Payments',
          count: data.attention.failedSubscriptionPayments,
          href: '/payments?status=FAILED',
          urgent: data.attention.failedSubscriptionPayments > 0,
        },
      ]
    : [];

  const hasUrgentAttention = attentionItems.some((item) => item.urgent);

  return (
    <AdminLayout>
      <Head>
        <title>Dashboard — LetzShop Admin</title>
      </Head>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
              LetzShop Admin
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-admin-text sm:text-3xl">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="text-xs text-admin-muted">
                Last updated:{' '}
                <time
                  dateTime={data.generatedAt}
                  className="font-medium text-admin-secondary"
                >
                  {new Date(data.generatedAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'UTC',
                  })}{' '}
                  UTC
                </time>
              </span>
            )}
            <button
              className="admin-secondary gap-2"
              onClick={reload}
              disabled={loading}
            >
              <RefreshCw
                className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <Feedback error="Unable to load dashboard data." onRetry={reload} />
        )}

        {loading && <Skeleton />}

        {data && !loading && !error && (
          <>
            {/* 1. Primary KPI Area (6 prominent cards) */}
            <section
              aria-label="Primary platform metrics"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
            >
              {primaryCards.map((card) => (
                <div
                  key={card.label}
                  className="flex min-h-28 flex-col justify-between rounded-xl bg-admin-surface p-4 shadow-sm ring-1 ring-admin-border"
                >
                  <p className="text-xs font-medium text-admin-muted">
                    {card.label}
                  </p>
                  <p
                    data-kpi={card.dataKpi}
                    className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-admin-text"
                  >
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs text-admin-secondary">
                    {card.growth}
                  </p>
                </div>
              ))}
            </section>

            {/* 2. Secondary Platform Stats: Compact Platform Overview */}
            <section
              aria-label="Platform Overview"
              className="rounded-xl bg-admin-surface p-4 shadow-sm ring-1 ring-admin-border sm:p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                  Platform Overview
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 divide-y divide-admin-border sm:grid-cols-3 sm:divide-y-0 sm:divide-x md:grid-cols-5">
                <div className="pt-2 sm:pt-0 sm:pr-3 first:pl-0">
                  <p className="text-xs font-medium text-admin-muted">Products</p>
                  <p
                    data-kpi="Total Products"
                    className="mt-1 text-xl font-semibold tabular-nums text-admin-text"
                  >
                    {data.kpis.totalProducts.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="pt-2 sm:pt-0 sm:px-3">
                  <p className="text-xs font-medium text-admin-muted">Customers</p>
                  <p
                    data-kpi="Total Customers"
                    className="mt-1 text-xl font-semibold tabular-nums text-admin-text"
                  >
                    {data.kpis.totalCustomers.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="pt-2 sm:pt-0 sm:px-3">
                  <p className="text-xs font-medium text-admin-muted">Reviews</p>
                  <p
                    data-kpi="Total Reviews"
                    className="mt-1 text-xl font-semibold tabular-nums text-admin-text"
                  >
                    {data.kpis.totalReviews.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="pt-2 sm:pt-0 sm:px-3">
                  <p className="text-xs font-medium text-admin-muted">Draft Stores</p>
                  <p
                    data-kpi="Draft / Private Stores"
                    className="mt-1 text-xl font-semibold tabular-nums text-admin-text"
                  >
                    {data.kpis.privateStores.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="pt-2 sm:pt-0 sm:pl-3">
                  <p className="text-xs font-medium text-admin-muted">Suspended Stores</p>
                  <p
                    data-kpi="Suspended Stores"
                    className="mt-1 text-xl font-semibold tabular-nums text-admin-text"
                  >
                    {data.kpis.suspendedStores.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Admin Attention Section */}
            <section
              aria-labelledby="needs-attention"
              className="rounded-xl bg-admin-surface p-4 shadow-sm ring-1 ring-admin-border sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="needs-attention"
                  className="flex items-center gap-2 text-sm font-semibold text-admin-text"
                >
                  {hasUrgentAttention ? (
                    <AlertTriangle
                      className="h-4 w-4 text-admin-warning"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2
                      className="h-4 w-4 text-admin-accent"
                      aria-hidden="true"
                    />
                  )}
                  Needs Attention
                </h2>
                {!hasUrgentAttention && (
                  <span className="text-xs text-admin-muted">
                    No pending review reports, suspended stores, or failed payments.
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {attentionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-label={`${item.count} ${item.label.toLowerCase()}`}
                    className={
                      'flex items-center justify-between rounded-lg border px-4 py-3 transition hover:bg-admin-raised ' +
                      (item.urgent
                        ? 'border-admin-warning/30 bg-admin-warning-soft text-admin-warning'
                        : 'border-admin-border bg-admin-surface text-admin-secondary')
                    }
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="flex items-center gap-2">
                      <strong className="text-base font-bold tabular-nums">
                        {item.count}
                      </strong>
                      <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* 4. Main Activity / Trend Section & Review Moderation */}
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <DashboardActivity
                data={data}
                range={range}
                onRange={setRange}
                metric={metric}
                onMetric={setMetric}
              />

              {/* Review Moderation */}
              <section
                className="rounded-xl bg-admin-surface p-4 shadow-sm ring-1 ring-admin-border sm:p-5"
                aria-labelledby="moderation-heading"
              >
                <div className="flex items-center justify-between gap-3 border-b border-admin-border pb-3">
                  <h2 id="moderation-heading" className="text-base font-semibold text-admin-text">
                    Review Moderation
                  </h2>
                  <Link
                    href="/reviews"
                    className="inline-flex items-center gap-1 text-xs font-medium text-admin-accent hover:underline"
                  >
                    View All
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p
                      data-review-metric="pendingOnlyReports"
                      className="text-lg font-bold tabular-nums text-admin-text"
                    >
                      {data.reviewModeration.pendingOnlyReports}
                    </p>
                    <p className="mt-1 text-xs text-admin-muted">Pending</p>
                  </div>
                  <div>
                    <p
                      data-review-metric="underReviewReports"
                      className="text-lg font-bold tabular-nums text-admin-text"
                    >
                      {data.reviewModeration.underReviewReports}
                    </p>
                    <p className="mt-1 text-xs text-admin-muted">Under Review</p>
                  </div>
                  <div>
                    <p
                      data-review-metric="resolvedThisMonth"
                      className="text-lg font-bold tabular-nums text-admin-text"
                    >
                      {data.reviewModeration.resolvedThisMonth}
                    </p>
                    <p className="mt-1 text-xs text-admin-muted">Resolved Month</p>
                  </div>
                </div>

                <div className="mt-4 border-t border-admin-border pt-3">
                  {data.reviewModeration.latestPendingReports.length > 0 ? (
                    <ul className="divide-y divide-admin-border">
                      {data.reviewModeration.latestPendingReports.slice(0, 3).map((r) => (
                        <li key={r.id} className="py-2.5">
                          <Link
                            href={'/reviews?search=' + encodeURIComponent(r.review.id)}
                            className="block text-xs font-semibold text-admin-accent hover:underline"
                          >
                            {r.review.product.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-admin-muted">
                            {r.review.store.name} · {r.reason}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-xs text-admin-muted">
                      No pending review reports.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* 5. Recent Merchants & Recent Orders */}
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Recent Merchants */}
              <section
                className="min-w-0 rounded-xl bg-admin-surface shadow-sm ring-1 ring-admin-border"
                aria-labelledby="recent-merchants"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-4 py-3.5 sm:px-5">
                  <h2 id="recent-merchants" className="text-base font-semibold text-admin-text">
                    Recent Merchants
                  </h2>
                  <Link
                    href="/merchants"
                    className="inline-flex items-center gap-1 text-xs font-medium text-admin-accent hover:underline"
                  >
                    View All Merchants
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
                {!data.recentlyJoinedMerchants.length ? (
                  <p className="p-5 text-sm text-admin-muted">No merchants yet.</p>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-admin-raised text-xs text-admin-muted">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">Merchant / Store</th>
                            <th className="px-4 py-2.5 font-medium">Plan</th>
                            <th className="px-4 py-2.5 font-medium">Status</th>
                            <th className="px-4 py-2.5 font-medium">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-admin-border">
                          {data.recentlyJoinedMerchants.map((m) => (
                            <tr key={m.id} className="hover:bg-admin-raised/50">
                              <td className="px-4 py-3">
                                <Link
                                  href={'/merchants/' + m.id}
                                  className="font-medium text-admin-accent hover:underline"
                                >
                                  {m.store?.name || m.name}
                                </Link>
                                {m.store && m.store.name !== m.name && (
                                  <p className="mt-0.5 text-xs text-admin-muted">
                                    {m.name}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-admin-secondary">
                                {m.plan || 'No subscription'}
                              </td>
                              <td className="px-4 py-3">
                                <Badge>
                                  {m.store?.status.replaceAll('_', ' ') || 'No store'}
                                </Badge>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-admin-muted">
                                {formatDate(m.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ul className="divide-y divide-admin-border px-4 md:hidden">
                      {data.recentlyJoinedMerchants.map((m) => (
                        <li className="py-3" key={m.id}>
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              className="text-sm font-medium text-admin-accent"
                              href={'/merchants/' + m.id}
                            >
                              {m.store?.name || m.name}
                            </Link>
                            <Badge>
                              {m.store?.status.replaceAll('_', ' ') || 'No store'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-admin-muted">
                            {m.plan || 'No subscription'} · Joined{' '}
                            {formatDate(m.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              {/* Recent Orders */}
              <section
                className="min-w-0 rounded-xl bg-admin-surface shadow-sm ring-1 ring-admin-border"
                aria-labelledby="recent-orders"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-4 py-3.5 sm:px-5">
                  <h2 id="recent-orders" className="text-base font-semibold text-admin-text">
                    Recent Orders
                  </h2>
                  <Link
                    href="/commerce"
                    className="inline-flex items-center gap-1 text-xs font-medium text-admin-accent hover:underline"
                  >
                    View All Orders
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
                {!data.recentOrders.length ? (
                  <p className="p-5 text-sm text-admin-muted">No recent orders yet.</p>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-admin-raised text-xs text-admin-muted">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">Order</th>
                            <th className="px-4 py-2.5 font-medium">Store</th>
                            <th className="px-4 py-2.5 font-medium">Amount</th>
                            <th className="px-4 py-2.5 font-medium">Status</th>
                            <th className="px-4 py-2.5 font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-admin-border">
                          {data.recentOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-admin-raised/50">
                              <td className="px-4 py-3 font-medium text-admin-text">
                                {o.orderNumber}
                              </td>
                              <td className="px-4 py-3 text-admin-secondary">
                                {o.store.name}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-admin-text">
                                {formatPaise(o.totalPaise)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge>{o.status.replaceAll('_', ' ')}</Badge>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-admin-muted">
                                {formatTime(o.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ul className="divide-y divide-admin-border px-4 md:hidden">
                      {data.recentOrders.map((o) => (
                        <li className="py-3" key={o.id}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-admin-text">
                                {o.orderNumber}
                              </p>
                              <p className="text-xs text-admin-muted">{o.store.name}</p>
                            </div>
                            <strong className="text-sm font-semibold tabular-nums text-admin-text">
                              {formatPaise(o.totalPaise)}
                            </strong>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-admin-muted">
                            <Badge>{o.status.replaceAll('_', ' ')}</Badge>
                            <span>{formatTime(o.createdAt)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

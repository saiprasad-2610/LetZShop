import React, { useState } from 'react';
import Head from 'next/head';
import type { AdminAnalytics, AdminRange } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, useAdminQuery } from '../components/AdminUI';
import { AdminCharts, DateRange } from '../components/AdminCharts';
export default function Analytics() {
  const [range, setRange] = useState<AdminRange>('30d');
  const { data, loading, error, reload } = useAdminQuery<AdminAnalytics>(
    'admin/analytics',
    { range },
  );
  return (
    <AdminLayout>
      <Head>
        <title>Analytics — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <DateRange value={range} onChange={setRange} />
          <button className="admin-secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        <Feedback loading={loading} error={error} onRetry={reload} />
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries({
                Orders: data.kpis.totalOrders,
                'Paid customer order GMV': formatPaise(data.kpis.totalGmvPaise),
                'Paid order average': formatPaise(
                  data.kpis.averageOrderValuePaise,
                ),
                'Subscription revenue': formatPaise(
                  data.kpis.subscriptionRevenuePaise,
                ),
              }).map(([label, value]) => (
                <section className="admin-panel" key={label}>
                  <p className="text-sm text-admin-muted">{label}</p>
                  <p className="mt-2 text-2xl font-bold" data-kpi={label}>
                    {value}
                  </p>
                </section>
              ))}
            </div>
            <p className="text-sm text-admin-muted">
              All metrics use the selected date range. GMV and average use PAID
              customer orders; subscription revenue uses successful platform
              subscription payments. Dates use UTC.
            </p>
            <AdminCharts data={data.charts} />
            <section className="admin-panel">
              <h2 className="font-semibold">Top Stores by Order Count</h2>
              {data.topStores.map((s) => (
                <p
                  key={s.id}
                  className="flex justify-between gap-3 border-t py-3 text-sm"
                >
                  <span>{s.name}</span>
                  <strong>{s.ordersCount} orders</strong>
                </p>
              ))}
              {!data.topStores.length && (
                <p className="py-4 text-admin-muted">
                  No orders in this date range.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

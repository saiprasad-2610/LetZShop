import React, { useState } from 'react';
import Head from 'next/head';
import type { AdminPage, AdminOrder, AdminRange } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, Pagination, useAdminQuery } from '../components/AdminUI';
import { DateRange } from '../components/AdminCharts';
export default function Commerce() {
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [range, setRange] = useState<AdminRange>('ALL'),
    [sort, setSort] = useState('newest');
  const { data, loading, error, reload } = useAdminQuery<AdminPage<AdminOrder>>(
    'admin/commerce',
    { search, page, range, sort },
  );
  return (
    <AdminLayout>
      <Head>
        <title>Orders — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h1 className="text-2xl font-bold">Commerce · Orders</h1>
          <button onClick={reload} className="admin-secondary">
            Refresh
          </button>
        </div>
        <div className="admin-panel flex flex-wrap gap-3">
          <input
            aria-label="Search orders"
            placeholder="Search order, store or customer"
            className="admin-input min-w-0 flex-1"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <DateRange
            value={range}
            onChange={(v) => {
              setRange(v);
              setPage(1);
            }}
          />
          <select
            aria-label="Sort orders"
            className="admin-input"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <Feedback loading={loading} error={error} onRetry={reload} />
        {data && !loading && (
          <>
            <p className="text-sm text-admin-muted">{data.total} order(s)</p>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    {[
                      'Order',
                      'Store',
                      'Customer',
                      'Amount',
                      'Method',
                      'Payment',
                      'Fulfilment / Shipment',
                      'Order status',
                      'Created',
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((o) => (
                    <tr key={o.id}>
                      <td>{o.orderNumber}</td>
                      <td>{o.store.name}</td>
                      <td>{o.customer.fullName || 'Not provided'}</td>
                      <td>
                        {formatPaise(o.totalPaise)} {o.currency}
                      </td>
                      <td>{o.paymentMethod || 'Not provided'}</td>
                      <td>{o.paymentStatus}</td>
                      <td>
                        {o.fulfillmentStatus}
                        <p>{o.shipmentStatus}</p>
                      </td>
                      <td>{o.status}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.items.length && (
                <p className="p-6 text-admin-muted">No orders found.</p>
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
    </AdminLayout>
  );
}

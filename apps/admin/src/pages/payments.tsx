import React, { useState } from 'react';
import Head from 'next/head';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, Pagination, useAdminQuery } from '../components/AdminUI';
import { formatPaise } from '@simply/ui';
export default function Payments() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState('ALL');
  const { data, loading, error } = useAdminQuery('admin/payments', {
    page,
    search,
    status,
  });
  return (
    <AdminLayout>
      <Head>
        <title>Payments — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Subscription Payments</h1>
        <div className="admin-panel flex flex-wrap gap-3">
          <label className="text-xs font-medium flex-1 min-w-40">
            Merchant search
            <input
              className="admin-input mt-1"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="text-xs font-medium">
            Payment status
            <select
              className="admin-input mt-1"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {['ALL', 'PAID', 'PENDING', 'FAILED'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <Feedback error={error} loading={loading} />
        <div className="admin-panel overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                {[
                  'Merchant',
                  'Plan',
                  'Amount',
                  'Gateway',
                  'Payment ID',
                  'Status',
                  'Date',
                ].map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((p: any) => (
                <tr key={p.id}>
                  <td>{p.invoice.tenant.name}</td>
                  <td>{p.invoice.subscription.plan.name}</td>
                  <td>{formatPaise(p.amountPaise)}</td>
                  <td>{p.paymentMethod}</td>
                  <td className="break-all">{p.providerPaymentId || p.id}</td>
                  <td>{p.status}</td>
                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !data?.items?.length && (
            <p className="py-5 text-sm text-slate-500">
              No subscription payments match.
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

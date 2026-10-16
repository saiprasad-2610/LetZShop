import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type {
  AdminPage,
  AdminMerchant,
  AdminPlan,
} from '@simply/api-contracts';
import { AdminLayout } from '../../components/AdminLayout';
import { useAdminQuery, Feedback, Pagination } from '../../components/AdminUI';
export default function Merchants() {
  const [search, setSearch] = useState(''),
    [status, setStatus] = useState('ALL'),
    [planId, setPlan] = useState(''),
    [subscriptionStatus, setSubscription] = useState('ALL'),
    [sort, setSort] = useState('newest'),
    [page, setPage] = useState(1);
  const router = useRouter();
  useEffect(() => {
    const value = router.query.status;
    if (
      typeof value === 'string' &&
      ['ALL', 'LIVE', 'TRIAL', 'SUSPENDED', 'SUBSCRIBED', 'EXPIRED'].includes(
        value,
      )
    ) {
      setStatus(value);
      setPage(1);
    }
  }, [router.query.status]);
  const { data, loading, error, reload } = useAdminQuery<
    AdminPage<AdminMerchant>
  >('admin/merchants', {
    search,
    status,
    planId,
    subscriptionStatus,
    sort,
    page,
  });
  const plans = useAdminQuery<AdminPlan[]>('admin/plans');
  return (
    <AdminLayout>
      <Head>
        <title>Merchants — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h1 className="text-2xl font-bold">Merchants</h1>
          <button className="admin-secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        <div className="admin-panel flex flex-wrap gap-3">
          <input
            aria-label="Search merchants"
            placeholder="Search business, owner, email, phone or slug"
            className="admin-input min-w-0 flex-1"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Store status"
            className="admin-input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {['ALL', 'LIVE', 'TRIAL', 'SUSPENDED', 'SUBSCRIBED', 'EXPIRED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All store statuses' : s}
                </option>
              ),
            )}
          </select>
          <select
            aria-label="Plan"
            className="admin-input"
            value={planId}
            onChange={(e) => {
              setPlan(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All plans</option>
            {plans.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Subscription status"
            className="admin-input"
            value={subscriptionStatus}
            onChange={(e) => {
              setSubscription(e.target.value);
              setPage(1);
            }}
          >
            {[
              'ALL',
              'ACTIVE',
              'TRIALING',
              'PAST_DUE',
              'EXPIRED',
              'CANCELED',
              'UNPAID',
            ].map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All subscription statuses' : s}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort merchants"
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
        <Feedback
          loading={loading}
          error={error || plans.error}
          onRetry={() => {
            reload();
            plans.reload();
          }}
        />
        {data && !loading && (
          <>
            <p className="text-sm text-admin-muted">{data.total} merchant(s)</p>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    {[
                      'Business / Store',
                      'Owner',
                      'Contact',
                      'Slug',
                      'Store / Business Status',
                      'Plan / Subscription',
                      'Created / Updated',
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <Link
                          className="text-admin-accent underline"
                          href={'/merchants/' + m.id}
                        >
                          {m.name}
                        </Link>
                        <p>{m.store?.name || 'No store'}</p>
                      </td>
                      <td>{m.owner?.fullName || 'Not provided'}</td>
                      <td>
                        {m.owner?.email || 'Not provided'}
                        <p>{m.owner?.phone || 'Not provided'}</p>
                      </td>
                      <td>{m.store?.slug || m.slug}</td>
                      <td>
                        {m.store?.status || 'No store'}
                        <p className="text-admin-muted">{m.status}</p>
                      </td>
                      <td>
                        {m.subscription?.plan.name || 'No subscription'}
                        <p>{m.subscription?.status}</p>
                      </td>
                      <td>
                        {new Date(m.createdAt).toLocaleDateString()}
                        <p className="text-admin-muted">
                          {new Date(m.updatedAt).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.items.length && (
                <p className="p-6 text-admin-muted">No merchants found.</p>
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

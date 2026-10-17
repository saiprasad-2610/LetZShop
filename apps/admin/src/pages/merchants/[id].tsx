import type { AdminMerchantDetail } from '@simply/api-contracts';
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AdminLayout } from '../../components/AdminLayout';
import {
  ActionModal,
  errorMessage,
  Feedback,
  useAdminQuery,
} from '../../components/AdminUI';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminAttention } from '../../context/AdminAttentionContext';
import { getStorefrontUrl } from '../../utils/config';
import { formatPaise } from '@simply/ui';
export default function MerchantDetail() {
  const router = useRouter(),
    { api } = useAdminAuth(),
    { refreshAttention } = useAdminAttention(),
    {
      data: m,
      loading,
      error,
      reload,
    } = useAdminQuery<AdminMerchantDetail>(
      typeof router.query.id === 'string'
        ? 'admin/merchants/' + router.query.id
        : '',
    ),
    [action, setAction] = useState(''),
    [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState('');
  return (
    <AdminLayout>
      <Head>
        <title>Merchant Details — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <Link className="text-sm text-admin-accent underline" href="/merchants">
          ← All merchants
        </Link>
        <Feedback error={error} loading={loading} />
        {m && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{m.name}</h1>
                <p className="text-sm text-admin-muted">
                  {m.status} · Joined{' '}
                  {new Date(m.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                className="admin-button"
                onClick={() => {
                  setAction(
                    m.status === 'SUSPENDED' ? 'reactivate' : 'suspend',
                  );
                  setReason('');
                  setActionError('');
                }}
              >
                {m.status === 'SUSPENDED'
                  ? 'Reactivate Store'
                  : 'Suspend Store'}
              </button>
            </div>
            <section className="admin-panel space-y-3">
              <h2 className="text-lg font-semibold">Business & Owner</h2>
              <p className="text-sm">
                Business: {m.name} · {m.slug}
              </p>
              {m.memberships
                ?.filter((x) => x.role === 'SELLER_OWNER')
                .map((x) => (
                  <p className="text-sm break-words" key={x.id}>
                    {x.user.fullName} · {x.user.email || 'No email'} ·{' '}
                    {x.user.phone}
                  </p>
                ))}
            </section>
            {m.stores?.map((s) => (
              <section className="admin-panel space-y-3" key={s.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{s.name}</h2>
                  <a
                    className="admin-secondary text-xs"
                    href={getStorefrontUrl() + '/store/' + s.slug}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Store
                  </a>
                </div>
                <p className="text-sm">Status: {s.status}</p>
                <a
                  className="text-sm text-admin-accent underline break-all"
                  href={getStorefrontUrl() + '/store/' + s.slug}
                  target="_blank"
                  rel="noreferrer"
                >
                  {getStorefrontUrl() + '/store/' + s.slug}
                </a>
                <p className="text-sm">
                  Created:{' '}
                  {s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : 'Not provided'}{' '}
                  · Customers: {s._count.customers} · Orders: {s._count.orders}{' '}
                  · Products: {s._count.products} · Reviews:{' '}
                  {s._count.productReviews} · Reported reviews (merchant):{' '}
                  {m.reportedReviewCount}
                </p>
              </section>
            ))}
            <section className="admin-panel space-y-3 overflow-x-auto">
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  Subscription History (latest 20)
                </h2>
                <Link
                  className="text-sm text-admin-accent underline"
                  href={'/billing?tenantId=' + m.id}
                >
                  View Subscription
                </Link>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>Valid through</th>
                  </tr>
                </thead>
                <tbody>
                  {m.subscriptions?.map((s) => (
                    <tr key={s.id}>
                      <td>{s.plan.name}</td>
                      <td>{s.status}</td>
                      <td>
                        {new Date(s.currentPeriodStart).toLocaleDateString()}
                      </td>
                      <td>
                        {new Date(s.currentPeriodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!m.subscriptions?.length && (
                <p className="text-sm text-admin-muted">
                  No subscription history.
                </p>
              )}
            </section>
            <section className="admin-panel space-y-3 overflow-x-auto">
              <h2 className="text-lg font-semibold">
                Invoice History (latest 20)
              </h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {m.paymentHistory?.map((i) => (
                    <tr key={i.id}>
                      <td>{i.invoiceNumber}</td>
                      <td>{formatPaise(i.amountPaise)}</td>
                      <td>{i.status}</td>
                      <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!m.paymentHistory?.length && (
                <p className="text-sm text-admin-muted">
                  No recorded invoices or payments.
                </p>
              )}
            </section>
          </>
        )}
      </div>
      {action && (
        <ActionModal
          title={action === 'suspend' ? 'Suspend Store' : 'Reactivate Store'}
          busy={busy}
          error={actionError}
          onClose={() => setAction('')}
          onConfirm={async () => {
            if (!reason.trim()) {
              setActionError('An audit reason is required.');
              return;
            }
            setBusy(true);
            try {
              if (!m) return;
              if (action === 'suspend')
                await api.admin.suspendMerchant(m.id, reason);
              else await api.admin.reactivateMerchant(m.id, reason);
              setAction('');
              reload();
              void refreshAttention();
            } catch (e: unknown) {
              setActionError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="text-sm">
            {action === 'suspend'
              ? 'Suspend storefront access for this merchant? Data and orders will be preserved.'
              : 'Reactivate this merchant? Public access still requires an active subscription and the previous live setting.'}
          </p>
          <label className="block text-sm">
            Audit reason
            <textarea
              aria-label="Audit reason"
              className="admin-input mt-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={2000}
            />
          </label>
        </ActionModal>
      )}
    </AdminLayout>
  );
}

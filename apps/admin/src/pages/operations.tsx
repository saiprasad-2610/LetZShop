import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { AdminOperations } from '@simply/api-contracts';
import { AdminLayout } from '../components/AdminLayout';
import {
  useAdminQuery,
  Feedback,
  ActionModal,
  errorMessage,
} from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';
export default function Operations() {
  const { api } = useAdminAuth();
  const { data, loading, error, reload } =
    useAdminQuery<AdminOperations>('admin/operations');
  const [action, setAction] = useState(''),
    [paymentId, setPaymentId] = useState(''),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(''),
    [message, setMessage] = useState('');
  async function confirm() {
    setBusy(true);
    setActionError('');
    try {
      if (action === 'reconcile')
        await api.request(
          'admin/operations/reconcile-payment/' + encodeURIComponent(paymentId),
          { method: 'POST' },
        );
      else
        await api.request(
          'admin/operations/retry-outbox/' + encodeURIComponent(action),
          { method: 'POST' },
        );
      setAction('');
      setMessage(
        'Backend operation completed. See Audit Logs for the recorded result.',
      );
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminLayout>
      <Head>
        <title>Operations — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h1 className="text-2xl font-bold">Platform Operations</h1>
          <button className="admin-secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        <Feedback loading={loading} error={error} onRetry={reload} />
        {message && (
          <p role="status" className="admin-panel text-sm">
            {message}
          </p>
        )}
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries({
                'Total outbox events': data.outbox.totalEvents,
                'Pending events': data.outbox.pendingEvents,
                'Failed / dead letter events': data.outbox.failedEvents,
              }).map(([label, value]) => (
                <div className="admin-panel" key={label}>
                  <p className="text-sm text-admin-muted">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
            <section className="admin-panel space-y-3">
              <h2 className="font-semibold">
                Failed Outbox Events · Latest 20
              </h2>
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Retries</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.failedOutbox.map((e) => (
                      <tr key={e.id}>
                        <td>
                          {e.eventType}
                          <p className="text-xs text-admin-muted break-all">
                            {e.id}
                          </p>
                        </td>
                        <td>{e.status}</td>
                        <td>
                          {e.retryCount} / {e.maxRetries}
                        </td>
                        <td>
                          <button
                            className="admin-secondary"
                            onClick={() => {
                              setAction(e.id);
                              setActionError('');
                            }}
                          >
                            Retry event
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!data.failedOutbox.length && (
                <p className="text-admin-muted">No failed outbox events.</p>
              )}
            </section>
          </>
        )}
        <section className="admin-panel space-y-3">
          <h2 className="font-semibold">Reconcile a Payment Order</h2>
          <p className="text-sm text-admin-secondary">
            Uses the existing gateway reconciliation service and records an
            audit event.
          </p>
          <input
            aria-label="Payment order ID"
            className="admin-input"
            placeholder="Payment order ID"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
          />
          <button
            className="admin-secondary"
            disabled={!paymentId.trim()}
            onClick={() => {
              setAction('reconcile');
              setActionError('');
            }}
          >
            Reconcile payment
          </button>
        </section>
        <Link className="text-admin-accent underline" href="/audit-logs">
          View platform audit trail
        </Link>
      </div>
      {action && (
        <ActionModal
          title={
            action === 'reconcile' ? 'Reconcile payment' : 'Retry outbox event'
          }
          busy={busy}
          error={actionError}
          onClose={() => setAction('')}
          onConfirm={() => void confirm()}
        >
          <p className="text-sm break-all">
            {action === 'reconcile'
              ? 'Reconcile ' + paymentId + ' with its payment gateway?'
              : 'Queue event ' + action + ' for another delivery attempt?'}
          </p>
        </ActionModal>
      )}
    </AdminLayout>
  );
}

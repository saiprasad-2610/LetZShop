import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AdminLayout } from '../components/AdminLayout';
import {
  ActionModal,
  Feedback,
  Pagination,
  useAdminQuery,
} from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getStorefrontUrl } from '../utils/config';
const reasons = [
  'Abusive / offensive',
  'Spam',
  'Unrelated',
  'Personal information',
  'Misleading',
  'Policy violation',
  'Other',
];
export default function Reviews() {
  const { api } = useAdminAuth(),
    router = useRouter();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState('ALL'),
    [reportStatus, setReportStatus] = useState('PENDING'),
    [storeId, setStoreId] = useState(''),
    [productId, setProductId] = useState(''),
    [rating, setRating] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [sort, setSort] = useState('newest');
  const [dialog, setDialog] = useState<{ review: any; action: string } | null>(
      null,
    ),
    [reason, setReason] = useState(''),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState('');
  useEffect(() => {
    if (typeof router.query.search === 'string') setSearch(router.query.search);
  }, [router.query.search]);
  const { data, loading, error, reload } = useAdminQuery('admin/reviews', {
      page,
      limit: 20,
      search,
      status,
      reportStatus,
      storeId,
      productId,
      rating,
      from,
      to,
      sort,
    }),
    filters = useAdminQuery('admin/reviews/filters');
  useEffect(
    () => setPage(1),
    [search, status, reportStatus, storeId, productId, rating, from, to, sort],
  );
  const open = (review: any, action: string) => {
    setDialog({ review, action });
    setReason('');
    setNote('');
    setActionError('');
  };
  const act = async () => {
    if (!dialog) return;
    if (dialog.action === 'VIEW') {
      setDialog(null);
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      const r = dialog.review,
        report = r.reports?.find((p: any) =>
          ['PENDING', 'UNDER_REVIEW'].includes(p.status),
        );
      if (dialog.action === 'REMOVE' || dialog.action === 'RESTORE') {
        if (
          dialog.action === 'REMOVE' &&
          (!reason || (reason === 'Other' && !note.trim()))
        )
          throw new Error('Choose a removal reason and explain Other.');
        await api.reviews.moderateAdminReview(r.id, {
          status: dialog.action === 'REMOVE' ? 'REMOVED' : 'ACTIVE',
          reason:
            dialog.action === 'REMOVE'
              ? reason + (note.trim() ? ': ' + note.trim() : '')
              : note.trim() || 'Restored by platform admin.',
        });
      } else {
        if (!report) throw new Error('This report is no longer open.');
        if (dialog.action === 'DISMISS' && !note.trim())
          throw new Error('Enter a dismissal reason.');
        await api.request('admin/reviews/reports/' + report.id, {
          method: 'PATCH',
          body: {
            status: dialog.action === 'DISMISS' ? 'DISMISSED' : 'UNDER_REVIEW',
            note: note.trim(),
          },
        });
      }
      setDialog(null);
      reload();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const r = dialog?.review;
  return (
    <AdminLayout>
      <Head>
        <title>Reviews & Reports — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reviews & Reports</h1>
          <button className="admin-secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Report status and review visibility are tracked separately. Reported
          reviews stay visible until removed.
        </p>
        <section className="admin-panel grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-medium">
            Search
            <input
              aria-label="Search"
              className="admin-input mt-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Review, customer, product, store or order"
            />
          </label>
          <label className="text-xs font-medium">
            Report status
            <select
              aria-label="Report status"
              className="admin-input mt-1"
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
            >
              {[
                ['ALL', 'All reports / reviews'],
                ['PENDING', 'Pending Reports'],
                ['UNDER_REVIEW', 'Under Review'],
                ['RESOLVED', 'Resolved Reports'],
                ['DISMISSED', 'Dismissed Reports'],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Review visibility
            <select
              aria-label="Review visibility"
              className="admin-input mt-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All Reviews</option>
              <option value="ACTIVE">Active Reviews</option>
              <option value="REMOVED">Removed Reviews</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Rating
            <select
              aria-label="Rating"
              className="admin-input mt-1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Merchant / Store
            <select
              aria-label="Merchant / Store"
              className="admin-input mt-1"
              value={storeId}
              onChange={(e) => {
                setStoreId(e.target.value);
                setProductId('');
              }}
            >
              <option value="">All stores</option>
              {filters.data?.stores?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Product
            <select
              aria-label="Product"
              className="admin-input mt-1"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">All products</option>
              {filters.data?.products
                ?.filter((p: any) => !storeId || p.storeId === storeId)
                .map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Review date from
            <input
              aria-label="Review date from"
              type="date"
              className="admin-input mt-1"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-xs font-medium">
            Review date to
            <input
              aria-label="Review date to"
              type="date"
              className="admin-input mt-1"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="text-xs font-medium">
            Sort
            <select
              aria-label="Sort"
              className="admin-input mt-1"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </label>
        </section>
        <Feedback loading={loading} error={error || filters.error} />
        <p className="text-sm text-slate-500">
          {data?.total || 0} matching reviews
        </p>
        {!loading && data?.items?.length === 0 && (
          <div className="admin-panel text-slate-500">
            No reviews match these filters.
          </div>
        )}
        {data?.items?.map((rev: any) => {
          const active = rev.reports?.find((p: any) =>
              ['PENDING', 'UNDER_REVIEW'].includes(p.status),
            ),
            latest = rev.reports?.[0];
          return (
            <article
              className="admin-panel space-y-3"
              key={rev.id}
              data-review-id={rev.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{rev.product.name}</h2>
                  <p className="text-xs text-slate-500">
                    {rev.store.name} · {rev.reviewerName} · {rev.rating}/5{' '}
                    {rev.verifiedPurchase ? '· Verified Purchase' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-slate-100 px-2 py-1">
                    Review: {rev.status}
                  </span>
                  {latest && (
                    <span className="rounded bg-amber-50 px-2 py-1">
                      Report: {latest.status.replaceAll('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-line text-sm">
                {rev.title && (
                  <strong>
                    {rev.title}
                    <br />
                  </strong>
                )}
                {rev.body}
              </p>
              <p className="text-xs text-slate-500">
                Order {rev.order.orderNumber} · Review{' '}
                {new Date(rev.createdAt).toLocaleString()}
              </p>
              {latest && (
                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p>
                    <strong>Report reason:</strong> {latest.reason}
                  </p>
                  {latest.merchantNote && (
                    <p className="mt-1 whitespace-pre-line">
                      <strong>Merchant note:</strong> {latest.merchantNote}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Reported {new Date(latest.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  className="admin-secondary"
                  onClick={() => open(rev, 'VIEW')}
                >
                  View Full Review
                </button>
                <a
                  className="admin-secondary"
                  target="_blank"
                  rel="noreferrer"
                  href={
                    getStorefrontUrl() +
                    '/store/' +
                    rev.store.slug +
                    '/product/' +
                    rev.product.id
                  }
                >
                  View Product
                </a>
                <a
                  className="admin-secondary"
                  target="_blank"
                  rel="noreferrer"
                  href={getStorefrontUrl() + '/store/' + rev.store.slug}
                >
                  View Store
                </a>
                <button
                  className="admin-secondary"
                  onClick={() => open(rev, 'VIEW')}
                >
                  View Order Context
                </button>
                {rev.status === 'REMOVED' ? (
                  <button
                    className="admin-button"
                    onClick={() => open(rev, 'RESTORE')}
                  >
                    Restore Review
                  </button>
                ) : (
                  <button
                    className="admin-button"
                    onClick={() => open(rev, 'REMOVE')}
                  >
                    Remove Review
                  </button>
                )}
                {active && (
                  <>
                    {active.status === 'PENDING' && (
                      <button
                        className="admin-secondary"
                        onClick={() => open(rev, 'START')}
                      >
                        Start Review
                      </button>
                    )}
                    <button
                      className="admin-secondary"
                      onClick={() => open(rev, 'DISMISS')}
                    >
                      Dismiss Report
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
        <Pagination
          page={page}
          totalPages={data?.totalPages || 1}
          onChange={setPage}
        />
      </div>
      {dialog && (
        <ActionModal
          title={
            {
              VIEW: 'Review & Order Context',
              REMOVE: 'Remove Review',
              RESTORE: 'Restore Review',
              DISMISS: 'Dismiss Report',
              START: 'Start Review',
            }[dialog.action] || 'Moderation'
          }
          busy={busy}
          error={actionError}
          onClose={() => setDialog(null)}
          onConfirm={() => void act()}
          confirmLabel={dialog.action === 'VIEW' ? 'Done' : 'Confirm'}
        >
          <div className="space-y-2 text-sm">
            <p>
              <strong>{r.product.name}</strong> · {r.store.name}
            </p>
            <p>
              {r.reviewerName} · {r.rating}/5 ·{' '}
              {r.verifiedPurchase ? 'Verified Purchase' : 'Unverified'}
            </p>
            <p className="whitespace-pre-line">{r.body}</p>
            <p>
              Order {r.order.orderNumber} · {r.order.status} · Payment{' '}
              {r.order.paymentStatus}
            </p>
            {dialog.action === 'VIEW' && (
              <>
                <p>Review visibility: {r.status}</p>
                <h3 className="font-semibold">Moderation history</h3>
                {r.moderationReason && <p>{r.moderationReason}</p>}
                {r.reports?.map((p: any) => (
                  <div className="border-t pt-2" key={p.id}>
                    <p>
                      {p.status} · {new Date(p.createdAt).toLocaleString()}
                    </p>
                    <p>{p.reason}</p>
                    <p>{p.merchantNote}</p>
                    <p>{p.adminNote}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          {dialog.action === 'REMOVE' && (
            <label className="block text-sm">
              Removal reason
              <select
                aria-label="Removal reason"
                className="admin-input mt-1"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Choose a reason</option>
                {reasons.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
          {dialog.action !== 'VIEW' && (
            <label className="block text-sm">
              {dialog.action === 'DISMISS'
                ? 'Dismissal reason'
                : 'Internal moderation note'}
              <textarea
                aria-label={
                  dialog.action === 'DISMISS'
                    ? 'Dismissal reason'
                    : 'Internal moderation note'
                }
                maxLength={1800}
                className="admin-input mt-1"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          )}
          <p className="text-xs text-slate-500">
            {dialog.action === 'REMOVE'
              ? 'Removal hides the review and excludes it from storefront ratings. The report will be resolved.'
              : dialog.action === 'DISMISS'
                ? 'The report will close. Review visibility will not change.'
                : dialog.action === 'RESTORE'
                  ? 'The review will return to the storefront. Moderation history will remain.'
                  : ''}
          </p>
        </ActionModal>
      )}
    </AdminLayout>
  );
}

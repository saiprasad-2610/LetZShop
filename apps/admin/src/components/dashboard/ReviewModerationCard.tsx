import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { AdminOverview } from '@simply/api-contracts';

interface ReviewModerationCardProps {
  moderation: AdminOverview['reviewModeration'];
}

export function ReviewModerationCard({ moderation }: ReviewModerationCardProps) {
  const hasPending = moderation.pendingReports > 0;

  return (
    <section
      className="rounded-xl bg-admin-surface p-4 sm:p-5 border border-admin-border/80 shadow-sm"
      aria-labelledby="moderation-heading"
    >
      <div className="flex items-center justify-between border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-admin-accent" aria-hidden="true" />
          <h2 id="moderation-heading" className="text-base font-semibold text-admin-text">
            Review Moderation
          </h2>
        </div>
        <Link
          href="/reviews"
          className="inline-flex items-center gap-1 text-xs font-medium text-admin-accent hover:underline"
        >
          View All
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Metric Counters */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-admin-raised/40 p-3 text-center border border-admin-border/50">
        <div>
          <p
            data-review-metric="pendingOnlyReports"
            className="text-lg font-bold tabular-nums text-amber-400"
          >
            {moderation.pendingOnlyReports}
          </p>
          <p className="mt-0.5 text-xs text-admin-muted">Pending</p>
        </div>
        <div>
          <p
            data-review-metric="underReviewReports"
            className="text-lg font-bold tabular-nums text-blue-400"
          >
            {moderation.underReviewReports}
          </p>
          <p className="mt-0.5 text-xs text-admin-muted">Under Review</p>
        </div>
        <div>
          <p
            data-review-metric="resolvedThisMonth"
            className="text-lg font-bold tabular-nums text-emerald-400"
          >
            {moderation.resolvedThisMonth}
          </p>
          <p className="mt-0.5 text-xs text-admin-muted">Resolved Month</p>
        </div>
      </div>

      {/* Latest Reports or Clean Success State */}
      <div className="mt-4 border-t border-admin-border pt-3">
        {moderation.latestPendingReports && moderation.latestPendingReports.length > 0 ? (
          <ul className="divide-y divide-admin-border/60">
            {moderation.latestPendingReports.slice(0, 3).map((r) => {
              const reviewId = r.review?.id || r.id;
              const productName = r.review?.product?.name || 'Reported Product';
              const storeName = r.review?.store?.name || 'Store';
              return (
                <li key={r.id} className="py-2.5">
                  <Link
                    href={'/reviews?search=' + encodeURIComponent(reviewId)}
                    className="group flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-admin-accent group-hover:underline truncate">
                        {productName}{' '}
                        <span className="font-normal text-admin-muted">
                          · {storeName}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-admin-muted truncate">
                        Reason:{' '}
                        <span className="text-admin-secondary">{r.reason}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                          r.status === 'UNDER_REVIEW'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {r.status.replaceAll('_', ' ')}
                      </span>
                      <time
                        dateTime={r.createdAt}
                        className="text-[11px] text-admin-muted tabular-nums"
                      >
                        {new Date(r.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })}{' '}
                        UTC
                      </time>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center gap-2 py-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>No pending review reports</span>
          </div>
        )}
      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminOverview, AdminPage, AdminMerchant } from '@simply/api-contracts';
import { useAdminQuery } from '../AdminUI';
import { StatusBadge } from './StatusBadge';

interface RecentMerchantsTableProps {
  initialMerchants?: AdminOverview['recentlyJoinedMerchants'];
  refreshTrigger?: number;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function RecentMerchantsTable({
  initialMerchants,
  refreshTrigger,
}: RecentMerchantsTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data, loading, error, reload } = useAdminQuery<AdminPage<AdminMerchant>>(
    'admin/merchants',
    {
      page,
      pageSize,
      sort: 'newest',
    },
  );

  useEffect(() => {
    if (refreshTrigger) {
      void reload();
    }
  }, [refreshTrigger, reload]);

  const items = data?.items ?? (page === 1 ? initialMerchants : []);
  const total = data?.total ?? initialMerchants?.length ?? 0;
  const totalPages = data?.totalPages || Math.max(1, Math.ceil(total / pageSize));

  return (
    <section
      className="flex h-[340px] min-w-0 flex-col rounded-xl bg-admin-surface border border-admin-border/80 shadow-sm overflow-hidden"
      aria-labelledby="recent-merchants"
    >
      {/* Header Row (Fixed) */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-admin-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-admin-accent" aria-hidden="true" />
          <h2 id="recent-merchants" className="text-base font-semibold text-admin-text">
            Recent Merchants
          </h2>
        </div>
        <Link
          href="/merchants"
          className="inline-flex items-center gap-1 text-xs font-medium text-admin-accent hover:underline"
        >
          View All Merchants
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Table Body (Internally Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!items || !items.length ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-admin-muted">
            <p>{loading ? 'Loading merchants…' : 'No merchants yet.'}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-admin-raised text-xs font-semibold text-admin-muted uppercase tracking-wider shadow-sm">
                  <tr>
                    <th className="px-4 py-2.5">Merchant / Store</th>
                    <th className="px-4 py-2.5">Plan</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/60">
                  {items.map((m: any) => {
                    const storeName = m.store?.name || m.name;
                    const planName =
                      m.subscription?.plan?.name || m.plan || 'No subscription';
                    const storeStatus = m.store?.status || 'NO STORE';
                    return (
                      <tr key={m.id} className="hover:bg-admin-raised/40 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link
                            href={'/merchants/' + m.id}
                            className="font-medium text-admin-accent hover:underline block truncate max-w-[200px]"
                          >
                            {storeName}
                          </Link>
                          {m.store && m.store.name !== m.name && (
                            <p className="mt-0.5 text-xs text-admin-muted truncate max-w-[200px]">
                              {m.name}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-admin-secondary font-medium">
                          {planName}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={storeStatus} category="store" />
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-admin-muted tabular-nums">
                          {formatDate(m.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <ul className="divide-y divide-admin-border/60 px-4 md:hidden">
              {items.map((m: any) => {
                const storeName = m.store?.name || m.name;
                const planName =
                  m.subscription?.plan?.name || m.plan || 'No subscription';
                const storeStatus = m.store?.status || 'NO STORE';
                return (
                  <li className="py-2.5" key={m.id}>
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        className="text-sm font-medium text-admin-accent hover:underline truncate"
                        href={'/merchants/' + m.id}
                      >
                        {storeName}
                      </Link>
                      <StatusBadge status={storeStatus} category="store" />
                    </div>
                    <p className="mt-1 text-xs text-admin-muted">
                      {planName} · Joined {formatDate(m.createdAt)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Pagination Footer (Fixed at Bottom) */}
      <div className="flex shrink-0 items-center justify-between border-t border-admin-border/80 bg-admin-surface px-4 py-2.5 text-xs text-admin-muted">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="inline-flex items-center gap-1 font-medium text-admin-secondary hover:text-admin-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Previous
        </button>
        <span className="tabular-nums font-medium">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="inline-flex items-center gap-1 font-medium text-admin-secondary hover:text-admin-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

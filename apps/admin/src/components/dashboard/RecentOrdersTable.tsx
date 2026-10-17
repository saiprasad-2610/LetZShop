import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminOverview, AdminPage, AdminOrder } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { useAdminQuery } from '../AdminUI';
import { StatusBadge } from './StatusBadge';

interface RecentOrdersTableProps {
  initialOrders?: AdminOverview['recentOrders'];
  refreshTrigger?: number;
}

const formatTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

export function RecentOrdersTable({
  initialOrders,
  refreshTrigger,
}: RecentOrdersTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data, loading, error, reload } = useAdminQuery<AdminPage<AdminOrder>>(
    'admin/orders',
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

  const items = data?.items ?? (page === 1 ? initialOrders : []);
  const total = data?.total ?? initialOrders?.length ?? 0;
  const totalPages = data?.totalPages || Math.max(1, Math.ceil(total / pageSize));

  return (
    <section
      className="flex h-[340px] min-w-0 flex-col rounded-xl bg-admin-surface border border-admin-border/80 shadow-sm overflow-hidden"
      aria-labelledby="recent-orders"
    >
      {/* Header Row (Fixed) */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-admin-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-admin-accent" aria-hidden="true" />
          <h2 id="recent-orders" className="text-base font-semibold text-admin-text">
            Recent Orders
          </h2>
        </div>
        <Link
          href="/commerce"
          className="inline-flex items-center gap-1 text-xs font-medium text-admin-accent hover:underline"
        >
          View All Orders
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Table Body (Internally Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar">
        {!items || !items.length ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-admin-muted">
            <p>{loading ? 'Loading orders…' : 'No recent orders yet.'}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-admin-raised text-xs font-semibold text-admin-muted uppercase tracking-wider shadow-sm">
                  <tr>
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Store</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/60">
                  {items.map((o: any) => (
                    <tr key={o.id} className="hover:bg-admin-raised/40 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-admin-text">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-admin-secondary font-medium truncate max-w-[150px]">
                        {o.store?.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-semibold tabular-nums text-admin-text">
                        {formatPaise(o.totalPaise)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={o.status} category="order" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-admin-muted tabular-nums">
                        {formatTime(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <ul className="divide-y divide-admin-border/60 px-4 md:hidden">
              {items.map((o: any) => (
                <li className="py-2.5" key={o.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-admin-text">
                        {o.orderNumber}
                      </p>
                      <p className="text-xs text-admin-muted">{o.store?.name}</p>
                    </div>
                    <strong className="text-sm font-bold tabular-nums text-admin-text">
                      {formatPaise(o.totalPaise)}
                    </strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-admin-muted">
                    <StatusBadge status={o.status} category="order" />
                    <span>{formatTime(o.createdAt)}</span>
                  </div>
                </li>
              ))}
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

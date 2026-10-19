import React from 'react';
import { Package, Users, MessageSquare, FileEdit, ShieldAlert } from 'lucide-react';

interface PlatformOverviewCardProps {
  products: number;
  customers: number;
  reviews: number;
  draftStores: number;
  suspendedStores: number;
}

export function PlatformOverviewCard({
  products,
  customers,
  reviews,
  draftStores,
  suspendedStores,
}: PlatformOverviewCardProps) {
  return (
    <section
      aria-label="Platform Overview"
      className="rounded-xl bg-admin-surface p-4 sm:p-5 border border-admin-border/80 shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-admin-border pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
          Platform Overview
        </h2>
        <span className="text-[11px] text-admin-muted">
          Secondary Catalog & Platform Metrics
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 divide-y divide-admin-border/50 sm:divide-y-0 sm:divide-x sm:divide-admin-border/50">
        {/* Products */}
        <div className="pt-2 sm:pt-0 sm:pr-3 first:pl-0 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800/60 text-slate-300">
            <Package className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-admin-muted">Products</p>
            <p
              data-kpi="Total Products"
              className="mt-1 text-xl font-bold tracking-tight tabular-nums text-admin-text"
            >
              {products.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Customers */}
        <div className="pt-2 sm:pt-0 sm:px-3 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800/60 text-slate-300">
            <Users className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-admin-muted">Customers</p>
            <p
              data-kpi="Total Customers"
              className="mt-1 text-xl font-bold tracking-tight tabular-nums text-admin-text"
            >
              {customers.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Reviews */}
        <div className="pt-2 sm:pt-0 sm:px-3 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800/60 text-slate-300">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-admin-muted">Reviews</p>
            <p
              data-kpi="Total Reviews"
              className="mt-1 text-xl font-bold tracking-tight tabular-nums text-admin-text"
            >
              {reviews.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Draft Stores */}
        <div className="pt-2 sm:pt-0 sm:px-3 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800/60 text-amber-400">
            <FileEdit className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-admin-muted">Draft Stores</p>
            <p
              data-kpi="Draft / Private Stores"
              className="mt-1 text-xl font-bold tracking-tight tabular-nums text-admin-text"
            >
              {draftStores.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Suspended Stores */}
        <div className="pt-2 sm:pt-0 sm:pl-3 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800/60 text-red-400">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-admin-muted">Suspended Stores</p>
            <p
              data-kpi="Suspended Stores"
              className="mt-1 text-xl font-bold tracking-tight tabular-nums text-admin-text"
            >
              {suspendedStores.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

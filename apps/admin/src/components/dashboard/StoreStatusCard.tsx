import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Store, CheckCircle, ShieldAlert, FileEdit } from 'lucide-react';

interface StoreStatusCardProps {
  liveStores: number;
  draftStores: number;
  suspendedStores: number;
  activeSubscriptions?: number;
}

export function StoreStatusCard({
  liveStores,
  draftStores,
  suspendedStores,
  activeSubscriptions,
}: StoreStatusCardProps) {
  const totalStores = liveStores + draftStores + suspendedStores;
  const safeTotal = Math.max(totalStores, 1);

  const livePercent = Math.round((liveStores / safeTotal) * 100);
  const draftPercent = Math.round((draftStores / safeTotal) * 100);
  const suspendedPercent = Math.round((suspendedStores / safeTotal) * 100);

  // SVG Donut calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 10;

  const liveStroke = (liveStores / safeTotal) * circumference;
  const draftStroke = (draftStores / safeTotal) * circumference;
  const suspendedStroke = (suspendedStores / safeTotal) * circumference;

  const liveOffset = 0;
  const draftOffset = -liveStroke;
  const suspendedOffset = -(liveStroke + draftStroke);

  return (
    <div className="flex h-full flex-col justify-between rounded-xl bg-admin-surface p-4 sm:p-5 border border-admin-border/80 shadow-sm">
      <div>
        <div className="flex items-center justify-between border-b border-admin-border pb-3">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-admin-accent" aria-hidden="true" />
            <h2 className="text-base font-semibold text-admin-text">Store Status</h2>
          </div>
          <Link
            href="/merchants"
            className="flex items-center gap-1 text-xs font-medium text-admin-accent hover:underline"
          >
            All Stores
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Visual Donut & Legend */}
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox="0 0 100 100"
              role="img"
              aria-label={`Store distribution: ${liveStores} Live, ${draftStores} Draft, ${suspendedStores} Suspended`}
            >
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Live Stores */}
              {liveStores > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-emerald-400 transition-all duration-300"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${liveStroke} ${circumference}`}
                  strokeDashoffset={liveOffset}
                  fill="transparent"
                />
              )}
              {/* Draft Stores */}
              {draftStores > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-amber-400 transition-all duration-300"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${draftStroke} ${circumference}`}
                  strokeDashoffset={draftOffset}
                  fill="transparent"
                />
              )}
              {/* Suspended Stores */}
              {suspendedStores > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-red-400 transition-all duration-300"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${suspendedStroke} ${circumference}`}
                  strokeDashoffset={suspendedOffset}
                  fill="transparent"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold tabular-nums text-admin-text">
                {totalStores}
              </span>
              <span className="text-[10px] text-admin-muted uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-xs">
            <Link
              href="/merchants?status=LIVE"
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-admin-raised/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-admin-secondary font-medium">Live</span>
              </div>
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className="font-bold text-admin-text">{liveStores}</span>
                <span className="text-admin-muted text-[11px]">({livePercent}%)</span>
              </div>
            </Link>

            <Link
              href="/merchants"
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-admin-raised/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-admin-secondary font-medium">Draft</span>
              </div>
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className="font-bold text-admin-text">{draftStores}</span>
                <span className="text-admin-muted text-[11px]">({draftPercent}%)</span>
              </div>
            </Link>

            <Link
              href="/merchants?status=SUSPENDED"
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-admin-raised/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="text-admin-secondary font-medium">Suspended</span>
              </div>
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className="font-bold text-admin-text">{suspendedStores}</span>
                <span className="text-admin-muted text-[11px]">({suspendedPercent}%)</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Subscription Health Summary */}
      {typeof activeSubscriptions === 'number' && (
        <div className="mt-4 border-t border-admin-border pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-admin-muted uppercase tracking-wider">
              Subscription Health
            </span>
            <Link href="/billing" className="text-admin-accent hover:underline text-[11px]">
              Manage
            </Link>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-admin-raised/40 p-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span className="text-admin-secondary">Active Subscriptions</span>
            </div>
            <strong className="font-bold tabular-nums text-admin-text">
              {activeSubscriptions}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}

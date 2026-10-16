import React, { useId, useState } from 'react';
import type { AdminOverview, AdminRange } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
export type ActivityMetric = 'merchants' | 'orders' | 'revenue';
const tabs: Array<{ id: ActivityMetric; label: string }> = [
  { id: 'merchants', label: 'Merchants' },
  { id: 'orders', label: 'Orders' },
  { id: 'revenue', label: 'Revenue' },
];
export function DashboardActivity({
  data,
  range,
  onRange,
  metric,
  onMetric,
}: {
  data: AdminOverview;
  range: AdminRange;
  onRange: (range: AdminRange) => void;
  metric: ActivityMetric;
  onMetric: (metric: ActivityMetric) => void;
}) {
  const id = useId(),
    [hovered, setHovered] = useState<number | null>(null);
  const points =
    metric === 'merchants'
      ? data.charts.merchantGrowth.map((p) => ({
          date: p.date,
          value: p.count,
        }))
      : metric === 'orders'
        ? data.charts.orderTrends.map((p) => ({ date: p.date, value: p.count }))
        : data.charts.subscriptionRevenueTrends.map((p) => ({
            date: p.date,
            value: p.amountPaise,
          }));
  const max = Math.max(...points.map((p) => p.value), 0),
    scale = Math.max(max, 1);
  const selected = points[hovered ?? points.length - 1];
  const format = (value: number) =>
    metric === 'revenue' ? formatPaise(value) : value.toLocaleString('en-IN');
  const date = (value: string) =>
    new Date(value + 'T00:00:00Z').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  const tickIndices = [
    ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ].filter((i) => i >= 0);
  return (
    <section
      className="rounded-xl bg-admin-surface p-4 shadow-sm ring-1 ring-admin-border sm:p-5"
      aria-labelledby={id}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={id} className="text-lg font-semibold">
            Platform Activity
          </h2>
          <p className="mt-1 text-sm text-admin-muted">
            Activity in the selected period · UTC
          </p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Date range</span>
          <select
            aria-label="Date range"
            className="admin-input !w-auto"
            value={range}
            onChange={(e) => {
              setHovered(null);
              onRange(e.target.value as AdminRange);
            }}
          >
            {[
              ['7d', '7 Days'],
              ['30d', '30 Days'],
              ['3m', '3 Months'],
              ['12m', '12 Months'],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        role="tablist"
        aria-label="Activity metric"
        className="mt-5 flex flex-wrap gap-1 border-b pb-3"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            id={id + '-' + tab.id}
            aria-selected={metric === tab.id}
            aria-controls={id + '-chart'}
            tabIndex={metric === tab.id ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              const next =
                (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) %
                tabs.length;
              onMetric(tabs[next].id);
              setHovered(null);
              document.getElementById(id + '-' + tabs[next].id)?.focus();
            }}
            onClick={() => {
              onMetric(tab.id);
              setHovered(null);
            }}
            className={
              'rounded-lg px-3 py-2 text-sm font-medium transition ' +
              (metric === tab.id
                ? 'bg-admin-soft text-admin-accent'
                : 'text-admin-secondary hover:bg-admin-raised')
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={id + '-chart'}
        aria-labelledby={id + '-' + metric}
        className="mt-4"
      >
        {!points.length ? (
          <div className="flex h-64 items-center justify-center text-sm text-admin-muted">
            No data for this period.
          </div>
        ) : (
          <>
            <p
              className="mb-4 min-h-6 text-sm text-admin-secondary"
              aria-live="polite"
            >
              {selected && (
                <>
                  <span className="font-medium text-admin-text">
                    {date(selected.date)}
                  </span>
                  <span className="mx-2">·</span>
                  <strong>{format(selected.value)}</strong>
                </>
              )}
            </p>
            <div
              className="flex h-48 gap-3"
              role="group"
              aria-label={tabs.find((t) => t.id === metric)?.label + ' by date'}
            >
              <div className="flex w-[4.5rem] shrink-0 flex-col justify-between text-right text-xs tabular-nums text-admin-muted">
                <span>{format(max)}</span>
                <span>{format(Math.round(max / 2))}</span>
                <span>{format(0)}</span>
              </div>
              <div className="relative flex min-w-0 flex-1 items-end justify-around gap-1 border-b border-admin-border">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col justify-between"
                >
                  <span className="border-t border-dashed" />
                  <span className="border-t border-dashed" />
                  <span />
                </div>
                {points.map((p, i) => (
                  <button
                    key={p.date}
                    type="button"
                    data-activity-date={p.date}
                    data-activity-value={p.value}
                    aria-label={date(p.date) + ': ' + format(p.value)}
                    title={date(p.date) + ': ' + format(p.value)}
                    onMouseEnter={() => setHovered(i)}
                    onFocus={() => setHovered(i)}
                    className="relative z-10 flex h-full min-w-0 max-w-12 flex-1 items-end rounded-t outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-admin-accent"
                  >
                    <span
                      className={
                        'w-full rounded-t transition-colors ' +
                        (hovered === i ? 'bg-admin-primary' : 'bg-admin-accent')
                      }
                      style={{ height: (p.value / scale) * 100 + '%' }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="ml-[5.25rem] mt-3 flex justify-between gap-1 text-xs text-admin-muted">
              {tickIndices.map((i) => (
                <time key={points[i].date} dateTime={points[i].date}>
                  {date(points[i].date)}
                </time>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

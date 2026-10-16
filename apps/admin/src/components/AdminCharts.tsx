import React from 'react';
import type { AdminCharts as Charts, AdminRange } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
export function DateRange({
  value,
  onChange,
}: {
  value: AdminRange;
  onChange: (value: AdminRange) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      Date range
      <select
        aria-label="Date range"
        className="admin-input"
        value={value}
        onChange={(e) => onChange(e.target.value as AdminRange)}
      >
        {[
          ['7d', '7 days'],
          ['30d', '30 days'],
          ['3m', '3 months'],
          ['6m', '6 months'],
          ['12m', '12 months'],
          ['ALL', 'All time'],
        ].map(([v, label]) => (
          <option value={v} key={v}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
function Chart({
  title,
  points,
  money = false,
}: {
  title: string;
  points: Array<{ date: string; value: number }>;
  money?: boolean;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <section className="admin-panel min-w-0">
      <h2 className="font-semibold">{title}</h2>
      {!points.length ? (
        <p className="py-8 text-sm text-admin-muted">
          No activity in this date range.
        </p>
      ) : (
        <div
          className="mt-4 max-h-64 space-y-3 overflow-y-auto"
          role="img"
          aria-label={title + ' by date'}
        >
          {points.map((p) => (
            <div
              key={p.date}
              className="grid grid-cols-[5.5rem_1fr_5rem] items-center gap-2 text-xs"
            >
              <time className="text-admin-secondary">{p.date}</time>
              <div className="h-3 overflow-hidden rounded bg-admin-raised">
                <div
                  title={
                    p.date + ': ' + (money ? formatPaise(p.value) : p.value)
                  }
                  className="h-full rounded bg-admin-accent"
                  style={{ width: (p.value / max) * 100 + '%' }}
                />
              </div>
              <span className="text-right tabular-nums">
                {money ? formatPaise(p.value) : p.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
export function AdminCharts({ data }: { data: Charts }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Chart
        title="Merchant growth"
        points={data.merchantGrowth.map((p) => ({
          date: p.date,
          value: p.count,
        }))}
      />
      <Chart
        title="Subscription revenue"
        money
        points={data.subscriptionRevenueTrends.map((p) => ({
          date: p.date,
          value: p.amountPaise,
        }))}
      />
      <Chart
        title="Orders created"
        points={data.orderTrends.map((p) => ({ date: p.date, value: p.count }))}
      />
      <Chart
        title="Review reports created"
        points={data.reportTrends.map((p) => ({
          date: p.date,
          value: p.count,
        }))}
      />
      <Chart
        title="Review reports resolved"
        points={data.reportTrends
          .filter((p) => p.resolved > 0)
          .map((p) => ({ date: p.date, value: p.resolved }))}
      />
    </div>
  );
}

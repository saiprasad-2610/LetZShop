import React, { useId, useState } from 'react';
import type { AdminOverview, AdminRange } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';

export type ActivityMetric = 'merchants' | 'orders' | 'revenue';

const tabs: Array<{ id: ActivityMetric; label: string; description: string }> = [
  { id: 'orders', label: 'Orders', description: 'Customer order volume over time' },
  { id: 'revenue', label: 'Revenue', description: 'Subscription revenue collected' },
  { id: 'merchants', label: 'Merchants', description: 'New merchant registrations' },
];

interface PlatformActivityChartProps {
  data: AdminOverview;
  range: AdminRange;
  onRange: (range: AdminRange) => void;
  metric: ActivityMetric;
  onMetric: (metric: ActivityMetric) => void;
  customFrom?: string;
  customTo?: string;
  onApplyCustom?: (from: string, to: string) => void;
  onResetCustom?: () => void;
}

export function PlatformActivityChart({
  data,
  range,
  onRange,
  metric,
  onMetric,
  customFrom: initialFrom = '',
  customTo: initialTo = '',
  onApplyCustom,
  onResetCustom,
}: PlatformActivityChartProps) {
  const id = useId();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [customFrom, setCustomFrom] = useState(initialFrom);
  const [customTo, setCustomTo] = useState(initialTo);
  const [customError, setCustomError] = useState('');

  const handleApply = () => {
    if (!customFrom) {
      setCustomError('From date is required.');
      return;
    }
    if (!customTo) {
      setCustomError('To date is required.');
      return;
    }
    if (customFrom > customTo) {
      setCustomError('From date must be on or before To date.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (customFrom > today || customTo > today) {
      setCustomError('Dates cannot be in the future.');
      return;
    }
    setCustomError('');
    onApplyCustom?.(customFrom, customTo);
  };

  const handleReset = () => {
    setCustomFrom('');
    setCustomTo('');
    setCustomError('');
    onResetCustom?.();
  };

  const points =
    metric === 'merchants'
      ? data.charts.merchantGrowth.map((p) => ({
          date: p.date,
          value: p.count,
        }))
      : metric === 'orders'
      ? data.charts.orderTrends.map((p) => ({
          date: p.date,
          value: p.count,
        }))
      : data.charts.subscriptionRevenueTrends.map((p) => ({
          date: p.date,
          value: p.amountPaise,
        }));

  const maxVal = Math.max(...points.map((p) => p.value), 0);
  const scale = Math.max(maxVal, 1);

  const selectedPoint = points[hoveredIndex ?? points.length - 1];

  const formatValue = (value: number) =>
    metric === 'revenue' ? formatPaise(value) : value.toLocaleString('en-IN');

  const formatDate = (val: string) =>
    new Date(val + 'T00:00:00Z').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });

  const tickIndices = [
    ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ].filter((i) => i >= 0 && i < points.length);

  // SVG Line Path calculation for continuous line chart (Orders & Revenue)
  const isLineChart = metric === 'orders' || metric === 'revenue';
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 16;
  const paddingY = 16;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const lineCoordinates = points.map((p, idx) => {
    const x =
      points.length === 1
        ? paddingX + chartW / 2
        : paddingX + (idx / (points.length - 1)) * chartW;
    const y = paddingY + chartH - (p.value / scale) * chartH;
    return { x, y, ...p };
  });

  const pathD = lineCoordinates.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD =
    lineCoordinates.length > 0
      ? `${pathD} L ${lineCoordinates[lineCoordinates.length - 1].x} ${
          paddingY + chartH
        } L ${lineCoordinates[0].x} ${paddingY + chartH} Z`
      : '';

  return (
    <section
      className="rounded-xl bg-admin-surface p-4 sm:p-5 border border-admin-border/80 shadow-sm"
      aria-labelledby={id}
    >
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border pb-3">
        <div>
          <h2 id={id} className="text-base font-semibold text-admin-text">
            Platform Activity
          </h2>
          <p className="mt-0.5 text-xs text-admin-muted">
            {tabs.find((t) => t.id === metric)?.description} · UTC
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-admin-raised p-0.5 border border-admin-border text-xs">
            {[
              ['7d', '7D'],
              ['30d', '30D'],
              ['90d', '90D'],
              ['custom', 'Custom'],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setHoveredIndex(null);
                  onRange(val as AdminRange);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  range === val || (val === '90d' && range === '3m')
                    ? 'bg-admin-surface text-admin-accent shadow-sm'
                    : 'text-admin-muted hover:text-admin-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="sr-only">
            <span>Date range</span>
            <select
              aria-label="Date range"
              value={range}
              onChange={(e) => {
                setHoveredIndex(null);
                onRange(e.target.value as AdminRange);
              }}
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="3m">90 Days</option>
              <option value="custom">Custom</option>
              <option value="12m">12 Months</option>
            </select>
          </label>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {range === 'custom' && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-admin-raised/60 p-3 border border-admin-border text-xs">
          <label className="flex items-center gap-1.5 font-medium text-admin-secondary">
            <span>From:</span>
            <input
              type="date"
              aria-label="From date"
              className="admin-input !w-auto text-xs py-1 px-2.5 bg-admin-surface border-admin-border text-admin-text"
              value={customFrom}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setCustomError('');
              }}
            />
          </label>
          <label className="flex items-center gap-1.5 font-medium text-admin-secondary">
            <span>To:</span>
            <input
              type="date"
              aria-label="To date"
              className="admin-input !w-auto text-xs py-1 px-2.5 bg-admin-surface border-admin-border text-admin-text"
              value={customTo}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setCustomError('');
              }}
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="admin-primary text-xs py-1 px-3 font-semibold"
              onClick={handleApply}
            >
              Apply
            </button>
            <button
              type="button"
              className="admin-secondary text-xs py-1 px-2.5 font-medium"
              onClick={handleReset}
            >
              Clear/Reset
            </button>
          </div>
          {customError && (
            <span role="alert" className="text-xs font-semibold text-rose-400">
              {customError}
            </span>
          )}
        </div>
      )}

      {/* Metric Tabs */}
      <div
        role="tablist"
        aria-label="Activity metric"
        className="mt-4 flex flex-wrap gap-1 border-b border-admin-border pb-3"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            id={`${id}-${tab.id}`}
            aria-selected={metric === tab.id}
            aria-controls={`${id}-chart`}
            tabIndex={metric === tab.id ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              const next =
                (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) %
                tabs.length;
              onMetric(tabs[next].id);
              setHoveredIndex(null);
              document.getElementById(`${id}-${tabs[next].id}`)?.focus();
            }}
            onClick={() => {
              onMetric(tab.id);
              setHoveredIndex(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              metric === tab.id
                ? 'bg-admin-soft text-admin-accent border border-admin-accent/30 font-semibold'
                : 'text-admin-secondary hover:bg-admin-raised hover:text-admin-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Canvas Area */}
      <div
        role="tabpanel"
        id={`${id}-chart`}
        aria-labelledby={`${id}-${metric}`}
        className="mt-4"
      >
        {!points.length ? (
          <div className="flex h-56 flex-col items-center justify-center text-sm text-admin-muted">
            <BarChart3 className="h-8 w-8 text-slate-700 mb-2" aria-hidden="true" />
            <p>No data for this period.</p>
          </div>
        ) : (
          <>
            {/* Interactive Tooltip Headline */}
            <div
              className="mb-3 flex items-center justify-between text-xs"
              aria-live="polite"
            >
              {selectedPoint ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-admin-text">
                    {formatDate(selectedPoint.date)}
                  </span>
                  <span className="text-admin-muted">·</span>
                  <span className="text-base font-bold tabular-nums text-admin-accent">
                    {formatValue(selectedPoint.value)}
                  </span>
                </div>
              ) : (
                <span className="text-admin-muted">Hover or focus points to view details</span>
              )}
              <span className="text-admin-muted text-[11px]">
                Peak: <strong>{formatValue(maxVal)}</strong>
              </span>
            </div>

            {/* Visual Chart: Line/Area for Orders & Revenue, Bar Chart for Merchants */}
            <div className="flex h-48 gap-3">
              {/* Y-Axis scale */}
              <div className="flex w-16 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums text-admin-muted select-none">
                <span>{formatValue(maxVal)}</span>
                <span>{formatValue(Math.round(maxVal / 2))}</span>
                <span>{formatValue(0)}</span>
              </div>

              {/* Main SVG/HTML Canvas */}
              <div className="relative flex min-w-0 flex-1 items-end justify-around gap-1 border-b border-admin-border">
                {/* Horizontal grid guide lines */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col justify-between"
                >
                  <span className="border-t border-dashed border-admin-border/50" />
                  <span className="border-t border-dashed border-admin-border/50" />
                  <span />
                </div>

                {isLineChart && points.length > 1 ? (
                  <div className="absolute inset-0 z-0">
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      preserveAspectRatio="none"
                      className="h-full w-full overflow-visible"
                    >
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={areaD} fill="url(#chartGradient)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="rgb(52, 211, 153)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : null}

                {/* Interactive Bar/Point Nodes (with required data-activity-* attributes for automated tests) */}
                {points.map((p, i) => (
                  <button
                    key={p.date}
                    type="button"
                    data-activity-date={p.date}
                    data-activity-value={p.value}
                    aria-label={`${formatDate(p.date)}: ${formatValue(p.value)}`}
                    title={`${formatDate(p.date)}: ${formatValue(p.value)}`}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onFocus={() => setHoveredIndex(i)}
                    className="group relative z-10 flex h-full min-w-0 max-w-12 flex-1 items-end rounded-t outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-admin-accent"
                  >
                    {isLineChart ? (
                      /* Point marker on the line */
                      <div
                        className="relative w-full flex justify-center transition-all"
                        style={{ height: `${(p.value / scale) * 100}%` }}
                      >
                        <span
                          className={`absolute -top-1.5 h-3 w-3 rounded-full border-2 border-slate-900 transition-all ${
                            hoveredIndex === i
                              ? 'bg-white scale-125'
                              : 'bg-emerald-400 group-hover:bg-emerald-300'
                          }`}
                        />
                      </div>
                    ) : (
                      /* Bar for Merchants */
                      <span
                        className={`w-full rounded-t transition-colors ${
                          hoveredIndex === i
                            ? 'bg-admin-primary'
                            : 'bg-emerald-500/80 group-hover:bg-emerald-400'
                        }`}
                        style={{ height: `${(p.value / scale) * 100}%` }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* X-Axis Dates */}
            <div className="ml-16 mt-3 flex justify-between gap-1 text-[11px] text-admin-muted">
              {tickIndices.map((i) => (
                <time key={points[i].date} dateTime={points[i].date}>
                  {formatDate(points[i].date)}
                </time>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

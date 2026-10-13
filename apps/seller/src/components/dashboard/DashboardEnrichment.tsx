import React, { useId } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/* =========================================================================
   1. NATIVE SVG METRIC SPARKLINE COMPONENT
   ========================================================================= */
interface MetricSparklineProps {
  data: number[];
  color?: string;
  gradientIdPrefix?: string;
  ariaLabel?: string;
  className?: string;
  width?: number;
  height?: number;
}

export const MetricSparkline: React.FC<MetricSparklineProps> = ({
  data = [],
  color = 'var(--merchant-primary)',
  gradientIdPrefix = 'spark',
  ariaLabel = 'Metric trend sparkline',
  className = '',
  width = 96,
  height = 36,
}) => {
  const uniqueId = useId().replace(/:/g, '_');
  const gradId = `${gradientIdPrefix}_${uniqueId}`;

  // Check if data is empty, insufficient, or all values are equal to 0
  const isEmptyOrAllZero = !data || data.length === 0 || data.every((val) => val === 0);
  const allIdentical = data && data.length > 0 && data.every((val) => val === data[0]);

  // STRATEGY 1: Clearly NON-DATA micro-visual (No fake waves, no curves, no peaks, no fake glow)
  // Subtle horizontal dotted baseline with a faint flat baseline fade
  if (isEmptyOrAllZero) {
    const yBaseline = height - 8;
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`w-[56px] sm:w-[72px] lg:w-[84px] h-[26px] sm:h-[30px] lg:h-[32px] overflow-visible shrink-0 ${className}`}
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        {/* Subtle flat baseline fade */}
        <rect
          x="2"
          y={yBaseline - 1}
          width={width - 4}
          height="3"
          rx="1.5"
          fill={color}
          fillOpacity="0.06"
        />
        {/* Subtle horizontal dotted baseline */}
        <line
          x1="2"
          y1={yBaseline}
          x2={width - 2}
          y2={yBaseline}
          stroke={color}
          strokeWidth="1.25"
          strokeDasharray="2.5 3"
          strokeLinecap="round"
          opacity="0.25"
        />
        {/* 3 small muted non-data dots */}
        <circle cx={width * 0.3} cy={yBaseline} r="1.2" fill={color} opacity="0.3" />
        <circle cx={width * 0.5} cy={yBaseline} r="1.2" fill={color} opacity="0.3" />
        <circle cx={width * 0.7} cy={yBaseline} r="1.2" fill={color} opacity="0.3" />
      </svg>
    );
  }

  // Handle non-zero all identical values (e.g. constant activity across buckets)
  if (allIdentical) {
    const yVal = height * 0.5;
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`w-[56px] sm:w-[72px] lg:w-[84px] h-[26px] sm:h-[30px] lg:h-[32px] overflow-visible shrink-0 ${className}`}
        aria-label={ariaLabel}
        preserveAspectRatio="none"
      >
        <line
          x1="2"
          y1={yVal}
          x2={width - 2}
          y2={yVal}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx={width - 3} cy={yVal} r="2" fill={color} opacity="0.8" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 5;
  const usableHeight = height - paddingY * 2;

  // Map to SVG coordinates with boundary margins
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 6) + 3;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  // Build smooth cubic Bezier curve path
  let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = ((prev.x + curr.x) / 2).toFixed(1);
    pathD += ` C ${cx} ${prev.y.toFixed(1)}, ${cx} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-[56px] sm:w-[72px] lg:w-[84px] h-[26px] sm:h-[30px] lg:h-[32px] overflow-visible shrink-0 ${className}`}
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Shaded Area */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Main Curve */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Subtle endpoint dot & glow */}
      <circle cx={lastPoint.x} cy={lastPoint.y} r="4.5" fill={color} opacity="0.25" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2.2" fill={color} />
    </svg>
  );
};

/* =========================================================================
   2. POINT-IN-TIME STATUS METER (For Pending, Low Stock, Active Products)
   ========================================================================= */
interface StatusMeterProps {
  type: 'pending' | 'stock' | 'catalog';
  value: number;
}

export const StatusMeter: React.FC<StatusMeterProps> = ({ type, value }) => {
  if (type === 'pending') {
    // 3-segment fulfillment queue indicator
    return (
      <div className="flex flex-col items-end gap-1 shrink-0" aria-hidden="true">
        <div className="flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              value > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500/70'
            }`}
          />
          <span className="text-[9px] sm:text-[10px] font-semibold text-[var(--merchant-text-muted)]">
            {value === 0 ? 'Clear' : `${value} queued`}
          </span>
        </div>
        <div className="flex items-center gap-1 w-12 sm:w-16 h-1.5 rounded-full overflow-hidden bg-[var(--merchant-border)]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              value === 0 ? 'w-full bg-emerald-500/60' : value <= 3 ? 'w-2/3 bg-amber-500' : 'w-full bg-amber-600'
            }`}
          />
        </div>
      </div>
    );
  }

  if (type === 'stock') {
    // Stock urgency meter
    return (
      <div className="flex flex-col items-end gap-1 shrink-0" aria-hidden="true">
        <div className="flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              value === 0 ? 'bg-emerald-500' : value <= 3 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
            }`}
          />
          <span className="text-[9px] sm:text-[10px] font-semibold text-[var(--merchant-text-muted)]">
            {value === 0 ? 'Healthy' : `${value} alert${value > 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="flex items-center gap-1 w-12 sm:w-16 h-1.5 rounded-full overflow-hidden bg-[var(--merchant-border)]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              value === 0 ? 'w-full bg-emerald-500' : value <= 3 ? 'w-1/2 bg-amber-500' : 'w-full bg-rose-500'
            }`}
          />
        </div>
      </div>
    );
  }

  // Catalog / Active products status
  return (
    <div className="flex flex-col items-end gap-1 shrink-0" aria-hidden="true">
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--merchant-primary)]" />
        <span className="text-[9px] sm:text-[10px] font-semibold text-[var(--merchant-text-muted)]">
          {value > 0 ? 'Active' : 'Empty'}
        </span>
      </div>
      <div className="flex items-center gap-1 w-12 sm:w-16 h-1.5 rounded-full overflow-hidden bg-[var(--merchant-border)]">
        <div
          className="h-full bg-[var(--merchant-primary)] rounded-full transition-all duration-300"
          style={{ width: value > 0 ? '100%' : '0%' }}
        />
      </div>
    </div>
  );
};

/* =========================================================================
   3. ENRICHED DASHBOARD METRIC CARD
   ========================================================================= */
interface DashboardMetricCardProps {
  label: string;
  value: React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
  iconBgClass: string;
  trend?: number | null;
  sparklineData?: number[];
  sparklineColor?: string;
  statusMeterType?: 'pending' | 'stock' | 'catalog';
  statusMeterValue?: number;
  actionText?: string;
  onAction?: () => void;
  actionColorClass?: string;
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  iconBgClass,
  trend,
  sparklineData,
  sparklineColor = 'var(--merchant-primary)',
  statusMeterType,
  statusMeterValue = 0,
  actionText,
  onAction,
  actionColorClass = 'text-[var(--merchant-primary)] hover:text-[var(--merchant-primary-hover)]',
}) => {
  // Render valid trend badge (omit if null, undefined, 0, or zero-data)
  const renderTrendBadge = () => {
    if (trend === null || trend === undefined || trend === 0) return null;
    if (sparklineData && (sparklineData.length === 0 || sparklineData.every((v) => v === 0))) {
      return null;
    }
    const isPositive = trend > 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shrink-0 ${
          isPositive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
        }`}
      >
        {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        <span>
          {isPositive ? '+' : ''}
          {trend}%
        </span>
      </span>
    );
  };

  return (
    <div className="bg-[var(--merchant-surface)] p-2.5 sm:p-3 lg:p-3.5 rounded-xl sm:rounded-2xl border border-[var(--merchant-border)] shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[90px] sm:min-h-[96px] group">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-8.5 lg:h-8.5 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconBgClass}`}
          >
            {icon}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[var(--merchant-text-muted)] uppercase tracking-wider truncate">
            {label}
          </span>
        </div>
        <div>{renderTrendBadge()}</div>
      </div>

      {/* Middle & Bottom Content Row */}
      <div className="mt-2 flex items-end justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-base sm:text-lg lg:text-xl font-black text-[var(--merchant-text)] tracking-tight truncate leading-tight">
            {value}
          </div>
          <div className="text-[10px] sm:text-[11px] text-[var(--merchant-text-muted)] font-medium mt-0.5 flex items-center gap-1">
            <span className="truncate">{subtitle}</span>
            {actionText && onAction && (
              <button
                type="button"
                onClick={onAction}
                className={`text-[10px] sm:text-[11px] font-bold transition-colors inline-flex items-center shrink-0 underline-offset-2 hover:underline ${actionColorClass}`}
              >
                {actionText}
              </button>
            )}
          </div>
        </div>

        {/* Right visualization: Real Sparkline OR truthful Status Meter */}
        {sparklineData ? (
          <div className="shrink-0 pl-0.5">
            <MetricSparkline data={sparklineData} color={sparklineColor} ariaLabel={`${label} trend`} />
          </div>
        ) : statusMeterType ? (
          <div className="shrink-0 pl-0.5 pb-0.5">
            <StatusMeter type={statusMeterType} value={statusMeterValue} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* =========================================================================
   4. STORE LAUNCH ILLUSTRATION (Native SVG for Your Next Step)
   ========================================================================= */
export const StoreLaunchIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-20 h-14 sm:w-24 sm:h-18 lg:w-28 lg:h-20 shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Background Soft Glow */}
      <circle cx="80" cy="60" r="50" fill="currentColor" fillOpacity="0.08" />

      {/* Base Platform */}
      <rect x="25" y="98" width="110" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />

      {/* Storefront Main Body */}
      <rect x="38" y="44" width="84" height="54" rx="6" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />

      {/* Glass Store Window */}
      <rect x="46" y="58" width="30" height="32" rx="4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Window Highlight Lines */}
      <line x1="50" y1="63" x2="62" y2="63" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      <line x1="50" y1="68" x2="57" y2="68" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />

      {/* Store Entrance Door */}
      <rect x="84" y="58" width="30" height="40" rx="3" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="107" cy="78" r="2" fill="var(--merchant-accent, #F59E0B)" />

      {/* Striped Canopy / Awning */}
      <path
        d="M32 44C32 40 35 36 39 36H121C125 36 128 40 128 44L124 52C123 54 121 55 119 55C117 55 115 54 114 52L112 48L110 52C109 54 107 55 105 55C103 55 101 54 100 52L98 48L96 52C95 54 93 55 91 55C89 55 87 54 86 52L84 48L82 52C81 54 79 55 77 55C75 55 73 54 72 52L70 48L68 52C67 54 65 55 63 55C61 55 59 54 58 52L56 48L54 52C53 54 51 55 49 55C47 55 45 54 44 52L40 48L36 52C35 54 33 55 31 55C29 55 27 54 26 52L32 44Z"
        fill="var(--merchant-accent, #F59E0B)"
        fillOpacity="0.85"
      />
      {/* Alternating Canopy Accent Segments */}
      <path
        d="M48 36L44 52C45 54 47 55 49 55C51 55 53 54 54 52L56 36H48Z"
        fill="#FFFFFF"
        fillOpacity="0.7"
      />
      <path
        d="M76 36L72 52C73 54 75 55 77 55C79 55 81 54 82 52L84 36H76Z"
        fill="#FFFFFF"
        fillOpacity="0.7"
      />
      <path
        d="M104 36L100 52C101 54 103 55 105 55C107 55 109 54 110 52L112 36H104Z"
        fill="#FFFFFF"
        fillOpacity="0.7"
      />

      {/* Floating Sparkles & Launch Badge */}
      <g transform="translate(118, 16)">
        <circle cx="12" cy="12" r="10" fill="var(--merchant-accent, #F59E0B)" />
        <path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="#FFFFFF" />
      </g>
      <circle cx="28" cy="24" r="3" fill="var(--merchant-accent, #F59E0B)" fillOpacity="0.6" />
      <circle cx="34" cy="16" r="1.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="138" cy="46" r="2" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
};

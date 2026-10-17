import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardStatCardProps {
  label: string;
  value: string;
  dataKpi?: string;
  comparison?: string | null;
  href?: string;
  onClick?: () => void;
  isAttention?: boolean;
  attentionCount?: number;
  icon?: React.ReactNode;
}

export function DashboardStatCard({
  label,
  value,
  dataKpi,
  comparison,
  href,
  onClick,
  isAttention = false,
  attentionCount = 0,
  icon,
}: DashboardStatCardProps) {
  const content = (
    <div
      className={`group relative flex h-full min-h-[124px] flex-col justify-between rounded-xl p-4 transition-all duration-150 ${
        isAttention && attentionCount > 0
          ? 'bg-amber-950/20 border border-amber-800/40 hover:border-amber-700/60 hover:bg-amber-950/30'
          : 'bg-admin-surface border border-admin-border/80 hover:border-slate-600 hover:bg-admin-raised/40 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2 h-5">
        <span className="text-xs font-medium text-admin-muted uppercase tracking-wider truncate">
          {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {icon && <span className="text-admin-muted">{icon}</span>}
          {href && (
            <ArrowUpRight
              className="h-3.5 w-3.5 text-admin-muted opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-admin-accent"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      <div className="my-1.5 flex items-baseline">
        <p
          data-kpi={dataKpi}
          className={`text-2xl font-bold tracking-tight tabular-nums sm:text-3xl truncate leading-none ${
            isAttention && attentionCount > 0
              ? 'text-amber-400'
              : 'text-admin-text'
          }`}
        >
          {value}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-xs h-5">
        {isAttention ? (
          <span
            className={`font-medium truncate ${
              attentionCount > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {comparison || (attentionCount > 0 ? 'Requires action' : 'All clear')}
          </span>
        ) : comparison && comparison !== '—' ? (
          <span className="flex items-center gap-1 font-medium text-emerald-400 truncate">
            <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{comparison}</span>
          </span>
        ) : (
          <span className="text-admin-muted truncate">
            {comparison === '—' ? 'Active platform total' : comparison || 'Active'}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent rounded-xl"
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent rounded-xl"
      >
        {content}
      </button>
    );
  }

  return content;
}

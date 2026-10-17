import React from 'react';

export type StatusCategory = 'store' | 'payment' | 'order' | 'subscription' | 'auto';

interface StatusBadgeProps {
  status: string | null | undefined;
  category?: StatusCategory;
  className?: string;
}

export function StatusBadge({ status, category = 'auto', className = '' }: StatusBadgeProps) {
  if (!status) {
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
        None
      </span>
    );
  }

  const raw = status.toUpperCase().trim();
  const label = raw.replaceAll('_', ' ');

  // Semantic color selection based on status value
  let colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700'; // Default neutral
  let dotColor = 'bg-slate-400';

  // Green = success, live, paid, active, completed
  if (['LIVE', 'PAID', 'SUCCESS', 'ACTIVE', 'COMPLETED', 'DELIVERED', 'RESOLVED'].includes(raw)) {
    colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
    dotColor = 'bg-emerald-400';
  }
  // Amber = warning, draft, pending, under review, accepted
  else if (['DRAFT', 'PENDING', 'ACCEPTED', 'UNDER_REVIEW', 'TRIALING', 'EXPIRING_SOON'].includes(raw)) {
    colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-800/60';
    dotColor = 'bg-amber-400';
  }
  // Red = error, problem, suspended, failed, cancelled, expired
  else if (['SUSPENDED', 'FAILED', 'CANCELLED', 'EXPIRED', 'UNPAID', 'REMOVED'].includes(raw)) {
    colorClasses = 'bg-red-950/60 text-red-300 border-red-800/60';
    dotColor = 'bg-red-400';
  }
  // Blue = informational, private preview, new, in transit
  else if (['PRIVATE_PREVIEW', 'PRIVATE PREVIEW', 'NEW', 'IN_TRANSIT', 'READY_FOR_PICKUP'].includes(raw)) {
    colorClasses = 'bg-blue-950/60 text-blue-300 border-blue-800/60';
    dotColor = 'bg-blue-400';
  }
  // Gray = refunded, inactive, archived
  else if (['REFUNDED', 'INACTIVE', 'ARCHIVED'].includes(raw)) {
    colorClasses = 'bg-slate-800/90 text-slate-400 border-slate-700';
    dotColor = 'bg-slate-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border tracking-wide ${colorClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {label}
    </span>
  );
}

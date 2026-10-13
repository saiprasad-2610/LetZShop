import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-merchant-surface rounded-2xl border border-merchant-border p-5 shadow-xs animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-merchant-surface-raised rounded w-1/3" />
            <div className="h-6 w-6 bg-merchant-surface-raised rounded-lg" />
          </div>
          <div className="h-8 bg-merchant-surface-raised rounded w-2/3" />
          <div className="h-3 bg-merchant-surface-raised rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="bg-merchant-surface rounded-2xl border border-merchant-border overflow-hidden shadow-xs animate-pulse">
      <div className="p-4 bg-merchant-surface-raised border-b border-merchant-border flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-merchant-surface-muted rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-merchant-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-merchant-surface-raised rounded flex-1"
                style={{ width: `${Math.max(40, 100 - c * 15)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MetricSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-merchant-surface p-5 rounded-2xl border border-merchant-border shadow-xs space-y-2">
          <div className="h-3 bg-merchant-surface-raised rounded w-1/2" />
          <div className="h-7 bg-merchant-surface-raised rounded w-3/4" />
          <div className="h-2.5 bg-merchant-surface-raised rounded w-1/3" />
        </div>
      ))}
    </div>
  );
};

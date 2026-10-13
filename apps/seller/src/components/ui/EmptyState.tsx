import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="bg-merchant-surface border border-merchant-border rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs transition-colors duration-150">
      <div className="w-14 h-14 rounded-2xl bg-merchant-surface-raised text-merchant-text-secondary flex items-center justify-center mx-auto mb-4 border border-merchant-border-subtle">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-merchant-text tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-merchant-text-muted mt-1.5 leading-relaxed">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-merchant-primary hover:bg-merchant-primary-hover text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              {actionText}
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 bg-merchant-surface-raised hover:bg-merchant-surface-muted text-merchant-text border border-merchant-border rounded-xl text-xs font-semibold transition"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

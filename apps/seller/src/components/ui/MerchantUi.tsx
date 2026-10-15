import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useMerchantTheme } from '../../context/ThemeContext';

/* =========================================================================
   1. THEME TOGGLE BUTTON
   - Sun icon = Light mode
   - Moon icon = Dark mode
   - Compact toggle suitable for sidebar, tablet rail, mobile drawer, and headers
   ========================================================================= */
interface ThemeToggleProps {
  collapsed?: boolean;
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  collapsed = false,
  className = '',
  showLabel = true,
}) => {
  const { theme, toggleTheme, mounted } = useMerchantTheme();

  // If not mounted yet, show neutral skeleton to prevent layout shift
  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Loading theme..."
        className={`w-full flex items-center justify-center rounded-xl p-2 text-xs opacity-50 ${className}`}
      >
        <span className="w-4 h-4 rounded-full bg-slate-400 animate-pulse" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Theme (Sage + Gold)' : 'Switch to Dark Theme (Graphite + Violet)'}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-200 select-none shrink-0 ${
        collapsed
          ? 'justify-center p-1.5 md:w-[46px] md:h-[44px] md:min-w-[44px]'
          : 'w-full justify-between px-3.5 py-2.5 md:min-h-[46px] lg:min-h-[48px] lg:px-4'
      } ${
        isDark
          ? 'bg-[#22242F] text-[#E5E7EB] hover:bg-[#2D2F3A] border border-white/10 hover:border-violet-500/40'
          : 'bg-[#ECFDF5] text-[#1F2937] hover:bg-[#D1FAE5] border border-[#DDE7DF] hover:border-[#65A30D]/40'
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0 ${
            isDark
              ? 'bg-violet-600/20 text-violet-300'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </div>
        {!collapsed && showLabel && (
          <div className="text-left flex flex-col leading-tight">
            <span className="text-xs font-bold">
              {isDark ? 'Dark Theme' : 'Light Theme'}
            </span>
            <span className="text-[10px] opacity-70">
              {isDark ? 'Graphite + Violet' : 'Sage + Gold'}
            </span>
          </div>
        )}
      </div>

      {!collapsed && (
        <span
          className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold ${
            isDark
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'bg-[#65A30D]/15 text-[#4D7C0F] border border-[#65A30D]/30'
          }`}
        >
          {isDark ? 'DARK' : 'LIGHT'}
        </span>
      )}

      {/* Collapsed rail tooltip */}
      {collapsed && (
        <span className="hidden md:group-hover:block lg:group-hover:hidden absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md shadow-xl whitespace-nowrap z-50 border border-slate-700 pointer-events-none">
          {isDark ? 'Light Theme (Sage)' : 'Dark Theme (Graphite)'}
        </span>
      )}
    </button>
  );
};

/* =========================================================================
   2. MERCHANT CARD
   - Unified 12-16px radius, subtle border & shadow tokens
   ========================================================================= */
interface MerchantCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'surface' | 'raised' | 'muted';
}

export const MerchantCard: React.FC<MerchantCardProps> = ({
  children,
  variant = 'surface',
  className = '',
  ...props
}) => {
  const bgClass =
    variant === 'raised'
      ? 'bg-merchant-surface-raised'
      : variant === 'muted'
      ? 'bg-merchant-surface-muted'
      : 'bg-merchant-surface';

  return (
    <div
      className={`${bgClass} border border-merchant-border rounded-2xl shadow-xs transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/* =========================================================================
   3. MERCHANT BUTTON
   - Variants: primary (violet/sage), secondary, ghost, danger, success, accent (gold)
   ========================================================================= */
interface MerchantButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const MerchantButton: React.FC<MerchantButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl',
    lg: 'px-5 py-2.5 text-sm font-bold rounded-xl',
  }[size];

  const variantClasses = {
    primary:
      'bg-merchant-primary hover:bg-merchant-primary-hover text-white shadow-xs focus:ring-2 focus:ring-merchant-focus-ring',
    secondary:
      'bg-merchant-surface-raised hover:bg-merchant-surface-muted text-merchant-text border border-merchant-border hover:border-merchant-border-strong',
    accent:
      'bg-merchant-accent hover:bg-merchant-accent-hover text-white shadow-xs',
    ghost:
      'bg-transparent hover:bg-merchant-surface-raised text-merchant-text-secondary hover:text-merchant-text',
    danger:
      'bg-merchant-danger hover:bg-red-600 text-white shadow-xs',
    success:
      'bg-merchant-success hover:bg-emerald-600 text-white shadow-xs',
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/* =========================================================================
   4. MERCHANT BADGE
   ========================================================================= */
interface MerchantBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const MerchantBadge: React.FC<MerchantBadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    primary: 'bg-merchant-primary-soft text-merchant-primary border-merchant-primary/30',
    accent: 'bg-merchant-accent-soft text-merchant-accent-dark border-merchant-accent/30',
    success: 'bg-merchant-success-soft text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    warning: 'bg-merchant-warning-soft text-amber-800 dark:text-amber-300 border-amber-500/30',
    danger: 'bg-merchant-danger-soft text-rose-700 dark:text-rose-300 border-rose-500/30',
    neutral: 'bg-merchant-surface-raised text-merchant-text-secondary border-merchant-border',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${sizeClasses} ${variantClasses} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />}
      {children}
    </span>
  );
};

import { SupportedLocale, DEFAULT_LOCALE, sanitizeLocale } from './registry';

/**
 * Centralized currency formatting for LetzShop.
 * Accepts value in paise (minor units) or integer rupees, formats according to Indian numbering system (e.g. ₹1,25,000).
 */
export function formatCurrency(
  amountPaise: number,
  locale: string = DEFAULT_LOCALE,
  options?: { showPaiseIfZero?: boolean }
): string {
  const safeLocale = sanitizeLocale(locale);
  const rupees = (Number(amountPaise) || 0) / 100;
  const hasPaise = amountPaise % 100 !== 0;

  try {
    return new Intl.NumberFormat(safeLocale, {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: hasPaise || options?.showPaiseIfZero ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(rupees);
  } catch {
    // Fallback if Intl fails
    const formatted = hasPaise ? rupees.toFixed(2) : Math.round(rupees).toLocaleString('en-IN');
    return `₹${formatted}`;
  }
}

/**
 * Centralized date/time formatting.
 * Uses Intl.DateTimeFormat with safe fallback, preserving original business time.
 */
export function formatDate(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  const safeLocale = sanitizeLocale(locale);
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(safeLocale, defaultOptions).format(d);
  } catch {
    return d.toLocaleDateString('en-IN');
  }
}

/**
 * Format date with time.
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Centralized number formatting.
 */
export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions
): string {
  const safeLocale = sanitizeLocale(locale);
  try {
    return new Intl.NumberFormat(safeLocale, options).format(value);
  } catch {
    return String(value);
  }
}

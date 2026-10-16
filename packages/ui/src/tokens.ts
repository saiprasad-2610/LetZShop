// ==============================================================================
// Simply E-Commerce: Unified Design Tokens & Accessibility System
// ==============================================================================

export const SPACING_TOKENS = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
} as const;

export const RADIUS_TOKENS = {
  sm: '0.375rem', // 6px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  '2xl': '1.5rem',// 24px
  full: '9999px',
} as const;

export const SHADOW_TOKENS = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

export const SAAS_SURFACES = {
  sidebar: '#0F172A',     // Slate 900
  sidebarHover: '#1E293B',// Slate 800
  sidebarActive: '#2563EB',// Blue 600
  background: '#F8FAFC',  // Slate 50
  card: '#FFFFFF',
  border: '#E2E8F0',      // Slate 200
  borderSubtle: '#F1F5F9',// Slate 100
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
} as const;

export const ORDER_STATUS_MAP: Record<
  string,
  {
    label: string;
    description: string;
    bgClass: string;
    textClass: string;
    nextAction?: string;
  }
> = {
  NEW: {
    label: 'New Order',
    description: 'Order placed by customer, awaiting merchant acceptance',
    bgClass: 'bg-blue-50 border border-blue-200',
    textClass: 'text-blue-700',
    nextAction: 'Accept Order',
  },
  PAID: {
    label: 'Paid',
    description: 'Payment captured securely via Razorpay or pre-authorized',
    bgClass: 'bg-emerald-50 border border-emerald-200',
    textClass: 'text-emerald-700',
    nextAction: 'Process Order',
  },
  PROCESSING: {
    label: 'Processing',
    description: 'Items are being packed and prepared for shipment',
    bgClass: 'bg-indigo-50 border border-indigo-200',
    textClass: 'text-indigo-700',
    nextAction: 'Mark Ready to Ship',
  },
  READY: {
    label: 'Ready to Ship',
    description: 'Package ready for courier pickup',
    bgClass: 'bg-cyan-50 border border-cyan-200',
    textClass: 'text-cyan-700',
    nextAction: 'Dispatch & Ship',
  },
  SHIPPED: {
    label: 'Shipped',
    description: 'Handed over to courier with active AWB tracking',
    bgClass: 'bg-amber-50 border border-amber-200',
    textClass: 'text-amber-700',
    nextAction: 'Mark Delivered',
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Successfully handed over to customer',
    bgClass: 'bg-green-50 border border-green-200',
    textClass: 'text-green-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Order cancelled or returned',
    bgClass: 'bg-rose-50 border border-rose-200',
    textClass: 'text-rose-700',
  },
};

// ==============================================================================
// WCAG 2.1 Accessibility & Color Contrast Validator
// Ensures merchants cannot configure unreadable storefront combinations
// ==============================================================================

export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== 'string' || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value.trim())) return null;
  const clean = value.trim().slice(1);
  return '#' + (clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean).toUpperCase();
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = normalizeHexColor(hex)?.slice(1);
  if (!clean) {
    return { r: 0, g: 0, b: 0 };
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const c1 = parseHexColor(hex1);
  const c2 = parseHexColor(hex2);
  const l1 = getRelativeLuminance(c1.r, c1.g, c1.b);
  const l2 = getRelativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns true if the contrast ratio meets WCAG AA standards (>= 4.5 for standard text)
 */
export function isContrastAccessible(bgHex: string, textHex: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(bgHex, textHex);
  const threshold = level === 'AAA' ? 7.0 : 4.5;
  return ratio >= threshold;
}

/**
 * Automatically computes whether white or dark slate text provides higher contrast
 * for a merchant's chosen primary/background color.
 */
export function getSuggestedTextColor(bgHex: string): '#FFFFFF' | '#0F172A' {
  const whiteRatio = getContrastRatio(bgHex, '#FFFFFF');
  const blackRatio = getContrastRatio(bgHex, '#0F172A');
  return whiteRatio >= blackRatio ? '#FFFFFF' : '#0F172A';
}

export const INDIAN_PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RESERVED_SLUGS = new Set([
  'merchant', 'logout', 'signup', 'register', 'payments', 'static', 'cdn',
  'support', 'status', 'mail', 'system', 'docs', '_next', 'favicon',
  'next', 'track', 'onboarding', 'favicon-ico', 'robots-txt', 'sitemap-xml',
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'billing',
  'cart',
  'checkout',
  'dashboard',
  'health',
  'help',
  'login',
  'media',
  'metrics',
  'order',
  'orders',
  'payment',
  'privacy',
  'root',
  'seller',
  'settings',
  'shipping',
  'simply',
  'store',
  'stores',
  'terms',
  'webhook',
  'webhooks',
  'www',
]);

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return phone;
}

export function isValidIndianPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  return INDIAN_PHONE_REGEX.test(phone.trim());
}

export function isValidIndianPincode(pincode: string): boolean {
  return INDIAN_PINCODE_REGEX.test(pincode.trim());
}

export function normalizeSlug(rawSlug: string): string {
  return rawSlug
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '-')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim());
}

export const PIN_REGEX = /^\d{6}$/;

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin.trim());
}

export function isValidIndianMobile(phone10Digits: string): boolean {
  return /^[6-9]\d{9}$/.test(phone10Digits.trim());
}

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export const BUSINESS_NAME_REGEX = /^[\p{L}\p{N}\s&'\-.,/()]{2,100}$/u;

/**
 * Normalizes a business name by removing leading/trailing spaces and
 * collapsing consecutive whitespace characters between words into a single space.
 * Preserves normal single spaces, valid punctuation, Unicode Indian scripts, and capitalization.
 */
export function normalizeBusinessName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

export function isValidBusinessName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const normalized = normalizeBusinessName(name);
  return normalized.length >= 2 && normalized.length <= 100 && BUSINESS_NAME_REGEX.test(normalized);
}

export function validateMoneyAmount(amountPaise: number): boolean {
  return Number.isInteger(amountPaise) && amountPaise >= 0;
}

/**
 * Razorpay Key ID format: must start with rzp_test_ or rzp_live_ followed by alphanumeric characters.
 */
export const RAZORPAY_KEY_ID_REGEX = /^rzp_(?:test|live)_[a-zA-Z0-9_]+$/;

export function isValidRazorpayKeyId(keyId: string): boolean {
  if (!keyId || typeof keyId !== 'string') return false;
  return RAZORPAY_KEY_ID_REGEX.test(keyId.trim());
}

/**
 * Official Udyam Registration Number format: UDYAM-XX-00-0000000
 * Prefix: UDYAM
 * 2 uppercase alphabetic state/UT characters
 * 2 numeric digits
 * 7 numeric digits
 */
export const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;

export function normalizeUdyamNumber(udyam: string): string {
  if (!udyam || typeof udyam !== 'string') return '';
  return udyam.trim().toUpperCase();
}

export function isValidUdyamNumber(udyam: string): boolean {
  if (!udyam || typeof udyam !== 'string') return false;
  return UDYAM_REGEX.test(normalizeUdyamNumber(udyam));
}

/**
 * Normalizes a product name by removing leading/trailing spaces and
 * collapsing consecutive whitespace characters between words into a single space.
 * Preserves normal single spaces, valid punctuation, brand formatting, and Unicode Indian scripts.
 */
export function normalizeProductName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Validates a product name.
 * Rules:
 * - Length between 2 and 255 characters after normalization.
 * - Must contain at least one meaningful Unicode letter or numeric character (\\p{L}|\\p{N}).
 * - Reject names consisting exclusively of punctuation, symbols, whitespace, or emoji (e.g. "@#$%^&*", "!!!", "₹₹₹").
 */
export function isValidProductName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const normalized = normalizeProductName(name);
  if (normalized.length < 2 || normalized.length > 255) return false;
  return /[\p{L}\p{N}]/u.test(normalized);
}

/**
 * Maximum character limit for product descriptions per language.
 */
export const PRODUCT_DESCRIPTION_MAX_CHARS = 5000;

/**
 * Counts user-perceived Unicode grapheme clusters (characters) in a text string.
 * Supports Devanagari text (Hindi, Marathi), composed characters, combining marks, and emojis.
 */
export function countGraphemes(text?: string | null): number {
  if (!text) return 0;
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new (Intl as any).Segmenter();
    return Array.from(segmenter.segment(text)).length;
  }
  return Array.from(text).length;
}

export function isValidProductDescription(description?: string | null): boolean {
  if (!description) return true; // optional field
  return countGraphemes(description) <= PRODUCT_DESCRIPTION_MAX_CHARS;
}

/**
 * Normalizes any phone input representation into up to 10 local digits for display.
 *
 * Rules:
 * - If string starts with +91 (e.g. +91XXXXXXXXXX or +911), strips +91 country prefix.
 * - If string has > 10 digits and starts with 91 (e.g. 919876543210), strips country code 91.
 * - If string has exactly 10 digits starting with 91 (e.g. 9123456789), preserves all 10 digits.
 * - Extracts only numeric digits, ignoring letters/symbols.
 * - Clamps at maximum 10 local digits (11th digit ignored).
 */
export function toLocalDigits(value: string): string {
  if (!value) return '';

  const trimmed = value.trim();

  // If input explicitly has +91 country prefix (e.g. canonical payload +919876543210 or partial +911)
  if (trimmed.startsWith('+91')) {
    const afterPrefix = trimmed.slice(3).replace(/\D/g, '');
    return afterPrefix.slice(0, 10);
  }

  // If input starts with +, strip + and extract digits
  if (trimmed.startsWith('+')) {
    let digits = trimmed.replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    return digits.slice(0, 10);
  }

  // Unprefixed string: strip non-digits
  let digits = trimmed.replace(/\D/g, '');

  // Strip country code 91 ONLY when incoming numeric value has MORE THAN 10 digits
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 10);
}

export function parseRupeesToPaise(rupeeStringOrNumber: string | number): number {
  if (typeof rupeeStringOrNumber === 'number') {
    return Math.round(rupeeStringOrNumber * 100);
  }

  const clean = rupeeStringOrNumber.replace(/[^0-9.]/g, '');
  const val = parseFloat(clean);
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  // Absolute protocol URLs or protocol-relative URLs
  if (/^(?:https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Data URIs or Blob URLs
  if (/^(?:data|blob):/i.test(trimmed)) {
    return trimmed;
  }

  // Determine media / API origin
  let configuredOrigin = '';
  if (typeof process !== 'undefined' && process.env) {
    configuredOrigin =
      process.env.NEXT_PUBLIC_MEDIA_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      '';
  }

  if (!configuredOrigin) {
    configuredOrigin = 'http://localhost:4000';
  }

  const cleanOrigin = configuredOrigin.replace(/\/+$/, '');
  const cleanPath = trimmed.replace(/^\/+/, '');

  return `${cleanOrigin}/${cleanPath}`;
}

export * from './india-locations';
export * from './image-validation';

export const INDIAN_PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RESERVED_SLUGS = new Set([
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
  return INDIAN_PHONE_REGEX.test(phone.trim());
}

export function isValidIndianPincode(pincode: string): boolean {
  return INDIAN_PINCODE_REGEX.test(pincode.trim());
}

export function normalizeSlug(rawSlug: string): string {
  return rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim());
}

export function validateMoneyAmount(amountPaise: number): boolean {
  return Number.isInteger(amountPaise) && amountPaise >= 0;
}

/**
 * Subdomain validation, sanitization, and reserved keyword protection.
 * Follows RFC 1035 / RFC 1123 DNS label standards.
 */

export const RESERVED_SUBDOMAINS = new Set<string>([
  'www',
  'api',
  'admin',
  'seller',
  'support',
  'app',
  'mail',
  'dashboard',
  'letzshop',
  'simply',
  'staging',
  'preview',
  'test',
  'dev',
  'status',
  'help',
  'billing',
  'auth',
  'cdn',
  'assets',
  'static',
  'smtp',
  'imap',
  'pop',
  'ns1',
  'ns2',
  'dns',
  'root',
  'superadmin',
  'demo',
  'store',
  'shop',
  'orders',
  'cart',
  'checkout',
  'account',
  'login',
  'signup',
  'register',
  'payment',
  'webhook',
  'portal',
]);

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

/**
 * Sanitizes an arbitrary store name or slug into a clean, compact alphanumeric subdomain.
 * Examples:
 * - "Sairam Tea Company" -> "sairamteacompany"
 * - "Sparsha Sarees" -> "sparshasarees"
 * - "SK General Stores" -> "skgeneralstores"
 * - "Bhagya Kala" -> "bhagyakala"
 */
export function sanitizeSubdomain(rawInput: string): string {
  if (!rawInput || typeof rawInput !== 'string') return '';

  let sanitized = rawInput
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]/g, '');

  if (sanitized.length < 3) {
    if (sanitized.length === 0) {
      sanitized = 'store';
    } else {
      sanitized = `${sanitized}shop`;
    }
  }

  if (sanitized.length > 63) {
    sanitized = sanitized.slice(0, 63);
  }

  return sanitized;
}

/**
 * Validates whether a given subdomain is structurally valid and not reserved.
 */
export function validateSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (!subdomain || typeof subdomain !== 'string') {
    return { valid: false, error: 'Subdomain is required.' };
  }

  const normalized = subdomain.toLowerCase().trim();

  if (normalized.length < 3) {
    return { valid: false, error: 'Subdomain must be at least 3 characters long.' };
  }

  if (normalized.length > 63) {
    return { valid: false, error: 'Subdomain cannot exceed 63 characters.' };
  }

  if (normalized.startsWith('-') || normalized.endsWith('-')) {
    return { valid: false, error: 'Subdomain cannot start or end with a hyphen.' };
  }

  if (!SUBDOMAIN_REGEX.test(normalized)) {
    return {
      valid: false,
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens.',
    };
  }

  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return { valid: false, error: `"${normalized}" is a reserved system hostname.` };
  }

  return { valid: true };
}

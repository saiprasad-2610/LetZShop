import { Logger } from '@nestjs/common';
import { FastifyCorsOptions } from '@fastify/cors';

const logger = new Logger('CorsConfig');

export interface CorsConfigOptions {
  rawOrigins?: string;
  isProduction?: boolean;
}

export const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000', // Customer Storefront
  'http://localhost:3001', // Merchant Dashboard
  'http://localhost:3002', // Admin Dashboard
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
];

export const ALLOWED_CORS_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
];

export const ALLOWED_CORS_HEADERS = [
  'Content-Type',
  'Authorization',
  'Accept',
  'Origin',
  'X-Requested-With',
  'X-Tenant-Id',
  'X-Store-Id',
  'Idempotency-Key',
  'Cache-Control',
  'Pragma',
  'If-Modified-Since',
  'X-CSRF-Token',
  'baggage',
  'sentry-trace',
];

export const EXPOSED_CORS_HEADERS = [
  'Content-Disposition',
  'Content-Length',
  'X-Total-Count',
  'X-Page',
  'X-Per-Page',
];

/**
 * Validates and normalizes an individual CORS origin string.
 *
 * Rules:
 * - Must be a valid URL with protocol
 * - In production: protocol MUST be https:
 * - Wildcards ('*', '*.example.com') are strictly prohibited
 * - Path must be empty or '/' (cannot have subpaths)
 * - Query strings and hashes are rejected
 * - Userinfo is rejected
 */
export function validateAndNormalizeOrigin(
  rawEntry: string,
  isProduction: boolean,
): string {
  const trimmed = rawEntry.trim();

  if (!trimmed) {
    throw new Error('CORS origin entry cannot be empty.');
  }

  // Reject wildcards, null, boolean values or wildcard subdomain patterns
  if (
    trimmed === '*' ||
    trimmed === 'null' ||
    trimmed.toLowerCase() === 'true' ||
    trimmed.toLowerCase() === 'false' ||
    trimmed.includes('*')
  ) {
    throw new Error(
      `Insecure CORS origin "${trimmed}". Wildcards, reflection and pattern matching are strictly prohibited.`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      `Malformed CORS origin "${trimmed}". Must be a valid URL with scheme (e.g. "https://storefront.letzshop.store").`,
    );
  }

  if (isProduction && parsed.protocol !== 'https:') {
    throw new Error(
      `Insecure protocol for CORS origin "${trimmed}". Production origins must use "https://".`,
    );
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(
      `Unsupported protocol for CORS origin "${trimmed}". Only "https:" and "http:" are permitted.`,
    );
  }

  if (parsed.username || parsed.password) {
    throw new Error(
      `Invalid CORS origin "${trimmed}". User credentials in origin are not permitted.`,
    );
  }

  if (parsed.pathname && parsed.pathname !== '/') {
    throw new Error(
      `Invalid CORS origin "${trimmed}". An origin cannot include a path ("${parsed.pathname}").`,
    );
  }

  if (parsed.search || parsed.hash) {
    throw new Error(
      `Invalid CORS origin "${trimmed}". An origin cannot include query parameters or fragments.`,
    );
  }

  // Normalize origin (scheme + host + port in lowercase)
  return parsed.origin.toLowerCase();
}

/**
 * Parses and validates CORS_ALLOWED_ORIGINS environment variable into an explicit Set.
 */
export function parseAndValidateCorsOrigins(
  rawEnvString?: string,
  isProduction: boolean = process.env.NODE_ENV === 'production',
): Set<string> {
  const allowed = new Set<string>();

  if (rawEnvString && rawEnvString.trim().length > 0) {
    const entries = rawEnvString.split(',').map((e) => e.trim()).filter(Boolean);
    for (const entry of entries) {
      const normalized = validateAndNormalizeOrigin(entry, isProduction);
      allowed.add(normalized);
    }
  }

  if (isProduction) {
    // Approved canonical LetzShop production domains
    allowed.add('https://letzshop.store');
    allowed.add('https://www.letzshop.store');
    allowed.add('https://seller.letzshop.store');
    allowed.add('https://admin.letzshop.store');
    if (allowed.size === 0) {
      throw new Error(
        'CORS_ALLOWED_ORIGINS environment variable is required in production and must contain at least one valid HTTPS origin.',
      );
    }
  } else {
    // In development / test mode, add standard local development origins
    for (const devOrigin of DEFAULT_DEV_ORIGINS) {
      allowed.add(devOrigin);
    }

    // Also pick up any custom local base URLs if configured
    for (const envVar of ['STOREFRONT_BASE_URL', 'SELLER_DASHBOARD_URL', 'ADMIN_DASHBOARD_URL']) {
      const val = process.env[envVar];
      if (val && val.trim()) {
        try {
          const parsed = new URL(val.trim());
          allowed.add(parsed.origin.toLowerCase());
        } catch {
          // ignore invalid optional dev URLs
        }
      }
    }
  }

  return allowed;
}

/**
 * Checks whether an incoming request origin is explicitly permitted by the allowlist.
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: Set<string>,
): boolean {
  if (!origin) {
    return false;
  }

  try {
    const parsed = new URL(origin);
    const candidate = parsed.origin.toLowerCase();
    return allowedOrigins.has(candidate);
  } catch {
    return false;
  }
}

/**
 * Builds the secure Fastify CORS options for NestJS application registration.
 */
export function createCorsOptions(options?: CorsConfigOptions): FastifyCorsOptions {
  const isProduction = options?.isProduction ?? (process.env.NODE_ENV === 'production');
  const allowedOriginsSet = parseAndValidateCorsOrigins(
    options?.rawOrigins ?? process.env.CORS_ALLOWED_ORIGINS,
    isProduction,
  );

  if (isProduction) {
    logger.log(
      `🔒 Production CORS active with ${allowedOriginsSet.size} authorized origins: ${Array.from(allowedOriginsSet).join(', ')}`,
    );
  } else {
    logger.log(
      `🔓 Development CORS active with ${allowedOriginsSet.size} authorized origins (including localhost defaults).`,
    );
  }

  return {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      // Requests without Origin header (same-origin, curl, server-to-server)
      if (!origin) {
        return cb(null, true);
      }

      if (isOriginAllowed(origin, allowedOriginsSet)) {
        return cb(null, true);
      }

      // Deny unlisted origins: passing false disables CORS headers and preflights
      return cb(null, false);
    },
    credentials: true,
    methods: ALLOWED_CORS_METHODS,
    allowedHeaders: ALLOWED_CORS_HEADERS,
    exposedHeaders: EXPOSED_CORS_HEADERS,
    maxAge: 86400, // 24 hours preflight cache
    strictPreflight: true,
    optionsSuccessStatus: 204,
  };
}

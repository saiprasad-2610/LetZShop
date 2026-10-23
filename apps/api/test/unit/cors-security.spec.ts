import fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import {
  parseAndValidateCorsOrigins,
  validateAndNormalizeOrigin,
  isOriginAllowed,
  createCorsOptions,
  DEFAULT_DEV_ORIGINS,
} from '../../src/common/config/cors.config';
import { validateProductionSecrets } from '../../src/common/config/security-audit';

describe('Production CORS Security & Origin Validation (Unit Tests)', () => {
  describe('1. Origin Validation & Normalization (validateAndNormalizeOrigin)', () => {
    it('accepts exact HTTPS origins in production', () => {
      expect(validateAndNormalizeOrigin('https://storefront.letzshop.store', true)).toBe(
        'https://storefront.letzshop.store',
      );
      expect(validateAndNormalizeOrigin('https://seller.letzshop.store', true)).toBe(
        'https://seller.letzshop.store',
      );
      expect(validateAndNormalizeOrigin('https://admin.letzshop.store', true)).toBe(
        'https://admin.letzshop.store',
      );
    });

    it('normalizes uppercase schemes and hosts to lowercase', () => {
      expect(validateAndNormalizeOrigin('HTTPS://STOREFRONT.LETZSHOP.STORE', true)).toBe(
        'https://storefront.letzshop.store',
      );
    });

    it('tolerates single trailing slash and strips it to standard origin', () => {
      expect(validateAndNormalizeOrigin('https://storefront.letzshop.store/', true)).toBe(
        'https://storefront.letzshop.store',
      );
    });

    it('strictly rejects wildcard origins (*)', () => {
      expect(() => validateAndNormalizeOrigin('*', true)).toThrow(/Wildcards/i);
      expect(() => validateAndNormalizeOrigin('*', false)).toThrow(/Wildcards/i);
    });

    it('strictly rejects wildcard subdomain patterns (*.domain.com)', () => {
      expect(() => validateAndNormalizeOrigin('*.vercel.app', true)).toThrow(/Wildcards/i);
      expect(() => validateAndNormalizeOrigin('https://*.letzshop.store', true)).toThrow(/Wildcards/i);
    });

    it('strictly rejects boolean and null keywords that could cause reflection', () => {
      expect(() => validateAndNormalizeOrigin('true', true)).toThrow(/Wildcards/i);
      expect(() => validateAndNormalizeOrigin('false', true)).toThrow(/Wildcards/i);
      expect(() => validateAndNormalizeOrigin('null', true)).toThrow(/Wildcards/i);
      expect(() => validateAndNormalizeOrigin('', true)).toThrow(/empty/i);
      expect(() => validateAndNormalizeOrigin('   ', true)).toThrow(/empty/i);
    });

    it('strictly rejects insecure HTTP protocol in production', () => {
      expect(() => validateAndNormalizeOrigin('http://storefront.letzshop.store', true)).toThrow(
        /Production origins must use "https:\/\/\"/i,
      );
    });

    it('allows HTTP protocol in development mode only', () => {
      expect(validateAndNormalizeOrigin('http://localhost:3000', false)).toBe('http://localhost:3000');
    });

    it('strictly rejects origins with URL subpaths', () => {
      expect(() => validateAndNormalizeOrigin('https://storefront.letzshop.store/checkout', true)).toThrow(
        /cannot include a path/i,
      );
      expect(() => validateAndNormalizeOrigin('https://admin.letzshop.store/dashboard', true)).toThrow(
        /cannot include a path/i,
      );
    });

    it('strictly rejects origins with query parameters or hashes', () => {
      expect(() => validateAndNormalizeOrigin('https://storefront.letzshop.store?debug=1', true)).toThrow(
        /query parameters/i,
      );
      expect(() => validateAndNormalizeOrigin('https://storefront.letzshop.store#top', true)).toThrow(
        /query parameters/i,
      );
    });

    it('strictly rejects origins with embedded credentials', () => {
      expect(() => validateAndNormalizeOrigin('https://user:pass@storefront.letzshop.store', true)).toThrow(
        /User credentials/i,
      );
    });

    it('strictly rejects malformed URLs', () => {
      expect(() => validateAndNormalizeOrigin('not-a-url', true)).toThrow(/Malformed CORS origin/i);
      expect(() => validateAndNormalizeOrigin('storefront.letzshop.store', true)).toThrow(
        /Malformed CORS origin/i,
      );
      expect(() => validateAndNormalizeOrigin('//storefront.letzshop.store', true)).toThrow(
        /Malformed CORS origin/i,
      );
    });
  });

  describe('2. Environment Parsing & Allowlist Generation (parseAndValidateCorsOrigins)', () => {
    it('parses multiple comma-separated Vercel frontend origins in production', () => {
      const raw =
        'https://storefront.letzshop.store, https://seller.letzshop.store , https://admin.letzshop.store';
      const allowed = parseAndValidateCorsOrigins(raw, true);

      expect(allowed.size).toBe(3);
      expect(allowed.has('https://storefront.letzshop.store')).toBe(true);
      expect(allowed.has('https://seller.letzshop.store')).toBe(true);
      expect(allowed.has('https://admin.letzshop.store')).toBe(true);
      // Localhost is NOT in production allowlist
      expect(allowed.has('http://localhost:3000')).toBe(false);
    });

    it('throws in production if CORS_ALLOWED_ORIGINS is missing or empty (fail-closed)', () => {
      expect(() => parseAndValidateCorsOrigins(undefined, true)).toThrow(
        /CORS_ALLOWED_ORIGINS environment variable is required in production/i,
      );
      expect(() => parseAndValidateCorsOrigins('', true)).toThrow(
        /CORS_ALLOWED_ORIGINS environment variable is required in production/i,
      );
      expect(() => parseAndValidateCorsOrigins('   ', true)).toThrow(
        /CORS_ALLOWED_ORIGINS environment variable is required in production/i,
      );
    });

    it('includes standard localhost ports in development mode by default', () => {
      const devOrigins = parseAndValidateCorsOrigins(undefined, false);

      expect(devOrigins.has('http://localhost:3000')).toBe(true);
      expect(devOrigins.has('http://localhost:3001')).toBe(true);
      expect(devOrigins.has('http://localhost:3002')).toBe(true);
      expect(devOrigins.has('http://127.0.0.1:3000')).toBe(true);
    });

    it('combines configured origins with localhost ports in development mode', () => {
      const devOrigins = parseAndValidateCorsOrigins(
        'https://dev-preview.vercel.app',
        false,
      );

      expect(devOrigins.has('https://dev-preview.vercel.app')).toBe(true);
      expect(devOrigins.has('http://localhost:3000')).toBe(true);
    });
  });

  describe('3. Origin Matching & Subdomain Spoofing Defense (isOriginAllowed)', () => {
    const allowed = new Set([
      'https://storefront.letzshop.store',
      'https://seller.letzshop.store',
      'https://admin.letzshop.store',
    ]);

    it('approves exact matching origins', () => {
      expect(isOriginAllowed('https://storefront.letzshop.store', allowed)).toBe(true);
      expect(isOriginAllowed('https://seller.letzshop.store', allowed)).toBe(true);
      expect(isOriginAllowed('https://admin.letzshop.store', allowed)).toBe(true);
    });

    it('denies unlisted origins', () => {
      expect(isOriginAllowed('https://untrusted-example.com', allowed)).toBe(false);
      expect(isOriginAllowed('https://attacker.com', allowed)).toBe(false);
    });

    it('blocks prefix spoofing bypasses', () => {
      // E.g. https://storefront.letzshop.store.attacker.com
      expect(
        isOriginAllowed('https://storefront.letzshop.store.attacker.com', allowed),
      ).toBe(false);
    });

    it('blocks sibling or suffix spoofing bypasses', () => {
      expect(isOriginAllowed('https://evil-letzshop.store', allowed)).toBe(false);
      expect(isOriginAllowed('https://letzshop.store.evil.com', allowed)).toBe(false);
    });

    it('blocks port manipulation bypasses', () => {
      expect(isOriginAllowed('https://storefront.letzshop.store:8443', allowed)).toBe(false);
    });

    it('blocks protocol downgrade bypasses', () => {
      expect(isOriginAllowed('http://storefront.letzshop.store', allowed)).toBe(false);
    });

    it('blocks malformed origin strings', () => {
      expect(isOriginAllowed('not-a-valid-origin', allowed)).toBe(false);
      expect(isOriginAllowed(undefined, allowed)).toBe(false);
      expect(isOriginAllowed('', allowed)).toBe(false);
    });
  });

  describe('4. Fastify CORS Integration, Preflight & Credentialed Headers', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = fastify();
      const corsOptions = createCorsOptions({
        rawOrigins:
          'https://storefront.letzshop.store,https://seller.letzshop.store,https://admin.letzshop.store',
        isProduction: true,
      });

      await app.register(fastifyCors, corsOptions);

      app.get('/api/test', async () => ({ status: 'ok' }));
      app.post('/api/test', async () => ({ status: 'created' }));

      await app.ready();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns Access-Control-Allow-Origin and credentials for approved customer storefront', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
        headers: {
          origin: 'https://storefront.letzshop.store',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        'https://storefront.letzshop.store',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['vary']).toContain('Origin');
    });

    it('returns Access-Control-Allow-Origin and credentials for approved seller dashboard', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/test',
        headers: {
          origin: 'https://seller.letzshop.store',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        'https://seller.letzshop.store',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('returns Access-Control-Allow-Origin and credentials for approved admin dashboard', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
        headers: {
          origin: 'https://admin.letzshop.store',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        'https://admin.letzshop.store',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('DENIES unapproved origin: no Access-Control-Allow-Origin or Credentials header emitted', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
        headers: {
          origin: 'https://untrusted-example.com',
        },
      });

      // Response body may proceed, but CORS allow headers must NEVER be present for untrusted origin
      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('DENIES attacker origin attempting subdomain spoofing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
        headers: {
          origin: 'https://storefront.letzshop.store.evil.com',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('handles credentialed preflight OPTIONS request correctly for approved origin', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/test',
        headers: {
          origin: 'https://storefront.letzshop.store',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type, authorization, x-tenant-id',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(
        'https://storefront.letzshop.store',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toBeDefined();
      expect(response.headers['access-control-max-age']).toBe('86400');
    });

    it('rejects preflight OPTIONS request from unapproved origin with 404 and no CORS headers', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/test',
        headers: {
          origin: 'https://untrusted-example.com',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type, authorization',
        },
      });

      // In fastify-cors, when origin callback returns false, corsPreflightEnabled is false, resulting in 404
      expect(response.statusCode).toBe(404);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('permits non-browser requests without Origin header to proceed normally', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.json()).toEqual({ status: 'ok' });
    });
  });

  describe('5. Security Gate Integration (validateProductionSecrets)', () => {
    const origEnv = { ...process.env };

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_ACCESS_SECRET = 'random-prod-access-secret-minimum-32-chars-long!';
      process.env.JWT_REFRESH_SECRET = 'random-prod-refresh-secret-minimum-32-chars-long!';
      process.env.COOKIE_SECRET = 'random-prod-cookie-secret-minimum-32-chars-long!';
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'notifications@letzshop.store';
      process.env.SMTP_PASSWORD = 'super-secret-smtp-password';
      process.env.DATABASE_URL = 'postgresql://user:pass@db.railway.app:5432/letzshop?sslmode=require';
      process.env.OTP_DEV_MOCK_ENABLED = 'false';
    });

    afterEach(() => {
      process.env = { ...origEnv };
    });

    it('fails closed when CORS_ALLOWED_ORIGINS is not set in production', () => {
      delete process.env.CORS_ALLOWED_ORIGINS;
      expect(() => validateProductionSecrets()).toThrow(/CRITICAL SECURITY FAILURE/i);
    });

    it('fails closed when CORS_ALLOWED_ORIGINS contains wildcard (*)', () => {
      process.env.CORS_ALLOWED_ORIGINS = '*';
      expect(() => validateProductionSecrets()).toThrow(/CRITICAL SECURITY FAILURE/i);
    });

    it('passes production security gate when CORS_ALLOWED_ORIGINS contains valid HTTPS origins', () => {
      process.env.CORS_ALLOWED_ORIGINS =
        'https://storefront.letzshop.store,https://seller.letzshop.store,https://admin.letzshop.store';
      expect(() => validateProductionSecrets()).not.toThrow();
    });
  });
});

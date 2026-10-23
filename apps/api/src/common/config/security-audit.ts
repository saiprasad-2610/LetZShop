import { Logger } from '@nestjs/common';

const logger = new Logger('SecurityAudit');

export function validateProductionSecrets(): void {
  const isProd = process.env.NODE_ENV === 'production';

  const insecureDefaults = [
    'dev-access-token-secret-change-in-prod-32!',
    'dev-refresh-token-secret-change-in-prod-32!',
    'dev-cookie-secret-change-in-prod-32!',
  ];

  const jwtAccess = process.env.JWT_ACCESS_SECRET || '';
  const jwtRefresh = process.env.JWT_REFRESH_SECRET || '';
  const cookieSecret = process.env.COOKIE_SECRET || '';
  const devMockOtp = process.env.OTP_DEV_MOCK_ENABLED === 'true';

  if (isProd) {
    const violations: string[] = [];

    if (!jwtAccess || insecureDefaults.includes(jwtAccess) || jwtAccess.length < 32) {
      violations.push('JWT_ACCESS_SECRET must be at least 32 random characters and not a development default.');
    }

    if (!jwtRefresh || insecureDefaults.includes(jwtRefresh) || jwtRefresh.length < 32) {
      violations.push('JWT_REFRESH_SECRET must be at least 32 random characters and not a development default.');
    }

    if (!cookieSecret || insecureDefaults.includes(cookieSecret) || cookieSecret.length < 32) {
      violations.push('COOKIE_SECRET must be at least 32 random characters and not a development default.');
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !(process.env.SMTP_PASSWORD || process.env.SMTP_PASS)) {
      violations.push('SMTP host, user and password are required for registration email verification.');
    }

    if (devMockOtp) {
      violations.push('OTP_DEV_MOCK_ENABLED cannot be true in production.');
    }

    if (process.env.DATABASE_URL?.includes('postgres:postgres@localhost')) {
      violations.push('DATABASE_URL must not use default local development credentials in production.');
    }

    if (violations.length > 0) {
      logger.error('🚨 PRODUCTION SECURITY GATE FAILED: The following security violations prevent startup:');
      violations.forEach((v) => logger.error(`   - ${v}`));
      throw new Error(`CRITICAL SECURITY FAILURE: Production secrets are unconfigured or insecure (${violations.length} violations). Server aborted.`);
    }

    logger.log('🛡️ Production security secrets validated successfully (FAIL-CLOSED gate passed).');
  } else {
    logger.warn('⚠️ Running in development/test mode. Production secret checks are relaxed; registration still requires real SMTP.');
  }
}

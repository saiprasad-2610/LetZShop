import { createRequire } from 'node:module';
import crypto from 'node:crypto';

if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true')
  throw new Error(
    'This helper is only for local development/test. Provision production administrators through your controlled account process.',
  );
try {
  process.loadEnvFile('.env');
} catch {}
if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true')
  throw new Error('Development admin provisioning is disabled in production.');
const require = createRequire(import.meta.url),
  { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
};
const db = new PrismaClient(),
  email = getArg('--email') || process.env.ADMIN_DEV_EMAIL || 'admin@simplyecommerce.in',
  phone = getArg('--phone') || process.env.ADMIN_DEV_PHONE || '+919800000000';
const password =
  getArg('--password') ||
  process.env.ADMIN_DEV_PASSWORD ||
  crypto.randomBytes(18).toString('base64url') + 'aA1!';
if (password.length < 12)
  throw new Error('Choose an admin password with at least 12 characters.');
try {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && !existing.isSuperAdmin && existing.role !== 'PLATFORM_ADMIN')
    throw new Error(
      'Refusing to convert a merchant account into an administrator.',
    );
  const salt = crypto.randomBytes(16).toString('hex'),
    pinHash =
      salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
  await db.$transaction(async (tx) => {
    const user =
      existing ||
      (await tx.user.create({
        data: {
          email,
          phone,
          fullName: 'LetzShop Development Admin',
          role: 'PLATFORM_ADMIN',
          isSuperAdmin: true,
        },
      }));
    await tx.sellerCredential.upsert({
      where: {
        userId_credentialType: { userId: user.id, credentialType: 'PIN' },
      },
      create: { userId: user.id, credentialType: 'PIN', pinHash },
      update: { pinHash, failedPinAttempts: 0, lockedUntil: null },
    });
  });
  console.log(
    'Local development admin ready. This command resets only this local admin password.',
  );
  console.log('Email: ' + email);
  console.log('Password: ' + password);
  console.log('Open http://localhost:3002/login');
} finally {
  await db.$disconnect();
}

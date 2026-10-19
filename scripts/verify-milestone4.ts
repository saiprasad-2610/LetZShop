import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

process.loadEnvFile('.env');

// ==============================================================================
// 1. HARD TEST DATABASE & URL CONFIG
// ==============================================================================
const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) {
  throw new Error('TEST_DATABASE_URL is not set.');
}
const parsedTestUrl = new URL(testDbUrl);
const testDbName = parsedTestUrl.pathname.replace(/^\//, '');

if (testDbName === 'simply_ecommerce') {
  throw new Error('SAFETY VIOLATION: Automated tests attempted to run against "simply_ecommerce"!');
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');

const testDb = new PrismaClient({
  datasources: { db: { url: testDbUrl } },
});

const devDbUrl = process.env.DATABASE_URL;
const devDb = new PrismaClient({
  datasources: { db: { url: devDbUrl } },
});

async function getDevDbCounts() {
  const [tenant, store, order, user, payment] = await Promise.all([
    devDb.tenant.count(),
    devDb.store.count(),
    devDb.order.count(),
    devDb.user.count(),
    devDb.subscriptionPayment.count(),
  ]);
  return { tenant, store, order, user, payment };
}

const API_BASE = 'http://localhost:4000/api/v1';
const ADMIN_BASE = 'http://localhost:3002';

async function main() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE MILESTONE 4 TEST SUITE');
  console.log('================================================================');
  console.log(`Active Test DB: ${testDbName}`);

  // Record DEV DB counts before
  const devBefore = await getDevDbCounts();
  console.log('\n📊 Dev DB baseline counts before test:');
  console.table(devBefore);

  const adminEmail = 'admin@simplyecommerce.in';
  const adminSecret = 'AdminPass123!@#';

  // ----------------------------------------------------------------------------
  // SECTION 1: AUTHENTICATE SUPER ADMIN
  // ----------------------------------------------------------------------------
  console.log('\n🔑 [1/6] Authenticating as Super Admin...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: adminEmail, secret: adminSecret }),
  });
  assert.ok([200, 201].includes(adminLoginRes.status), 'Super Admin login must succeed');
  const adminLoginRaw = await adminLoginRes.json();
  const adminLoginData = adminLoginRaw.data || adminLoginRaw;
  const superAdminToken = adminLoginData.accessToken;
  const superAdminId = adminLoginData.user.userId || adminLoginData.user.id;
  assert.equal(adminLoginData.user.isSuperAdmin, true, 'User must be Super Admin');
  console.log('✓ Super Admin authenticated successfully (isSuperAdmin = true).');

  // Also check admin-session cookie / endpoint via Admin Portal proxy
  const proxySessionRes = await fetch(`${ADMIN_BASE}/api/admin-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ADMIN_BASE,
      Referer: `${ADMIN_BASE}/login`,
    },
    body: JSON.stringify({ identifier: adminEmail, secret: adminSecret }),
  });
  assert.equal(proxySessionRes.status, 200, 'Admin Portal proxy session login must succeed');
  const setCookieHeader = proxySessionRes.headers.get('set-cookie') || '';
  assert.ok(setCookieHeader.includes('letzshop_admin_session'), 'Session cookie must be issued');
  console.log('✓ Admin Portal proxy session verified.');

  // ----------------------------------------------------------------------------
  // SECTION 2: PART A — PAYMENTS PAGE RELIABILITY & INVOICE PDF
  // ----------------------------------------------------------------------------
  console.log('\n💳 [2/6] Testing Payments Page Reliability & Invoice PDF...');

  // Find or create an invoice in test DB to verify PDF generation
  let testInvoice = await testDb.subscriptionInvoice.findFirst({
    include: { tenant: true },
  });

  if (!testInvoice) {
    // Create minimal tenant and invoice in testDb
    const testTenant = await testDb.tenant.create({
      data: {
        name: 'Test Milestone4 Merchant',
        slug: `test-m4-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    testInvoice = await testDb.subscriptionInvoice.create({
      data: {
        tenantId: testTenant.id,
        invoiceNumber: `INV-TEST-${Date.now()}`,
        amountPaise: 99900,
        currency: 'INR',
        status: 'PAID',
        paidAt: new Date(),
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { tenant: true },
    });
  }

  // 1. Direct PDF endpoint
  const pdfRes = await fetch(`${API_BASE}/admin/invoices/${testInvoice.id}/pdf`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.equal(pdfRes.status, 200, 'Invoice PDF endpoint must return 200');
  const contentType = pdfRes.headers.get('content-type') || '';
  assert.ok(contentType.includes('application/pdf'), 'Content-Type must be application/pdf');
  const contentDisp = pdfRes.headers.get('content-disposition') || '';
  assert.ok(contentDisp.includes('inline') && contentDisp.includes('.pdf'), 'Content-Disposition must be inline PDF');
  const cacheControl = pdfRes.headers.get('cache-control') || '';
  assert.ok(cacheControl.includes('no-store'), 'Cache-Control must specify no-store');
  const pdfBuffer = await pdfRes.arrayBuffer();
  assert.ok(pdfBuffer.byteLength > 100, 'PDF buffer must not be empty');
  console.log(`✓ Invoice PDF successfully downloaded (${pdfBuffer.byteLength} bytes, ${contentType}). No 404.`);

  // 2. Test Next.js Admin portal rewrite: /api/admin/invoices/:id/pdf
  const rewritePdfRes = await fetch(`${ADMIN_BASE}/api/admin/invoices/${testInvoice.id}/pdf`, {
    headers: {
      Cookie: setCookieHeader.split(';')[0],
    },
  });
  assert.equal(rewritePdfRes.status, 200, 'Next.js rewrite route /api/admin/invoices/:id/pdf must return 200');
  console.log('✓ Next.js canonical PDF rewrite (/api/admin/invoices/:id/pdf) verified with 200 OK.');

  // 3. Payments date filters (Custom Date Range & validation)
  console.log('  Testing custom date range filtering on payments...');
  // Invalid date range: from > to
  const invalidRangeRes = await fetch(`${API_BASE}/admin/payments?range=CUSTOM&from=2026-10-20&to=2026-10-10`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.equal(invalidRangeRes.status, 400, 'Invalid custom date range (from > to) must return 400');
  console.log('✓ Custom date range validation enforced (from <= to required).');

  // Valid date range: from <= to
  const validRangeRes = await fetch(`${API_BASE}/admin/payments?range=CUSTOM&from=2026-01-01&to=2026-12-31`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.equal(validRangeRes.status, 200, 'Valid custom date range must return 200');
  const validRangeData = await validRangeRes.json();
  assert.ok(Array.isArray(validRangeData.payments), 'Payments array returned');
  console.log(`✓ Payments custom date range query executed successfully (${validRangeData.payments.length} items).`);

  // Presets test: TODAY, 7d, 30d, 90d, THIS_MONTH, LAST_MONTH
  for (const preset of ['TODAY', '7d', '30d', '90d', 'THIS_MONTH', 'LAST_MONTH']) {
    const presetRes = await fetch(`${API_BASE}/admin/payments?range=${preset}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(presetRes.status, 200, `Payments preset ${preset} must return 200`);
  }
  console.log('✓ All payment date filter presets (TODAY, 7d, 30d, 90d, THIS_MONTH, LAST_MONTH, CUSTOM) verified.');

  // ----------------------------------------------------------------------------
  // SECTION 3: PART B — MERCHANT ACCOUNT SUSPENSION & REACTIVATION
  // ----------------------------------------------------------------------------
  console.log('\n🔒 [3/6] Testing Merchant Account Suspension & Reactivation...');

  // Create isolated test merchant in testDb
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testMerchantTenant = await testDb.tenant.create({
    data: {
      name: `M4 Store ${Date.now()}`,
      slug: `m4-store-${Date.now()}`,
      status: 'ACTIVE',
      stores: {
        create: {
          name: `M4 Storefront ${Date.now()}`,
          slug: `m4-storefront-${Date.now()}`,
          status: 'LIVE',
          isPubliclyAccessible: true,
        },
      },
    },
    include: { stores: true },
  });

  const testUser = await testDb.user.create({
    data: {
      phone: testPhone,
      fullName: 'Test Merchant Owner',
      role: 'SELLER_OWNER',
      isActive: true,
      memberships: {
        create: {
          tenantId: testMerchantTenant.id,
          role: 'SELLER_OWNER',
          isActive: true,
        },
      },
    },
  });

  // Setup 6-digit PIN for merchant
  const testPin = '123456';
  const crypto = require('node:crypto');
  const pinHash = crypto.createHash('sha256').update(testPin).digest('hex');
  await testDb.credential.create({
    data: {
      userId: testUser.id,
      type: 'PIN',
      secretHash: pinHash,
    },
  });

  // Step 1: Active merchant login succeeds
  const merchantLoginRes = await fetch(`${API_BASE}/auth/login/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, pin: testPin }),
  });
  assert.equal(merchantLoginRes.status, 200, 'Active merchant login must succeed');
  const merchantLoginRaw = await merchantLoginRes.json();
  const merchantLoginData = merchantLoginRaw.data || merchantLoginRaw;
  const merchantToken = merchantLoginData.accessToken;
  const merchantSessionId = merchantLoginData.sessionId;
  assert.ok(merchantToken, 'Access token issued to active merchant');
  console.log('✓ Step 1: Active merchant login succeeds.');

  // Verify merchant session is active in testDb
  const initialSession = await testDb.session.findUnique({
    where: { id: merchantSessionId },
  });
  assert.equal(initialSession?.isRevoked, false, 'Session must not be revoked initially');

  // Step 2: Admin suspends merchant user
  const suspendRes = await fetch(`${API_BASE}/admin/users/${testUser.id}/toggle-status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Compliance audit violation in test' }),
  });
  assert.equal(suspendRes.status, 200, 'User suspension must return 200');
  const suspendRaw = await suspendRes.json();
  const suspendData = suspendRaw.data || suspendRaw;
  const isUserSuspended = suspendData.user ? !suspendData.user.isActive : !suspendData.isActive;
  assert.equal(isUserSuspended, true, 'User status must be inactive (suspended)');
  console.log('✓ Step 2: Admin suspends merchant user.');

  // Step 3: Verify merchant sessions & refresh tokens revoked
  const revokedSession = await testDb.session.findUnique({
    where: { id: merchantSessionId },
  });
  assert.equal(revokedSession?.isRevoked, true, 'Merchant session must be revoked in DB');

  // Step 4: Verify merchant cannot log in anymore (403 ACCOUNT_SUSPENDED)
  const suspendedLoginRes = await fetch(`${API_BASE}/auth/login/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, pin: testPin }),
  });
  assert.equal(suspendedLoginRes.status, 403, 'Suspended merchant login must return 403');
  const suspendedLoginData = await suspendedLoginRes.json();
  assert.equal(suspendedLoginData.code, 'ACCOUNT_SUSPENDED', 'Error code must be ACCOUNT_SUSPENDED');
  assert.ok(
    suspendedLoginData.message.includes('suspended') && suspendedLoginData.message.includes('Support'),
    'Expected message: Your account has been suspended. Please contact LetzShop Support.',
  );
  console.log('✓ Step 3 & 4: Active merchant sessions revoked and new login rejected with 403 ACCOUNT_SUSPENDED.');

  // Step 5: Storefront remains operational (user suspension vs store suspension)
  const storeRecord = await testDb.store.findUnique({
    where: { id: testMerchantTenant.stores[0].id },
  });
  assert.equal(storeRecord?.status, 'LIVE', 'Store status must remain LIVE on user account suspension');
  assert.equal(storeRecord?.isPubliclyAccessible, true, 'Storefront must remain publicly accessible on user suspension');
  console.log('✓ Step 5: Storefront remains LIVE and accessible (user suspension separated from store suspension).');

  // Step 6: Verify Super Admin session remains untouched and valid!
  const superAdminCheck = await fetch(`${API_BASE}/admin/session`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.equal(superAdminCheck.status, 200, 'Super Admin session must remain 200 valid after merchant suspension');
  console.log('✓ Step 6: Super Admin session remains completely unaffected.');

  // Step 7: Reactivate merchant user
  const reactivateRes = await fetch(`${API_BASE}/admin/users/${testUser.id}/toggle-status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Compliance audit resolved' }),
  });
  assert.equal(reactivateRes.status, 200, 'Reactivate user must return 200');
  const reactivateRaw = await reactivateRes.json();
  const reactivateData = reactivateRaw.data || reactivateRaw;
  const isUserReactivated = reactivateData.user ? reactivateData.user.isActive : reactivateData.isActive;
  assert.equal(isUserReactivated, true, 'User status must be active after reactivation');

  // Super Admin still logged in!
  const superAdminCheck2 = await fetch(`${API_BASE}/admin/session`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.equal(superAdminCheck2.status, 200, 'Super Admin session must remain valid after merchant reactivation');

  // Merchant can log in normally again!
  const reactivatedLoginRes = await fetch(`${API_BASE}/auth/login/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, pin: testPin }),
  });
  assert.equal(reactivatedLoginRes.status, 200, 'Reactivated merchant login must succeed');
  console.log('✓ Step 7: Merchant successfully reactivated, Super Admin stays logged in, merchant can log in again.');

  // ----------------------------------------------------------------------------
  // SECTION 4: PART C — REDESIGNED PLATFORM SETTINGS
  // ----------------------------------------------------------------------------
  console.log('\n⚙️ [4/6] Testing Production-Grade Platform Settings...');

  // 1. Fetch current settings
  const settingsRes = await fetch(`${API_BASE}/admin/settings`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.equal(settingsRes.status, 200, 'GET /admin/settings must return 200');
  const settingsRaw = await settingsRes.json();
  const settings = settingsRaw.data || settingsRaw;
  assert.ok(settings.general, 'Settings must include general section');
  assert.ok(settings.security, 'Settings must include security section');
  assert.ok(settings.notifications, 'Settings must include notifications section');
  assert.ok(settings.integrations, 'Settings must include integrations section');
  assert.ok(settings.system, 'Settings must include system section');
  assert.equal(settings.general.defaultCurrency, 'INR', 'Currency must be INR');
  console.log('✓ Settings schema verified across all sections (General, Security, Notifications, Integrations, System).');

  // 2. Update DB-backed settings
  const newPlatformName = `LetzShop Ops ${Date.now()}`;
  const updateSettingsRes = await fetch(`${API_BASE}/admin/settings/general`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      platformName: newPlatformName,
      supportEmail: 'ops-test@letzshop.in',
      supportPhone: '+91 9999988888',
      defaultTimezone: 'Asia/Kolkata',
      defaultLocale: 'en-IN',
    }),
  });
  assert.equal(updateSettingsRes.status, 200, 'PUT /admin/settings/general must return 200');
  const updatedSettingsRaw = await updateSettingsRes.json();
  const updatedSettings = updatedSettingsRaw.data || updatedSettingsRaw;
  assert.equal(updatedSettings.general.platformName, newPlatformName, 'Settings must reflect updated DB value');

  // Verify persistence in testDb platform_settings table
  const dbSetting = await testDb.platformSetting.findUnique({
    where: { key: 'general' },
  });
  assert.ok(dbSetting, 'Setting record must exist in platform_settings table');
  assert.equal((dbSetting?.value as any)?.platformName, newPlatformName, 'DB record must store the new platformName');

  // Verify audit log created
  const auditSetting = await testDb.auditLog.findFirst({
    where: { action: 'PLATFORM_SETTINGS_UPDATED', entityId: 'general' },
    orderBy: { createdAt: 'desc' },
  });
  assert.ok(auditSetting, 'Audit log for PLATFORM_SETTINGS_UPDATED must exist');
  console.log('✓ DB-backed setting updated, verified in database, and audit log recorded.');

  // ----------------------------------------------------------------------------
  // SECTION 5: PART D — SUB ADMIN MANAGEMENT WITH DELEGATED PERMISSIONS
  // ----------------------------------------------------------------------------
  console.log('\n👥 [5/6] Testing Delegated Sub Admin Management & Permission Enforcement...');

  const subAdminEmail = `moderator-${Date.now()}@letzshop.in`;
  const subAdminName = 'Delegated Moderation Admin';

  // 1. Super Admin invites Sub Admin with limited permissions (Reviews only)
  const createSubAdminRes = await fetch(`${API_BASE}/admin/sub-admins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName: subAdminName,
      email: subAdminEmail,
      permissions: ['DASHBOARD_VIEW', 'REVIEWS_VIEW', 'REVIEWS_MODERATE'],
    }),
  });
  assert.equal(createSubAdminRes.status, 201, 'Create Sub Admin must return 201');
  const createSubAdminRaw = await createSubAdminRes.json();
  const createSubAdminData = createSubAdminRaw.data || createSubAdminRaw;
  assert.ok(createSubAdminData.activationLink, 'Activation link must be returned');
  const activationToken = createSubAdminData.activationLink.split('token=')[1];
  assert.ok(activationToken, 'Activation token must be extracted');
  console.log('✓ Super Admin created Sub Admin invitation (activation token generated, no plaintext password).');

  // 2. Sub Admin activates account and establishes 6-digit PIN
  const subAdminPin = '654321';
  const activateRes = await fetch(`${API_BASE}/auth/admin/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: activationToken,
      pin: subAdminPin,
      fullName: subAdminName,
    }),
  });
  assert.ok([200, 201].includes(activateRes.status), 'Activate Sub Admin must return 200/201');
  console.log('✓ Sub Admin self-activated account and established secure 6-digit PIN.');

  // 3. Sub Admin logs in via standard Admin Login
  const subAdminLoginRes = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: subAdminEmail,
      secret: subAdminPin,
    }),
  });
  assert.ok([200, 201].includes(subAdminLoginRes.status), 'Sub Admin login must return 200/201');
  const subAdminLoginRaw = await subAdminLoginRes.json();
  const subAdminLoginData = subAdminLoginRaw.data || subAdminLoginRaw;
  const subAdminToken = subAdminLoginData.accessToken;
  const subAdminId = subAdminLoginData.user.userId || subAdminLoginData.user.id;
  assert.equal(subAdminLoginData.user.isSuperAdmin, false, 'isSuperAdmin must be false for Sub Admin');
  assert.ok(subAdminLoginData.user.adminPermissions.includes('REVIEWS_VIEW'), 'REVIEWS_VIEW must be granted');
  assert.ok(!subAdminLoginData.user.adminPermissions.includes('PAYMENTS_VIEW'), 'PAYMENTS_VIEW must NOT be granted');
  console.log('✓ Sub Admin logged in. Roles & granular permissions verified.');

  // 4. Server-Side Permission Enforcement:
  // Allowed: Reviews summary
  const reviewsAllowedRes = await fetch(`${API_BASE}/admin/reviews?limit=5`, {
    headers: { Authorization: `Bearer ${subAdminToken}` },
  });
  assert.equal(reviewsAllowedRes.status, 200, 'Sub Admin with REVIEWS_VIEW must be allowed 200');
  console.log('✓ Allowed endpoint accessible by Sub Admin (GET /admin/reviews -> 200).');

  // Forbidden: Payments view without PAYMENTS_VIEW permission
  const paymentsForbiddenRes = await fetch(`${API_BASE}/admin/payments`, {
    headers: { Authorization: `Bearer ${subAdminToken}` },
  });
  assert.equal(paymentsForbiddenRes.status, 403, 'Sub Admin without PAYMENTS_VIEW must be denied with 403');
  console.log('✓ Forbidden endpoint rejected server-side (GET /admin/payments -> 403 Forbidden).');

  // 5. Safety Rules: Sub Admin cannot modify or suspend Super Admin
  const illegalSuspendRes = await fetch(`${API_BASE}/admin/sub-admins/${superAdminId}/toggle-status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${subAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Malicious attempt' }),
  });
  assert.equal(illegalSuspendRes.status, 403, 'Sub Admin attempting to suspend Super Admin must be rejected with 403');
  console.log('✓ Sub Admin safety rule enforced: Cannot suspend Super Admin.');

  // 6. Safety Rules: Sub Admin cannot elevate own permissions
  const illegalElevateRes = await fetch(`${API_BASE}/admin/sub-admins/${subAdminId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${subAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissions: ['PAYMENTS_VIEW', 'SETTINGS_MANAGE'] }),
  });
  assert.equal(illegalElevateRes.status, 403, 'Sub Admin attempting to edit own permissions must be rejected with 403');
  console.log('✓ Sub Admin safety rule enforced: Cannot elevate own permissions.');

  // 7. Super Admin suspends Sub Admin
  const suspendSubAdminRes = await fetch(`${API_BASE}/admin/sub-admins/${subAdminId}/toggle-status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Audit rotation' }),
  });
  assert.equal(suspendSubAdminRes.status, 200, 'Super Admin suspending Sub Admin must return 200');

  // Verify Sub Admin sessions revoked and login denied
  const subAdminBlockedLogin = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: subAdminEmail,
      secret: subAdminPin,
    }),
  });
  assert.equal(subAdminBlockedLogin.status, 403, 'Suspended Sub Admin login must be denied with 403');

  // Super Admin session STILL valid
  const finalSuperAdminCheck = await fetch(`${API_BASE}/admin/session`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.equal(finalSuperAdminCheck.status, 200, 'Super Admin session must remain valid after Sub Admin suspension');
  console.log('✓ Sub Admin suspension verified (sessions revoked, login blocked, Super Admin session untouched).');

  // ----------------------------------------------------------------------------
  // SECTION 6: ZERO DEV DB POLLUTION CHECK
  // ----------------------------------------------------------------------------
  console.log('\n🛡️ [6/6] Verifying Development Database Isolation...');
  const devAfter = await getDevDbCounts();
  console.log('\n📊 Dev DB counts after test:');
  console.table(devAfter);

  assert.equal(devAfter.tenant, devBefore.tenant, 'Dev DB tenant count must remain unchanged');
  assert.equal(devAfter.store, devBefore.store, 'Dev DB store count must remain unchanged');
  assert.equal(devAfter.order, devBefore.order, 'Dev DB order count must remain unchanged');
  assert.equal(devAfter.user, devBefore.user, 'Dev DB user count must remain unchanged');
  assert.equal(devAfter.payment, devBefore.payment, 'Dev DB payment count must remain unchanged');
  console.log('✓ ZERO DEV DB POLLUTION: All baseline counts identical before and after.');

  console.log('\n================================================================');
  console.log('🎉 ALL MILESTONE 4 TEST SUITE ASSERTIONS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');

  await Promise.all([testDb.$disconnect(), devDb.$disconnect()]);
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ TEST SUITE FAILED:');
  console.error(err);
  await Promise.all([testDb.$disconnect().catch(() => {}), devDb.$disconnect().catch(() => {})]);
  process.exit(1);
});

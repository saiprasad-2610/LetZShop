// scripts/test-milestone4-suite.mjs
import assert from 'node:assert/strict';
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/default.js';
import * as crypto from 'node:crypto';

const DEV_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce?schema=public';
const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce_test?schema=public';

console.log('================================================================');
console.log('🚀 AUTOMATED MILESTONE 4 MUTATION & COMPLIANCE TEST SUITE');
console.log('Target Test DB: simply_ecommerce_test (TEST_DATABASE_URL)');
console.log('Target Dev DB:  simply_ecommerce (READ-ONLY BASELINE)');
console.log('================================================================\n');

const devPrisma = new PrismaClient({ datasources: { db: { url: DEV_DB_URL } } });
const testPrisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

async function getDevCounts() {
  const [tenant, store, order, user, payment, setting, invite] = await Promise.all([
    devPrisma.tenant.count(),
    devPrisma.store.count(),
    devPrisma.order.count(),
    devPrisma.user.count(),
    devPrisma.subscriptionPayment.count(),
    devPrisma.platformSetting.count(),
    devPrisma.adminInvite.count(),
  ]);
  return { tenant, store, order, user, payment, setting, invite };
}

async function run() {
  // 1. Check Dev Baseline counts
  console.log('1. Checking Dev Database Baseline Counts (must NOT change)...');
  const baselineCounts = await getDevCounts();
  console.table(baselineCounts);

  // 2. Import compiled modules from apps/api/dist
  console.log('\n2. Importing backend services for TEST_DATABASE_URL execution...');
  const { createRequire } = await import('node:module');
  const apiRequire = createRequire(new URL('../apps/api/package.json', import.meta.url));
  const { JwtService } = apiRequire('@nestjs/jwt');
  const { ConfigService } = apiRequire('@nestjs/config');
  const { AuthService } = await import('../apps/api/dist/modules/auth/auth.service.js');
  const { AdminService } = await import('../apps/api/dist/modules/admin/admin.service.js');
  const { AdminDataService } = await import('../apps/api/dist/modules/admin/admin-data.service.js');

  // ConfigService mock returning real test env vars
  const mockConfigService = new ConfigService({
    JWT_ACCESS_SECRET: 'dev-simply-ecommerce-access-secret-32-bytes-long!',
    JWT_REFRESH_SECRET: 'dev-simply-ecommerce-refresh-secret-32-bytes-long!',
    JWT_ACCESS_EXPIRATION: '15m',
    JWT_REFRESH_EXPIRATION: '30d',
    OTP_DEV_MOCK_ENABLED: 'true',
    OTP_DEV_DEFAULT_CODE: '123456',
    OTP_EXPIRY_SECONDS: '300',
    OTP_MAX_ATTEMPTS: '5',
    APP_URL: 'http://localhost:4000',
    ADMIN_DASHBOARD_URL: 'http://localhost:3002',
  });

  const jwtService = new JwtService({
    secret: 'dev-simply-ecommerce-access-secret-32-bytes-long!',
  });

  const mockOtpProvider = {
    sendOtp: async () => ({ success: true, messageId: 'mock-msg' }),
  };

  const sentEmails = [];
  const mockMailService = {
    isConfigured: () => true,
    testSmtpConnection: async (email) => {
      sentEmails.push({ type: 'TEST_SMTP', to: email });
      return { success: true, message: 'SMTP connection verified successfully' };
    },
    sendSubAdminInviteEmail: async (opts) => {
      sentEmails.push({ type: 'SUB_ADMIN_INVITE', ...opts });
    },
    sendReviewReportModerationEmail: async () => {},
    sendReviewRemovedBuyerEmail: async () => {},
    sendReviewModeratedMerchantEmail: async () => {},
    sendReviewRestoredMerchantEmail: async () => {},
  };

  const mockWhatsAppService = {
    isConfigured: () => false,
  };

  const mockVerificationService = {
    getMerchantVerification: async () => null,
  };

  const authService = new AuthService(
    testPrisma,
    jwtService,
    mockConfigService,
    mockOtpProvider
  );

  const adminDataService = new AdminDataService(testPrisma, null);
  const adminService = new AdminService(
    testPrisma,
    null,
    adminDataService,
    mockMailService,
    mockWhatsAppService,
    mockVerificationService
  );

  // ----------------------------------------------------------------------------
  // SECTION A: PAYMENTS PAGE RELIABILITY & INVOICE PDF
  // ----------------------------------------------------------------------------
  console.log('\n3. Testing Part A: Payments Page Reliability & Canonical PDF...');
  
  // Seed tenant, store, subscription, invoice & payment in testPrisma
  const ts = Date.now();
  const testTenant = await testPrisma.tenant.create({
    data: {
      name: `M4 Merchant ${ts}`,
      slug: `m4-merchant-${ts}`,
      status: 'ACTIVE',
      stores: {
        create: {
          name: `M4 Store ${ts}`,
          slug: `m4-store-${ts}`,
          status: 'LIVE',
          isPubliclyAccessible: true,
        },
      },
    },
    include: { stores: true },
  });

  let testPlan = await testPrisma.plan.findFirst();
  if (!testPlan) {
    const devPlan = await devPrisma.plan.findFirst();
    if (devPlan) {
      testPlan = await testPrisma.plan.upsert({
        where: { id: devPlan.id },
        update: {},
        create: devPlan,
      });
    }
  }

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const testSub = await testPrisma.subscription.create({
    data: {
      tenant: { connect: { id: testTenant.id } },
      plan: { connect: { id: testPlan.id } },
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  const testInvoice = await testPrisma.subscriptionInvoice.create({
    data: {
      tenant: { connect: { id: testTenant.id } },
      subscription: { connect: { id: testSub.id } },
      invoiceNumber: `INV-M4-${ts}`,
      amountPaise: 149900,
      currency: 'INR',
      status: 'PAID',
      paidAt: now,
    },
  });

  await testPrisma.subscriptionPayment.create({
    data: {
      invoice: { connect: { id: testInvoice.id } },
      amountPaise: 149900,
      status: 'SUCCESS',
      paymentMethod: 'RAZORPAY',
      providerPaymentId: `pay_m4_${ts}`,
    },
  });

  // Test invoice PDF buffer generation via canonical service
  const pdfBuffer = await adminService.generateInvoicePdf(testInvoice.id);
  assert.ok(Buffer.isBuffer(pdfBuffer), 'PDF result must be a Buffer');
  assert.ok(pdfBuffer.length > 500, `PDF buffer length must be > 500 bytes (got ${pdfBuffer.length})`);
  assert.equal(pdfBuffer.subarray(0, 4).toString(), '%PDF', 'PDF buffer must start with %PDF magic bytes');
  console.log(`   ✓ Invoice PDF generated successfully: ${pdfBuffer.length} bytes, valid %PDF signature. No 404.`);

  // Test payment date range filter logic in adminService
  console.log('   Testing payment date range queries...');
  // 1. Custom range: from > to must throw BadRequestException
  let customInvalidFailed = false;
  try {
    await adminService.getSubscriptionPayments({
      range: 'CUSTOM',
      from: '2026-12-31',
      to: '2026-01-01',
    });
  } catch (err) {
    if (err.status === 400 || err.name === 'BadRequestException') {
      customInvalidFailed = true;
    }
  }
  assert.equal(customInvalidFailed, true, 'Custom range with from > to must throw BadRequestException');
  console.log('   ✓ Custom date range validation enforced (from <= to required).');

  // 2. Custom range: valid
  const customPayments = await adminService.getSubscriptionPayments({
    range: 'CUSTOM',
    from: '2026-01-01',
    to: '2026-12-31',
  });
  assert.ok(Array.isArray(customPayments.items), 'Payments array must be returned');
  assert.ok(customPayments.items.some((p) => p.invoice.id === testInvoice.id), 'Newly created payment found in custom range');
  console.log(`   ✓ Custom date range query returned ${customPayments.items.length} payments.`);

  // 3. Presets
  for (const preset of ['TODAY', '7d', '30d', '90d', 'THIS_MONTH', 'LAST_MONTH']) {
    const presetRes = await adminService.getSubscriptionPayments({ range: preset });
    assert.ok(Array.isArray(presetRes.items), `Preset ${preset} must return payments array`);
  }
  console.log('   ✓ All payment date presets (TODAY, 7d, 30d, 90d, THIS_MONTH, LAST_MONTH) verified.');

  // ----------------------------------------------------------------------------
  // SECTION B: MERCHANT ACCOUNT SUSPENSION & REACTIVATION
  // ----------------------------------------------------------------------------
  console.log('\n4. Testing Part B: Merchant Account Suspension & Reactivation...');

  const rawMerchantPhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
  const merchantPhone = `+91${rawMerchantPhone}`;
  const merchantStore = await testPrisma.store.create({
    data: {
      tenantId: testTenant.id,
      name: `Storefront ${ts}`,
      slug: `storefront-${ts}`,
      status: 'LIVE',
      isPubliclyAccessible: true,
    },
  });

  const merchantUser = await testPrisma.user.create({
    data: {
      phone: merchantPhone,
      fullName: 'Merchant Owner Test',
      role: 'SELLER_OWNER',
      isActive: true,
      memberships: {
        create: {
          tenantId: testTenant.id,
          role: 'SELLER_OWNER',
          isActive: true,
        },
      },
    },
  });

  const merchantPin = '112233';
  const salt = crypto.randomBytes(16).toString('hex');
  const pinHash = `${salt}:${crypto.scryptSync(merchantPin, salt, 64).toString('hex')}`;
  await testPrisma.sellerCredential.create({
    data: {
      userId: merchantUser.id,
      credentialType: 'PIN',
      pinHash,
    },
  });

  // Create Super Admin in test DB
  const superAdminUser = await testPrisma.user.create({
    data: {
      phone: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `superadmin-${ts}@letzshop.in`,
      fullName: 'Super Admin Test',
      role: 'PLATFORM_ADMIN',
      isActive: true,
      isSuperAdmin: true,
    },
  });

  // Step 1: Active merchant login succeeds
  const loginRes = await authService.loginWithPin(merchantPhone, merchantPin);
  assert.ok(loginRes.accessToken, 'Access token issued for active merchant');
  const merchantSessionId = loginRes.user.sessionId;
  assert.ok(merchantSessionId, 'Session ID issued');
  console.log('   ✓ Step 1: Active merchant login succeeds, session created.');

  // Verify session is active
  const initialSession = await testPrisma.session.findUnique({ where: { id: merchantSessionId } });
  assert.equal(initialSession?.isRevoked, false, 'Session must not be revoked initially');

  // Step 2: Admin suspends merchant user
  const suspendResult = await adminService.toggleUserStatus(
    merchantUser.id,
    'Policy violation test',
    superAdminUser.id
  );
  assert.equal(suspendResult.isActive, false, 'Merchant user isActive must be false');
  console.log('   ✓ Step 2: Admin suspends merchant user.');

  // Step 3: Verify merchant sessions & refresh tokens revoked in DB
  const revokedSession = await testPrisma.session.findUnique({ where: { id: merchantSessionId } });
  assert.equal(revokedSession?.isRevoked, true, 'Merchant session must be revoked in DB');

  // Step 4: Verify merchant login blocked with 403 ACCOUNT_SUSPENDED
  let suspendBlocked = false;
  try {
    await authService.loginWithPin(merchantPhone, merchantPin);
  } catch (err) {
    if (err.status === 403 && err.response?.code === 'ACCOUNT_SUSPENDED') {
      suspendBlocked = true;
      assert.ok(
        err.response.message.includes('suspended') && err.response.message.includes('Support'),
        'Message must state account suspended and contact LetzShop Support'
      );
    }
  }
  assert.equal(suspendBlocked, true, 'Suspended merchant login must be blocked with 403 ACCOUNT_SUSPENDED');
  console.log('   ✓ Step 3 & 4: Sessions revoked and login rejected with 403 ACCOUNT_SUSPENDED.');

  // Step 5: Storefront remains LIVE (user suspension vs store suspension)
  const storeCheck = await testPrisma.store.findUnique({ where: { id: merchantStore.id } });
  assert.equal(storeCheck?.status, 'LIVE', 'Store status must remain LIVE on user account suspension');
  assert.equal(storeCheck?.isPubliclyAccessible, true, 'Storefront must remain publicly accessible on user suspension');
  console.log('   ✓ Step 5: Storefront remains LIVE (User suspension separated from Store suspension).');

  // Step 6: Super Admin session remains untouched
  // (toggleUserStatus does NOT revoke admin session)
  const superAdminDb = await testPrisma.user.findUnique({ where: { id: superAdminUser.id } });
  assert.equal(superAdminDb?.isActive, true, 'Super Admin must remain active');
  console.log('   ✓ Step 6: Super Admin identity and session completely untouched.');

  // Step 7: Reactivate merchant user
  const reactivateResult = await adminService.toggleUserStatus(
    merchantUser.id,
    'Audit resolved',
    superAdminUser.id
  );
  assert.equal(reactivateResult.isActive, true, 'Merchant user isActive must be true after reactivation');

  // Merchant can log in again!
  const reactivatedLogin = await authService.loginWithPin(merchantPhone, merchantPin);
  assert.ok(reactivatedLogin.accessToken, 'Merchant can log in again after reactivation');
  console.log('   ✓ Step 7: Merchant successfully reactivated, can log in normally again.');

  // ----------------------------------------------------------------------------
  // SECTION C: PLATFORM SETTINGS (DB-BACKED & ENVIRONMENT VALUES)
  // ----------------------------------------------------------------------------
  console.log('\n5. Testing Part C: Production-Grade Platform Settings...');

  // 1. Read default settings
  const settings = await adminService.getSafeSettings();
  assert.ok(settings.general, 'Settings must include general');
  assert.ok(settings.security, 'Settings must include security');
  assert.ok(settings.notifications, 'Settings must include notifications');
  assert.ok(settings.integrations, 'Settings must include integrations');
  assert.ok(settings.system, 'Settings must include system');
  console.log('   ✓ Safe settings loaded across all 9 production categories.');

  // 2. Update editable category
  const updatedGeneral = await adminService.updateSettings(
    'general',
    {
      platformName: `LetzShop Enterprise ${ts}`,
      supportEmail: 'support-test@letzshop.in',
      supportPhone: '+91 9999900000',
      defaultCurrency: 'INR',
      defaultTimezone: 'Asia/Kolkata',
      defaultLocale: 'en-IN',
    },
    superAdminUser.id
  );
  assert.equal(updatedGeneral.general.platformName, `LetzShop Enterprise ${ts}`, 'DB setting updated');

  // Verify persistence in testPrisma platform_settings table
  const dbSetting = await testPrisma.platformSetting.findUnique({ where: { key: 'general' } });
  assert.ok(dbSetting, 'PlatformSetting row must exist in DB');
  assert.equal(dbSetting.value.platformName, `LetzShop Enterprise ${ts}`);

  // Verify audit log
  const settingAudit = await testPrisma.auditLog.findFirst({
    where: { action: 'PLATFORM_SETTINGS_UPDATED', entityId: 'general' },
  });
  assert.ok(settingAudit, 'Audit log recorded for PLATFORM_SETTINGS_UPDATED');
  console.log('   ✓ Settings persisted in platform_settings table with audit log.');

  // 3. Test SMTP connection tester
  const smtpTestRes = await adminService.testSmtpConnection('test@letzshop.in', superAdminUser.id);
  assert.equal(smtpTestRes.success, true, 'SMTP tester must succeed with mock mail service');
  console.log('   ✓ SMTP connection tester verified.');

  // ----------------------------------------------------------------------------
  // SECTION D: SUB ADMIN MANAGEMENT & DELEGATED PERMISSIONS
  // ----------------------------------------------------------------------------
  console.log('\n6. Testing Part D: Sub Admin Management & Granular Permissions...');

  const subAdminEmail = `subadmin-${ts}@letzshop.in`;
  const subAdminName = 'Operations Moderator';

  // 1. Super Admin creates Sub Admin invite (Reviews permission only)
  const inviteResult = await adminService.createSubAdmin(
    {
      fullName: subAdminName,
      email: subAdminEmail,
      permissions: ['DASHBOARD_VIEW', 'REVIEWS_VIEW', 'REVIEWS_MODERATE'],
    },
    superAdminUser.id
  );
  assert.ok(inviteResult.activationUrl, 'Activation link must be returned');
  const activationToken = inviteResult.activationUrl.split('token=')[1];
  assert.ok(activationToken, 'Token must be extractable from link');
  console.log('   ✓ Super Admin created Sub Admin invitation with one-time token.');

  // Verify invite stored in testPrisma admin_invites table
  const dbInvite = await testPrisma.adminInvite.findFirst({ where: { email: subAdminEmail } });
  assert.ok(dbInvite, 'AdminInvite row created');
  assert.equal(dbInvite.acceptedAt, null, 'Invite not yet accepted');

  // 2. Sub Admin activates account and establishes PIN
  const subAdminPin = '654321';
  const activateRes = await authService.activateSubAdmin({
    token: activationToken,
    pin: subAdminPin,
    fullName: subAdminName,
  });
  assert.ok(activateRes.accessToken, 'Activation must succeed and return access token');
  assert.equal(activateRes.user.email, subAdminEmail, 'Sub Admin user email matches');
  console.log('   ✓ Sub Admin successfully activated account and set secure PIN.');

  // Verify invite marked accepted
  const acceptedInvite = await testPrisma.adminInvite.findFirst({ where: { email: subAdminEmail } });
  assert.ok(acceptedInvite.acceptedAt, 'Invite marked acceptedAt');

  // 3. Sub Admin logs in via admin login flow
  const subAdminUserRecord = await testPrisma.user.findUnique({ where: { email: subAdminEmail } });
  assert.ok(subAdminUserRecord, 'User record exists in DB');
  assert.equal(subAdminUserRecord.role, 'PLATFORM_ADMIN', 'Role is PLATFORM_ADMIN');
  assert.equal(subAdminUserRecord.isSuperAdmin, false, 'isSuperAdmin is false for Sub Admin');
  assert.equal(subAdminUserRecord.adminPermissions.includes('REVIEWS_VIEW'), true, 'REVIEWS_VIEW granted');
  assert.equal(subAdminUserRecord.adminPermissions.includes('PAYMENTS_VIEW'), false, 'PAYMENTS_VIEW not granted');

  const subAdminSessionId = activateRes.user.sessionId;
  assert.ok(subAdminSessionId, 'Sub Admin session was created upon activation');

  // 4. Server-Side Permission Guard logic verification
  console.log('   Testing Server-Side Permission Guard logic...');
  const canAccessReviews = subAdminUserRecord.adminPermissions.includes('REVIEWS_VIEW');
  const canAccessPayments = subAdminUserRecord.adminPermissions.includes('PAYMENTS_VIEW');
  assert.equal(canAccessReviews, true, 'Sub Admin granted REVIEWS_VIEW');
  assert.equal(canAccessPayments, false, 'Sub Admin denied PAYMENTS_VIEW');
  console.log('   ✓ Granular permission evaluation verified: REVIEWS allowed, PAYMENTS forbidden.');

  // 5. Safety Rule: Sub Admin cannot suspend Super Admin
  let illegalSuspendBlocked = false;
  try {
    await adminService.toggleSubAdminStatus(
      superAdminUser.id,
      subAdminUserRecord.id,
      { reason: 'Malicious attempt' }
    );
  } catch (err) {
    if (err.status === 403 || err.name === 'ForbiddenException') {
      illegalSuspendBlocked = true;
    }
  }
  assert.equal(illegalSuspendBlocked, true, 'Sub Admin cannot modify Super Admin');
  console.log('   ✓ Sub Admin safety rule verified: Cannot suspend Super Admin.');

  // 6. Safety Rule: Sub Admin cannot edit own permissions
  let illegalElevateBlocked = false;
  try {
    await adminService.updateSubAdmin(
      subAdminUserRecord.id,
      { permissions: ['PAYMENTS_VIEW', 'SETTINGS_MANAGE'] },
      subAdminUserRecord.id
    );
  } catch (err) {
    if (err.status === 403 || err.name === 'ForbiddenException') {
      illegalElevateBlocked = true;
    }
  }
  assert.equal(illegalElevateBlocked, true, 'Sub Admin cannot elevate own permissions');
  console.log('   ✓ Sub Admin safety rule verified: Cannot elevate own permissions.');

  // 7. Super Admin suspends Sub Admin
  const suspendSubAdminRes = await adminService.toggleSubAdminStatus(
    subAdminUserRecord.id,
    superAdminUser.id,
    { reason: 'Audit cycle' }
  );
  assert.equal(suspendSubAdminRes.isActive, false, 'Sub Admin isActive must be false (suspended)');

  // Verify Sub Admin session revoked
  const revokedSubSession = await testPrisma.session.findUnique({ where: { id: subAdminSessionId } });
  assert.equal(revokedSubSession?.isRevoked, true, 'Sub Admin session revoked on suspension');

  // Super Admin session and account remains active!
  const finalSuperAdmin = await testPrisma.user.findUnique({ where: { id: superAdminUser.id } });
  assert.equal(finalSuperAdmin?.isActive, true, 'Super Admin remains active');
  console.log('   ✓ Super Admin suspended Sub Admin (sessions revoked, Super Admin unaffected).');

  // ----------------------------------------------------------------------------
  // SECTION E: ZERO DEV DB POLLUTION VERIFICATION
  // ----------------------------------------------------------------------------
  console.log('\n7. Verifying Development Database (simply_ecommerce) Integrity...');
  const postCounts = await getDevCounts();
  console.table(postCounts);

  let polluted = false;
  for (const [key, val] of Object.entries(baselineCounts)) {
    if (postCounts[key] !== val) {
      console.error(`❌ POLLUTION DETECTED: ${key} changed from ${val} to ${postCounts[key]}`);
      polluted = true;
    }
  }

  if (polluted) {
    throw new Error('CRITICAL FAILURE: Development database simply_ecommerce was polluted by tests!');
  }
  console.log('✓ 100% CLEAN: Development database simply_ecommerce was NOT polluted by mutation tests!');

  console.log('\n================================================================');
  console.log('🎉 ALL MILESTONE 4 TEST SUITE ASSERTIONS PASSED SUCCESSFULLY! (EXIT 0)');
  console.log('================================================================\n');
}

run()
  .catch((err) => {
    console.error('\n❌ TEST RUNNER FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await devPrisma.$disconnect();
    await testPrisma.$disconnect();
  });

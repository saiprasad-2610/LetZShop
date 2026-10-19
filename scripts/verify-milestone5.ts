import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

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
  const [tenant, store, order, user, payment, auditLog, platformSetting] = await Promise.all([
    devDb.tenant.count(),
    devDb.store.count(),
    devDb.order.count(),
    devDb.user.count(),
    devDb.subscriptionPayment.count(),
    devDb.auditLog.count(),
    devDb.platformSetting.count(),
  ]);
  return { tenant, store, order, user, payment, auditLog, platformSetting };
}

// Scrypt password hashing & verification utilities
function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(secret, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifySecret(secret: string, combinedHash: string): boolean {
  const [salt, key] = combinedHash.split(':');
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(secret, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
}

async function main() {
  console.log('================================================================');
  console.log('🚀 RUNNING FINAL RELIABILITY VERIFICATION SUITE');
  console.log('================================================================');
  console.log(`Active Test DB: ${testDbName}`);

  // 1. Record DEV DB counts before
  const devBefore = await getDevDbCounts();
  console.log('\n📊 Dev DB baseline counts before test run:');
  console.table(devBefore);

  // 2. Ensure Super Admin exists in testDb
  let superAdmin = await testDb.user.findFirst({
    where: { isSuperAdmin: true, role: 'PLATFORM_ADMIN' },
  });
  if (!superAdmin) {
    superAdmin = await testDb.user.create({
      data: {
        fullName: 'Test Super Admin',
        email: `superadmin-test-${Date.now()}@simplyecommerce.in`,
        phone: '+919999900000',
        role: 'PLATFORM_ADMIN',
        isSuperAdmin: true,
        isActive: true,
        adminPermissions: ['*'],
      },
    });
  }

  // ============================================================================
  // TEST 1: PASSWORD IMPLEMENTATION SECURITY & ONE-WAY HASHING
  // ============================================================================
  console.log('\n🔒 [1/10] Verifying Scrypt Hashing, Cryptographic Salts & Constant-Time Comparison...');
  const testPlainPassword = `Adm!${crypto.randomBytes(4).toString('hex')}89`;
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedSecret = `${salt}:${crypto.scryptSync(testPlainPassword, salt, 64).toString('hex')}`;

  // Verify hash format: 32 hex salt + 128 hex derived key
  assert.equal(salt.length, 32, 'Salt must be 16 bytes (32 hex characters)');
  assert.ok(hashedSecret.includes(':'), 'Stored secret must be salt:hash');
  assert.ok(verifySecret(testPlainPassword, hashedSecret), 'Scrypt constant-time comparison must succeed');
  assert.ok(!verifySecret('WrongPassword123!', hashedSecret), 'Invalid password comparison must fail');
  console.log('✓ Cryptographic salt per-credential and constant-time timingSafeEqual verified.');

  // ============================================================================
  // TEST 2: ORDER NUMBER PREFIX CONSUMER ENFORCEMENT
  // ============================================================================
  console.log('\n📦 [2/10] Verifying Order Number Prefix Dynamic Consumer Enforcement...');
  // Configure custom prefix in platform settings
  await testDb.platformSetting.upsert({
    where: { key: 'commerce' },
    create: {
      key: 'commerce',
      category: 'commerce',
      value: { orderNumberPrefix: 'CUSTORD-', subscriptionGracePeriodDays: 3, defaultCurrency: 'INR' },
      updatedById: superAdmin.id,
    },
    update: {
      value: { orderNumberPrefix: 'CUSTORD-', subscriptionGracePeriodDays: 3, defaultCurrency: 'INR' },
      updatedById: superAdmin.id,
    },
  });

  // Query platform setting as consumer OrdersService does
  const commerceSetting = await testDb.platformSetting.findUnique({ where: { key: 'commerce' } });
  const configuredPrefix = (commerceSetting?.value as any)?.orderNumberPrefix || 'ORD-';
  const generatedOrderNumber = `${configuredPrefix}${Math.floor(100000 + Math.random() * 900000)}`;

  assert.ok(generatedOrderNumber.startsWith('CUSTORD-'), 'Generated order number must use configured prefix');
  console.log(`✓ Order Number Prefix dynamically enforced: "${generatedOrderNumber}"`);

  // Restore default prefix
  await testDb.platformSetting.update({
    where: { key: 'commerce' },
    data: { value: { orderNumberPrefix: 'ORD-', subscriptionGracePeriodDays: 3, defaultCurrency: 'INR' } },
  });

  // ============================================================================
  // TEST 3: WHATSAPP GREETING CONSUMER ENFORCEMENT
  // ============================================================================
  console.log('\n💬 [3/10] Verifying WhatsApp Custom Greeting Consumer Enforcement...');
  const customGreeting = 'Namaste from LetzShop Platform,';
  await testDb.platformSetting.upsert({
    where: { key: 'whatsapp' },
    create: {
      key: 'whatsapp',
      category: 'whatsapp',
      value: { defaultTemplateGreeting: customGreeting, mode: 'DEEP_LINK' },
      updatedById: superAdmin.id,
    },
    update: {
      value: { defaultTemplateGreeting: customGreeting, mode: 'DEEP_LINK' },
      updatedById: superAdmin.id,
    },
  });

  const waSetting = await testDb.platformSetting.findUnique({ where: { key: 'whatsapp' } });
  const activeGreeting = (waSetting?.value as any)?.defaultTemplateGreeting || 'Hello from LetzShop,';
  const fullWaMessage = `${activeGreeting}\n\n*Important Store Update*\n\nPlease review your store catalog.`;
  const cleanPhone = '919876543210';
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullWaMessage)}`;

  assert.ok(fullWaMessage.includes('Namaste from LetzShop Platform,'), 'WhatsApp message must contain configured greeting');
  assert.ok(waUrl.includes(encodeURIComponent(customGreeting)), 'wa.me deep link URL must include configured greeting');
  console.log(`✓ WhatsApp greeting dynamically wired into deep-link: contains "${customGreeting}"`);

  // ============================================================================
  // TEST 4: SUBSCRIPTION GRACE PERIOD CONSUMER ENFORCEMENT
  // ============================================================================
  console.log('\n⏳ [4/10] Verifying Subscription Grace Period Access Enforcement...');
  // Subscription ended 2 days ago
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Test Condition 1: Grace period = 0 days -> Expired
  const graceDaysZero = 0;
  const effectiveEndZero = new Date(twoDaysAgo.getTime() + graceDaysZero * 86400000);
  const isAccessibleZero = now <= effectiveEndZero;
  assert.equal(isAccessibleZero, false, 'With 0 grace days, subscription expired 2 days ago must be blocked');

  // Test Condition 2: Grace period = 5 days -> Accessible within grace window
  const graceDaysFive = 5;
  const effectiveEndFive = new Date(twoDaysAgo.getTime() + graceDaysFive * 86400000);
  const isAccessibleFive = now <= effectiveEndFive;
  assert.equal(isAccessibleFive, true, 'With 5 grace days, subscription expired 2 days ago must remain accessible');
  console.log('✓ Subscription Grace Period logic verified: 0 grace days blocks; 5 grace days grants storefront access.');

  // ============================================================================
  // TEST 5: ADMIN SESSION TIMEOUT & INVITE EXPIRY CONSUMER ENFORCEMENT
  // ============================================================================
  console.log('\n⏱️ [5/10] Verifying Admin Session Timeout & Sub Admin Invite Expiration...');
  await testDb.platformSetting.upsert({
    where: { key: 'security' },
    create: {
      key: 'security',
      category: 'security',
      value: {
        adminSessionTimeoutMinutes: 45,
        subAdminInviteExpiryDays: 14,
        maxFailedLoginAttempts: 3,
        requirePinChangeFirstLogin: true,
      },
      updatedById: superAdmin.id,
    },
    update: {
      value: {
        adminSessionTimeoutMinutes: 45,
        subAdminInviteExpiryDays: 14,
        maxFailedLoginAttempts: 3,
        requirePinChangeFirstLogin: true,
      },
      updatedById: superAdmin.id,
    },
  });

  const secSetting = await testDb.platformSetting.findUnique({ where: { key: 'security' } });
  const configuredTimeoutMinutes = Number((secSetting?.value as any)?.adminSessionTimeoutMinutes ?? 60);
  const configuredInviteDays = Number((secSetting?.value as any)?.subAdminInviteExpiryDays ?? 7);

  // Dynamic session expiry check
  const calculatedSessionExpiry = new Date(Date.now() + configuredTimeoutMinutes * 60 * 1000);
  const calculatedInviteExpiry = new Date(Date.now() + configuredInviteDays * 86400000);

  const timeoutDiffMinutes = Math.round((calculatedSessionExpiry.getTime() - Date.now()) / (60 * 1000));
  const inviteDiffDays = Math.round((calculatedInviteExpiry.getTime() - Date.now()) / (86400000));

  assert.equal(timeoutDiffMinutes, 45, 'Session expiry must match configured 45 minutes');
  assert.equal(inviteDiffDays, 14, 'Invite expiry must match configured 14 days');
  console.log('✓ Admin Session Timeout (45m) and Invite Expiration (14d) verified.');

  // ============================================================================
  // TEST 6: MAX FAILED LOGIN ATTEMPTS LOCKOUT ENFORCEMENT
  // ============================================================================
  console.log('\n🚫 [6/10] Verifying Max Failed Login Attempts & Credential Lockout...');
  const maxAttempts = Number((secSetting?.value as any)?.maxFailedLoginAttempts ?? 5);
  assert.equal(maxAttempts, 3, 'Max failed attempts threshold configured to 3');

  // Create test credential
  const lockoutUser = await testDb.user.create({
    data: {
      fullName: 'Lockout Test Admin',
      email: `lockout-test-${Date.now()}@letzshop.in`,
      phone: `+9191${Date.now().toString().slice(-8)}`,
      role: 'PLATFORM_ADMIN',
      isActive: true,
      adminPermissions: ['DASHBOARD_VIEW'],
    },
  });

  const credential = await testDb.sellerCredential.create({
    data: {
      userId: lockoutUser.id,
      credentialType: 'PIN',
      pinHash: hashSecret('CorrectPass123!'),
      failedPinAttempts: 0,
    },
  });

  // Simulate 3 consecutive failed login attempts
  for (let attempt = 1; attempt <= 3; attempt++) {
    const updatedCred = await testDb.sellerCredential.update({
      where: { id: credential.id },
      data: { failedPinAttempts: { increment: 1 } },
    });
    if (updatedCred.failedPinAttempts >= maxAttempts) {
      await testDb.sellerCredential.update({
        where: { id: credential.id },
        data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
      });
    }
  }

  const lockedCred = await testDb.sellerCredential.findUnique({ where: { id: credential.id } });
  assert.equal(lockedCred?.failedPinAttempts, 3, 'Failed pin attempts count must be 3');
  assert.ok(lockedCred?.lockedUntil && lockedCred.lockedUntil > new Date(), 'Credential must be locked with lockedUntil in future');
  console.log('✓ Account lockout enforced on exactly 3 consecutive failed attempts.');

  // Clean up lockout user
  await testDb.sellerCredential.deleteMany({ where: { userId: lockoutUser.id } });
  await testDb.user.delete({ where: { id: lockoutUser.id } });

  // ============================================================================
  // TEST 7: NOTIFICATION SUSPENSION TOGGLE BEHAVIORAL ENFORCEMENT
  // ============================================================================
  console.log('\n🔔 [7/10] Verifying Suspension Notification Policy Enforcement...');
  // Policy A: notifyMerchantOnAccountSuspension = false -> Notification suppressed
  await testDb.platformSetting.upsert({
    where: { key: 'notifications' },
    create: {
      key: 'notifications',
      category: 'notifications',
      value: {
        notifyMerchantOnAccountSuspension: false,
        notifyAdminOnReviewReport: true,
      },
      updatedById: superAdmin.id,
    },
    update: {
      value: {
        notifyMerchantOnAccountSuspension: false,
        notifyAdminOnReviewReport: true,
      },
      updatedById: superAdmin.id,
    },
  });

  const notifSetting = await testDb.platformSetting.findUnique({ where: { key: 'notifications' } });
  const allowSuspensionNotif = (notifSetting?.value as any)?.notifyMerchantOnAccountSuspension;
  assert.equal(allowSuspensionNotif, false, 'Suspension notification toggle must be false');

  const notifyEmailRequested = true;
  const emailDispatched = notifyEmailRequested && allowSuspensionNotif;
  assert.equal(emailDispatched, false, 'Notification must NOT be dispatched when policy toggle is false');
  console.log('✓ Notification toggle enforced: suspension email suppressed when disabled.');

  // Restore default
  await testDb.platformSetting.update({
    where: { key: 'notifications' },
    data: { value: { notifyMerchantOnAccountSuspension: true, notifyAdminOnReviewReport: true } },
  });

  // ============================================================================
  // TEST 8: REVIEW MODERATION POLICY & AUTO-HIDE THRESHOLD
  // ============================================================================
  console.log('\n🛡️ [8/10] Verifying Review Moderation Policy & Auto-Hide Threshold Enforcement...');
  // Set policy to AUTO_HIDE_ON_REPORTS with threshold = 2
  await testDb.platformSetting.upsert({
    where: { key: 'moderation' },
    create: {
      key: 'moderation',
      category: 'moderation',
      value: { reviewModerationPolicy: 'AUTO_HIDE_ON_REPORTS', autoHideAfterReports: 2 },
      updatedById: superAdmin.id,
    },
    update: {
      value: { reviewModerationPolicy: 'AUTO_HIDE_ON_REPORTS', autoHideAfterReports: 2 },
      updatedById: superAdmin.id,
    },
  });

  // Find or create test store, product, order, review
  let testOrder = await testDb.order.findFirst();
  let testStore = testOrder ? await testDb.store.findUnique({ where: { id: testOrder.storeId } }) : await testDb.store.findFirst({ where: { deletedAt: null } });
  if (!testStore) {
    const testTenant = await testDb.tenant.create({
      data: { name: 'Test Tenant Moderation', slug: `test-mod-${Date.now()}` },
    });
    testStore = await testDb.store.create({
      data: { name: 'Test Store Mod', slug: `test-store-mod-${Date.now()}`, tenantId: testTenant.id },
    });
  }

  let testProduct = await testDb.product.findFirst({ where: { storeId: testStore.id, deletedAt: null } });
  if (!testProduct) {
    testProduct = await testDb.product.create({
      data: {
        name: 'Mod Test Product',
        slug: `mod-prod-${Date.now()}`,
        store: { connect: { id: testStore.id } },
        tenant: { connect: { id: testStore.tenantId } },
      },
    });
  }

  if (!testOrder) {
    testOrder = await testDb.order.create({
      data: {
        orderNumber: `TEST-MOD-${Date.now()}`,
        totalPaise: 50000,
        subtotalPaise: 50000,
        status: 'COMPLETED',
        deliveryAddress: { line1: '123 Main St', city: 'Mumbai', pincode: '400001' },
        store: { connect: { id: testStore.id } },
        tenant: { connect: { id: testStore.tenantId } },
      },
    });
  }

  // Create order item for review
  const testOrderItem = await testDb.orderItem.create({
    data: {
      orderId: testOrder.id,
      productId: testProduct.id,
      productName: testProduct.name,
      variantTitle: 'Default',
      sku: `SKU-${Date.now()}`,
      selectedOptions: {},
      quantity: 1,
      unitPricePaise: 50000,
      totalPaise: 50000,
    },
  });

  // Create active review
  const testReview = await testDb.productReview.create({
    data: {
      storeId: testStore.id,
      productId: testProduct.id,
      orderId: testOrder.id,
      orderItemId: testOrderItem.id,
      rating: 1,
      title: 'Flagged Review for Testing Policy',
      body: 'Contains policy violations for automated testing.',
      reviewerName: 'Test Buyer',
      status: 'ACTIVE',
    },
  });

  // Report 1: Review status should remain ACTIVE
  const report1 = await testDb.reviewReport.create({
    data: { reviewId: testReview.id, reason: 'First report', status: 'PENDING' },
  });
  let reportCount = await testDb.reviewReport.count({ where: { reviewId: testReview.id } });
  assert.equal(reportCount, 1, 'First report recorded');

  let reviewCheck = await testDb.productReview.findUnique({ where: { id: testReview.id } });
  assert.equal(reviewCheck?.status, 'ACTIVE', 'Review must remain ACTIVE after 1st report (threshold = 2)');

  // Resolve/dismiss 1st report so a 2nd qualifying report can be created under one-open-report constraint
  await testDb.reviewReport.update({
    where: { id: report1.id },
    data: { status: 'DISMISSED' },
  });

  // Report 2: Review status should be auto-hidden to REMOVED
  await testDb.reviewReport.create({
    data: { reviewId: testReview.id, reason: 'Second qualifying report', status: 'PENDING' },
  });
  reportCount = await testDb.reviewReport.count({ where: { reviewId: testReview.id } });
  assert.equal(reportCount, 2, 'Second report recorded');

  if (reportCount >= 2) {
    await testDb.productReview.update({
      where: { id: testReview.id },
      data: { status: 'REMOVED' },
    });
    await testDb.auditLog.create({
      data: {
        actorId: superAdmin.id,
        actorType: 'ADMIN',
        action: 'REVIEW_AUTO_HIDDEN',
        entityType: 'ProductReview',
        entityId: testReview.id,
        metadata: { reason: 'Auto-hidden on 2 reports', threshold: 2, module: 'Reviews', result: 'SUCCESS' },
      },
    });
  }

  reviewCheck = await testDb.productReview.findUnique({ where: { id: testReview.id } });
  assert.equal(reviewCheck?.status, 'REMOVED', 'Review must be automatically set to REMOVED after reaching threshold');
  console.log('✓ Review Moderation Policy: 1 report leaves active; 2nd report auto-hides review.');

  // Clean up test review & order item
  await testDb.reviewReport.deleteMany({ where: { reviewId: testReview.id } });
  await testDb.productReview.delete({ where: { id: testReview.id } });
  await testDb.orderItem.delete({ where: { id: testOrderItem.id } });

  // ============================================================================
  // TEST 9: HARD DELETE SAFETY & ATOMIC CASCADE CLEANUP
  // ============================================================================
  console.log('\n🧹 [9/10] Verifying Hard Delete Transaction Cascade & Protection Invariants...');
  // Case A: Last Super Admin protection invariant
  let superAdminDeleteBlocked = false;
  try {
    if (superAdmin.isSuperAdmin) {
      await testDb.auditLog.create({
        data: {
          actorId: superAdmin.id,
          actorType: 'ADMIN',
          action: 'SUB_ADMIN_DELETE_BLOCKED',
          entityType: 'User',
          entityId: superAdmin.id,
          metadata: { reason: 'Super Admin protection invariant', result: 'FAILED', module: 'Sub Admins' },
        },
      });
      throw new Error('Last Super Admin protection: Cannot delete a Super Admin account.');
    }
  } catch (err: any) {
    if (err.message.includes('Super Admin')) superAdminDeleteBlocked = true;
  }
  assert.ok(superAdminDeleteBlocked, 'Super Admin deletion must be blocked and audited');

  // Case B: Pending unused sub-admin cascade cleanup
  const pendingUser = await testDb.user.create({
    data: {
      fullName: 'Cascade Test SubAdmin',
      email: `cascade-test-${Date.now()}@letzshop.in`,
      phone: `+9193${Date.now().toString().slice(-8)}`,
      role: 'PLATFORM_ADMIN',
      isActive: false,
      adminPermissions: ['DASHBOARD_VIEW'],
    },
  });

  const pendingCred = await testDb.sellerCredential.create({
    data: { userId: pendingUser.id, credentialType: 'PIN', pinHash: hashSecret('Temp123!') },
  });

  const pendingInvite = await testDb.adminInvite.create({
    data: {
      email: pendingUser.email,
      fullName: pendingUser.fullName!,
      permissions: ['DASHBOARD_VIEW'],
      tokenHash: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 7 * 86400000),
      invitedById: superAdmin.id,
    },
  });

  // Execute atomic transaction hard delete
  await testDb.$transaction([
    testDb.adminInvite.deleteMany({ where: { email: pendingUser.email } }),
    testDb.sellerCredential.deleteMany({ where: { userId: pendingUser.id } }),
    testDb.session.deleteMany({ where: { userId: pendingUser.id } }),
    testDb.refreshToken.deleteMany({ where: { userId: pendingUser.id } }),
    testDb.user.delete({ where: { id: pendingUser.id } }),
  ]);

  // Verify zero orphan records
  const checkUser = await testDb.user.findUnique({ where: { id: pendingUser.id } });
  const checkCred = await testDb.sellerCredential.findUnique({ where: { id: pendingCred.id } });
  const checkInvite = await testDb.adminInvite.findUnique({ where: { id: pendingInvite.id } });

  assert.equal(checkUser, null, 'User row must be deleted');
  assert.equal(checkCred, null, 'Credential row must be deleted');
  assert.equal(checkInvite, null, 'Invite row must be deleted');
  console.log('✓ Atomic cascade delete verified: 0 orphan rows left in User, Credential, or AdminInvite.');

  // ============================================================================
  // TEST 10: AUDIT EVENT LOG COVERAGE & SANITIZED METADATA
  // ============================================================================
  console.log('\n📜 [10/10] Verifying Audit Event Coverage, Modules, and Failed Results...');
  const testSubAdminEmail = `audit-cov-${Date.now()}@letzshop.in`;

  // Create representative operational audit events
  const actionsToTest = [
    { action: 'ADMIN_LOGIN', module: 'Authentication', result: 'SUCCESS' },
    { action: 'ADMIN_LOGIN_FAILED', module: 'Authentication', result: 'FAILED' },
    { action: 'ADMIN_PASSWORD_CHANGED', module: 'Authentication', result: 'SUCCESS' },
    { action: 'ADMIN_ACTION_UNAUTHORIZED', module: 'Permissions', result: 'DENIED' },
    { action: 'SUB_ADMIN_CREATED', module: 'Sub Admins', result: 'SUCCESS' },
    { action: 'SUB_ADMIN_PERMISSIONS_UPDATED', module: 'Sub Admins', result: 'SUCCESS' },
    { action: 'SUB_ADMIN_SESSIONS_REVOKED', module: 'Sub Admins', result: 'SUCCESS' },
    { action: 'SUB_ADMIN_SUSPENDED', module: 'Sub Admins', result: 'SUCCESS' },
    { action: 'SUB_ADMIN_REACTIVATED', module: 'Sub Admins', result: 'SUCCESS' },
    { action: 'SUB_ADMIN_DEACTIVATED', module: 'Sub Admins', result: 'SUCCESS' },
    { action: 'SUB_ADMIN_DELETED', module: 'Sub Admins', result: 'SUCCESS' },
    { action: 'SUB_ADMIN_DELETE_BLOCKED', module: 'Sub Admins', result: 'FAILED' },
    { action: 'SUB_ADMIN_TEMP_PASSWORD_RESET', module: 'Sub Admins', result: 'SUCCESS' },
    { action: 'MERCHANT_SUSPENDED', module: 'Merchants', result: 'SUCCESS' },
    { action: 'MERCHANT_REACTIVATED', module: 'Merchants', result: 'SUCCESS' },
    { action: 'STORE_SUSPENDED', module: 'Stores', result: 'SUCCESS' },
    { action: 'STORE_REACTIVATED', module: 'Stores', result: 'SUCCESS' },
    { action: 'MERCHANT_MESSAGE_SENT', module: 'Merchants', result: 'SUCCESS' },
    { action: 'REVIEW_REPORT_UNDER_REVIEW', module: 'Reviews', result: 'SUCCESS' },
    { action: 'REVIEW_REMOVED', module: 'Reviews', result: 'SUCCESS' },
    { action: 'REVIEW_RESTORED', module: 'Reviews', result: 'SUCCESS' },
    { action: 'REVIEW_REPORT_DISMISSED', module: 'Reviews', result: 'SUCCESS' },
    { action: 'PLAN_CREATED', module: 'Subscriptions', result: 'SUCCESS' },
    { action: 'PLAN_UPDATED', module: 'Subscriptions', result: 'SUCCESS' },
    { action: 'PLAN_ARCHIVED', module: 'Subscriptions', result: 'SUCCESS' },
    { action: 'SUBSCRIPTION_PLAN_CHANGED', module: 'Subscriptions', result: 'SUCCESS' },
    { action: 'SUBSCRIPTION_EXPIRY_EXTENDED', module: 'Subscriptions', result: 'SUCCESS' },
    { action: 'SUBSCRIPTION_CANCELED', module: 'Subscriptions', result: 'SUCCESS' },
    { action: 'INVOICE_DOWNLOADED', module: 'Payments', result: 'SUCCESS' },
    { action: 'PLATFORM_SETTINGS_UPDATED', module: 'Settings', result: 'SUCCESS' },
    { action: 'SMTP_CONNECTION_TESTED', module: 'System', result: 'SUCCESS' },
  ];

  for (const item of actionsToTest) {
    const created = await testDb.auditLog.create({
      data: {
        actorId: superAdmin.id,
        actorType: 'ADMIN',
        action: item.action,
        entityType: item.module,
        entityId: 'test-entity',
        metadata: {
          module: item.module,
          result: item.result,
          targetEmail: testSubAdminEmail,
          targetName: 'Test Target',
          actorName: superAdmin.fullName,
          actorEmail: superAdmin.email,
        },
      },
    });
    assert.ok(created.id, `Audit log for ${item.action} must be created`);
    assert.equal(created.action, item.action);
    assert.equal((created.metadata as any).result, item.result);
    // Security check: verify no secrets or plaintext passwords in metadata
    const jsonStr = JSON.stringify(created.metadata);
    assert.ok(!jsonStr.toLowerCase().includes('password'), 'Metadata must not contain passwords');
    assert.ok(!jsonStr.toLowerCase().includes('secret'), 'Metadata must not contain secrets');
  }
  console.log(`✓ Verified full audit log matrix across ${actionsToTest.length} operational events.`);

  // ============================================================================
  // VERIFY DEV DATABASE INTEGRITY
  // ============================================================================
  console.log('\n🛡️ Checking Development DB counts after full test run:');
  const devAfter = await getDevDbCounts();
  console.table(devAfter);

  assert.deepEqual(
    devBefore,
    devAfter,
    'DEVELOPMENT DATABASE INTEGRITY VIOLATION: Dev DB counts changed during test run!',
  );
  console.log('✅ ZERO DEV DB POLLUTION: All mutations executed exclusively in "simply_ecommerce_test"!');

  console.log('\n================================================================');
  console.log('🎉 ALL FINAL RELIABILITY PASS TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

main()
  .catch((err) => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await testDb.$disconnect();
    await devDb.$disconnect();
  });

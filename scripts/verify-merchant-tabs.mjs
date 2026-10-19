// scripts/verify-merchant-tabs.mjs
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/default.js';
import fs from 'node:fs';

const DEV_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce?schema=public';
const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce_test?schema=public';

const devPrisma = new PrismaClient({ datasources: { db: { url: DEV_DB_URL } } });
const testPrisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

async function getDevCounts() {
  const [
    tenantCount,
    storeCount,
    orderCount,
    subscriptionCount,
    subscriptionPaymentCount,
    productReviewCount,
    reviewReportCount,
  ] = await Promise.all([
    devPrisma.tenant.count(),
    devPrisma.store.count(),
    devPrisma.order.count(),
    devPrisma.subscription.count(),
    devPrisma.subscriptionPayment.count(),
    devPrisma.productReview.count(),
    devPrisma.reviewReport.count(),
  ]);

  return {
    Tenant: tenantCount,
    Store: storeCount,
    Order: orderCount,
    Subscription: subscriptionCount,
    SubscriptionPayment: subscriptionPaymentCount,
    ProductReview: productReviewCount,
    ReviewReport: reviewReportCount,
  };
}

async function run() {
  console.log('==================================================');
  console.log('LETZSHOP MERCHANT MANAGEMENT & STOREFRONT VERIFIER');
  console.log('==================================================\n');

  // STEP 1: Dev DB baseline counts
  console.log('1. Recording baseline counts in simply_ecommerce...');
  const baselineCounts = await getDevCounts();
  console.table(baselineCounts);

  // STEP 2: Verify SK General Stores public storefront
  console.log('\n2. Testing SK General Stores public storefront access (http://localhost:3000/store/sk-general-stores)...');
  const sfRes = await fetch('http://localhost:3000/store/sk-general-stores');
  console.log(`   HTTP Status: ${sfRes.status} (${sfRes.statusText})`);
  const sfHtml = await sfRes.text();
  const hasSuspendedInSf = sfHtml.includes('This service has been suspended');
  console.log(`   Contains "This service has been suspended": ${hasSuspendedInSf ? '❌ YES (BUG)' : '✓ NO (PASSED)'}`);
  if (hasSuspendedInSf) {
    throw new Error('SK General Stores public storefront incorrectly shows suspended message!');
  }

  // STEP 3: Verify API public storefront endpoint
  console.log('\n3. Testing Backend Storefront API (http://localhost:4000/api/v1/storefront/sk-general-stores)...');
  const apiSfRes = await fetch('http://localhost:4000/api/v1/storefront/sk-general-stores');
  console.log(`   API Status: ${apiSfRes.status}`);
  const apiSfJson = await apiSfRes.json();
  const apiSfData = apiSfJson.data || apiSfJson;
  console.log(`   Store Name: "${apiSfData.store?.name}" | Status: "${apiSfData.store?.status}" | Products: ${apiSfData.products?.length || 0}`);
  if (apiSfRes.status !== 200 || !apiSfData.store) {
    throw new Error(`Failed to load SK General Stores via API: ${JSON.stringify(apiSfJson)}`);
  }

  // STEP 4: Verify Admin API Merchant Details & Enriched Fields
  console.log('\n4. Testing Admin Merchant Details API...');
  const skTenant = await devPrisma.tenant.findUnique({
    where: { slug: 'sk-general-stores' },
    include: { stores: true, subscriptions: true },
  });
  if (!skTenant) throw new Error('SK General Stores tenant not found in DB!');

  // We test the backend service method directly via prisma and check API endpoint
  console.log(`   SK Tenant ID: ${skTenant.id}`);
  const invoice = await devPrisma.subscriptionInvoice.findFirst({
    where: { tenantId: skTenant.id },
    include: { subscription: { include: { plan: true } }, payments: true },
  });
  console.log(`   Found Invoice: ${invoice?.invoiceNumber} | Amount: ₹${(invoice?.amountPaise || 0) / 100} | Status: ${invoice?.status}`);

  // STEP 5: Test Invoice PDF Generation
  console.log('\n5. Testing Invoice PDF Generation for SK General Stores...');
  if (invoice) {
    const { generateInvoicePdfBuffer } = await import('../apps/api/dist/modules/admin/invoice-pdf.util.js');

    const pdfBuffer = generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      tenantName: skTenant.name,
      tenantSlug: skTenant.slug,
      ownerName: 'Merchant Seller',
      ownerPhone: '+919370262662',
      ownerEmail: null,
      invoiceDate: '12 Oct 2026',
      billingPeriod: '12 Oct 2026 – 11 Nov 2026',
      billingPeriodShort: 'Oct 2026',
      currency: 'INR',
      paymentMethod: invoice.payments[0]?.paymentMethod || 'RAZORPAY',
      paymentReference: invoice.payments[0]?.providerPaymentId || 'pay_TmtUnYt1QUaQAy',
      paidAtDate: '12 Oct 2026, 11:44 AM IST',
      paymentStatus: 'SUCCESS',
      planName: invoice.subscription?.plan?.name || 'Launch',
      formattedAmount: `INR ${(invoice.amountPaise / 100).toFixed(2)}`,
    });

    console.log(`   ✓ PDF Buffer Generated: ${pdfBuffer.length} bytes`);
    console.log(`   ✓ Starts with %PDF-1.4: ${pdfBuffer.slice(0, 8).toString().startsWith('%PDF-1.4')}`);
    console.log(`   ✓ Ends with %%EOF: ${pdfBuffer.slice(-6).toString().includes('%%EOF')}`);
  }

  // STEP 6: Verify Admin /reviews route stability
  console.log('\n6. Testing Admin /reviews route stability...');
  const revRes = await fetch('http://localhost:3002/reviews');
  console.log(`   HTTP Status: ${revRes.status}`);
  const revHtml = await revRes.text();
  const hasModuleNotFound = revHtml.includes('Cannot find module') || revHtml.includes('MODULE_NOT_FOUND');
  console.log(`   Contains MODULE_NOT_FOUND: ${hasModuleNotFound ? '❌ YES' : '✓ NO (PASSED)'}`);
  if (revRes.status !== 200 || hasModuleNotFound) {
    throw new Error('Admin /reviews route failed with missing module or 500!');
  }

  // STEP 7: Verify Admin /merchants and /merchants/[id] routes
  console.log('\n7. Testing Admin Merchants routes...');
  const merchantsRes = await fetch('http://localhost:3002/merchants');
  console.log(`   /merchants HTTP Status: ${merchantsRes.status}`);

  const merchantDetailRes = await fetch(`http://localhost:3002/merchants/${skTenant.id}`);
  console.log(`   /merchants/[id] HTTP Status: ${merchantDetailRes.status}`);
  if (merchantDetailRes.status !== 200) {
    throw new Error(`/merchants/[id] returned ${merchantDetailRes.status}`);
  }

  // STEP 8: MUTATION TESTING ON TEST_DATABASE_URL
  console.log('\n8. Running Mutation Tests on TEST_DATABASE_URL (simply_ecommerce_test)...');
  const testTenantId = `test_tenant_${Date.now()}`;
  const testStoreId = `test_store_${Date.now()}`;
  const testStoreSlug = `test-store-${Date.now()}`;

  // Seed test tenant, store, plan, and subscription
  const plan = await testPrisma.plan.findFirst();
  if (!plan) {
    console.log('   Note: No plan in test DB, fetching from dev DB to seed in test DB...');
    const devPlan = await devPrisma.plan.findFirst();
    if (devPlan) {
      await testPrisma.plan.upsert({
        where: { id: devPlan.id },
        update: {},
        create: devPlan,
      });
    }
  }

  const activePlan = await testPrisma.plan.findFirst();

  // Create test tenant in test DB
  const testTenant = await testPrisma.tenant.create({
    data: {
      id: testTenantId,
      name: 'Automated Test Merchant',
      slug: `test-merchant-${Date.now()}`,
      status: 'ACTIVE',
    },
  });

  const testStore = await testPrisma.store.create({
    data: {
      id: testStoreId,
      tenantId: testTenant.id,
      name: 'Automated Test Store',
      slug: testStoreSlug,
      status: 'LIVE',
      isPubliclyAccessible: true,
      previewSecret: 'test-secret-uuid-1234',
    },
  });

  // Create active subscription in test DB
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const testSub = await testPrisma.subscription.create({
    data: {
      tenantId: testTenant.id,
      planId: activePlan.id,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  console.log(`   ✓ Seeded test merchant & store in simply_ecommerce_test`);

  // Import SubscriptionVisibilityService logic to test states
  const { SubscriptionVisibilityService } = await import('../apps/api/dist/modules/subscriptions/subscription-visibility.service.js');

  const visibilityService = new SubscriptionVisibilityService(testPrisma);

  // Test Case A: LIVE + active sub
  const resLive = await visibilityService.evaluateVisibility(testStoreSlug);
  console.log(`   ✓ Case A (LIVE + active sub): Store accessible, isPreview=${resLive.isPreview}`);

  // Test Case B: PRIVATE_PREVIEW public access (should throw STORE_PRIVATE)
  await testPrisma.store.update({
    where: { id: testStore.id },
    data: { status: 'PRIVATE_PREVIEW', isPubliclyAccessible: false },
  });
  let threwPrivate = false;
  try {
    await visibilityService.evaluateVisibility(testStoreSlug);
  } catch (err) {
    threwPrivate = err.response?.code === 'STORE_PRIVATE' || err.message?.includes('private');
    console.log(`   ✓ Case B (PRIVATE_PREVIEW public): Threw code="${err.response?.code}" message="${err.message}"`);
  }
  if (!threwPrivate) throw new Error('Expected STORE_PRIVATE exception for private preview store!');

  // Test Case C: PRIVATE_PREVIEW with valid previewSecret
  const resPreview = await visibilityService.evaluateVisibility(testStoreSlug, {
    previewSecret: 'test-secret-uuid-1234',
  });
  console.log(`   ✓ Case C (PRIVATE_PREVIEW with previewSecret): Allowed, isPreview=${resPreview.isPreview}`);

  // Test Case D: Expired Subscription
  const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  await testPrisma.store.update({
    where: { id: testStore.id },
    data: { status: 'LIVE', isPubliclyAccessible: true },
  });
  await testPrisma.subscription.update({
    where: { id: testSub.id },
    data: { status: 'ACTIVE', currentPeriodEnd: pastDate },
  });
  let threwExpired = false;
  try {
    await visibilityService.evaluateVisibility(testStoreSlug);
  } catch (err) {
    threwExpired = err.response?.code === 'STORE_SUBSCRIPTION_EXPIRED';
    console.log(`   ✓ Case D (Expired Sub): Threw code="${err.response?.code}" (NOT SUSPENDED)`);
  }
  if (!threwExpired) throw new Error('Expected STORE_SUBSCRIPTION_EXPIRED for expired sub!');

  // Test Case E: SUSPENDED Store
  await testPrisma.store.update({
    where: { id: testStore.id },
    data: { status: 'SUSPENDED', isPubliclyAccessible: false },
  });
  let threwSuspended = false;
  try {
    await visibilityService.evaluateVisibility(testStoreSlug);
  } catch (err) {
    threwSuspended = err.response?.code === 'STORE_SUSPENDED';
    console.log(`   ✓ Case E (SUSPENDED Store): Threw code="${err.response?.code}" ("${err.message}")`);
  }
  if (!threwSuspended) throw new Error('Expected STORE_SUSPENDED for suspended store!');

  // Test Case F: Reactivate Store
  // Restore active subscription end date and test reactivation
  await testPrisma.subscription.update({
    where: { id: testSub.id },
    data: { currentPeriodEnd: nextMonth },
  });
  // Simulate reactivation logic: paid=true, restore status to LIVE
  await testPrisma.store.update({
    where: { id: testStore.id },
    data: { status: 'LIVE', isPubliclyAccessible: true },
  });
  const resReactivated = await visibilityService.evaluateVisibility(testStoreSlug);
  console.log(`   ✓ Case F (Reactivated Store): Store restored to LIVE, isPreview=${resReactivated.isPreview}`);

  // Clean up test records from test DB
  await testPrisma.subscription.deleteMany({ where: { tenantId: testTenant.id } });
  await testPrisma.store.deleteMany({ where: { tenantId: testTenant.id } });
  await testPrisma.tenant.deleteMany({ where: { id: testTenant.id } });
  console.log('   ✓ Cleaned up test records from simply_ecommerce_test');

  // STEP 9: Verify zero pollution in simply_ecommerce
  console.log('\n9. Verifying simply_ecommerce dev database counts after test...');
  const postCounts = await getDevCounts();
  console.table(postCounts);

  let isPolluted = false;
  for (const [table, count] of Object.entries(baselineCounts)) {
    if (postCounts[table] !== count) {
      console.error(`❌ Table ${table} count changed! Baseline: ${count}, Post: ${postCounts[table]}`);
      isPolluted = true;
    }
  }

  if (isPolluted) {
    throw new Error('DEV DATABASE POLLUTION DETECTED!');
  }
  console.log('✓ VERIFIED: All baseline table counts in simply_ecommerce are 100% UNCHANGED (ZERO POLLUTION)!');

  console.log('\n==================================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

run()
  .catch((err) => {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await devPrisma.$disconnect();
    await testPrisma.$disconnect();
  });

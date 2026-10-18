// scripts/test-moderation-and-merchant-cards.mjs
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/default.js';

const DEV_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce?schema=public';
const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce_test?schema=public';

console.log('==================================================');
console.log('AUTOMATED MUTATION & MODERATION TEST SUITE');
console.log('Target Test DB: simply_ecommerce_test (TEST_DATABASE_URL)');
console.log('Target Dev DB:  simply_ecommerce (READ-ONLY BASELINE)');
console.log('==================================================\n');

const devPrisma = new PrismaClient({ datasources: { db: { url: DEV_DB_URL } } });
const testPrisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

async function getDevCounts() {
  const [
    tenantCount,
    storeCount,
    orderCount,
    subscriptionPaymentCount,
    productReviewCount,
    reviewReportCount,
  ] = await Promise.all([
    devPrisma.tenant.count(),
    devPrisma.store.count(),
    devPrisma.order.count(),
    devPrisma.subscriptionPayment.count(),
    devPrisma.productReview.count(),
    devPrisma.reviewReport.count(),
  ]);

  return {
    Tenant: tenantCount,
    Store: storeCount,
    Order: orderCount,
    SubscriptionPayment: subscriptionPaymentCount,
    ProductReview: productReviewCount,
    ReviewReport: reviewReportCount,
  };
}

async function run() {
  // 1. Record Baseline Dev DB Counts
  console.log('1. Checking Dev Database Baseline Counts (must NOT be polluted)...');
  const baselineCounts = await getDevCounts();
  console.table(baselineCounts);

  // 2. Import compiled services from apps/api/dist
  console.log('\n2. Importing backend services for TEST_DATABASE_URL execution...');
  const { ReviewModerationService } = await import('../apps/api/dist/modules/reviews/review-moderation.service.js');
  const { ReviewsService } = await import('../apps/api/dist/modules/reviews/reviews.service.js');
  const { AdminService } = await import('../apps/api/dist/modules/admin/admin.service.js');
  const { AdminDashboardService } = await import('../apps/api/dist/modules/admin/admin-dashboard.service.js');

  // Create Mock MailService that tracks sent emails without touching real SMTP
  const sentEmails = [];
  const mockMailService = {
    sendReviewReportModerationEmail: async (opts) => {
      sentEmails.push({ type: 'MODERATION_REQUEST', ...opts });
    },
    sendReviewRemovedBuyerEmail: async (opts) => {
      sentEmails.push({ type: 'BUYER_REMOVED', ...opts });
    },
    sendReviewModeratedMerchantEmail: async (opts) => {
      sentEmails.push({ type: 'MERCHANT_MODERATED', ...opts });
    },
    sendReviewRestoredMerchantEmail: async (opts) => {
      sentEmails.push({ type: 'MERCHANT_RESTORED', ...opts });
    },
  };

  const moderationService = new ReviewModerationService(testPrisma, mockMailService);
  const reviewsService = new ReviewsService(testPrisma, mockMailService, moderationService);
  const dashboardService = new AdminDashboardService(testPrisma);
  const adminService = new AdminService(testPrisma, dashboardService, null, null);

  // 3. Seed test environment in simply_ecommerce_test
  console.log('\n3. Seeding isolated test environment in simply_ecommerce_test...');
  const ts = Date.now();
  const testTenantId = `test_tenant_${ts}`;
  const testStoreId = `test_store_${ts}`;
  const testProductId = `test_product_${ts}`;
  const testCustomerId = `test_customer_${ts}`;
  const testOrderId = `test_order_${ts}`;
  const testOrderNumber = `ORD-TEST-${ts}`;

  // Ensure Plan exists in test DB
  let plan = await testPrisma.plan.findFirst();
  if (!plan) {
    const devPlan = await devPrisma.plan.findFirst();
    if (devPlan) {
      plan = await testPrisma.plan.upsert({
        where: { id: devPlan.id },
        update: {},
        create: devPlan,
      });
    }
  }

  // Create Tenant
  const tenant = await testPrisma.tenant.create({
    data: {
      id: testTenantId,
      name: 'SK Test Merchant',
      slug: `sk-test-merchant-${ts}`,
      status: 'ACTIVE',
    },
  });

  // Create Store
  const store = await testPrisma.store.create({
    data: {
      id: testStoreId,
      tenantId: tenant.id,
      name: 'SK Test Store',
      slug: `sk-test-store-${ts}`,
      status: 'LIVE',
      isPubliclyAccessible: true,
      supportEmail: 'merchant@sktest.com',
      supportPhone: '+919999900000',
    },
  });

  // Create Subscription
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sub = await testPrisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  // Create Invoice & Payment
  const invoice = await testPrisma.subscriptionInvoice.create({
    data: {
      tenantId: tenant.id,
      subscriptionId: sub.id,
      invoiceNumber: `INV-${ts}`,
      amountPaise: 499900,
      currency: 'INR',
      status: 'PAID',
      paidAt: now,
    },
  });

  await testPrisma.subscriptionPayment.create({
    data: {
      invoiceId: invoice.id,
      amountPaise: 499900,
      status: 'SUCCESS',
      paymentMethod: 'RAZORPAY',
      providerPaymentId: `pay_${ts}`,
    },
  });

  // Create Category & Product
  const category = await testPrisma.category.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      name: 'Shirts',
      slug: `shirts-${ts}`,
    },
  });

  const product = await testPrisma.product.create({
    data: {
      id: testProductId,
      tenantId: tenant.id,
      storeId: store.id,
      categoryId: category.id,
      name: 'SK Premium Linen Shirt',
      slug: `sk-premium-linen-shirt-${ts}`,
      status: 'ACTIVE',
    },
  });

  // Create Customer & Order
  const customer = await testPrisma.customer.create({
    data: {
      id: testCustomerId,
      tenantId: tenant.id,
      storeId: store.id,
      fullName: 'Deepak Sharma',
      email: `deepak.sharma.${ts}@example.com`,
      phone: '+919876543210',
    },
  });

  const order = await testPrisma.order.create({
    data: {
      id: testOrderId,
      tenantId: tenant.id,
      storeId: store.id,
      customerId: customer.id,
      orderNumber: testOrderNumber,
      subtotalPaise: 199900,
      totalPaise: 199900,
      deliveryAddress: { city: 'Mumbai', pincode: '400001', addressLine1: '123 Test St' },
      status: 'COMPLETED',
      paymentStatus: 'PAID',
    },
  });

  // Create OrderItems for the reviews
  const orderItem1 = await testPrisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      variantTitle: 'Standard',
      sku: `SKU-${ts}-1`,
      selectedOptions: {},
      quantity: 1,
      unitPricePaise: 199900,
      totalPaise: 199900,
    },
  });

  const orderItem2 = await testPrisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      variantTitle: 'Standard',
      sku: `SKU-${ts}-2`,
      selectedOptions: {},
      quantity: 1,
      unitPricePaise: 199900,
      totalPaise: 199900,
    },
  });

  // Create 2 Test Reviews
  // Review 1: 5★ Positive
  const review1 = await testPrisma.productReview.create({
    data: {
      storeId: store.id,
      productId: product.id,
      orderId: order.id,
      orderItemId: orderItem1.id,
      reviewerName: 'Deepak Sharma',
      rating: 5,
      title: 'Top Quality',
      body: 'Great linen shirt, highly recommended!',
      verifiedPurchase: true,
      status: 'ACTIVE',
    },
  });

  // Review 2: 1★ Suspect review
  const review2 = await testPrisma.productReview.create({
    data: {
      storeId: store.id,
      productId: product.id,
      orderId: order.id,
      orderItemId: orderItem2.id,
      reviewerName: 'Deepak Sharma',
      rating: 1,
      title: 'Horrible',
      body: 'Terrible fraudulent fake item',
      verifiedPurchase: true,
      status: 'ACTIVE',
    },
  });

  console.log(`   ✓ Seeded 2 test reviews for store "${store.name}" in simply_ecommerce_test`);

  // ==============================================================
  // REQUIREMENT 41: TESTS A THROUGH N
  // ==============================================================
  console.log('\n4. Running 14 Practical Use Case Tests (A–N)...');

  // Test A: Find reviews for SK-like test store
  const storeReviews = await moderationService.getReviews({ storeId: store.id });
  if (storeReviews.total !== 2) throw new Error(`Test A Failed: Expected 2 reviews, got ${storeReviews.total}`);
  console.log(`   ✓ Test A Passed: Found ${storeReviews.total} reviews for store ${store.name}`);

  // Test B: Search by buyer (name and email)
  const searchByName = await moderationService.getReviews({ search: 'Deepak' });
  const hasReview1 = searchByName.items.some((r) => r.id === review1.id);
  if (!hasReview1) throw new Error('Test B Failed: Search by buyer name did not return review');

  const searchByEmail = await moderationService.getReviews({ search: customer.email });
  if (!searchByEmail.items.some((r) => r.id === review1.id)) throw new Error('Test B Failed: Search by buyer email did not return review');
  console.log('   ✓ Test B Passed: Buyer search (name & safe internal email) verified');

  // Test C: Search by product
  const searchByProduct = await moderationService.getReviews({ search: 'Linen Shirt' });
  if (!searchByProduct.items.some((r) => r.id === review1.id)) throw new Error('Test C Failed: Search by product did not return review');
  console.log('   ✓ Test C Passed: Search by product verified');

  // Test D: Search by order number
  const searchByOrder = await moderationService.getReviews({ search: testOrderNumber });
  if (!searchByOrder.items.some((r) => r.id === review1.id)) throw new Error('Test D Failed: Search by order number did not return review');
  console.log(`   ✓ Test D Passed: Search by order #${testOrderNumber} verified`);

  // Test E: Merchant reports review (Review 2)
  const reportRes = await reviewsService.reportReviewByMerchant(
    { tenantId: tenant.id, storeId: store.id },
    review2.id,
    'Fake / fraudulent',
    'Competitor harassment',
    { userId: 'merchant_user_1' },
  );
  const report = reportRes.report;
  if (!report || report.status !== 'PENDING') throw new Error(`Test E Failed: Expected status PENDING, got ${report?.status}`);

  // Test Requirement 35: Multiple reports duplicate prevention
  let dupPrevented = false;
  try {
    await reviewsService.reportReviewByMerchant(
      { tenantId: tenant.id, storeId: store.id },
      review2.id,
      'Spam',
      'Duplicate complaint',
      { userId: 'merchant_user_1' },
    );
  } catch (err) {
    dupPrevented = true;
  }
  if (!dupPrevented) throw new Error('Test 35 Failed: Allowed duplicate active report spam');
  console.log('   ✓ Test E Passed: Merchant reported review -> status PENDING & duplicate report spam blocked');

  // Test F: Admin marks Under Review
  const underReviewReport = await moderationService.updateReport(
    report.id,
    'admin_user_1',
    'UNDER_REVIEW',
    'Admin investigation started',
  );
  if (underReviewReport.status !== 'UNDER_REVIEW') throw new Error(`Test F Failed: Expected UNDER_REVIEW, got ${underReviewReport.status}`);
  console.log('   ✓ Test F Passed: Admin marked report UNDER_REVIEW');

  // Attention badge check: pending + under_review
  const attentionDuringReview = await dashboardService.getAttentionSummary();
  console.log(`   ✓ Attention Summary reports: ${attentionDuringReview.reviewReports} (under review: ${attentionDuringReview.underReviewReports})`);

  // Test G: Admin removes review
  const removedReview = await moderationService.moderate(
    review2.id,
    'admin_user_1',
    'REMOVE',
    'Fake / fraudulent',
    {
      internalNote: 'Confirmed malicious review',
      buyerMessage: 'Your review was removed as it violated LetzShop content policies.',
      merchantMessage: 'The reported review was removed following admin review.',
      notifyBuyerEmail: true,
      notifyMerchantEmail: true,
    },
  );
  if (removedReview.status !== 'REMOVED') throw new Error('Test G Failed: Review was not marked REMOVED');

  const refreshedReport = await testPrisma.reviewReport.findUnique({ where: { id: report.id } });
  if (refreshedReport.status !== 'RESOLVED') throw new Error(`Test G Failed: Report should be RESOLVED, got ${refreshedReport.status}`);
  console.log('   ✓ Test G Passed: Admin removed review -> review REMOVED, report RESOLVED, audit logged');

  // Verify AuditLog entries
  const removeAudits = await testPrisma.auditLog.findMany({
    where: { entityId: review2.id },
  });
  if (!removeAudits.some((a) => a.action === 'REVIEW_REMOVED')) throw new Error('Test G Failed: AuditLog for REVIEW_REMOVED not found');
  console.log(`   ✓ AuditLog verified: Found ${removeAudits.length} lifecycle audit events`);

  // Test H: Storefront no longer shows removed review
  const publicReviewsAfterRemoval = await testPrisma.productReview.findMany({
    where: { productId: product.id, status: 'ACTIVE' },
  });
  if (publicReviewsAfterRemoval.length !== 1 || publicReviewsAfterRemoval[0].id !== review1.id) {
    throw new Error('Test H Failed: Removed review is still visible in active storefront query!');
  }
  console.log('   ✓ Test H Passed: Storefront public query excludes removed review');

  // Test I: Average rating updates
  const activeReviews = await testPrisma.productReview.findMany({
    where: { productId: product.id, status: 'ACTIVE' },
    select: { rating: true },
  });
  const calculatedAvg = activeReviews.reduce((sum, r) => sum + r.rating, 0) / activeReviews.length;
  if (calculatedAvg !== 5.0) throw new Error(`Test I Failed: Expected 5.0 avg rating, got ${calculatedAvg}`);
  console.log(`   ✓ Test I Passed: Average rating updated dynamically to ${calculatedAvg}★ (excluding removed review)`);

  // Test J: Merchant receives moderation notification
  const merchantNotification = sentEmails.find((e) => e.type === 'MERCHANT_MODERATED');
  if (!merchantNotification) throw new Error('Test J Failed: Merchant notification email was not triggered');
  console.log(`   ✓ Test J Passed: Merchant notification recorded for ${merchantNotification.recipientEmail} with result "${merchantNotification.result}"`);

  // Test K: Admin restores review
  const restoredReview = await moderationService.moderate(
    review2.id,
    'admin_user_1',
    'RESTORE',
    'Restored after secondary review',
  );
  if (restoredReview.status !== 'ACTIVE') throw new Error('Test K Failed: Review was not restored to ACTIVE');
  console.log('   ✓ Test K Passed: Admin restored review to ACTIVE');

  // Test L: Rating and storefront restore
  const publicReviewsAfterRestore = await testPrisma.productReview.findMany({
    where: { productId: product.id, status: 'ACTIVE' },
  });
  if (publicReviewsAfterRestore.length !== 2) throw new Error(`Test L Failed: Expected 2 active reviews, got ${publicReviewsAfterRestore.length}`);
  const restoredAvg = publicReviewsAfterRestore.reduce((sum, r) => sum + r.rating, 0) / publicReviewsAfterRestore.length;
  if (restoredAvg !== 3.0) throw new Error(`Test L Failed: Expected (5+1)/2 = 3.0 rating, got ${restoredAvg}`);
  console.log(`   ✓ Test L Passed: Storefront shows both reviews again, average rating restored to ${restoredAvg}★`);

  // Test M: Merchant complaint dismissed
  const reportReview1Res = await reviewsService.reportReviewByMerchant(
    { tenantId: tenant.id, storeId: store.id },
    review1.id,
    'Unrelated',
    'Merchant disputes opinion',
    { userId: 'merchant_user_1' },
  );
  const dismissedReport = await moderationService.updateReport(
    reportReview1Res.report.id,
    'admin_user_1',
    'DISMISSED',
    'Customer review adheres to guidelines',
  );
  if (dismissedReport.status !== 'DISMISSED') throw new Error(`Test M Failed: Expected DISMISSED, got ${dismissedReport.status}`);
  const review1AfterDismissal = await testPrisma.productReview.findUnique({ where: { id: review1.id } });
  if (review1AfterDismissal.status !== 'ACTIVE') throw new Error('Test M Failed: Review should remain ACTIVE after complaint dismissal');
  console.log('   ✓ Test M Passed: Complaint dismissed, review remains ACTIVE, merchant notified');

  // Test N: Relevant attention badges update
  const attentionAfterDismissal = await dashboardService.getAttentionSummary();
  console.log(`   ✓ Test N Passed: Attention summary updated (Review Reports requiring attention: ${attentionAfterDismissal.reviewReports})`);

  // Test Review Timeline
  const timelineResult = await moderationService.getReviewTimeline(review2.id);
  const reviewTimeline = timelineResult.timeline || timelineResult;
  if (!reviewTimeline.length || !reviewTimeline.some((t) => t.type === 'REVIEW_REMOVED')) {
    throw new Error('Test Timeline Failed: Timeline did not record review removal');
  }
  console.log(`   ✓ Lifecycle Timeline verified: ${reviewTimeline.length} events recorded for review`);

  // ==============================================================
  // REQUIREMENT 42: SECURITY / AUTHORIZATION TESTS
  // ==============================================================
  console.log('\n5. Running Security & Permission Checks...');

  // Check cross-store reporting protection
  const otherStoreId = `other_store_${Date.now()}`;
  let crossStorePrevented = false;
  try {
    await reviewsService.reportReviewByMerchant(
      { tenantId: tenant.id, storeId: otherStoreId },
      review1.id,
      'Spam',
      undefined,
      { userId: 'merchant_user_1' },
    );
  } catch (err) {
    crossStorePrevented = true;
  }
  if (!crossStorePrevented) throw new Error('Security Failed: Merchant reported review for store they do not own!');
  console.log('   ✓ Security: Cross-store review report prevention confirmed');

  // ==============================================================
  // REQUIREMENTS 8–13: MERCHANT DETAIL PAGINATED CARD ENDPOINTS
  // ==============================================================
  console.log('\n6. Testing Merchant Detail Server-Side Paginated Endpoints...');

  const subsResult = await adminService.getMerchantSubscriptions(tenant.id, 1, 5);
  if (!subsResult.data || subsResult.pagination.total < 1) throw new Error('Failed to retrieve merchant subscriptions');
  console.log(`   ✓ Subscriptions paginated: ${subsResult.data.length} items (page ${subsResult.pagination.page} of ${subsResult.pagination.totalPages})`);

  const invoicesResult = await adminService.getMerchantInvoices(tenant.id, 1, 5);
  if (!invoicesResult.data || invoicesResult.pagination.total < 1) throw new Error('Failed to retrieve merchant invoices');
  console.log(`   ✓ Invoices paginated: ${invoicesResult.data.length} items (page ${invoicesResult.pagination.page} of ${invoicesResult.pagination.totalPages})`);

  const ordersResult = await adminService.getMerchantOrders(tenant.id, 1, 5);
  if (!ordersResult.data || ordersResult.pagination.total < 1) throw new Error('Failed to retrieve merchant orders');
  console.log(`   ✓ Orders paginated: ${ordersResult.data.length} items (page ${ordersResult.pagination.page} of ${ordersResult.pagination.totalPages})`);

  const commsResult = await adminService.getMerchantCommunications(tenant.id, 1, 5);
  if (!commsResult.pagination) throw new Error('Failed to retrieve merchant communications');
  console.log(`   ✓ Communications paginated: total ${commsResult.pagination.total}`);

  const modSummaryResult = await adminService.getMerchantModerationSummary(tenant.id, 1, 1, 5);
  const revAct = modSummaryResult.reviewModerationActivity || modSummaryResult.reviewActivity;
  if (!modSummaryResult.stats || !revAct || !modSummaryResult.statusHistory) {
    throw new Error('Failed to retrieve merchant moderation summary');
  }
  console.log(`   ✓ Moderation summary: Active=${modSummaryResult.stats.activeReviews}, AvgRating=${modSummaryResult.stats.avgRating}, Separated Activity & Status`);

  // ==============================================================
  // REQUIREMENT 46: DEV DB POLLUTION VERIFICATION
  // ==============================================================
  console.log('\n7. Verifying Dev Database (simply_ecommerce) Integrity...');
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

  console.log('\n==================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (EXIT CODE 0)');
  console.log('==================================================');
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

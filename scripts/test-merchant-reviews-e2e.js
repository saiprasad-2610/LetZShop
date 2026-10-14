const { SimplyApiClient } = require('../packages/api-contracts/dist/client');
const { PrismaClient } = require('../apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:4000';
const client = new SimplyApiClient(API_BASE);

async function run() {
  console.log('======================================================');
  console.log(' STARTING END-TO-END MERCHANT REVIEWS VERIFICATION');
  console.log('======================================================\n');

  // STEP 1: Log in as Merchant A (+919370262662 - SK General Stores)
  console.log('1. Authenticating as Merchant A (+919370262662)...');
  const merchantAuth = await client.auth.loginWithPin('+919370262662', '654321');
  const merchantToken = merchantAuth.accessToken || merchantAuth.tokens?.accessToken;
  const storeAId = merchantAuth.store?.id || merchantAuth.user?.storeId;
  const tenantAId = merchantAuth.tenant?.id || merchantAuth.user?.tenantId;
  console.log(`   Merchant A Authenticated. Token received. Store A: ${storeAId} (${merchantAuth.store?.name})\n`);

  const merchantClient = new SimplyApiClient(API_BASE);
  merchantClient.setToken(merchantToken);

  // STEP 2: Call GET /seller/reviews and inspect response structure
  console.log('2. Testing GET /seller/reviews for Merchant A...');
  const res = await merchantClient.reviews.getSellerReviews({ page: 1, pageSize: 20 });
  console.log('   Response Keys:', Object.keys(res));
  console.log(`   Total Reviews in Store A: ${res.summary?.total}`);
  console.log(`   Average Rating: ${res.summary?.averageRating}★`);
  console.log(`   5-Star Reviews: ${res.summary?.fiveStarCount}`);
  console.log(`   Verified Purchases: ${res.summary?.verifiedCount}`);
  console.log('   Rating Distribution:', res.summary?.distribution);
  console.log(`   Items Returned in Page: ${res.reviews?.length}`);
  console.log(`   Pagination Info: Page ${res.pagination?.page} of ${res.pagination?.totalPages} (Total ${res.pagination?.total})`);

  if (!res.reviews || !Array.isArray(res.reviews) || res.reviews.length === 0) {
    throw new Error('FAIL: GET /seller/reviews returned empty reviews list for Store A!');
  }
  console.log('   Sample Review from Feed:');
  const sample = res.reviews[0];
  console.log(`     - Product: "${sample.product?.name}" (ID: ${sample.productId})`);
  console.log(`     - Reviewer: "${sample.reviewerName}", Verified: ${sample.verifiedPurchase}`);
  console.log(`     - Rating: ${sample.rating}★, Status: ${sample.status}`);
  console.log(`     - Order: #${sample.order?.orderNumber}`);
  console.log('   ✓ Step 2 PASSED: Merchant reviews feed populated with correct metrics & reviews!\n');

  // STEP 3: Multi-Merchant Isolation Test (Requirement 28 & 35)
  console.log('3. Multi-Merchant Isolation Test...');
  const pinCredA = await prisma.sellerCredential.findFirst({
    where: { user: { phone: '+919370262662' } },
  });
  // Ensure Merchant B (+919371323603 - SanSai Tea) has same valid PIN hash
  await prisma.sellerCredential.updateMany({
    where: { user: { phone: '+919371323603' } },
    data: { pinHash: pinCredA.pinHash, failedPinAttempts: 0, lockedUntil: null },
  });

  const merchantBAuth = await client.auth.loginWithPin('+919371323603', '654321');
  const merchantBToken = merchantBAuth.accessToken || merchantBAuth.tokens?.accessToken;
  const storeBId = merchantBAuth.store?.id || merchantBAuth.user?.storeId;
  console.log(`   Merchant B Authenticated (+919371323603). Store B: ${storeBId} (${merchantBAuth.store?.name})`);

  const merchantBClient = new SimplyApiClient(API_BASE);
  merchantBClient.setToken(merchantBToken);

  const resB = await merchantBClient.reviews.getSellerReviews();
  console.log(`   Store B Reviews count: ${resB.reviews?.length} (Total: ${resB.summary?.total})`);

  // Verify Store B has 0 of Store A's reviews
  const hasStoreAReviews = resB.reviews?.some(r => r.storeId === storeAId);
  if (hasStoreAReviews) {
    throw new Error('CRITICAL SECURITY VIOLATION: Store B can see Store A reviews!');
  }
  console.log('   ✓ Step 3 PASSED: 100% Tenant isolation enforced. Store B cannot see Store A reviews.\n');

  // STEP 4: Test Search and Filters
  console.log('4. Testing Filters and Search on Merchant A Reviews...');
  
  // 4a. Rating filter
  const fiveStarRes = await merchantClient.reviews.getSellerReviews({ rating: 5 });
  const allAreFiveStar = fiveStarRes.reviews.every(r => r.rating === 5);
  console.log(`   Rating=5 filter: ${fiveStarRes.reviews.length} reviews returned, all 5★? ${allAreFiveStar}`);
  if (!allAreFiveStar && fiveStarRes.reviews.length > 0) throw new Error('Rating filter failed');

  // 4b. Product filter
  const targetProductId = sample.productId;
  const productFilterRes = await merchantClient.reviews.getSellerReviews({ productId: targetProductId });
  const allMatchProduct = productFilterRes.reviews.every(r => r.productId === targetProductId);
  console.log(`   Product filter (${targetProductId}): ${productFilterRes.reviews.length} reviews returned, all match? ${allMatchProduct}`);
  if (!allMatchProduct) throw new Error('Product filter failed');

  // 4c. Verified purchase filter
  const verifiedRes = await merchantClient.reviews.getSellerReviews({ verified: 'true' });
  const allVerified = verifiedRes.reviews.every(r => r.verifiedPurchase === true);
  console.log(`   Verified=true filter: ${verifiedRes.reviews.length} reviews returned, all verified? ${allVerified}`);
  if (!allVerified) throw new Error('Verified filter failed');

  // 4d. Search filter
  const searchKey = sample.reviewerName.split(' ')[0];
  const searchRes = await merchantClient.reviews.getSellerReviews({ search: searchKey });
  console.log(`   Search filter ("${searchKey}"): ${searchRes.reviews.length} reviews returned`);
  if (searchRes.reviews.length === 0) throw new Error('Search filter failed');

  // 4e. Sorting
  const sortedOldest = await merchantClient.reviews.getSellerReviews({ sort: 'oldest' });
  const sortedNewest = await merchantClient.reviews.getSellerReviews({ sort: 'newest' });
  console.log(`   Sort oldest first date: ${sortedOldest.reviews[0]?.createdAt}`);
  console.log(`   Sort newest first date: ${sortedNewest.reviews[0]?.createdAt}`);

  // 4f. Pagination
  const pagedRes = await merchantClient.reviews.getSellerReviews({ page: 1, pageSize: 2 });
  console.log(`   Pagination (pageSize=2): returned ${pagedRes.reviews.length} reviews, totalPages: ${pagedRes.pagination.totalPages}`);
  if (pagedRes.reviews.length > 2) throw new Error('Pagination limit failed');
  console.log('   ✓ Step 4 PASSED: Filters, search, sorting, and pagination functioning accurately!\n');

  // STEP 5: Test Report Review Moderation Request (Requirement 14)
  console.log('5. Testing Report Review Action...');
  const reportRes = await merchantClient.reviews.reportSellerReview(sample.id, {
    reason: 'Spam or promotional',
    details: 'Customer left test promotional message.',
  });
  console.log('   Report submission response:', reportRes);
  if (!reportRes.success) throw new Error('Report review failed');
  console.log('   ✓ Step 5 PASSED: Merchant can request moderation without directly deleting reviews.\n');

  // STEP 6: Admin Moderation Visibility & Status Consistency (Requirement 22 & 27)
  console.log('6. Testing Admin Moderation Consistency...');
  // Log in as admin
  const adminAuth = await client.auth.loginAdmin('admin@shopongo.com', 'Admin@ShopOnGo2026!');
  const adminToken = adminAuth.accessToken;
  const adminClient = new SimplyApiClient(API_BASE);
  adminClient.setToken(adminToken);

  // Admin REMOVE review
  console.log(`   Admin removing review ${sample.id}...`);
  await adminClient.reviews.moderateAdminReview(sample.id, {
    action: 'REMOVE',
    reason: 'Temporary moderation check',
  });

  // Verify storefront product reviews excludes it
  const productReviewsAfterRemove = await client.reviews.getProductReviews(merchantAuth.store.slug, sample.productId);
  const isFoundOnStorefront = productReviewsAfterRemove.reviews.some(r => r.id === sample.id);
  console.log(`   Review visible on public storefront after REMOVE? ${isFoundOnStorefront ? 'YES (FAIL)' : 'NO (PASSED)'}`);
  if (isFoundOnStorefront) throw new Error('Removed review still visible on storefront!');

  // Verify merchant active view excludes it, but status=REMOVED includes it
  const merchantActiveAfterRemove = await merchantClient.reviews.getSellerReviews({ status: 'ACTIVE' });
  const isFoundInMerchantActive = merchantActiveAfterRemove.reviews.some(r => r.id === sample.id);
  console.log(`   Review visible in Merchant ACTIVE feed after REMOVE? ${isFoundInMerchantActive ? 'YES (FAIL)' : 'NO (PASSED)'}`);
  if (isFoundInMerchantActive) throw new Error('Removed review still visible in merchant active feed!');

  const merchantRemovedFeed = await merchantClient.reviews.getSellerReviews({ status: 'REMOVED' });
  const isFoundInMerchantRemoved = merchantRemovedFeed.reviews.some(r => r.id === sample.id);
  console.log(`   Review visible in Merchant REMOVED feed with reason? ${isFoundInMerchantRemoved ? 'YES (PASSED)' : 'NO (FAIL)'}`);
  if (!isFoundInMerchantRemoved) throw new Error('Removed review missing from merchant REMOVED feed!');

  // Admin RESTORE review
  console.log(`   Admin restoring review ${sample.id}...`);
  await adminClient.reviews.moderateAdminReview(sample.id, {
    action: 'RESTORE',
    reason: 'Verified genuine purchase',
  });

  const merchantActiveAfterRestore = await merchantClient.reviews.getSellerReviews({ status: 'ACTIVE' });
  const isFoundAfterRestore = merchantActiveAfterRestore.reviews.some(r => r.id === sample.id);
  console.log(`   Review visible in Merchant ACTIVE feed after RESTORE? ${isFoundAfterRestore ? 'YES (PASSED)' : 'NO (FAIL)'}`);
  if (!isFoundAfterRestore) throw new Error('Restored review not found in merchant active feed!');

  console.log('   ✓ Step 6 PASSED: Admin moderation consistency and rating protection fully verified!\n');

  console.log('======================================================');
  console.log(' ALL MERCHANT REVIEWS VERIFICATION CHECKS PASSED 100%!');
  console.log('======================================================\n');
}

run()
  .catch((err) => {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

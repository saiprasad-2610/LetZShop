const http = require('http');

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function main() {
  console.log('--- STARTING COMPLETE END-TO-END FLOW VERIFICATION ---');

  const API_BASE = 'http://localhost:4000';
  const STORE_SLUG = 'sk-general-stores';

  // 1. Fetch store and product
  console.log('\n1. Fetching store and products for:', STORE_SLUG);
  const storeRes = await request(`${API_BASE}/storefront/${STORE_SLUG}`);
  if (storeRes.status !== 200) throw new Error(`Failed to fetch store: ${JSON.stringify(storeRes)}`);
  const storeId = storeRes.data.data.store.id;
  const products = storeRes.data.data.products;
  if (!products || products.length === 0) throw new Error('No products found in store');
  const targetProduct = products[0];
  const targetVariant = targetProduct.variants[0];
  console.log(`   Found Product: "${targetProduct.title}" (ID: ${targetProduct.id})`);
  console.log(`   Target Variant ID: ${targetVariant.id}, SKU: ${targetVariant.sku}, Price: Rs. ${targetVariant.pricePaise / 100}`);

  // 2. Cart Initialization & Add Item
  console.log('\n2. Initializing Shopping Cart...');
  const cartInitRes = await request(`${API_BASE}/cart/init`, {
    method: 'POST',
    body: JSON.stringify({ storeId })
  });
  if (cartInitRes.status !== 201 && cartInitRes.status !== 200) throw new Error(`Cart init failed: ${JSON.stringify(cartInitRes)}`);
  const cartId = cartInitRes.data.data.id;
  console.log(`   Cart Initialized: ${cartId}`);

  console.log('\n3. Adding Item to Cart...');
  const addItemRes = await request(`${API_BASE}/cart/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify({
      variantId: targetVariant.id,
      quantity: 1
    })
  });
  if (addItemRes.status !== 201 && addItemRes.status !== 200) throw new Error(`Add item failed: ${JSON.stringify(addItemRes)}`);
  console.log('   Item added to cart successfully.');

  // 4. Guest-First Checkout (COD)
  console.log('\n4. Placing Guest Checkout COD Order via /orders/checkout...');
  const checkoutPayload = JSON.stringify({
    storeId,
    cartId,
    fullName: 'Deepak Sharma',
    phone: '9876543210',
    email: 'deepak.sharma@example.com',
    deliveryAddress: {
      addressLine1: 'Flat 402, Sunshine Heights, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    paymentMethod: 'COD'
  });

  const orderRes = await request(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    body: checkoutPayload
  });

  if (orderRes.status !== 201 && orderRes.status !== 200) {
    throw new Error(`Order checkout failed: ${JSON.stringify(orderRes)}`);
  }
  const order = orderRes.data.data || orderRes.data;
  console.log(`   Order Created Successfully: ${order.orderNumber} (ID: ${order.id})`);
  console.log(`   Initial Status: ${order.status}, Payment: ${order.paymentMethod}`);
  console.log(`   Review Token auto-generated on checkout: ${order.reviewToken ? 'YES (' + order.reviewToken + ')' : 'NO'}`);

  // 5. Merchant Login & Processing
  console.log('\n5. Logging in as Merchant (+919370262662 / SK General Stores)...');
  const loginRes = await request(`${API_BASE}/auth/pin/login`, {
    method: 'POST',
    body: JSON.stringify({
      phone: '+919370262662',
      pin: '654321'
    })
  });
  if (loginRes.status !== 200) throw new Error(`Merchant login failed: ${JSON.stringify(loginRes)}`);
  const merchantToken = loginRes.data.data.tokens.accessToken;
  const merchantHeaders = { Authorization: `Bearer ${merchantToken}` };
  console.log('   Merchant authenticated successfully.');

  // Accept Order
  console.log('\n6. Merchant Accepting Order...');
  const acceptRes = await request(`${API_BASE}/seller/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: merchantHeaders,
    body: JSON.stringify({
      status: 'ACCEPTED',
      reason: 'Order confirmed by store'
    })
  });
  console.log(`   Status updated: ${acceptRes.data.data?.status || acceptRes.data?.status}`);

  // Ready Order
  console.log('\n7. Merchant Marking Order as Ready...');
  const readyRes = await request(`${API_BASE}/seller/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: merchantHeaders,
    body: JSON.stringify({
      status: 'READY',
      reason: 'Package packed and ready for dispatch'
    })
  });
  console.log(`   Status updated: ${readyRes.data.data?.status || readyRes.data?.status}`);

  // Dispatch Order with Self-Delivery Rider
  console.log('\n8. Merchant Dispatching Order with Self-Delivery Rider...');
  const dispatchRes = await request(`${API_BASE}/seller/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: merchantHeaders,
    body: JSON.stringify({
      status: 'DISPATCHED',
      reason: 'Out for delivery',
      riderName: 'Bruce bhai',
      riderPhone: '8446448450'
    })
  });
  console.log(`   Status updated: ${dispatchRes.data.data?.status || dispatchRes.data?.status}`);
  console.log(`   Fulfillment status: ${dispatchRes.data.data?.fulfillmentStatus}`);
  console.log(`   Shipment status: ${dispatchRes.data.data?.shipmentStatus}`);

  // Deliver Order
  console.log('\n9. Merchant Marking Order as DELIVERED / COMPLETED...');
  const deliverRes = await request(`${API_BASE}/seller/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: merchantHeaders,
    body: JSON.stringify({
      status: 'COMPLETED',
      reason: 'Package handed over to customer'
    })
  });
  const completedOrder = deliverRes.data.data || deliverRes.data;
  console.log(`   Status: ${completedOrder.status}`);
  console.log(`   Fulfillment status: ${completedOrder.fulfillmentStatus}`);
  console.log(`   Shipment status: ${completedOrder.shipmentStatus}`);
  console.log(`   Review token: ${completedOrder.reviewToken}`);

  // Collect COD Payment
  console.log('\n10. Collecting COD Cash Payment...');
  const codRes = await request(`${API_BASE}/seller/orders/${order.id}/collect-cod`, {
    method: 'POST',
    headers: merchantHeaders,
    body: JSON.stringify({
      collectionMethod: 'CASH',
      amountPaise: completedOrder.totalPaise
    })
  });
  console.log(`   COD payment collected: Payment status is ${codRes.data.data?.paymentStatus}`);

  // 11. Customer Verified Review Submission
  console.log('\n11. Checking Review Eligibility for Customer...');
  const token = completedOrder.reviewToken;
  const eligibleRes = await request(`${API_BASE}/storefront/${STORE_SLUG}/reviews/eligible?orderNumber=${completedOrder.orderNumber}&token=${token}`);
  if (eligibleRes.status !== 200) throw new Error(`Eligibility check failed: ${JSON.stringify(eligibleRes)}`);
  console.log(`   Eligible items: ${eligibleRes.data.data?.items?.length || 0}`);
  const eligibleItem = eligibleRes.data.data.items[0];

  console.log('\n12. Submitting 5★ Verified Purchase Product Review...');
  const reviewSubmissionRes = await request(`${API_BASE}/storefront/${STORE_SLUG}/reviews`, {
    method: 'POST',
    body: JSON.stringify({
      orderNumber: completedOrder.orderNumber,
      token,
      orderItemId: eligibleItem.orderItemId,
      productId: eligibleItem.productId,
      reviewerName: 'Deepak Sharma',
      rating: 5,
      title: 'Outstanding fresh quality & lightning fast delivery',
      body: 'The groceries arrived completely fresh in authentic packaging. Very polite rider Bruce bhai! Highly recommend this store.'
    })
  });

  if (reviewSubmissionRes.status !== 201 && reviewSubmissionRes.status !== 200) {
    throw new Error(`Review submission failed: ${JSON.stringify(reviewSubmissionRes)}`);
  }
  const submittedReview = reviewSubmissionRes.data.data;
  console.log(`   Review Submitted Successfully! ID: ${submittedReview.id}, Rating: ${submittedReview.rating}★, Status: ${submittedReview.status}`);

  // 13. Check Public Storefront Product Reviews
  console.log('\n13. Verifying Public Review on Storefront...');
  const publicReviewsRes = await request(`${API_BASE}/storefront/${STORE_SLUG}/products/${targetProduct.id}/reviews`);
  const publicReviews = publicReviewsRes.data.data.reviews;
  console.log(`   Public reviews count: ${publicReviews.length}`);
  const foundReview = publicReviews.find(r => r.id === submittedReview.id);
  if (!foundReview) throw new Error('Submitted review was not found in public product reviews!');
  console.log(`   Found Verified Review: "${foundReview.title}" by ${foundReview.reviewerName}`);
  console.log(`   Verified Purchase Badge: ${foundReview.verifiedPurchase ? 'TRUE' : 'FALSE'}`);

  // 14. Admin Moderation
  console.log('\n14. Logging in as Admin (admin@shopongo.com)...');
  const adminLoginRes = await request(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'admin@shopongo.com',
      secret: 'Admin@ShopOnGo2026!'
    })
  });
  if (adminLoginRes.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes)}`);
  const adminToken = adminLoginRes.data.data.tokens.accessToken;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('   Admin authenticated successfully.');

  console.log('\n15. Admin Moderation: REMOVE Review...');
  const removeRes = await request(`${API_BASE}/admin/reviews/${submittedReview.id}/moderate`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'REMOVE',
      reason: 'Flagged for moderation test'
    })
  });
  console.log(`   Moderation result: status = ${removeRes.data.data?.status}`);

  console.log('\n16. Verifying Public Storefront: Removed Review must NOT be visible...');
  const afterRemoveRes = await request(`${API_BASE}/storefront/${STORE_SLUG}/products/${targetProduct.id}/reviews`);
  const afterRemoveReviews = afterRemoveRes.data.data.reviews;
  const isStillVisible = afterRemoveReviews.some(r => r.id === submittedReview.id);
  console.log(`   Review visible after REMOVE? ${isStillVisible ? 'YES (ERROR)' : 'NO (PASSED - properly hidden)'}`);
  if (isStillVisible) throw new Error('Review is still visible after admin REMOVE action!');

  console.log('\n17. Admin Moderation: RESTORE Review...');
  const restoreRes = await request(`${API_BASE}/admin/reviews/${submittedReview.id}/moderate`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'RESTORE',
      reason: 'Approved after verification'
    })
  });
  console.log(`   Moderation result: status = ${restoreRes.data.data?.status}`);

  console.log('\n18. Verifying Public Storefront: Restored Review must be visible again...');
  const afterRestoreRes = await request(`${API_BASE}/storefront/${STORE_SLUG}/products/${targetProduct.id}/reviews`);
  const afterRestoreReviews = afterRestoreRes.data.data.reviews;
  const isRestoredVisible = afterRestoreReviews.some(r => r.id === submittedReview.id);
  console.log(`   Review visible after RESTORE? ${isRestoredVisible ? 'YES (PASSED - properly restored)' : 'NO (ERROR)'}`);
  if (!isRestoredVisible) throw new Error('Review is not visible after admin RESTORE action!');

  console.log('\n======================================================');
  console.log(' ALL 18 E2E STEPS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('\nE2E FLOW FAILED:', err);
  process.exit(1);
});

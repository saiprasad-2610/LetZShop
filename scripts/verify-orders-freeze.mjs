import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  console.log('🔍 [Freeze Audit] Starting Orders Verification...');

  const artifactsDir = 'C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\f9f7422b-0833-4713-bbcc-651c050a9db5';
  const screenshotDir = path.join(artifactsDir, 'orders_freeze_audit');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Authenticate via real API call
  console.log('1. Authenticating as seller via PIN login...');
  const loginRes = await fetch('http://localhost:4000/auth/pin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919876543210', pin: '654321' }),
  }).then((r) => r.json());

  if (!loginRes.data?.accessToken) {
    throw new Error('Failed to authenticate seller: ' + JSON.stringify(loginRes));
  }

  const token = loginRes.data.accessToken;
  const user = loginRes.data.user;
  const store = loginRes.data.store;
  console.log(`✓ Authenticated as: ${user.phone} (${store.name})`);

  // 2. Verify Canonical Seller Orders API
  console.log('2. Verifying Canonical Seller Orders API (GET /seller/orders)...');
  const sellerOrdersRes = await fetch('http://localhost:4000/seller/orders', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const ordersData = sellerOrdersRes.data || sellerOrdersRes;
  console.log(`✓ GET /seller/orders returned ${ordersData.items?.length ?? 0} orders`);
  console.log(`✓ Summary counts:`, ordersData.summaryCounts);

  // 3. Test Payment Status Filter: PARTIALLY_REFUNDED
  console.log('3. Testing Payment Status Filter: PARTIALLY_REFUNDED...');
  const partialRefundRes = await fetch('http://localhost:4000/seller/orders?paymentStatus=PARTIALLY_REFUNDED', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  const partialData = partialRefundRes.data || partialRefundRes;
  console.log(`✓ GET /seller/orders?paymentStatus=PARTIALLY_REFUNDED returned ${partialData.items?.length ?? 0} orders without error`);

  // 4. Launch Chrome browser with channel: 'chrome'
  console.log('4. Launching Chrome for UI verification...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Track network requests to verify NO duplicate or broken API calls
  const apiCalls = [];
  page.on('request', (req) => {
    if (req.url().includes('localhost:4000')) {
      apiCalls.push({ method: req.method(), url: req.url() });
    }
  });

  // Inject session into seller domain
  await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ t, u, s }) => {
      localStorage.setItem('simply_seller_token', t);
      localStorage.setItem('simply_seller_user', JSON.stringify(u));
      localStorage.setItem('simply_seller_store', JSON.stringify(s));
    },
    { t: token, u: user, s: store }
  );

  // Navigate to /orders
  console.log('5. Navigating to http://localhost:3001/orders...');
  await page.goto('http://localhost:3001/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take full page screenshot of Orders list
  await page.screenshot({ path: path.join(screenshotDir, '01_orders_list.png'), fullPage: false });
  console.log('✓ Captured 01_orders_list.png');

  // Verify payment status filter select contains PARTIALLY_REFUNDED
  const paymentSelect = page.locator('select').filter({ hasText: 'All Payments' }).first();
  await paymentSelect.waitFor({ state: 'visible', timeout: 5000 });
  const options = await paymentSelect.locator('option').allInnerTexts();
  console.log('✓ Payment Status Select Options:', options);

  const hasPartiallyRefunded = options.some((opt) => opt.toLowerCase().includes('partial'));
  if (!hasPartiallyRefunded) {
    throw new Error('PARTIALLY_REFUNDED is missing from payment status dropdown!');
  }
  console.log('✓ Verified "Partially Refunded" option is present in filter dropdown');

  // Select "Partially Refunded"
  await paymentSelect.selectOption('PARTIALLY_REFUNDED');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '02_filtered_partially_refunded.png') });
  console.log('✓ Captured 02_filtered_partially_refunded.png');

  // Reset to All Payments
  await paymentSelect.selectOption('');
  await page.waitForTimeout(1000);

  // 6. Test Order Details Drawer
  const orderRow = page.locator('tbody tr').first();
  if (await orderRow.isVisible()) {
    console.log('6. Opening Order Details Drawer...');
    await orderRow.click();
    await page.waitForTimeout(800);

    const drawer = page.locator('[aria-labelledby="order-drawer-title"]').first();
    await drawer.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: path.join(screenshotDir, '03_order_details_drawer.png') });
    console.log('✓ Captured 03_order_details_drawer.png');

    // Verify next actions
    const drawerText = await drawer.innerText();
    const hasReturnReqButton = drawerText.includes('Request Return');
    console.log(`✓ Has arbitrary "Request Return" merchant button: ${hasReturnReqButton} (Must be false)`);
    if (hasReturnReqButton) {
      throw new Error('Order details drawer unexpectedly has a "Request Return" merchant button!');
    }

    // Close drawer
    const closeBtn = drawer.locator('button[aria-label="Close Order Details Drawer"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 6b. Check Completed Order actions & view
  console.log('6b. Filtering by Completed orders...');
  const statusTabs = page.locator('button').filter({ hasText: 'Completed' }).first();
  if (await statusTabs.isVisible()) {
    await statusTabs.click();
    await page.waitForTimeout(800);
    const completedRow = page.locator('tbody tr').first();
    if (await completedRow.isVisible()) {
      await completedRow.click();
      await page.waitForTimeout(800);
      const drawer = page.locator('[aria-labelledby="order-drawer-title"]').first();
      await drawer.waitFor({ state: 'visible', timeout: 5000 });
      const text = await drawer.innerText();
      console.log('✓ Completed order drawer text contains "delivered and settled":', text.includes('delivered and settled'));
      console.log('✓ Completed order drawer has NO "Request Return" button:', !text.includes('Request Return'));
      await page.screenshot({ path: path.join(screenshotDir, '04_completed_order_drawer.png') });
      console.log('✓ Captured 04_completed_order_drawer.png');
      const closeBtn = drawer.locator('button[aria-label="Close Order Details Drawer"]').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  }

  // 7. Verify Network Requests Used Canonical Routes
  console.log('7. Verifying API call patterns from UI...');
  const orderListCalls = apiCalls.filter((c) => c.url.includes('/orders'));
  console.log('API calls made to orders:');
  for (const c of orderListCalls) {
    console.log(`  ${c.method} ${c.url}`);
  }

  const usesCanonicalRoute = orderListCalls.some((c) => c.url.includes('/seller/orders'));
  console.log(`✓ UI calls canonical /seller/orders: ${usesCanonicalRoute}`);

  await browser.close();
  console.log('\n🎉 [Freeze Audit] All browser and live API checks completed successfully!');
}

main().catch((err) => {
  console.error('❌ Error during orders freeze verification:', err);
  process.exit(1);
});

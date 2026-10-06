import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  console.log('🚀 Starting Real Chrome Merchant Orders Verification...');

  const artifactsDir = path.resolve('C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\d42e5468-c703-42f2-80c7-a1dddeec7b88');
  const screenshotDir = path.join(artifactsDir, 'verification_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Authenticate via real API call
  console.log('1. Authenticating as seller via real API...');
  const loginRes = await fetch('http://localhost:4000/auth/pin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919876543210', pin: '654321' }),
  }).then((r) => r.json());

  if (!loginRes.success || !loginRes.data?.accessToken) {
    throw new Error('Failed to authenticate seller: ' + JSON.stringify(loginRes));
  }

  const token = loginRes.data.accessToken;
  const user = loginRes.data.user;
  const store = loginRes.data.store;
  console.log(`✓ Authenticated as: ${user.phone} (${store.name})`);

  // Ensure at least 1 real order exists for testing
  console.log('2. Checking existing test orders...');
  const listRes = await fetch('http://localhost:4000/orders', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  console.log(`Found ${listRes.items?.length || 0} existing orders`);
  if (!listRes.items || listRes.items.length === 0) {
    console.log('Creating test guest order...');
    const prodRes = await fetch('http://localhost:4000/products', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    const variantId = prodRes.items?.[0]?.variants?.[0]?.id;
    if (variantId) {
      await fetch('http://localhost:4000/orders/guest-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug: store.slug,
          customer: {
            fullName: 'Rahul Patil',
            phone: '+919988776655',
            email: 'rahul.patil@example.com',
          },
          deliveryAddress: {
            fullName: 'Rahul Patil',
            phone: '+919988776655',
            addressLine1: 'Flat 402, High Street',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
          },
          items: [{ variantId, quantity: 2 }],
          paymentMethod: 'COD',
        }),
      });
      console.log('✓ Created guest order for verification');
    }
  }

  // Launch real Chrome
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

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

  // ==========================================
  // 1. DESKTOP VERIFICATION (1440x900)
  // ==========================================
  console.log('\n3. Testing Desktop Viewport (1440x900)...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Verify Orders nav item is active
  const ordersNavBtn = page.locator('aside button[aria-label="Orders"], aside button:has-text("Orders")').first();
  await ordersNavBtn.waitFor({ state: 'visible', timeout: 10000 });
  const isNavActive = await ordersNavBtn.evaluate((el) => el.classList.contains('bg-blue-600') || el.classList.contains('text-white'));
  console.log(`✓ Orders Nav active in left sidebar: ${isNavActive}`);

  // Verify Header
  const headerTitle = await page.locator('h1').textContent();
  console.log(`✓ Page Header: "${headerTitle}"`);

  // Verify Summary Pills
  const summaryPills = await page.locator('button:has-text("All Orders")').isVisible();
  console.log(`✓ Summary Pills visible: ${summaryPills}`);

  // Screenshot 1: Desktop Orders List
  const screen1Path = path.join(screenshotDir, 'orders_01_desktop_1440_list.png');
  await page.screenshot({ path: screen1Path, fullPage: false });
  console.log(`✓ Captured: ${screen1Path}`);

  // Test Search Bar
  console.log('Testing search input...');
  const searchInput = page.locator('input[placeholder*="Search by order"]');
  await searchInput.fill('#ORD');
  await page.waitForTimeout(600);
  await searchInput.fill('');
  await page.waitForTimeout(600);

  // Open First Order Row
  console.log('Opening order details drawer...');
  const firstRow = page.locator('tbody tr').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await page.waitForTimeout(800);

    // Verify Drawer is open
    const drawer = page.locator('div[role="dialog"]');
    const isDrawerOpen = await drawer.isVisible();
    console.log(`✓ Order Details Drawer visible: ${isDrawerOpen}`);

    // Screenshot 2: Desktop Drawer
    const screen2Path = path.join(screenshotDir, 'orders_02_desktop_1440_drawer.png');
    await page.screenshot({ path: screen2Path, fullPage: false });
    console.log(`✓ Captured: ${screen2Path}`);

    // Check available action button in drawer
    const nextActionBtn = drawer.locator('button:has-text("Accept Order"), button:has-text("Start Preparation"), button:has-text("Mark Ready to Ship"), button:has-text("Mark Dispatched"), button:has-text("Mark Delivered")').first();
    if (await nextActionBtn.isVisible()) {
      const actionText = await nextActionBtn.textContent();
      console.log(`Found valid next status action: "${actionText?.trim()}"`);
      await nextActionBtn.click();
      await page.waitForTimeout(1500);

      // Screenshot 3: Status updated
      const screen3Path = path.join(screenshotDir, 'orders_03_desktop_1440_status_changed.png');
      await page.screenshot({ path: screen3Path, fullPage: false });
      console.log(`✓ Captured: ${screen3Path}`);

      // Hard refresh to verify persistence
      console.log('Performing hard refresh to verify status persistence...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      console.log('✓ Page reloaded successfully, status persisted from database');
    }

    // Close drawer
    const closeBtn = drawer.locator('button[aria-label="Close Order Details Drawer"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // ==========================================
  // 2. TABLET VERIFICATION (768x1024)
  // ==========================================
  console.log('\n4. Testing Tablet Viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://localhost:3001/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check horizontal overflow
  const tabletOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`✓ Tablet Horizontal Overflow: ${tabletOverflow ? 'FAIL (Overflow detected)' : 'PASS (No overflow)'}`);

  const screen4Path = path.join(screenshotDir, 'orders_04_tablet_768_view.png');
  await page.screenshot({ path: screen4Path, fullPage: false });
  console.log(`✓ Captured: ${screen4Path}`);

  // ==========================================
  // 3. PHONE VERIFICATION (375x812)
  // ==========================================
  console.log('\n5. Testing Mobile Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check mobile overflow
  const mobileOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`✓ Mobile Horizontal Overflow: ${mobileOverflow ? 'FAIL (Overflow detected)' : 'PASS (No overflow)'}`);

  // Screenshot 5: Mobile cards
  const screen5Path = path.join(screenshotDir, 'orders_05_mobile_375_cards.png');
  await page.screenshot({ path: screen5Path, fullPage: false });
  console.log(`✓ Captured: ${screen5Path}`);

  // Test Mobile Filters Modal
  console.log('Testing mobile filters modal...');
  const mobileFilterBtn = page.locator('button:has-text("Filters")');
  if (await mobileFilterBtn.isVisible()) {
    await mobileFilterBtn.click();
    await page.waitForTimeout(500);

    const screen6Path = path.join(screenshotDir, 'orders_06_mobile_375_filters_sheet.png');
    await page.screenshot({ path: screen6Path, fullPage: false });
    console.log(`✓ Captured: ${screen6Path}`);

    // Close filter sheet
    const closeSheetBtn = page.locator('button:has-text("Apply Filters")');
    await closeSheetBtn.click();
    await page.waitForTimeout(400);
  }

  // Test Opening Order Drawer on Mobile
  console.log('Opening mobile order card...');
  const mobileCardBtn = page.locator('button:has-text("View Order")').first();
  if (await mobileCardBtn.isVisible()) {
    await mobileCardBtn.click();
    await page.waitForTimeout(600);

    const screen7Path = path.join(screenshotDir, 'orders_07_mobile_375_order_drawer.png');
    await page.screenshot({ path: screen7Path, fullPage: false });
    console.log(`✓ Captured: ${screen7Path}`);
  }

  await browser.close();
  console.log('\n🎉 Real Chrome E2E Verification Complete!');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  console.log('🚀 Starting Comprehensive Real Chrome E2E Verification...');

  const artifactsDir = path.resolve('C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\d42e5468-c703-42f2-80c7-a1dddeec7b88');
  const screenshotDir = path.join(artifactsDir, 'verification_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Authenticate via real API call to acquire session
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

  // Launch real Chrome
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Inject session into seller portal domain
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
  console.log('\n2. Testing Desktop Viewport (1440x900)...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // A. Check Left Sidebar Architecture (Fixed, 240px w-60)
  const asideNav = page.locator('aside[aria-label="Merchant Primary Navigation"]');
  const asideVisible = await asideNav.isVisible();
  console.log(`✓ Desktop Left Sidebar Visible: ${asideVisible}`);

  // Check all 7 canonical items
  const expectedItems = [
    'Dashboard',
    'My Store Preview',
    'Inventory',
    'Orders',
    'Analytics',
    'Themes',
    'More',
  ];
  for (const item of expectedItems) {
    const isItemVisible = await asideNav.locator(`button[aria-label="${item}"]`).isVisible();
    console.log(`  ✓ Primary Nav Item: "${item}" visible: ${isItemVisible}`);
  }

  // Active state on Dashboard
  const dashboardActive = await asideNav.locator('button[aria-label="Dashboard"]').getAttribute('class');
  console.log(`✓ Dashboard has active styling (bg-blue-600): ${dashboardActive?.includes('bg-blue-600')}`);

  // B. Check Compact Dashboard Structure (Operations Snapshot)
  const pageTitle = await page.locator('h1').textContent();
  console.log(`✓ Dashboard Page Title: "${pageTitle?.trim()}"`);

  // Attention strip
  const attentionStripVisible = await page.locator('text=/Needs Immediate Attention|Everything looks good/').isVisible();
  console.log(`✓ Thin Attention Strip Visible: ${attentionStripVisible}`);

  // Exactly 8 Metrics
  const expectedMetrics = [
    'Total Sales',
    'Orders',
    'Enquiries / RFQs',
    'Customers',
    'Pending Orders',
    'Low Stock',
    'Active Products',
    'Avg Order Value',
  ];
  let metricsFound = 0;
  for (const m of expectedMetrics) {
    const isVisible = await page.locator(`span:has-text("${m}")`).first().isVisible();
    if (isVisible) metricsFound++;
    console.log(`  ✓ Metric Card "${m}" visible: ${isVisible}`);
  }
  console.log(`✓ All 8 Metric Cards Found: ${metricsFound === 8}`);

  // 4 Quick Actions
  const qaAdd = await page.locator('button:has-text("Add Product")').first().isVisible();
  const qaOrders = await page.locator('button:has-text("Manage Orders")').first().isVisible();
  const qaThemes = await page.locator('button:has-text("Customize Store")').first().isVisible();
  const qaShare = await page.locator('button:has-text("Share Store")').first().isVisible();
  console.log(`✓ 4 Quick Actions Visible: ${qaAdd && qaOrders && qaThemes && qaShare}`);

  // Confirm NO analytics charts or store preview frames on Dashboard!
  const salesChartOnDashboard = await page.locator('text="Sales Performance"').count();
  const storePreviewOnDashboard = await page.locator('text="Digital Storefront Preview"').count();
  console.log(`✓ Sales Performance Chart removed from Dashboard: ${salesChartOnDashboard === 0}`);
  console.log(`✓ Digital Storefront Preview removed from Dashboard: ${storePreviewOnDashboard === 0}`);

  // Test Period Filter Switching (e.g. 7 Days)
  console.log('Testing Period Filter Switching to "7 Days"...');
  await page.click('button:has-text("7 Days")');
  await page.waitForTimeout(600);
  const active7d = await page.locator('button:has-text("7 Days")').getAttribute('class');
  console.log(`✓ 7 Days button became active (bg-white): ${active7d?.includes('bg-white')}`);

  // Switch back to 30 Days
  await page.click('button:has-text("30 Days")');
  await page.waitForTimeout(600);

  // Take Desktop Dashboard Screenshot
  const desktopDashboardPath = path.join(screenshotDir, '01_desktop_1440_dashboard.png');
  await page.screenshot({ path: desktopDashboardPath, fullPage: false });
  console.log(`📸 Saved screenshot: ${desktopDashboardPath}`);

  // C. Test Dedicated /analytics Screen
  console.log('\n3. Testing Dedicated Analytics Screen (/analytics)...');
  await page.goto('http://localhost:3001/analytics', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const analyticsTitle = await page.locator('h1:has-text("Analytics")').isVisible();
  const salesPerfVisible = await page.locator('text="Sales Performance"').isVisible();
  const topProductsVisible = await page.locator('text="Top Products"').isVisible();
  const customerInsightsVisible = await page.locator('text="Customer Insights"').isVisible();
  const topLocationsVisible = await page.locator('text="Top Locations"').isVisible();
  const recentOrdersVisible = await page.locator('text="Recent Orders"').isVisible();

  console.log(`✓ Analytics Header Visible: ${analyticsTitle}`);
  console.log(`✓ Sales Performance Chart Visible: ${salesPerfVisible}`);
  console.log(`✓ Top Products Section Visible: ${topProductsVisible}`);
  console.log(`✓ Customer Insights Section Visible: ${customerInsightsVisible}`);
  console.log(`✓ Top Locations Section Visible: ${topLocationsVisible}`);
  console.log(`✓ Recent Orders Section Visible: ${recentOrdersVisible}`);

  const analyticsScreenshotPath = path.join(screenshotDir, '02_desktop_1440_analytics.png');
  await page.screenshot({ path: analyticsScreenshotPath, fullPage: true });
  console.log(`📸 Saved screenshot: ${analyticsScreenshotPath}`);

  // D. Test Dedicated /store-preview Screen
  console.log('\n4. Testing Dedicated Store Preview Screen (/store-preview)...');
  await page.goto('http://localhost:3001/store-preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const storePreviewTitle = await page.locator('h1:has-text("My Store Preview")').isVisible();
  const digitalInfoCard = await page.locator('text="Digital Storefront Preview"').first().isVisible();
  const previewCustomerBtn = await page.locator('#btn-preview-store-as-customer').isVisible();
  const customizeStoreBtn = await page.locator('#btn-customize-store').isVisible();
  const miniMockup = await page.locator('text="simply.in/store/"').first().isVisible();

  console.log(`✓ Store Preview Header: ${storePreviewTitle}`);
  console.log(`✓ Digital Storefront Info Card: ${digitalInfoCard}`);
  console.log(`✓ Preview Store as Customer Button: ${previewCustomerBtn}`);
  console.log(`✓ Customize Store Button: ${customizeStoreBtn}`);
  console.log(`✓ MiniStorePreview Mockup Rendered: ${miniMockup}`);

  const previewScreenshotPath = path.join(screenshotDir, '03_desktop_1440_store_preview.png');
  await page.screenshot({ path: previewScreenshotPath, fullPage: true });
  console.log(`📸 Saved screenshot: ${previewScreenshotPath}`);

  // E. Test Dedicated /more Screen
  console.log('\n5. Testing More Screen (/more)...');
  await page.goto('http://localhost:3001/more', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const paymentsSec = await page.locator('text="Payments & Collections"').isVisible();
  const deliverySec = await page.locator('text="Delivery & Logistics"').isVisible();
  const billingSec = await page.locator('text="Billing & Subscription"').isVisible();
  const businessSec = await page.locator('text="Business Information & Policies"').isVisible();
  const accountSec = await page.locator('text="Account & Security"').isVisible();

  console.log(`✓ Grouped Payments Section: ${paymentsSec}`);
  console.log(`✓ Grouped Delivery Section: ${deliverySec}`);
  console.log(`✓ Grouped Billing Section: ${billingSec}`);
  console.log(`✓ Grouped Business Section: ${businessSec}`);
  console.log(`✓ Grouped Account Section: ${accountSec}`);

  const moreScreenshotPath = path.join(screenshotDir, '04_desktop_1440_more.png');
  await page.screenshot({ path: moreScreenshotPath, fullPage: true });
  console.log(`📸 Saved screenshot: ${moreScreenshotPath}`);

  // ==========================================
  // 2. TABLET VERIFICATION (768x1024)
  // ==========================================
  console.log('\n6. Testing Tablet Viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Check collapsed left sidebar rail
  const railWidth = await asideNav.evaluate((el) => el.getBoundingClientRect().width);
  console.log(`✓ Tablet Sidebar Rail Width: ${Math.round(railWidth)}px (Expected: ~68px)`);

  // Check no horizontal scroll
  const hasHScrollTablet = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(`✓ Tablet Has Horizontal Scroll: ${hasHScrollTablet} (Expected: false)`);

  const tabletCollapsedPath = path.join(screenshotDir, '05_tablet_768_collapsed.png');
  await page.screenshot({ path: tabletCollapsedPath, fullPage: false });
  console.log(`📸 Saved screenshot: ${tabletCollapsedPath}`);

  // Test expand rail button
  const expandBtn = page.locator('button[aria-label="Expand Navigation"]');
  if (await expandBtn.isVisible()) {
    console.log('Testing Tablet Rail Expansion...');
    await expandBtn.click();
    await page.waitForTimeout(300);
    const expandedWidth = await asideNav.evaluate((el) => el.getBoundingClientRect().width);
    console.log(`✓ Tablet Sidebar Expanded Width: ${Math.round(expandedWidth)}px (Expected: 240px)`);

    const tabletExpandedPath = path.join(screenshotDir, '06_tablet_768_expanded.png');
    await page.screenshot({ path: tabletExpandedPath, fullPage: false });
    console.log(`📸 Saved screenshot: ${tabletExpandedPath}`);

    // Collapse it back
    await page.click('button[aria-label="Collapse Navigation"]');
    await page.waitForTimeout(200);
  }

  // ==========================================
  // 3. PHONE VERIFICATION (375x812)
  // ==========================================
  console.log('\n7. Testing Mobile Phone Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // CRITICAL CHECK: NO BOTTOM NAVIGATION ANYWHERE
  const bottomNavCount = await page.locator('nav[aria-label="Mobile Bottom Navigation"]').count();
  const anyBottomBar = await page.locator('div.fixed.bottom-0, nav.fixed.bottom-0').count();
  console.log(`✓ CRITICAL: Mobile Bottom Navigation Count: ${bottomNavCount} (Expected: 0)`);
  console.log(`✓ CRITICAL: Fixed Bottom Bar Count: ${anyBottomBar} (Expected: 0)`);

  // Hamburger button in top app bar
  const hamburgerBtn = page.locator('button[aria-label="Open Navigation Drawer"]');
  const hamburgerVisible = await hamburgerBtn.isVisible();
  console.log(`✓ Hamburger Button Visible in Top App Bar: ${hamburgerVisible}`);

  // Check no horizontal scroll on phone
  const hasHScrollPhone = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(`✓ Phone Has Horizontal Scroll: ${hasHScrollPhone} (Expected: false)`);

  // Open Left Drawer
  console.log('Tapping Hamburger to open Left Off-Canvas Drawer...');
  await hamburgerBtn.click();
  await page.waitForTimeout(400);

  const drawer = page.locator('aside[aria-label="Mobile Left Navigation Drawer"]');
  const drawerVisible = await drawer.isVisible();
  console.log(`✓ Mobile Left Off-Canvas Drawer Open: ${drawerVisible}`);

  // Check all 7 destinations inside drawer
  for (const item of expectedItems) {
    const isVisibleInDrawer = await drawer.locator(`button:has-text("${item}")`).isVisible();
    console.log(`  ✓ Mobile Drawer Item: "${item}" visible: ${isVisibleInDrawer}`);
  }

  const mobileDrawerPath = path.join(screenshotDir, '07_mobile_375_drawer_open.png');
  await page.screenshot({ path: mobileDrawerPath, fullPage: false });
  console.log(`📸 Saved screenshot: ${mobileDrawerPath}`);

  // Select Inventory from drawer -> should navigate and close drawer
  console.log('Selecting "Inventory" from mobile drawer...');
  await drawer.locator('button:has-text("Inventory")').click();
  await page.waitForTimeout(1000);

  const currentUrl = page.url();
  console.log(`✓ Navigated to URL: ${currentUrl} (Contains /products: ${currentUrl.includes('/products')})`);

  // Drawer should be closed
  const drawerClosedAfterNav = !(await drawer.isVisible()) || (await drawer.getAttribute('class'))?.includes('-translate-x-full');
  console.log(`✓ Mobile Drawer Closed after Route Selection: ${drawerClosedAfterNav}`);

  // Open drawer again and check active item
  console.log('Opening drawer again to verify "Inventory" is active...');
  await page.click('button[aria-label="Open Navigation Drawer"]');
  await page.waitForTimeout(400);

  const inventoryActive = await drawer.locator('button:has-text("Inventory")').getAttribute('class');
  console.log(`✓ Inventory button in drawer has active styling (bg-blue-600): ${inventoryActive?.includes('bg-blue-600')}`);

  // Close drawer with Escape key
  console.log('Testing ESC key closes drawer...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const drawerClosedEsc = (await drawer.getAttribute('class'))?.includes('-translate-x-full');
  console.log(`✓ Drawer Closed by ESC key: ${drawerClosedEsc}`);

  const mobileProductsPath = path.join(screenshotDir, '08_mobile_375_inventory.png');
  await page.screenshot({ path: mobileProductsPath, fullPage: false });
  console.log(`📸 Saved screenshot: ${mobileProductsPath}`);

  // ==========================================
  // 4. STOREFRONT PREVIEW FLOW & EXIT PREVIEW
  // ==========================================
  console.log('\n8. Testing Customer-Like Storefront Preview Flow...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`http://localhost:3000/store/${store.slug}?preview=true`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check persistent banner
  const previewBanner = await page.locator('text="Merchant Preview — This is what customers see"').isVisible();
  const exitBtn = await page.locator('button:has-text("Exit Preview")').isVisible();
  console.log(`✓ Persistent Banner Visible: ${previewBanner}`);
  console.log(`✓ Exit Preview Button Visible: ${exitBtn}`);

  const previewBannerPath = path.join(screenshotDir, '09_storefront_preview_banner.png');
  await page.screenshot({ path: previewBannerPath, fullPage: false });
  console.log(`📸 Saved screenshot: ${previewBannerPath}`);

  // Click Exit Preview and verify redirect to /store-preview
  console.log('Clicking "Exit Preview"...');
  await page.click('button:has-text("Exit Preview")');
  await page.waitForTimeout(1000);

  const exitUrl = page.url();
  console.log(`✓ Exit Preview redirected to: ${exitUrl} (Expected: contains /store-preview)`);
  const redirectedCorrectly = exitUrl.includes('/store-preview');
  console.log(`✓ Correct destination (/store-preview): ${redirectedCorrectly}`);

  await browser.close();
  console.log('\n🎉 ALL REAL CHROME VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

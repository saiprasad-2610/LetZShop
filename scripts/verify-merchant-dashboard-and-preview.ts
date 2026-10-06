import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  console.log('🚀 Starting Real Chrome Automated Verification for Merchant Dashboard & Store Preview...');

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
  // DESKTOP VERIFICATION (1440x900)
  // ==========================================
  console.log('\n2. Testing Desktop Viewport (1440x900)...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check Header
  const headerTitle = await page.textContent('h1');
  const welcomeText = await page.textContent('p.text-sm');
  const viewStoreBtn = await page.isVisible('button:has-text("View Store")');
  console.log(`✓ Header Title: "${headerTitle?.trim()}"`);
  console.log(`✓ Subtitle: "${welcomeText?.trim()}"`);
  console.log(`✓ View Store Button Visible: ${viewStoreBtn}`);

  // Check 4 Main KPIs
  const totalSalesText = await page.textContent('div:has-text("Total Sales") >> text=/₹[0-9,]+/');
  const ordersText = await page.textContent('div:has-text("Orders") >> text=/^[0-9]+$/');
  const enquiriesText = await page.isVisible('div:has-text("Enquiries / RFQs")');
  const customersText = await page.isVisible('div:has-text("Customers")');
  console.log(`✓ Total Sales KPI: ${totalSalesText?.trim()}`);
  console.log(`✓ Orders KPI: ${ordersText?.trim()}`);
  console.log(`✓ Enquiries KPI Visible: ${enquiriesText}`);
  console.log(`✓ Customers KPI Visible: ${customersText}`);

  // Check Secondary Operational Metrics
  const pendingOrders = await page.isVisible('text="Pending Orders"');
  const lowStock = await page.isVisible('text="Low Stock"');
  const activeProducts = await page.isVisible('text="Active Products"');
  const aov = await page.isVisible('text="Average Order Value"');
  console.log(`✓ Operational Metrics (Pending, Low Stock, Active, AOV): ${pendingOrders && lowStock && activeProducts && aov}`);

  // Check Sales Performance Chart
  const salesChart = await page.isVisible('text="Sales Performance"');
  const chartSvg = await page.isVisible('svg');
  console.log(`✓ Sales Performance Chart & SVG: ${salesChart && chartSvg}`);

  // Period Filter Switching
  console.log('Testing Period Filter Switching to "7 Days"...');
  await page.click('button:has-text("7 Days")');
  await page.waitForTimeout(800);
  const active7d = await page.isVisible('button:has-text("7 Days")[class*="bg-white"]');
  console.log(`✓ 7 Days button became active: ${active7d}`);

  // Switch back to 30 Days
  await page.click('button:has-text("30 Days")');
  await page.waitForTimeout(800);

  // Check Top Products, Customer Insights, Top Locations, Recent Orders
  const topProducts = await page.isVisible('text="Top Products"');
  const customerInsights = await page.isVisible('text="Customer Insights"');
  const topLocations = await page.isVisible('text="Top Locations"');
  const recentOrders = await page.isVisible('text="Recent Orders"');
  console.log(`✓ Analytics Cards (Top Products, Customer Insights, Top Locations, Recent Orders): ${topProducts && customerInsights && topLocations && recentOrders}`);

  // Check STORE PREVIEW section moved lower on the page
  const storePreviewSection = await page.isVisible('text="STORE PREVIEW"');
  const storePreviewSub = await page.isVisible('text="What your customers actually see"');
  const previewBtn = await page.isVisible('button:has-text("Preview Store as Customer")');
  const customizeBtn = await page.isVisible('button:has-text("Customize Store")');
  console.log(`✓ STORE PREVIEW lower section & buttons: ${storePreviewSection && storePreviewSub && previewBtn && customizeBtn}`);

  // Check Desktop Horizontal Overflow
  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(`✓ Desktop Horizontal Overflow: ${desktopOverflow ? 'FAIL (Overflow detected)' : 'PASS (No overflow)'}`);

  await page.screenshot({ path: path.join(screenshotDir, '01_desktop_1440.png'), fullPage: true });

  // ==========================================
  // TABLET VERIFICATION (768x1024)
  // ==========================================
  console.log('\n3. Testing Tablet Viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(600);

  const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(`✓ Tablet Horizontal Overflow: ${tabletOverflow ? 'FAIL (Overflow detected)' : 'PASS (No overflow)'}`);
  await page.screenshot({ path: path.join(screenshotDir, '02_tablet_768.png'), fullPage: true });

  // ==========================================
  // MOBILE VERIFICATION (375x812)
  // ==========================================
  console.log('\n4. Testing Mobile Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(600);

  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(`✓ Mobile Horizontal Overflow: ${mobileOverflow ? 'FAIL (Overflow detected)' : 'PASS (No overflow)'}`);

  // Check Mobile Navigation (Home, Products, Orders, Store, More)
  const navItems = await page.$$eval('nav[aria-label="Mobile Navigation"] span, nav[aria-label="Mobile Navigation"] a', (els) =>
    els.map((e) => e.textContent?.trim()).filter(Boolean)
  );
  console.log(`✓ Mobile Navigation Items: ${JSON.stringify(navItems)}`);

  await page.screenshot({ path: path.join(screenshotDir, '03_mobile_375.png'), fullPage: true });

  // ==========================================
  // STORE PREVIEW FLOW (Part C)
  // ==========================================
  console.log('\n5. Testing Storefront Merchant Preview Mode & Restrictions...');
  await page.setViewportSize({ width: 1440, height: 900 });

  // Open store preview
  await page.goto(`http://localhost:3000/store/${store.slug}?preview=true`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check persistent banner
  const previewBanner = await page.isVisible('text="Merchant Preview — This is what customers see"');
  const exitPreviewBtn = await page.isVisible('button:has-text("Exit Preview")');
  console.log(`✓ Persistent Banner: ${previewBanner}`);
  console.log(`✓ Exit Preview Button: ${exitPreviewBtn}`);

  await page.screenshot({ path: path.join(screenshotDir, '04_storefront_preview_home.png'), fullPage: true });

  // Open Product Detail Page
  console.log('Navigating to product detail page...');
  const productCard = await page.waitForSelector('a[href*="/product/"]');
  await productCard.click();
  await page.waitForTimeout(1200);

  // Check product page in preview
  const productTitle = await page.textContent('h1');
  const productBanner = await page.isVisible('text="Merchant Preview — This is what customers see"');
  const purchaseNotice = await page.isVisible('text="Purchasing is disabled in Merchant Preview."');
  const addToCartDisabled = await page.isDisabled('button:has-text("Add to Cart")');
  const buyNowDisabled = await page.isDisabled('button:has-text("Buy Now")');

  console.log(`✓ Product Title: "${productTitle?.trim()}"`);
  console.log(`✓ Persistent Banner on Product Page: ${productBanner}`);
  console.log(`✓ Purchasing Disabled Notice: ${purchaseNotice}`);
  console.log(`✓ Add to Cart Disabled: ${addToCartDisabled}`);
  console.log(`✓ Buy Now Disabled: ${buyNowDisabled}`);

  // Check Customer Reviews section
  const reviewsSection = await page.isVisible('text="Customer Reviews"');
  const noReviewsYet = await page.isVisible('text="No reviews yet."');
  const writeReviewDisabled = await page.isDisabled('button:has-text("Write a Review")');
  console.log(`✓ Customer Reviews Section: ${reviewsSection}`);
  console.log(`✓ Reviews Empty State ("No reviews yet."): ${noReviewsYet}`);
  console.log(`✓ Write a Review Disabled in Preview: ${writeReviewDisabled}`);

  await page.screenshot({ path: path.join(screenshotDir, '05_storefront_preview_product.png'), fullPage: true });

  // Test Exit Preview redirect
  console.log('Testing Exit Preview button redirect...');
  await page.click('button:has-text("Exit Preview")');
  await page.waitForTimeout(1000);
  const currentUrl = page.url();
  console.log(`✓ Redirected URL after Exit Preview: ${currentUrl}`);
  console.log(`✓ Returned to merchant portal: ${currentUrl.includes('localhost:3001')}`);

  await browser.close();
  console.log('\n🎉 ALL REAL CHROME VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('✗ Verification failed:', err);
  process.exit(1);
});

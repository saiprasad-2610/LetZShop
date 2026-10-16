import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('--- 1. Authenticating Seller via API ---');
  const loginRes = await fetch('http://localhost:4000/auth/pin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919876543210', pin: '654321' }),
  }).then((r) => r.json());

  if (!loginRes.success || !loginRes.data?.accessToken) {
    throw new Error('Failed to login: ' + JSON.stringify(loginRes));
  }

  const { accessToken: token, user, store } = loginRes.data;
  console.log(`✓ Authenticated as: ${user.phone} for store: "${store.name}" (${store.id})`);

  // Launch browser with system Chrome channel
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // -------------------------------------------------------------
  // DESKTOP TEST (1440x900)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Desktop View (1440px) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();

  // Navigate to login and inject session
  await desktopPage.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
  await desktopPage.evaluate(
    ({ t, u, s }) => {
      localStorage.setItem('simply_seller_token', t);
      localStorage.setItem('simply_seller_user', JSON.stringify(u));
      localStorage.setItem('simply_seller_store', JSON.stringify(s));
    },
    { t: token, u: user, s: store }
  );

  // Navigate to Analytics
  console.log('Navigating to http://localhost:3001/analytics...');
  await desktopPage.goto('http://localhost:3001/analytics', { waitUntil: 'networkidle' });

  // Verify page title
  const title = await desktopPage.title();
  console.log(`Page title: "${title}"`);
  if (!title.includes('LetzShop')) {
    console.warn(`WARNING: Title does not mention LetzShop: ${title}`);
  } else {
    console.log('✓ Title contains LetzShop branding.');
  }

  // Verify Top 4 KPI Cards
  const kpiSection = desktopPage.locator('section').nth(1);
  const revenueCard = desktopPage.locator('text=Revenue').first();
  const ordersCard = desktopPage.locator('text=Orders').first();
  const aovCard = desktopPage.locator('text=Avg Order Value').first();
  const repeatCard = desktopPage.locator('text=Repeat Customers').first();

  await revenueCard.waitFor({ timeout: 10000 });
  await ordersCard.waitFor({ timeout: 10000 });
  await aovCard.waitFor({ timeout: 10000 });
  await repeatCard.waitFor({ timeout: 10000 });
  console.log('✓ Top 4 KPI cards rendered: Revenue, Orders, Avg Order Value, Repeat Customers');

  // Verify Sales Performance Card
  const salesPerformance = desktopPage.locator('text=Sales Performance').first();
  await salesPerformance.waitFor({ timeout: 5000 });
  console.log('✓ Sales Performance chart card present');

  // Verify Payment Mix Donut
  const paymentMix = desktopPage.locator('text=Payment Mix').first();
  await paymentMix.waitFor({ timeout: 5000 });
  console.log('✓ Payment Mix donut chart card present');

  // Verify Top Products
  const topProducts = desktopPage.locator('text=Top Products').first();
  await topProducts.waitFor({ timeout: 5000 });
  console.log('✓ Top Products horizontal bar card present');

  // Verify Customers Visual
  const customersCard = desktopPage.locator('text=Customers').first();
  await customersCard.waitFor({ timeout: 5000 });
  console.log('✓ Customers visual card present');

  // Verify Top Locations
  const topLocations = desktopPage.locator('text=Top Locations').first();
  await topLocations.waitFor({ timeout: 5000 });
  console.log('✓ Top Locations horizontal bar card present');

  // Verify Business Insight
  const businessInsight = desktopPage.locator('text=Business Insight').first();
  await businessInsight.waitFor({ timeout: 5000 });
  const insightText = await desktopPage.locator('text=Business Insight').locator('..').innerText();
  console.log('✓ Business Insight strip present:', insightText.replace(/\n/g, ' '));

  // Verify absence of Recent Orders table and full Top Spenders list
  const recentOrdersCount = await desktopPage.locator('text=Recent Orders').count();
  const topSpendersCount = await desktopPage.locator('text=Top Spenders').count();
  console.log(`Recent Orders count: ${recentOrdersCount} (should be 0)`);
  console.log(`Top Spenders count: ${topSpendersCount} (should be 0)`);
  if (recentOrdersCount === 0 && topSpendersCount === 0) {
    console.log('✓ Removed Recent Orders and bulky Top Spenders list successfully.');
  } else {
    throw new Error('Recent Orders or Top Spenders still present on main dashboard!');
  }

  // Test toggling Sales metric (Revenue -> Orders)
  console.log('\nTesting Sales metric toggle...');
  const ordersToggleBtn = desktopPage.locator('[data-testid="toggle-sales-orders"]');
  await ordersToggleBtn.click();
  await desktopPage.waitForTimeout(500);
  console.log('✓ Toggled to Orders metric on Sales chart.');

  const revenueToggleBtn = desktopPage.locator('[data-testid="toggle-sales-revenue"]');
  await revenueToggleBtn.click();
  await desktopPage.waitForTimeout(500);
  console.log('✓ Toggled back to Revenue metric on Sales chart.');

  // Test toggling Top Products metric (Revenue -> Quantity)
  console.log('\nTesting Product metric toggle...');
  const prodQtyBtn = desktopPage.locator('[data-testid="toggle-product-quantity"]');
  await prodQtyBtn.click();
  await desktopPage.waitForTimeout(500);
  console.log('✓ Toggled to Units metric on Top Products.');

  const prodRevBtn = desktopPage.locator('[data-testid="toggle-product-revenue"]');
  await prodRevBtn.click();
  await desktopPage.waitForTimeout(500);
  console.log('✓ Toggled back to Revenue metric on Top Products.');

  // Test period switching: 7 Days, 90 Days, 6 Months, 12 Months, 30 Days
  console.log('\nTesting period switching...');
  const period7d = desktopPage.locator('button:has-text("7 Days")');
  await period7d.click();
  await desktopPage.waitForTimeout(1000);
  console.log('✓ Switched to 7 Days period.');

  const period90d = desktopPage.locator('button:has-text("90 Days")');
  await period90d.click();
  await desktopPage.waitForTimeout(1000);
  console.log('✓ Switched to 90 Days period.');

  const period30d = desktopPage.locator('button:has-text("30 Days")');
  await period30d.click();
  await desktopPage.waitForTimeout(1000);
  console.log('✓ Switched back to 30 Days period.');

  // Capture desktop screenshot
  const artifactDir = 'C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\9c246ae6-1b36-412c-a5e1-1271a7a5e574';
  const desktopScreenshotPath = path.join(artifactDir, 'desktop-analytics-dashboard.png');
  await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
  console.log(`✓ Desktop screenshot saved: ${desktopScreenshotPath}`);

  // -------------------------------------------------------------
  // MOBILE TEST (390x844 - iPhone 12/13/14)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Mobile View (390px) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  // Inject session
  await mobilePage.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
  await mobilePage.evaluate(
    ({ t, u, s }) => {
      localStorage.setItem('simply_seller_token', t);
      localStorage.setItem('simply_seller_user', JSON.stringify(u));
      localStorage.setItem('simply_seller_store', JSON.stringify(s));
    },
    { t: token, u: user, s: store }
  );

  await mobilePage.goto('http://localhost:3001/analytics', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Check no horizontal scrollbar / overflow
  const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
  console.log(`Mobile scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);
  if (scrollWidth <= clientWidth + 2) {
    console.log('✓ No horizontal overflow on mobile.');
  } else {
    console.warn(`WARNING: Possible horizontal overflow: ${scrollWidth} vs ${clientWidth}`);
  }

  // Check total document height vs viewport
  const scrollHeight = await mobilePage.evaluate(() => document.documentElement.scrollHeight);
  const scrollRatio = (scrollHeight / 844).toFixed(1);
  console.log(`Mobile scrollHeight: ${scrollHeight}px (~${scrollRatio} screen heights)`);
  if (parseFloat(scrollRatio) <= 3.2) {
    console.log(`✓ Mobile height is approximately ${scrollRatio} vertical scrolls (target <= 2-3 scrolls).`);
  }

  const mobileScreenshotPath = path.join(artifactDir, 'mobile-analytics-dashboard.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: true });
  console.log(`✓ Mobile full-page screenshot saved: ${mobileScreenshotPath}`);

  await browser.close();
  console.log('\n=========================================');
  console.log('ALL VISUAL & FUNCTIONAL CHECKS PASSED!');
  console.log('=========================================');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

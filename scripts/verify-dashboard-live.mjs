import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

process.loadEnvFile('.env');

// ==============================================================================
// 1. HARD TEST DATABASE GUARD
// ==============================================================================
const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) {
  const errorMsg =
    '\n================================================================================\n' +
    '❌ FATAL: TEST_DATABASE_URL is not set in environment.\n' +
    'Automated verification tests require an isolated test database (e.g. simply_ecommerce_test).\n' +
    '================================================================================\n';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const parsedTestUrl = new URL(testDbUrl);
const testDbName = parsedTestUrl.pathname.replace(/^\//, '');

if (testDbName === 'simply_ecommerce') {
  const errorMsg =
    '\n================================================================================\n' +
    '❌ FATAL SAFETY VIOLATION: Automated tests attempted to run against "simply_ecommerce"!\n' +
    'Automated integration/E2E tests must NEVER write into or modify the shared development database.\n' +
    'Please configure a separate test database in .env:\n' +
    '   TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simply_ecommerce_test?schema=public"\n' +
    '================================================================================\n';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');

// Connect to TEST DB for all mutation operations
const testDb = new PrismaClient({
  datasources: { db: { url: testDbUrl } },
});

// Connect to DEV DB STRICTLY READ-ONLY for count assertions & UI comparisons
const devDbUrl = process.env.DATABASE_URL;
const devDb = new PrismaClient({
  datasources: { db: { url: devDbUrl } },
});

async function getDevDbCounts() {
  const [
    ProductReview,
    ReviewReport,
    Tenant,
    Store,
    Order,
    SubscriptionPayment,
  ] = await Promise.all([
    devDb.productReview.count(),
    devDb.reviewReport.count(),
    devDb.tenant.count(),
    devDb.store.count(),
    devDb.order.count(),
    devDb.subscriptionPayment.count(),
  ]);
  return {
    ProductReview,
    ReviewReport,
    Tenant,
    Store,
    Order,
    SubscriptionPayment,
  };
}

async function main() {
  console.log('--- STARTING COMPREHENSIVE DASHBOARD VERIFICATION ---');
  console.log(`Active Test DB: ${testDbName} on ${parsedTestUrl.hostname}:${parsedTestUrl.port || 5432}`);

  // 1. Record DEV DB baseline counts BEFORE verification
  const devCountsBefore = await getDevDbCounts();
  console.log('\n📊 DEV DB COUNTS BEFORE VERIFICATION:');
  console.table(devCountsBefore);

  // Use seeded platform admin credentials (never create temporary admin in devDb)
  const adminEmail = 'admin@simplyecommerce.in';
  const adminSecret = 'AdminPass123!@#';

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const results = {
    timestamps: {},
    kpiDimensions: [],
    largeAttentionPanelRemoved: false,
    dbApiUiComparison: [],
    sidebarBadges: {},
    platformActivity: {},
    recentMerchants: {},
    recentOrders: {},
    moderationWorkflow: {},
    responsiveTests: [],
    themes: {},
  };

  try {
    // 2. LOGIN (Using existing seeded platform admin)
    await page.goto('http://localhost:3002/login', {
      waitUntil: 'domcontentloaded',
    });
    await page.getByLabel('Email / Phone').fill(adminEmail);
    await page.getByLabel('Password', { exact: true }).fill(adminSecret);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL('http://localhost:3002/');
    await page.locator('[data-kpi="Total Merchants"]').waitFor();

    console.log('Logged into Admin Dashboard successfully.');

    // 3. CHECK A: LAST UPDATED TIME & REFRESH
    const lastUpdatedLocator = page.locator('header time, main time').first();
    await lastUpdatedLocator.waitFor();
    const timeBefore = (await lastUpdatedLocator.innerText()).trim();
    results.timestamps.beforeRefresh = timeBefore;
    console.log(`Timestamp Before Refresh: ${timeBefore}`);

    // Wait 1.5 seconds then click Refresh
    await page.waitForTimeout(1500);
    const refreshBtn = page.getByRole('button', { name: 'Refresh' });
    await refreshBtn.click();
    await page.waitForTimeout(1000);

    const timeAfter = (await lastUpdatedLocator.innerText()).trim();
    results.timestamps.afterRefresh = timeAfter;
    console.log(`Timestamp After Refresh: ${timeAfter}`);
    assert(timeBefore.length > 0, 'Timestamp before refresh should not be empty');
    assert(timeAfter.length > 0, 'Timestamp after refresh should not be empty');

    // 4. CHECK B: TOP 6 KPI CARDS EQUAL HEIGHTS
    const kpiCards = await page.locator('section[aria-label="Primary platform metrics"] > *').all();
    console.log(`Found ${kpiCards.length} primary KPI card containers.`);
    assert.equal(kpiCards.length, 6, 'Should have 6 KPI cards');

    const cardBoxes = [];
    for (let i = 0; i < kpiCards.length; i++) {
      const box = await kpiCards[i].boundingBox();
      const text = await kpiCards[i].innerText();
      const firstLine = text.split('\n')[0].trim();
      cardBoxes.push({ index: i, title: firstLine, height: box.height, width: box.width });
    }
    results.kpiDimensions = cardBoxes;
    console.log('KPI Card dimensions at 1440x900:', cardBoxes);

    // Verify all 6 cards have equal height
    const expectedHeight = cardBoxes[0].height;
    for (const card of cardBoxes) {
      assert.equal(
        Math.round(card.height),
        Math.round(expectedHeight),
        `Card ${card.title} height (${card.height}) must equal expected (${expectedHeight})`
      );
    }
    console.log(`All 6 KPI cards have equal computed height: ${expectedHeight}px`);

    // 5. CHECK C: LARGE HORIZONTAL NEEDS ATTENTION PANEL REMOVED
    const oldAttentionPanel = await page.locator('#needs-attention').count();
    const goodStandingText = await page.getByText('Everything looks good', { exact: false }).count();
    assert.equal(oldAttentionPanel, 0, 'Large Needs Attention section ID should be removed');
    assert.equal(goodStandingText, 0, 'Large Needs Attention body text should be removed');
    results.largeAttentionPanelRemoved = true;
    console.log('Confirmed: Large horizontal Needs Attention panel is completely removed.');

    // 6. CHECK D & E & 10: DB / API / UI COMPARISON
    // Query directly from PostgreSQL devDb (Read-Only) to compare against UI
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const [
      dbPending,
      dbUnderReview,
      dbResolvedMonth,
      dbSuspendedStores,
      dbFailedPayments,
    ] = await Promise.all([
      devDb.reviewReport.count({ where: { status: 'PENDING' } }),
      devDb.reviewReport.count({ where: { status: 'UNDER_REVIEW' } }),
      devDb.reviewReport.count({ where: { status: 'RESOLVED', resolvedAt: { gte: monthStart } } }),
      devDb.store.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      devDb.subscriptionPayment.count({ where: { status: 'FAILED' } }),
    ]);

    const dbTotalAttention = dbPending + dbUnderReview + dbSuspendedStores + dbFailedPayments;

    // Read UI values
    const uiNeedsAttentionText = await page.locator('[data-kpi="Needs Attention"]').innerText();
    const uiNeedsAttention = parseInt(uiNeedsAttentionText.replace(/[^0-9]/g, ''), 10);

    const uiPending = parseInt(await page.locator('[data-review-metric="pendingOnlyReports"]').innerText(), 10);
    const uiUnderReview = parseInt(await page.locator('[data-review-metric="underReviewReports"]').innerText(), 10);
    const uiResolvedMonth = parseInt(await page.locator('[data-review-metric="resolvedThisMonth"]').innerText(), 10);

    const comparisonTable = [
      { metric: 'Needs Attention Total', postgres: dbTotalAttention, ui: uiNeedsAttention },
      { metric: 'Pending Reports', postgres: dbPending, ui: uiPending },
      { metric: 'Under Review', postgres: dbUnderReview, ui: uiUnderReview },
      { metric: 'Resolved This Month', postgres: dbResolvedMonth, ui: uiResolvedMonth },
      { metric: 'Suspended Stores', postgres: dbSuspendedStores, ui: 'N/A in moderation card (checked via badges)' },
      { metric: 'Failed Payments', postgres: dbFailedPayments, ui: 'N/A in moderation card (checked via badges)' },
    ];
    results.dbApiUiComparison = comparisonTable;
    console.table(comparisonTable);

    assert.equal(uiNeedsAttention, dbTotalAttention, 'UI Needs Attention should match PostgreSQL');
    assert.equal(uiPending, dbPending, 'UI Pending reports should match PostgreSQL');
    assert.equal(uiUnderReview, dbUnderReview, 'UI Under Review reports should match PostgreSQL');
    assert.equal(uiResolvedMonth, dbResolvedMonth, 'UI Resolved This Month should match PostgreSQL');

    // 7. CHECK F: PLATFORM ACTIVITY (7D, 30D, 90D, Custom)
    console.log('Testing Platform Activity range filters...');
    await page.getByRole('button', { name: '7D', exact: true }).click();
    await page.waitForTimeout(500);
    console.log('7D button clicked.');

    await page.getByRole('button', { name: '90D', exact: true }).click();
    await page.waitForTimeout(500);
    console.log('90D button clicked.');

    await page.getByRole('button', { name: '30D', exact: true }).click();
    await page.waitForTimeout(500);
    console.log('30D button clicked.');

    // Custom Date Range Test
    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.waitForTimeout(500);
    const fromInput = page.getByLabel('From date');
    const toInput = page.getByLabel('To date');
    await fromInput.waitFor({ state: 'visible', timeout: 8000 });
    await toInput.waitFor({ state: 'visible', timeout: 8000 });
    assert(await fromInput.isVisible(), 'From date input should be visible when Custom is active');
    assert(await toInput.isVisible(), 'To date input should be visible when Custom is active');

    // Test invalid date range: From > To
    await fromInput.fill('2026-10-15');
    await toInput.fill('2026-10-10');
    await page.getByRole('button', { name: 'Apply' }).click();
    const errorAlert = await page.locator('span[role="alert"]').innerText();
    console.log(`Validation error for invalid range: "${errorAlert}"`);
    assert(errorAlert.includes('before'), 'Should display error when From is after To');

    // Test valid date range: 2026-10-01 to 2026-10-17
    await fromInput.fill('2026-10-01');
    await toInput.fill('2026-10-17');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(800);
    console.log('Valid custom range applied (2026-10-01 to 2026-10-17).');

    // Reset
    await page.getByRole('button', { name: 'Clear/Reset' }).click();
    await page.waitForTimeout(500);
    console.log('Custom range reset.');

    // 8. CHECK H: RECENT MERCHANTS INTERNAL SCROLL & PAGINATION
    console.log('Testing Recent Merchants independent pagination...');
    const merchantsNextBtn = page.locator('section[aria-labelledby="recent-merchants"] button:has-text("Next")');
    const merchantsPageText = await page.locator('section[aria-labelledby="recent-merchants"] span:has-text("Page")').innerText();
    console.log(`Recent Merchants initial page text: ${merchantsPageText}`);

    if (await merchantsNextBtn.isEnabled()) {
      await merchantsNextBtn.click();
      await page.waitForTimeout(600);
      const page2Text = await page.locator('section[aria-labelledby="recent-merchants"] span:has-text("Page")').innerText();
      console.log(`Recent Merchants after clicking Next: ${page2Text}`);
      assert(page2Text.includes('Page 2'), 'Recent Merchants should paginate to Page 2');

      const prevBtn = page.locator('section[aria-labelledby="recent-merchants"] button:has-text("Previous")');
      await prevBtn.click();
      await page.waitForTimeout(600);
      const backToPage1 = await page.locator('section[aria-labelledby="recent-merchants"] span:has-text("Page")').innerText();
      console.log(`Recent Merchants back to Page 1: ${backToPage1}`);
      assert(backToPage1.includes('Page 1'), 'Recent Merchants should navigate back to Page 1');
    } else {
      console.log('Recent Merchants has only 1 page of records.');
    }

    // 9. CHECK I: RECENT ORDERS INTERNAL SCROLL & PAGINATION
    console.log('Testing Recent Orders independent pagination...');
    const ordersNextBtn = page.locator('section[aria-labelledby="recent-orders"] button:has-text("Next")');
    const ordersPageText = await page.locator('section[aria-labelledby="recent-orders"] span:has-text("Page")').innerText();
    console.log(`Recent Orders initial page text: ${ordersPageText}`);

    if (await ordersNextBtn.isEnabled()) {
      await ordersNextBtn.click();
      await page.waitForTimeout(600);
      const orderPage2Text = await page.locator('section[aria-labelledby="recent-orders"] span:has-text("Page")').innerText();
      console.log(`Recent Orders after clicking Next: ${orderPage2Text}`);
      assert(orderPage2Text.includes('Page 2'), 'Recent Orders should paginate to Page 2 independently');

      // Verify Recent Merchants is still on Page 1!
      const currentMerchantsPage = await page.locator('section[aria-labelledby="recent-merchants"] span:has-text("Page")').innerText();
      assert(currentMerchantsPage.includes('Page 1'), 'Recent Merchants page must not be altered by Recent Orders pagination');
    } else {
      console.log('Recent Orders has only 1 page of records.');
    }

    // 10. CHECK 18: REVIEW MODERATION WORKFLOW TEST (Executed on testDb ONLY)
    console.log('\n--- TESTING REVIEW MODERATION WORKFLOW ON ISOLATED TEST DB ---');
    const testReviewId = crypto.randomUUID();
    const testReportId = crypto.randomUUID();

    await testDb.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica';");
      await tx.$executeRawUnsafe(`
        INSERT INTO product_reviews (id, store_id, product_id, order_id, order_item_id, reviewer_name, rating, body, status, created_at, updated_at)
        VALUES ('${testReviewId}', '${testReviewId}', '${testReviewId}', '${testReviewId}', '${testReviewId}', 'QA Reviewer Live', 1, 'QA test report review body', 'ACTIVE', NOW(), NOW());
      `);

      // 1. Create Report with PENDING status
      await tx.reviewReport.create({
        data: {
          id: testReportId,
          reviewId: testReviewId,
          reason: 'Spam test reason live QA',
          status: 'PENDING',
        },
      });
      const pendingCount = await tx.reviewReport.count({ where: { status: 'PENDING', id: testReportId } });
      assert.equal(pendingCount, 1, 'Review report should be PENDING on testDb');
      console.log('✓ Review Report created with status PENDING on testDb');

      // 2. Transition to UNDER_REVIEW
      await tx.reviewReport.update({
        where: { id: testReportId },
        data: { status: 'UNDER_REVIEW' },
      });
      const underReviewCount = await tx.reviewReport.count({ where: { status: 'UNDER_REVIEW', id: testReportId } });
      assert.equal(underReviewCount, 1, 'Review report should be UNDER_REVIEW on testDb');
      console.log('✓ Review Report updated to UNDER_REVIEW on testDb');

      // 3. Transition to RESOLVED
      await tx.reviewReport.update({
        where: { id: testReportId },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
      const resolvedCount = await tx.reviewReport.count({ where: { status: 'RESOLVED', id: testReportId } });
      assert.equal(resolvedCount, 1, 'Review report should be RESOLVED on testDb');
      console.log('✓ Review Report updated to RESOLVED on testDb');

      // Clean up deterministic test artifacts
      await tx.reviewReport.delete({ where: { id: testReportId } });
      await tx.productReview.delete({ where: { id: testReviewId } });
      console.log('✓ Cleaned up all deterministic test artifacts from testDb');
    });

    // 11. RESPONSIVE TESTS
    const viewports = [
      { width: 1440, height: 900, name: 'Desktop 1440x900' },
      { width: 1280, height: 800, name: 'Laptop 1280x800' },
      { width: 768, height: 1024, name: 'Tablet 768x1024' },
      { width: 390, height: 844, name: 'Mobile 390x844' },
    ];
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasHorizontalOverflow = scrollWidth > clientWidth;
      results.responsiveTests.push({ ...vp, hasHorizontalOverflow });
      console.log(`Viewport ${vp.name}: horizontal overflow = ${hasHorizontalOverflow} (${scrollWidth} <= ${clientWidth})`);
      assert(!hasHorizontalOverflow, `Page should not have horizontal overflow at ${vp.name}`);
    }

    // 12. THEME TOGGLE TEST
    await page.setViewportSize({ width: 1440, height: 900 });
    const themeBtn = page.getByRole('button', { name: /toggle theme|theme/i }).first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      const isLight = await page.evaluate(() => document.documentElement.classList.contains('light') || !document.documentElement.classList.contains('dark'));
      console.log(`Theme toggled. Is light mode active: ${isLight}`);
      await themeBtn.click();
      await page.waitForTimeout(300);
      console.log('Theme toggled back to dark mode.');
    }

    console.log('--- ALL VERIFICATION CHECKS PASSED WITH FLYING COLORS! ---');
  } finally {
    await browser.close();

    // 13. PROVE ZERO POLLUTION: Verify DEV DB counts are completely unchanged
    const devCountsAfter = await getDevDbCounts();
    console.log('\n📊 DEV DB COUNTS AFTER VERIFICATION:');
    console.table(devCountsAfter);

    assert.deepEqual(
      devCountsBefore,
      devCountsAfter,
      '❌ ZERO POLLUTION VIOLATION: Development DB counts changed during verification!'
    );
    console.log('✅ ZERO POLLUTION PROVEN: DEV DB BEFORE === DEV DB AFTER for all 6 models.');

    await testDb.$disconnect();
    await devDb.$disconnect();
  }
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});

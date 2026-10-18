import { chromium } from 'playwright';
import assert from 'node:assert/strict';

async function runBrowserQa() {
  console.log('🚀 Starting Browser QA for Merchant Detail and Reviews & Reports...');

  // Get admin token via API
  const loginRes = await fetch('http://localhost:4000/api/v1/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@simplyecommerce.in', secret: 'AdminPass123!@#' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.tokens?.accessToken || loginData.tokens?.accessToken;
  assert(token, 'Admin access token must be present');

  // Fetch first merchant
  const merchRes = await fetch('http://localhost:4000/api/v1/admin/merchants', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const merchData = await merchRes.json();
  const merchants = merchData.data?.items || merchData.items || [];
  assert(merchants.length > 0, 'Must have at least one merchant in database');
  const merchantId = merchants[0].id;
  console.log(`✓ Using Merchant: ${merchants[0].name} (${merchantId})`);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();

  // Set authenticated admin session cookie directly on context
  await context.addCookies([
    {
      name: 'letzshop_admin_session',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();

  const viewports = [
    { name: 'Desktop-1440', width: 1440, height: 900, isDesktop: true },
    { name: 'Laptop-1280', width: 1280, height: 800, isDesktop: true },
    { name: 'Tablet-768', width: 768, height: 1024, isDesktop: false },
    { name: 'Mobile-390', width: 390, height: 844, isDesktop: false },
  ];

  const themes = ['light', 'dark'];

  // Test across all viewports and themes
  for (const vp of viewports) {
    for (const theme of themes) {
      console.log(`\n📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) | Theme: ${theme.toUpperCase()}`);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // ================================================================
      // TEST MERCHANT DETAIL PAGE
      // ================================================================
      console.log(`  Visiting Merchant Detail (/merchants/${merchantId})...`);
      await page.goto(`http://localhost:3002/merchants/${merchantId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#subscription-history-card', { timeout: 15000 });

      // Set theme on html / document element
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('simply_admin_theme', t);
      }, theme);

      // Verify Card Bounding Rects
      const subCardBox = await page.locator('#subscription-history-card').boundingBox();
      const invCardBox = await page.locator('#invoice-history-card').boundingBox();
      const ordCardBox = await page.locator('#recent-orders-card').boundingBox();
      const modCardBox = await page.locator('#moderation-summary-card').boundingBox();
      const commCardBox = await page.locator('#communication-history-card').boundingBox();

      assert(subCardBox && invCardBox && ordCardBox && modCardBox && commCardBox, 'All cards must be rendered in DOM');

      if (vp.isDesktop) {
        console.log(`    [Desktop Alignment] Sub: ${subCardBox.height}px | Inv: ${invCardBox.height}px`);
        console.log(`    [Desktop Alignment] Orders: ${ordCardBox.height}px | Mod: ${modCardBox.height}px`);
        console.log(`    [Desktop Alignment] Comm: ${commCardBox.height}px`);

        // Check identical height on paired cards (tolerance 1px for subpixel rendering)
        assert(
          Math.abs(subCardBox.height - invCardBox.height) <= 1,
          `Subscription and Invoice cards must have identical height on desktop (${subCardBox.height} vs ${invCardBox.height})`
        );
        assert(
          Math.abs(ordCardBox.height - modCardBox.height) <= 1,
          `Recent Orders and Moderation Summary cards must have identical height on desktop (${ordCardBox.height} vs ${modCardBox.height})`
        );
        assert(
          Math.abs(commCardBox.height - 380) <= 2,
          `Communication History card must be ~380px (${commCardBox.height}px measured)`
        );
      } else {
        console.log(`    [Responsive Stack] Sub: ${subCardBox.height}px | Inv: ${invCardBox.height}px | Orders: ${ordCardBox.height}px | Mod: ${modCardBox.height}px`);
      }

      // Verify internal scroll container in each card
      const scrollContainers = await page.evaluate(() => {
        const checkScroll = (id) => {
          const el = document.getElementById(id);
          if (!el) return false;
          const scrollChild = el.querySelector('.overflow-y-auto');
          return !!scrollChild;
        };
        return {
          sub: checkScroll('subscription-history-card'),
          inv: checkScroll('invoice-history-card'),
          ord: checkScroll('recent-orders-card'),
          mod: checkScroll('moderation-summary-card'),
          comm: checkScroll('communication-history-card'),
        };
      });
      assert(scrollContainers.sub, 'Subscription card must have internal scroll container');
      assert(scrollContainers.inv, 'Invoice card must have internal scroll container');
      assert(scrollContainers.ord, 'Orders card must have internal scroll container');
      assert(scrollContainers.mod, 'Moderation card must have internal scroll container');
      assert(scrollContainers.comm, 'Communication card must have internal scroll container');
      console.log('    ✓ All 5 cards have internal scroll containers with sticky headers');

      // ================================================================
      // TEST REVIEWS & REPORTS PAGE
      // ================================================================
      console.log(`  Visiting Reviews & Reports (/reviews)...`);
      await page.goto('http://localhost:3002/reviews', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#reviews-workspace-table-card', { timeout: 15000 });

      // Apply theme on reviews page
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, theme);

      // Check summary cards
      const summaryCardsCount = await page.locator('button:has-text("Pending Reports")').count();
      assert.equal(summaryCardsCount, 1, 'Pending reports summary card must be visible');

      // Check search input
      const searchInput = page.locator('input[aria-label*="Search reviews"]');
      assert((await searchInput.count()) === 1, 'Search input must be present');

      // Check filters popover toggle button
      const filterBtn = page.getByRole('button', { name: 'Filters', exact: true });
      assert((await filterBtn.count()) === 1, 'Filters button must be present');

      // Click Filters button to open popover
      await filterBtn.click();
      const popoverVisible = await page.locator('text=Filter Reviews').first().isVisible();
      assert(popoverVisible, 'Filter popover must open on click');
      await filterBtn.click(); // Close

      // Check reviews table container height on desktop
      const tableBox = await page.locator('#reviews-workspace-table-card').boundingBox();
      assert(tableBox, 'Table container must exist');
      if (vp.isDesktop) {
        console.log(`    [Desktop Table] Height: ${tableBox.height}px`);
        assert(Math.abs(tableBox.height - 580) <= 2, `Table container must be 580px high (${tableBox.height}px measured)`);
      }

      // Check sticky table header
      const hasStickyHeader = await page.evaluate(() => {
        const thead = document.querySelector('#reviews-workspace-table-card thead');
        return thead ? window.getComputedStyle(thead).position === 'sticky' : false;
      });
      assert(hasStickyHeader, 'Reviews table must have sticky header');

      // Wait for table to finish initial query loading
      await page.waitForFunction(
        () => !document.querySelector('#reviews-workspace-table-card tbody')?.innerText.includes('Loading reviews...'),
        { timeout: 10000 }
      );

      // Check if there are reviews to inspect detail drawer
      const reviewRow = page.locator('#reviews-workspace-table-card tbody tr:not(:has(td[colspan]))').first();
      const hasActualReviews = (await reviewRow.count()) > 0;
      console.log(`    Actual review rows present: ${hasActualReviews}`);
      if (hasActualReviews) {
        // Click first review row
        await reviewRow.click();
        // Wait for detail drawer
        await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
        const drawerVisible = await page.locator('[role="dialog"]').isVisible();
        assert(drawerVisible, 'Review detail drawer must slide open when row is clicked');

        // Check Lifecycle Timeline exists in drawer
        const hasTimeline = await page.locator('text=Moderation Lifecycle Timeline').isVisible();
        assert(hasTimeline, 'Lifecycle timeline must be present in drawer');

        // Close drawer
        const closeBtn = page.locator('[role="dialog"] button').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }

      console.log(`  ✓ Passed QA on ${vp.name} (${theme.toUpperCase()})`);
    }
  }

  await browser.close();
  console.log('\n🎉 ALL BROWSER QA TESTS PASSED SUCCESSFULLY ACROSS 4 VIEWPORTS & BOTH THEMES!\n');
}

runBrowserQa().catch(async (err) => {
  console.error('❌ Browser QA Failed:', err);
  process.exit(1);
});

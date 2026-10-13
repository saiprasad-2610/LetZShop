import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const sellerUrl = 'http://localhost:3001';
const apiUrl = 'http://localhost:4000';

async function main() {
  console.log('🚀 Running Seller Hydration & Runtime Verification...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const hydrationErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      const loc = msg.location ? msg.location() : null;
      consoleErrors.push(`${text} (at: ${loc?.url || 'unknown'})`);
      if (
        text.toLowerCase().includes('hydration') ||
        text.includes('Text content does not match') ||
        text.includes('did not match') ||
        text.includes('switch to client rendering')
      ) {
        hydrationErrors.push(text);
      }
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      console.log('HTTP >= 400:', res.status(), res.url());
    }
  });

  try {
    // ----------------------------------------------------
    // Test 1: Load Login Page cleanly
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Login Page & Authentication ---');
    await page.goto(`${sellerUrl}/login`, { waitUntil: 'networkidle' });
    await page.locator('#login-pin').waitFor();

    // Login with Merchant A (+919876543210, PIN 654321)
    const phoneInput = page.locator('input[type="tel"]').first();
    await phoneInput.fill('9876543210');
    const pinInput = page.locator('#login-pin').first();
    await pinInput.fill('654321');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Wait for dashboard to load
    await page.waitForURL(`${sellerUrl}/`, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('✓ Successfully authenticated and navigated to Dashboard.');

    // ----------------------------------------------------
    // Test 2: Check Store Identity in Sidebar
    // ----------------------------------------------------
    console.log('\n--- 2. Checking Store Identity in Sidebar ---');
    const sidebarText = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside ? aside.innerText : '';
    });
    console.log('Sidebar text snippet:\n', sidebarText.split('\n').slice(0, 10).join(' | '));
    assert.ok(
      sidebarText.includes('Aurelia Atelier'),
      `Sidebar must display authenticated store name "Aurelia Atelier", found: ${sidebarText}`
    );
    console.log('✓ Correct Store Name ("Aurelia Atelier") is displayed in sidebar!');

    // ----------------------------------------------------
    // Test 3: Hard Refresh on Dashboard
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Direct Page Refresh / Hard Refresh ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const reloadedSidebarText = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside ? aside.innerText : '';
    });
    assert.ok(
      reloadedSidebarText.includes('Aurelia Atelier'),
      'Sidebar must maintain "Aurelia Atelier" after refresh'
    );
    console.log('✓ Reload successful, store name intact with 0 hydration issues.');

    // ----------------------------------------------------
    // Test 4: Direct URL Navigation
    // ----------------------------------------------------
    console.log('\n--- 4. Direct URL Navigation across Seller Routes ---');
    const testRoutes = ['/products', '/orders', '/store-preview', '/settings'];
    for (const route of testRoutes) {
      console.log(`Checking route: ${route}`);
      await page.goto(`${sellerUrl}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const routeSidebar = await page.evaluate(() => document.querySelector('aside')?.innerText || '');
      assert.ok(
        routeSidebar.includes('Aurelia Atelier'),
        `Store name missing in sidebar on route ${route}`
      );
    }
    console.log('✓ All routes loaded successfully with consistent sidebar identity.');

    // ----------------------------------------------------
    // Test 5: Logout Flow
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Logout Flow ---');
    await page.goto(`${sellerUrl}/`, { waitUntil: 'networkidle' });
    const logoutBtn = page.locator('aside button:has-text("Logout"), button[title="Logout"]').first();
    await logoutBtn.click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    console.log('✓ Logged out successfully, redirected to /login.');

    const localState = await page.evaluate(() => ({
      token: localStorage.getItem('simply_seller_token'),
      store: localStorage.getItem('simply_seller_store'),
      user: localStorage.getItem('simply_seller_user'),
    }));
    assert.equal(localState.token, null, 'Token must be cleared on logout');
    assert.equal(localState.store, null, 'Store must be cleared on logout');
    assert.equal(localState.user, null, 'User must be cleared on logout');
    console.log('✓ LocalStorage cleanly purged on logout.');

    // ----------------------------------------------------
    // Test 6: Second Login (Merchant B Data Isolation)
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Second Login as Merchant B (Patil Engineering Tools) ---');
    await page.locator('#login-pin').waitFor();
    const phoneInputB = page.locator('input[type="tel"]').first();
    await phoneInputB.fill('9876501234');
    const pinInputB = page.locator('#login-pin').first();
    await pinInputB.fill('654321');
    const submitBtnB = page.locator('button[type="submit"]').first();
    await submitBtnB.click();

    await page.waitForURL(`${sellerUrl}/`, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const sidebarTextB = await page.evaluate(() => document.querySelector('aside')?.innerText || '');
    assert.ok(
      sidebarTextB.includes('Patil Engineering Tools'),
      `Merchant B store name must be "Patil Engineering Tools", found: ${sidebarTextB}`
    );
    assert.ok(
      !sidebarTextB.includes('Aurelia Atelier'),
      'Merchant B MUST NOT leak Merchant A store name'
    );
    console.log('✓ Merchant B login confirmed: displays "Patil Engineering Tools" with zero leakage.');

    // ----------------------------------------------------
    // Test 7: Direct Refresh for Merchant B
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Refresh for Merchant B ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const refreshedTextB = await page.evaluate(() => document.querySelector('aside')?.innerText || '');
    assert.ok(
      refreshedTextB.includes('Patil Engineering Tools'),
      'Merchant B store name must remain after refresh'
    );
    console.log('✓ Merchant B refresh verified.');

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n==================================================');
    console.log('AUDIT SUMMARY');
    console.log('==================================================');
    console.log(`Total Captured Console Errors: ${consoleErrors.length}`);
    console.log(`Hydration Errors: ${hydrationErrors.length}`);

    if (hydrationErrors.length > 0) {
      console.error('FAILED: Hydration errors encountered:');
      hydrationErrors.forEach((e) => console.error('  - ', e));
      process.exit(1);
    } else {
      console.log('✅ ZERO HYDRATION ERRORS DETECTED ACROSS ALL FLOWS!');
    }

    if (consoleErrors.length > 0) {
      console.log('Non-hydration console messages:');
      consoleErrors.forEach((e) => console.log('  [LOG]', e));
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

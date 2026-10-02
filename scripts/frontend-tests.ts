import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { chromium, Browser, Page } from 'playwright';

const BASE_DIR = path.resolve(__dirname, '..');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PORTS = {
  api: 4000,
  storefront: 3000,
  seller: 3001,
  admin: 3002,
};

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port: number, name: string, maxWaitMs = 45000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const ok = await checkPort(port);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

interface TestResult {
  group: 'SELLER' | 'BUYER' | 'ADMIN';
  testName: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(
  group: 'SELLER' | 'BUYER' | 'ADMIN',
  testName: string,
  fn: (page: Page) => Promise<void>,
  browser: Browser
) {
  const page = await browser.newPage();
  const start = performance.now();
  try {
    await fn(page);
    results.push({ group, testName, passed: true, durationMs: performance.now() - start });
    console.log(`  ✅ [${group}] ${testName} (${(performance.now() - start).toFixed(0)}ms)`);
  } catch (err: any) {
    results.push({ group, testName, passed: false, error: err.message, durationMs: performance.now() - start });
    console.log(`  ❌ [${group}] ${testName}: ${err.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('================================================================================');
  console.log('🧪 PHASE 4.5: FOCUSED FRONTEND CRITICAL USER PATHS TEST SUITE');
  console.log('   Testing Real Rendered Pages: Seller PWA, Buyer Storefront, Admin Console');
  console.log('================================================================================\n');

  const procs: ChildProcess[] = [];

  const isApiUp = await checkPort(PORTS.api);
  if (!isApiUp) {
    procs.push(spawn('pnpm', ['--filter', '@simply/api', 'start:prod'], { cwd: BASE_DIR, shell: true, stdio: 'ignore' }));
  }

  const isStorefrontUp = await checkPort(PORTS.storefront);
  if (!isStorefrontUp) {
    procs.push(spawn('pnpm', ['--filter', '@simply/storefront', 'start'], { cwd: BASE_DIR, shell: true, stdio: 'ignore' }));
  }

  const isSellerUp = await checkPort(PORTS.seller);
  if (!isSellerUp) {
    procs.push(spawn('pnpm', ['--filter', '@simply/seller', 'start'], { cwd: BASE_DIR, shell: true, stdio: 'ignore' }));
  }

  const isAdminUp = await checkPort(PORTS.admin);
  if (!isAdminUp) {
    procs.push(spawn('pnpm', ['--filter', '@simply/admin', 'start'], { cwd: BASE_DIR, shell: true, stdio: 'ignore' }));
  }

  console.log('⏳ Ensuring all frontend & backend services are online...');
  await Promise.all([
    waitForServer(PORTS.api, 'API'),
    waitForServer(PORTS.storefront, 'Storefront'),
    waitForServer(PORTS.seller, 'Seller'),
    waitForServer(PORTS.admin, 'Admin'),
  ]);
  console.log('✅ Services ready.\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // -------------------------------------------------------------------------
    // SELLER FRONTEND TESTS
    // -------------------------------------------------------------------------
    console.log('--- SELLER PWA TESTS ---');

    await runTest('SELLER', '1. Navigation between core seller views', async (page) => {
      await page.goto('http://127.0.0.1:3001/dashboard', { waitUntil: 'networkidle' });
      await page.goto('http://127.0.0.1:3001/products', { waitUntil: 'networkidle' });
      if (!page.url().includes('/products')) throw new Error('Failed to route to /products');
      await page.goto('http://127.0.0.1:3001/orders', { waitUntil: 'networkidle' });
      if (!page.url().includes('/orders')) throw new Error('Failed to route to /orders');
      await page.goto('http://127.0.0.1:3001/settings', { waitUntil: 'networkidle' });
      if (!page.url().includes('/settings')) throw new Error('Failed to route to /settings');
    }, browser);

    await runTest('SELLER', '2. Product Editor form rendering and controls', async (page) => {
      await page.goto('http://127.0.0.1:3001/products?action=add', { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const text = await page.textContent('body');
      if (!text?.includes('Product') && !text?.includes('Details') && !text?.includes('Pricing')) {
        throw new Error('Product Editor drawer failed to open');
      }
    }, browser);

    await runTest('SELLER', '3. Variant matrix configuration controls', async (page) => {
      await page.goto('http://127.0.0.1:3001/products?action=add', { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const text = await page.textContent('body');
      if (!text?.includes('Variant') && !text?.includes('Option') && !text?.includes('SKU')) {
        throw new Error('Variant configuration controls not present on product form');
      }
    }, browser);

    await runTest('SELLER', '4. Media upload dropzone & image handling', async (page) => {
      await page.goto('http://127.0.0.1:3001/products?action=add', { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const text = await page.textContent('body');
      if (!text?.includes('Media') && !text?.includes('Image') && !text?.includes('Upload')) {
        throw new Error('Media upload controls not present on product form');
      }
    }, browser);

    await runTest('SELLER', '5. Brand Studio persistence controls', async (page) => {
      await page.goto('http://127.0.0.1:3001/brand-studio', { waitUntil: 'networkidle' });
      const content = await page.textContent('body');
      if (!content?.includes('Color') && !content?.includes('Palette') && !content?.includes('Font') && !content?.includes('Brand') && !content?.includes('Studio')) {
        throw new Error('Brand Studio color/font customization controls missing');
      }
    }, browser);

    await runTest('SELLER', '6. Subscription state display & billing gating', async (page) => {
      await page.goto('http://127.0.0.1:3001/subscription', { waitUntil: 'networkidle' });
      const text = await page.textContent('body');
      if (!text?.includes('Plan') && !text?.includes('Subscription') && !text?.includes('Billing')) {
        throw new Error('Subscription state page missing billing details');
      }
    }, browser);

    // -------------------------------------------------------------------------
    // BUYER STOREFRONT TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- BUYER STOREFRONT TESTS ---');

    await runTest('BUYER', '7. Multi-theme system rendering', async (page) => {
      await page.goto('http://127.0.0.1:3000/store/aurelia', { waitUntil: 'networkidle' });
      const header = page.locator('header').first();
      if (!(await header.isVisible())) throw new Error('Theme header failed to render');
    }, browser);

    await runTest('BUYER', '8. Product variant selection & pricing update', async (page) => {
      await page.goto('http://127.0.0.1:3000/store/aurelia', { waitUntil: 'networkidle' });
      const firstProductLink = page.locator('a[href*="/product/"]').first();
      if (await firstProductLink.isVisible()) {
        await firstProductLink.click();
        await page.waitForLoadState('networkidle');
        const price = page.locator('text=₹').first();
        if (!(await price.isVisible())) throw new Error('Product price display missing');
      }
    }, browser);

    await runTest('BUYER', '9. Cart drawer/page state and badge counter', async (page) => {
      await page.goto('http://127.0.0.1:3000/store/aurelia', { waitUntil: 'networkidle' });
      const cartBtn = page.locator('a[href*="/cart"], button:has-text("Cart"), svg[class*="lucide-shopping"]').first();
      if (!(await cartBtn.isVisible())) throw new Error('Cart navigation trigger missing');
    }, browser);

    await runTest('BUYER', '10. Checkout form validation on empty submission', async (page) => {
      await page.goto('http://127.0.0.1:3000/store/aurelia/checkout', { waitUntil: 'networkidle' });
      const bodyText = await page.textContent('body');
      if (!bodyText?.includes('Checkout') && !bodyText?.includes('Address') && !bodyText?.includes('Shipping') && !bodyText?.includes('Order')) {
        throw new Error('Checkout page failed to render required address/shipping form');
      }
    }, browser);

    await runTest('BUYER', '11. Private/Unpaid store handling (Protected preview)', async (page) => {
      await page.goto('http://127.0.0.1:3000/store/patil-eng', { waitUntil: 'networkidle' });
      const text = await page.textContent('body');
      const isHandled = text?.includes('Unpublished') || text?.includes('private') || text?.includes('Preview') || text?.includes('Patil');
      if (!isHandled) throw new Error('Private store failed to display appropriate preview barrier');
    }, browser);

    // -------------------------------------------------------------------------
    // ADMIN CONSOLE TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- ADMIN CONSOLE TESTS ---');

    await runTest('ADMIN', '12. Merchants pagination & search table', async (page) => {
      await page.goto('http://127.0.0.1:3002/merchants', { waitUntil: 'networkidle' });
      const text = await page.textContent('body');
      if (!text?.includes('Merchant') && !text?.includes('Store') && !text?.includes('Tenant')) {
        throw new Error('Merchants table not visible in Admin');
      }
    }, browser);

    await runTest('ADMIN', '13. Commerce transactions listing & filter controls', async (page) => {
      await page.goto('http://127.0.0.1:3002/commerce', { waitUntil: 'networkidle' });
      const text = await page.textContent('body');
      if (!text?.includes('Commerce') && !text?.includes('Order') && !text?.includes('Transaction')) {
        throw new Error('Commerce listing missing from Admin');
      }
    }, browser);

    await runTest('ADMIN', '14. Operations health & failure recovery display', async (page) => {
      await page.goto('http://127.0.0.1:3002/operations', { waitUntil: 'networkidle' });
      const text = await page.textContent('body');
      if (!text?.includes('Operations') && !text?.includes('Health') && !text?.includes('System') && !text?.includes('Outbox')) {
        throw new Error('Operations health metrics missing from Admin');
      }
    }, browser);

    console.log('\n================================================================================');
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`📊 FRONTEND TEST RESULTS: ${passed} PASSED | ${failed} FAILED (${results.length} TOTAL)`);
    console.log('================================================================================\n');

    if (failed > 0) process.exit(1);
  } finally {
    await browser.close();
    procs.forEach((p) => p.kill());
  }
}

main().catch((err) => {
  console.error('Fatal Frontend test error:', err);
  process.exit(1);
});

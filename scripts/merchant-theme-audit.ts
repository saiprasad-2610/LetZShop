import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { chromium, Browser } from 'playwright';

const BASE_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(BASE_DIR, 'artifacts', 'merchant-theme-audit');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

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

async function waitForServer(port: number, name: string, maxWaitMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const ok = await checkPort(port);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function main() {
  console.log('🎨 Starting Merchant Theme System Visual Verification...');
  fs.mkdirSync(path.join(SCREENSHOT_DIR, 'dark'), { recursive: true });
  fs.mkdirSync(path.join(SCREENSHOT_DIR, 'light'), { recursive: true });

  const procs: ChildProcess[] = [];

  // Check if API is running
  const isApiUp = await checkPort(4000);
  if (!isApiUp) {
    console.log('Starting API server on :4000...');
    const apiProc = spawn('node', ['apps/api/dist/main.js'], {
      cwd: BASE_DIR,
      env: { ...process.env, PORT: '4000', NODE_ENV: 'production' },
      stdio: 'pipe',
      shell: true,
    });
    procs.push(apiProc);
  }

  // Check if Seller is running
  const isSellerUp = await checkPort(3001);
  if (!isSellerUp) {
    console.log('Starting Seller server on :3001...');
    const sellerProc = spawn('pnpm', ['--filter', '@simply/seller', 'start'], {
      cwd: BASE_DIR,
      env: { ...process.env, PORT: '3001', NODE_ENV: 'production' },
      stdio: 'pipe',
      shell: true,
    });
    procs.push(sellerProc);
  }

  console.log('Waiting for API (:4000) and Seller (:3001)...');
  const [apiReady, sellerReady] = await Promise.all([
    waitForServer(4000, 'API', 30000),
    waitForServer(3001, 'Seller', 30000),
  ]);

  if (!sellerReady) {
    console.error('❌ Seller server failed to start on :3001');
    procs.forEach((p) => p.kill());
    process.exit(1);
  }
  console.log('✅ Servers online. Launching Playwright Chromium...');

  const browser: Browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    let authData: any = null;
    if (apiReady) {
      console.log('Authenticating Seller session via API...');
      try {
        await fetch('http://localhost:4000/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '+919876543210' }),
        }).catch(() => {});
        const verifyRes = await fetch('http://localhost:4000/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '+919876543210', code: '123456' }),
        }).then((r) => r.json());
        authData = verifyRes.data || verifyRes;
      } catch (err) {
        console.warn('API auth failed, falling back to mock localStorage auth:', err);
      }
    }

    const token = authData?.accessToken || 'mock-jwt-token';
    const user = authData?.user || { id: 'seller-1', phone: '+919876543210', role: 'SELLER' };
    const store = authData?.store || { id: 'store-1', name: 'Artisan Boutique', slug: 'artisan-boutique', status: 'LIVE' };

    const themes: Array<'dark' | 'light'> = ['dark', 'light'];

    for (const theme of themes) {
      console.log(`\n========================================`);
      console.log(`Capturing Theme: ${theme.toUpperCase()} (${theme === 'dark' ? 'Graphite + Violet' : 'Sage + Gold'})`);
      console.log(`========================================`);

      const context = await browser.newContext();
      const page = await context.newPage();

      // Set auth and theme in localStorage
      await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
      await page.evaluate(
        ({ t, u, s, th }) => {
          localStorage.setItem('simply_seller_token', t);
          localStorage.setItem('simply_seller_user', JSON.stringify(u));
          localStorage.setItem('simply_seller_store', JSON.stringify(s));
          localStorage.setItem('simply_merchant_theme', th);
        },
        { t: token, u: user, s: store, th: theme }
      );

      // Desktop Viewport: 1440 x 900
      await page.setViewportSize({ width: 1440, height: 900 });

      // Major screens to capture on Desktop
      const desktopPages = [
        { name: '01-dashboard', path: '/' },
        { name: '02-products-inventory', path: '/products' },
        { name: '03-orders', path: '/orders' },
        { name: '04-analytics', path: '/analytics' },
        { name: '05-store-preview', path: '/store-preview' },
        { name: '06-themes-brand-studio', path: '/brand-studio' },
        { name: '07-settings', path: '/settings' },
        { name: '08-subscription', path: '/subscription' },
        { name: '09-customers', path: '/customers' },
        { name: '10-coupons', path: '/coupons' },
      ];

      for (const p of desktopPages) {
        console.log(`  [Desktop 1440x900] ${theme.toUpperCase()} - ${p.name}...`);
        await page.goto(`http://localhost:3001${p.path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600); // Wait for transition and data render
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, theme, `${p.name}-desktop.png`),
          fullPage: true,
        });
      }

      // Order Detail Drawer
      console.log(`  [Desktop 1440x900] ${theme.toUpperCase()} - Order Detail Drawer...`);
      await page.goto('http://localhost:3001/orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      const viewOrderBtn = await page.$('button:has-text("View"), tr button, table button');
      if (viewOrderBtn) {
        await viewOrderBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, theme, '03b-order-detail-drawer-desktop.png'),
        });
      }

      // Mobile Viewport: 375 x 812
      console.log(`  [Mobile 375x812] Capturing Dashboard, Inventory, Orders...`);
      await page.setViewportSize({ width: 375, height: 812 });

      const mobilePages = [
        { name: '01-dashboard-mobile', path: '/' },
        { name: '02-products-inventory-mobile', path: '/products' },
        { name: '03-orders-mobile', path: '/orders' },
      ];

      for (const p of mobilePages) {
        console.log(`  [Mobile 375x812] ${theme.toUpperCase()} - ${p.name}...`);
        await page.goto(`http://localhost:3001${p.path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, theme, `${p.name}.png`),
          fullPage: true,
        });
      }

      // Test Theme Toggle Interaction
      if (theme === 'dark') {
        console.log('  Testing interactive Theme Toggle switch from Dark -> Light...');
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const toggleBtn = await page.$('button[title*="theme" i], button:has-text("Theme"), button:has-text("Mode")');
        if (toggleBtn) {
          await toggleBtn.click();
          await page.waitForTimeout(400);
          const currentTheme = await page.evaluate(() => localStorage.getItem('simply_merchant_theme'));
          console.log(`  Theme after toggle click in localStorage: ${currentTheme}`);
        }
      }

      await context.close();
    }

    console.log('\n🎉 ALL THEME SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    await browser.close();
    procs.forEach((p) => p.kill());
  }
}

main().catch((err) => {
  console.error('Fatal visual audit error:', err);
  process.exit(1);
});

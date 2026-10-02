import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { chromium, Browser, Page } from 'playwright';

const BASE_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(BASE_DIR, 'artifacts', 'ui-review');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PORTS = {
  api: 4000,
  storefront: 3000,
  seller: 3001,
  admin: 3002,
};

function ensureDirs() {
  ['seller', 'buyer', 'admin'].forEach((sub) => {
    const dir = path.join(SCREENSHOT_DIR, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

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
  console.log('📸 Starting Phase 4.5 Visual Screenshot Audit...');
  ensureDirs();

  const procs: ChildProcess[] = [];

  // Check if any server is already running, otherwise spawn
  const isApiUp = await checkPort(PORTS.api);
  if (!isApiUp) {
    console.log('Starting API server on :4000...');
    const apiProc = spawn('node', ['apps/api/dist/src/main.js'], {
      cwd: BASE_DIR,
      env: { ...process.env, PORT: '4000', NODE_ENV: 'production' },
      stdio: 'pipe',
      shell: true,
    });
    procs.push(apiProc);
  }

  const isStorefrontUp = await checkPort(PORTS.storefront);
  if (!isStorefrontUp) {
    console.log('Starting Storefront on :3000...');
    const sfProc = spawn('pnpm', ['--filter', '@simply/storefront', 'start'], {
      cwd: BASE_DIR,
      env: { ...process.env, PORT: '3000', NODE_ENV: 'production' },
      stdio: 'pipe',
      shell: true,
    });
    procs.push(sfProc);
  }

  const isSellerUp = await checkPort(PORTS.seller);
  if (!isSellerUp) {
    console.log('Starting Seller PWA on :3001...');
    const sellerProc = spawn('pnpm', ['--filter', '@simply/seller', 'start'], {
      cwd: BASE_DIR,
      env: { ...process.env, PORT: '3001', NODE_ENV: 'production' },
      stdio: 'pipe',
      shell: true,
    });
    procs.push(sellerProc);
  }

  const isAdminUp = await checkPort(PORTS.admin);
  if (!isAdminUp) {
    console.log('Starting Admin Console on :3002...');
    const adminProc = spawn('pnpm', ['--filter', '@simply/admin', 'start'], {
      cwd: BASE_DIR,
      env: { ...process.env, PORT: '3002', NODE_ENV: 'production' },
      stdio: 'pipe',
      shell: true,
    });
    procs.push(adminProc);
  }

  console.log('⏳ Waiting for all 4 servers to report healthy...');
  const [apiOk, sfOk, sellerOk, adminOk] = await Promise.all([
    waitForServer(PORTS.api, 'API'),
    waitForServer(PORTS.storefront, 'Storefront'),
    waitForServer(PORTS.seller, 'Seller'),
    waitForServer(PORTS.admin, 'Admin'),
  ]);

  if (!apiOk || !sfOk || !sellerOk || !adminOk) {
    console.error(`Server readiness failure: API=${apiOk}, Storefront=${sfOk}, Seller=${sellerOk}, Admin=${adminOk}`);
    procs.forEach((p) => p.kill());
    process.exit(1);
  }

  console.log('✅ All 4 servers online. Launching Playwright with Chrome binary...');
  const browser: Browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  try {
    // =========================================================================
    // 1. SELLER SCREENSHOTS
    // =========================================================================
    console.log('--- Capturing Seller Screenshots ---');
    const sellerContext = await browser.newContext();
    const sellerPage = await sellerContext.newPage();

    // 1.1 Login Page
    for (const vp of viewports) {
      await sellerPage.setViewportSize({ width: vp.width, height: vp.height });
      await sellerPage.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
      await sellerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'seller', `seller-login-${vp.name}.png`),
        fullPage: true,
      });
    }

    // Authenticate Seller via real API call and inject into localStorage
    console.log('Authenticating Seller session via API...');
    // Clear any previous unverified OTP to reset cooldown
    try {
      await fetch('http://localhost:4000/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+919876543210' }),
      }).catch(() => {});
    } catch {}

    const verifyRes = await fetch('http://localhost:4000/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210', code: '123456' }),
    }).then((r) => r.json());

    const authData = verifyRes.data || verifyRes;
    const token = authData.accessToken;
    const user = authData.user;
    const store = authData.store;

    console.log(`Authenticated as Seller: ${user?.phone} (${store?.name})`);

    // Inject authentication into seller browser context
    await sellerPage.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
    await sellerPage.evaluate(
      ({ t, u, s }) => {
        localStorage.setItem('simply_seller_token', t);
        localStorage.setItem('simply_seller_user', JSON.stringify(u));
        localStorage.setItem('simply_seller_store', JSON.stringify(s));
      },
      { t: token, u: user, s: store }
    );

    // Capture Authenticated Seller Pages
    const sellerPages = [
      { name: 'dashboard', path: '/' },
      { name: 'products', path: '/products' },
      { name: 'orders', path: '/orders' },
      { name: 'customers', path: '/customers' },
      { name: 'subscription', path: '/subscription' },
      { name: 'settings', path: '/settings' },
    ];

    for (const sp of sellerPages) {
      for (const vp of viewports) {
        await sellerPage.setViewportSize({ width: vp.width, height: vp.height });
        await sellerPage.goto(`http://localhost:3001${sp.path}`, { waitUntil: 'domcontentloaded' });
        await sellerPage.waitForTimeout(600); // Allow smooth transitions to settle
        await sellerPage.screenshot({
          path: path.join(SCREENSHOT_DIR, 'seller', `seller-${sp.name}-${vp.name}.png`),
          fullPage: true,
        });
      }
    }

    // Seller Products Drawer (Add Product)
    await sellerPage.setViewportSize({ width: 1440, height: 900 });
    await sellerPage.goto('http://localhost:3001/products', { waitUntil: 'domcontentloaded' });
    const addBtn = await sellerPage.$('button:has-text("Add Product")');
    if (addBtn) {
      await addBtn.click();
      await sellerPage.waitForTimeout(600);
      await sellerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'seller', 'seller-add-product-drawer-desktop.png'),
      });
      // Mobile drawer
      await sellerPage.setViewportSize({ width: 390, height: 844 });
      await sellerPage.waitForTimeout(400);
      await sellerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'seller', 'seller-add-product-drawer-mobile.png'),
      });
    }

    // Seller Orders Drawer (Order Details)
    await sellerPage.setViewportSize({ width: 1440, height: 900 });
    await sellerPage.goto('http://localhost:3001/orders', { waitUntil: 'domcontentloaded' });
    const viewOrderBtn = await sellerPage.$('button:has-text("View Details")');
    if (viewOrderBtn) {
      await viewOrderBtn.click();
      await sellerPage.waitForTimeout(600);
      await sellerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'seller', 'seller-order-drawer-desktop.png'),
      });
      await sellerPage.setViewportSize({ width: 390, height: 844 });
      await sellerPage.waitForTimeout(400);
      await sellerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'seller', 'seller-order-drawer-mobile.png'),
      });
    }

    // Brand Studio Tiers (Quick, Brand, Studio)
    await sellerPage.setViewportSize({ width: 1440, height: 900 });
    await sellerPage.goto('http://localhost:3001/brand-studio', { waitUntil: 'domcontentloaded' });
    await sellerPage.waitForTimeout(800);

    // Quick Design
    await sellerPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'seller', 'seller-brand-studio-quick-desktop.png'),
    });

    // Brand Identity
    const brandTab = await sellerPage.$('button:has-text("Brand Identity")');
    if (brandTab) {
      await brandTab.click();
      await sellerPage.waitForTimeout(500);
      await sellerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'seller', 'seller-brand-studio-brand-desktop.png'),
      });
    }

    // Studio Sections
    const studioTab = await sellerPage.$('button:has-text("Studio Sections")');
    if (studioTab) {
      await studioTab.click();
      await sellerPage.waitForTimeout(500);
      await sellerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'seller', 'seller-brand-studio-studio-desktop.png'),
      });
    }

    await sellerContext.close();

    // =========================================================================
    // 2. BUYER STOREFRONT SCREENSHOTS
    // =========================================================================
    console.log('--- Capturing Buyer Storefront Screenshots ---');
    const buyerContext = await browser.newContext();
    const buyerPage = await buyerContext.newPage();

    const demoStores = [
      { slug: 'aaraa-jewels', theme: 'atelier', prodId: 'c5000000-0000-0000-0000-000000000001' },
      { slug: 'pulse-street', theme: 'pulse', prodId: 'd5000000-0000-0000-0000-000000000001' },
      { slug: 'mithaiwala', theme: 'harvest', prodId: 'e5000000-0000-0000-0000-000000000001' },
      { slug: 'foundry-industrial', theme: 'foundry', prodId: 'b7400000-0000-0000-0000-000000000001' },
      { slug: 'vriksha-living', theme: 'habitat', prodId: 'f5000000-0000-0000-0000-000000000001' },
      { slug: 'shree-ganesh', theme: 'local', prodId: '15000000-0000-0000-0000-000000000001' },
    ];

    // Homepages & Product Pages
    for (const store of demoStores) {
      // Desktop Home
      await buyerPage.setViewportSize({ width: 1440, height: 900 });
      await buyerPage.goto(`http://localhost:3000/store/${store.slug}`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('.animate-spin', { state: 'detached', timeout: 8000 }).catch(() => {});
      await buyerPage.waitForTimeout(600);
      await buyerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'buyer', `buyer-${store.theme}-home-desktop.png`),
        fullPage: true,
      });

      // Mobile Home
      await buyerPage.setViewportSize({ width: 390, height: 844 });
      await buyerPage.goto(`http://localhost:3000/store/${store.slug}`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('.animate-spin', { state: 'detached', timeout: 8000 }).catch(() => {});
      await buyerPage.waitForTimeout(600);
      await buyerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'buyer', `buyer-${store.theme}-home-mobile.png`),
        fullPage: true,
      });

      // Desktop Product
      await buyerPage.setViewportSize({ width: 1440, height: 900 });
      await buyerPage.goto(`http://localhost:3000/store/${store.slug}/product/${store.prodId}`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('.animate-spin', { state: 'detached', timeout: 8000 }).catch(() => {});
      await buyerPage.waitForTimeout(800);
      await buyerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'buyer', `buyer-${store.theme}-product-desktop.png`),
        fullPage: true,
      });

      // Mobile Product (with sticky CTA)
      await buyerPage.setViewportSize({ width: 390, height: 844 });
      await buyerPage.goto(`http://localhost:3000/store/${store.slug}/product/${store.prodId}`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('.animate-spin', { state: 'detached', timeout: 8000 }).catch(() => {});
      await buyerPage.waitForTimeout(800);
      await buyerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, 'buyer', `buyer-${store.theme}-product-mobile.png`),
      });
    }

    // Cart Page Desktop & Mobile
    await buyerPage.setViewportSize({ width: 1440, height: 900 });
    await buyerPage.goto('http://localhost:3000/store/aaraa-jewels/cart', { waitUntil: 'domcontentloaded' });
    await buyerPage.waitForSelector('.animate-spin', { state: 'detached', timeout: 8000 }).catch(() => {});
    await buyerPage.waitForTimeout(600);
    await buyerPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'buyer', 'buyer-cart-desktop.png'),
    });
    await buyerPage.setViewportSize({ width: 390, height: 844 });
    await buyerPage.waitForTimeout(600);
    await buyerPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'buyer', 'buyer-cart-mobile.png'),
    });

    // Checkout Page Desktop & Mobile
    await buyerPage.setViewportSize({ width: 1440, height: 900 });
    await buyerPage.goto('http://localhost:3000/store/aaraa-jewels/checkout', { waitUntil: 'domcontentloaded' });
    await buyerPage.waitForSelector('.animate-spin', { state: 'detached', timeout: 8000 }).catch(() => {});
    await buyerPage.waitForTimeout(600);
    await buyerPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'buyer', 'buyer-checkout-desktop.png'),
    });
    await buyerPage.setViewportSize({ width: 390, height: 844 });
    await buyerPage.waitForTimeout(600);
    await buyerPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'buyer', 'buyer-checkout-mobile.png'),
    });

    // Order Tracking Page Desktop & Mobile
    await buyerPage.setViewportSize({ width: 1440, height: 900 });
    await buyerPage.goto('http://localhost:3000/store/aurelia/order/ORD-20261001-C85C6F?t=322324f411cf7f99f64e1c0900a786f7', { waitUntil: 'domcontentloaded' });
    await buyerPage.waitForSelector('.animate-spin', { state: 'detached', timeout: 8000 }).catch(() => {});
    await buyerPage.waitForTimeout(800);
    await buyerPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'buyer', 'buyer-order-tracking-desktop.png'),
    });
    await buyerPage.setViewportSize({ width: 390, height: 844 });
    await buyerPage.waitForTimeout(600);
    await buyerPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'buyer', 'buyer-order-tracking-mobile.png'),
    });

    await buyerContext.close();

    // =========================================================================
    // 3. ADMIN SCREENSHOTS
    // =========================================================================
    console.log('--- Capturing Admin Console Screenshots ---');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    const adminScreens = [
      { name: 'dashboard', path: '/' },
      { name: 'merchants', path: '/merchants' },
      { name: 'commerce', path: '/commerce' },
      { name: 'billing', path: '/billing' },
      { name: 'themes', path: '/themes' },
      { name: 'operations', path: '/operations' },
    ];

    for (const scr of adminScreens) {
      for (const vp of viewports) {
        await adminPage.setViewportSize({ width: vp.width, height: vp.height });
        await adminPage.goto(`http://localhost:3002${scr.path}`, { waitUntil: 'domcontentloaded' });
        await adminPage.waitForTimeout(600);
        await adminPage.screenshot({
          path: path.join(SCREENSHOT_DIR, 'admin', `admin-${scr.name}-${vp.name}.png`),
          fullPage: true,
        });
      }
    }

    await adminContext.close();
    console.log('🎉 Screenshot audit completed successfully!');
  } catch (err) {
    console.error('Error during screenshot audit:', err);
  } finally {
    await browser.close();
    console.log('Terminating spawned child servers...');
    procs.forEach((p) => {
      try {
        if (p.pid) {
          require('child_process').execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: 'ignore' });
        }
      } catch {}
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

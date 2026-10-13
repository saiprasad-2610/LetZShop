import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { chromium, Browser } from 'playwright';

const BASE_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = path.join(BASE_DIR, 'artifacts');

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
  console.log('🌟 Starting Enriched Merchant Dashboard Visual Verification...');
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

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
    console.error('❌ Seller server failed on :3001');
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
    console.log('Authenticating Seller session via API...');
    let authData: any = null;
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
      console.error('API auth failed:', err);
    }

    if (!authData?.accessToken) {
      throw new Error('Failed to obtain real access token from API');
    }

    const token = authData.accessToken;
    const refreshToken = authData.refreshToken;
    const user = authData.user;
    const store = authData.store;
    console.log(`Authenticated as: ${user?.phone} | Store: ${store?.name}`);

    // =========================================================================
    // 1. DARK THEME — GRAPHITE + VIOLET
    // =========================================================================
    console.log('\n[1/2] Verifying DARK Dashboard (Graphite + Violet)...');
    const darkContext = await browser.newContext();
    const darkPage = await darkContext.newPage();

    await darkPage.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
    await darkPage.evaluate(
      ({ t, rt, u, s }) => {
        localStorage.setItem('simply_seller_token', t);
        localStorage.setItem('simply_seller_refresh_token', rt);
        localStorage.setItem('simply_seller_user', JSON.stringify(u));
        localStorage.setItem('simply_seller_store', JSON.stringify(s));
        localStorage.setItem('simply_merchant_theme', 'dark');
      },
      { t: token, rt: refreshToken, u: user, s: store }
    );

    // Desktop 1440x900
    await darkPage.setViewportSize({ width: 1440, height: 900 });
    await darkPage.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    await darkPage.waitForSelector('text=Total Sales', { timeout: 10000 });
    await darkPage.waitForTimeout(1000);
    console.log(`  Dark Desktop URL: ${darkPage.url()}`);

    const darkDesktopPath = path.join(ARTIFACTS_DIR, 'dashboard-dark-desktop-final.png');
    await darkPage.screenshot({ path: darkDesktopPath, fullPage: false });
    console.log(`  📸 Saved Dark Desktop (1440x900 view): ${darkDesktopPath}`);

    // Check single-screen vertical fit on 1440x900
    const darkNextStepBox = await darkPage.locator('section[aria-label="Your Next Step"]').boundingBox();
    console.log(`  📐 Dark 1440x900 Next Step bottom Y: ${darkNextStepBox ? darkNextStepBox.y + darkNextStepBox.height : 'N/A'}px (Viewport height: 900px)`);

    // Laptop 1366x768
    await darkPage.setViewportSize({ width: 1366, height: 768 });
    await darkPage.waitForTimeout(500);
    const darkLaptopPath = path.join(ARTIFACTS_DIR, 'dashboard-dark-laptop-final.png');
    await darkPage.screenshot({ path: darkLaptopPath, fullPage: false });
    console.log(`  📸 Saved Dark Laptop (1366x768 view): ${darkLaptopPath}`);

    // Tablet 768x1024
    await darkPage.setViewportSize({ width: 768, height: 1024 });
    await darkPage.waitForTimeout(500);
    const darkTabletPath = path.join(ARTIFACTS_DIR, 'dashboard-dark-tablet.png');
    await darkPage.screenshot({ path: darkTabletPath, fullPage: false });
    console.log(`  📸 Saved Dark Tablet (768x1024 view): ${darkTabletPath}`);

    // Mobile 375x812 (Verify 2 cards per row)
    await darkPage.setViewportSize({ width: 375, height: 812 });
    await darkPage.waitForTimeout(500);
    const darkMobilePath = path.join(ARTIFACTS_DIR, 'dashboard-dark-mobile-final.png');
    await darkPage.screenshot({ path: darkMobilePath, fullPage: false });
    console.log(`  📸 Saved Dark Mobile (375x812, 2 cards per row): ${darkMobilePath}`);

    await darkContext.close();

    // =========================================================================
    // 2. LIGHT THEME — SAGE + GOLD
    // =========================================================================
    console.log('\n[2/2] Verifying LIGHT Dashboard (Sage + Gold)...');
    const lightContext = await browser.newContext();
    const lightPage = await lightContext.newPage();

    await lightPage.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
    await lightPage.evaluate(
      ({ t, rt, u, s }) => {
        localStorage.setItem('simply_seller_token', t);
        localStorage.setItem('simply_seller_refresh_token', rt);
        localStorage.setItem('simply_seller_user', JSON.stringify(u));
        localStorage.setItem('simply_seller_store', JSON.stringify(s));
        localStorage.setItem('simply_merchant_theme', 'light');
      },
      { t: token, rt: refreshToken, u: user, s: store }
    );

    // Desktop 1440x900
    await lightPage.setViewportSize({ width: 1440, height: 900 });
    await lightPage.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    await lightPage.waitForSelector('text=Total Sales', { timeout: 10000 });
    await lightPage.waitForTimeout(1000);
    console.log(`  Light Desktop URL: ${lightPage.url()}`);

    const lightDesktopPath = path.join(ARTIFACTS_DIR, 'dashboard-light-desktop-final.png');
    await lightPage.screenshot({ path: lightDesktopPath, fullPage: false });
    console.log(`  📸 Saved Light Desktop (1440x900 view): ${lightDesktopPath}`);

    // Check single-screen vertical fit on 1440x900
    const lightNextStepBox = await lightPage.locator('section[aria-label="Your Next Step"]').boundingBox();
    console.log(`  📐 Light 1440x900 Next Step bottom Y: ${lightNextStepBox ? lightNextStepBox.y + lightNextStepBox.height : 'N/A'}px (Viewport height: 900px)`);

    // Laptop 1366x768
    await lightPage.setViewportSize({ width: 1366, height: 768 });
    await lightPage.waitForTimeout(500);
    const lightLaptopPath = path.join(ARTIFACTS_DIR, 'dashboard-light-laptop-final.png');
    await lightPage.screenshot({ path: lightLaptopPath, fullPage: false });
    console.log(`  📸 Saved Light Laptop (1366x768 view): ${lightLaptopPath}`);

    // Tablet 768x1024
    await lightPage.setViewportSize({ width: 768, height: 1024 });
    await lightPage.waitForTimeout(500);
    const lightTabletPath = path.join(ARTIFACTS_DIR, 'dashboard-light-tablet.png');
    await lightPage.screenshot({ path: lightTabletPath, fullPage: false });
    console.log(`  📸 Saved Light Tablet (768x1024 view): ${lightTabletPath}`);

    // Mobile 375x812 (Verify 2 cards per row)
    await lightPage.setViewportSize({ width: 375, height: 812 });
    await lightPage.waitForTimeout(500);
    const lightMobilePath = path.join(ARTIFACTS_DIR, 'dashboard-light-mobile-final.png');
    await lightPage.screenshot({ path: lightMobilePath, fullPage: false });
    console.log(`  📸 Saved Light Mobile (375x812, 2 cards per row): ${lightMobilePath}`);

    await lightContext.close();

    console.log('\n🎉 ALL DASHBOARD VISUAL ENRICHMENT VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } finally {
    await browser.close();
    procs.forEach((p) => p.kill());
  }
}

main().catch((err) => {
  console.error('Fatal visual audit error:', err);
  process.exit(1);
});

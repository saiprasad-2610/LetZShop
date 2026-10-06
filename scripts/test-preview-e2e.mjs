import { chromium } from 'playwright';
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/default.js';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/SOHAN/.gemini/antigravity-ide/brain/f9f7422b-0833-4713-bbcc-651c050a9db5/storefront_preview';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce?schema=public'
    }
  }
});

async function run() {
  console.log('=== STARTING CHROME E2E STOREFRONT PREVIEW WALKTHROUGH ===');

  // Step 0: Record Baseline DB Counts
  const initialOrderCount = await prisma.order.count();
  const initialCustomerCount = await prisma.customer.count();
  const initialPaymentOrdersCount = await prisma.paymentOrder.count();
  const initialShipmentsCount = await prisma.shipment.count();
  const initialInventory = await prisma.inventory.findMany({ select: { id: true, stockOnHand: true, stockReserved: true } });

  console.log('Baseline Database Counts:');
  console.log(`- Orders: ${initialOrderCount}`);
  console.log(`- Customers: ${initialCustomerCount}`);
  console.log(`- Payment Orders: ${initialPaymentOrdersCount}`);
  console.log(`- Shipments: ${initialShipmentsCount}`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  // -------------------------------------------------------------------------
  // DESKTOP RUN: 1440x900
  // -------------------------------------------------------------------------
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const desktopPage = await desktopContext.newPage();

  // 1. Seller Login & Dashboard
  console.log('\nAuthenticating as seller via PIN login...');
  const loginRes = await fetch('http://localhost:4000/auth/pin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919876543210', pin: '654321' }),
  }).then((r) => r.json());

  if (!loginRes.data?.accessToken) {
    throw new Error('Failed to authenticate seller: ' + JSON.stringify(loginRes));
  }
  const token = loginRes.data.accessToken;
  const user = loginRes.data.user;
  const store = loginRes.data.store;
  console.log(`✓ Authenticated as: ${user.phone} (${store.name})`);

  await desktopPage.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
  await desktopPage.evaluate(
    ({ t, u, s }) => {
      localStorage.setItem('simply_seller_token', t);
      localStorage.setItem('simply_seller_user', JSON.stringify(u));
      localStorage.setItem('simply_seller_store', JSON.stringify(s));
    },
    { t: token, u: user, s: store }
  );

  console.log('Navigating to Seller Dashboard...');
  await desktopPage.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2000);

  // Capture Dashboard showing Next Step section
  console.log('Capturing Seller Dashboard (1440x900)...');
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, '01_dashboard_desktop_1440.png'),
    fullPage: false
  });

  // 2. Seller Store Preview page
  console.log('Navigating to /store-preview...');
  await desktopPage.goto('http://localhost:3001/store-preview');
  await desktopPage.waitForTimeout(3000);
  console.log('Capturing Seller /store-preview (1440x900)...');
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, '02_store_preview_desktop_1440.png'),
    fullPage: false
  });

  // 3. Full Storefront Home (Preview mode)
  console.log('Navigating to Full Storefront Home as Customer Preview (1440x900)...');
  await desktopPage.goto('http://localhost:3000/store/sk-general-stores?preview=true');
  await desktopPage.waitForTimeout(2000);
  console.log('Capturing Full Storefront Home...');
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, '03_storefront_home_desktop_1440.png'),
    fullPage: false
  });

  // 4. Click Product Card -> Product Detail
  console.log('Navigating to Product Detail via product card click...');
  // Find first product card link
  const productCard = desktopPage.locator('a[href*="/product/"]').first();
  await productCard.click();
  await desktopPage.waitForURL('**/product/**', { timeout: 15000 });
  await desktopPage.waitForTimeout(2000);
  console.log('Capturing Product Detail (1440x900)...');
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, '04_product_detail_desktop_1440.png'),
    fullPage: false
  });

  // 5. Add to Cart -> Preview Cart
  console.log('Adding product to preview cart...');
  const addToCartBtn = desktopPage.locator('button:has-text("Add to Cart")').first();
  await addToCartBtn.click();
  await desktopPage.waitForTimeout(1000);

  console.log('Navigating to Cart...');
  await desktopPage.goto('http://localhost:3000/store/sk-general-stores/cart?preview=true');
  await desktopPage.waitForTimeout(2000);
  console.log('Capturing Preview Cart (1440x900)...');
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, '05_cart_desktop_1440.png'),
    fullPage: false
  });

  // 6. Checkout
  console.log('Navigating to Checkout...');
  const checkoutBtn = desktopPage.locator('a[href*="/checkout"]').first();
  await checkoutBtn.click();
  await desktopPage.waitForURL('**/checkout**', { timeout: 15000 });
  await desktopPage.waitForTimeout(1500);

  // Fill Checkout Form
  console.log('Filling Guest Buyer details...');
  await desktopPage.fill('input[placeholder*="Anand Sharma"]', 'Ramesh Sharma');
  await desktopPage.fill('input[placeholder*="9876543210"]', '9876543210');
  await desktopPage.fill('input[type="email"]', 'ramesh.sharma@example.com');
  
  // Delivery address
  const addrInput = desktopPage.locator('input[placeholder*="Lotus Residency"]');
  if (await addrInput.isVisible()) {
    await addrInput.fill('42 Brigade Road, Shanthala Nagar');
    await desktopPage.fill('input[placeholder="560001"]', '560025');
    await desktopPage.fill('input[placeholder="Bengaluru"]', 'Bengaluru');
    await desktopPage.fill('input[placeholder="Karnataka"]', 'Karnataka');
  }

  console.log('Capturing Checkout Form (1440x900)...');
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, '06_checkout_desktop_1440.png'),
    fullPage: false
  });

  // 7. Click [ Preview Place Order ]
  console.log('Submitting Preview Place Order...');
  const submitBtn = desktopPage.locator('button:has-text("Preview Place Order")');
  await submitBtn.click();
  await desktopPage.waitForTimeout(2000);

  console.log('Capturing Preview Confirmation (1440x900)...');
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, '07_preview_confirmation_desktop_1440.png'),
    fullPage: false
  });

  // -------------------------------------------------------------------------
  // MOBILE RUN: 375x812 (iPhone X/12 viewport)
  // -------------------------------------------------------------------------
  console.log('\n--- MOBILE RUN (375x812) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();

  // Mobile Storefront Home
  console.log('Navigating to Mobile Storefront Home...');
  await mobilePage.goto('http://localhost:3000/store/sk-general-stores?preview=true');
  await mobilePage.waitForTimeout(2000);

  // Check horizontal overflow
  const hasHorizontalScrollHome = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`Mobile Home Horizontal Overflow: ${hasHorizontalScrollHome ? 'YES (FAIL)' : 'NO (CLEAN PASS)'}`);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, '08_storefront_home_mobile_375.png'),
    fullPage: false
  });

  // Mobile Product Detail
  console.log('Navigating to Mobile Product Detail...');
  const mobileProductCard = mobilePage.locator('a[href*="/product/"]').first();
  await mobileProductCard.click();
  await mobilePage.waitForURL('**/product/**', { timeout: 15000 });
  await mobilePage.waitForTimeout(2000);

  const hasHorizontalScrollProduct = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`Mobile Product Detail Horizontal Overflow: ${hasHorizontalScrollProduct ? 'YES (FAIL)' : 'NO (CLEAN PASS)'}`);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, '09_product_detail_mobile_375.png'),
    fullPage: false
  });

  // Mobile Add to cart & checkout
  const mobileAddBtn = mobilePage.locator('button:has-text("Add to Cart")').first();
  await mobileAddBtn.click();
  await mobilePage.waitForTimeout(1000);

  await mobilePage.goto('http://localhost:3000/store/sk-general-stores/checkout?preview=true');
  await mobilePage.waitForTimeout(2000);

  // Fill details on mobile
  await mobilePage.fill('input[placeholder*="Anand Sharma"]', 'Priya Patel');
  await mobilePage.fill('input[placeholder*="9876543210"]', '9812345678');
  const mobileAddr = mobilePage.locator('input[placeholder*="Lotus Residency"]');
  if (await mobileAddr.isVisible()) {
    await mobileAddr.fill('12 Rosewood Apartments, Outer Ring Road');
    await mobilePage.fill('input[placeholder="560001"]', '560103');
    await mobilePage.fill('input[placeholder="Bengaluru"]', 'Bengaluru');
    await mobilePage.fill('input[placeholder="Karnataka"]', 'Karnataka');
  }

  const hasHorizontalScrollCheckout = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`Mobile Checkout Horizontal Overflow: ${hasHorizontalScrollCheckout ? 'YES (FAIL)' : 'NO (CLEAN PASS)'}`);

  // Submit on mobile
  const mobileSubmitBtn = mobilePage.locator('button:has-text("Preview Place Order")');
  await mobileSubmitBtn.click();
  await mobilePage.waitForTimeout(2000);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, '10_checkout_mobile_375.png'),
    fullPage: false
  });

  await browser.close();

  // -------------------------------------------------------------------------
  // FINAL DB VERIFICATION: PROOF OF ZERO COMMERCE MUTATIONS
  // -------------------------------------------------------------------------
  console.log('\n=== VERIFYING DATABASE STATE POST-WALKTHROUGH ===');
  const finalOrderCount = await prisma.order.count();
  const finalCustomerCount = await prisma.customer.count();
  const finalPaymentOrdersCount = await prisma.paymentOrder.count();
  const finalShipmentsCount = await prisma.shipment.count();
  const finalInventory = await prisma.inventory.findMany({ select: { id: true, stockOnHand: true, stockReserved: true } });

  console.log(`Orders: ${initialOrderCount} -> ${finalOrderCount} (Diff: ${finalOrderCount - initialOrderCount})`);
  console.log(`Customers: ${initialCustomerCount} -> ${finalCustomerCount} (Diff: ${finalCustomerCount - initialCustomerCount})`);
  console.log(`Payment Orders: ${initialPaymentOrdersCount} -> ${finalPaymentOrdersCount} (Diff: ${finalPaymentOrdersCount - initialPaymentOrdersCount})`);
  console.log(`Shipments: ${initialShipmentsCount} -> ${finalShipmentsCount} (Diff: ${finalShipmentsCount - initialShipmentsCount})`);

  let inventoryMutated = false;
  for (let i = 0; i < initialInventory.length; i++) {
    const init = initialInventory[i];
    const fin = finalInventory.find(f => f.id === init.id);
    if (!fin || fin.stockOnHand !== init.stockOnHand || fin.stockReserved !== init.stockReserved) {
      inventoryMutated = true;
      console.error(`Inventory variant ${init.id} mutated! Init: ${init.stockOnHand}/${init.stockReserved}, Fin: ${fin?.stockOnHand}/${fin?.stockReserved}`);
    }
  }

  if (
    finalOrderCount === initialOrderCount &&
    finalCustomerCount === initialCustomerCount &&
    finalPaymentOrdersCount === initialPaymentOrdersCount &&
    finalShipmentsCount === initialShipmentsCount &&
    !inventoryMutated
  ) {
    console.log('\n>>> SUCCESS: 100% PROOF OF ZERO COMMERCE MUTATIONS VERIFIED! <<<');
  } else {
    console.error('\n>>> ERROR: DATABASE WAS UNEXPECTEDLY MUTATED! <<<');
    process.exit(1);
  }

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

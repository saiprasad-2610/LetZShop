import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts/e2e-shirts');

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const prisma = new PrismaClient();

async function run() {
  console.log('--- STARTING REAL BROWSER E2E TESTS FOR SHIRTS & PRODUCT FLOW ---');
  console.log('Using executablePath:', CHROME_PATH);

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // Test 1: Storefront Product Page
  console.log('\n[TEST 1] Visiting Storefront Shirts product page: http://localhost:3000/store/sk-general-stores/product/shirts');
  await page.goto('http://localhost:3000/store/sk-general-stores/product/shirts', {
    waitUntil: 'networkidle',
  });

  // Verify page title
  const title = await page.textContent('h1');
  console.log('Page Title:', title);

  // Check initial selected options and main image
  await page.waitForSelector('[data-testid="product-main-image"]');
  const initialMainImgSrc = await page.getAttribute('[data-testid="product-main-image"]', 'src');
  console.log('Initial Main Image src:', initialMainImgSrc);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_storefront_initial.png') });

  // Test 2: Click White Colour Swatch
  console.log('\n[TEST 2] Clicking "White" swatch button...');
  const whiteBtn = page.locator('button:has-text("White")').first();
  await whiteBtn.click();
  await page.waitForTimeout(600);

  const whiteMainImgSrc = await page.getAttribute('[data-testid="product-main-image"]', 'src');
  console.log('Main Image after selecting White:', whiteMainImgSrc);
  const isWhiteImage = whiteMainImgSrc?.includes('1a5668db') || whiteMainImgSrc?.toLowerCase().includes('white');
  console.log('-> Image correctly switched to White shirt (1a5668db...):', isWhiteImage);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_storefront_white_selected.png') });

  // Test 3: Click Black Colour Swatch
  console.log('\n[TEST 3] Clicking "Black" swatch button...');
  const blackBtn = page.locator('button:has-text("Black")').first();
  await blackBtn.click();
  await page.waitForTimeout(600);

  const blackMainImgSrc = await page.getAttribute('[data-testid="product-main-image"]', 'src');
  console.log('Main Image after selecting Black:', blackMainImgSrc);
  const isBlackImage = blackMainImgSrc?.includes('08fcb003') || blackMainImgSrc?.toLowerCase().includes('black');
  console.log('-> Image correctly switched to Black shirt (08fcb003...):', isBlackImage);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_storefront_black_selected.png') });

  // Test 4: Change Size M, then Size L with Black selected
  console.log('\n[TEST 4] Selecting Size M, then Size L (verifying colour image does NOT change)...');
  const sizeMBtn = page.locator('button:has-text("M")').first();
  await sizeMBtn.click();
  await page.waitForTimeout(400);

  const mImgSrc = await page.getAttribute('[data-testid="product-main-image"]', 'src');
  console.log('Main Image after selecting Size M:', mImgSrc);
  console.log('-> Retained Black shirt on Size M:', mImgSrc === blackMainImgSrc);

  const sizeLBtn = page.locator('button:has-text("L")').first();
  await sizeLBtn.click();
  await page.waitForTimeout(400);

  const lImgSrc = await page.getAttribute('[data-testid="product-main-image"]', 'src');
  console.log('Main Image after selecting Size L:', lImgSrc);
  console.log('-> Retained Black shirt on Size L:', lImgSrc === blackMainImgSrc);

  // Test 5: Add to Cart
  console.log('\n[TEST 5] Clicking "Add to Cart"...');
  const addToBagBtn = page.locator('[data-testid="add-to-cart-button"], button:has-text("Add to Cart")').first();
  await addToBagBtn.click();
  await page.waitForTimeout(800);

  const toastText = await page.textContent('body');
  const hasAddedToast = toastText?.includes('Added to Cart') || toastText?.includes('added to your bag');
  console.log('-> Add to Cart toast / feedback shown:', hasAddedToast);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_storefront_added_to_cart.png') });

  // Test 6: Unavailable Size Simulation
  console.log('\n[TEST 6] Simulating unavailable size (setting Black/M stock = 0)...');
  const blackMVariant = await prisma.productVariant.findFirst({
    where: { sku: 'PROD-BLACK-M' },
    include: { inventory: true },
  });

  if (blackMVariant?.inventory) {
    await prisma.inventory.update({
      where: { id: blackMVariant.inventory.id },
      data: { stockOnHand: 0 },
    });
    console.log('Updated Black/M stockOnHand to 0 in DB');

    // Reload page to refresh catalog
    await page.reload({ waitUntil: 'networkidle' });

    // Select Black
    const blackBtnReload = page.locator('button:has-text("Black")').first();
    await blackBtnReload.click();
    await page.waitForTimeout(600);

    // Inspect Size M button
    const sizeMReload = page.locator('button:has-text("M")').first();
    const isDisabled = await sizeMReload.getAttribute('disabled');
    const ariaDisabled = await sizeMReload.getAttribute('aria-disabled');
    const classNames = await sizeMReload.getAttribute('class');
    const isVisible = await sizeMReload.isVisible();

    console.log('Size M button status when Black/M has stock=0:');
    console.log(' - isVisible:', isVisible);
    console.log(' - disabled attribute:', isDisabled !== null);
    console.log(' - aria-disabled:', ariaDisabled);
    console.log(' - class indicates disabled/strikethrough:', classNames?.includes('cursor-not-allowed') || classNames?.includes('line-through'));

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_storefront_unavailable_size_m.png') });

    // Restore stock
    await prisma.inventory.update({
      where: { id: blackMVariant.inventory.id },
      data: { stockOnHand: 10 },
    });
    console.log('Restored Black/M stockOnHand to 10 in DB');
  }

  // Test 7: Merchant File Inputs in DOM (Accept attribute and Editor)
  console.log('\n[TEST 7] Verifying Merchant Product Editor DOM on http://localhost:3001...');
  try {
    const loginRes = await fetch('http://localhost:4000/auth/pin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919370262662', pin: '654321' }),
    }).then((r) => r.json());

    if (loginRes.data?.accessToken) {
      const { accessToken: token, user, store } = loginRes.data;
      await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
      await page.evaluate(
        ({ t, u, s }) => {
          localStorage.setItem('simply_seller_token', t);
          localStorage.setItem('simply_seller_user', JSON.stringify(u));
          localStorage.setItem('simply_seller_store', JSON.stringify(s));
        },
        { t: token, u: user, s: store }
      );
      console.log('✓ Injected seller credentials into localStorage for store:', store.name);

      await page.goto('http://localhost:3001/products', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      // Take screenshot of products list
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_seller_products_list.png') });

      // Find Edit button for Shirts
      const editShirtBtn = page.locator('[data-testid="edit-product-btn-440fc962-e92d-4b2c-94b2-79e0c39fe8ef"], tr:has-text("Shirts") button[title="Edit Product"], button[title="Edit Product"]').first();

      let opened = false;
      if ((await editShirtBtn.count()) > 0) {
        await editShirtBtn.click();
        opened = true;
      }

      if (opened) {
        await page.waitForTimeout(1500);

        // Inspect the file inputs in the DOM!
        const fileInputs = page.locator('input[type="file"]');
        const inputCount = await fileInputs.count();
        console.log(`Found ${inputCount} file input(s) in DOM:`);

        for (let i = 0; i < inputCount; i++) {
          const input = fileInputs.nth(i);
          const accept = await input.getAttribute('accept');
          const testid = await input.getAttribute('data-testid');
          console.log(` - File input #${i}: data-testid="${testid}", accept="${accept}"`);
        }

        // Inspect Photo Cards in Editor for Colour option selector
        const colourSelects = page.locator('select');
        const selectCount = await colourSelects.count();
        console.log(`Found ${selectCount} select elements in drawer:`);
        for (let i = 0; i < selectCount; i++) {
          const selText = await colourSelects.nth(i).textContent();
          if (selText?.includes('White') || selText?.includes('Black') || selText?.includes('All / General')) {
            console.log(` - Photo card Colour selector #${i} text options: "${selText.trim()}"`);
          }
        }

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_seller_product_editor.png') });
        console.log('✓ Captured 07_seller_product_editor.png');
      } else {
        console.log('Could not locate edit button on /products page');
      }
    } else {
      console.log('Login API returned non-success, skipping seller drawer test:', loginRes);
    }
  } catch (authErr) {
    console.error('Seller drawer check error:', authErr);
  }

  await browser.close();
  console.log('\n--- REAL BROWSER E2E TESTS COMPLETE ---');
}

run()
  .catch((err) => {
    console.error('Test error:', err);
  })
  .finally(() => prisma.$disconnect());

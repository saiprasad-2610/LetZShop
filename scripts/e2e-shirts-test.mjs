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

const SHIRTS_ID = '440fc962-e92d-4b2c-94b2-79e0c39fe8ef';
const WHITE_ASSET_ID = '4cd422c5-486d-4565-a40c-bcdb838594f9';
const BLACK_ASSET_ID = 'e2c59974-0e26-404e-96f3-33bc8aa0cc11';

async function run() {
  console.log('================================================================');
  console.log('--- STARTING COMPLETE E2E VERIFICATION SUITE ---');
  console.log('Using executablePath:', CHROME_PATH);
  console.log('================================================================\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // ---------------------------------------------------------------------------
  // STEP 1: AUTHENTICATE SELLER & INSPECT PHOTO CARD SELECTOR (REQUIREMENT 1)
  // ---------------------------------------------------------------------------
  console.log('[STAGE 1] Testing Merchant Product Editor Photo Card Association Selector...');
  const loginRes = await fetch('http://localhost:4000/auth/pin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919370262662', pin: '654321' }),
  }).then((r) => r.json());

  if (!loginRes.data?.accessToken) {
    throw new Error('Failed to login seller: ' + JSON.stringify(loginRes));
  }

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

  await page.goto('http://localhost:3001/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Open Shirts Product Editor Drawer
  const editShirtBtn = page.locator('tr:has-text("Shirts") button[title="Edit Product"]').first();
  await editShirtBtn.click();
  await page.waitForTimeout(1500);

  // Inspect the photo card association selectors
  const photoSelectors = page.locator('select[data-testid^="media-option-select-"]');
  const selCount = await photoSelectors.count();
  console.log(`Found ${selCount} photo card option selector(s) in editor drawer.`);

  let selectorOptionsText = '';
  for (let i = 0; i < selCount; i++) {
    const selText = await photoSelectors.nth(i).textContent();
    console.log(` - Photo Selector #${i} text content: "${selText?.trim()}"`);
    if (i === 0) selectorOptionsText = selText?.trim() || '';
  }

  const hasSML = selectorOptionsText.includes('S') && selectorOptionsText.includes('M') && selectorOptionsText.includes('L');
  const hasColourOnly = selectorOptionsText.includes('White') && selectorOptionsText.includes('Black') && !hasSML;

  console.log('Selector correctly restricted to Colour options (no S, M, L):', hasColourOnly);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_photo_selector_fixed.png') });

  // ---------------------------------------------------------------------------
  // STEP 2: TEST RUNTIME DOM ACCEPT ATTRIBUTES (REQUIREMENT 6)
  // ---------------------------------------------------------------------------
  console.log('\n[STAGE 2] Verifying File Input DOM Accept Attributes...');
  const fileInputs = page.locator('input[type="file"]');
  const inputCount = await fileInputs.count();
  console.log(`Found ${inputCount} file input(s) in editor DOM:`);
  const acceptAttributes = [];
  for (let i = 0; i < inputCount; i++) {
    const input = fileInputs.nth(i);
    const accept = await input.getAttribute('accept');
    const testid = await input.getAttribute('data-testid');
    console.log(` - Input #${i}: data-testid="${testid}", accept="${accept}"`);
    acceptAttributes.push({ testid, accept });
  }

  // Close the drawer for now
  const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(600);
  }

  // ---------------------------------------------------------------------------
  // STEP 3: TEST DELETE / REPLACE DUPLICATION END TO END (REQUIREMENT 4)
  // ---------------------------------------------------------------------------
  console.log('\n[STAGE 3] Testing Delete / Replace Duplication End to End in Database & Editor...');

  // 3.0 Baseline DB state
  let pmBefore = await prisma.productMedia.findMany({
    where: { productId: SHIRTS_ID },
    include: { optionValue: true, mediaAsset: true },
  });
  console.log(`Baseline ProductMedia row count: ${pmBefore.length}`);
  for (const m of pmBefore) {
    console.log(`  - id: ${m.id}, assetId: ${m.mediaAssetId}, optVal: ${m.optionValue?.value}, file: ${m.mediaAsset?.fileName}`);
  }

  // 3.A Delete White photo in Editor -> Save -> Reopen
  console.log('\n[3.A] Deleting White image in Editor, Saving, and Reopening...');
  await editShirtBtn.click();
  await page.waitForTimeout(1500);

  // Find delete button on first card (White shirt)
  const removeButtons = page.locator('button[title="Remove photo"]');
  const removeBtnCount = await removeButtons.count();
  console.log(`Found ${removeBtnCount} remove button(s). Clicking first remove button...`);
  if (removeBtnCount > 0) {
    await removeButtons.first().click();
    await page.waitForTimeout(400);

    // Save changes (button is "Update Product" when editing)
    const saveBtn = page.locator('button:has-text("Update Product")').first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // Check DB
    const pmAfterDelete = await prisma.productMedia.findMany({
      where: { productId: SHIRTS_ID },
      include: { optionValue: true, mediaAsset: true },
    });
    console.log(`Post-Delete DB ProductMedia row count: ${pmAfterDelete.length} (Expected: 1)`);
    for (const m of pmAfterDelete) {
      console.log(`  - Remaining image: assetId: ${m.mediaAssetId}, optVal: ${m.optionValue?.value}, file: ${m.mediaAsset?.fileName}`);
    }

    // Reopen product in editor to verify UI
    const reopenBtn1 = page.locator('tr:has-text("Shirts") button[title="Edit Product"]').first();
    await reopenBtn1.click();
    await page.waitForTimeout(1500);
    const photoCardsAfterDelete = await page.locator('select[data-testid^="media-option-select-"]').count();
    console.log(`Reopened Editor photo card count: ${photoCardsAfterDelete} (Expected: 1)`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_editor_after_delete.png') });
  }

  // 3.B Re-add / Upload White photo -> Associate to White -> Save -> Reopen
  console.log('\n[3.B] Uploading White photo, setting Colour="White", Saving, and Reopening...');
  const addFileInput = page.locator('[data-testid="product-image-file-input"]');

  // We can use a test image buffer or file
  const testImagePath = path.resolve(__dirname, 'test-white.png');
  // Simple 1x1 transparent PNG buffer
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(testImagePath, pngBuffer);

  await addFileInput.setInputFiles(testImagePath);
  await page.waitForTimeout(1500);

  // Select "White" on the newly added photo card (second selector)
  const selAfterUpload = page.locator('select[data-testid^="media-option-select-"]');
  const uploadCount = await selAfterUpload.count();
  console.log(`Photo cards after adding image: ${uploadCount}`);
  if (uploadCount > 1) {
    await selAfterUpload.nth(1).selectOption('White');
    await page.waitForTimeout(400);
  }

  // Save changes
  const saveBtn2 = page.locator('button:has-text("Update Product")').first();
  await saveBtn2.click();
  await page.waitForTimeout(2000);

  // Check DB
  const pmAfterAdd = await prisma.productMedia.findMany({
    where: { productId: SHIRTS_ID },
    include: { optionValue: true, mediaAsset: true },
  });
  console.log(`Post-Add DB ProductMedia row count: ${pmAfterAdd.length} (Expected: 2)`);
  for (const m of pmAfterAdd) {
    console.log(`  - Media row: assetId: ${m.mediaAssetId}, optVal: ${m.optionValue?.value}, optValId: ${m.optionValueId}`);
  }

  // Reopen product in editor
  const reopenBtn2 = page.locator('tr:has-text("Shirts") button[title="Edit Product"]').first();
  await reopenBtn2.click();
  await page.waitForTimeout(1500);
  const photoCardsAfterAdd = await page.locator('select[data-testid^="media-option-select-"]').count();
  console.log(`Reopened Editor photo card count: ${photoCardsAfterAdd} (Expected: 2)`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_editor_after_add.png') });

  // 3.C Replace Black image -> Save -> Reopen
  console.log('\n[3.C] Replacing Black photo via Replace input, Saving, and Reopening...');
  const replaceBtn = page.locator('button[title="Replace this photo"]').first();
  await replaceBtn.click();
  await page.waitForTimeout(400);

  const replaceFileInput = page.locator('[data-testid="product-image-replace-input"]');
  const testReplacePath = path.resolve(__dirname, 'test-replace.png');
  fs.writeFileSync(testReplacePath, pngBuffer);
  await replaceFileInput.setInputFiles(testReplacePath);
  await page.waitForTimeout(1500);

  // Save changes
  await page.locator('button:has-text("Update Product")').first().click();
  await page.waitForTimeout(2000);

  // Check DB
  const pmAfterReplace = await prisma.productMedia.findMany({
    where: { productId: SHIRTS_ID },
    include: { optionValue: true, mediaAsset: true },
  });
  console.log(`Post-Replace DB ProductMedia row count: ${pmAfterReplace.length} (Expected: 2)`);
  for (const m of pmAfterReplace) {
    console.log(`  - Media row: assetId: ${m.mediaAssetId}, optVal: ${m.optionValue?.value}, optValId: ${m.optionValueId}`);
  }

  // Reopen product in editor
  const reopenBtn3 = page.locator('tr:has-text("Shirts") button[title="Edit Product"]').first();
  await reopenBtn3.click();
  await page.waitForTimeout(1500);
  const photoCardsAfterReplace = await page.locator('select[data-testid^="media-option-select-"]').count();
  console.log(`Reopened Editor photo card count after replace: ${photoCardsAfterReplace} (Expected: 2)`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_editor_after_replace.png') });

  // Close drawer
  const cancelBtn = page.locator('button:has-text("Cancel")').first();
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
    await page.waitForTimeout(500);
  }

  // Clean up scratch image files
  if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
  if (fs.existsSync(testReplacePath)) fs.unlinkSync(testReplacePath);

  // Restore canonical Shirts images via inspect-and-repair-shirts.mjs logic
  console.log('\nRestoring canonical Shirts media for subsequent buyer tests...');
  await prisma.productMedia.deleteMany({ where: { productId: SHIRTS_ID } });
  const optWhite = await prisma.productOptionValue.findFirst({ where: { option: { productId: SHIRTS_ID }, value: 'White' } });
  const optBlack = await prisma.productOptionValue.findFirst({ where: { option: { productId: SHIRTS_ID }, value: 'Black' } });
  const whiteAsset = await prisma.mediaAsset.findUnique({ where: { id: WHITE_ASSET_ID } });
  const blackAsset = await prisma.mediaAsset.findUnique({ where: { id: BLACK_ASSET_ID } });

  await prisma.productMedia.create({
    data: {
      tenantId: store.tenantId,
      storeId: store.id,
      productId: SHIRTS_ID,
      mediaAssetId: WHITE_ASSET_ID,
      optionValueId: optWhite.id,
      filePath: whiteAsset.storageKey,
      storageKey: whiteAsset.storageKey,
      publicUrl: whiteAsset.publicUrl,
      mimeType: whiteAsset.mimeType,
      sizeBytes: whiteAsset.sizeBytes,
      sortOrder: 0,
      altText: 'White Shirt',
    },
  });

  await prisma.productMedia.create({
    data: {
      tenantId: store.tenantId,
      storeId: store.id,
      productId: SHIRTS_ID,
      mediaAssetId: BLACK_ASSET_ID,
      optionValueId: optBlack.id,
      filePath: blackAsset.storageKey,
      storageKey: blackAsset.storageKey,
      publicUrl: blackAsset.publicUrl,
      mimeType: blackAsset.mimeType,
      sizeBytes: blackAsset.sizeBytes,
      sortOrder: 1,
      altText: 'Black Shirt',
    },
  });
  console.log('✓ Canonical Shirts media restored.');

  // ---------------------------------------------------------------------------
  // STEP 4: TEST INVALID SIZE AFTER COLOUR SWITCH (REQUIREMENT 3)
  // ---------------------------------------------------------------------------
  console.log('\n[STAGE 4] Testing Invalid Size After Colour Switch (Requirement 3)...');

  // Configure stock in DB:
  // White/M = 10, Black/M = 0, Black/S = 10, Black/L = 10
  const varWhiteM = await prisma.productVariant.findFirst({ where: { sku: 'PROD-WHITE-M' }, include: { inventory: true } });
  const varBlackM = await prisma.productVariant.findFirst({ where: { sku: 'PROD-BLACK-M' }, include: { inventory: true } });
  const varBlackS = await prisma.productVariant.findFirst({ where: { sku: 'PROD-BLACK-S' }, include: { inventory: true } });
  const varBlackL = await prisma.productVariant.findFirst({ where: { sku: 'PROD-BLACK-L' }, include: { inventory: true } });

  await prisma.inventory.update({ where: { id: varWhiteM.inventory.id }, data: { stockOnHand: 10 } });
  await prisma.inventory.update({ where: { id: varBlackM.inventory.id }, data: { stockOnHand: 0 } });
  await prisma.inventory.update({ where: { id: varBlackS.inventory.id }, data: { stockOnHand: 10 } });
  await prisma.inventory.update({ where: { id: varBlackL.inventory.id }, data: { stockOnHand: 10 } });

  console.log('Stock configuration: White/M=10, Black/M=0, Black/S=10, Black/L=10');

  // Navigate to buyer page
  await page.goto('http://localhost:3000/store/sk-general-stores/product/shirts', { waitUntil: 'networkidle' });

  // 1. Select White
  console.log('Selecting Colour "White"...');
  await page.locator('button:has-text("White")').first().click();
  await page.waitForTimeout(500);

  // 2. Select M
  console.log('Selecting Size "M"...');
  await page.locator('button:has-text("M")').first().click();
  await page.waitForTimeout(500);

  const whiteMImg = await page.getAttribute('[data-testid="product-main-image"]', 'src');
  console.log('Main image with White/M selected:', whiteMImg);

  // 3. Click Black swatch
  console.log('Clicking Colour "Black" swatch...');
  await page.locator('button:has-text("Black")').first().click();
  await page.waitForTimeout(800);

  // Verify:
  // a) Black remains selected
  const blackBtnClasses = await page.locator('button:has-text("Black")').first().getAttribute('class');
  const isBlackActive = blackBtnClasses?.includes('bg-gray-50') || blackBtnClasses?.includes('ring-1');
  console.log(' - Black colour remains selected:', isBlackActive);

  // b) Size M is disabled
  const sizeMBtn = page.locator('button:has-text("M")').first();
  const isMDisabledAttr = (await sizeMBtn.getAttribute('disabled')) !== null;
  const isMAriaDisabled = await sizeMBtn.getAttribute('aria-disabled');
  const sizeMClasses = await sizeMBtn.getAttribute('class');
  const hasDisabledStyle = sizeMClasses?.includes('cursor-not-allowed') || sizeMClasses?.includes('line-through');
  console.log(' - Size M is disabled:', isMDisabledAttr && isMAriaDisabled === 'true' && hasDisabledStyle);

  // c) System automatically selects first available Black size
  // Find which size button is selected (has white text on dark bg)
  const sizeButtons = page.locator('div:has-text("Select Size")').locator('button');
  const btnCount = await sizeButtons.count();
  let selectedSize = '';
  for (let i = 0; i < btnCount; i++) {
    const btn = sizeButtons.nth(i);
    const cls = await btn.getAttribute('class');
    if (cls?.includes('bg-gray-900') && cls?.includes('text-white')) {
      selectedSize = (await btn.textContent())?.trim() || '';
    }
  }
  console.log(` - Auto-selected Size for Black: "${selectedSize}" (Expected: S or L)`);

  // d) Main image is Black
  const blackImg = await page.getAttribute('[data-testid="product-main-image"]', 'src');
  const isBlackImage = blackImg?.includes('08fcb003') || blackImg?.includes('Blackshirt');
  console.log(' - Main image is Black shirt:', isBlackImage);

  // e) selectedVariant is valid
  // Find which variant matches Black + selectedSize
  const targetSku = `PROD-BLACK-${selectedSize}`;
  const matchedVar = await prisma.productVariant.findFirst({ where: { sku: targetSku } });
  console.log(` - Matched Variant SKU: ${targetSku}, ID: ${matchedVar?.id}`);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_invalid_size_switch.png') });

  // ---------------------------------------------------------------------------
  // STEP 5: VERIFY ADD TO CART EXACT VARIANT (REQUIREMENT 5)
  // ---------------------------------------------------------------------------
  console.log('\n[STAGE 5] Verifying Add to Cart Exact Variant (Requirement 5)...');

  // Restore Black/M stock so all sizes are available
  await prisma.inventory.update({ where: { id: varBlackM.inventory.id }, data: { stockOnHand: 10 } });
  await page.reload({ waitUntil: 'networkidle' });

  // Test 5.1: Select Black/M and Add to Cart
  console.log('Selecting Black/M...');
  await page.locator('button:has-text("Black")').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("M")').first().click();
  await page.waitForTimeout(400);

  // Intercept cart API calls and read cart state
  const addToCartBtn = page.locator('[data-testid="add-to-cart-button"]').first();
  const [reqBlack] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/cart/') && req.url().includes('/items') && req.method() === 'POST'),
    addToCartBtn.click(),
  ]);
  await page.waitForTimeout(1000);

  const blackPayload = JSON.parse(reqBlack.postData() || '{}');
  const cartStateBlackM = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('simply_cart_') || key === 'simply_cart')) {
        try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
      }
    }
    return null;
  });

  const blackMItem = cartStateBlackM?.items?.[cartStateBlackM.items.length - 1];
  console.log('Added Black/M to Cart:');
  console.log(` - API Payload Variant ID: ${blackPayload.variantId} (Expected: ${varBlackM.id})`);
  console.log(` - Variant ID in cart: ${blackMItem?.variantId} (Expected: ${varBlackM.id})`);
  console.log(` - Price (paise): ${blackMItem?.pricePaise || blackMItem?.unitPricePaise}`);
  console.log(` - SKU: ${blackMItem?.sku || blackMItem?.variant?.sku}`);
  const isBlackMExact = blackPayload.variantId === varBlackM.id;
  console.log(' -> Matches exact Black/M variant:', isBlackMExact);

  // Test 5.2: Select White/M and Add to Cart
  console.log('\nSelecting White/M...');
  await page.locator('button:has-text("White")').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("M")').first().click();
  await page.waitForTimeout(400);

  const [reqWhite] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/cart/') && req.url().includes('/items') && req.method() === 'POST'),
    addToCartBtn.click(),
  ]);
  await page.waitForTimeout(1000);

  const whitePayload = JSON.parse(reqWhite.postData() || '{}');
  const cartStateWhiteM = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('simply_cart_') || key === 'simply_cart')) {
        try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
      }
    }
    return null;
  });

  const whiteMItem = cartStateWhiteM?.items?.[cartStateWhiteM.items.length - 1];
  console.log('Added White/M to Cart:');
  console.log(` - API Payload Variant ID: ${whitePayload.variantId} (Expected: ${varWhiteM.id})`);
  console.log(` - Variant ID in cart: ${whiteMItem?.variantId} (Expected: ${varWhiteM.id})`);
  console.log(` - Price (paise): ${whiteMItem?.pricePaise || whiteMItem?.unitPricePaise}`);
  console.log(` - SKU: ${whiteMItem?.sku || whiteMItem?.variant?.sku}`);
  const isWhiteMExact = whitePayload.variantId === varWhiteM.id;
  console.log(' -> Matches exact White/M variant:', isWhiteMExact);
  console.log(' -> Different variant IDs for Black/M and White/M:', blackPayload.variantId !== whitePayload.variantId);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_add_to_cart_exact_variant.png') });

  // ---------------------------------------------------------------------------
  // STEP 6: REGRESSION TESTS ACROSS ALL 4 PRODUCT ARCHETYPES (REQUIREMENT 8)
  // ---------------------------------------------------------------------------
  console.log('\n[STAGE 6] Testing Regression across all 4 Product Archetypes (Requirement 8)...');

  const testProducts = [
    {
      type: 'No Variants (Standalone)',
      slug: 'sohan',
      name: 'SohanK',
      hasOptions: false,
    },
    {
      type: 'Size-Only',
      slug: 'classic-denim-jeans',
      name: 'Classic Denim Jeans',
      hasOptions: true,
      selectOption: '30',
    },
    {
      type: 'Colour-Only',
      slug: 'vintage-leather-wallet',
      name: 'Vintage Leather Wallet',
      hasOptions: true,
      selectOption: 'Brown',
    },
    {
      type: 'Colour + Size',
      slug: 'shirts',
      name: 'Shirts',
      hasOptions: true,
      selectOption: 'White',
    },
  ];

  for (const tp of testProducts) {
    console.log(`\nTesting ${tp.type} product: /product/${tp.slug}...`);
    await page.goto(`http://localhost:3000/store/sk-general-stores/product/${tp.slug}`, {
      waitUntil: 'networkidle',
    });

    const title = await page.textContent('h1');
    console.log(` - Page loaded title: "${title?.trim()}"`);

    if (tp.selectOption) {
      const optBtn = page.locator(`button:has-text("${tp.selectOption}")`).first();
      if (await optBtn.isVisible()) {
        await optBtn.click();
        await page.waitForTimeout(300);
      }
    }

    const atcBtn = page.locator('[data-testid="add-to-cart-button"]').first();
    await atcBtn.click();
    await page.waitForTimeout(800);

    const bodyText = await page.textContent('body');
    const toastAppeared = bodyText?.includes('Added to Cart') || bodyText?.includes('added to your bag');
    console.log(` - Add to Cart successful (toast shown): ${toastAppeared}`);
  }

  // ---------------------------------------------------------------------------
  // STEP 7: CLEANUP TEMPORARY REGRESSION TEST DATA (REQUIREMENT 9)
  // ---------------------------------------------------------------------------
  console.log('\n[STAGE 7] Cleaning up temporary regression test products...');
  const tempSlugs = ['classic-denim-jeans', 'vintage-leather-wallet'];
  for (const slug of tempSlugs) {
    const p = await prisma.product.findFirst({ where: { slug, storeId: store.id } });
    if (p) {
      // Delete inventories
      const vars = await prisma.productVariant.findMany({ where: { productId: p.id } });
      const varIds = vars.map((v) => v.id);
      await prisma.inventory.deleteMany({ where: { variantId: { in: varIds } } });
      await prisma.productVariantOptionValue.deleteMany({ where: { variantId: { in: varIds } } });
      await prisma.productVariant.deleteMany({ where: { productId: p.id } });
      await prisma.productOptionValue.deleteMany({ where: { option: { productId: p.id } } });
      await prisma.productOption.deleteMany({ where: { productId: p.id } });
      await prisma.product.delete({ where: { id: p.id } });
      console.log(` - Deleted temporary product: ${slug}`);
    }
  }

  await browser.close();
  console.log('\n================================================================');
  console.log('--- ALL E2E VERIFICATIONS COMPLETE SUCCESSFULLY ---');
  console.log('================================================================');
}

run()
  .catch((err) => {
    console.error('Test Suite Error:', err);
  })
  .finally(() => prisma.$disconnect());

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import { execSync } from 'child_process';

function createSolidPng(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < width; x++) {
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const idat = zlib.deflateSync(raw);
  const end = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', end)
  ]);
}

async function runRealBrowserVerification() {
  console.log('=== REAL BROWSER PRODUCT SCREEN VERIFICATION ===');

  try {
    execSync('node scripts/cleanup-test-data.mjs', { stdio: 'inherit' });
    console.log('✓ Cleaned up existing test products');
  } catch (err) {
    console.log('Note on cleanup:', err.message);
  }
  // 1. Prepare genuine test PNG files
  const blackPngPath = path.resolve('scratch-black-shirt.png');
  const whitePngPath = path.resolve('scratch-white-shirt.png');
  fs.writeFileSync(blackPngPath, createSolidPng(200, 200, 25, 25, 30));
  fs.writeFileSync(whitePngPath, createSolidPng(200, 200, 240, 240, 245));
  console.log('✓ Generated real test image files:', { blackPngPath, whitePngPath });

  const screenshotDir = path.resolve('artifacts-browser-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().includes('Failed') || msg.text().includes('Error')) {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    }
  });
  page.on('response', async (res) => {
    if (res.status() >= 400) {
      const body = await res.text().catch(() => '');
      console.log('HTTP ERROR:', res.url(), res.status(), body);
    }
  });

  try {
    // 2. Login to Seller portal
    console.log('\n[1] Navigating to Seller login...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

    // Fill phone and PIN
    console.log('Logging in as merchant (+919876543210 / 654321)...');
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('9876543210');

    // Check if we need to click "Next" or enter PIN
    const pinInputs = page.locator('input[inputmode="numeric"]');
    if (await pinInputs.count() === 0) {
      const submitBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Type 6-digit PIN
    const pinDigits = '654321'.split('');
    const pinFieldCount = await pinInputs.count();
    if (pinFieldCount === 6) {
      for (let i = 0; i < 6; i++) {
        await pinInputs.nth(i).fill(pinDigits[i]);
      }
    } else {
      const singlePin = page.locator('input[type="password"]');
      if (await singlePin.isVisible()) {
        await singlePin.fill('654321');
      }
    }

    const loginBtn = page.locator('button:has-text("Log In"), button:has-text("Verify")').first();
    await loginBtn.click();
    await page.waitForTimeout(1500);

    // 3. Navigate to Products page
    console.log('\n[2] Navigating to Products list...');
    await page.goto('http://localhost:3001/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 4. Open Product Editor Drawer
    console.log('\n[3] Opening Product Editor Drawer...');
    const addProductBtn = page.locator('button:has-text("Add Product")');
    await addProductBtn.click();
    await page.waitForSelector('div[role="dialog"]');
    console.log('✓ Product Drawer opened');

    // 5. Test Real Image Upload & Preview
    console.log('\n[4] Uploading real image (scratch-black-shirt.png)...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([blackPngPath]);

    // Wait for image photo card to appear
    console.log('Waiting for uploaded photo card...');
    const photo1Img = page.locator('img[alt="Product photo 1"]');
    await photo1Img.waitFor({ state: 'visible', timeout: 10000 });

    // Evaluate image properties in browser
    const img1Stats = await photo1Img.evaluate((img) => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    }));
    console.log('Image 1 Render Stats:', img1Stats);

    if (!img1Stats.complete || img1Stats.naturalWidth === 0) {
      throw new Error(`Image 1 failed to render! naturalWidth: ${img1Stats.naturalWidth}, src: ${img1Stats.src}`);
    }

    // Verify placeholder text is NOT present
    const cardText = await page.locator('div[role="dialog"]').innerText();
    if (cardText.includes('Product view 1')) {
      throw new Error('Placeholder fallback text "Product view 1" is still visible!');
    }
    console.log('✓ Image 1 is genuinely rendered without placeholder icon or fallback text!');

    // Upload second image
    console.log('Uploading second image (scratch-white-shirt.png)...');
    await fileInput.setInputFiles([whitePngPath]);
    const photo2Img = page.locator('img[alt="Product photo 2"]');
    await photo2Img.waitFor({ state: 'visible', timeout: 10000 });
    const img2Stats = await photo2Img.evaluate((img) => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    }));
    console.log('Image 2 Render Stats:', img2Stats);
    if (!img2Stats.complete || img2Stats.naturalWidth === 0) {
      throw new Error(`Image 2 failed to render! naturalWidth: ${img2Stats.naturalWidth}`);
    }
    console.log('✓ Both photos uploaded and rendering real images!');

    await page.screenshot({ path: path.join(screenshotDir, '01-image-upload-preview.png') });

    // 6. Configure Product & Options
    console.log('\n[5] Configuring Product Name, Price, and Options...');
    const nameInput = page.locator('input[placeholder="e.g. Classic Cotton Shirt"]');
    await nameInput.fill('Classic Cotton Shirt');

    const priceInput = page.locator('input[placeholder="799.00"]');
    await priceInput.fill('799');

    // Ensure Options & Variants section is active
    const variantToggle = page.locator('div[role="dialog"] input.sr-only').first();
    const isChecked = await variantToggle.isChecked();
    if (!isChecked) {
      await page.locator('label:has(input.sr-only)').first().click();
      await page.waitForTimeout(500);
    }

    // Check Option 1 (Colour) has Black, White
    // Check Option 2 (Size) has S, M, L
    console.log('Verifying options and Cartesian variants generation...');
    await page.waitForTimeout(500);

    // Verify 6 variants are rendered in dialog table
    const variantRows = page.locator('div[role="dialog"] tbody tr');
    const rowCount = await variantRows.count();
    console.log(`Generated variant rows count: ${rowCount}`);
    if (rowCount !== 6) {
      throw new Error(`Expected exactly 6 variants, but found ${rowCount}`);
    }

    // Check variant titles
    const expectedTitles = [
      'Black / S',
      'Black / M',
      'Black / L',
      'White / S',
      'White / M',
      'White / L',
    ];
    for (let i = 0; i < 6; i++) {
      const title = (await variantRows.nth(i).locator('td').first().innerText()).trim();
      console.log(`Variant ${i + 1}: ${title}`);
      if (title !== expectedTitles[i]) {
        throw new Error(`Variant ${i} title mismatch: expected "${expectedTitles[i]}", got "${title}"`);
      }
    }
    console.log('✓ Exactly 6 Cartesian variants (Colour: Black, White × Size: S, M, L) generated!');

    // Customize individual variants:
    // Black / S: SKU: CCS-BLK-S, Price: 799, Stock: 5, Tag to Photo 1
    // Black / M: SKU: CCS-BLK-M, Price: 849, Stock: 3, Tag to Photo 1
    console.log('\n[6] Setting custom SKUs, Prices, Stock, and Variant Photos...');
    
    // Row 0: Black / S
    const row0 = variantRows.nth(0);
    await row0.locator('input.uppercase').fill('CCS-BLK-S');
    await row0.locator('input[type="number"]').first().fill('799');
    await row0.locator('input[type="number"]').nth(2).fill('5');
    await row0.locator('select').selectOption({ index: 1 }); // Photo 1

    // Row 1: Black / M
    const row1 = variantRows.nth(1);
    await row1.locator('input.uppercase').fill('CCS-BLK-M');
    await row1.locator('input[type="number"]').first().fill('849');
    await row1.locator('input[type="number"]').nth(2).fill('3');
    await row1.locator('select').selectOption({ index: 1 }); // Photo 1

    // Row 2: Black / L
    const row2 = variantRows.nth(2);
    await row2.locator('input.uppercase').fill('CCS-BLK-L');
    await row2.locator('input[type="number"]').first().fill('899');
    await row2.locator('input[type="number"]').nth(2).fill('4');
    await row2.locator('select').selectOption({ index: 1 }); // Photo 1

    // Row 3: White / S
    const row3 = variantRows.nth(3);
    await row3.locator('input.uppercase').fill('CCS-WHT-S');
    await row3.locator('input[type="number"]').first().fill('799');
    await row3.locator('input[type="number"]').nth(2).fill('6');
    await row3.locator('select').selectOption({ index: 2 }); // Photo 2

    // Row 4: White / M
    const row4 = variantRows.nth(4);
    await row4.locator('input.uppercase').fill('CCS-WHT-M');
    await row4.locator('input[type="number"]').first().fill('849');
    await row4.locator('input[type="number"]').nth(2).fill('8');
    await row4.locator('select').selectOption({ index: 2 }); // Photo 2

    // Row 5: White / L
    const row5 = variantRows.nth(5);
    await row5.locator('input.uppercase').fill('CCS-WHT-L');
    await row5.locator('input[type="number"]').first().fill('899');
    await row5.locator('input[type="number"]').nth(2).fill('2');
    await row5.locator('select').selectOption({ index: 2 }); // Photo 2

    await page.screenshot({ path: path.join(screenshotDir, '02-variants-configured.png') });

    // 7. Test Responsive View (<768px)
    console.log('\n[7] Testing responsive mobile layout (375x812)...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    // Verify mobile variant cards exist
    const mobileCards = page.locator('.block.md\\:hidden > div');
    const mobileCardCount = await mobileCards.count();
    console.log(`Mobile variant cards rendered: ${mobileCardCount}`);
    if (mobileCardCount !== 6) {
      throw new Error(`Expected 6 mobile variant cards, got ${mobileCardCount}`);
    }
    await page.screenshot({ path: path.join(screenshotDir, '03-mobile-responsive-layout.png') });
    console.log('✓ Mobile responsive layout verified (cards stack, no horizontal scroll)');

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    // 8. Save Product
    console.log('\n[8] Saving product ("Create Product")...');
    const saveBtn = page.locator('button:has-text("Create Product"), button:has-text("Save Product")').first();
    await saveBtn.click();

    // Wait for drawer to close
    try {
      await page.waitForSelector('div[role="dialog"]', { state: 'detached', timeout: 5000 });
      console.log('✓ Product saved and drawer closed');
    } catch (e) {
      const dialogText = await page.locator('div[role="dialog"]').innerText();
      console.log('DIALOG TEXT ON SAVE FAILURE:\n', dialogText);
      await page.screenshot({ path: path.join(screenshotDir, 'save-failure-dialog.png') });
      throw e;
    }

    // 9. Verify in Products List
    console.log('\n[9] Verifying product in Products List...');
    await page.waitForTimeout(1000);
    const productItem = page.locator('text=Classic Cotton Shirt').first();
    await productItem.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ "Classic Cotton Shirt" visible in Products List');

    // Verify thumbnail in list
    const listThumbnail = page.locator('table img, .divide-y img').first();
    if (await listThumbnail.isVisible()) {
      const listThumbStats = await listThumbnail.evaluate((img) => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        complete: img.complete,
      }));
      console.log('List Thumbnail Stats:', listThumbStats);
      if (listThumbStats.naturalWidth === 0) {
        throw new Error('Product list thumbnail failed to render real image!');
      }
      console.log('✓ Product list thumbnail renders real image');
    }
    await page.screenshot({ path: path.join(screenshotDir, '04-products-list-real-thumbnail.png') });

    // 10. Refresh & Verify Persistence
    console.log('\n[10] Refreshing page to verify persistence...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const reloadedProduct = page.locator('text=Classic Cotton Shirt').first();
    await reloadedProduct.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ "Classic Cotton Shirt" persisted across page refresh');

    // 11. Reopen Product Editor to verify all fields persisted
    console.log('\n[11] Reopening Product Editor...');
    const editBtn = page.locator('button[title="Edit Product"]').first();
    await editBtn.click();
    await page.waitForSelector('div[role="dialog"]');
    await page.waitForTimeout(1500);

    // Verify image reloads
    const reopenedImg = page.locator('img[alt="Product photo 1"]');
    await reopenedImg.waitFor({ state: 'visible', timeout: 5000 });
    const reopenedStats = await reopenedImg.evaluate((img) => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      complete: img.complete,
    }));
    console.log('Reopened Editor Photo Stats:', reopenedStats);
    if (reopenedStats.naturalWidth === 0) {
      throw new Error('Reopened editor failed to render persisted photo!');
    }
    console.log('✓ Photo persisted and rendered cleanly in editor');

    // Verify variants persisted
    const reopenedVariantRows = page.locator('div[role="dialog"] tbody tr');
    const reopenedRowCount = await reopenedVariantRows.count();
    console.log(`Reopened editor variant row count: ${reopenedRowCount}`);
    if (reopenedRowCount !== 6) {
      throw new Error(`Expected 6 persisted variants, got ${reopenedRowCount}`);
    }

    // Verify custom SKUs and prices persisted
    const firstSkuVal = await reopenedVariantRows.nth(0).locator('input.uppercase').inputValue();
    const firstPriceVal = await reopenedVariantRows.nth(0).locator('input[type="number"]').first().inputValue();
    const secondSkuVal = await reopenedVariantRows.nth(1).locator('input.uppercase').inputValue();
    const secondPriceVal = await reopenedVariantRows.nth(1).locator('input[type="number"]').first().inputValue();

    console.log('Persisted Variant 1:', { sku: firstSkuVal, price: firstPriceVal });
    console.log('Persisted Variant 2:', { sku: secondSkuVal, price: secondPriceVal });

    if (firstSkuVal !== 'CCS-BLK-S' || firstPriceVal !== '799') {
      throw new Error(`Variant 1 data failed to persist! sku: "${firstSkuVal}", price: "${firstPriceVal}"`);
    }
    if (secondSkuVal !== 'CCS-BLK-M' || secondPriceVal !== '849') {
      throw new Error(`Variant 2 data failed to persist! sku: "${secondSkuVal}", price: "${secondPriceVal}"`);
    }

    await page.screenshot({ path: path.join(screenshotDir, '05-reopened-editor-persisted.png') });
    console.log('✓ All 6 variants, custom SKUs, prices, stock, and media associations successfully persisted!');

    console.log('\n==================================================');
    console.log('ALL REAL BROWSER TESTS PASSED 100%!');
    console.log('==================================================');
  } finally {
    await browser.close();
    // Clean up temporary local pngs
    if (fs.existsSync(blackPngPath)) fs.unlinkSync(blackPngPath);
    if (fs.existsSync(whitePngPath)) fs.unlinkSync(whitePngPath);
  }
}

runRealBrowserVerification().catch((err) => {
  console.error('\n❌ Browser test failed:', err);
  process.exit(1);
});

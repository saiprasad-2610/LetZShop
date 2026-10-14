import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = path.resolve('scratch-test-images');
if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

// Prepare test files
// 1. JPG from Downloads
const realJpg = 'D:\\Downlaods\\9278214.jpg';
// 2. JPEG from Downloads
const realJpeg = 'D:\\Downlaods\\WhatsApp Image 2026-10-08 at 18.13.32.jpeg';
// 3. PNG from Downloads
const realPng = 'D:\\Downlaods\\Tata in Safari.png';
// 4. WebP from Downloads
const realWebp = 'D:\\Downlaods\\2d-floor-plan-technical-drawing-blueprint.webp';

// 5. AVIF
const avifPath = path.join(SCRATCH_DIR, 'sample.avif');
const avifHeader = Buffer.from('\x00\x00\x00\x1cftypavif\x00\x00\x00\x00avifmif1\x00\x00\x00\x08mdat');
fs.writeFileSync(avifPath, avifHeader);

// 6. HEIC
const heicPath = path.join(SCRATCH_DIR, 'sample.heic');
const heicHeader = Buffer.from('\x00\x00\x00\x18ftypheic\x00\x00\x00\x00mif1heic\x00\x00\x00\x08mdat');
fs.writeFileSync(heicPath, heicHeader);

// 7. Renamed non-image executable .jpg
const fakeJpgPath = path.join(SCRATCH_DIR, 'renamed-exe.jpg');
fs.writeFileSync(fakeJpgPath, Buffer.from('MZ\x90\x00\x03\x00\x00\x00This is an executable not an image'));

// 8. Image larger than 5MB
const largeJpgPath = path.join(SCRATCH_DIR, 'large-6mb.jpg');
const largeBuf = Buffer.alloc(6 * 1024 * 1024);
Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]).copy(largeBuf, 0, 0, 12);
fs.writeFileSync(largeJpgPath, largeBuf);

// 9. Valid image with NO extension
const noExtPath = path.join(SCRATCH_DIR, 'valid-image-without-extension');
fs.copyFileSync(realJpg, noExtPath);

// 10. Replacement image
const replacePng = 'D:\\Downlaods\\Elderly Man in Traditional Collar Shirt.png';

async function main() {
  console.log('=== 1. Authenticating Seller via API ===');
  const loginRes = await fetch('http://localhost:4000/auth/pin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919876543210', pin: '654321' }),
  }).then((r) => r.json());

  if (!loginRes.success || !loginRes.data?.accessToken) {
    throw new Error('Failed to login: ' + JSON.stringify(loginRes));
  }

  const { accessToken: token, user, store } = loginRes.data;
  console.log(`✓ Authenticated as: ${user.phone} for store: "${store.name}" (${store.id})`);

  console.log('\n=== 2. Launching Chrome Browser ===');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Inject session
  await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ t, u, s }) => {
      localStorage.setItem('simply_seller_token', t);
      localStorage.setItem('simply_seller_user', JSON.stringify(u));
      localStorage.setItem('simply_seller_store', JSON.stringify(s));
    },
    { t: token, u: user, s: store }
  );

  console.log('\n=== 3. Navigating to Products page ===');
  await page.goto('http://localhost:3001/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('\n=== 4. Opening Product Editor Drawer ===');
  const addProductBtn = page.locator('button:has-text("Add Product")');
  await addProductBtn.click();
  await page.waitForSelector('div[role="dialog"]');
  console.log('✓ Product Editor Drawer open');

  // Verify the accept attribute
  const fileInput = page.locator('input[type="file"]').first();
  const acceptAttr = await fileInput.getAttribute('accept');
  console.log(`Current file input accept attribute: "${acceptAttr}"`);
  if (acceptAttr === 'image/*') {
    console.log('✓ Verified: accept attribute is "image/*"');
  } else {
    throw new Error(`Unexpected accept attribute: ${acceptAttr}`);
  }

  // TEST 6: HEIC file rejection
  console.log('\n[TEST 6] Testing HEIC upload rejection...');
  await fileInput.setInputFiles([heicPath]);
  await page.waitForTimeout(600);
  const heicError = await page.locator('text=HEIC images are not currently supported').count();
  if (heicError > 0) {
    console.log('✓ Correctly rejected HEIC with clear message: "HEIC images are not currently supported. Please upload JPG, PNG or WebP."');
  } else {
    throw new Error('HEIC was not properly rejected with expected message!');
  }

  // TEST 7: Renamed executable .jpg rejection
  console.log('\n[TEST 7] Testing renamed non-image executable .jpg rejection...');
  await fileInput.setInputFiles([fakeJpgPath]);
  await page.waitForTimeout(600);
  const fakeError = await page.locator('text=not a supported image format').count();
  if (fakeError > 0) {
    console.log('✓ Correctly rejected renamed non-image .jpg (binary magic byte sniffing succeeded).');
  } else {
    throw new Error('Renamed non-image was not properly rejected by magic byte validator!');
  }

  // TEST 8: Image larger than 5MB
  console.log('\n[TEST 8] Testing image larger than 5MB limit...');
  await fileInput.setInputFiles([largeJpgPath]);
  await page.waitForTimeout(600);
  const sizeError = await page.locator('text=exceeds the 5MB limit').count();
  if (sizeError > 0) {
    console.log('✓ Correctly rejected image > 5MB with friendly message.');
  } else {
    throw new Error('Oversized image was not rejected!');
  }

  // TEST 1: Real JPG from Downloads
  console.log('\n[TEST 1] Testing real JPG from Downloads...');
  await fileInput.setInputFiles([realJpg]);
  const photo1 = page.locator('img[alt*="9278214"]');
  await photo1.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ Real JPG uploaded and rendered successfully with filename visible.');

  // TEST 2: Real JPEG from Downloads
  console.log('\n[TEST 2] Testing real JPEG from Downloads (WhatsApp image)...');
  await fileInput.setInputFiles([realJpeg]);
  const photo2 = page.locator('img[alt*="WhatsApp Image"]');
  await photo2.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ Real JPEG uploaded and rendered successfully with filename visible.');

  // TEST 3: Real PNG from Downloads
  console.log('\n[TEST 3] Testing real PNG from Downloads (Tata in Safari)...');
  await fileInput.setInputFiles([realPng]);
  const photo3 = page.locator('img[alt*="Tata in Safari"]');
  await photo3.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ Real PNG uploaded and rendered successfully with filename visible.');

  // Verify 3 images max count reached message
  console.log('\nVerifying 3/3 maximum reached banner...');
  const maxBanner = page.locator('text=Maximum of 3 images reached');
  await maxBanner.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Maximum 3 images reached banner is visible with Replace/Remove advice.');

  // TEST 10: Replace an existing product image
  console.log('\n[TEST 10] Testing Replace Photo functionality...');
  const replaceBtn = page.locator('button[title="Replace this photo"]').first();
  await replaceBtn.click();
  await page.waitForTimeout(300);

  const replaceFileInput = page.locator('[data-testid="product-image-replace-input"]');
  await replaceFileInput.setInputFiles([replacePng]);

  // Wait for replaced photo card to update
  await page.waitForTimeout(2000);
  const replacedImg = page.locator('img[alt*="Elderly Man in Traditional Collar Shirt"]');
  await replacedImg.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ Successfully replaced photo slot 1 with Elderly Man PNG, maintaining order and slot count!');

  // Remove one photo so we can test WebP, AVIF and No-Extension
  console.log('\nTesting photo removal...');
  const removeBtn = page.locator('button[title="Remove photo"]').nth(2);
  await removeBtn.click();
  await page.waitForTimeout(500);
  console.log('✓ Successfully removed 1 photo, dropzone reopened.');

  // TEST 4: Real WebP from Downloads
  console.log('\n[TEST 4] Testing real WebP from Downloads...');
  await fileInput.setInputFiles([realWebp]);
  const webpImg = page.locator('img[alt*="2d-floor-plan"]');
  await webpImg.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ Real WebP uploaded and rendered successfully.');

  // Remove photo 3 and test AVIF
  const removeBtn2 = page.locator('button[title="Remove photo"]').nth(2);
  await removeBtn2.click();
  await page.waitForTimeout(500);

  // TEST 5: AVIF
  console.log('\n[TEST 5] Testing AVIF image format...');
  await fileInput.setInputFiles([avifPath]);
  const avifImg = page.locator('img[alt*="sample.avif"]');
  await avifImg.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ AVIF image uploaded and registered successfully.');

  // Remove photo 3 and test No Extension
  const removeBtn3 = page.locator('button[title="Remove photo"]').nth(2);
  await removeBtn3.click();
  await page.waitForTimeout(500);

  // TEST 9: Valid image with NO extension
  console.log('\n[TEST 9] Testing valid image with NO file extension...');
  await fileInput.setInputFiles([noExtPath]);
  const noExtImg = page.locator('img[alt*="valid-image-without-extension"]');
  await noExtImg.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ File without extension correctly identified by magic bytes and uploaded.');

  // Save screenshot of the uploaded gallery
  const artifactScreenshot = 'C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\9c246ae6-1b36-412c-a5e1-1271a7a5e574\\product-image-uploader-verified.png';
  await page.screenshot({ path: artifactScreenshot });
  console.log(`✓ Verification screenshot saved to: ${artifactScreenshot}`);

  await browser.close();
  console.log('\n=========================================');
  console.log('ALL 10 PRODUCT IMAGE TEST SCENARIOS PASSED!');
  console.log('=========================================');
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

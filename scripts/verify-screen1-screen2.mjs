import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const artifactDir = 'C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\a08ebfcf-2278-402a-bfb2-1ef61324844f';
const outDir = path.join(artifactDir, 'verification_s1_s2');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Copy references for easy side-by-side inspection
const ref1 = path.join(artifactDir, '.user_uploaded', 'media_1792494246480.jpg');
const ref2 = path.join(artifactDir, '.user_uploaded', 'media_1792494254209.jpg');
if (fs.existsSync(ref1)) fs.copyFileSync(ref1, path.join(outDir, 'reference_screen1.png'));
if (fs.existsSync(ref2)) fs.copyFileSync(ref2, path.join(outDir, 'reference_screen2.png'));

async function verify() {
  console.log('Launching browser with:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. DESKTOP 1440 x 900
  console.log('\n=== Verifying 1440 x 900 Desktop ===');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // Capture Screen 1 Viewport
  console.log('Capturing Screen 1 at 1440x900...');
  await page.screenshot({ path: path.join(outDir, 'actual_screen1.png') });
  await page.screenshot({ path: path.join(artifactDir, 'actual_screen1.png') });

  // Capture Screen 2 Viewport
  console.log('Scrolling to Screen 2 at 1440x900...');
  const s2 = await page.$('#merchant-problem');
  if (s2) {
    await s2.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'actual_screen2.png') });
    await page.screenshot({ path: path.join(artifactDir, 'actual_screen2.png') });
  }

  // Check Overflow
  const desktopOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('Desktop 1440 overflow detected:', desktopOverflow);

  // CTA verification
  const createStoreHref = await page.evaluate(() => {
    const el = document.querySelector('header a[href*="mode=register"]');
    return el ? el.getAttribute('href') : null;
  });
  const merchantLoginHref = await page.evaluate(() => {
    const el = document.querySelector('header a[href*="login"]:not([href*="mode=register"])');
    return el ? el.getAttribute('href') : null;
  });
  console.log('Navbar Create Store CTA href:', createStoreHref);
  console.log('Navbar Merchant Login CTA href:', merchantLoginHref);

  // Marathi Switch Test
  console.log('\n=== Testing Marathi switch ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  const marathiButtons = await page.$$('header button');
  for (const btn of marathiButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('मराठी')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }

  const marathiH1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || '');
  console.log('Marathi H1:', marathiH1);
  await page.screenshot({ path: path.join(outDir, 'marathi_screen1.png') });

  // Switch back to English
  const enButtons = await page.$$('header button');
  for (const btn of enButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('EN') || text.includes('English')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }

  // 2. TABLET 768 x 1024
  console.log('\n=== Verifying 768 x 1024 Tablet ===');
  await page.setViewport({ width: 768, height: 1024 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(outDir, 'tablet_screen1.png') });
  await page.screenshot({ path: path.join(artifactDir, 'tablet_screen1.png') });

  if (s2) {
    await s2.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'tablet_screen2.png') });
    await page.screenshot({ path: path.join(artifactDir, 'tablet_screen2.png') });
  }

  const tabletOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('Tablet 768 overflow detected:', tabletOverflow);

  // 3. MOBILE 390 x 844
  console.log('\n=== Verifying 390 x 844 Mobile ===');
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(outDir, 'mobile_screen1.png') });
  await page.screenshot({ path: path.join(artifactDir, 'mobile_screen1.png') });

  if (s2) {
    await s2.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'mobile_screen2.png') });
    await page.screenshot({ path: path.join(artifactDir, 'mobile_screen2.png') });
  }

  const mobileOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('Mobile 390 overflow detected:', mobileOverflow);

  console.log('\nConsole errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  await browser.close();
  console.log('Verification run finished successfully!');
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});

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
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 600));

  // Check 1: Screen 1 Viewport Capture
  console.log('Capturing Screen 1 at 1440x900...');
  await page.screenshot({ path: path.join(outDir, 'screen1_1440x900.png') });
  await page.screenshot({ path: path.join(artifactDir, 'screen1_1440x900.png') });

  // Check 2: Screen 2 Viewport Capture
  console.log('Scrolling to Screen 2 at 1440x900...');
  const s2 = await page.$('#merchant-problem');
  if (s2) {
    await s2.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'screen2_1440x900.png') });
    await page.screenshot({ path: path.join(artifactDir, 'screen2_1440x900.png') });
  }

  // Check 3: Desktop Horizontal Overflow
  const desktopOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('Desktop 1440 overflow detected:', desktopOverflow);

  // Check 4: CTA Routes
  const createStoreHref = await page.evaluate(() => {
    const el = document.querySelector('header a[href*="mode=register"]');
    return el ? el.getAttribute('href') : null;
  });
  const merchantLoginHref = await page.evaluate(() => {
    const el = document.querySelector('header a[href*="login"]:not([href*="mode=register"])');
    return el ? el.getAttribute('href') : null;
  });
  const heroCreateStoreHref = await page.evaluate(() => {
    const el = document.querySelector('#hero a[href*="mode=register"]');
    return el ? el.getAttribute('href') : null;
  });
  const heroMerchantLoginHref = await page.evaluate(() => {
    const el = document.querySelector('#hero a[href*="login"]:not([href*="mode=register"])');
    return el ? el.getAttribute('href') : null;
  });
  console.log('Navbar Create Store CTA href:', createStoreHref);
  console.log('Navbar Merchant Login CTA href:', merchantLoginHref);
  console.log('Hero Create Store CTA href:', heroCreateStoreHref);
  console.log('Hero Merchant Login CTA href:', heroMerchantLoginHref);

  // Check 5: Nav Anchors
  const navLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('header nav a')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    }));
  });
  console.log('Navbar links:', JSON.stringify(navLinks, null, 2));

  // Check 6: Marathi Language Switch
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
  const marathiProblemH2 = await page.evaluate(() => document.querySelector('#merchant-problem h2')?.textContent?.trim() || '');
  console.log('Marathi H1:', marathiH1);
  console.log('Marathi Problem H2:', marathiProblemH2);

  await page.screenshot({ path: path.join(outDir, 'screen1_marathi_1440x900.png') });
  await page.screenshot({ path: path.join(artifactDir, 'screen1_marathi_1440x900.png') });

  const s2Marathi = await page.$('#merchant-problem');
  if (s2Marathi) {
    await s2Marathi.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'screen2_marathi_1440x900.png') });
    await page.screenshot({ path: path.join(artifactDir, 'screen2_marathi_1440x900.png') });
  }

  // Switch back to English
  console.log('Switching back to English...');
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

  console.log('Capturing Screen 1 at 768x1024...');
  await page.screenshot({ path: path.join(outDir, 'screen1_768x1024.png') });
  await page.screenshot({ path: path.join(artifactDir, 'screen1_768x1024.png') });

  console.log('Scrolling to Screen 2 at 768x1024...');
  const s2Tablet = await page.$('#merchant-problem');
  if (s2Tablet) {
    await s2Tablet.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'screen2_768x1024.png') });
    await page.screenshot({ path: path.join(artifactDir, 'screen2_768x1024.png') });
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

  console.log('Capturing Screen 1 at 390x844...');
  await page.screenshot({ path: path.join(outDir, 'screen1_390x844.png') });
  await page.screenshot({ path: path.join(artifactDir, 'screen1_390x844.png') });

  console.log('Scrolling to Screen 2 at 390x844...');
  const s2Mobile = await page.$('#merchant-problem');
  if (s2Mobile) {
    await s2Mobile.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'screen2_390x844.png') });
    await page.screenshot({ path: path.join(artifactDir, 'screen2_390x844.png') });
  }

  const mobileOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('Mobile 390 overflow detected:', mobileOverflow);

  // Check Screen 3 continuity
  const s3 = await page.$('#features');
  console.log('Screen 3 (#features) exists:', Boolean(s3));

  console.log('\nConsole errors logged during test:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  console.log('\n=== Verification Summary ===');
  console.log('Desktop Overflow:', desktopOverflow ? 'FAIL' : 'PASS');
  console.log('Tablet Overflow:', tabletOverflow ? 'FAIL' : 'PASS');
  console.log('Mobile Overflow:', mobileOverflow ? 'FAIL' : 'PASS');
  console.log('Console Errors:', consoleErrors.length === 0 ? 'PASS' : 'FAIL');
  console.log('All screenshots written to:', outDir);

  await browser.close();
}

verify().catch(err => {
  console.error('Verification script failed:', err);
  process.exit(1);
});

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const artifactDir = 'C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\a08ebfcf-2278-402a-bfb2-1ef61324844f';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. 1680x900 detailed captures
  await page.setViewport({ width: 1680, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // A. Complete Screen 1
  const heroEl = await page.$('#hero');
  if (heroEl) {
    await heroEl.screenshot({ path: path.join(artifactDir, '1680_complete_screen1.png') });
  }

  // B. Screen 1 / Screen 2 boundary
  // Scroll to show the boundary between hero and problem
  await page.evaluate(() => {
    const s2 = document.getElementById('merchant-problem');
    if (s2) {
      window.scrollTo({ top: s2.offsetTop - 350, behavior: 'instant' });
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(artifactDir, '1680_boundary_s1_s2.png') });

  // C. Complete Screen 2
  const problemEl = await page.$('#merchant-problem');
  if (problemEl) {
    await problemEl.screenshot({ path: path.join(artifactDir, '1680_complete_screen2.png') });
  }

  // D. Screen 2 / Screen 3 boundary
  await page.evaluate(() => {
    const s3 = document.getElementById('features');
    if (s3) {
      window.scrollTo({ top: s3.offsetTop - 350, behavior: 'instant' });
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(artifactDir, '1680_boundary_s2_s3.png') });

  // 2. Viewport full-view captures across requested sizes
  const otherVps = [
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1280x800', width: 1280, height: 800 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '768x1024', width: 768, height: 1024 },
    { name: '390x844', width: 390, height: 844 }
  ];

  for (const vp of otherVps) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));

    // Screen 1
    const s1 = await page.$('#hero');
    if (s1) {
      await s1.screenshot({ path: path.join(artifactDir, `${vp.name}_screen1.png`) });
    }

    // Screen 2
    const s2 = await page.$('#merchant-problem');
    if (s2) {
      await s2.screenshot({ path: path.join(artifactDir, `${vp.name}_screen2.png`) });
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

capture().catch(console.error);

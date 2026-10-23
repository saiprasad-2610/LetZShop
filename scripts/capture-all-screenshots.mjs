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

  // 1. 1680x945 capture (Product owner's target scale)
  await page.setViewport({ width: 1680, height: 945 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  const heroEl945 = await page.$('#hero');
  if (heroEl945) {
    await heroEl945.screenshot({ path: path.join(artifactDir, '1680x945_actual_hero.png') });
  }

  // 2. 1680x900 captures
  await page.setViewport({ width: 1680, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));
  const heroEl900 = await page.$('#hero');
  if (heroEl900) {
    await heroEl900.screenshot({ path: path.join(artifactDir, '1680_complete_screen1.png') });
  }

  // Screen 1 / Screen 2 boundary
  await page.evaluate(() => {
    const s2 = document.getElementById('merchant-problem');
    if (s2) window.scrollTo({ top: s2.offsetTop - 350, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(artifactDir, '1680_boundary_s1_s2.png') });

  // 3. 1440x900 capture
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));
  const heroEl1440 = await page.$('#hero');
  if (heroEl1440) {
    await heroEl1440.screenshot({ path: path.join(artifactDir, '1440x900_actual_hero.png') });
    await heroEl1440.screenshot({ path: path.join(artifactDir, '1440x900_screen1.png') });
  }

  // 4. Tablet 768x1024
  await page.setViewport({ width: 768, height: 1024 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));
  const heroElTablet = await page.$('#hero');
  if (heroElTablet) {
    await heroElTablet.screenshot({ path: path.join(artifactDir, '768x1024_screen1.png') });
  }

  // 5. Mobile 390x844
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));
  const heroElMobile = await page.$('#hero');
  if (heroElMobile) {
    await heroElMobile.screenshot({ path: path.join(artifactDir, '390x844_screen1.png') });
  }

  // 6. Side-by-Side Comparison Generator: Reference 1 vs Actual Rendered Hero
  const refPath = path.join(artifactDir, '.user_uploaded', 'media_1792512743426.jpg');
  const actualPath = path.join(artifactDir, '1680x945_actual_hero.png');

  if (fs.existsSync(refPath) && fs.existsSync(actualPath)) {
    const refData = 'data:image/jpeg;base64,' + fs.readFileSync(refPath).toString('base64');
    const actualData = 'data:image/png;base64,' + fs.readFileSync(actualPath).toString('base64');

    const compPage = await browser.newPage();
    await compPage.setViewport({ width: 1920, height: 1200 });
    const compHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 24px; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: white; }
          .title { text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .card { background: #1e293b; border-radius: 16px; padding: 16px; border: 1px solid #334155; }
          .header { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
          .tag-ref { background: #3b82f6; color: white; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 700; }
          .tag-act { background: #10b981; color: white; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 700; }
          img { width: 100%; height: auto; border-radius: 10px; display: block; border: 1px solid #475569; }
        </style>
      </head>
      <body>
        <div class="title">Visual Comparison: Approved Reference vs Actual DOM Implementation</div>
        <div class="grid">
          <div class="card">
            <div class="header">
              <span>TARGET DESIGN REFERENCE</span>
              <span class="tag-ref">Reference 1</span>
            </div>
            <img src="${refData}" />
          </div>
          <div class="card">
            <div class="header">
              <span>ACTUAL RUNTIME RENDER (1680x945)</span>
              <span class="tag-act">Live React/DOM</span>
            </div>
            <img src="${actualData}" />
          </div>
        </div>
      </body>
      </html>
    `;
    await compPage.setContent(compHtml);
    await new Promise(r => setTimeout(r, 800));
    await compPage.screenshot({ path: path.join(artifactDir, 'side_by_side_reference_vs_actual.png'), fullPage: true });
    await compPage.close();
  }

  await browser.close();
  console.log('All screenshots and comparison captured successfully.');
}

capture().catch(console.error);

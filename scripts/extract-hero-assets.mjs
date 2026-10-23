import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const srcImg = 'C:/Users/SOHAN/.gemini/antigravity-ide/brain/a08ebfcf-2278-402a-bfb2-1ef61324844f/.user_uploaded/media_1792513110194.png';
const outDir = 'd:/Simply - E Commerce/apps/storefront/public/images/hero';

async function locate() {
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.goto('file:///' + srcImg);

  // In 1024x576:
  // Banner with the cake is above the best sellers.
  // Best sellers has "Best Sellers View All ->" at around y: 405.
  // The banner is between y: 220 and y: 400!
  // Let's crop multiple candidate slices to see exactly where each element sits.
  const slices = await page.evaluate(() => {
    const img = document.querySelector('img');
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);

    function crop(x, y, w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const cCtx = c.getContext('2d');
      cCtx.drawImage(cv, x, y, w, h, 0, 0, w, h);
      return c.toDataURL('image/png');
    }

    // Precise product crops without heart icons (taking clean interior of product photos)
    return {
      bannerHero: crop(505, 236, 208, 160),
      // Clean product images inside each card:
      productCroissant: crop(268, 426, 80, 42),
      productCake: crop(378, 426, 80, 42),
      productBread: crop(488, 426, 80, 42),
      productCookies: crop(598, 426, 80, 42),

      // Chef hat logo icon
      logoHat: crop(286, 206, 22, 22),

      // Ambient plant on left
      ambientPlant: crop(60, 220, 180, 280),
      // Ambient coffee cup & latte art
      ambientCoffee: crop(105, 330, 150, 130),
      // Ambient cookies on right
      ambientCookies: crop(750, 400, 220, 150),
    };
  });

  for (const [key, dataUrl] of Object.entries(slices)) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const filename = `${key}.png`;
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(base64Data, 'base64'));
    console.log(`Saved ${filename}`);
  }

  await browser.close();
}

locate().catch(console.error);

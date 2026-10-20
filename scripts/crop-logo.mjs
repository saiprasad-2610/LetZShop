import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function crop() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();
  
  const rawPath = path.resolve('C:/Users/SOHAN/.gemini/antigravity-ide/brain/a08ebfcf-2278-402a-bfb2-1ef61324844f/.user_uploaded/media_1792496441047.jpg');
  const imgBase64 = fs.readFileSync(rawPath).toString('base64');

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background:white;">
        <canvas id="c"></canvas>
      </body>
    </html>
  `);

  const info = await page.evaluate(async (b64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const d = imgData.data;

        let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            const idx = (y * c.width + x) * 4;
            const r = d[idx], g = d[idx+1], b = d[idx+2];
            // Non-white pixel threshold
            if (r < 245 || g < 245 || b < 245) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Add 8px padding
        const pad = 12;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(c.width, maxX + pad);
        maxY = Math.min(c.height, maxY + pad);

        const cropW = maxX - minX;
        const cropH = maxY - minY;

        // Create cropped full logo canvas
        const cropC = document.createElement('canvas');
        cropC.width = cropW;
        cropC.height = cropH;
        const cropCtx = cropC.getContext('2d');
        cropCtx.drawImage(c, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

        // Also find bag icon boundary (left portion up to letter 'L')
        // In the image, bag ends around 33.5% of width
        const bagCropW = Math.round(cropW * 0.338);
        const iconC = document.createElement('canvas');
        iconC.width = bagCropW;
        iconC.height = cropH;
        const iconCtx = iconC.getContext('2d');
        iconCtx.drawImage(cropC, 0, 0, bagCropW, cropH, 0, 0, bagCropW, cropH);

        resolve({
          fullData: cropC.toDataURL('image/png'),
          iconData: iconC.toDataURL('image/png'),
          cropW,
          cropH,
          bagCropW
        });
      };
      img.src = 'data:image/jpeg;base64,' + b64;
    });
  }, imgBase64);

  // Write cropped files
  const fullBuf = Buffer.from(info.fullData.replace(/^data:image\/png;base64,/, ''), 'base64');
  const iconBuf = Buffer.from(info.iconData.replace(/^data:image\/png;base64,/, ''), 'base64');

  fs.writeFileSync('apps/storefront/public/images/letzshop-logo.png', fullBuf);
  fs.writeFileSync('apps/storefront/public/images/letzshop-icon.png', iconBuf);

  console.log('Cropped logo saved! Full:', info.cropW, 'x', info.cropH, 'Icon width:', info.bagCropW);
  await browser.close();
}

crop().catch(console.error);

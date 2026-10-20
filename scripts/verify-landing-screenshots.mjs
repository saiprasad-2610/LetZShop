import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const outDir = 'C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\a08ebfcf-2278-402a-bfb2-1ef61324844f\\screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('Launching browser with:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

  // 1. Screen 1 - Hero
  console.log('Capturing Screen 1 Hero...');
  const hero = await page.$('section#hero');
  if (hero) {
    await hero.screenshot({ path: path.join(outDir, 'screen1_hero.png') });
  } else {
    await page.screenshot({ path: path.join(outDir, 'screen1_hero.png') });
  }

  // 2. Screen 2 - Problem
  console.log('Capturing Screen 2 Problem...');
  const problem = await page.$('section#merchant-problem');
  if (problem) {
    await problem.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await problem.screenshot({ path: path.join(outDir, 'screen2_problem.png') });
  }

  // 3. Screen 3 - System
  console.log('Capturing Screen 3 System...');
  const system = await page.$('section#features');
  if (system) {
    await system.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await system.screenshot({ path: path.join(outDir, 'screen3_system.png') });
  }

  // 4. Screen 4 - Category Showcase (Fashion and Grocery)
  console.log('Capturing Screen 4 Category 1 (Fashion)...');
  const catSection = await page.$('section#categories');
  if (catSection) {
    await catSection.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await catSection.screenshot({ path: path.join(outDir, 'screen4_cat_fashion.png') });

    // Switch to Grocery
    console.log('Clicking Grocery category...');
    const catButtons = await page.$$('section#categories button');
    for (const btn of catButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Grocery') || text.includes('Daily Essentials')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 600));
        break;
      }
    }
    await catSection.screenshot({ path: path.join(outDir, 'screen4_cat_grocery.png') });
  }

  // 5. Screen 5 - Brand Studio Themes
  console.log('Capturing Screen 5 Theme 1 (Atelier)...');
  const themeSection = await page.$('section#themes');
  if (themeSection) {
    await themeSection.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await themeSection.screenshot({ path: path.join(outDir, 'screen5_theme_atelier.png') });

    // Switch to Feast theme
    console.log('Clicking Feast theme...');
    const themeButtons = await page.$$('section#themes button');
    for (const btn of themeButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Feast')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 600));
        break;
      }
    }
    await themeSection.screenshot({ path: path.join(outDir, 'screen5_theme_feast.png') });

    // Switch to Horizon theme
    console.log('Clicking Horizon theme...');
    for (const btn of themeButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Horizon')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 600));
        break;
      }
    }
    await themeSection.screenshot({ path: path.join(outDir, 'screen5_theme_horizon.png') });
  }

  // 6. Screen 6 - Customer Journey Carousel
  console.log('Capturing Screen 6 Journey Carousel Position 1...');
  const journeySection = await page.$('section#journey');
  if (journeySection) {
    await journeySection.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await journeySection.screenshot({ path: path.join(outDir, 'screen6_journey_pos1.png') });

    // Click next arrow on carousel
    console.log('Clicking Next Arrow on carousel...');
    const nextBtn = await page.$('section#journey button[aria-label="Next stage"]');
    if (nextBtn) {
      await nextBtn.click();
      await new Promise(r => setTimeout(r, 400));
      await nextBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }
    await journeySection.screenshot({ path: path.join(outDir, 'screen6_journey_pos2.png') });
  }

  // 7. Screen 7 - Pricing (₹999)
  console.log('Capturing Screen 7 Pricing...');
  const pricingSection = await page.$('section#pricing');
  if (pricingSection) {
    await pricingSection.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await pricingSection.screenshot({ path: path.join(outDir, 'screen7_pricing.png') });
  }

  // 8. Screen 8 - Steps, FAQ, Final CTA
  console.log('Capturing Screen 8 Steps...');
  const stepsSection = await page.$('section#how-it-works');
  if (stepsSection) {
    await stepsSection.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await stepsSection.screenshot({ path: path.join(outDir, 'screen8_steps.png') });
  }

  console.log('Capturing Screen 8 FAQ...');
  const faqSection = await page.$('section#faq');
  if (faqSection) {
    await faqSection.scrollIntoView();
    const faqButtons = await page.$$('section#faq button');
    if (faqButtons.length > 0) {
      await faqButtons[0].click();
      await new Promise(r => setTimeout(r, 300));
    }
    if (faqButtons.length > 1) {
      await faqButtons[1].click();
      await new Promise(r => setTimeout(r, 300));
    }
    await new Promise(r => setTimeout(r, 600));
    await faqSection.screenshot({ path: path.join(outDir, 'screen8_faq.png') });
  }

  console.log('Capturing Screen 8 Final CTA & Footer...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'screen8_cta_footer.png'), clip: { x: 0, y: 700, width: 1440, height: 900 } });

  // 9. Language Switcher Test: Switch to Marathi
  console.log('Testing Marathi switch...');
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

  // Verify Marathi strings
  const marathiHeroText = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
  console.log('Marathi Hero H1 text:', marathiHeroText);

  const marathiPricingText = await page.evaluate(() => document.querySelector('#pricing h2')?.textContent || '');
  console.log('Marathi Pricing H2 text:', marathiPricingText);

  const marathiFaqText = await page.evaluate(() => document.querySelector('#faq h2')?.textContent || '');
  console.log('Marathi FAQ H2 text:', marathiFaqText);

  await page.screenshot({ path: path.join(outDir, 'marathi_hero.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // Switch back to English
  console.log('Switching back to English...');
  const enButtons = await page.$$('header button');
  for (const btn of enButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('English')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }
  const enHeroText = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
  console.log('English restored Hero H1 text:', enHeroText);

  // 10. Responsive mobile test at 390x844
  console.log('Testing Mobile 390x844...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'mobile_390_hero.png') });

  // Check horizontal overflow on mobile
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('Mobile horizontal overflow check (expected false):', hasOverflow);

  // 11. Responsive tablet test at 768x1024
  console.log('Testing Tablet 768x1024...');
  await page.setViewport({ width: 768, height: 1024 });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'tablet_768_hero.png') });

  console.log('All screenshots and verifications completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});

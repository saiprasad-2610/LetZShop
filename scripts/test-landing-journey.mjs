import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createTranslator } from '../packages/i18n/dist/index.js';
const out = path.resolve('artifacts/journey-social');
fs.mkdirSync(out, { recursive: true });
const base = process.env.STOREFRONT_URL || 'http://localhost:3000';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  for (const [locale, label] of [
    ['en-IN', 'English'],
    ['mr-IN', 'मराठी'],
    ['hi-IN', 'हिंदी'],
  ]) {
    await page.setViewportSize({ width: 1680, height: 1050 });
    await page
      .getByRole('button', { name: label, exact: true })
      .first()
      .click();
    const t = createTranslator(locale);
    for (const [width, height] of [
      [1920, 1080],
      [1680, 1050],
      [1440, 900],
      [1280, 900],
      [768, 1024],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      const section = page.getByTestId('screen5-journey');
      await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(
        await section.locator('[data-step-number]').allTextContents(),
        ['01', '02', '03', '04', '05', '06', '07', '08'],
      );
      assert.equal(await section.locator('[data-journey-phone]').count(), 8);
      assert.equal(await page.locator('#journey').count(), 1);
      assert.equal(
        await section
          .getByRole('heading', {
            name: t('landing.customerJourney.title'),
            exact: true,
          })
          .count(),
        1,
      );
      const geometry = await section.evaluate((section) => {
        const phones = [...section.querySelectorAll('[data-journey-phone]')];
        const badPhones = phones
          .map((p, i) => ({
            index: i,
            body: p.children[2],
            bottom: p.lastElementChild.getBoundingClientRect().top,
          }))
          .filter(
            (p) =>
              p.body.getBoundingClientRect().bottom > p.bottom + 1 ||
              p.body.scrollHeight > p.body.clientHeight + 2,
          )
          .map((p) => ({
            index: p.index,
            scroll: p.body.scrollHeight,
            height: p.body.clientHeight,
          }));
        const badText = [...section.querySelectorAll('h2,h3,p')]
          .filter((e) => e.scrollWidth > e.clientWidth + 1)
          .map((e) => e.textContent);
        const longCopy =
          innerWidth >= 1536
            ? [
                ...section.querySelectorAll(
                  '[data-journey-step] > div:first-child p',
                ),
              ]
                .filter(
                  (e) =>
                    e.getBoundingClientRect().height >
                    parseFloat(getComputedStyle(e).lineHeight) * 2 + 1,
                )
                .map((e) => e.textContent)
            : [];
        const main = [...document.querySelector('main').children];
        const benefits = [
          ...section.querySelector('[data-testid="journey-benefits"]').children,
        ].map((e) => e.getBoundingClientRect().height);
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          badPhones,
          badText,
          longCopy,
          placement: main[4] === section && main[3].id === 'categories',
          widths: phones.map((p) => p.getBoundingClientRect().width),
          heights: phones.map((p) => p.getBoundingClientRect().height),
          benefits,
        };
      });
      assert.equal(
        geometry.overflow,
        false,
        locale + ' ' + width + ' document overflow',
      );
      assert.deepEqual(
        geometry.badText,
        [],
        locale + ' ' + width + ' clipped text',
      );
      assert.deepEqual(
        geometry.badPhones,
        [],
        locale + ' ' + width + ' phone content overflow',
      );
      assert.deepEqual(
        geometry.longCopy,
        [],
        locale + ' stage descriptions stay within two lines',
      );
      assert.equal(
        geometry.placement,
        true,
        'journey is Screen 5 immediately after Screen 4',
      );
      assert.ok(
        Math.max(...geometry.heights) - Math.min(...geometry.heights) < 1,
        'consistent phones',
      );
      assert.ok(
        Math.max(...geometry.benefits) - Math.min(...geometry.benefits) < 1,
        'equal-height benefits at every viewport',
      );
      const rail = page.getByTestId('journey-rail');
      await rail.evaluate((e) => (e.scrollLeft = 0));
      await section.screenshot({
        path: path.join(out, `screen5-${locale}-${width}.png`),
      });
      if (width === 390) {
        await rail.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(400);
        assert.ok(
          await rail.evaluate((e) => e.scrollLeft > 0),
          'native keyboard rail scrolling',
        );
        await rail.evaluate((e) => (e.scrollLeft = e.scrollWidth));
        await page.waitForTimeout(150);
        assert.ok(
          await section.locator('[data-journey-step="review"]').isVisible(),
        );
        await section.screenshot({
          path: path.join(out, `screen5-${locale}-390-end.png`),
        });
      }
      results.push({ locale, width, result: 'PASS' });
    }
    console.log(locale + ': journey at six viewport sizes passed.');
  }
  // Native mobile touch, using the actual CSS scroll container.
  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const p = await touch.newPage();
  await p.goto(base, { waitUntil: 'networkidle' });
  const rail = p.getByTestId('journey-rail');
  await rail.scrollIntoViewIfNeeded();
  const box = await rail.boundingBox();
  const cdp = await touch.newCDPSession(p);
  const y = Math.max(40, Math.min(750, box.y + 170));
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 330, y }],
  });
  for (let x = 310; x > 65; x -= 20) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y }],
    });
    await p.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await p.waitForTimeout(500);
  assert.ok(
    await rail.evaluate((e) => e.scrollLeft > 100),
    'native mobile swipe',
  );
  await touch.close();
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    path.join(out, 'journey-results.json'),
    JSON.stringify(
      { cases: results.length, results, nativeSwipe: 'PASS', errors },
      null,
      2,
    ),
  );
  console.log('Screen 5: 18 layout/language checks and native touch passed.');
} finally {
  await browser.close();
}

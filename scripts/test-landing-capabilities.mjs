import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const out = path.resolve('artifacts/catalog-theme-polish');
fs.mkdirSync(out, { recursive: true });
const baselinePath = path.join(out, 'screen3-frozen.json');
const capture = process.argv.includes('--capture');
const baseline = capture ? {} : JSON.parse(fs.readFileSync(baselinePath));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  for (const locale of ['en-IN', 'mr-IN', 'hi-IN']) {
    await page.getByRole('button', { name: locale === 'en-IN' ? 'English' : locale === 'mr-IN' ? 'मराठी' : 'हिंदी', exact: true }).first().click();
    for (const [width, height] of [[1920,1080], [1680,945], [1440,900], [390,844]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const frozen = await page.evaluate(() => {
        const result = {};
        for (const id of ['screen3-copy', 'system-scene', 'system-dashboard', 'card-products', 'card-orders', 'card-payments', 'card-customers', 'card-shipping', 'card-reviews']) {
          const e = document.querySelector('[data-testid="' + id + '"]');
          if (!e) continue;
          const r = e.getBoundingClientRect();
          result[id] = { x: r.x, y: r.y + scrollY, width: r.width, height: r.height, text: e.textContent };
        }
        result.paths = [...document.querySelectorAll('[data-connector]')].map(e => [e.getAttribute('data-connector'), e.getAttribute('d')]);
        return result;
      });
      const key = locale + '-' + width;
      if (capture) { baseline[key] = frozen; continue; }
      for (const [id, geometry] of Object.entries(frozen)) {
        if (id === 'paths') continue;
        assert.equal(geometry.text, baseline[key][id].text, key + ' ' + id + ' frozen text');
        if (!geometry.width && !geometry.height) continue;
        for (const dimension of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(geometry[dimension] - baseline[key][id][dimension]) < .01, key + ' ' + id + ' ' + dimension);
      }
      assert.equal(frozen.paths.length, baseline[key].paths.length);
      frozen.paths.forEach(([name, curve], index) => {
        assert.equal(name, baseline[key].paths[index][0]);
        const expected = baseline[key].paths[index][1].split(' ');
        curve.split(' ').forEach((token, i) => {
          if (Number.isFinite(Number(token))) assert.ok(Math.abs(Number(token) - Number(expected[i])) < .01, 'frozen connector coordinates');
          else assert.equal(token, expected[i]);
        });
      });
      const rail = page.getByTestId('capability-strip');
      const cards = await rail.evaluate(e => [...e.firstElementChild.children].map(card => {
        const rect = card.getBoundingClientRect();
        const [icon, title, description] = [card.firstElementChild, card.querySelector('h5'), card.querySelector('p')];
        return { top: rect.top, height: rect.height, icon: icon.getBoundingClientRect().top - rect.top,
          title: title.getBoundingClientRect().top - rect.top, description: description.getBoundingClientRect().top - rect.top,
          titleHeight: title.getBoundingClientRect().height, descriptionHeight: description.getBoundingClientRect().height,
          titleLineHeight: parseFloat(getComputedStyle(title).lineHeight), descriptionLineHeight: parseFloat(getComputedStyle(description).lineHeight),
          clipping: title.scrollWidth > title.clientWidth || description.scrollWidth > description.clientWidth };
      }));
      const rows = Map.groupBy(cards, c => Math.round(c.top));
      for (const row of rows.values()) {
        for (const field of ['height', 'icon', 'title', 'description']) assert.ok(Math.max(...row.map(c => c[field])) - Math.min(...row.map(c => c[field])) < 0.1, key + ' aligned ' + field);
      }
      for (const c of cards) {
        assert.equal(c.clipping, false, key + ' text fits');
        if (width >= 1440 && locale === 'en-IN') assert.ok(c.titleHeight <= c.titleLineHeight + .1, 'one-line title');
      }
      await rail.screenshot({ path: path.join(out, 'screen3-rail-' + key + '.png') });
      if (locale === 'en-IN') {
        await page.evaluate(() => scrollTo({ top: document.querySelector('[data-testid="capability-strip"]').getBoundingClientRect().bottom + scrollY - innerHeight + 25, behavior: 'instant' }));
        await page.screenshot({ path: path.join(out, 'screen3-' + width + '.png') });
      }
      results.push({ locale, width, height, alignment: 'PASS', frozenComposition: 'PASS', cards });
    }
  }
  fs.writeFileSync(capture ? baselinePath : path.join(out, 'screen3-results.json'), JSON.stringify(capture ? baseline : results, null, 2));
  console.log(capture ? 'Frozen composition captured.' : JSON.stringify({ cases: results.length, equalHeightsAndBaselines: 'PASS', frozenComposition: 'PASS' }));
} finally { await browser.close(); }

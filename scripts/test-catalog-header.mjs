import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/index.js';
import { FOUNDATIONAL_THEMES } from '../packages/ui/dist/index.js';
import { CATALOG_HEADER_LIMITS } from '../packages/types/dist/index.js';
import { createTranslator } from '../packages/i18n/dist/index.js';

// Use an explicitly selected LOCAL demo merchant. All changed rows are restored in finally.
assert.ok(process.env.CATALOG_TEST_PHONE && process.env.CATALOG_TEST_PIN, 'Set CATALOG_TEST_PHONE and CATALOG_TEST_PIN for a local demo merchant');
if (fs.existsSync('.env')) process.loadEnvFile('.env');
const api = 'http://localhost:4000';
const seller = 'http://localhost:3001';
const storefront = 'http://localhost:3000';
const out = path.resolve('artifacts/catalog-theme-polish');
fs.mkdirSync(out, { recursive: true });
const prisma = new PrismaClient();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let backup, storeId;
const results = [];
try {
  const login = await fetch(api + '/auth/pin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: process.env.CATALOG_TEST_PHONE, pin: process.env.CATALOG_TEST_PIN }) }).then(r => r.json());
  const auth = login.data;
  assert.ok(auth?.accessToken, 'local demo login');
  storeId = auth.store.id;
  backup = {
    configs: await prisma.storeThemeConfig.findMany({ where: { storeId } }),
    branding: await prisma.storeBranding.findUnique({ where: { storeId } }),
    sections: await prisma.storeSection.findMany({ where: { storeId } }),
  };
  const request = async (method, endpoint, body) => {
    const res = await fetch(api + endpoint, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.accessToken }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, body: await res.json() };
  };
  const original = (await request('GET', '/themes/config')).body.data;
  const context = await browser.newContext({ viewport: { width: 1680, height: 945 } });
  await context.addInitScript(auth => {
    localStorage.setItem('simply_seller_token', auth.accessToken);
    localStorage.setItem('simply_seller_user', JSON.stringify(auth.user));
    localStorage.setItem('simply_seller_store', JSON.stringify(auth.store));
  }, auth);
  const page = await context.newPage();
  const publicPage = await context.newPage();
  const keys = { badgeText: 'eyebrowBadgeTag', pageTitle: 'catalogPageTitle', pageSubtitle: 'catalogSubtitleDescription' };
  const patterns = { 'en-IN': 'Useful English words ', 'mr-IN': 'सुंदर मराठी मजकूर ', 'hi-IN': 'सुन्दर हिन्दी विवरण ' };
  const openEditor = async locale => {
    await page.goto(seller + '/brand-studio', { waitUntil: 'networkidle' });
    const t = createTranslator(locale);
    // Change only the browser preference/profile fixture, never the merchant's persisted language.
    await page.getByRole('button', { name: t('themes.productsTab'), exact: true }).click();
    await page.frameLocator('iframe').getByTestId('catalog-header').waitFor();
    return t;
  };
  for (const locale of Object.keys(patterns)) {
    await context.addInitScript(locale => {
      const user = JSON.parse(localStorage.getItem('simply_seller_user'));
      if (user) { user.preferredLocale = locale; localStorage.setItem('simply_seller_user', JSON.stringify(user)); }
      localStorage.setItem('letzshop_seller_preferred_locale', locale);
    }, locale);
    const t = await openEditor(locale);
    for (const [field, max] of Object.entries(CATALOG_HEADER_LIMITS)) {
      const input = page.getByLabel(t('brandStudio.' + keys[field]), { exact: true }).filter({ visible: true });
      assert.equal(await input.getAttribute('maxlength'), String(max));
      const counter = input.locator('..').locator('[data-catalog-counter]');
      for (const value of ['', 'Normal text', patterns[locale].repeat(max).slice(0, max - 1), patterns[locale].repeat(max).slice(0, max), 'x'.repeat(max + 100), 'word '.repeat(1900)]) {
        await input.fill(value);
        const capped = value.slice(0, max);
        assert.equal(await input.inputValue(), capped);
        assert.match(await counter.textContent(), new RegExp(capped.length + ' / ' + max));
        const preview = page.frameLocator('iframe').locator('[data-catalog-field="' + field + '"]');
        await preview.waitFor();
        await assertEventually(async () => assert.equal(await preview.textContent(), capped));
        assert.equal(await preview.count(), 1);
      }
      await input.fill('a'.repeat(max - 1));
      await input.press('End');
      await input.pressSequentially('bc');
      assert.equal((await input.inputValue()).length, max, 'typing max+1 blocked');
      const rejected = await request('PUT', '/themes/config', { themeCode: original.activeTheme.code, configJson: { pages: { products: { [field]: 'word '.repeat(1900) } } } });
      assert.equal(rejected.status, 400, 'direct oversized API request rejected');
      results.push({ locale, field, boundaryInput: 'PASS', api: 'PASS' });
    }
  }

  for (const theme of Object.keys(FOUNDATIONAL_THEMES)) {
    const products = { badgeText: 'Local makers', pageTitle: 'Thoughtfully made essentials', pageSubtitle: 'Browse our everyday collection. Quality products, useful details and something for every home.' };
    const configJson = { ...original.configJson, themeId: theme, pages: { ...original.configJson.pages, products } };
    assert.equal((await request('PUT', '/themes/config', { themeCode: theme, configJson })).status, 200);
    // The five requested themes exercise the real editor save, then public API and refresh.
    if (['aura', 'harvest', 'feast', 'horizon', 'canvas'].includes(theme)) {
      const t = await openEditor('hi-IN');
      for (const [field, value] of Object.entries(products)) await page.getByLabel(t('brandStudio.' + keys[field]), { exact: true }).filter({ visible: true }).fill(value);
      const saved = page.waitForResponse(r => r.url() === api + '/themes/config' && r.request().method() === 'PUT');
      await page.getByRole('button', { name: t('themes.saveChanges'), exact: true }).filter({ visible: true }).click();
      assert.equal((await saved).status(), 200);
      await page.waitForTimeout(600);
      const persisted = (await request('GET', '/themes/config')).body.data.configJson.pages.products;
      for (const [field, value] of Object.entries(products)) assert.equal(persisted[field], value);
    }
    for (const width of [1440, 390]) {
      await publicPage.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await publicPage.goto(storefront + '/store/' + auth.store.slug + '/products', { waitUntil: 'networkidle' });
      await publicPage.reload({ waitUntil: 'networkidle' });
      for (const [field, value] of Object.entries(products)) {
        const target = publicPage.locator('[data-catalog-field="' + field + '"]');
        assert.equal(await target.count(), 1);
        assert.equal(await target.textContent(), value);
      }
      assert.equal(await publicPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, theme + ' overflow');
      assert.ok(await publicPage.locator('main a[href*="/product/"]').count(), 'products preserved');
    }
    results.push({ theme, savedPublicRefresh: 'PASS', desktopMobile: 'PASS' });
  }

  // Seed just the selected merchant's legacy row, then verify actual API/editor/public safety.
  const active = await prisma.storeThemeConfig.findFirst({ where: { storeId }, orderBy: { updatedAt: 'desc' } });
  const legacy = { ...original.configJson, themeId: 'canvas', pages: { ...original.configJson.pages, products: { badgeText: 'b'.repeat(900), pageTitle: 't'.repeat(900), pageSubtitle: 'word '.repeat(1900), customSetting: 'preserve' } } };
  await prisma.storeThemeConfig.update({ where: { id: active.id }, data: { configJson: legacy } });
  const t = await openEditor('hi-IN');
  for (const [field, max] of Object.entries(CATALOG_HEADER_LIMITS)) {
    const input = page.getByLabel(t('brandStudio.' + keys[field]), { exact: true }).filter({ visible: true });
    assert.equal((await input.inputValue()).length, max);
  }
  await page.screenshot({ path: path.join(out, 'catalog-editor.png') });
  const saved = page.waitForResponse(r => r.url() === api + '/themes/config' && r.request().method() === 'PUT');
  await page.getByRole('button', { name: t('themes.saveChanges'), exact: true }).filter({ visible: true }).click();
  assert.equal((await saved).status(), 200);
  await page.waitForTimeout(600);
  const normalized = (await request('GET', '/themes/config')).body.data.configJson.pages.products;
  assert.equal(normalized.customSetting, 'preserve');
  for (const [field, max] of Object.entries(CATALOG_HEADER_LIMITS)) assert.equal(normalized[field].length, max);
  await publicPage.reload({ waitUntil: 'networkidle' });
  await publicPage.screenshot({ path: path.join(out, 'catalog-mobile.png') });
  fs.writeFileSync(path.join(out, 'catalog-results.json'), JSON.stringify({ results, legacy: 'PASS' }, null, 2));
  console.log(JSON.stringify({ fieldLanguageCases: 9, activeThemes: 12, realEditorSaves: 6, legacy: 'PASS', result: 'PASS' }));
} finally {
  await browser.close();
  if (backup) {
    await prisma.$transaction(async tx => {
      await tx.storeThemeConfig.deleteMany({ where: { storeId } });
      if (backup.configs.length) await tx.storeThemeConfig.createMany({ data: backup.configs });
      await tx.storeSection.deleteMany({ where: { storeId } });
      if (backup.sections.length) await tx.storeSection.createMany({ data: backup.sections });
      if (backup.branding) await tx.storeBranding.update({ where: { storeId }, data: backup.branding });
      else await tx.storeBranding.deleteMany({ where: { storeId } });
    });
    console.log('Original demo merchant configuration, branding and sections restored.');
  }
  await prisma.$disconnect();
}

async function assertEventually(check) {
  let error;
  for (let attempt = 0; attempt < 30; attempt++) {
    try { await check(); return; } catch (e) { error = e; await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  throw error;
}

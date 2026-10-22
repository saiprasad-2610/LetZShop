import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/index.js';
import {
  HOME_TEXT_LIMITS,
  ABOUT_TEXT_LIMITS,
  ABOUT_VALUE_LIMITS,
  BRAND_TEXT_LIMITS,
} from '../packages/types/dist/index.js';
import { FOUNDATIONAL_THEMES } from '../packages/ui/dist/index.js';
import { createTranslator } from '../packages/i18n/dist/index.js';

assert.ok(
  process.env.BRAND_TEST_PHONE && process.env.BRAND_TEST_PIN,
  'Set BRAND_TEST_PHONE and BRAND_TEST_PIN for a local demo merchant',
);
if (fs.existsSync('.env')) process.loadEnvFile('.env');
const out = path.resolve('artifacts/validation-hardening');
fs.mkdirSync(out, { recursive: true });
const api = 'http://localhost:4000',
  seller = 'http://localhost:3001',
  storefront = 'http://localhost:3000';
const fields = [
  { tab: 'home', key: 'announcement.text', max: BRAND_TEXT_LIMITS.subtitle },
  ...Object.entries(HOME_TEXT_LIMITS)
    .filter(([key]) => !['heroCtaLink', 'heroSecondaryCtaLink'].includes(key))
    .map(([key, max]) => ({ tab: 'home', key: 'pages.home.' + key, max })),
  ...Object.entries(ABOUT_TEXT_LIMITS)
    .filter(
      ([key]) => !['imageUrl', 'storyBadge', 'storyHeading'].includes(key),
    )
    .map(([key, max]) => ({ tab: 'about', key: 'pages.about.' + key, max })),
  ...[0, 1, 2].flatMap((index) =>
    Object.entries(ABOUT_VALUE_LIMITS).map(([key, max]) => ({
      tab: 'about',
      key: 'pages.about.values.' + index + '.' + key,
      max,
    })),
  ),
];
const set = (obj, key, value) => {
  const keys = key.split('.');
  let target = obj;
  keys.forEach((part, index) => {
    if (index === keys.length - 1) target[part] = value;
    else target = target[part] ||= /^\d+$/.test(keys[index + 1]) ? [] : {};
  });
};
const get = (obj, key) =>
  key.split('.').reduce((value, part) => value?.[part], obj);
const normal = (field, index, locale) =>
  field.key.endsWith('Url')
    ? storefront + '/images/landing/bakery/hero-spread.jpg?' + field.tab
    : field.key.endsWith('contactPhone')
      ? '+91 9876543210'
      : field.key.endsWith('contactEmail')
        ? 'brand-flow@example.test'
        : (locale === 'mr-IN'
            ? 'सुंदर शब्द '
            : locale === 'hi-IN'
              ? 'सरल शब्द '
              : 'Useful words ') + index;
const prisma = new PrismaClient();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let storeId, backup;
const results = [];
try {
  const auth = (
    await fetch(api + '/auth/pin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: process.env.BRAND_TEST_PHONE,
        pin: process.env.BRAND_TEST_PIN,
      }),
    }).then((r) => r.json())
  ).data;
  assert.ok(auth?.accessToken);
  storeId = auth.store.id;
  backup = {
    configs: await prisma.storeThemeConfig.findMany({ where: { storeId } }),
    branding: await prisma.storeBranding.findUnique({ where: { storeId } }),
    sections: await prisma.storeSection.findMany({ where: { storeId } }),
  };
  const request = async (method, endpoint, body) => {
    const response = await fetch(api + endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + auth.accessToken,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  const original = (await request('GET', '/themes/config')).body.data;
  for (const locale of process.env.BRAND_TEST_LEGACY_ONLY === '1'
    ? []
    : ['en-IN', 'mr-IN', 'hi-IN']) {
    const configJson = structuredClone(original.configJson);
    fields.forEach((field, index) =>
      set(configJson, field.key, normal(field, index, locale)),
    );
    configJson.announcement.enabled = true;
    configJson.announcement.floating = false;
    assert.equal(
      (
        await request('PUT', '/themes/config', {
          themeCode: 'aura',
          configJson: { ...configJson, themeId: 'aura' },
        })
      ).status,
      200,
    );
    const context = await browser.newContext({
      viewport: { width: 1680, height: 945 },
    });
    await context.addInitScript(
      ({ auth, locale }) => {
        localStorage.setItem('simply_seller_token', auth.accessToken);
        localStorage.setItem(
          'simply_seller_user',
          JSON.stringify({ ...auth.user, preferredLocale: locale }),
        );
        localStorage.setItem('simply_seller_store', JSON.stringify(auth.store));
      },
      { auth, locale },
    );
    const page = await context.newPage();
    const publicPage = await context.newPage();
    const t = createTranslator(locale);
    const tab = async (name) => {
      await page
        .getByRole('button', {
          name: t(
            'themes.' +
              (name === 'home'
                ? 'homeTab'
                : name === 'about'
                  ? 'aboutTab'
                  : 'themeTab'),
          ),
          exact: true,
        })
        .filter({ visible: true })
        .click();
      if (name !== 'theme')
        await page
          .frameLocator('iframe')
          .locator(name === 'home' ? '[data-brand-page="home"]' : 'main h1')
          .waitFor();
    };
    await page.goto(seller + '/brand-studio', { waitUntil: 'networkidle' });
    const cdp = await context.newCDPSession(page);
    for (const name of ['home', 'about']) {
      await tab(name);
      assert.equal(
        await page
          .locator('[data-brand-field]')
          .filter({ visible: true })
          .count(),
        name === 'home' ? 7 : 19,
        'all editable fields inventoried',
      );
      for (const field of fields.filter((field) => field.tab === name)) {
        const input = page
          .locator('[data-brand-field="' + field.key + '"]')
          .filter({ visible: true });
        const counter = input.locator('..').locator('[data-brand-counter]');
        assert.equal(await input.getAttribute('maxlength'), String(field.max));
        for (const value of [
          '',
          normal(field, fields.indexOf(field), locale),
          'x'.repeat(field.max - 1),
          'x'.repeat(field.max),
          'x'.repeat(field.max + 100),
          'word '.repeat(1900),
          'अ'.repeat(16000),
        ]) {
          await input.fill(value);
          assert.equal(await input.inputValue(), value.slice(0, field.max));
          assert.match(
            await counter.textContent(),
            new RegExp(Math.min(value.length, field.max) + ' / ' + field.max),
          );
        }
        await input.fill('x'.repeat(field.max - 1));
        await input.press('End');
        await input.pressSequentially('yz');
        assert.equal(
          (await input.inputValue()).length,
          field.max,
          'max+1 typing prevented',
        );
        await input.fill('');
        await input.focus();
        await cdp.send('Input.insertText', { text: 'word '.repeat(4000) });
        assert.equal(
          (await input.inputValue()).length,
          field.max,
          'native oversized insertion constrained',
        );
        const oversized = {};
        set(oversized, field.key, 'x'.repeat(field.max + 1));
        assert.equal(
          (
            await request('PUT', '/themes/config', {
              themeCode: 'aura',
              configJson: oversized,
            })
          ).status,
          400,
          field.key + ' direct API rejected',
        );
        await input.fill(normal(field, fields.indexOf(field), locale));
        results.push({
          locale,
          field: field.key,
          boundaries: 'PASS',
          nativeInsertion: 'PASS',
          counter: 'PASS',
          api: 'PASS',
        });
      }
      await page.locator('#preview-device-refresh').click();
      await checkContent(page.frameLocator('iframe'), name, configJson);
      console.log(
        locale +
          ' ' +
          name +
          ': every field boundary, long insertion, API rejection and preview refresh passed.',
      );
    }
    const saved = page.waitForResponse(
      (r) =>
        r.url() === api + '/themes/config' && r.request().method() === 'PUT',
    );
    await page
      .getByRole('button', { name: t('themes.saveChanges'), exact: true })
      .filter({ visible: true })
      .click();
    assert.equal((await saved).status(), 200);
    await page.waitForTimeout(500);
    const persisted = (await request('GET', '/themes/config')).body.data
      .configJson;
    for (const field of fields)
      assert.equal(
        get(persisted, field.key),
        get(configJson, field.key),
        'valid content persisted',
      );
    await page.reload({ waitUntil: 'networkidle' });
    for (const name of ['home', 'about']) {
      await tab(name);
      for (const field of fields.filter((f) => f.tab === name))
        assert.equal(
          await page
            .locator('[data-brand-field="' + field.key + '"]')
            .filter({ visible: true })
            .inputValue(),
          get(configJson, field.key),
        );
    }
    for (const [id, theme] of Object.entries(FOUNDATIONAL_THEMES)) {
      await tab('theme');
      await page
        .getByTestId('brand-theme-' + id)
        .filter({ visible: true })
        .click();
      for (const name of ['home', 'about']) {
        await tab(name);
        await page
          .frameLocator('iframe')
          .locator('.theme-' + id)
          .waitFor();
        await checkContent(page.frameLocator('iframe'), name, configJson);
      }
      assert.equal(
        (
          await request('PUT', '/themes/config', {
            themeCode: id,
            configJson: { ...persisted, themeId: id, palette: theme.palette },
          })
        ).status,
        200,
      );
      for (const width of [1440, 390]) {
        await publicPage.setViewportSize({
          width,
          height: width === 390 ? 844 : 900,
        });
        for (const name of ['home', 'about']) {
          await publicPage.goto(
            storefront +
              '/store/' +
              auth.store.slug +
              (name === 'about' ? '/about' : ''),
            { waitUntil: 'domcontentloaded' },
          );
          await publicPage.reload({ waitUntil: 'domcontentloaded' });
          await checkContent(publicPage, name, configJson);
          assert.equal(
            await publicPage.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
            locale + ' ' + id + ' ' + name + ' ' + width + ' overflow',
          );
        }
      }
      results.push({
        locale,
        theme: id,
        switchingPreview: 'PASS',
        savedPublicRefresh: 'PASS',
        desktopMobile: 'PASS',
      });
      console.log(
        locale +
          ' ' +
          theme.name +
          ': preview, saved storefront and mobile/desktop refresh passed.',
      );
    }
    if (locale === 'en-IN') {
      await tab('home');
      await page.screenshot({ path: path.join(out, 'home-editor.png') });
      await tab('about');
      await page.screenshot({ path: path.join(out, 'about-editor.png') });
    }
    await context.close();
  }

  const legacy = structuredClone(original.configJson);
  fields.forEach((field) => set(legacy, field.key, 'word '.repeat(4000)));
  legacy.pages.home.customSetting = 'keep-home';
  legacy.pages.about.customSetting = 'keep-about';
  const active = await prisma.storeThemeConfig.findFirst({
    where: { storeId },
    orderBy: { updatedAt: 'desc' },
  });
  await prisma.storeThemeConfig.update({
    where: { id: active.id },
    data: { configJson: legacy },
  });
  const normalized = (await request('GET', '/themes/config')).body.data
    .configJson;
  for (const field of fields)
    assert.equal(get(normalized, field.key).length, field.max);
  assert.equal(normalized.pages.home.customSetting, 'keep-home');
  assert.equal(normalized.pages.about.customSetting, 'keep-about');
  const legacyContext = await browser.newContext({
    viewport: { width: 1680, height: 945 },
  });
  await legacyContext.addInitScript((auth) => {
    localStorage.setItem('simply_seller_token', auth.accessToken);
    localStorage.setItem(
      'simply_seller_user',
      JSON.stringify({ ...auth.user, preferredLocale: 'en-IN' }),
    );
    localStorage.setItem('simply_seller_store', JSON.stringify(auth.store));
  }, auth);
  const legacyPage = await legacyContext.newPage();
  await legacyPage.goto(seller + '/brand-studio', { waitUntil: 'networkidle' });
  const legacyTranslator = createTranslator('en-IN');
  for (const name of ['home', 'about']) {
    await legacyPage
      .getByRole('button', {
        name: legacyTranslator(
          'themes.' + (name === 'home' ? 'homeTab' : 'aboutTab'),
        ),
        exact: true,
      })
      .click();
    for (const field of fields.filter((field) => field.tab === name)) {
      assert.equal(
        (
          await legacyPage
            .locator('[data-brand-field="' + field.key + '"]')
            .filter({ visible: true })
            .inputValue()
        ).length,
        field.max,
        'legacy editor safe',
      );
    }
  }
  const legacySaved = legacyPage.waitForResponse(
    (r) => r.url() === api + '/themes/config' && r.request().method() === 'PUT',
  );
  await legacyPage
    .getByRole('button', {
      name: legacyTranslator('themes.saveChanges'),
      exact: true,
    })
    .filter({ visible: true })
    .click();
  assert.equal((await legacySaved).status(), 200);
  await legacyPage.waitForTimeout(500);
  const row = await prisma.storeThemeConfig.findFirst({
    where: { storeId },
    orderBy: { updatedAt: 'desc' },
  });
  for (const field of fields)
    assert.equal(
      get(row.configJson, field.key).length,
      field.max,
      'legacy next save persists bounded content',
    );
  assert.equal(row.configJson.pages.home.customSetting, 'keep-home');
  assert.equal(row.configJson.pages.about.customSetting, 'keep-about');
  for (const name of ['home', 'about']) {
    await legacyPage
      .getByRole('button', {
        name: legacyTranslator(
          'themes.' + (name === 'home' ? 'homeTab' : 'aboutTab'),
        ),
        exact: true,
      })
      .click();
    for (const field of fields.filter((field) => field.tab === name))
      await legacyPage
        .locator('[data-brand-field="' + field.key + '"]')
        .filter({ visible: true })
        .fill('');
  }
  const emptySaved = legacyPage.waitForResponse(
    (r) => r.url() === api + '/themes/config' && r.request().method() === 'PUT',
  );
  await legacyPage
    .getByRole('button', {
      name: legacyTranslator('themes.saveChanges'),
      exact: true,
    })
    .filter({ visible: true })
    .click();
  assert.equal((await emptySaved).status(), 200);
  const emptyConfig = (await request('GET', '/themes/config')).body.data
    .configJson;
  for (const field of fields)
    assert.equal(get(emptyConfig, field.key), '', 'empty value survives save');
  await legacyPage.reload({ waitUntil: 'networkidle' });
  for (const name of ['home', 'about']) {
    await legacyPage
      .getByRole('button', {
        name: legacyTranslator(
          'themes.' + (name === 'home' ? 'homeTab' : 'aboutTab'),
        ),
        exact: true,
      })
      .click();
    for (const field of fields.filter((field) => field.tab === name))
      assert.equal(
        await legacyPage
          .locator('[data-brand-field="' + field.key + '"]')
          .filter({ visible: true })
          .inputValue(),
        '',
        'empty value survives refresh',
      );
  }
  console.log(
    'All 26 empty fields survived an actual editor save and refresh.',
  );
  await legacyContext.close();
  fs.writeFileSync(
    path.join(
      out,
      process.env.BRAND_TEST_LEGACY_ONLY === '1'
        ? 'brand-legacy-results.json'
        : 'brand-text-results.json',
    ),
    JSON.stringify({ fields: fields.length, results, legacy: 'PASS' }, null, 2),
  );
  console.log(
    JSON.stringify({
      homeFields: 7,
      aboutFields: 19,
      languages: 3,
      themes: 12,
      legacy: 'PASS',
      result: 'PASS',
    }),
  );
} finally {
  await browser.close();
  if (backup) {
    await prisma.$transaction(async (tx) => {
      await tx.storeThemeConfig.deleteMany({ where: { storeId } });
      if (backup.configs.length)
        await tx.storeThemeConfig.createMany({ data: backup.configs });
      await tx.storeSection.deleteMany({ where: { storeId } });
      if (backup.sections.length)
        await tx.storeSection.createMany({ data: backup.sections });
      if (backup.branding)
        await tx.storeBranding.update({
          where: { storeId },
          data: backup.branding,
        });
      else await tx.storeBranding.deleteMany({ where: { storeId } });
    });
    console.log(
      'Original local merchant configuration, branding and sections restored.',
    );
  }
  await prisma.$disconnect();
}

async function checkContent(target, name, config) {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const text = await target.locator('body').textContent();
      const main = await target.locator('main').textContent();
      for (const field of fields.filter(
        (field) => field.tab === name && !field.key.endsWith('Url'),
      )) {
        const value = get(config, field.key);
        const scope = field.key === 'announcement.text' ? text : main;
        assert.equal(
          scope.split(value).length - 1,
          1,
          field.key + ' rendered once',
        );
      }
      const textOnlyHero =
        name === 'home' && (await target.locator('.theme-foundry').count()) > 0;
      for (const field of fields.filter(
        (field) => field.tab === name && field.key.endsWith('Url'),
      ))
        assert.equal(
          await target
            .locator('main img')
            .evaluateAll(
              (images, value) =>
                images.filter((image) => image.getAttribute('src') === value)
                  .length,
              get(config, field.key),
            ),
          textOnlyHero ? 0 : 1,
          field.key + ' image rendering matches theme support',
        );
      return;
    } catch (error) {
      if (attempt === 29) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

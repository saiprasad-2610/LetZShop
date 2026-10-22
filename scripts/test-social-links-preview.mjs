import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/index.js';
import {
  SOCIAL_PLATFORMS,
  normalizeSocialLinks,
} from '../packages/types/dist/index.js';
import { FOUNDATIONAL_THEMES } from '../packages/ui/dist/index.js';
import { createTranslator } from '../packages/i18n/dist/index.js';
assert.ok(
  process.env.BRAND_TEST_PHONE && process.env.BRAND_TEST_PIN,
  'Set local demo merchant credentials',
);
if (fs.existsSync('.env')) process.loadEnvFile('.env');
const out = path.resolve('artifacts/journey-social');
fs.mkdirSync(out, { recursive: true });
const api = 'http://localhost:4000';
const raw = {
  instagram: '@letz_brand',
  whatsapp: '+91 98765 43210',
  facebook: 'letz.brand',
  youtube: '@letzchannel',
  twitter: '@letz_brand',
  linkedin: 'letz-brand',
};
const expected = normalizeSocialLinks(raw);
const titles = {
  instagram: 'Follow on Instagram',
  whatsapp: 'Chat on WhatsApp',
  facebook: 'Follow on Facebook',
  youtube: 'Subscribe on YouTube',
  twitter: 'Follow on Twitter / X',
  linkedin: 'Connect on LinkedIn',
};
const prisma = new PrismaClient();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let backup, storeId;
const results = [];
try {
  const login = await fetch(api + '/auth/pin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: process.env.BRAND_TEST_PHONE,
      pin: process.env.BRAND_TEST_PIN,
    }),
  }).then((r) => r.json());
  const auth = login.data;
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
  const fixture = structuredClone(original.configJson);
  fixture.footer = { ...fixture.footer, socialLinks: raw };
  fixture.pages = {
    ...fixture.pages,
    footer: { ...fixture.pages?.footer, socialLinks: raw },
  };
  for (const platform of SOCIAL_PLATFORMS) {
    assert.equal(
      (
        await request('PUT', '/themes/config', {
          themeCode: 'aura',
          configJson: {
            footer: { socialLinks: { [platform]: 'not a valid link' } },
          },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request('PUT', '/themes/config', {
          themeCode: 'aura',
          configJson: {
            pages: {
              footer: {
                socialLinks: { [platform]: 'https://evil.test/account' },
              },
            },
          },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request('PATCH', '/seller/store', {
          socialLinks: { [platform]: 'not a valid link' },
        })
      ).status,
      400,
    );
  }
  const evidenceOnly = process.env.SOCIAL_TEST_EVIDENCE_ONLY === '1';
  for (const locale of evidenceOnly ? ['en-IN'] : ['en-IN', 'mr-IN', 'hi-IN']) {
    assert.equal(
      (
        await request('PUT', '/themes/config', {
          themeCode: 'aura',
          configJson: { ...fixture, themeId: 'aura' },
        })
      ).status,
      200,
    );
    const context = await browser.newContext({
      viewport: { width: 1680, height: 1050 },
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
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const t = createTranslator(locale);
    const tab = async (name) => {
      await page
        .getByRole('button', { name: t('themes.' + name + 'Tab'), exact: true })
        .filter({ visible: true })
        .click();
    };
    const input = (platform) =>
      page
        .locator('[data-social-field="' + platform + '"]')
        .filter({ visible: true });
    const frame = () => page.frameLocator('iframe');
    const assertSocials = async (target) => {
      for (const platform of SOCIAL_PLATFORMS)
        assert.equal(
          await target
            .locator('footer a[title="' + titles[platform] + '"]')
            .getAttribute('href'),
          expected[platform],
        );
    };
    const save = async () => {
      const response = page.waitForResponse(
        (r) =>
          r.url() === api + '/themes/config' && r.request().method() === 'PUT',
      );
      await page
        .getByRole('button', { name: t('themes.saveChanges'), exact: true })
        .filter({ visible: true })
        .click();
      const saved = await response;
      assert.equal(saved.status(), 200);
      assert.equal(
        saved.request().postDataJSON().sections,
        undefined,
        'inactive section records are not appended',
      );
      await page.waitForTimeout(300);
    };
    await page.goto('http://localhost:3001/brand-studio', {
      waitUntil: 'networkidle',
    });
    await tab('footer');
    for (const platform of SOCIAL_PLATFORMS) {
      await input(platform).fill('not a valid link');
      assert.equal(await input(platform).getAttribute('aria-invalid'), 'true');
      assert.equal(
        await page
          .getByRole('button', { name: t('themes.saveChanges'), exact: true })
          .filter({ visible: true })
          .isDisabled(),
        true,
      );
      await page.waitForTimeout(150);
      await frame().locator('footer').waitFor();
      await page.waitForTimeout(150);
      assert.equal(
        await frame()
          .locator('footer a[title="' + titles[platform] + '"]')
          .count(),
        0,
        'invalid link hidden in live preview',
      );
      if (platform === 'instagram') {
        await page.locator('#preview-device-mobile').click();
        await frame().locator('footer').scrollIntoViewIfNeeded();
        assert.equal(
          await frame()
            .locator('html')
            .evaluate((e) => e.scrollWidth > innerWidth),
          false,
        );
        await page.screenshot({
          path: path.join(out, 'bug11-invalid-mobile-' + locale + '.png'),
        });
        await page.locator('#preview-device-desktop').click();
        await frame().locator('footer').scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(out, 'bug11-invalid-' + locale + '.png'),
        });
      }
      await input(platform).fill(raw[platform]);
      assert.equal(await input(platform).getAttribute('aria-invalid'), null);
    }
    await page.waitForTimeout(300);
    await assertSocials(frame());
    await save();
    const savedConfig = (await request('GET', '/themes/config')).body.data
      .configJson;
    assert.deepEqual(savedConfig.footer.socialLinks, expected);
    assert.deepEqual(savedConfig.pages.footer.socialLinks, expected);
    await page.reload({ waitUntil: 'networkidle' });
    await tab('footer');
    for (const platform of SOCIAL_PLATFORMS)
      assert.equal(await input(platform).inputValue(), expected[platform]);
    await frame().locator('footer').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(out, 'bug11-valid-' + locale + '.png'),
    });
    await tab('home');
    assert.equal(
      await page
        .getByText(t('brandStudio.homepageSectionFlowOrder'), { exact: true })
        .count(),
      0,
      'inactive flow UI removed',
    );
    const hero = 'Checked home ' + locale;
    await page
      .locator('[data-brand-field="pages.home.heroTitle"]')
      .filter({ visible: true })
      .fill(hero);
    await page.waitForTimeout(250);
    await frame().locator('main h1').filter({ hasText: hero }).waitFor();
    await save();
    await frame().locator('[data-theme-hero]').scrollIntoViewIfNeeded();
    await page.screenshot({
      fullPage: true,
      path: path.join(out, 'bug12-home-' + locale + '.png'),
    });
    await page.reload({ waitUntil: 'networkidle' });
    await tab('home');
    assert.equal(
      await page
        .locator('[data-brand-field="pages.home.heroTitle"]')
        .filter({ visible: true })
        .inputValue(),
      hero,
    );
    for (const id of evidenceOnly ? [] : Object.keys(FOUNDATIONAL_THEMES)) {
      await tab('theme');
      await page
        .getByTestId('brand-theme-' + id)
        .filter({ visible: true })
        .click();
      await tab('home');
      await frame()
        .locator('.theme-' + id + ' [data-theme-hero]')
        .waitFor();
      assert.equal(await frame().locator('[data-theme-hero]').count(), 1);
      await assertSocials(frame());
      await save();
      for (const width of [1440, 390]) {
        await publicPage.setViewportSize({ width, height: 900 });
        await publicPage.goto(
          'http://localhost:3000/store/' + auth.store.slug,
          { waitUntil: 'networkidle' },
        );
        await publicPage
          .locator('.theme-' + id + ' [data-theme-hero]')
          .waitFor();
        await assertSocials(publicPage);
        assert.equal(await publicPage.locator('[data-theme-hero]').count(), 1);
        assert.equal(await publicPage.locator('main #products').count(), 1);
        assert.equal(
          await publicPage.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      }
      results.push({
        locale,
        theme: id,
        socials: 'PASS',
        stableHome: 'PASS',
        desktopMobile: 'PASS',
      });
      console.log(
        locale +
          ' ' +
          id +
          ': social preview/save/public and stable curated Home passed.',
      );
    }
    const currentSections = await prisma.storeSection.findMany({
      where: { storeId },
    });
    assert.deepEqual(
      currentSections,
      backup.sections,
      'store section records preserved exactly',
    );
    assert.deepEqual(errors, []);
    await context.close();
  }
  // Legacy invalid strings remain editable with feedback, but are never rendered.
  const latest = await prisma.storeThemeConfig.findFirst({
    where: { storeId },
    orderBy: { updatedAt: 'desc' },
  });
  const legacy = {
    ...latest.configJson,
    footer: {
      ...latest.configJson.footer,
      socialLinks: Object.fromEntries(
        SOCIAL_PLATFORMS.map((p) => [p, 'invalid legacy text']),
      ),
    },
  };
  await prisma.storeThemeConfig.update({
    where: { id: latest.id },
    data: { configJson: legacy },
  });
  const context = await browser.newContext({
    viewport: { width: 1680, height: 1050 },
  });
  await context.addInitScript((auth) => {
    localStorage.setItem('simply_seller_token', auth.accessToken);
    localStorage.setItem(
      'simply_seller_user',
      JSON.stringify({ ...auth.user, preferredLocale: 'en-IN' }),
    );
    localStorage.setItem('simply_seller_store', JSON.stringify(auth.store));
  }, auth);
  const page = await context.newPage();
  await page.goto('http://localhost:3001/brand-studio', {
    waitUntil: 'networkidle',
  });
  await page
    .getByRole('button', {
      name: createTranslator('en-IN')('themes.footerTab'),
      exact: true,
    })
    .click();
  assert.equal(
    await page
      .locator('[data-social-field][aria-invalid="true"]')
      .filter({ visible: true })
      .count(),
    6,
  );
  await page.frameLocator('iframe').locator('footer').waitFor();
  for (const title of Object.values(titles))
    assert.equal(
      await page
        .frameLocator('iframe')
        .locator('footer a[title="' + title + '"]')
        .count(),
      0,
    );
  await page.frameLocator('iframe').locator('footer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(out, 'bug11-legacy.png') });
  await context.close();
  fs.writeFileSync(
    path.join(
      out,
      evidenceOnly
        ? 'social-evidence-results.json'
        : 'social-home-results.json',
    ),
    JSON.stringify(
      { results, legacy: 'PASS', api: 'PASS', removedControls: 'PASS' },
      null,
      2,
    ),
  );
  console.log(
    evidenceOnly
      ? 'Social validation and desktop/mobile footer evidence passed.'
      : 'Social validation, legacy handling and all 36 locale/theme combinations passed.',
  );
} finally {
  await browser.close();
  if (backup)
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
  await prisma.$disconnect();
  console.log(
    'Original merchant configurations, sections and branding restored.',
  );
}

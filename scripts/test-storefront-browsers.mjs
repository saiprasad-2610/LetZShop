import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, firefox, webkit } from 'playwright';
import {
  PrismaClient,
  Prisma,
} from '../packages/db/node_modules/@prisma/client/index.js';
process.loadEnvFile('.env');
const db = new PrismaClient();
const out = process.env.MEDIA_ARTIFACTS || 'artifacts/rail-media-identity';
fs.mkdirSync(out, { recursive: true });
const slug = process.env.MEDIA_STORE_SLUG || 'sk-general-stores';
const base = process.env.STOREFRONT_URL || 'http://localhost:3000';
assert.ok(
  ['localhost', '127.0.0.1'].includes(new URL(base).hostname),
  'Run against local test services only.',
);
const store = await db.store.findUniqueOrThrow({
  where: { slug },
  include: {
    themeConfiguration: true,
    themeConfigs: { include: { theme: true } },
  },
});
const original = store.themeConfiguration;
const themeCodes = [
  'atelier',
  'aura',
  'canvas',
  'feast',
  'foundry',
  'habitat',
  'harvest',
  'horizon',
  'local',
  'noir',
  'pulse',
  'vista',
];
const themes = await db.theme.findMany({
  where: { code: { in: themeCodes } },
  orderBy: { code: 'asc' },
});
assert.equal(themes.length, 12);
const legacyBefore = await db.storeThemeConfig.findMany({
  where: { storeId: store.id },
  orderBy: { id: 'asc' },
});
const createdConfigIds = [];
const results = [],
  failures = [];
const engines = [
  ['Chrome', chromium, { channel: 'chrome' }],
  ['Edge', chromium, { channel: 'msedge' }],
  ['Firefox', firefox, {}],
  ['WebKit', webkit, {}],
];
const selected = process.env.MEDIA_BROWSER;
let browser;
async function inspect(page) {
  await page.waitForFunction(
    () => document.title.includes('Official Storefront'),
    null,
    { timeout: 45000 },
  );
  for (
    let y = 0;
    y < (await page.evaluate(() => document.body.scrollHeight));
    y += 650
  ) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(300);
  return page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images]
      .filter((image) => image.getBoundingClientRect().width > 0)
      .map((image) => ({
        src: image.currentSrc,
        width: image.naturalWidth,
        height: image.naturalHeight,
        complete: image.complete,
      }));
    return {
      images,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      fonts: document.fonts.status,
      theme: [...document.querySelectorAll('[class]')]
        .flatMap((element) => [...element.classList])
        .find((name) => /^theme-[a-z]+$/.test(name)),
      backgrounds: [
        ...new Set(
          [...document.querySelectorAll('*')]
            .map((element) => getComputedStyle(element).backgroundImage)
            .filter((image) => image !== 'none'),
        ),
      ],
    };
  });
}
try {
  if (original)
    await db.storeThemeConfiguration.delete({ where: { storeId: store.id } });
  for (const [name, engine, options] of engines) {
    if (selected && selected !== name) continue;
    try {
      browser = await engine.launch({ headless: true, ...options });
    } catch (error) {
      failures.push({ browser: name, error: error.message });
      continue;
    }
    try {
      for (const theme of themes) {
        const key = theme.code.toUpperCase();
        const legacy = store.themeConfigs.find(
          (config) => config.themeId === theme.id,
        );
        const config = {
          ...(legacy?.configJson ||
            original?.configuration ||
            theme.configJson ||
            {}),
          themeId: theme.code,
        };
        const saved = await db.storeThemeConfig.upsert({
          where: { storeId_themeId: { storeId: store.id, themeId: theme.id } },
          create: { storeId: store.id, themeId: theme.id, configJson: config },
          update: { configJson: config, updatedAt: new Date() },
        });
        if (!legacy && !createdConfigIds.includes(saved.id))
          createdConfigIds.push(saved.id);
        for (const width of process.env.MEDIA_THEME_ONLY === '1'
          ? [1440]
          : [1440, 390]) {
          const context = await browser.newContext({
            viewport: { width, height: width === 390 ? 844 : 1000 },
          });
          const page = await context.newPage();
          const errors = [],
            network = [],
            requests = [];
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
          });
          page.on('requestfailed', (request) =>
            requests.push({
              url: request.url(),
              error: request.failure()?.errorText,
            }),
          );
          page.on('response', async (response) => {
            if (
              response.request().resourceType() === 'image' ||
              response.status() >= 400
            )
              network.push({
                url: response.url(),
                status: response.status(),
                headers: await response.allHeaders(),
                redirectedFrom: response.request().redirectedFrom()?.url(),
              });
          });
          const modes =
            width === 1440 && process.env.MEDIA_THEME_ONLY !== '1'
              ? ['cold-private', 'warm', 'hard-refresh']
              : ['cold-private'];
          try {
            for (const mode of modes) {
              if (mode === 'cold-private')
                await page.goto(`${base}/store/${slug}`, {
                  waitUntil: 'networkidle',
                  timeout: 90000,
                });
              else {
                if (mode === 'hard-refresh')
                  await page.setExtraHTTPHeaders({
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
                  });
                await page.reload({ waitUntil: 'networkidle', timeout: 90000 });
              }
              const state = await inspect(page);
              assert.equal(
                state.theme,
                `theme-${theme.code}`,
                'The persisted theme must actually render.',
              );
              const broken = state.images.filter(
                (image) => !image.complete || !image.width || !image.height,
              );
              assert.equal(
                state.overflow,
                false,
                `${name}/${key}/${width}: page overflow`,
              );
              assert.equal(broken.length, 0, JSON.stringify(broken));
              assert.ok(
                state.images.length >= 4,
                `${name}/${key}: logo, hero and product imagery must remain in the rendered page`,
              );
              assert.deepEqual(errors, []);
              assert.deepEqual(requests, []);
              assert.ok(network.every((response) => response.status < 400));
              results.push({
                browser: name,
                theme: key,
                width,
                mode,
                result: 'PASS',
                state,
              });
              if (mode === 'cold-private') {
                await page.evaluate(() => scrollTo(0, 0));
                await page.screenshot({
                  path: `${out}/${name}-${key}-${width}.png`,
                  fullPage: true,
                });
              }
            }
          } catch (error) {
            failures.push({
              browser: name,
              theme: key,
              width,
              error: error.message,
            });
          } finally {
            fs.writeFileSync(
              `${out}/network-${name}-${key}-${width}.json`,
              JSON.stringify({ errors, requests, network }, null, 2),
            );
            await context.close();
            fs.writeFileSync(
              `${out}/browser-results${selected ? '-' + selected : ''}.json`,
              JSON.stringify(
                { store: slug, results, failures, realSafariTested: false },
                null,
                2,
              ),
            );
          }
        }
        console.log(`${name}: ${key} checked.`);
      }
    } finally {
      await browser.close();
      browser = undefined;
    }
  }
} finally {
  await browser?.close();
  await db.$transaction(async (tx) => {
    for (const row of legacyBefore) {
      const { id, storeId, ...data } = row;
      await tx.storeThemeConfig.update({ where: { id }, data });
    }
    await tx.storeThemeConfig.deleteMany({
      where: { id: { in: createdConfigIds }, storeId: store.id },
    });
    if (original) {
      const { id, storeId, ...data } = original;
      await tx.storeThemeConfiguration.create({
        data: {
          id,
          storeId,
          ...data,
          publishedConfiguration:
            data.publishedConfiguration === null
              ? Prisma.DbNull
              : data.publishedConfiguration,
        },
      });
    }
  });
  assert.deepEqual(
    await db.storeThemeConfig.findMany({
      where: { storeId: store.id },
      orderBy: { id: 'asc' },
    }),
    legacyBefore,
    'Restore original persisted theme configuration exactly.',
  );
  await db.$disconnect();
  fs.writeFileSync(
    `${out}/browser-results${selected ? '-' + selected : ''}.json`,
    JSON.stringify(
      { store: slug, results, failures, realSafariTested: false },
      null,
      2,
    ),
  );
}
assert.deepEqual(failures, []);
console.log(`${results.length} theme/browser/viewport/cache cases passed.`);

import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');
if (
  process.env.NODE_ENV === 'production' ||
  !['localhost', '127.0.0.1'].includes(
    new URL(process.env.DATABASE_URL).hostname,
  )
)
  throw new Error('This verification requires a local development database.');
const require = createRequire(import.meta.url),
  { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const db = new PrismaClient(),
  suffix = crypto.randomBytes(5).toString('hex'),
  password = crypto.randomBytes(22).toString('base64url') + 'Aa1!',
  salt = crypto.randomBytes(16).toString('hex'),
  report = { errors: [], dialogs: [] };
let user, browser;
try {
  user = await db.user.create({
    data: {
      fullName: 'Admin UI verification',
      phone: '+919' + String(crypto.randomInt(100000000, 999999999)),
      email: 'admin-ui-' + suffix + '@example.invalid',
      role: 'PLATFORM_ADMIN',
      isSuperAdmin: true,
      credentials: {
        create: {
          credentialType: 'PIN',
          pinHash:
            salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex'),
        },
      },
    },
  });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);
  await page.goto('http://localhost:3002/login', {
    waitUntil: 'domcontentloaded',
  });
  await page.getByLabel('Email / Phone').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL('http://localhost:3002/');
  await page.locator('[data-kpi="Total Merchants"]').waitFor();
  const merchant = await db.tenant.findFirstOrThrow({
    where: {
      deletedAt: null,
      memberships: {
        some: {
          role: 'SELLER_OWNER',
          isActive: true,
          user: { deletedAt: null },
        },
      },
    },
  });
  for (const theme of ['light', 'dark']) {
    if ((await page.locator('html').getAttribute('data-admin-theme')) !== theme)
      await page
        .getByRole('button', {
          name:
            theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme',
        })
        .click();
    await page.goto('http://localhost:3002/billing', {
      waitUntil: 'domcontentloaded',
    });
    await page
      .getByRole('button', { name: 'Create New Plan', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const bounds = await dialog.boundingBox();
    assert(
      bounds.x >= 0 &&
        bounds.x + bounds.width <= 391 &&
        bounds.y >= 0 &&
        bounds.y + bounds.height <= 845,
    );
    const bg = await dialog.evaluate(
      (e) => getComputedStyle(e).backgroundColor,
    );
    if (theme === 'dark') assert.notEqual(bg, 'rgb(255, 255, 255)');
    await page.screenshot({
      path: 'artifacts/admin-completion/e2e/plan-dialog-' + theme + '-390.png',
    });
    report.dialogs.push({
      theme,
      width: 390,
      height: 844,
      bounds,
      background: bg,
    });
    await dialog.getByRole('button').first().click();
    for (const [path, endpoint] of [
      ['/', 'overview'],
      ['/merchants', 'merchants'],
      ['/merchants/' + merchant.id, 'merchants/' + merchant.id],
      ['/reviews', 'reviews'],
      ['/billing', 'plans'],
      ['/subscriptions', 'plans'],
      ['/payments', 'payments'],
      ['/users', 'users'],
      ['/settings', 'settings'],
      ['/audit-logs', 'audit-logs'],
      ['/analytics', 'analytics'],
      ['/commerce', 'commerce'],
      ['/themes', 'themes'],
      ['/operations', 'operations'],
    ]) {
      const pattern = '**/api/platform/admin/' + endpoint + '*';
      await page.route(pattern, (route) => route.abort());
      await page.goto('http://localhost:3002' + path, {
        waitUntil: 'domcontentloaded',
      });
      const error = page.locator('main [role=alert]').first();
      await error.waitFor();
      await error.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      assert.equal(
        await page
          .locator('main')
          .getByText('No Subscription Plans Configured', { exact: true })
          .count(),
        0,
      );
      await page.unroute(pattern);
      await error.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.locator('main h1').waitFor();
      await page
        .locator('main [role=status]')
        .filter({ hasText: 'Loading' })
        .waitFor({ state: 'hidden' });
      assert.equal(await page.locator('main [role=alert]').count(), 0);
      report.errors.push({ path, theme, error: true, retry: true });
    }
  }
  report.passed = true;
} finally {
  if (browser) await browser.close();
  if (user) await db.user.delete({ where: { id: user.id } });
  await db.$disconnect();
  fs.writeFileSync(
    'artifacts/admin-completion/supplemental-ui.json',
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      passed: report.passed,
      errorChecks: report.errors.length,
      dialogs: report.dialogs.length,
    }),
  );
}

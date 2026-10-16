import { execFileSync } from 'node:child_process';
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
  ) ||
  process.env.OTP_DEV_MOCK_ENABLED !== 'true'
)
  throw Error(
    'Local development PostgreSQL and development OTP provider required.',
  );
const require = createRequire(import.meta.url),
  { PrismaClient } = require('../packages/db/node_modules/@prisma/client'),
  db = new PrismaClient();
const out = 'artifacts/dashboard-proof';
fs.mkdirSync(out, { recursive: true });
execFileSync(process.execPath, ['scripts/check-dashboard-empty.cjs'], {
  stdio: 'pipe',
});
const run = crypto.randomBytes(5).toString('hex'),
  phones = [],
  users = [],
  tenants = [],
  report = {
    run,
    comparisons: [],
    responsive: [],
    states: [],
    security: [],
    pageErrors: [],
  };
let browser, page;
const phone = () => '+919' + String(crypto.randomInt(100000000, 999999999));
const request = async (path, { token, method = 'GET', body } = {}) => {
  const res = await fetch('http://localhost:4000/' + path, {
    method,
    headers: {
      ...(token ? { authorization: 'Bearer ' + token } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const value = await res.json();
  return { status: res.status, data: value.data ?? value };
};
async function overview(token) {
  const response = await request('admin/overview?range=ALL', { token });
  assert.equal(response.status, 200, JSON.stringify(response.data));
  return response.data;
}
async function ready() {
  await page.locator('[data-kpi="Total Merchants"]').waitFor();
  assert.equal(await page.locator('main [role=alert]').count(), 0);
}
async function compare(token, stage) {
  const api = await overview(token);
  // Independent formulation: JOIN/DISTINCT and DISTINCT ON rather than the service's EXISTS/LATERAL queries.
  const [counts] = await db.$queryRaw`SELECT
 (SELECT count(DISTINCT t.id)::int FROM tenants t JOIN tenant_memberships m ON m.tenant_id=t.id JOIN users u ON u.id=m.user_id WHERE t.deleted_at IS NULL AND m.is_active=true AND m.role='SELLER_OWNER' AND u.role='SELLER_OWNER' AND u."isSuperAdmin"=false AND u.deleted_at IS NULL) AS "totalMerchants",
 (SELECT count(*)::int FROM stores st JOIN (SELECT DISTINCT ON(tenant_id) tenant_id,status,current_period_end FROM subscriptions ORDER BY tenant_id,created_at DESC) sub ON sub.tenant_id=st.tenant_id WHERE st.deleted_at IS NULL AND st.status='LIVE' AND st.is_publicly_accessible=true AND sub.status='ACTIVE' AND sub.current_period_end>=now()) AS "liveStores",
 (SELECT count(*)::int FROM (SELECT DISTINCT ON(s.tenant_id) s.tenant_id,s.status,s.current_period_end FROM subscriptions s JOIN tenants t ON t.id=s.tenant_id WHERE t.deleted_at IS NULL ORDER BY s.tenant_id,s.created_at DESC) latest WHERE status='ACTIVE' AND current_period_end>=now()) AS "activeSubscriptions",
 (SELECT count(*)::int FROM orders) AS "totalOrders",
 (SELECT COALESCE(sum(amount_paise),0)::double precision FROM subscription_payments WHERE status='SUCCESS' OR status='PAID') AS "subscriptionRevenuePaise",
 (SELECT count(*)::int FROM review_reports WHERE status='PENDING' OR status='UNDER_REVIEW') AS "pendingReviewReports",
 (SELECT count(*)::int FROM stores WHERE deleted_at IS NULL AND status IN('DRAFT','PRIVATE_PREVIEW')) AS "privateStores",
 (SELECT count(*)::int FROM stores WHERE deleted_at IS NULL AND status='SUSPENDED') AS "suspendedStores",
 (SELECT count(*)::int FROM products WHERE deleted_at IS NULL) AS "totalProducts",
 (SELECT count(*)::int FROM customers) AS "totalCustomers",
 (SELECT count(*)::int FROM product_reviews WHERE status='ACTIVE') AS "totalReviews"`;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  const selected = page.waitForResponse((r) =>
    r.url().includes('/api/platform/admin/overview?range=ALL'),
  );
  await page.getByLabel('Date range', { exact: true }).selectOption('ALL');
  const selectedResponse = await (await selected).json();
  const selectedData = selectedResponse.data ?? selectedResponse;
  await page
    .locator('time[datetime="' + selectedData.generatedAt + '"]')
    .waitFor();
  const labels = {
    totalMerchants: 'Total Merchants',
    liveStores: 'Live Stores',
    activeSubscriptions: 'Active Subscriptions',
    totalOrders: 'Total Orders',
    subscriptionRevenuePaise: 'Subscription Revenue',
    pendingReviewReports: 'Pending Review Reports',
    privateStores: 'Draft / Private Stores',
    suspendedStores: 'Suspended Stores',
    totalProducts: 'Total Products',
    totalCustomers: 'Total Customers',
    totalReviews: 'Total Reviews',
  };
  for (const [metric, value] of Object.entries(counts)) {
    assert.equal(api.kpis[metric], value, metric);
    const text = await page
      .locator('[data-kpi="' + labels[metric] + '"]')
      .innerText();
    const numeric = Number(text.replace(/[^0-9.-]/g, ''));
    assert.equal(
      metric === 'subscriptionRevenuePaise'
        ? Math.round(numeric * 100)
        : numeric,
      value,
      metric + ' browser',
    );
    report.comparisons.push({
      stage,
      metric,
      postgres: value,
      api: api.kpis[metric],
      ui: text,
    });
  }
  // Independently cross-check every chart array and actual recent IDs.

  const merchantRows =
    await db.$queryRaw`SELECT to_char(created_at,'YYYY-MM-DD') AS date,count(DISTINCT t.id)::int AS count FROM tenants t WHERE deleted_at IS NULL AND EXISTS(SELECT 1 FROM tenant_memberships m JOIN users u ON u.id=m.user_id WHERE m.tenant_id=t.id AND m.role='SELLER_OWNER' AND m.is_active AND u.role='SELLER_OWNER' AND u."isSuperAdmin"=false AND u.deleted_at IS NULL) GROUP BY 1 ORDER BY 1`;
  const revenueRows =
    await db.$queryRaw`SELECT to_char(CASE WHEN i.paid_at IS NULL THEN p.created_at ELSE i.paid_at END,'YYYY-MM-DD') AS date,sum(p.amount_paise)::double precision AS "amountPaise" FROM subscription_payments p JOIN subscription_invoices i ON i.id=p.invoice_id WHERE p.status IN('SUCCESS','PAID') GROUP BY 1 ORDER BY 1`;
  const orderRows =
    await db.$queryRaw`SELECT to_char(created_at,'YYYY-MM-DD') AS date,count(*)::int AS count,COALESCE(sum(CASE WHEN payment_status='PAID' THEN total_paise ELSE 0 END),0)::double precision AS "gmvPaise" FROM orders GROUP BY 1 ORDER BY 1`;
  assert.deepEqual(api.charts.merchantGrowth, merchantRows);
  assert.deepEqual(api.charts.subscriptionRevenueTrends, revenueRows);
  assert.deepEqual(api.charts.orderTrends, orderRows);
  assert.equal(
    api.reviewModeration.removedThisMonth,
    await db.productReview.count({
      where: {
        status: 'REMOVED',
        moderatedAt: {
          gte: new Date(
            Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
          ),
        },
      },
    }),
  );
  assert.equal(
    api.reviewModeration.resolvedReports,
    await db.reviewReport.count({ where: { status: 'RESOLVED' } }),
  );
  for (const row of api.recentlyJoinedMerchants)
    assert(await db.tenant.findUnique({ where: { id: row.id } }));
  for (const row of api.recentOrders)
    assert(await db.order.findUnique({ where: { id: row.id } }));

  const reportRows =
    await db.$queryRaw`WITH created AS (SELECT created_at::date AS day,count(*)::int AS count FROM review_reports GROUP BY 1), resolved AS (SELECT resolved_at::date AS day,count(*)::int AS count FROM review_reports WHERE status='RESOLVED' AND resolved_at IS NOT NULL GROUP BY 1) SELECT to_char(COALESCE(c.day,r.day),'YYYY-MM-DD') AS date,COALESCE(c.count,0)::int AS count,COALESCE(r.count,0)::int AS resolved FROM created c FULL JOIN resolved r ON r.day=c.day ORDER BY date`;
  assert.deepEqual(api.charts.reportTrends, reportRows);
  const chartCases = [
    [
      'Merchant growth',
      api.charts.merchantGrowth.map((p) => ({ date: p.date, value: p.count })),
      false,
    ],
    [
      'Subscription revenue',
      api.charts.subscriptionRevenueTrends.map((p) => ({
        date: p.date,
        value: p.amountPaise,
      })),
      true,
    ],
    [
      'Orders created',
      api.charts.orderTrends.map((p) => ({ date: p.date, value: p.count })),
      false,
    ],
    [
      'Review reports created',
      api.charts.reportTrends.map((p) => ({ date: p.date, value: p.count })),
      false,
    ],
    [
      'Review reports resolved',
      api.charts.reportTrends
        .filter((p) => p.resolved > 0)
        .map((p) => ({ date: p.date, value: p.resolved })),
      false,
    ],
  ];
  for (const [title, points, money] of chartCases) {
    const panel = page
      .getByRole('heading', { name: title, exact: true })
      .locator('..');
    if (!points.length) {
      assert.equal(
        await panel
          .getByText('No activity in this date range.', { exact: true })
          .count(),
        1,
      );
      continue;
    }
    assert.deepEqual(
      await panel.locator('time').allTextContents(),
      points.map((p) => p.date),
    );
    const values = await panel
      .getByRole('img')
      .locator('span')
      .allTextContents();
    assert.deepEqual(
      values.map((v) => {
        const n = Number(v.replace(/[^0-9.-]/g, ''));
        return money ? Math.round(n * 100) : n;
      }),
      points.map((p) => p.value),
    );
  }

  report.charts = {
    merchantGrowth: merchantRows.length,
    subscriptionRevenue: revenueRows.length,
    orders: orderRows.length,
    allCompared: true,
  };
  return api;
}
try {
  const secret = crypto.randomBytes(22).toString('base64url') + 'Aa1!',
    salt = crypto.randomBytes(16).toString('hex');
  const admin = await db.user.create({
    data: {
      phone: phone(),
      email: 'dashboard-admin-' + run + '@example.invalid',
      fullName: 'Dashboard verification admin',
      role: 'PLATFORM_ADMIN',
      isSuperAdmin: true,
      credentials: {
        create: {
          credentialType: 'PIN',
          pinHash:
            salt + ':' + crypto.scryptSync(secret, salt, 64).toString('hex'),
        },
      },
    },
  });
  users.push(admin.id);
  fs.writeFileSync(
    out + '/run-manifest.json',
    JSON.stringify({ run, users, tenants, phones }),
  );
  const auth = await request('auth/admin/login', {
    method: 'POST',
    body: { identifier: admin.email, secret },
  });
  assert.equal(auth.status, 200);
  const token = auth.data.accessToken;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);
  page.on('pageerror', (e) => report.pageErrors.push(e.message));
  await page.goto('http://localhost:3002/', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/login');
  await page.getByLabel('Email / Phone').fill(admin.email);
  await page.getByLabel('Password', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL('http://localhost:3002/');
  await ready();
  await page.getByLabel('Date range', { exact: true }).selectOption('ALL');
  await ready();
  const before = await compare(token, 'before');
  const sellerPhone = phone();
  phones.push(sellerPhone);
  let res = await request('auth/register/request-otp', {
    method: 'POST',
    body: { phone: sellerPhone },
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  res = await request('auth/register/verify-otp', {
    method: 'POST',
    body: {
      phone: sellerPhone,
      code: process.env.OTP_DEV_DEFAULT_CODE || '123456',
    },
  });
  assert.equal(res.status, 200);
  const registered = await request('auth/pin/setup', {
    method: 'POST',
    body: {
      phone: sellerPhone,
      pin: String(crypto.randomInt(100000, 999999)),
      fullName: 'Dashboard verified owner',
      verificationToken: res.data.verificationToken,
    },
  });
  assert.equal(registered.status, 201, JSON.stringify(registered.data));
  users.push(registered.data.user.userId);
  fs.writeFileSync(
    out + '/run-manifest.json',
    JSON.stringify({ run, users, tenants, phones }),
  );
  const onboard = await request('stores/onboard', {
    token: registered.data.accessToken,
    method: 'POST',
    body: {
      businessName: 'Dashboard Proof ' + run,
      category: 'General',
      contactPhone: sellerPhone,
    },
  });
  assert.equal(onboard.status, 201, JSON.stringify(onboard.data));
  tenants.push(onboard.data.tenant.id);
  fs.writeFileSync(
    out + '/run-manifest.json',
    JSON.stringify({ run, users, tenants, phones }),
  );
  const after = await compare(token, 'after onboarding');
  assert.equal(after.kpis.totalMerchants, before.kpis.totalMerchants + 1);
  assert(
    after.recentlyJoinedMerchants.some((m) => m.id === onboard.data.tenant.id),
  );
  report.change = {
    flow: 'Normal registration OTP → PIN setup → stores/onboard',
    before: before.kpis.totalMerchants,
    after: after.kpis.totalMerchants,
    businessId: onboard.data.tenant.id,
  };
  const extra = await request('stores', {
    token: onboard.data.accessToken,
    method: 'POST',
    body: { name: 'Additional profile ' + run, slug: 'dashboard-extra-' + run },
  });
  assert.equal(extra.status, 201, JSON.stringify(extra.data));
  assert.equal(
    (await overview(token)).kpis.totalMerchants,
    after.kpis.totalMerchants,
  );
  report.change.extraStoreDoesNotAddMerchant = true;
  for (const [who, credential, expected] of [
    ['anonymous', undefined, 401],
    ['merchant', onboard.data.accessToken, 403],
    ['admin', token, 200],
  ]) {
    const response = await request('admin/overview', { token: credential });
    assert.equal(response.status, expected);
    report.security.push({ who, status: response.status });
  }
  for (const range of ['7d', '30d', '3m', '6m', '12m', 'ALL'])
    assert.equal(
      (await request('admin/overview?range=' + range, { token })).status,
      200,
    );
  assert.equal(
    (await request('admin/overview?range=invalid', { token })).status,
    400,
  );
  const empty = JSON.parse(
    fs.readFileSync(out + '/empty-postgres.json', 'utf8'),
  );
  for (const value of Object.values(empty.kpis)) assert.equal(value, 0);
  const pattern = '**/api/platform/admin/overview*';
  for (const theme of ['light', 'dark']) {
    if ((await page.locator('html').getAttribute('data-admin-theme')) !== theme)
      await page
        .getByRole('button', {
          name:
            theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme',
        })
        .click();
    for (const { width, height } of [
      { width: 1440, height: 900 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize({ width, height });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await ready();
      const state = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        theme: document.documentElement.dataset.adminTheme,
        panels: [...document.querySelectorAll('.admin-panel')].map(
          (e) => getComputedStyle(e).backgroundColor,
        ),
      }));
      assert(state.width <= width);
      assert.equal(state.theme, theme);
      if (theme === 'dark')
        assert(!state.panels.includes('rgb(255, 255, 255)'));
      await page.screenshot({
        path: out + '/dashboard-' + theme + '-' + width + '.png',
      });
      report.responsive.push({ theme, width, height, passed: true });
    }
    // Delay/abort transport only for failure-state tests; never substitute successful business data.
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route(pattern, async (route) => {
      await gate;
      await route.continue();
    });
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await page
      .locator('main [role=status]')
      .filter({ hasText: 'Loading' })
      .waitFor();
    assert.equal(await page.locator('[data-kpi]').count(), 0);
    await page.screenshot({ path: out + '/loading-' + theme + '.png' });
    release();
    await ready();
    await page.unroute(pattern);
    await page.route(pattern, (route) => route.abort());
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await page.locator('main [role=alert]').waitFor();
    assert.equal(await page.locator('[data-kpi]').count(), 0);
    await page.screenshot({ path: out + '/error-' + theme + '.png' });
    await page.unroute(pattern);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await ready();
    // This response was computed by the production service over real, empty temporary PostgreSQL tables.
    // Interception renders the isolated empty result; it is not evidence for populated-platform totals above.
    await page.route(pattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: empty }),
      }),
    );
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await page.getByText('No merchants yet.', { exact: true }).waitFor();
    assert.equal(
      await page.getByText('No orders yet.', { exact: true }).count(),
      1,
    );
    assert.equal(
      await page
        .getByText('No activity in this date range.', { exact: true })
        .count(),
      5,
    );
    for (const locator of await page.locator('[data-kpi]').all())
      assert.equal(
        Number((await locator.innerText()).replace(/[^0-9.-]/g, '')),
        0,
      );
    await page.screenshot({ path: out + '/empty-' + theme + '.png' });
    await page.unroute(pattern);
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await ready();
    report.states.push({
      theme,
      loading: true,
      errorRetry: true,
      emptyPostgresResultRendered: true,
    });
  }
  assert.deepEqual(report.pageErrors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  if (page)
    await page.screenshot({ path: out + '/failure.png' }).catch(() => {});
  throw error;
} finally {
  if (browser) await browser.close();
  await db.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({
      where: {
        OR: [{ actorId: { in: users } }, { tenantId: { in: tenants } }],
      },
    });
    await tx.outboxEvent.deleteMany({ where: { tenantId: { in: tenants } } });
    await tx.tenant.deleteMany({ where: { id: { in: tenants } } });
    await tx.user.deleteMany({ where: { id: { in: users } } });
    await tx.otpChallenge.deleteMany({ where: { phone: { in: phones } } });
    await tx.otpRequest.deleteMany({ where: { phone: { in: phones } } });
  });
  report.cleaned =
    (await db.tenant.count({ where: { id: { in: tenants } } })) === 0 &&
    (await db.user.count({ where: { id: { in: users } } })) === 0;
  fs.writeFileSync(out + '/results.json', JSON.stringify(report, null, 2));
  await db.$disconnect();
  console.log(
    JSON.stringify({
      passed: report.passed,
      comparisons: report.comparisons.length,
      viewports: report.responsive.length,
      cleaned: report.cleaned,
      failure: report.failure,
    }),
  );
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { PrismaClient } from '../packages/db/node_modules/@prisma/client/index.js';
const require = createRequire(import.meta.url);
const {
  StoresService,
} = require('../apps/api/dist/modules/stores/stores.service.js');
const {
  SubscriptionVisibilityService,
} = require('../apps/api/dist/modules/subscriptions/subscription-visibility.service.js');
const { getPublicStoreUrl } = require('../packages/types/dist/index.js');
process.loadEnvFile('.env');
const db = new PrismaClient();
const service = new StoresService(db, new SubscriptionVisibilityService(db));
const run = `identity-test-${Date.now()}`;
const users = [],
  tenantIds = [];
const out = 'artifacts/rail-media-identity';
const before = await db.store.findMany({
  select: { id: true, slug: true, name: true },
  orderBy: { id: 'asc' },
});
async function user(index) {
  const created = await db.user.create({
    data: { phone: `${run}-${index}`, fullName: run },
  });
  users.push(created.id);
  return {
    userId: created.id,
    phone: created.phone,
    role: 'SELLER_OWNER',
    isPlatformAdmin: false,
  };
}
async function onboard(actor, name) {
  const result = await service.onboardMerchant(actor, {
    businessName: name,
    category: 'Food',
    contactPhone: '+919876543210',
  });
  tenantIds.push(result.tenant.id);
  return result;
}
try {
  assert.equal(
    await db.store.count({
      where: {
        slug: { in: ['royal-bakery', 'royal-bakery-2', 'royal-bakery-3'] },
      },
    }),
    0,
    'Examples require unused slugs; never delete or rename an existing store.',
  );
  const examples = [];
  for (let index = 0; index < 3; index++)
    examples.push(await onboard(await user(index), 'Royal Bakery'));
  assert.deepEqual(
    examples.map((result) => result.store.slug),
    ['royal-bakery', 'royal-bakery-2', 'royal-bakery-3'],
  );
  assert.ok(examples.every((result) => result.store.name === 'Royal Bakery'));
  const actors = await Promise.all(
    Array.from({ length: 8 }, (_, index) => user(index + 3)),
  );
  const concurrent = await Promise.all(
    actors.map((actor, index) =>
      onboard(
        actor,
        ['Royal Bakery', 'ROYAL BAKERY', 'royal bakery'][index % 3],
      ),
    ),
  );
  assert.equal(
    new Set([...examples, ...concurrent].map((result) => result.store.slug))
      .size,
    11,
  );
  const sameActor = await user(users.length);
  const sameAccount = await Promise.all([
    onboard(sameActor, 'Royal Bakery'),
    onboard(sameActor, 'Royal Bakery'),
  ]);
  assert.equal(sameAccount[0].store.id, sameAccount[1].store.id);
  assert.equal(
    await db.tenantMembership.count({ where: { userId: sameActor.userId } }),
    1,
  );
  for (const name of ['admin', 'api', 'checkout', 'www']) {
    const result = await onboard(await user(users.length), name);
    assert.equal(result.store.slug, `${name}-store`);
  }
  const createdByName = await service.createStore(
    { tenantId: examples[0].tenant.id, name: 'Royal Bakery' },
    users[0],
  );
  assert.ok(createdByName.slug.startsWith('royal-bakery-'));
  await assert.rejects(
    service.createStore({
      tenantId: examples[0].tenant.id,
      name: 'Another Business',
      slug: 'admin',
    }),
    /reserved/,
  );
  const renamed = await db.store.update({
    where: { id: examples[0].store.id },
    data: { name: 'Royal Bakery & Cafe' },
  });
  assert.equal(renamed.slug, 'royal-bakery');
  await db.store.update({
    where: { id: renamed.id },
    data: { name: 'Royal Bakery' },
  });
  const suggestion = await service.suggestSlug('ROYAL BAKERY');
  assert.equal(suggestion.available, false);
  const plan = await db.plan.findFirst();
  assert.ok(plan);
  const demo = await db.store.findUnique({
    where: { slug: 'sk-general-stores' },
    include: {
      products: {
        where: { status: 'PUBLISHED' },
        include: { media: true },
        take: 1,
      },
    },
  });
  const loadStores = [];
  for (const { tenant, store } of examples) {
    await db.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 86400000),
      },
    });
    await db.store.update({
      where: { id: store.id },
      data: { status: 'LIVE', isPubliclyAccessible: true },
    });
    const product = await db.product.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        name: `${store.slug} sample`,
        slug: 'sample-item',
        status: 'PUBLISHED',
        variants: {
          create: {
            tenantId: tenant.id,
            storeId: store.id,
            sku: `${store.slug}-sample`,
            pricePaise: 10000,
            costPricePaise: 4321,
          },
        },
        media: {
          create: {
            tenantId: tenant.id,
            storeId: store.id,
            storageKey: `${tenant.id}/${store.id}/products/${run}.png`,
            filePath: `${tenant.id}/${store.id}/products/${run}.png`,
            sizeBytes: demo.products[0].media[0].sizeBytes,
            publicUrl: demo.products[0].media[0].publicUrl,
            mimeType: demo.products[0].media[0].mimeType,
            sortOrder: 0,
          },
        },
      },
    });
    loadStores.push({
      id: store.id,
      slug: store.slug,
      productId: product.id,
      productSlug: product.slug,
      productCount: 1,
    });
  }
  const api = async (url) => {
    const response = await fetch(`http://localhost:4000${url}`);
    const body = await response.json();
    return { status: response.status, data: body.data || body };
  };
  for (const store of loadStores) {
    const result = await api(`/storefront/${store.slug}`);
    assert.equal(result.status, 200);
    assert.equal(result.data.store.id, store.id);
    assert.ok(!JSON.stringify(result.data.products).includes('costPricePaise'));
    const sorted = await api(
      `/storefront/${store.slug}/products?sort=price_asc&q=sample`,
    );
    assert.equal(sorted.status, 200);
    assert.equal(sorted.data.products[0].id, store.productId);
    const other = loadStores.find((other) => other.id !== store.id);
    assert.equal(
      (await api(`/storefront/${store.slug}/products/${other.productId}`))
        .status,
      404,
    );
  }
  const privateStore = concurrent[0].store;
  assert.notEqual(
    (await api(`/storefront/${privateStore.slug}/products`)).status,
    200,
  );
  for (const known of before) assert.notEqual((await api(`/storefront/${known.slug}`)).status,404,`Existing store ${known.slug} must still resolve.`);
  const existing = await api('/storefront/sk-general-stores');
  assert.equal(existing.status, 200);
  assert.equal(existing.data.store.id, demo.id);
  const cart = await db.cart.create({
    data: {
      tenantId: examples[0].tenant.id,
      storeId: loadStores[0].id,
      guestToken: `guest_${run}`,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  assert.equal(
    (await api(`/storefront/${loadStores[1].slug}/cart/${cart.id}`)).status,
    404,
  );
  assert.equal(
    (await api(`/storefront/${loadStores[0].slug}/cart/${cart.id}`)).status,
    200,
  );
  const apiRequire = createRequire(
    new URL('../apps/api/package.json', import.meta.url),
  );
  const { JwtService } = apiRequire('@nestjs/jwt');
  const session = await db.session.create({
    data: {
      userId: users[0],
      tenantId: examples[0].tenant.id,
      storeId: loadStores[0].id,
      tokenHash: run,
      expiresAt: new Date(Date.now() + 600000),
    },
  });
  const token = new JwtService({
    secret: process.env.JWT_ACCESS_SECRET || 'default-dev-secret-change-me',
  }).sign(
    {
      sub: users[0],
      phone: examples[0].tenant.name,
      role: 'SELLER_OWNER',
      tenantId: examples[0].tenant.id,
      storeId: loadStores[0].id,
      sessionId: session.id,
    },
    { expiresIn: '10m' },
  );
  const authenticated = async (path, options = {}) =>
    fetch(`http://localhost:4000${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined ? {'Content-Type':'application/json'} : {}),
        ...options.headers,
      },
    });
  const availabilityResponse = await authenticated(
    '/stores/slug-availability?name=Royal%20Bakery',
  );
  assert.equal(availabilityResponse.status, 200);
  const availabilityBody = await availabilityResponse.json();
  assert.equal((availabilityBody.data || availabilityBody).available, false);
  assert.equal(
    (await authenticated(`/catalog/products/${loadStores[1].productId}`))
      .status,
    404,
  );
  const foreignMedia = await db.productMedia.findFirst({
    where: { productId: loadStores[1].productId },
  });
  assert.equal(
    (await authenticated(`/media/${foreignMedia.id}`, { method: 'DELETE' }))
      .status,
    404,
  );
  assert.equal((await authenticated('/seller/store/theme',{method:'PUT',body:JSON.stringify({themeCode:'atelier',configJson:{pages:{home:{heroBannerUrl:demo.products[0].media[0].publicUrl}}}})})).status,200);
  assert.equal((await authenticated('/seller/store/theme',{method:'PUT',body:JSON.stringify({configJson:{pages:{home:{heroBannerUrl:'blob:http://localhost/test'}}}})})).status,400);
  if (process.env.RUN_ONBOARDING_UI === '1') {
    const actor = await user(users.length);
    const onboardingSession = await db.session.create({
      data: {
        userId: actor.userId,
        tokenHash: `${run}-onboarding`,
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const onboardingToken = new JwtService({
      secret: process.env.JWT_ACCESS_SECRET || 'default-dev-secret-change-me',
    }).sign(
      {
        sub: actor.userId,
        phone: actor.phone,
        role: 'SELLER_OWNER',
        sessionId: onboardingSession.id,
      },
      { expiresIn: '10m' },
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
    });
    try {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      await context.addInitScript(
        ({ token, user }) => {
          localStorage.setItem('simply_seller_token', token);
          localStorage.setItem('simply_seller_user', JSON.stringify(user));
        },
        { token: onboardingToken, user: actor },
      );
      const page = await context.newPage();
      await page.goto('http://localhost:3001/onboarding', {
        waitUntil: 'networkidle',
      });
      await page.locator('#business-name').fill('Royal Bakery');
      await page
        .getByText('This URL is taken or reserved. Suggested URL:', {
          exact: true,
        })
        .waitFor();
      assert.ok(
        await page
          .getByText(/http:\/\/localhost:3000\/store\/royal-bakery-\d+/)
          .isVisible(),
      );
      await page.screenshot({
        path: `${out}/onboarding-unique-url-suggestion.png`,
        fullPage: true,
      });
      await page
        .locator('#business-name')
        .fill(`Unique Test Shop ${Date.now()}`);
      await page.getByText('✓ Available', { exact: true }).waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await context.close();
    } finally {
      await browser.close();
    }
  }
  if (process.env.RUN_PAGINATION_BROWSER === '1') {
    const extra = Array.from({ length: 105 }, (_, index) => ({
      id: randomUUID(),
      tenantId: examples[0].tenant.id,
      storeId: loadStores[0].id,
      name:
        index === 104
          ? '100% cotton pagination item'
          : `Pagination item ${index}`,
      slug: `pagination-item-${index}`,
      status: 'PUBLISHED',
      createdAt: new Date(Date.now() - (index + 1) * 1000),
    }));
    await db.product.createMany({ data: extra });
    loadStores[0].productCount = 106;
    await db.productVariant.createMany({
      data: extra.map((product, index) => ({
        tenantId: product.tenantId,
        storeId: product.storeId,
        productId: product.id,
        sku: `pagination-${index}`,
        pricePaise: 100 + index,
      })),
    });
    const home = await api(`/storefront/${loadStores[0].slug}`);
    assert.equal(home.data.products.length, 100);
    const found = [];
    for (let page = 1; page <= 6; page++) {
      const result = await api(
        `/storefront/${loadStores[0].slug}/products?page=${page}&limit=20`,
      );
      assert.equal(result.data.pagination.total, 106);
      found.push(...result.data.products.map((product) => product.id));
    }
    assert.equal(new Set(found).size, 106);
    const tail = extra.at(-1);
    assert.ok(!home.data.products.some((product) => product.id === tail.id));
    assert.equal(
      (await api(`/storefront/${loadStores[0].slug}/products/${tail.id}`)).data
        .product.id,
      tail.id,
    );
    const wildcard = await api(
      `/storefront/${loadStores[0].slug}/products?sort=price_asc&q=100%25`,
    );
    assert.equal(wildcard.data.pagination.total, 1);
    assert.equal(wildcard.data.products[0].id, tail.id);
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      await page.goto(
        `http://localhost:3000/store/${loadStores[0].slug}/products`,
        { waitUntil: 'networkidle' },
      );
      const nav = page.locator('nav[aria-busy]');
      await page.waitForFunction(() =>
        document
          .querySelector('nav[aria-busy="false"]')
          ?.textContent.includes('1 / 6'),
      );
      await nav.getByRole('button').last().click();
      await page.waitForFunction(() =>
        document
          .querySelector('nav[aria-busy="false"]')
          ?.textContent.includes('2 / 6'),
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.goto(
        `http://localhost:3000/store/${loadStores[0].slug}/product/${tail.id}`,
        { waitUntil: 'networkidle' },
      );
      assert.ok(
        await page
          .getByRole('heading', { name: tail.name, exact: true })
          .isVisible(),
      );
      await page.screenshot({
        path: `${out}/paginated-product-beyond-home-limit.png`,
        fullPage: true,
      });
    } finally {
      await browser.close();
    }
    fs.writeFileSync(
      `${out}/pagination-results.json`,
      JSON.stringify(
        {
          homeBound: 100,
          totalCatalog: 106,
          pages: 6,
          distinctProducts: found.length,
          globalPriceSearch: 'PASS',
          literalWildcardSearch: 'PASS',
          productBeyondHome: 'PASS',
          mobilePagination: 'PASS',
        },
        null,
        2,
      ),
    );
  }
  if (process.env.RUN_LOCAL_LOAD === '1') {
    const { loadStorefront } = await import('./load-storefront.mjs');
    await loadStorefront(loadStores);
  }
  const report = {
    duplicateNames: 'PASS',
    createStoreWithoutManualSlug: 'PASS',
    onboardingUI: process.env.RUN_ONBOARDING_UI === '1' ? 'PASS' : 'not run',
    authenticatedAvailability: 'PASS',
    crossTenantMediaDelete: 'PASS',
    dbUniqueSlug: 'PASS',
    reserved: 'PASS',
    concurrentCreates: concurrent.length,
    concurrency: 'PASS',
    sameAccountConcurrentSetup: 'PASS',
    displayNameChangeKeepsSlug: 'PASS',
    existingPublicUrl: 'PASS',
    privateProducts: 'PASS',
    crossStoreProduct: 'PASS',
    crossStoreCart: 'PASS',
    aliases: 'N/A: slug edits are not exposed',
    examples: examples.map((result) => ({
      name: result.store.name,
      url: getPublicStoreUrl(result.store, 'http://localhost:3000'),
    })),
    existingStores: before,
  };
  fs.writeFileSync(
    `${out}/store-identity-results.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  // Only this run's fixtures; never delete pre-existing merchants or use a DB reset.
  const memberships = await db.tenantMembership.findMany({
    where: { userId: { in: users } },
    select: { tenantId: true },
  });
  const owned = [
    ...new Set([...tenantIds, ...memberships.map((item) => item.tenantId)]),
  ];
  await db.auditLog.deleteMany({ where: { tenantId: { in: owned } } });
  await db.tenant.deleteMany({
    where: {
      id: { in: owned },
      name: {
        in: [
          'Royal Bakery',
          'ROYAL BAKERY',
          'royal bakery',
          'admin',
          'api',
          'checkout',
          'www',
        ],
      },
    },
  });
  await db.user.deleteMany({ where: { id: { in: users }, fullName: run } });
  assert.deepEqual(
    await db.store.findMany({
      where: { id: { in: before.map((store) => store.id) } },
      select: { id: true, slug: true, name: true },
  orderBy: { id: 'asc' },
    }),
    before,
  );
  await db.$disconnect();
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createTranslator } from '../packages/i18n/dist/index.js';
const base = process.env.STOREFRONT_URL || 'http://localhost:3000';
const out = 'artifacts/rail-media-identity';
const t = createTranslator('en-IN');
const product = (id) => ({
  id: `product-${id}`,
  name: `Roundtrip Product ${id.toUpperCase()}`,
  slug: `product-${id}`,
  status: 'PUBLISHED',
  mode: 'SELL_ONLINE',
  media: [],
  options: [],
  variants: [
    {
      id: `variant-${id}`,
      sku: `SKU-${id}`,
      pricePaise: 10000,
      status: 'ACTIVE',
      inventory: { stockOnHand: 100 },
      optionValues: [],
    },
  ],
});
const products = { a: product('a'), b: product('b') };
const snapshot = (storeId, token, id, items = []) => ({
  id,
  storeId,
  tenantId: `tenant-${storeId}`,
  guestToken: token,
  items,
  subtotalPaise: items.reduce(
    (sum, item) => sum + item.quantity * item.unitPricePaise,
    0,
  ),
});
const item = (id) => ({
  id: `line-${id}`,
  variantId: `variant-${id}`,
  quantity: 1,
  unitPricePaise: 10000,
  variant: { ...products[id].variants[0], product: products[id] },
});
const carts = new Map([
  ['legacy-a', snapshot('a', 'legacy-a', 'cart-a', [item('a')])],
]);
const tokens = { a: [], b: [] },
  errors = [],
  releases = [];
let holdA = false,
  foreignAttempts = 0,
  sequence = 0;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(() => {
    if (localStorage.getItem('roundtrip-seeded')) return;
    localStorage.setItem('roundtrip-seeded', 'yes');
    localStorage.setItem('simply_active_store_id', 'a');
    localStorage.setItem('simply_guest_token', 'legacy-a');
    localStorage.setItem(
      'simply_cart_a',
      JSON.stringify({
        id: 'cart-a',
        storeId: 'a',
        guestToken: 'legacy-a',
        items: [],
      }),
    );
    localStorage.setItem('simply_order_notes', 'A only');
  });
  await context.route('http://localhost:4000/**', async (route) => {
    const url = new URL(route.request().url());
    const slug = url.pathname.match(/^\/storefront\/roundtrip-([ab])$/)?.[1];
    if (slug) {
      if (slug === 'b') await new Promise((resolve) => setTimeout(resolve, 80));
      return route.fulfill({
        json: {
          success: true,
          data: {
            store: {
              id: slug,
              slug: `roundtrip-${slug}`,
              name: 'Royal Bakery',
              status: 'LIVE',
              storefrontDefaultLocale: 'en-IN',
              enabledStorefrontLocales: ['en-IN', 'mr-IN', 'hi-IN'],
              branding: {},
              paymentSettings: { codEnabled: true },
            },
            themeConfig: {
              themeId: 'atelier',
              palette: {
                primary: '#1C1917',
                accent: '#D97706',
                background: '#fff',
              },
            },
            products: [products[slug]],
            categories: [],
            shippingSettings: { flatRatePaise: 0 },
          },
        },
      });
    }
    if (url.pathname.includes('/reviews'))
      return route.fulfill({
        json: {
          success: true,
          data: {
            reviews: [],
            totalReviews: 0,
            averageRating: 0,
            distribution: {},
          },
        },
      });
    if (url.pathname === '/cart/init') {
      const body = route.request().postDataJSON();
      tokens[body.storeId]?.push(body.guestToken);
      let cart = carts.get(body.guestToken);
      if (cart && cart.storeId !== body.storeId) {
        foreignAttempts++;
        return route.fulfill({
          status: 404,
          json: { error: { message: 'Cart not found in this store.' } },
        });
      }
      if (!cart) {
        cart = snapshot(
          body.storeId,
          body.guestToken,
          `cart-${body.storeId}-${++sequence}`,
        );
        carts.set(body.guestToken, cart);
      }
      if (holdA && body.storeId === 'a')
        await new Promise((resolve) => releases.push(resolve));
      return route.fulfill({ json: { success: true, data: cart } });
    }
    const cartId = url.pathname.match(/^\/cart\/([^/]+)/)?.[1];
    const cart = [...carts.values()].find((value) => value.id === cartId);
    if (cart) {
      if (
        route.request().method() === 'POST' &&
        url.pathname.endsWith('/items')
      ) {
        const body = route.request().postDataJSON();
        assert.equal(
          body.variantId,
          `variant-${cart.storeId}`,
          'never add one shopâ€™s variant to another cart',
        );
        cart.items.push(item(cart.storeId));
        cart.subtotalPaise += 10000;
      }
      return route.fulfill({ json: { success: true, data: cart } });
    }
    return route.fulfill({ json: { success: true, data: {} } });
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/store/roundtrip-a/cart`, {
    waitUntil: 'networkidle',
  });
  await page.getByText(products.a.name, { exact: true }).first().waitFor();
  holdA = true;
  await page.goto(`${base}/store/roundtrip-b/cart`, {
    waitUntil: 'domcontentloaded',
  });
  await page
    .getByRole('heading', { name: t('storefront.emptyCart'), exact: true })
    .waitFor();
  assert.ok(
    releases.length > 0,
    'exercise a delayed response from the previous store',
  );
  holdA = false;
  releases.splice(0).forEach((release) => release());
  await page.waitForTimeout(200);
  assert.ok(
    !(await page.locator('body').innerText()).includes(products.a.name),
    'stale A response cannot replace B',
  );
  await page.goto(`${base}/store/roundtrip-b/product/${products.b.id}`, {
    waitUntil: 'networkidle',
  });
  await page.getByTestId('add-to-cart-button').click();
  await page.locator('[data-toast-key="cart-add"]').waitFor();
  await page.goto(`${base}/store/roundtrip-a/cart`, {
    waitUntil: 'networkidle',
  });
  await page.getByText(products.a.name, { exact: true }).first().waitFor();
  assert.ok(
    !(await page.locator('body').innerText()).includes(products.b.name),
  );
  await page.goto(`${base}/store/roundtrip-b/cart`, {
    waitUntil: 'networkidle',
  });
  await page.getByText(products.b.name, { exact: true }).first().waitFor();
  assert.equal(foreignAttempts, 0);
  assert.ok(
    tokens.a.every((token) => token === 'legacy-a'),
    'keep the existing buyer cart',
  );
  assert.equal(
    new Set(tokens.b).size,
    1,
    'reuse Bâ€™s independent persisted guest identity',
  );
  assert.notEqual(tokens.b[0], 'legacy-a');
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: `${out}/buyer-store-switch.png`,
    fullPage: true,
  });
  fs.writeFileSync(
    `${out}/buyer-store-switch-results.json`,
    JSON.stringify(
      {
        duplicateDisplayNames: true,
        legacyCartPreserved: 'PASS',
        roundtrip: 'A â†’ B â†’ A â†’ B: PASS',
        independentTokens: 'PASS',
        staleResponseIgnored: 'PASS',
        foreignAttempts,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    'Buyer A â†’ B â†’ A â†’ B: independent tokens, preserved legacy cart and delayed-response isolation passed.',
  );
  await context.close();
} finally {
  releases.splice(0).forEach((release) => release());
  await browser.close();
}

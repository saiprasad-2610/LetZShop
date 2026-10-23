import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const storefront = process.env.STOREFRONT_URL || 'http://localhost:3000';
const seller = process.env.SELLER_URL || 'http://localhost:3001';
const out = path.resolve(process.env.CART_ARTIFACTS || 'artifacts/production-screen4');
fs.mkdirSync(out, { recursive: true });
const svg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#e2e8f0"/><path d="M130 70 80 120 120 170 140 150V330H260V150L280 170 320 120 270 70 230 90H170Z" fill="#64748b"/></svg>');
const product = {
  id: 'notification-test-shirt', name: 'Everyday Shirt', slug: 'everyday-shirt', mode: 'SELL_ONLINE',
  status: 'PUBLISHED', description: 'A comfortable everyday shirt.', basePricePaise: 129900, minPricePaise: 129900,
  media: [{ id: 'shirt-image', publicUrl: svg }],
  options: [{ id: 'colour', name: 'Colour', values: [{ id: 'black', value: 'Black' }, { id: 'white', value: 'White' }] },
    { id: 'size', name: 'Size', values: [{ id: 'small', value: 'S' }, { id: 'large', value: 'L' }] }],
  variants: [['black-small','Black','S'],['white-large','White','L']].map(([id,colour,size]) => ({
    id, sku: id, title: colour + ' / ' + size, status: 'ACTIVE', pricePaise: 129900,
    inventory: { stockOnHand: 100, availableQuantity: 100 },
    optionValues: [{ optionValue: { value: colour, option: { name: 'Colour', sortOrder: 0 } } },
      { optionValue: { value: size, option: { name: 'Size', sortOrder: 1 } } }],
  })),
};
const fixture = {
  store: { id: 'notification-test-store', slug: 'notification-demo', name: 'Demo Store', status: 'LIVE',
    storefrontDefaultLocale: 'en-IN', enabledStorefrontLocales: ['en-IN','mr-IN','hi-IN'],
    branding: {}, shippingSettings: { flatRatePaise: 0, freeShippingThresholdPaise: null } },
  themeConfig: { themeId: 'aura', announcement: { enabled: true, text: 'Welcome to our store' } },
  products: [product], categories: [],
};
const results = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await context.route('**/auth/register/request-otp', r => r.fulfill({ json: { success: true, data: {} } }));
  await context.route('**/auth/register/verify-otp', r => {
    const body = r.request().postDataJSON();
    return r.fulfill(body.otp === '123456'
      ? { json: { success: true, data: { tempToken: 'test-registration-token' } } }
      : { status: 400, json: { success: false, error: { message: 'Invalid OTP entered. Please try again.' } } });
  });
  await context.route('**/auth/recovery/request-otp', r => r.fulfill({ json: { success: true, data: {} } }));
  await context.route('**/auth/recovery/verify-otp', r => r.fulfill({ status: 400, json: { success: false, error: { message: 'Invalid recovery OTP.' } } }));
  await page.goto(seller + '/login?mode=register');
  await page.locator('#register-phone').waitFor();
  await page.clock.install();
  const notification = page.locator('[data-action-notification]');
  const send = async () => {
    await page.locator('#register-phone').fill('9876543210');
    await page.locator('#register-email').fill('test@example.test');
    await page.getByRole('button', { name: 'Send Verification OTP', exact: true }).click();
    await notification.waitFor();
    assert.match(await notification.textContent(), /Verification code sent/);
  };
  await send();
  await page.clock.fastForward(3900);
  assert.equal(await notification.count(), 1, 'success lasts approximately four seconds');
  await page.clock.fastForward(200);
  assert.equal(await notification.count(), 0, 'success auto-dismisses');
  await page.getByRole('button', { name: 'Change Email / Mobile', exact: true }).click();
  await send();
  await page.locator('input[placeholder="••••••"]').fill('111111');
  await page.getByRole('button', { name: 'Verify Code', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-action-notification]')?.textContent.includes('Invalid OTP'));
  assert.equal(await notification.count(), 1, 'error replaces success');
  assert.doesNotMatch(await notification.textContent(), /OTP sent/);
  await page.clock.fastForward(4500);
  assert.equal(await notification.count(), 1);
  await page.getByRole('button', { name: 'Verify Code', exact: true }).click();
  await page.waitForTimeout(50);
  await page.clock.fastForward(700);
  assert.equal(await notification.count(), 1, 'repeated error resets old timer');
  await page.clock.fastForward(4400);
  assert.equal(await notification.count(), 0, 'error auto-dismisses after five seconds');
  await page.locator('input[placeholder="••••••"]').fill('123456');
  await page.getByRole('button', { name: 'Verify Code', exact: true }).click();
  await page.getByText('Add PIN for easy access', { exact: true }).waitFor();
  const pinInputs = page.locator('input[inputmode="numeric"]');
  await pinInputs.nth(0).fill('123456');
  await pinInputs.nth(1).fill('654321');
  await page.locator('form').evaluate(form => form.requestSubmit());
  await page.locator('[data-field-validation]').waitFor();
  await page.clock.fastForward(10000);
  assert.match(await page.locator('[data-field-validation]').textContent(), /do not match/);
  await page.screenshot({ path: path.join(out, 'otp-validation.png') });
  await page.goto(seller + '/login');
  await page.getByRole('button', { name: 'Forgot PIN?', exact: true }).click();
  await page.locator('input[type="tel"]').fill('9876543210');
  await page.locator('form button[type="submit"]').click();
  await notification.waitFor();
  assert.match(await notification.textContent(), /Recovery code sent|Verification code sent/);
  await page.locator('input[placeholder="••••••"]').fill('111111');
  await page.locator('form button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('[data-action-notification]')?.textContent.includes('Invalid recovery'));
  assert.equal(await notification.count(), 1);
  results.push('OTP success/error dismissal, replacement, repeated timer reset, persistent validation, and recovery: PASS');
  await context.close();

  for (const [width,height] of [[390,844],[412,915],[1440,900]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    let cart = { id: 'notification-test-cart', items: [], subtotalPaise: 0 };
    const adds = [];
    await context.route('http://localhost:4000/**', async route => {
      const url = new URL(route.request().url()), body = route.request().postDataJSON();
      if (url.pathname === '/storefront/notification-demo') return route.fulfill({ json: { success: true, data: fixture } });
      if (url.pathname.includes('/reviews')) return route.fulfill({ json: { success: true, data: { reviews: [], totalReviews: 0, averageRating: 0, breakdown: {} } } });
      if (url.pathname === '/cart/init' || url.pathname === '/cart/' + cart.id) return route.fulfill({ json: { success: true, data: cart } });
      if (url.pathname === '/cart/' + cart.id + '/items') {
        adds.push(body);
        const variant = product.variants.find(v => v.id === body.variantId);
        assert.ok(variant);
        const existing = cart.items.find(i => i.variantId === variant.id);
        if (existing) existing.quantity += body.quantity;
        else cart.items.push({ id: 'line-' + variant.id, variantId: variant.id, quantity: body.quantity,
          variant: { ...variant, product }, unitPricePaise: variant.pricePaise });
        cart.subtotalPaise = cart.items.reduce((sum,i) => sum + i.quantity * i.variant.pricePaise, 0);
        return route.fulfill({ json: { success: true, data: cart } });
      }
      return route.fulfill({ json: { success: true, data: {} } });
    });
    const page = await context.newPage();
    await page.goto(storefront + '/store/notification-demo/product/' + product.id);
    await page.getByRole('button', { name: 'White', exact: true }).click();
    await page.getByRole('button', { name: 'L', exact: true }).click();
    await page.locator('button:has(svg.lucide-plus)').first().click();
    const floating = page.locator('[data-mobile-cart]');
    if (width < 768) {
      assert.ok(await floating.isVisible(), 'mobile cart visible');
      const r = await floating.boundingBox();
      assert.ok(r.width >= 44 && r.height >= 44);
    } else assert.equal(await floating.isVisible(), false);
    await page.clock.install();
    await page.getByTestId('add-to-cart-button').click();
    const toast = page.locator('[data-toast-key="cart-add"]');
    await toast.waitFor();
    assert.deepEqual(adds.at(-1), { variantId: 'white-large', quantity: 2 });
    if (width < 768) assert.equal(await floating.locator('[data-cart-count]').textContent(), '2');
    await page.clock.runFor(2000);
    await page.getByTestId('add-to-cart-button').click();
    await page.waitForFunction(() => document.querySelector('[data-cart-count]')?.textContent === '4' || innerWidth >= 768);
    assert.equal(await toast.count(), 1, 'repeated adds use one toast');
    await page.clock.runFor(1100);
    assert.equal(await toast.count(), 1, 'repeated adds refresh toast timer');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    const geometry = await page.evaluate(() => {
      const t = document.querySelector('[data-toast-key="cart-add"]').getBoundingClientRect();
      const h = document.querySelector('[data-storefront-header]').getBoundingClientRect();
      const f = document.querySelector('[data-mobile-cart]').getBoundingClientRect();
      return { toast: { top:t.top,bottom:t.bottom }, headerBottom:h.bottom, cartTop:f.top, overflow:document.documentElement.scrollWidth>innerWidth };
    });
    assert.ok(geometry.toast.top >= geometry.headerBottom, 'toast below navigation');
    assert.ok(geometry.toast.top < height / 3, 'toast near viewport top');
    if (width < 768) assert.ok(geometry.toast.bottom < geometry.cartTop, 'toast clear of cart');
    assert.equal(geometry.overflow, false);
    await page.screenshot({ path: path.join(out, 'cart-toast-' + width + '.png') });
    await page.clock.runFor(2100);
    assert.equal(await toast.count(), 0, 'toast auto-dismisses around three seconds after latest add');
    if (width < 768) await floating.click();
    else await page.locator('[data-storefront-header] a[href$="/cart"]').first().click();
    await page.waitForURL('**/store/notification-demo/cart');
    await page.getByText('Everyday Shirt', { exact:true }).first().waitFor();
    assert.match(await page.locator('body').textContent(), /White/);
    assert.match(await page.locator('body').textContent(), /Everyday Shirt/);
    assert.equal(cart.items[0].quantity, 4);
    assert.equal(cart.items[0].variantId, 'white-large');
    await page.reload();
    await page.getByText('Everyday Shirt', { exact: true }).first().waitFor();
    results.push('Cart, variant, quantity, navigation, top toast and replacement at ' + width + 'x' + height + ': PASS');
    await context.close();
  }

  const themes = ['atelier','pulse','harvest','foundry','habitat','local','feast','aura','noir','vista','horizon','canvas'];
  const context2 = await browser.newContext({ viewport: { width:390,height:844 } });
  const page2 = await context2.newPage();
  let theme = 'atelier';
  await context2.route('http://localhost:4000/**', route => {
    const url = new URL(route.request().url());
    return route.fulfill({ json: { success:true, data: url.pathname.startsWith('/storefront/')
      ? { ...fixture, pagination: { page:1, limit:20, total:1, totalPages:1 }, themeConfig: { ...fixture.themeConfig, themeId:theme } } : { id:'theme-cart',items:[],subtotalPaise:0 } } });
  });
  for (theme of themes) {
    await page2.goto(storefront + '/store/notification-demo/products');
    await page2.locator('[data-mobile-cart]').waitFor();
    assert.ok(await page2.locator('[data-mobile-cart]').isVisible());
    assert.equal(await page2.locator('[data-mobile-cart]').getAttribute('href'), '/store/notification-demo/cart');
    assert.equal(await page2.evaluate(() => document.documentElement.scrollWidth>innerWidth), false, theme + ' overflow');
    results.push(theme + ' shared mobile cart: PASS');
  }
  await context2.close();
  fs.writeFileSync(path.join(out,'phase-a-results.json'),JSON.stringify(results,null,2));
  console.log(results.join('\n'));
} finally { await browser.close(); }

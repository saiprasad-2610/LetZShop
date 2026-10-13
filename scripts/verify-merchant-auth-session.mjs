import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

process.loadEnvFile('.env');
const sellerUrl = 'http://localhost:3001';
const apiUrl = 'http://localhost:4000';
const keys = ['simply_seller_token', 'simply_seller_refresh_token', 'simply_seller_user', 'simply_seller_store'];
const results = {};
const createdSessions = [];
const check = (name, value) => {
  assert.ok(value, name);
  results[name] = true;
  console.log(`PASS ${name}`);
};
const api = async (path, { token, body, method = body ? 'POST' : 'GET' } = {}) => {
  const res = await fetch(`${apiUrl}/${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, data: json.data || json };
};
const login = async (phone = '+919876543210') => {
  const result = await api('auth/pin/login', { body: { phone, pin: '654321' } });
  assert.equal(result.status, 200, 'PIN login');
  createdSessions.push(result.data.accessToken);
  return result.data;
};
const sign = (payload, secret = process.env.JWT_ACCESS_SECRET) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
};
const claims = token => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
const installSession = async (page, data, token = data.accessToken, refresh = data.refreshToken) => {
  await page.goto(`${sellerUrl}/login`);
  await page.locator('#login-pin').waitFor();
  await page.evaluate(({ data, token, refresh, keys }) => {
    for (const key of keys) localStorage.removeItem(key);
    if (token) localStorage.setItem(keys[0], token);
    if (refresh) localStorage.setItem(keys[1], refresh);
    localStorage.setItem(keys[2], JSON.stringify(data.user));
    localStorage.setItem(keys[3], JSON.stringify(data.store));
  }, { data, token, refresh, keys });
};
const waitDashboard = async page => {
  await page.waitForURL(`${sellerUrl}/`, { timeout: 30000 });
  await page.getByRole('heading', { name: /^Welcome back,/ }).waitFor();
};
const waitLogin = async page => {
  await page.waitForURL(/\/login(?:\?|$)/, { timeout: 30000 });
  await page.locator('#login-pin').waitFor();
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const [path, method] of [
    ['seller/dashboard', 'GET'], ['seller/orders', 'GET'], ['stores/my-store', 'GET'],
    ['seller/products', 'POST'], ['subscriptions/current', 'GET'], ['subscriptions/create-order', 'POST'],
    ['stores/my-store/preview-token', 'POST'], ['catalog/products', 'POST'],
  ]) {
    check(`no JWT ${method} /${path} => 401`, (await api(path, { method, body: method === 'POST' ? {} : undefined })).status === 401);
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await context.newPage();
  await page.goto(`${sellerUrl}/`);
  await waitLogin(page);
  check('fresh Chrome direct root requires PIN', true);
  for (const path of ['/store-preview', '/products', '/orders', '/analytics', '/brand-studio', '/more', '/subscription', '/settings', '/marketing', '/themes', '/onboarding']) {
    await page.goto(`${sellerUrl}${path}`);
    await waitLogin(page);
    check(`fresh Chrome protects ${path}`, true);
  }
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Merchant Login', exact: true }).first().click();
  await waitLogin(page);
  check('fresh Merchant Login opens PIN screen', true);
  await page.getByRole('textbox', { name: /mobile/i }).fill('9876543210');
  await page.locator('#login-pin').fill('654321');
  await page.getByRole('button', { name: 'Log In to Dashboard', exact: true }).click();
  await waitDashboard(page);
  check('correct mobile and six-digit PIN opens dashboard', true);
  const saved = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), keys);
  assert.ok(saved[keys[0]] && saved[keys[1]]);
  createdSessions.push(saved[keys[0]]);
  const payload = claims(saved[keys[0]]);
  check('JWT lifetime is 900 seconds', payload.exp - payload.iat === 900);
  console.log(JSON.stringify({ claimNames: Object.keys(payload), storageKeys: keys, accessExpirySeconds: payload.exp - payload.iat }));
  await page.reload();
  await waitDashboard(page);
  check('browser refresh retains validated session', true);
  await page.close();
  page = await context.newPage();
  await page.goto(`${sellerUrl}/`);
  await waitDashboard(page);
  check('close and reopen tab retains session', true);
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Merchant Login', exact: true }).first().click();
  await waitDashboard(page);
  check('existing validated session Merchant Login opens dashboard', true);
  if (process.argv.includes('--restart-check')) {
    console.log('READY_FOR_SELLER_RESTART');
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    process.stdin.pause();
    await page.reload();
    await waitDashboard(page);
    check('frontend server restart retains the validated browser session', true);
  }
  await page.getByRole('button', { name: 'Logout', exact: true }).first().click();
  await waitLogin(page);
  check('logout clears all four local auth keys', await page.evaluate(keys => keys.every(key => !localStorage.getItem(key)), keys));
  check('logout revokes old JWT', (await api('seller/dashboard', { token: saved[keys[0]] })).status === 401);
  check('logout revokes old refresh token', (await api('auth/session/refresh', { body: { refreshToken: saved[keys[1]] } })).status === 401);
  await page.reload();
  await waitLogin(page);
  check('hard refresh after logout stays logged out', true);
  await page.goto(`${sellerUrl}/`);
  await waitLogin(page);
  check('root after logout requires PIN', true);
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Merchant Login', exact: true }).first().click();
  await waitLogin(page);
  check('Merchant Login after logout requires PIN', true);
  const loggedOutState = await context.storageState();
  await context.close();
  const reopened = await browser.newContext({ storageState: loggedOutState });
  page = await reopened.newPage();
  await page.goto(`${sellerUrl}/`);
  await waitLogin(page);
  check('reopened browser state after logout requires PIN', true);
  await reopened.close();

  const data = await login();
  const decoded = claims(data.accessToken);
  const expired = sign({ ...decoded, exp: Math.floor(Date.now() / 1000) - 60 });
  const parts = data.accessToken.split('.');
  const tampered = `${parts[0]}.${Buffer.from(JSON.stringify({ ...decoded, role: 'PLATFORM_ADMIN' })).toString('base64url')}.${parts[2]}`;
  for (const [name, token] of [['invalid', 'invalid-jwt'], ['expired', expired], ['tampered', tampered], ['wrong signing secret', sign(decoded, 'wrong-test-signing-secret')]]) {
    check(`${name} JWT rejected by API`, (await api('seller/dashboard', { token })).status === 401);
  }

  const second = await login('+919876501234');
  const ownStore = await api(`stores/my-store?tenantId=${second.user.tenantId}&storeId=${second.store.id}&slug=${second.store.slug}`, { token: data.accessToken });
  check('foreign query tenant/store/slug cannot override authenticated store', ownStore.status === 200 && ownStore.data.id === data.store.id);
  const products = await api('seller/products', { token: second.accessToken });
  const productId = (products.data.items || products.data.products || products.data)[0]?.id;
  assert.ok(productId, 'seeded second merchant product exists');
  check('Seller A cannot read Seller B product ID', [403, 404].includes((await api(`seller/products/${productId}`, { token: data.accessToken })).status));

  const edgeContext = await browser.newContext();
  page = await edgeContext.newPage();
  await installSession(page, data, expired);
  await page.goto(`${sellerUrl}/`);
  await waitDashboard(page);
  const rotated = await page.evaluate(keys => ({ access: localStorage.getItem(keys[0]), refresh: localStorage.getItem(keys[1]) }), keys);
  check('expired access plus valid refresh restores dashboard and rotates tokens', rotated.access !== expired && rotated.refresh !== data.refreshToken);
  check('previous refresh token cannot be replayed', (await api('auth/session/refresh', { body: { refreshToken: data.refreshToken } })).status === 401);
  // Expire the access JWT after restoration so logout itself must refresh.
  await page.route('**/auth/logout', async route => {
    const headers = { ...route.request().headers(), authorization: `Bearer ${expired}` };
    await route.continue({ headers });
  }, { times: 1 });
  await page.getByRole('button', { name: 'Logout', exact: true }).first().click();
  await waitLogin(page);
  check('expired-access logout clears storage', await page.evaluate(keys => keys.every(key => !localStorage.getItem(key)), keys));
  check('expired-access logout revokes server session', (await api('seller/dashboard', { token: rotated.access })).status === 401);
  check('expired-access logout revokes refresh session', (await api('auth/session/refresh', { body: { refreshToken: rotated.refresh } })).status === 401);

  const invalidData = await login();
  await installSession(page, invalidData, sign({ ...claims(invalidData.accessToken), exp: 1 }), 'invalid-refresh');
  await page.goto(`${sellerUrl}/`);
  await waitLogin(page);
  check('expired access plus invalid refresh clears auth and requires PIN', await page.evaluate(keys => keys.every(key => !localStorage.getItem(key)), keys));
  const refreshOnly = await login();
  await installSession(page, refreshOnly, null);
  await page.goto(`${sellerUrl}/`);
  await waitDashboard(page);
  check('refresh-only valid session restores authenticated identity', true);
  await page.getByRole('button', { name: 'Logout', exact: true }).first().click();
  await waitLogin(page);

  const offlineData = await login();
  await installSession(page, offlineData);
  await page.route('**/auth/me', route => route.abort());
  await page.goto(`${sellerUrl}/`);
  await waitLogin(page);
  check('network failure cannot authorize cached merchant identity', await page.locator('aside').count() === 0);
  await page.unroute('**/auth/me');
  await edgeContext.close();
  console.log(JSON.stringify({ passed: Object.keys(results).length, results }, null, 2));
} finally {
  for (const token of createdSessions) await api('auth/logout', { token, method: 'POST' }).catch(() => {});
  await browser.close();
}

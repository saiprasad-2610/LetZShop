import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';
import { probeHttp, waitForServicesReady } from './dev-service-health.mjs';

async function serve(t, handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  return server.address().port;
}

test('a cold frontend response can take longer than the old 1.2 second probe limit', async (t) => {
  const port = await serve(t, (_req, res) => {
    setTimeout(() => res.end('compiled login page'), 1500);
  });
  const result = await probeHttp(port, '/login');
  assert.equal(result.ready, true);
  assert.equal(result.statusCode, 200);
});

test('a stuck request is bounded and reports its timeout', async (t) => {
  const port = await serve(t, () => {});
  const result = await probeHttp(port, '/', 100);
  assert.equal(result.ready, false);
  assert.match(result.error, /timed out/);
});

test('valid pages and redirects pass, while missing or broken pages fail', async (t) => {
  const port = await serve(t, (req, res) => {
    res.statusCode = Number(req.url.slice(1));
    res.end('response');
  });
  for (const status of [200, 302])
    assert.equal((await probeHttp(port, '/' + status)).ready, true);
  for (const status of [404, 500, 503])
    assert.equal((await probeHttp(port, '/' + status)).ready, false);
});

test('large HTML health responses complete without accumulating unread response bodies', async (t) => {
  const port = await serve(t, (_req, res) => res.end('x'.repeat(256 * 1024)));
  for (let n = 0; n < 5; n++) assert.equal((await probeHttp(port)).ready, true);
});

test('active services are probed in parallel and inactive profiles are skipped', async (t) => {
  const responses = [];
  const paths = [];
  const port = await serve(t, (req, res) => {
    paths.push(req.url);
    responses.push(res);
    if (responses.length === 2)
      responses.forEach((response) => response.end('ready'));
  });
  const result = await waitForServicesReady(
    { seller: true, platform: true, admin: false },
    {
      timeoutMs: 2000,
      definitions: {
        seller: { port, pathname: '/login', requestTimeoutMs: 1000 },
        platform: { port, pathname: '/', requestTimeoutMs: 1000 },
      },
    },
  );
  assert.equal(result.ready, true);
  assert.deepEqual(result.pending, []);
  assert.deepEqual(paths.sort(), ['/', '/login']);
});

test('startup timeout identifies only the service still failing and retains its HTTP status', async (t) => {
  const port = await serve(t, (req, res) => {
    res.statusCode = req.url === '/ready' ? 200 : 503;
    res.end();
  });
  const progress = [];
  const result = await waitForServicesReady(
    { api: true, seller: true },
    {
      timeoutMs: 150,
      pollIntervalMs: 10,
      progressIntervalMs: 20,
      onProgress: (update) => progress.push(update),
      definitions: {
        api: { port, pathname: '/ready', requestTimeoutMs: 1000 },
        seller: { port, pathname: '/unready', requestTimeoutMs: 1000 },
      },
    },
  );
  assert.equal(result.ready, false);
  assert.deepEqual(result.pending, ['seller']);
  assert.equal(result.results.seller.statusCode, 503);
  assert.ok(
    progress.some(
      (update) => update.pending.length === 1 && update.pending[0] === 'seller',
    ),
  );
});

test('the overall startup deadline also bounds an in-flight probe', async (t) => {
  const port = await serve(t, () => {});
  const result = await waitForServicesReady(
    { platform: true },
    {
      timeoutMs: 100,
      definitions: {
        platform: { port, pathname: '/', requestTimeoutMs: 15000 },
      },
    },
  );
  assert.equal(result.ready, false);
  assert.deepEqual(result.pending, ['platform']);
  assert.match(result.results.platform.error, /timed out/);
});

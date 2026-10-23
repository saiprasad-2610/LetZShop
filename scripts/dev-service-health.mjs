import http from 'node:http';

export const DEV_SERVICES = {
  api: {
    label: 'API',
    port: 4000,
    pathname: '/health',
    requestTimeoutMs: 3000,
  },
  seller: {
    label: 'Merchant Portal',
    port: 3001,
    pathname: '/login',
    requestTimeoutMs: 15000,
  },
  platform: {
    label: 'Storefront',
    port: 3000,
    pathname: '/',
    requestTimeoutMs: 15000,
  },
  admin: {
    label: 'Admin Portal',
    port: 3002,
    pathname: '/login',
    requestTimeoutMs: 15000,
  },
};

export function probeHttp(port, pathname = '/', timeoutMs = 15000) {
  return new Promise((resolve) => {
    let settled = false;
    let timer;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const req = http.get(
      { hostname: '127.0.0.1', port, path: pathname, agent: false },
      (res) => {
        // Drain HTML responses so repeated startup/status probes release their sockets.
        res.on('error', () => {});
        res.resume();
        finish({
          ready:
            res.statusCode >= 200 &&
            res.statusCode < (port === 4000 ? 300 : 400),
          statusCode: res.statusCode,
        });
      },
    );
    req.on('error', (error) =>
      finish({ ready: false, error: error.code || error.message }),
    );
    // Bound the entire request, including connection establishment and cold compilation.
    timer = setTimeout(() => {
      finish({
        ready: false,
        error: 'Request timed out after ' + timeoutMs + 'ms',
      });
      req.destroy();
    }, timeoutMs);
  });
}

export async function checkPortReady(port, pathname = '/', timeoutMs = 15000) {
  return (await probeHttp(port, pathname, timeoutMs)).ready;
}

export async function waitForServicesReady(
  active,
  {
    timeoutMs = 300000,
    pollIntervalMs = 600,
    progressIntervalMs = 15000,
    onProgress = () => {},
    definitions = DEV_SERVICES,
  } = {},
) {
  const started = Date.now();
  const pending = new Set(Object.keys(active).filter((name) => active[name]));
  const results = {};
  let lastProgress = started;
  onProgress({ pending: [...pending], results: { ...results }, elapsedMs: 0 });

  while (pending.size && Date.now() - started < timeoutMs) {
    const previousSize = pending.size;
    await Promise.all(
      [...pending].map(async (name) => {
        const service = definitions[name];
        const remaining = timeoutMs - (Date.now() - started);
        if (remaining <= 0) return;
        results[name] = await probeHttp(
          service.port,
          service.pathname,
          Math.min(service.requestTimeoutMs, remaining),
        );
        if (results[name].ready) pending.delete(name);
      }),
    );
    const now = Date.now();
    if (
      pending.size !== previousSize ||
      now - lastProgress >= progressIntervalMs
    ) {
      onProgress({
        pending: [...pending],
        results: { ...results },
        elapsedMs: now - started,
      });
      lastProgress = now;
    }
    if (pending.size) {
      const remaining = timeoutMs - (Date.now() - started);
      if (remaining > 0)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(pollIntervalMs, remaining)),
        );
    }
  }
  return { ready: pending.size === 0, pending: [...pending], results };
}

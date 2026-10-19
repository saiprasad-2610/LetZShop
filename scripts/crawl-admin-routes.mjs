// scripts/crawl-admin-routes.mjs
import http from 'node:http';

const routes = [
  { path: '/login', expectedStatus: [200] },
  { path: '/', expectedStatus: [200, 307, 302] },
  { path: '/orders', expectedStatus: [200, 307, 302] },
  { path: '/commerce', expectedStatus: [307, 308, 302, 200] },
  { path: '/analytics', expectedStatus: [200, 307, 302] },
  { path: '/sub-admins', expectedStatus: [200, 307, 302] },
  { path: '/change-password', expectedStatus: [200, 307, 302] },
  { path: '/merchants', expectedStatus: [200, 307, 302] },
  { path: '/reviews', expectedStatus: [200, 307, 302] },
  { path: '/subscriptions', expectedStatus: [200, 307, 302] },
  { path: '/payments', expectedStatus: [200, 307, 302] },
  { path: '/users', expectedStatus: [200, 307, 302] },
  { path: '/settings', expectedStatus: [200, 307, 302] },
  { path: '/audit-logs', expectedStatus: [200, 307, 302] },
  { path: '/themes', expectedStatus: [200, 307, 302] },
  { path: '/operations', expectedStatus: [200, 307, 302] },
];

function fetchRoute(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3002${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          location: res.headers.location,
          bodySnippet: body.slice(0, 150),
        });
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${path}`));
    });
  });
}

async function main() {
  console.log('Crawling Admin routes on http://localhost:3002...\n');
  const results = [];
  let allPass = true;

  for (const r of routes) {
    try {
      const res = await fetchRoute(r.path);
      const isExpected = r.expectedStatus.includes(res.statusCode);
      if (!isExpected) allPass = false;

      results.push({
        route: r.path,
        status: res.statusCode,
        redirectLocation: res.location || '—',
        result: isExpected ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      allPass = false;
      results.push({
        route: r.path,
        status: 'ERROR',
        redirectLocation: err.message,
        result: 'FAIL',
      });
    }
  }

  console.table(results);

  if (!allPass) {
    console.error('\n❌ Route crawl failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All Admin routes crawled successfully without errors (200 / valid redirects)!');
  }
}

main();

/**
 * Simply E-Commerce - Developer Startup & Health Verification Script
 * Validates that all 4 platform services are up, healthy, and genuinely reachable.
 */

interface ServiceEndpoint {
  name: string;
  url: string;
  expectedStatus: number[];
  critical: boolean;
}

const SERVICES: ServiceEndpoint[] = [
  { name: 'API Server', url: 'http://localhost:4000/health', expectedStatus: [200], critical: true },
  { name: 'Public Storefront', url: 'http://localhost:3000', expectedStatus: [200, 307, 308], critical: true },
  { name: 'Seller Operations Portal', url: 'http://localhost:3001', expectedStatus: [200, 307, 308], critical: true },
  { name: 'Platform Admin', url: 'http://localhost:3002', expectedStatus: [200, 307, 308], critical: true },
];

async function checkService(service: ServiceEndpoint): Promise<{ success: boolean; status?: number; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(service.url, { signal: controller.signal, redirect: 'manual' });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (service.expectedStatus.includes(res.status)) {
      return { success: true, status: res.status, latencyMs };
    }
    return { success: false, status: res.status, latencyMs, error: `Unexpected status code: ${res.status}` };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return { success: false, latencyMs, error: err.message || 'Connection refused / Unreachable' };
  }
}

async function runHealthCheck() {
  console.log('\n=============================================================');
  console.log('  SIMPLY E-COMMERCE — DEVELOPER STARTUP HEALTH CHECK');
  console.log('=============================================================\n');

  let allPassed = true;

  for (const service of SERVICES) {
    const result = await checkService(service);
    if (result.success) {
      console.log(`  ✓ [UP]  ${service.name.padEnd(26)} -> ${service.url} (Status: ${result.status}, ${result.latencyMs}ms)`);
    } else {
      console.log(`  ✗ [DOWN] ${service.name.padEnd(25)} -> ${service.url} (Error: ${result.error})`);
      if (service.critical) {
        allPassed = false;
      }
    }
  }

  console.log('\n-------------------------------------------------------------');
  if (allPassed) {
    console.log('  STATUS: ALL SERVICES HEALTHY & REACHABLE');
    console.log('  • API:        http://localhost:4000 (Swagger: /api/docs)');
    console.log('  • Storefront: http://localhost:3000');
    console.log('  • Seller:     http://localhost:3001');
    console.log('  • Admin:      http://localhost:3002');
  } else {
    console.log('  STATUS: ONE OR MORE SERVICES NOT REACHABLE');
    console.log('  Ensure `pnpm dev` has completed initial compilation.');
  }
  console.log('=============================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runHealthCheck().catch((err) => {
  console.error('Fatal health check error:', err);
  process.exit(1);
});

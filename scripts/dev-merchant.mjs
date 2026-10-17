import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const rootEnvPath = path.resolve(rootDir, '.env');
if (fs.existsSync(rootEnvPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(rootEnvPath);
  } catch {}
}
const PID_FILE = path.resolve(rootDir, '.simply-dev-processes.json');

const CANONICAL_PORTS = [4000, 3001, 3000, 3002];

// --- Process Inspection Utilities ---

export function getPortPid(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano -p tcp', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 4000
      });
      for (const line of out.split(/\r?\n/)) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (pid && !isNaN(pid)) return pid;
        }
      }
    } else {
      const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 4000
      });
      const pid = parseInt(out.trim(), 10);
      if (pid && !isNaN(pid)) return pid;
    }
  } catch {}
  return null;
}

export function getProcessInfo(pid) {
  if (!pid) return { pid, name: 'unknown' };
  try {
    if (process.platform === 'win32') {
      const out = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 4000
      });
      const line = out.trim().split(/\r?\n/)[0];
      if (line && line.includes(',')) {
        const parts = line.split(',').map((s) => s.replace(/"/g, ''));
        return { pid, name: parts[0] || 'unknown' };
      }
    } else {
      const out = execSync(`ps -p ${pid} -o comm=`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 4000
      });
      return { pid, name: out.trim() || 'unknown' };
    }
  } catch {}
  return { pid, name: 'unknown' };
}

export function getProcessCommandLine(pid) {
  if (!pid) return '';
  try {
    if (process.platform === 'win32') {
      const out = execSync(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId = ${pid}\\").CommandLine"`,
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 4000
        }
      );
      return out.trim();
    } else {
      const out = execSync(`ps -p ${pid} -o args=`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 4000
      });
      return out.trim();
    }
  } catch {
    return '';
  }
}

export function isSimplyProcess(pid, cmdLine = null) {
  if (!pid) return false;
  const line = (cmdLine !== null ? cmdLine : getProcessCommandLine(pid)).toLowerCase();
  if (!line) return false;
  return (
    line.includes('simply') ||
    line.includes('apps/api') ||
    line.includes('apps/seller') ||
    line.includes('apps/storefront') ||
    line.includes('apps/admin') ||
    line.includes('apps\\api') ||
    line.includes('apps\\seller') ||
    line.includes('apps\\storefront') ||
    line.includes('apps\\admin') ||
    line.includes('dev-merchant') ||
    line.includes('dist/main') ||
    line.includes('dist\\main')
  );
}

export function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore', timeout: 5000 });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {}
}

export async function verifyPortsReleased(ports = CANONICAL_PORTS, timeoutMs = 4000, trackedPids = new Set()) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let allFree = true;
    for (const port of ports) {
      const pid = getPortPid(port);
      if (pid !== null) {
        allFree = false;
        if (trackedPids.has(pid)) {
          killProcessTree(pid);
        }
      }
    }
    if (allFree) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return ports.every((p) => getPortPid(p) === null);
}

// --- Stale Process & Registry Cleanup ---

export function cleanStaleProcesses() {
  if (!fs.existsSync(PID_FILE)) return;
  try {
    const raw = fs.readFileSync(PID_FILE, 'utf8');
    const data = JSON.parse(raw);
    const pidsToInspect = [];

    if (data.launcherPid) pidsToInspect.push(data.launcherPid);
    if (data.services) {
      for (const key of Object.keys(data.services)) {
        const s = data.services[key];
        if (typeof s === 'number') {
          pidsToInspect.push(s);
        } else if (s && typeof s === 'object') {
          if (s.rootPid) pidsToInspect.push(s.rootPid);
          if (s.listeningPid) pidsToInspect.push(s.listeningPid);
        }
      }
    }

    const uniquePids = [...new Set(pidsToInspect)].filter((p) => p && p !== process.pid);

    for (const pid of uniquePids) {
      try {
        process.kill(pid, 0);
      } catch {
        continue; // Process no longer exists
      }

      // Verify before killing to avoid PID-reuse killing an unrelated app
      if (isSimplyProcess(pid)) {
        killProcessTree(pid);
      }
    }
  } catch {}

  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch {}
}

// --- Database & Port Preflight ---

async function checkDatabase() {
  try {
    const prismaPath = require.resolve('@prisma/client', { paths: ['./apps/api'] });
    const { PrismaClient } = require(prismaPath);
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect().catch(() => {});
    return true;
  } catch (err) {
    console.error('\nSIMPLY E-COMMERCE — STARTUP BLOCKED\n');
    console.error('✗ Database connection failed');
    console.error(err.message || err);
    return false;
  }
}

async function checkPortPreflight(ports = CANONICAL_PORTS) {
  for (const port of ports) {
    const pid = getPortPid(port);
    if (pid) {
      const cmdLine = getProcessCommandLine(pid);
      const procInfo = getProcessInfo(pid);

      // If it belongs to a previous Simply process, clean it safely
      if (isSimplyProcess(pid, cmdLine)) {
        console.log(`Cleaning previous Simply process (PID ${pid}) on port ${port}...`);
        killProcessTree(pid);
        const free = await verifyPortsReleased([port], 3000);
        if (!free) {
          console.error(`Failed to release port ${port} from PID ${pid}`);
          return false;
        }
        continue;
      }

      // UNKNOWN / EXTERNAL process: DO NOT KILL IT
      console.error('\n==================================================');
      console.error(`ERROR:`);
      console.error(`Port ${port} is already occupied by PID ${pid}.\n`);
      console.error(`Process:`);
      console.error(`${procInfo.name}\n`);
      console.error(`Command:`);
      console.error(`${cmdLine || '(not available)'}\n`);
      console.error(`This process was not started by the Simply development launcher.\n`);
      console.error(`Please stop it manually or choose the correct development command.`);
      console.error('==================================================\n');
      return false;
    }
  }
  return true;
}

// --- Health Checking ---

function checkPortReady(port, pathname = '/') {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}${pathname}`, (res) => {
      if (port === 4000) {
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      } else {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServicesReady(
  services = { api: true, seller: true, platform: true, admin: false },
  timeoutMs = 120000
) {
  const start = Date.now();
  let apiReady = !services.api;
  let sellerReady = !services.seller;
  let platformReady = !services.platform;
  let adminReady = !services.admin;

  while (Date.now() - start < timeoutMs) {
    if (!apiReady) apiReady = await checkPortReady(4000, '/health');
    if (!sellerReady) sellerReady = await checkPortReady(3001, '/');
    if (!platformReady) platformReady = await checkPortReady(3000, '/');
    if (!adminReady) adminReady = await checkPortReady(3002, '/login');

    if (apiReady && sellerReady && platformReady && adminReady) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

// --- CLI Commands: --status and --stop ---

async function handleStatus() {
  console.log('\n==================================================');
  console.log('SIMPLY / LETZSHOP DEVELOPMENT STATUS');
  console.log('==================================================');

  let launcherPid = null;
  if (fs.existsSync(PID_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
      launcherPid = data.launcherPid;
    } catch {}
  }

  const isLauncherAlive = Boolean(launcherPid && (() => {
    try { process.kill(launcherPid, 0); return true; } catch { return false; }
  })());

  console.log(`Launcher:   ${isLauncherAlive ? `Active (PID ${launcherPid})` : 'Offline'}\n`);

  const [apiOk, sellerOk, platformOk, adminOk] = await Promise.all([
    checkPortReady(4000, '/health'),
    checkPortReady(3001, '/'),
    checkPortReady(3000, '/'),
    checkPortReady(3002, '/login')
  ]);

  const apiPid = getPortPid(4000);
  const sellerPid = getPortPid(3001);
  const platformPid = getPortPid(3000);
  const adminPid = getPortPid(3002);

  console.log(`API         (Port 4000, PID ${apiPid || 'None'}): ${apiOk ? '✓ Healthy' : '✗ Offline'}`);
  console.log(`Seller      (Port 3001, PID ${sellerPid || 'None'}): ${sellerOk ? '✓ Healthy' : '✗ Offline'}`);
  console.log(`Storefront  (Port 3000, PID ${platformPid || 'None'}): ${platformOk ? '✓ Healthy' : '✗ Offline'}`);
  console.log(`Admin       (Port 3002, PID ${adminPid || 'None'}): ${adminOk ? '✓ Healthy' : '✗ Offline'}`);
  console.log('==================================================\n');
  process.exit(0);
}

async function handleStop() {
  console.log('\nStopping Simply development services...');
  cleanStaleProcesses();

  // Also clean any Simply processes currently listening on canonical ports
  for (const port of CANONICAL_PORTS) {
    const pid = getPortPid(port);
    if (pid && isSimplyProcess(pid)) {
      killProcessTree(pid);
    }
  }

  const free = await verifyPortsReleased(CANONICAL_PORTS, 4000);
  if (fs.existsSync(PID_FILE)) {
    try { fs.unlinkSync(PID_FILE); } catch {}
  }

  console.log('✓ API stopped');
  console.log('✓ Merchant Portal stopped');
  console.log('✓ Storefront stopped');
  console.log('✓ Admin Portal stopped');
  if (free) {
    console.log('✓ Ports released (4000, 3001, 3000, 3002)');
  } else {
    console.log('⚠ Ports released with delay');
  }
  console.log('Done.\n');
  process.exit(0);
}

// --- Noise Filtering ---

const stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

function isNoise(line) {
  const raw = stripAnsi(line).trim();
  if (!raw) return true;

  if (raw === '@simply/seller:dev:' || raw === '@simply/storefront:dev:' || raw === '@simply/api:dev:' || raw === '@simply/admin:dev:') {
    return true;
  }

  const content = raw.replace(/^(@simply\/[a-z]+:dev:|\$ next dev|\$ nest start)\s*/, '').trim();
  if (!content) return true;

  if (
    content.startsWith('npm warn') ||
    content.startsWith('• turbo') ||
    content.startsWith('• Packages in scope') ||
    content.startsWith('• Running dev in') ||
    content.startsWith('• Remote caching') ||
    content.includes('cache bypass, force executing') ||
    content.includes('Starting...')
  ) {
    return true;
  }

  if (
    content.includes('[RouterExplorer] Mapped') ||
    content.includes('[RoutesResolver]') ||
    content.includes('[InstanceLoader]') ||
    content.includes('[NestFactory] Starting Nest application') ||
    content.includes('[NestApplication] Nest application successfully started') ||
    content.includes('Swagger OpenAPI documentation available') ||
    content.includes('Server listening at http')
  ) {
    return true;
  }

  if (
    content.includes('"msg":"incoming request"') ||
    content.includes('"msg":"request completed"') ||
    content.includes('"level":30')
  ) {
    return true;
  }

  if (
    /\b(GET|POST|HEAD|OPTIONS)\s+.*\s+(200|304)\s+in/i.test(content) ||
    content.includes(' 200 in') ||
    content.includes(' 304 in') ||
    content.includes('GET /_next/') ||
    content.includes('Compiled /') ||
    content.includes('Compiling /') ||
    content.includes('Next.js 14') ||
    content.includes('Local:        http://') ||
    content.includes('Ready in ')
  ) {
    return true;
  }

  return false;
}

// --- Main Application Lifecycle ---

async function main() {
  // Handle CLI utility flags
  if (process.argv.includes('--status')) {
    await handleStatus();
    return;
  }
  if (process.argv.includes('--stop')) {
    await handleStop();
    return;
  }

  // 1. Prevent duplicate launcher run
  if (fs.existsSync(PID_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
      if (data.launcherPid && data.launcherPid !== process.pid) {
        try {
          process.kill(data.launcherPid, 0);
          const cmd = getProcessCommandLine(data.launcherPid).toLowerCase();
          if (cmd.includes('dev-merchant')) {
            console.log('\n==================================================');
            console.log('SIMPLY / LETZSHOP — ALREADY RUNNING');
            console.log('==================================================');
            console.log(`A Simply development environment is already running (PID ${data.launcherPid}).\n`);
            console.log('To view status:  pnpm dev:status');
            console.log('To stop:        pnpm dev:stop');
            console.log('==================================================\n');
            process.exit(0);
          }
        } catch {
          // Stale launcher PID, proceed to clean
        }
      }
    } catch {}
  }

  // 2. Preflight database
  const dbOk = await checkDatabase();
  if (!dbOk) {
    process.exit(1);
  }

  // 3. Clean stale Simply processes from previous runs
  cleanStaleProcesses();

  // 4. Determine Active Development Profile
  const isAdminOnly = process.argv.includes('--admin') || process.argv.includes('admin');
  const isMerchantOnly = process.argv.includes('--merchant') || process.argv.includes('merchant');
  const isAll = process.argv.includes('--all') || process.argv.includes('all') || (!isAdminOnly && !isMerchantOnly);

  const runApi = true;
  const runSeller = !isAdminOnly;
  const runStorefront = !isAdminOnly;
  const runAdmin = !isMerchantOnly;

  const activePorts = [];
  if (runApi) activePorts.push(4000);
  if (runSeller) activePorts.push(3001);
  if (runStorefront) activePorts.push(3000);
  if (runAdmin) activePorts.push(3002);

  const profileName = isAdminOnly ? 'ADMIN' : isMerchantOnly ? 'MERCHANT' : 'ALL SERVICES';

  // Preflight active ports (cleans stale Simply processes, halts on unknown external)
  const portsOk = await checkPortPreflight(activePorts);
  if (!portsOk) {
    process.exit(1);
  }

  // 5. Direct Child Process Spawning with Conservative Memory Limits
  // (shell: false on Windows to avoid cmd.exe / batch Ctrl+C traps)
  const nodeBinary = process.execPath;
  const nestBin = path.resolve(rootDir, 'apps/api/node_modules/@nestjs/cli/bin/nest.js');
  const nextSellerBin = path.resolve(rootDir, 'apps/seller/node_modules/next/dist/bin/next');
  const nextStorefrontBin = path.resolve(rootDir, 'apps/storefront/node_modules/next/dist/bin/next');
  const nextAdminBin = path.resolve(rootDir, 'apps/admin/node_modules/next/dist/bin/next');

  const children = {};

  // Launch API first
  if (runApi) {
    children.api = spawn(nodeBinary, [nestBin, 'start', '--watch'], {
      cwd: path.resolve(rootDir, 'apps/api'),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=1536',
        FORCE_COLOR: '1',
      },
    });
  }

  // Stagger Next.js frontend builds slightly to avoid simultaneous CPU/memory spikes on startup
  await new Promise((r) => setTimeout(r, 1500));

  if (runSeller) {
    children.seller = spawn(nodeBinary, [nextSellerBin, 'dev', '-p', '3001'], {
      cwd: path.resolve(rootDir, 'apps/seller'),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=2048',
        FORCE_COLOR: '1',
      },
    });
  }

  if (runStorefront) {
    children.platform = spawn(nodeBinary, [nextStorefrontBin, 'dev', '-p', '3000'], {
      cwd: path.resolve(rootDir, 'apps/storefront'),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=2048',
        FORCE_COLOR: '1',
      },
    });
  }

  if (runAdmin) {
    children.admin = spawn(nodeBinary, [nextAdminBin, 'dev', '-p', '3002'], {
      cwd: path.resolve(rootDir, 'apps/admin'),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=2048',
        FORCE_COLOR: '1',
      },
    });
  }

  const trackedListeningPids = new Set();

  function savePidFile() {
    const services = {};
    if (runApi) services.api = { rootPid: children.api?.pid, port: 4000, listeningPid: getPortPid(4000) };
    if (runSeller) services.seller = { rootPid: children.seller?.pid, port: 3001, listeningPid: getPortPid(3001) };
    if (runStorefront) services.platform = { rootPid: children.platform?.pid, port: 3000, listeningPid: getPortPid(3000) };
    if (runAdmin) services.admin = { rootPid: children.admin?.pid, port: 3002, listeningPid: getPortPid(3002) };

    const data = {
      launcherPid: process.pid,
      profile: profileName,
      startedAt: new Date().toISOString(),
      services,
    };
    try {
      fs.writeFileSync(PID_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch {}
  }

  savePidFile();

  // 6. Shutdown Logic (Idempotent, Single Ctrl+C clean exit)
  let shuttingDown = false;

  async function shutdown(reason = 'SIGINT', exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;

    if (reason === 'SIGINT' || reason === 'SIGTERM' || reason === 'SIGBREAK') {
      console.log('\nStopping Simply development services...');
    }

    // Stop tracked direct child processes
    for (const [name, child] of Object.entries(children)) {
      if (child && child.pid) {
        killProcessTree(child.pid);
      }
    }

    // Stop tracked listening processes
    for (const pid of trackedListeningPids) {
      killProcessTree(pid);
    }

    // Also collect any listening PIDs on active ports
    for (const port of activePorts) {
      const p = getPortPid(port);
      if (p && isSimplyProcess(p)) {
        killProcessTree(p);
      }
    }

    const allTracked = new Set([
      ...Object.values(children).map((c) => c?.pid).filter(Boolean),
      ...trackedListeningPids,
    ]);

    // Verify active ports released
    const released = await verifyPortsReleased(activePorts, 4000, allTracked);

    // Remove runtime PID file
    try {
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    } catch {}

    if (reason === 'SIGINT' || reason === 'SIGTERM' || reason === 'SIGBREAK') {
      if (runApi) console.log('✓ API stopped');
      if (runSeller) console.log('✓ Merchant Portal stopped');
      if (runStorefront) console.log('✓ Storefront stopped');
      if (runAdmin) console.log('✓ Admin Portal stopped');
      if (released) {
        console.log('✓ Ports released (' + activePorts.join(', ') + ')');
      } else {
        console.log('⚠ Ports released with delay');
      }
      console.log('Done.\n');
    }

    process.exit(exitCode);
  }

  process.on('SIGINT', () => shutdown('SIGINT', 0));
  process.on('SIGTERM', () => shutdown('SIGTERM', 0));
  process.on('SIGBREAK', () => shutdown('SIGBREAK', 0));
  process.on('uncaughtException', (err) => {
    console.error('\nUncaught Exception:', err.message || err);
    shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('\nUnhandled Rejection:', reason);
    shutdown('unhandledRejection', 1);
  });

  if (process.stdin && process.stdin.isTTY) {
    try {
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (data) => {
        const s = data.toString();
        if (s.includes('\u0003') || s.trim() === 'q' || s.trim() === 'exit') {
          shutdown('SIGINT', 0);
        }
      });
    } catch {}
  }

  // 7. Child Stream & Output Banner
  let bannerPrinted = false;

  const printSummary = () => {
    if (bannerPrinted) return;
    bannerPrinted = true;

    for (const port of activePorts) {
      const p = getPortPid(port);
      if (p) trackedListeningPids.add(p);
    }
    savePidFile();

    console.log('\n==================================================');
    console.log(`SIMPLY / LETZSHOP DEVELOPMENT (${profileName} PROFILE)`);
    console.log('==================================================\n');
    if (runApi) {
      console.log('API');
      console.log('http://localhost:4000');
      console.log('✓ Healthy\n');
    }
    if (runSeller) {
      console.log('Merchant Portal');
      console.log('http://localhost:3001');
      console.log('✓ Healthy\n');
    }
    if (runStorefront) {
      console.log('Storefront');
      console.log('http://localhost:3000');
      console.log('✓ Healthy\n');
    }
    if (runAdmin) {
      console.log('Admin Portal');
      console.log('http://localhost:3002');
      console.log('✓ Healthy\n');
    }
    console.log('Press Ctrl+C once to stop all services.');
    console.log('==================================================\n');
  };

  const processStream = (chunk, isStderr = false) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (isNoise(line)) {
        continue;
      }
      if (isStderr) {
        process.stderr.write(line + '\n');
      } else {
        process.stdout.write(line + '\n');
      }
    }
  };

  for (const [name, child] of Object.entries(children)) {
    child.stdout.on('data', (chunk) => processStream(chunk, false));
    child.stderr.on('data', (chunk) => processStream(chunk, true));

    child.on('error', (err) => {
      console.error(`\n✗ ${name.toUpperCase()} failed: ${err.message}`);
      shutdown(`error_${name}`, 1);
    });

    child.on('exit', (code) => {
      if (!shuttingDown) {
        if (code !== 0 && code !== null) {
          console.error(`\n✗ ${name.toUpperCase()} exited unexpectedly with code ${code}`);
        }
        shutdown(`exit_${name}`, code || 1);
      }
    });
  }

  // 8. Wait for active services to become healthy before declaring success
  const allReady = await waitForServicesReady(
    { api: runApi, seller: runSeller, platform: runStorefront, admin: runAdmin },
    120000
  );
  if (allReady && !bannerPrinted && !shuttingDown) {
    printSummary();
  } else if (!allReady && !shuttingDown) {
    console.error('\n✗ Services failed to become healthy within timeout');
    await shutdown('health_timeout', 1);
  }
}

main().catch((err) => {
  console.error('\n✗ Startup failed');
  console.error(err.message || err);
  process.exit(1);
});

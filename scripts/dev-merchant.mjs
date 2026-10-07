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
const PID_FILE = path.resolve(rootDir, '.simply-dev-processes.json');

// --- Port and Process Inspection Utilities ---

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

export async function verifyPortsReleased(ports = [4000, 3001, 3000], timeoutMs = 4000, trackedPids = new Set()) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let allFree = true;
    for (const port of ports) {
      const pid = getPortPid(port);
      if (pid !== null) {
        allFree = false;
        // ONLY kill if this PID was positively tracked as belonging to this launcher
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

// --- Stale Process Cleanup ---

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

      // Verify the process actually belonged to Simply
      const cmdLine = getProcessCommandLine(pid).toLowerCase();
      const isSimply =
        cmdLine.includes('simply') ||
        cmdLine.includes('nest') ||
        cmdLine.includes('next') ||
        cmdLine.includes('apps/api') ||
        cmdLine.includes('apps/seller') ||
        cmdLine.includes('apps/storefront') ||
        cmdLine.includes('dev-merchant') ||
        cmdLine.includes('dist/src/main');

      if (isSimply) {
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

function checkPortPreflight(ports = [4000, 3001, 3000]) {
  for (const port of ports) {
    const pid = getPortPid(port);
    if (pid) {
      const procInfo = getProcessInfo(pid);
      console.error('\nSIMPLY E-COMMERCE — STARTUP BLOCKED\n');
      console.error(`Port ${port} is already in use.`);
      console.error(`PID: ${pid}`);
      console.error(`Process: ${procInfo.name}\n`);
      console.error('Inspect:');
      console.error(`Get-Process -Id ${pid}\n`);
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

async function waitForServicesReady(timeoutMs = 120000) {
  const start = Date.now();
  let apiReady = false;
  let sellerReady = false;
  let platformReady = false;

  while (Date.now() - start < timeoutMs) {
    if (!apiReady) apiReady = await checkPortReady(4000, '/health');
    if (!sellerReady) sellerReady = await checkPortReady(3001, '/');
    if (!platformReady) platformReady = await checkPortReady(3000, '/');

    if (apiReady && sellerReady && platformReady) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

// --- Noise Filtering ---

const stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

function isNoise(line) {
  const raw = stripAnsi(line).trim();
  if (!raw) return true;

  if (raw === '@simply/seller:dev:' || raw === '@simply/storefront:dev:' || raw === '@simply/api:dev:') {
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
  const isProduction = process.env.NODE_ENV === 'production';
  const devOtpEnabled = !isProduction;

  // 1. Preflight database
  const dbOk = await checkDatabase();
  if (!dbOk) {
    process.exit(1);
  }

  // 2. Clean stale Simply processes from previous runs
  cleanStaleProcesses();

  // 3. Preflight required ports
  const portsOk = checkPortPreflight([4000, 3001, 3000]);
  if (!portsOk) {
    process.exit(1);
  }

  // 4. Process Spawning Configuration
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const spawnOpts = {
    cwd: rootDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' }
  };

  const children = {
    api: spawn(pnpmCmd, ['--filter', '@simply/api', 'dev'], spawnOpts),
    seller: spawn(pnpmCmd, ['--filter', '@simply/seller', 'dev'], spawnOpts),
    platform: spawn(pnpmCmd, ['--filter', '@simply/storefront', 'dev'], spawnOpts)
  };

  const trackedListeningPids = new Set();

  function savePidFile() {
    const data = {
      launcherPid: process.pid,
      startedAt: new Date().toISOString(),
      services: {
        api: { rootPid: children.api?.pid, port: 4000, listeningPid: getPortPid(4000) },
        seller: { rootPid: children.seller?.pid, port: 3001, listeningPid: getPortPid(3001) },
        platform: { rootPid: children.platform?.pid, port: 3000, listeningPid: getPortPid(3000) }
      }
    };
    try {
      fs.writeFileSync(PID_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch {}
  }

  savePidFile();

  // 5. Shutdown Logic (Idempotent)
  let shuttingDown = false;

  async function shutdown(reason = 'SIGINT', exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;

    if (reason === 'SIGINT' || reason === 'SIGTERM') {
      console.log('\nStopping Simply development services...');
    }

    // Stop tracked root processes
    for (const [name, child] of Object.entries(children)) {
      if (child && child.pid) {
        killProcessTree(child.pid);
      }
    }

    // Stop tracked listening processes
    for (const pid of trackedListeningPids) {
      killProcessTree(pid);
    }

    // Also collect any listening PIDs on our ports that match our children
    for (const port of [4000, 3001, 3000]) {
      const p = getPortPid(port);
      if (p && trackedListeningPids.has(p)) {
        killProcessTree(p);
      }
    }

    const allTracked = new Set([
      ...Object.values(children).map((c) => c?.pid).filter(Boolean),
      ...trackedListeningPids
    ]);

    // Verify all ports released
    const released = await verifyPortsReleased([4000, 3001, 3000], 4000, allTracked);

    // Remove runtime PID file
    try {
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    } catch {}

    if (reason === 'SIGINT' || reason === 'SIGTERM') {
      console.log('✓ API stopped');
      console.log('✓ Seller stopped');
      console.log('✓ Platform stopped');
      if (released) {
        console.log('✓ Ports released\n');
      } else {
        console.log('⚠ Ports released with delay\n');
      }
      console.log('Done.');
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

  if (process.stdin) {
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (data) => {
        const s = data.toString();
        if (s.includes('\u0003') || s.trim() === 'q' || s.trim() === 'exit') {
          shutdown('SIGINT', 0);
        }
      });
    } catch {}
  }

  // 6. Child Stream & Exit Handling
  let bannerPrinted = false;

  const printSummary = () => {
    if (bannerPrinted) return;
    bannerPrinted = true;

    // Track listening PIDs once ready
    for (const port of [4000, 3001, 3000]) {
      const p = getPortPid(port);
      if (p) trackedListeningPids.add(p);
    }
    savePidFile();

    console.log('\nSIMPLY E-COMMERCE — MERCHANT DEV\n');
    console.log('✓ Database connected');
    console.log('✓ API          http://localhost:4000');
    console.log('✓ Platform     http://localhost:3000');
    console.log('✓ Seller       http://localhost:3001');
    console.log(`✓ Dev OTP      ${devOtpEnabled ? 'enabled' : 'disabled'}\n`);
    console.log('Watching for changes...\n');
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

  // 7. Wait for all services to become healthy before declaring success
  const allReady = await waitForServicesReady(120000);
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

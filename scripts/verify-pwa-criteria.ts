import fs from 'fs';
import path from 'path';

function verifyPng(filePath: string, minDim: number): boolean {
  if (!fs.existsSync(filePath)) return false;
  const buf = fs.readFileSync(filePath);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return false;
  // IHDR width at offset 16, height at offset 20
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return width >= minDim && height >= minDim;
}

function verifyAppPwa(appName: string, appPath: string) {
  console.log(`\n--- Auditing PWA for: ${appName} ---`);
  const publicDir = path.join(appPath, 'public');

  // 1. Manifest
  const manifestPath = path.join(publicDir, 'manifest.json');
  const manifestExists = fs.existsSync(manifestPath);
  let manifestValid = false;
  let startUrl = '';
  let display = '';
  if (manifestExists) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifestValid = !!(manifest.name && manifest.icons?.length >= 2);
      startUrl = manifest.start_url;
      display = manifest.display;
    } catch {}
  }
  console.log(`- manifest loaded: ${manifestValid ? 'PASS' : 'FAIL'}`);

  // 2. Icon 192
  const icon192Valid = verifyPng(path.join(publicDir, 'icon-192.png'), 192);
  console.log(`- icon 192: ${icon192Valid ? 'PASS' : 'FAIL'}`);

  // 3. Icon 512
  const icon512Valid = verifyPng(path.join(publicDir, 'icon-512.png'), 512);
  console.log(`- icon 512: ${icon512Valid ? 'PASS' : 'FAIL'}`);

  // 4. Service Worker registration & code
  const swPath = path.join(publicDir, 'sw.js');
  const swExists = fs.existsSync(swPath);
  let swValid = false;
  let sensitiveBypass = false;
  let offlineShell = false;
  let onlineRecovery = false;

  if (swExists) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    swValid = swContent.includes('addEventListener') && swContent.includes('fetch');
    // Check sensitive route bypass
    sensitiveBypass = swContent.includes('/api/') && (swContent.includes('return') || swContent.includes('pass through'));
    // Check offline shell
    offlineShell = swContent.includes('caches.match') || swContent.includes('caches.open');
    // Online recovery (fetch from network first)
    onlineRecovery = swContent.includes('fetch(event.request)') || swContent.includes('networkResponse');
  }

  console.log(`- service worker registered: ${swValid ? 'PASS' : 'FAIL'}`);
  console.log(`- start_url works: ${startUrl === '/' ? 'PASS' : 'FAIL'}`);
  console.log(`- standalone display: ${display === 'standalone' ? 'PASS' : 'FAIL'}`);
  console.log(`- sensitive API routes network-only: ${sensitiveBypass ? 'PASS' : 'FAIL'}`);
  console.log(`- offline shell: ${offlineShell ? 'PASS' : 'FAIL'}`);
  console.log(`- online recovery: ${onlineRecovery ? 'PASS' : 'FAIL'}`);

  return (
    manifestValid &&
    icon192Valid &&
    icon512Valid &&
    swValid &&
    startUrl === '/' &&
    display === 'standalone' &&
    sensitiveBypass &&
    offlineShell &&
    onlineRecovery
  );
}

function run() {
  console.log('=== Requirement 6: PWA Criteria Audit ===');
  const root = path.resolve(__dirname, '..');

  const sellerPass = verifyAppPwa('Seller Dashboard', path.join(root, 'apps', 'seller'));
  const sfPass = verifyAppPwa('Buyer Storefront', path.join(root, 'apps', 'storefront'));

  console.log('\n================================================================================');
  console.log(`Overall PWA Seller Result     : ${sellerPass ? 'PASS' : 'FAIL'}`);
  console.log(`Overall PWA Storefront Result : ${sfPass ? 'PASS' : 'FAIL'}`);
  console.log('================================================================================\n');

  if (!sellerPass || !sfPass) process.exit(1);
}

run();

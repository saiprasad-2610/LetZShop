import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const prismaPrimary = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce?schema=public' },
  },
});

function getFileHash(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function run() {
  console.log('=== Requirement 8: Comprehensive Backup & Restore Verification ===\n');

  // 1. Audit Primary DB entities
  console.log('1. Reading current entities from primary DB (simply_ecommerce)...');
  const [productCount, variantCount, orderCount, subCount] = await Promise.all([
    prismaPrimary.product.count(),
    prismaPrimary.productVariant.count(),
    prismaPrimary.order.count(),
    prismaPrimary.subscription.count(),
  ]);
  console.log(`   - Products: ${productCount}`);
  console.log(`   - Variants: ${variantCount}`);
  console.log(`   - Orders: ${orderCount}`);
  console.log(`   - Subscriptions: ${subCount}`);

  // 2. Prepare media files and calculate SHA-256 hashes
  const mediaDir = path.join(BASE_DIR, 'media-storage');
  if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
  
  // Ensure we have test media files with known content
  const sampleMarker = path.join(mediaDir, 'test-asset-hash-verification.bin');
  fs.writeFileSync(sampleMarker, Buffer.from('TEST_MEDIA_PAYLOAD_' + Date.now() + '_RANDOM_DATA_FOR_HASHING'));

  console.log('2. Computing SHA-256 hashes of original media files...');
  const originalHashes: Record<string, string> = {};
  const mediaFiles = fs.readdirSync(mediaDir);
  for (const f of mediaFiles) {
    const fullPath = path.join(mediaDir, f);
    if (fs.statSync(fullPath).isFile()) {
      originalHashes[f] = getFileHash(fullPath);
    }
  }
  console.log(`   Hashed ${Object.keys(originalHashes).length} media files.`);

  // 3. Execute backup
  console.log('3. Running scripts/backup.ps1...');
  const backupRes = spawnSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', 'scripts/backup.ps1'], {
    cwd: BASE_DIR,
    encoding: 'utf-8',
  });
  if (backupRes.error) throw backupRes.error;
  console.log('   Backup completed.');

  // Find latest backup directory
  const backupsDir = path.join(BASE_DIR, 'backups');
  const dirs = fs.readdirSync(backupsDir).filter((d) => fs.statSync(path.join(backupsDir, d)).isDirectory());
  dirs.sort();
  const latestDir = path.join(backupsDir, dirs[dirs.length - 1]);
  console.log(`   Latest backup artifact: ${latestDir}`);

  // 4. Create empty disposable restore DB
  const restoreDbName = 'simply_restore_verification_test';
  console.log(`4. Creating fresh disposable restore DB "${restoreDbName}"...`);
  const adminPrisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public' } },
  });
  await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${restoreDbName}`);
  await adminPrisma.$executeRawUnsafe(`CREATE DATABASE ${restoreDbName}`);
  await adminPrisma.$disconnect();

  // 5. Restore database dump into disposable restore DB using pg_restore
  console.log('5. Restoring database dump into disposable DB using pg_restore...');
  const dumpFile = fs.readdirSync(latestDir).find((f) => f.endsWith('.dump'));
  if (!dumpFile) throw new Error('No .dump file found in backup directory!');
  const dumpPath = path.join(latestDir, dumpFile);

  const pgRestoreBin = 'D:\\PostgreSQL\\server18\\bin\\pg_restore.exe';
  const targetDbUrl = `postgresql://postgres:postgres@localhost:5432/${restoreDbName}`;
  const restoreRes = spawnSync(pgRestoreBin, ['-d', targetDbUrl, '--clean', '--if-exists', dumpPath], {
    encoding: 'utf-8',
  });
  console.log('   pg_restore executed.');

  // 6. Inspect Restored DB
  console.log('6. Verifying restored database data...');
  const prismaRestored = new PrismaClient({
    datasources: { db: { url: `${targetDbUrl}?schema=public` } },
  });

  const [restoredProducts, restoredVariants, restoredOrders, restoredSubs] = await Promise.all([
    prismaRestored.product.count(),
    prismaRestored.productVariant.count(),
    prismaRestored.order.count(),
    prismaRestored.subscription.count(),
  ]);

  console.log(`   - Restored Products: ${restoredProducts} (Expected: ${productCount})`);
  console.log(`   - Restored Variants: ${restoredVariants} (Expected: ${variantCount})`);
  console.log(`   - Restored Orders: ${restoredOrders} (Expected: ${orderCount})`);
  console.log(`   - Restored Subscriptions: ${restoredSubs} (Expected: ${subCount})`);

  const pgDataRestoredPass = restoredProducts > 0 && restoredVariants > 0 && restoredSubs > 0;
  const entitiesRestoredPass =
    restoredProducts === productCount &&
    restoredVariants === variantCount &&
    restoredOrders === orderCount &&
    restoredSubs === subCount;

  await prismaRestored.$disconnect();

  // 7. Restore media archive and verify hashes
  console.log('7. Restoring media archive into ./media-restore-test...');
  const targetMediaDir = path.join(BASE_DIR, 'media-restore-test');
  if (fs.existsSync(targetMediaDir)) fs.rmSync(targetMediaDir, { recursive: true, force: true });
  fs.mkdirSync(targetMediaDir, { recursive: true });

  const zipFile = fs.readdirSync(latestDir).find((f) => f.endsWith('.zip'));
  if (!zipFile) throw new Error('No .zip file found in backup directory!');
  const zipPath = path.join(latestDir, zipFile);

  spawnSync('powershell', ['-Command', `Expand-Archive -Path "${zipPath}" -DestinationPath "${targetMediaDir}" -Force`], {
    encoding: 'utf-8',
  });

  let mediaRestoredPass = true;
  let hashesMatchPass = true;

  for (const [filename, origHash] of Object.entries(originalHashes)) {
    const restoredPath = path.join(targetMediaDir, filename);
    if (!fs.existsSync(restoredPath)) {
      console.error(`   Missing restored file: ${filename}`);
      mediaRestoredPass = false;
      hashesMatchPass = false;
      continue;
    }
    const restoredHash = getFileHash(restoredPath);
    if (restoredHash !== origHash) {
      console.error(`   Hash mismatch for ${filename}: orig=${origHash}, restored=${restoredHash}`);
      hashesMatchPass = false;
    }
  }

  // Cleanup
  console.log('8. Cleaning up disposable test DB and test media...');
  const cleanupPrisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public' } },
  });
  await cleanupPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${restoreDbName}`);
  await cleanupPrisma.$disconnect();

  if (fs.existsSync(sampleMarker)) fs.unlinkSync(sampleMarker);
  if (fs.existsSync(targetMediaDir)) fs.rmSync(targetMediaDir, { recursive: true, force: true });

  console.log('\n================================================================================');
  console.log('📊 REQUIREMENT 8 FINAL EVIDENCE RESULTS:');
  console.log(`- PostgreSQL data restored: ${pgDataRestoredPass ? 'PASS' : 'FAIL'}`);
  console.log(`- product/variant/order/subscription restored: ${entitiesRestoredPass ? 'PASS' : 'FAIL'}`);
  console.log(`- media restored: ${mediaRestoredPass ? 'PASS' : 'FAIL'}`);
  console.log(`- restored media hashes match originals: ${hashesMatchPass ? 'PASS' : 'FAIL'}`);
  console.log('================================================================================\n');

  await prismaPrimary.$disconnect();
}

run().catch((err) => {
  console.error('Backup/Restore verification failed:', err);
  prismaPrimary.$disconnect();
  process.exit(1);
});

import { spawnSync } from 'child_process';
import path from 'path';
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('=== Requirement 7: Disposable Database Migration Test ===');
  const adminPrisma = new PrismaClient({
    datasources: {
      db: { url: 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public' },
    },
  });

  const dbName = 'simply_disposable_migration_test';
  console.log(`1. Preparing completely EMPTY DISPOSABLE database: "${dbName}"...`);
  await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${dbName}`);
  await adminPrisma.$executeRawUnsafe(`CREATE DATABASE ${dbName}`);
  console.log(`   Database "${dbName}" created fresh and completely empty.`);
  await adminPrisma.$disconnect();

  const targetUrl = `postgresql://postgres:postgres@localhost:5432/${dbName}?schema=public`;
  console.log('2. Executing "prisma migrate deploy" against empty disposable database...');
  
  const prismaCli = path.join(__dirname, '../packages/db/node_modules/prisma/build/index.js');
  const res = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: path.join(__dirname, '../packages/db'),
    env: { ...process.env, DATABASE_URL: targetUrl },
    encoding: 'utf-8',
    shell: false,
  });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`Prisma failed: ${res.stderr || res.stdout}`);
  console.log('   Migration Deploy Output:\n' + res.stdout);

  console.log('3. Inspecting created tables in the disposable database...');
  const testPrisma = new PrismaClient({
    datasources: { db: { url: targetUrl } },
  });

  const tables: Array<{ table_name: string }> = await testPrisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log(`   Found ${tables.length} tables in migrated database:`);
  tables.forEach((t) => console.log(`   - ${t.table_name}`));

  const expectedTables = [
    '_prisma_migrations',
    'tenants',
    'stores',
    'store_branding',
    'store_theme_configs',
    'categories',
    'products',
    'product_variants',
    'inventory',
    'orders',
    'order_items',
    'product_media',
    'subscriptions',
  ];

  const tableNames = tables.map((t) => t.table_name.toLowerCase());
  const allFound = expectedTables.every((et) => tableNames.includes(et));

  if (!allFound) {
    throw new Error('Missing expected tables in disposable database migration!');
  }

  const migrations: Array<{ migration_name: string; finished_at: Date }> = await testPrisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at FROM "_prisma_migrations";
  `);
  console.log('   Applied migrations record:', migrations);

  await testPrisma.$disconnect();

  console.log('4. Cleaning up disposable database...');
  const cleanupPrisma = new PrismaClient({
    datasources: {
      db: { url: 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public' },
    },
  });
  await cleanupPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${dbName}`);
  console.log(`   Database "${dbName}" dropped cleanly.`);
  await cleanupPrisma.$disconnect();

  console.log('\n[EVIDENCE 7: MIGRATION ON EMPTY DISPOSABLE DB] -> PASS');
}

main().catch((err) => {
  console.error('\n[EVIDENCE 7: MIGRATION ON EMPTY DISPOSABLE DB] -> FAIL:', err);
  process.exit(1);
});

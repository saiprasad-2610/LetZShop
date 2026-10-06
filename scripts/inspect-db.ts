import { PrismaClient } from '@prisma/client';

const testDbUrl = 'postgresql://postgres:postgres@localhost:5432/simply_ecommerce_test?schema=public';
const prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

async function main() {
  try {
    const migrations = await prisma.$queryRawUnsafe<any[]>("SELECT migration_name, finished_at FROM _prisma_migrations");
    console.log('Migrations in test db:', migrations);
  } catch (err: any) {
    console.log('Error reading migrations:', err.message);
  }

  try {
    const tables = await prisma.$queryRawUnsafe<any[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('Tables in test db:', tables.map(t => t.table_name));
  } catch (err: any) {
    console.log('Error reading tables:', err.message);
  }

  await prisma.$disconnect();
}

main().catch(console.error);

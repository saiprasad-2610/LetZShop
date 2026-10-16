import { createRequire } from 'node:module';
import fs from 'node:fs';
process.loadEnvFile('.env');
const require = createRequire(import.meta.url),
  { PrismaClient } = require('../packages/db/node_modules/@prisma/client'),
  db = new PrismaClient();
try {
  const statuses = await db.store.groupBy({
    by: ['status'],
    where: { deletedAt: null },
    _count: true,
  });
  const [relations] =
    await db.$queryRaw`WITH merchant AS (SELECT DISTINCT t.id FROM tenants t JOIN tenant_memberships m ON m.tenant_id=t.id JOIN users u ON u.id=m.user_id WHERE t.deleted_at IS NULL AND m.is_active AND m.role='SELLER_OWNER' AND u.role='SELLER_OWNER' AND NOT u."isSuperAdmin" AND u.deleted_at IS NULL) SELECT count(*)::int AS stores,count(*) FILTER(WHERE m.id IS NOT NULL)::int AS "storesWithMerchant",count(*) FILTER(WHERE m.id IS NULL)::int AS "storesWithoutMerchant",count(DISTINCT s.tenant_id) FILTER(WHERE m.id IS NOT NULL)::int AS "merchantBusinessesWithStores" FROM stores s LEFT JOIN merchant m ON m.id=s.tenant_id WHERE s.deleted_at IS NULL`;
  const [live] =
    await db.$queryRaw`WITH merchant AS (SELECT DISTINCT t.id FROM tenants t JOIN tenant_memberships m ON m.tenant_id=t.id JOIN users u ON u.id=m.user_id WHERE t.deleted_at IS NULL AND m.is_active AND m.role='SELLER_OWNER' AND u.role='SELLER_OWNER' AND NOT u."isSuperAdmin" AND u.deleted_at IS NULL) SELECT count(*)::int AS live,count(*) FILTER(WHERE m.id IS NOT NULL)::int AS "liveWithMerchant",count(*) FILTER(WHERE m.id IS NULL)::int AS "liveWithoutMerchant" FROM stores s JOIN LATERAL(SELECT status,current_period_end FROM subscriptions WHERE tenant_id=s.tenant_id ORDER BY created_at DESC LIMIT 1) sub ON true LEFT JOIN merchant m ON m.id=s.tenant_id WHERE s.deleted_at IS NULL AND s.status='LIVE' AND s.is_publicly_accessible AND sub.status='ACTIVE' AND sub.current_period_end>=now()`;
  const [customers] =
    await db.$queryRaw`SELECT count(*)::int AS records,count(DISTINCT(store_id,phone))::int AS "distinctStorePhoneIdentities" FROM customers`;
  const [subscriptions] =
    await db.$queryRaw`WITH latest AS (SELECT DISTINCT ON(tenant_id) * FROM subscriptions ORDER BY tenant_id,created_at DESC) SELECT count(*) FILTER(WHERE s.status='ACTIVE' AND s.current_period_end>=now())::int AS "activeLatestRows",count(DISTINCT s.tenant_id) FILTER(WHERE s.status='ACTIVE' AND s.current_period_end>=now())::int AS "activeSubscribedBusinesses" FROM latest s JOIN tenants t ON t.id=s.tenant_id WHERE t.deleted_at IS NULL`;
  const payments = await db.subscriptionPayment.groupBy({
    by: ['status'],
    _count: true,
    _sum: { amountPaise: true },
  });
  const result = {
    statuses,
    statusSum: statuses.reduce((sum, r) => sum + r._count, 0),
    relations,
    live,
    customers,
    subscriptions,
    payments,
  };
  fs.mkdirSync('artifacts/dashboard-simplification', { recursive: true });
  fs.writeFileSync(
    'artifacts/dashboard-simplification/consistency.json',
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await db.$disconnect();
}

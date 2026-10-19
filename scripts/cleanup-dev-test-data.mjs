import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment
const envPath = path.resolve(rootDir, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

// ==============================================================================
// 1. SAFETY ENVIRONMENT GUARDS
// ==============================================================================
const isExecuteMode = process.argv.includes('--execute');

const databaseUrlStr = process.env.DATABASE_URL;
if (!databaseUrlStr) {
  throw new Error('DATABASE_URL is not defined in environment.');
}

const dbUrl = new URL(databaseUrlStr);
const host = dbUrl.hostname;
const databaseName = dbUrl.pathname.replace(/^\//, '');

if (process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: Cleanup script is strictly forbidden when NODE_ENV === "production"!');
  process.exit(1);
}

if (!['localhost', '127.0.0.1'].includes(host)) {
  console.error(`❌ FATAL: Database host is "${host}". Must be local ("localhost" or "127.0.0.1").`);
  process.exit(1);
}

if (databaseName !== 'simply_ecommerce') {
  console.error(`❌ FATAL: Database name is "${databaseName}". Expected "simply_ecommerce". Aborting.`);
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

// ==============================================================================
// 2. EXPLICIT KEEP LIST (IMMUTABLE IDs)
// ==============================================================================
export const KEEP_TENANT_IDS = [
  'f58d90be-c7f1-4d1b-b5af-83eafc9b6f1f', // SK General Stores (CONFIRMED LEGITIMATE)
  '6fbdde33-a47c-40b8-b601-f98b90f1b18c', // SanSai Tea / Sai Ram Tea (CONFIRMED LEGITIMATE)
  'c7f5e196-be92-4f26-949a-b90e0488ea43', // Royal Rajasthan LLP (UNKNOWN — PRESERVE)
  'f2a36e06-17f9-4f2f-b23a-8d6a4b8a8a21', // Royal Rajasthan LLP (UNKNOWN — PRESERVE)
];

// Preserved Platform Super Admin & Preserved Store Owners
export const PRESERVED_USER_IDS = [
  '10000000-0000-0000-0000-000000000001', // Platform SuperAdmin (admin@simplyecommerce.in)
  '0eeecf51-3527-45dd-b179-6eebaa66033d', // SK General Stores Owner (+919370262662)
  '80e024cf-bb0b-4767-9b97-3f03d10d1af4', // SanSai Tea Owner (+919371323603)
  'b166e88e-3eaa-4897-a5fc-76d850a4293a', // Royal Rajasthan LLP Owner 1 (+919876599904)
  '744ff6ea-0ff0-4b64-9fa8-16355ef64555', // Royal Rajasthan LLP Owner 2 (+919876599905)
];

async function main() {
  console.log('================================================================================');
  console.log('🧹 LETZSHOP DEVELOPMENT DATABASE SAFE CLEANUP TOOL');
  console.log('================================================================================');
  console.log(`Database Host:     ${host}`);
  console.log(`Database Name:     ${databaseName}`);
  console.log(`Mode:              ${isExecuteMode ? '🔴 EXECUTE (PERMANENT CLEANUP)' : '🟢 DRY RUN (NO CHANGES)'}`);
  console.log('================================================================================\n');

  // Load all tenants with dependencies
  const allTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      stores: {
        include: {
          _count: {
            select: {
              products: true,
              orders: true,
              productReviews: true,
            },
          },
        },
      },
      memberships: {
        include: {
          user: true,
        },
      },
      subscriptions: {
        include: {
          invoices: {
            include: {
              payments: true,
            },
          },
        },
      },
      _count: {
        select: {
          stores: true,
          products: true,
          orders: true,
          customers: true,
          subscriptions: true,
        },
      },
    },
  });

  const legitimateTenants = [];
  const unknownTenants = [];
  const testDeleteTenants = [];

  for (const t of allTenants) {
    if (KEEP_TENANT_IDS.includes(t.id)) {
      if (
        t.name.toLowerCase().includes('sk general') ||
        t.name.toLowerCase().includes('sansai') ||
        t.name.toLowerCase().includes('sai ram')
      ) {
        legitimateTenants.push(t);
      } else {
        unknownTenants.push(t);
      }
      continue;
    }

    const ownerMembership = t.memberships.find(
      (m) => m.role === 'SELLER_OWNER' && m.user?.role === 'SELLER_OWNER' && !m.user?.isSuperAdmin
    );
    const owner = ownerMembership?.user;
    const storeNames = t.stores.map((s) => s.name);
    const storeSlugs = t.stores.map((s) => s.slug);

    // 1. Seed.ts canonical tenants
    const isSeedAurelia =
      t.id === 'a1000000-0000-0000-0000-000000000001' ||
      t.name === 'Aurelia Atelier' ||
      storeSlugs.includes('aurelia');
    const isSeedPatil =
      t.id === 'b1000000-0000-0000-0000-000000000001' ||
      t.name === 'Patil Engineering' ||
      storeSlugs.includes('patil-engineering');

    // 2. Demo Archetype Stores (seed.ts:1040-1300)
    const archetypePhones = [
      '+919810100001',
      '+919810100002',
      '+919810100003',
      '+919810100004',
      '+919810100005',
      '+919810100006',
    ];
    const isArchetype = owner?.phone && archetypePhones.includes(owner.phone);

    // 3. Sharma Handicrafts integration test runner (+919123456780)
    const isSharmaTest = owner?.phone === '+919123456780' && t.name === 'Sharma Handicrafts';

    // 4. Test scripts (Moderation QA, Dashboard Proof, etc.)
    const isTestScript =
      t.name.startsWith('Moderation QA ') ||
      t.name.startsWith('Dashboard Proof ') ||
      t.name.startsWith('Test ') ||
      t.name.startsWith('Webhook Test ') ||
      t.name.startsWith('Benchmark ') ||
      storeNames.some(
        (n) =>
          n.startsWith('Moderation QA ') ||
          n.startsWith('Dashboard Proof ') ||
          n.startsWith('Review QA ')
      ) ||
      owner?.email?.endsWith('@example.invalid') ||
      owner?.email?.endsWith('@test.com');

    // 5. Orphan webhook/reconciliation test tenants (0 memberships, 0 stores or test slug)
    const isOrphanTest = t.memberships.length === 0;

    if (isSeedAurelia || isSeedPatil || isArchetype || isSharmaTest || isTestScript || isOrphanTest) {
      testDeleteTenants.push(t);
    } else {
      // Anything not proven test is marked UNKNOWN and preserved
      unknownTenants.push(t);
    }
  }

  const deleteTenantIds = testDeleteTenants.map((t) => t.id);

  // Cross-verification: Ensure NO keep tenant is in delete list
  for (const keepId of KEEP_TENANT_IDS) {
    if (deleteTenantIds.includes(keepId)) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Keep tenant ${keepId} found in deleteTenantIds!`);
    }
  }

  // Calculate counts to be deleted
  const deleteSummary = {
    tenants: testDeleteTenants.length,
    stores: testDeleteTenants.reduce((sum, t) => sum + t._count.stores, 0),
    products: testDeleteTenants.reduce((sum, t) => sum + t._count.products, 0),
    orders: testDeleteTenants.reduce((sum, t) => sum + t._count.orders, 0),
    customers: testDeleteTenants.reduce((sum, t) => sum + t._count.customers, 0),
    subscriptions: testDeleteTenants.reduce((sum, t) => sum + t._count.subscriptions, 0),
    payments: testDeleteTenants.reduce(
      (sum, t) =>
        sum +
        t.subscriptions.reduce(
          (subSum, sub) =>
            subSum + sub.invoices.reduce((invSum, inv) => invSum + inv.payments.length, 0),
          0
        ),
      0
    ),
    reviews: testDeleteTenants.reduce(
      (sum, t) =>
        sum + t.stores.reduce((sSum, s) => sSum + s._count.productReviews, 0),
      0
    ),
  };

  console.log('📊 AUDIT SUMMARY:');
  console.log(`- Confirmed Legitimate Tenants: ${legitimateTenants.length}`);
  for (const t of legitimateTenants) {
    console.log(`  ✓ [${t.id}] ${t.name}`);
  }

  console.log(`- Unknown Tenants Preserved:    ${unknownTenants.length}`);
  for (const t of unknownTenants) {
    console.log(`  ? [${t.id}] ${t.name}`);
  }

  console.log(`- Confirmed Test Tenants:       ${testDeleteTenants.length}`);

  console.log('\n================================================================================');
  console.log('PROJECTED DELETION COUNTS:');
  console.log('================================================================================');
  console.log(JSON.stringify(deleteSummary, null, 2));
  console.log('================================================================================\n');

  if (!isExecuteMode) {
    console.log('🛡️ DRY-RUN COMPLETED.');
    console.log('Zero rows were deleted or modified in the database.');
    console.log('To execute this cleanup permanently, re-run with:');
    console.log('   node scripts/cleanup-dev-test-data.mjs --execute\n');
    return;
  }

  // ==============================================================================
  // 3. EXECUTE CLEANUP INSIDE TRANSACTION
  // ==============================================================================
  console.log('⏳ Executing deterministic cleanup inside a PostgreSQL transaction...');

  // Identify test users whose memberships were solely on deleted test tenants
  const allUsers = await prisma.user.findMany({
    include: {
      memberships: true,
    },
  });

  const testUserIdsToDelete = allUsers
    .filter((u) => {
      if (PRESERVED_USER_IDS.includes(u.id)) return false;
      if (u.isSuperAdmin) return false;
      // If user has memberships on preserved tenants, keep
      const hasPreservedMembership = u.memberships.some((m) =>
        KEEP_TENANT_IDS.includes(m.tenantId)
      );
      if (hasPreservedMembership) return false;

      // Check if synthetic test admin or seller
      const isTestAdmin =
        u.email?.endsWith('@test.com') ||
        u.email?.endsWith('@example.invalid') ||
        u.fullName?.includes('Test Admin') ||
        u.fullName?.includes('Admin workflow') ||
        u.fullName?.includes('Dashboard verification');

      const isSeedOwner =
        u.id === 'a2000000-0000-0000-0000-000000000001' || // Aurelia Sharma
        u.id === 'b2000000-0000-0000-0000-000000000001' || // Suresh Patil
        [
          '+919810100001',
          '+919810100002',
          '+919810100003',
          '+919810100004',
          '+919810100005',
          '+919810100006',
        ].includes(u.phone);

      const isTestSellerOwner =
        u.phone === '+919123456780' || // Sharma Handicrafts test runner
        u.phone === '+919199777243' || // Dashboard verified owner
        u.phone === '+919632611555' || // Moderation QA 1
        u.phone === '+919504535795'; // Moderation QA 2

      return isTestAdmin || isSeedOwner || isTestSellerOwner;
    })
    .map((u) => u.id);

  console.log(`Identified ${testUserIdsToDelete.length} test users to delete.`);

  await prisma.$transaction(
    async (tx) => {
      // 1. Clean auxiliary tables where tenantId is in deleteTenantIds
      console.log('  1/4 Deleting auxiliary test records (idempotency, outbox)...');
      await tx.idempotencyKey.deleteMany({
        where: { tenantId: { in: deleteTenantIds } },
      });
      await tx.outboxEvent.deleteMany({
        where: { tenantId: { in: deleteTenantIds } },
      });

      // 2. Delete test tenants (Cascades to stores, products, variants, orders, payments, subscriptions, reviews, customers, memberships)
      console.log(`  2/4 Deleting ${deleteTenantIds.length} test tenants via cascade...`);
      const deletedTenants = await tx.tenant.deleteMany({
        where: {
          id: { in: deleteTenantIds },
        },
      });
      console.log(`      ✓ Removed ${deletedTenants.count} tenants.`);

      // 3. Delete orphaned test users
      if (testUserIdsToDelete.length > 0) {
        console.log(`  3/4 Deleting ${testUserIdsToDelete.length} synthetic test users...`);
        // Sessions and credentials cascade on user delete
        const deletedUsers = await tx.user.deleteMany({
          where: {
            id: { in: testUserIdsToDelete },
          },
        });
        console.log(`      ✓ Removed ${deletedUsers.count} test users.`);
      }

      // 4. Verify SuperAdmin still exists
      const superAdmin = await tx.user.findUnique({
        where: { id: '10000000-0000-0000-0000-000000000001' },
      });
      if (!superAdmin) {
        throw new Error('FATAL: SuperAdmin user was deleted during transaction! Rolling back.');
      }
      console.log('  4/4 Verified SuperAdmin user is intact: OK');
    },
    { timeout: 120000 }
  );

  console.log('\n================================================================================');
  console.log('✅ CLEANUP TRANSACTION COMMITTED SUCCESSFULLY!');
  console.log('================================================================================\n');

  // Re-inventory database
  console.log('📊 POST-CLEANUP INVENTORY:');
  const remainingTenants = await prisma.tenant.findMany({
    include: {
      stores: true,
      memberships: {
        include: {
          user: true,
        },
      },
      subscriptions: true,
      _count: {
        select: {
          products: true,
          orders: true,
          customers: true,
        },
      },
    },
  });

  const remainingStores = await prisma.store.findMany();
  const remainingProducts = await prisma.product.count();
  const remainingOrders = await prisma.order.count();
  const remainingCustomers = await prisma.customer.count();
  const remainingSubscriptions = await prisma.subscription.count();
  const remainingPayments = await prisma.subscriptionPayment.count();
  const remainingReviews = await prisma.productReview.count();
  const remainingReviewReports = await prisma.reviewReport.count();

  console.log(`Remaining Tenants:               ${remainingTenants.length}`);
  console.log(`Remaining Stores:                ${remainingStores.length}`);
  console.log(`Remaining Products:              ${remainingProducts}`);
  console.log(`Remaining Orders:                ${remainingOrders}`);
  console.log(`Remaining Customers:             ${remainingCustomers}`);
  console.log(`Remaining Subscriptions:         ${remainingSubscriptions}`);
  console.log(`Remaining Subscription Payments: ${remainingPayments}`);
  console.log(`Remaining Reviews:               ${remainingReviews}`);
  console.log(`Remaining Review Reports:        ${remainingReviewReports}`);

  console.log('\nREMAINING BUSINESSES:');
  console.table(
    remainingTenants.map((t) => {
      const owner = t.memberships.find((m) => m.role === 'SELLER_OWNER')?.user;
      const store = t.stores[0];
      return {
        Business: t.name,
        Owner: owner ? `${owner.fullName} (${owner.phone})` : 'None',
        Store: store?.name || 'None',
        Status: store?.status || 'None',
        Orders: t._count.orders,
        Products: t._count.products,
        Customers: t._count.customers,
        CreatedAt: t.createdAt.toISOString().slice(0, 10),
      };
    })
  );
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

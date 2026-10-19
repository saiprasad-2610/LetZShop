import { createRequire } from 'node:module';
import fs from 'node:fs';

process.loadEnvFile('.env');

if (
  process.env.NODE_ENV === 'production' ||
  !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname)
) {
  throw new Error('This script must only run against local development PostgreSQL.');
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Auditing all Tenants, Stores, and related data in PostgreSQL...');

  const tenants = await prisma.tenant.findMany({
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
          memberships: true,
          subscriptions: true,
          customers: true,
        },
      },
    },
  });

  console.log(`Total Tenants found: ${tenants.length}`);

  const classified = {
    legitimate: [],
    testSeedDemo: [],
    unknown: [],
  };

  for (const t of tenants) {
    const ownerMembership = t.memberships.find(
      (m) => m.role === 'SELLER_OWNER' && m.user?.role === 'SELLER_OWNER' && !m.user?.isSuperAdmin
    );
    const owner = ownerMembership?.user;
    const storeNames = t.stores.map((s) => s.name);
    const storeSlugs = t.stores.map((s) => s.slug);
    const storeStatuses = t.stores.map((s) => s.status);

    const totalOrders = t.stores.reduce((sum, s) => sum + s._count.orders, 0);
    const totalProducts = t.stores.reduce((sum, s) => sum + s._count.products, 0);
    const totalReviews = t.stores.reduce((sum, s) => sum + s._count.productReviews, 0);
    const totalPayments = t.subscriptions.reduce(
      (sum, sub) =>
        sum +
        sub.invoices.reduce((isum, inv) => isum + inv.payments.length, 0),
      0
    );

    const record = {
      id: t.id,
      name: t.name,
      createdAt: t.createdAt.toISOString(),
      owner: owner
        ? {
            id: owner.id,
            name: owner.fullName,
            phone: owner.phone,
            email: owner.email,
            role: owner.role,
            createdAt: owner.createdAt.toISOString(),
          }
        : null,
      membershipsCount: t.memberships.length,
      stores: t.stores.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        products: s._count.products,
        orders: s._count.orders,
        reviews: s._count.productReviews,
      })),
      counts: {
        stores: t._count.stores,
        products: totalProducts,
        orders: totalOrders,
        customers: t._count.customers,
        reviews: totalReviews,
        subscriptions: t._count.subscriptions,
        payments: totalPayments,
      },
      evidence: [],
    };

    // Deterministic Classification Rules
    const isKnownLegit =
      t.id === 'f58d90be-c7f1-4d1b-b5af-83eafc9b6f1f' || // SK General Stores
      t.id === '6fbdde33-a47c-40b8-b601-f98b90f1b18c' || // SanSai Tea / Sai Ram Tea
      t.name.toLowerCase().includes('sk general') ||
      t.name.toLowerCase().includes('sai ram tea') ||
      t.name.toLowerCase().includes('sansai tea') ||
      storeNames.some(
        (n) =>
          n.toLowerCase().includes('sk general') ||
          n.toLowerCase().includes('sai ram tea') ||
          n.toLowerCase().includes('sansai tea')
      ) ||
      storeSlugs.some(
        (s) =>
          s.includes('sk-general') ||
          s.includes('sai-ram') ||
          s.includes('sansai-tea') ||
          s === 'sk'
      );

    if (isKnownLegit) {
      record.classification = 'CONFIRMED LEGITIMATE';
      record.evidence.push('Known legitimate merchant per project requirements (SK General Stores / SanSai Tea)');
      classified.legitimate.push(record);
      continue;
    }

    // Check for Seed data (Aurelia Atelier & Patil Engineering)
    if (t.id === 'a1000000-0000-0000-0000-000000000001' || t.name === 'Aurelia Atelier' || storeSlugs.includes('aurelia') || storeSlugs.includes('aurelia-atelier')) {
      record.classification = 'CONFIRMED TEST/SEED';
      record.evidence.push('Seeded Tenant A from packages/db/prisma/seed.ts (SEED_IDS.tenantA)');
      classified.testSeedDemo.push(record);
      continue;
    }

    if (t.id === 'b1000000-0000-0000-0000-000000000001' || t.name === 'Patil Engineering' || storeSlugs.includes('patil-engineering')) {
      record.classification = 'CONFIRMED TEST/SEED';
      record.evidence.push('Seeded Tenant B from packages/db/prisma/seed.ts (SEED_IDS.tenantB)');
      classified.testSeedDemo.push(record);
      continue;
    }

    // Check for 6 Demo Archetype Stores from seed.ts (lines 1040-1300)
    const archetypePhones = [
      '+919810100001',
      '+919810100002',
      '+919810100003',
      '+919810100004',
      '+919810100005',
      '+919810100006',
    ];
    const archetypeSlugs = [
      'aaraa-fine-jewels',
      'pulse-streetwear',
      'mithaiwala-and-co',
      'foundry-industrial-supply',
      'vriksha-living',
      'shree-ganesh-superstore',
    ];
    if (
      (owner?.phone && archetypePhones.includes(owner.phone)) ||
      storeSlugs.some((s) => archetypeSlugs.includes(s))
    ) {
      record.classification = 'CONFIRMED TEST/SEED';
      record.evidence.push('Demo Archetype Store from packages/db/prisma/seed.ts (seedArchetypeStores)');
      classified.testSeedDemo.push(record);
      continue;
    }

    // Check for Sharma Handicrafts test runner runs (apps/api/test/integration/phase2-endpoints.spec.ts)
    if (owner?.phone === '+919123456780' && t.name === 'Sharma Handicrafts') {
      record.classification = 'CONFIRMED TEST/SEED';
      record.evidence.push('Test fixture generated by apps/api/test/integration/phase2-endpoints.spec.ts (+919123456780)');
      classified.testSeedDemo.push(record);
      continue;
    }

    // Check for automated test scripts (Moderation QA, Dashboard Proof, etc.)
    const isTestName =
      t.name.startsWith('Test ') ||
      t.name.startsWith('test-') ||
      t.name.startsWith('Dashboard Proof ') ||
      t.name.startsWith('Review QA Store ') ||
      t.name.startsWith('Webhook Test ') ||
      t.name.startsWith('Benchmark ') ||
      t.name.startsWith('Canonical Test ') ||
      t.name.startsWith('Moderation QA ') ||
      storeNames.some(
        (n) =>
          n.startsWith('Test ') ||
          n.startsWith('Dashboard Proof ') ||
          n.startsWith('Review QA ') ||
          n.startsWith('Additional profile ') ||
          n.startsWith('Moderation QA ')
      ) ||
      storeSlugs.some(
        (s) =>
          s.startsWith('test-') ||
          s.startsWith('dashboard-') ||
          s.startsWith('review-qa-') ||
          s.startsWith('mod-qa-')
      );

    const isTestPhone =
      owner?.phone?.startsWith('+919999999') ||
      owner?.phone?.startsWith('+919800000') ||
      owner?.email?.endsWith('@example.com') ||
      owner?.email?.endsWith('@test.com') ||
      owner?.fullName?.includes('Test') ||
      owner?.fullName?.includes('Dashboard verified');

    // Orphan tenants (no memberships, no owner)
    const isOrphan = t.memberships.length === 0;

    if (isTestName || isTestPhone) {
      record.classification = 'CONFIRMED TEST/SEED';
      if (isTestName) record.evidence.push('Matches automated test naming pattern');
      if (isTestPhone) record.evidence.push('Matches synthetic test phone/email pattern');
      classified.testSeedDemo.push(record);
      continue;
    }

    if (isOrphan) {
      record.classification = 'CONFIRMED TEST/SEED';
      record.evidence.push('Orphan tenant (0 memberships, 0 owners) created by apps/api/test/integration/webhook-and-reconciliation.spec.ts');
      classified.testSeedDemo.push(record);
      continue;
    }

    // If neither proven test nor known legit, mark as UNKNOWN (DO NOT DELETE)
    record.classification = 'UNKNOWN — DO NOT DELETE';
    record.evidence.push('Not matching automated test patterns; preserved safely per rule #0');
    classified.unknown.push(record);
  }

  // Generate Dry Run Report
  console.log('\n==================================================');
  console.log('DRY-RUN CLASSIFICATION REPORT');
  console.log('==================================================');
  console.log(`CONFIRMED LEGITIMATE:   ${classified.legitimate.length}`);
  console.log(`CONFIRMED TEST / SEED:  ${classified.testSeedDemo.length}`);
  console.log(`UNKNOWN (PRESERVE):     ${classified.unknown.length}`);
  console.log('==================================================\n');

  console.log('CONFIRMED LEGITIMATE TENANTS:');
  for (const t of classified.legitimate) {
    console.log(`- [${t.id}] ${t.name} (Stores: ${t.stores.map((s) => s.name).join(', ') || 'none'}, Orders: ${t.counts.orders}, Products: ${t.counts.products})`);
  }

  console.log('\nUNKNOWN TENANTS (PRESERVE PER SAFETY RULE):');
  for (const t of classified.unknown) {
    console.log(`- [${t.id}] ${t.name} (Owner: ${t.owner?.name || 'none'}, Phone: ${t.owner?.phone || 'none'}, Stores: ${t.stores.map((s) => s.name).join(', ') || 'none'}, Orders: ${t.counts.orders})`);
  }

  // Totals of data to remove
  const toRemove = {
    tenants: classified.testSeedDemo.length,
    stores: classified.testSeedDemo.reduce((sum, t) => sum + t.counts.stores, 0),
    products: classified.testSeedDemo.reduce((sum, t) => sum + t.counts.products, 0),
    orders: classified.testSeedDemo.reduce((sum, t) => sum + t.counts.orders, 0),
    customers: classified.testSeedDemo.reduce((sum, t) => sum + t.counts.customers, 0),
    subscriptions: classified.testSeedDemo.reduce((sum, t) => sum + t.counts.subscriptions, 0),
    payments: classified.testSeedDemo.reduce((sum, t) => sum + t.counts.payments, 0),
    reviews: classified.testSeedDemo.reduce((sum, t) => sum + t.counts.reviews, 0),
  };

  console.log('\nIMPACT SUMMARY IF CLEANED:');
  console.log(JSON.stringify(toRemove, null, 2));

  fs.writeFileSync(
    'artifacts/dev-data-audit-inventory.json',
    JSON.stringify({ classified, toRemove }, null, 2)
  );
  console.log('\nAudit inventory written to artifacts/dev-data-audit-inventory.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

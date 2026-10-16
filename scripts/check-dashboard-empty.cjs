process.loadEnvFile('.env');
if (
  process.env.NODE_ENV === 'production' ||
  !['localhost', '127.0.0.1'].includes(
    new URL(process.env.DATABASE_URL).hostname,
  )
)
  throw Error('Local development PostgreSQL required');
const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const {
  AdminDashboardService,
} = require('../apps/api/dist/modules/admin/admin-dashboard.service');
const root = new PrismaClient();
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('schema', 'pg_temp');
const isolated = new PrismaClient({ datasourceUrl: url.toString() });
(async () => {
  const names =
    await root.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  const columns =
    await root.$queryRaw`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND data_type='USER-DEFINED'`;
  const types =
    await root.$queryRaw`SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typtype='e'`;
  const result = await isolated.$transaction(
    async (tx) => {
      for (const { tablename } of names) {
        if (!/^[a-zA-Z0-9_]+$/.test(tablename))
          throw Error('Unexpected table name');
        await tx.$executeRawUnsafe(
          'CREATE TEMP TABLE "' +
            tablename +
            '" (LIKE public."' +
            tablename +
            '" INCLUDING DEFAULTS) ON COMMIT DROP',
        );
      }
      for (const { typname } of types) {
        if (!/^[a-zA-Z0-9_]+$/.test(typname))
          throw Error('Unexpected enum name');
        await tx.$executeRawUnsafe(
          'CREATE DOMAIN pg_temp."' + typname + '" AS text',
        );
      }
      for (const { table_name, column_name } of columns) {
        if (
          !/^[a-zA-Z0-9_]+$/.test(table_name) ||
          !/^[a-zA-Z0-9_]+$/.test(column_name)
        )
          throw Error('Unexpected identifier');
        await tx.$executeRawUnsafe(
          'ALTER TABLE pg_temp."' +
            table_name +
            '" ALTER COLUMN "' +
            column_name +
            '" DROP DEFAULT',
        );
        await tx.$executeRawUnsafe(
          'ALTER TABLE pg_temp."' +
            table_name +
            '" ALTER COLUMN "' +
            column_name +
            '" TYPE text USING "' +
            column_name +
            '"::text',
        );
      }
      const service = new AdminDashboardService({
        $transaction: (callback) => callback(tx),
      });
      const assert = require('node:assert/strict'),
        crypto = require('node:crypto');
      const empty = await service.read(null, 'ALL');
      for (const value of Object.values(empty.kpis)) assert.equal(value, 0);
      const owner = await tx.user.create({
        data: {
          phone: '+919000000001',
          fullName: 'Owner case',
          role: 'SELLER_OWNER',
        },
      });
      const admin = await tx.user.create({
        data: {
          phone: '+919000000002',
          fullName: 'Admin case',
          role: 'PLATFORM_ADMIN',
          isSuperAdmin: true,
        },
      });
      const tenant = await tx.tenant.create({
        data: {
          name: 'Business case',
          slug: 'business-case',
          status: 'ACTIVE',
        },
      });
      const adminTenant = await tx.tenant.create({
        data: {
          name: 'Admin membership case',
          slug: 'admin-membership-case',
          status: 'ACTIVE',
        },
      });
      await tx.tenantMembership.createMany({
        data: [
          { tenantId: tenant.id, userId: owner.id, role: 'SELLER_OWNER' },
          { tenantId: adminTenant.id, userId: admin.id, role: 'SELLER_OWNER' },
        ],
      });
      const stores = [];
      for (let i = 0; i < 2; i++)
        stores.push(
          await tx.store.create({
            data: {
              tenantId: tenant.id,
              name: 'Profile ' + i,
              slug: 'profile-' + i,
              status: 'LIVE',
              isPubliclyAccessible: true,
            },
          }),
        );
      const now = new Date(),
        earlier = new Date(now.getTime() - 86400000),
        future = new Date(now.getTime() + 86400000);
      const plan = await tx.plan.create({
        data: {
          name: 'Regression plan',
          code: 'REGRESSION',
          pricePaise: 10000,
        },
      });
      const old = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: earlier,
          currentPeriodEnd: future,
          createdAt: earlier,
        },
      });
      const newest = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'EXPIRED',
          currentPeriodStart: earlier,
          currentPeriodEnd: earlier,
          createdAt: now,
        },
      });
      const expired = await service.read(null, 'ALL');
      assert.equal(expired.kpis.totalMerchants, 1);
      assert.equal(expired.kpis.activeSubscriptions, 0);
      assert.equal(expired.kpis.liveStores, 0);
      await tx.subscription.delete({ where: { id: newest.id } });
      const active = await service.read(null, 'ALL');
      assert.equal(active.kpis.activeSubscriptions, 1);
      assert.equal(active.kpis.liveStores, 2);
      assert.equal(active.kpis.totalMerchants, 1);
      const review = await tx.productReview.create({
        data: {
          storeId: stores[0].id,
          productId: crypto.randomUUID(),
          orderId: crypto.randomUUID(),
          orderItemId: crypto.randomUUID(),
          reviewerName: 'Review case',
          rating: 5,
          body: 'Regression case',
          status: 'ACTIVE',
          moderatedAt: now,
        },
      });
      await tx.auditLog.create({
        data: {
          action: 'REVIEW_REMOVED',
          entityType: 'ProductReview',
          entityId: review.id,
        },
      });
      assert.equal(
        (await service.read(null, 'ALL')).reviewModeration.removedThisMonth,
        0,
      );
      await tx.productReview.update({
        where: { id: review.id },
        data: { status: 'REMOVED' },
      });
      assert.equal(
        (await service.read(null, 'ALL')).reviewModeration.removedThisMonth,
        1,
      );
      const paidAt = new Date(now.getTime() - 2 * 86400000),
        createdAt = new Date(now.getTime() - 20 * 86400000);
      const invoice = await tx.subscriptionInvoice.create({
        data: {
          tenantId: tenant.id,
          subscriptionId: old.id,
          invoiceNumber: 'REGRESSION-PAID',
          amountPaise: 12501,
          status: 'PAID',
          paidAt,
          createdAt,
        },
      });
      await tx.subscriptionPayment.createMany({
        data: [
          {
            invoiceId: invoice.id,
            status: 'SUCCESS',
            amountPaise: 12501,
            createdAt,
          },
          {
            invoiceId: invoice.id,
            status: 'FAILED',
            amountPaise: 999900,
            createdAt,
          },
          {
            invoiceId: invoice.id,
            status: 'PENDING',
            amountPaise: 999900,
            createdAt,
          },
          {
            invoiceId: invoice.id,
            status: 'CANCELED',
            amountPaise: 999900,
            createdAt,
          },
        ],
      });
      const legacy = await tx.subscriptionInvoice.create({
        data: {
          tenantId: tenant.id,
          subscriptionId: old.id,
          invoiceNumber: 'REGRESSION-LEGACY',
          amountPaise: 10001,
          status: 'PAID',
          paidAt: null,
          createdAt: paidAt,
        },
      });
      await tx.subscriptionPayment.create({
        data: {
          invoiceId: legacy.id,
          status: 'SUCCESS',
          amountPaise: 10001,
          createdAt: paidAt,
        },
      });
      const dated = await service.read(
        new Date(now.getTime() - 7 * 86400000),
        '7d',
      );
      assert.equal(dated.kpis.subscriptionRevenuePaise, 22502);
      assert.equal(
        dated.charts.subscriptionRevenueTrends.reduce(
          (sum, p) => sum + p.amountPaise,
          0,
        ),
        22502,
      );
      assert(
        dated.charts.subscriptionRevenueTrends.every(
          (p) => p.date === paidAt.toISOString().slice(0, 10),
        ),
      );
      require('fs').writeFileSync(
        'artifacts/dashboard-proof/regressions.json',
        JSON.stringify(
          {
            passed: true,
            cases: [
              'platform admin excluded from merchants',
              'two store profiles count one merchant business',
              'superseded ACTIVE subscription excluded',
              'latest expired subscription blocks live stores',
              'restored review excluded from removals',
              'failed/pending/canceled payments excluded',
              'paidAt controls revenue range',
              'legacy payment createdAt fallback',
              'all empty metrics zero and all lists/charts empty',
            ],
          },
          null,
          2,
        ),
      );
      return empty;
    },
    { isolationLevel: 'RepeatableRead', timeout: 20000 },
  );
  require('fs').writeFileSync(
    'artifacts/dashboard-proof/empty-postgres.json',
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify({
      kpis: result.kpis,
      recent: result.recentlyJoinedMerchants.length,
      charts: result.charts,
    }),
  );
})().finally(async () => {
  await root.$disconnect();
  await isolated.$disconnect();
});

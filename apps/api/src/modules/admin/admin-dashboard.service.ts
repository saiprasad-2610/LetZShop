import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

// A merchant is a business (Tenant), not an extra Store profile or customer.
// Match a genuine seller owner; a platform admin membership must not create a merchant.
const merchantWhere: Prisma.TenantWhereInput = {
  deletedAt: null,
  memberships: {
    some: {
      role: 'SELLER_OWNER',
      isActive: true,
      user: { deletedAt: null, role: 'SELLER_OWNER', isSuperAdmin: false },
    },
  },
};
const pendingWhere: Prisma.ReviewReportWhereInput = {
  status: { in: ['PENDING', 'UNDER_REVIEW'] },
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly db: PrismaClient) {}

  async read(from: Date | null, range: string) {
    // One snapshot prevents cards, lists and charts from disagreeing during writes.
    return this.db.$transaction(
      async (tx) => {
        const [{ now }] = await tx.$queryRaw<
          Array<{ now: Date }>
        >`SELECT CURRENT_TIMESTAMP AS now`;
        const month = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
        );
        const [
          totalMerchants,
          live,
          privateStores,
          suspendedStores,
          active,
          totalProducts,
          totalOrders,
          totalCustomers,
          totalReviews,
          revenue,
          recentlyJoinedMerchants,
          pendingReports,
          removedThisMonth,
          resolvedReports,
          latestPendingReports,
          recentOrders,
          charts,
        ] = await Promise.all([
          tx.tenant.count({ where: merchantWhere }),
          // Same public-access predicates as SubscriptionVisibilityService:
          // latest subscription ACTIVE/unexpired, non-deleted LIVE/public store.
          tx.$queryRaw<Array<{ count: number }>>`SELECT count(*)::int AS count
          FROM stores s
          JOIN LATERAL (
            SELECT status,current_period_end FROM subscriptions
            WHERE tenant_id=s.tenant_id ORDER BY created_at DESC LIMIT 1
          ) latest ON true
          WHERE s.deleted_at IS NULL AND s.status='LIVE'
            AND s.is_publicly_accessible=true AND latest.status='ACTIVE'
            AND latest.current_period_end >= ${now}`,
          tx.store.count({
            where: {
              deletedAt: null,
              status: { in: ['DRAFT', 'PRIVATE_PREVIEW'] },
            },
          }),
          tx.store.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
          // SubscriptionService.getTenantSubscription uses the latest row per tenant.
          tx.$queryRaw<Array<{ count: number }>>`SELECT count(*)::int AS count
          FROM tenants t
          JOIN LATERAL (
            SELECT status,current_period_end FROM subscriptions
            WHERE tenant_id=t.id ORDER BY created_at DESC LIMIT 1
          ) latest ON true
          WHERE t.deleted_at IS NULL AND latest.status='ACTIVE'
            AND latest.current_period_end >= ${now}`,
          tx.product.count({ where: { deletedAt: null } }),
          tx.order.count(),
          tx.customer.count(),
          tx.productReview.count({ where: { status: 'ACTIVE' } }),
          tx.subscriptionPayment.aggregate({
            where: { status: { in: ['SUCCESS', 'PAID'] } },
            _sum: { amountPaise: true },
          }),
          tx.tenant.findMany({
            where: merchantWhere,
            take: 5,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            select: { id: true, name: true, createdAt: true },
          }),
          tx.reviewReport.count({ where: pendingWhere }),
          tx.productReview.count({
            where: { status: 'REMOVED', moderatedAt: { gte: month } },
          }),
          tx.reviewReport.count({ where: { status: 'RESOLVED' } }),
          tx.reviewReport.findMany({
            where: pendingWhere,
            take: 5,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            select: {
              id: true,
              reason: true,
              status: true,
              createdAt: true,
              review: {
                select: {
                  id: true,
                  rating: true,
                  reviewerName: true,
                  store: { select: { name: true } },
                  product: { select: { name: true } },
                },
              },
            },
          }),
          tx.order.findMany({
            take: 5,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            select: {
              id: true,
              orderNumber: true,
              totalPaise: true,
              currency: true,
              paymentStatus: true,
              createdAt: true,
              store: { select: { name: true } },
            },
          }),
          this.charts(tx, from),
        ]);
        return {
          generatedAt: now.toISOString(),
          range,
          kpis: {
            totalMerchants,
            liveStores: live[0].count,
            privateStores,
            suspendedStores,
            activeSubscriptions: active[0].count,
            totalProducts,
            totalOrders,
            totalCustomers,
            totalReviews,
            pendingReviewReports: pendingReports,
            subscriptionRevenuePaise: revenue._sum.amountPaise ?? 0,
          },
          recentlyJoinedMerchants,
          recentOrders,
          charts,
          reviewModeration: {
            pendingReports,
            removedThisMonth,
            resolvedReports,
            latestPendingReports,
          },
          definitions: {
            totalMerchants:
              'Non-deleted businesses (Tenant), each counted once, with an active owner membership linked to a non-deleted SELLER_OWNER who is not a platform admin. Extra stores do not add merchants.',
            liveStores:
              'Canonical public storefront access: non-deleted LIVE/public stores whose latest subscription is ACTIVE and has not expired.',
            privateStores: 'Non-deleted DRAFT or PRIVATE_PREVIEW stores.',
            suspendedStores: 'Non-deleted SUSPENDED stores.',
            activeSubscriptions:
              'Latest subscription per non-deleted tenant, ACTIVE with validity not expired; older superseded rows are excluded.',
            totalProducts:
              'Non-deleted products across stores and product statuses.',
            totalOrders:
              'All persisted customer Order rows, including cancelled orders.',
            totalCustomers:
              'Customer records across stores; the same person in two stores counts twice.',
            totalReviews:
              'ACTIVE ProductReview rows; removed reviews are excluded.',
            pendingReviewReports:
              'ReviewReport rows with PENDING or UNDER_REVIEW status.',
            subscriptionRevenuePaise:
              'Integer paise sum of SUCCESS/PAID SubscriptionPayment rows. Failed/pending/cancelled payments and customer order GMV are excluded.',
            removedThisMonth:
              'Currently REMOVED product reviews whose moderatedAt falls in the current UTC month. Restored reviews are excluded.',
            resolvedReports:
              'ReviewReport rows currently RESOLVED; DISMISSED reports are separate.',
            timestamps:
              'Charts use database timestamps in UTC: tenant/order/report createdAt, report resolvedAt, and invoice paidAt for revenue. Legacy successful payments without paidAt use their persisted payment createdAt.',
            range:
              'Cards are current platform totals; charts use the selected date range.',
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        timeout: 10000,
      },
    );
  }

  private async charts(tx: Prisma.TransactionClient, from: Date | null) {
    const merchantDate = from
      ? Prisma.sql`AND t.created_at >= ${from}`
      : Prisma.empty;
    const orderDate = from
      ? Prisma.sql`WHERE created_at >= ${from}`
      : Prisma.empty;
    const paymentDate = from
      ? Prisma.sql`AND COALESCE(i.paid_at,p.created_at) >= ${from}`
      : Prisma.empty;
    const reportDate = from
      ? Prisma.sql`WHERE created_at >= ${from}`
      : Prisma.empty;
    const resolvedDate = from
      ? Prisma.sql`AND resolved_at >= ${from}`
      : Prisma.empty;
    const [
      merchantGrowth,
      subscriptionRevenueTrends,
      orderTrends,
      reportTrends,
    ] = await Promise.all([
      tx.$queryRaw<Array<{ date: string; count: number }>>(Prisma.sql`
        SELECT to_char(date_trunc('day',t.created_at),'YYYY-MM-DD') AS date,count(*)::int AS count
        FROM tenants t WHERE t.deleted_at IS NULL ${merchantDate}
        AND EXISTS(SELECT 1 FROM tenant_memberships m JOIN users u ON u.id=m.user_id
          WHERE m.tenant_id=t.id AND m.role='SELLER_OWNER' AND m.is_active=true
          AND u.deleted_at IS NULL AND u.role='SELLER_OWNER' AND u."isSuperAdmin"=false)
        GROUP BY 1 ORDER BY 1`),
      tx.$queryRaw<Array<{ date: string; amountPaise: number }>>(Prisma.sql`
        SELECT to_char(date_trunc('day',COALESCE(i.paid_at,p.created_at)),'YYYY-MM-DD') AS date,
          sum(p.amount_paise)::double precision AS "amountPaise"
        FROM subscription_payments p JOIN subscription_invoices i ON i.id=p.invoice_id
        WHERE p.status IN ('SUCCESS','PAID') ${paymentDate} GROUP BY 1 ORDER BY 1`),
      tx.$queryRaw<
        Array<{ date: string; count: number; gmvPaise: number }>
      >(Prisma.sql`
        SELECT to_char(date_trunc('day',created_at),'YYYY-MM-DD') AS date,count(*)::int AS count,
          COALESCE(sum(total_paise) FILTER(WHERE payment_status='PAID'),0)::double precision AS "gmvPaise"
        FROM orders ${orderDate} GROUP BY 1 ORDER BY 1`),
      tx.$queryRaw<
        Array<{ date: string; count: number; resolved: number }>
      >(Prisma.sql`
        SELECT date,sum(created)::int AS count,sum(resolved)::int AS resolved FROM (
          SELECT to_char(date_trunc('day',created_at),'YYYY-MM-DD') AS date,count(*) AS created,0 AS resolved
          FROM review_reports ${reportDate} GROUP BY 1
          UNION ALL
          SELECT to_char(date_trunc('day',resolved_at),'YYYY-MM-DD') AS date,0 AS created,count(*) AS resolved
          FROM review_reports WHERE status='RESOLVED' ${resolvedDate} GROUP BY 1
        ) events GROUP BY date ORDER BY date`),
    ]);
    return {
      merchantGrowth,
      subscriptionRevenueTrends,
      orderTrends,
      reportTrends,
    };
  }
}

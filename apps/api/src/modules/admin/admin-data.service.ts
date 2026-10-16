import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, UserRole, StoreStatus } from '@prisma/client';
import { getBrandConfig } from '@simply/config';
import { planAvailability } from '../subscriptions/plan-policy';

export interface AdminQuery {
  search?: string;
  status?: string;
  role?: string;
  planId?: string;
  subscriptionStatus?: string;
  tenantId?: string;
  page?: string | number;
  pageSize?: string | number;
  sort?: string;
  range?: string;
}
function paging(q: AdminQuery) {
  const page = Math.max(1, Math.min(100000, Math.floor(Number(q.page) || 1))),
    pageSize = Math.max(1, Math.min(100, Math.floor(Number(q.pageSize) || 20)));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
function envelope<T>(
  items: T[],
  total: number,
  p: { page: number; pageSize: number },
) {
  return {
    items,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.ceil(total / p.pageSize),
    pagination: {
      page: p.page,
      pageSize: p.pageSize,
      total,
      totalPages: Math.ceil(total / p.pageSize),
    },
  };
}
export function adminRange(range = '30d') {
  const days: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '3m': 90,
    '6m': 180,
    '12m': 365,
  };
  if (range === 'ALL') return null;
  if (!days[range])
    throw new BadRequestException('Choose 7d, 30d, 3m, 6m, 12m or ALL.');
  return new Date(Date.now() - days[range] * 86400000);
}
const orderSelect = {
  id: true,
  orderNumber: true,
  totalPaise: true,
  currency: true,
  paymentMethod: true,
  paymentStatus: true,
  fulfillmentStatus: true,
  shipmentStatus: true,
  status: true,
  createdAt: true,
  store: { select: { id: true, name: true, slug: true } },
  customer: { select: { fullName: true } },
} satisfies Prisma.OrderSelect;

@Injectable()
export class AdminDataService {
  constructor(private readonly db: PrismaClient) {}
  async overview(range = '30d') {
    const from = adminRange(range),
      now = new Date(),
      month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const [
      totalMerchants,
      liveStores,
      privateStores,
      suspendedStores,
      activeSubscriptions,
      totalProducts,
      totalOrders,
      totalCustomers,
      totalReviews,
      subscriptionRevenue,
      recentlyJoinedMerchants,
      pendingReports,
      removedThisMonth,
      resolvedReports,
      latestPendingReports,
      recentOrders,
    ] = await Promise.all([
      this.db.tenant.count({
        where: {
          deletedAt: null,
          memberships: {
            some: {
              role: 'SELLER_OWNER',
              isActive: true,
              user: { deletedAt: null },
            },
          },
        },
      }),
      this.liveStoreCount(now),
      this.db.store.count({
        where: {
          deletedAt: null,
          status: { in: ['DRAFT', 'PRIVATE_PREVIEW'] },
        },
      }),
      this.db.store.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      this.db.subscription.count({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: { gt: now },
          tenant: { deletedAt: null },
        },
      }),
      this.db.product.count({ where: { deletedAt: null } }),
      this.db.order.count(),
      this.db.customer.count(),
      this.db.productReview.count({ where: { status: 'ACTIVE' } }),
      this.db.subscriptionPayment.aggregate({
        where: { status: { in: ['SUCCESS', 'PAID'] } },
        _sum: { amountPaise: true },
      }),
      this.db.tenant.findMany({
        where: {
          deletedAt: null,
          memberships: {
            some: {
              role: 'SELLER_OWNER',
              isActive: true,
              user: { deletedAt: null },
            },
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true },
      }),
      this.db.reviewReport.count({
        where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
      }),
      this.db.auditLog.count({
        where: { action: 'REVIEW_REMOVED', createdAt: { gte: month } },
      }),
      this.db.reviewReport.count({ where: { status: 'RESOLVED' } }),
      this.db.reviewReport.findMany({
        where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
        take: 5,
        orderBy: { createdAt: 'desc' },
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
      this.db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: orderSelect,
      }),
    ]);
    const kpis = {
      totalMerchants,
      liveStores,
      privateStores,
      suspendedStores,
      activeSubscriptions,
      totalProducts,
      totalOrders,
      totalCustomers,
      totalReviews,
      pendingReviewReports: pendingReports,
      subscriptionRevenuePaise: subscriptionRevenue._sum.amountPaise || 0,
    };
    return {
      kpis,
      recentlyJoinedMerchants,
      recentOrders,
      reviewModeration: {
        pendingReports,
        removedThisMonth,
        resolvedReports,
        latestPendingReports,
      },
      range,
      charts: await this.charts(from),
      definitions: {
        totalMerchants:
          'Non-deleted merchant businesses with an active owner membership.',
        liveStores:
          'LIVE, public stores in an active tenant whose latest subscription is ACTIVE and unexpired.',
        privateStores:
          'Non-deleted stores with DRAFT or PRIVATE_PREVIEW status.',
        suspendedStores: 'Non-deleted stores with SUSPENDED status.',
        activeSubscriptions:
          'ACTIVE subscription rows with unexpired validity and a non-deleted tenant.',
        totalProducts:
          'Non-deleted products across all stores and product statuses.',
        totalOrders:
          'All persisted customer orders, including cancelled orders.',
        totalCustomers:
          'Customer records across stores; the same person in two stores counts twice.',
        pendingReviewReports:
          'Review reports with PENDING or UNDER_REVIEW status.',
        subscriptionRevenuePaise:
          'Sum of successful platform SubscriptionPayment records, in paise; excludes customer orders.',
        totalReviews: 'ACTIVE product reviews; removed reviews are excluded.',
        range:
          'Counts are current platform totals; charts use the selected date range.',
      },
    };
  }
  async liveStoreCount(now: Date) {
    const [row] = await this.db.$queryRaw<
      Array<{ count: number }>
    >`SELECT count(*)::int AS count FROM stores s JOIN tenants t ON t.id=s.tenant_id JOIN LATERAL (SELECT status,current_period_end FROM subscriptions sub WHERE sub.tenant_id=t.id ORDER BY sub.created_at DESC LIMIT 1) latest ON true WHERE s.deleted_at IS NULL AND t.deleted_at IS NULL AND t.status='ACTIVE' AND s.status='LIVE' AND s.is_publicly_accessible=true AND latest.status='ACTIVE' AND latest.current_period_end > ${now}`;
    return row.count;
  }
  async charts(from: Date | null) {
    const cutoff = from || new Date('1970-01-01T00:00:00Z');
    // Aggregate inside PostgreSQL; only actual observed dates are returned.
    const [
      merchantGrowth,
      subscriptionRevenueTrends,
      orderTrends,
      reportTrends,
    ] = await Promise.all([
      this.db.$queryRaw<
        Array<{ date: string; count: number }>
      >`SELECT to_char(date_trunc('day', t.created_at), 'YYYY-MM-DD') AS date, count(*)::int AS count FROM tenants t WHERE t.deleted_at IS NULL AND t.created_at >= ${cutoff} AND EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id=t.id AND m.role='SELLER_OWNER' AND m.is_active=true AND EXISTS (SELECT 1 FROM users u WHERE u.id=m.user_id AND u.deleted_at IS NULL)) GROUP BY 1 ORDER BY 1`,
      this.db.$queryRaw<
        Array<{ date: string; amountPaise: number }>
      >`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, sum(amount_paise)::double precision AS "amountPaise" FROM subscription_payments WHERE status IN ('SUCCESS','PAID') AND created_at >= ${cutoff} GROUP BY 1 ORDER BY 1`,
      this.db.$queryRaw<
        Array<{ date: string; count: number; gmvPaise: number }>
      >`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, count(*)::int AS count, COALESCE(sum(total_paise) FILTER (WHERE payment_status='PAID'),0)::double precision AS "gmvPaise" FROM orders WHERE created_at >= ${cutoff} GROUP BY 1 ORDER BY 1`,
      this.db.$queryRaw<
        Array<{ date: string; count: number; resolved: number }>
      >`SELECT date, sum(created)::int AS count, sum(resolved)::int AS resolved FROM (SELECT to_char(date_trunc('day', created_at),'YYYY-MM-DD') AS date,count(*)::int AS created,0 AS resolved FROM review_reports WHERE created_at >= ${cutoff} GROUP BY 1 UNION ALL SELECT to_char(date_trunc('day', resolved_at),'YYYY-MM-DD') AS date,0 AS created,count(*)::int AS resolved FROM review_reports WHERE status='RESOLVED' AND resolved_at >= ${cutoff} GROUP BY 1) events GROUP BY date ORDER BY date`,
    ]);
    return {
      merchantGrowth,
      subscriptionRevenueTrends,
      orderTrends,
      reportTrends,
    };
  }
  async merchants(q: AdminQuery = {}) {
    const p = paging(q),
      conditions: Prisma.Sql[] = [
        Prisma.sql`t.deleted_at IS NULL`,
        Prisma.sql`EXISTS(SELECT 1 FROM tenant_memberships m JOIN users u ON u.id=m.user_id WHERE m.tenant_id=t.id AND m.role='SELLER_OWNER' AND m.is_active=true AND u.deleted_at IS NULL)`,
      ];
    if (q.search?.trim()) {
      const term = '%' + q.search.trim() + '%';
      conditions.push(
        Prisma.sql`(t.name ILIKE ${term} OR t.slug ILIKE ${term} OR EXISTS(SELECT 1 FROM tenant_memberships m JOIN users u ON u.id=m.user_id WHERE m.tenant_id=t.id AND (u."fullName" ILIKE ${term} OR u.email ILIKE ${term} OR u.phone ILIKE ${term})) OR EXISTS(SELECT 1 FROM stores st WHERE st.tenant_id=t.id AND st.deleted_at IS NULL AND (st.name ILIKE ${term} OR st.slug ILIKE ${term})))`,
      );
    }
    if (q.status && q.status !== 'ALL') {
      if (q.status === 'SUSPENDED')
        conditions.push(
          Prisma.sql`(t.status='SUSPENDED' OR EXISTS(SELECT 1 FROM stores st WHERE st.tenant_id=t.id AND st.deleted_at IS NULL AND st.status='SUSPENDED'))`,
        );
      else if (q.status === 'LIVE' || q.status === 'TRIAL')
        conditions.push(
          Prisma.sql`EXISTS(SELECT 1 FROM stores st WHERE st.tenant_id=t.id AND st.deleted_at IS NULL AND st.status::text=${q.status === 'LIVE' ? 'LIVE' : 'PRIVATE_PREVIEW'})`,
        );
      else if (q.status === 'SUBSCRIBED')
        conditions.push(
          Prisma.sql`sub.status='ACTIVE' AND sub.current_period_end > ${new Date()}`,
        );
      else if (q.status === 'EXPIRED')
        conditions.push(
          Prisma.sql`(sub.status IN ('EXPIRED','PAST_DUE') OR sub.current_period_end <= ${new Date()})`,
        );
      else throw new BadRequestException('Invalid store status filter.');
    }
    if (q.planId) conditions.push(Prisma.sql`sub.plan_id=${q.planId}`);
    if (q.subscriptionStatus && q.subscriptionStatus !== 'ALL') {
      if (
        ![
          'ACTIVE',
          'TRIALING',
          'PAST_DUE',
          'EXPIRED',
          'CANCELED',
          'UNPAID',
        ].includes(q.subscriptionStatus)
      )
        throw new BadRequestException('Invalid subscription status.');
      conditions.push(Prisma.sql`sub.status::text=${q.subscriptionStatus}`);
    }
    const base = Prisma.sql`FROM tenants t LEFT JOIN LATERAL(SELECT status,plan_id,current_period_end FROM subscriptions WHERE tenant_id=t.id ORDER BY created_at DESC LIMIT 1) sub ON true WHERE ${Prisma.join(conditions, ' AND ')}`;
    const direction = q.sort === 'oldest' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const [[count], ids] = await Promise.all([
      this.db.$queryRaw<Array<{ total: number }>>(
        Prisma.sql`SELECT count(*)::int AS total ${base}`,
      ),
      this.db.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT t.id ${base} ORDER BY t.created_at ${direction},t.id ASC LIMIT ${p.pageSize} OFFSET ${p.skip}`,
      ),
    ]);
    const rows = await this.db.tenant.findMany({
      where: { id: { in: ids.map((i) => i.id) } },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          where: {
            role: 'SELLER_OWNER',
            isActive: true,
            user: { deletedAt: null },
          },
          take: 1,
          select: {
            user: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
        stores: {
          where: { deletedAt: null },
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, slug: true, status: true },
        },
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            plan: {
              select: { id: true, name: true, code: true, pricePaise: true },
            },
          },
        },
      },
    });
    const items = ids
      .map((i) => rows.find((r) => r.id === i.id)!)
      .map(({ memberships, stores, subscriptions, ...tenant }) => ({
        ...tenant,
        owner: memberships[0]?.user || null,
        store: stores[0] || null,
        subscription: subscriptions[0] || null,
      }));
    return envelope(items, count.total, p);
  }

  async users(q: AdminQuery = {}) {
    const p = paging(q),
      where: Prisma.UserWhereInput = { deletedAt: null };
    if (q.role) {
      if (!Object.values(UserRole).includes(q.role as UserRole))
        throw new BadRequestException('Invalid role.');
      where.role = q.role as UserRole;
    }
    if (q.status) {
      if (!['ACTIVE', 'INACTIVE'].includes(q.status))
        throw new BadRequestException('Invalid user status.');
      where.isActive = q.status === 'ACTIVE';
    }
    if (q.search)
      where.OR = [
        { fullName: { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
      ];
    const [total, rows] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.findMany({
        where,
        take: p.pageSize,
        skip: p.skip,
        orderBy: { createdAt: q.sort === 'oldest' ? 'asc' : 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isSuperAdmin: true,
          createdAt: true,
          memberships: {
            take: 1,
            select: {
              tenant: {
                select: {
                  stores: {
                    where: { deletedAt: null },
                    take: 1,
                    select: { id: true, name: true, slug: true, status: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);
    return envelope(
      rows.map(({ memberships, ...u }) => ({
        ...u,
        store: memberships[0]?.tenant.stores[0] || null,
      })),
      total,
      p,
    );
  }
  async orders(q: AdminQuery = {}) {
    const p = paging(q),
      where: Prisma.OrderWhereInput = {};
    if (q.search)
      where.OR = [
        { orderNumber: { contains: q.search, mode: 'insensitive' } },
        { store: { name: { contains: q.search, mode: 'insensitive' } } },
        { customer: { fullName: { contains: q.search, mode: 'insensitive' } } },
      ];
    const from = adminRange(q.range || 'ALL');
    if (from) where.createdAt = { gte: from };
    const [total, items] = await Promise.all([
      this.db.order.count({ where }),
      this.db.order.findMany({
        where,
        take: p.pageSize,
        skip: p.skip,
        orderBy: { createdAt: q.sort === 'oldest' ? 'asc' : 'desc' },
        select: orderSelect,
      }),
    ]);
    return envelope(items, total, p);
  }
  async plans() {
    const [plans, counts] = await Promise.all([
      this.db.plan.findMany({ orderBy: { pricePaise: 'asc' } }),
      this.db.$queryRaw<
        Array<{ planId: string; merchants: number; active: number }>
      >`SELECT plan_id AS "planId",count(DISTINCT tenant_id)::int AS merchants,count(DISTINCT tenant_id) FILTER(WHERE status='ACTIVE' AND current_period_end > ${new Date()})::int AS active FROM subscriptions GROUP BY plan_id`,
    ]);
    return plans.map((p) => ({
      ...p,
      ...planAvailability(p),
      merchantCount: counts.find((c) => c.planId === p.id)?.merchants || 0,
      activeSubscribersCount:
        counts.find((c) => c.planId === p.id)?.active || 0,
    }));
  }
  async subscriptions(q: AdminQuery = {}) {
    const p = paging(q),
      where: Prisma.SubscriptionWhereInput = q.tenantId
        ? { tenantId: q.tenantId }
        : {};
    const [total, items] = await Promise.all([
      this.db.subscription.count({ where }),
      this.db.subscription.findMany({
        where,
        take: p.pageSize,
        skip: p.skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          createdAt: true,
          tenant: { select: { id: true, name: true } },
          plan: {
            select: { id: true, name: true, pricePaise: true, code: true },
          },
          invoices: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { status: true, paidAt: true },
          },
        },
      }),
    ]);
    return envelope(items, total, p);
  }
  async analytics(range = '30d') {
    const from = adminRange(range),
      createdAt = from ? { gte: from } : undefined;
    const [paid, totalOrders, subscriptionRevenue] = await Promise.all([
      this.db.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt },
        _sum: { totalPaise: true },
        _count: true,
      }),
      this.db.order.count({ where: { createdAt } }),
      this.db.subscriptionPayment.aggregate({
        where: { status: { in: ['SUCCESS', 'PAID'] }, createdAt },
        _sum: { amountPaise: true },
      }),
    ]);
    const leaders = await this.db.order.groupBy({
      by: ['storeId'],
      where: { createdAt },
      _count: { _all: true },
      orderBy: { _count: { storeId: 'desc' } },
      take: 5,
    });
    const stores = await this.db.store.findMany({
      where: { id: { in: leaders.map((l) => l.storeId) } },
      select: { id: true, name: true, slug: true },
    });
    return {
      range,
      kpis: {
        totalOrders,
        paidOrdersCount: paid._count,
        totalGmvPaise: paid._sum.totalPaise || 0,
        averageOrderValuePaise: paid._count
          ? Math.round((paid._sum.totalPaise || 0) / paid._count)
          : 0,
        subscriptionRevenuePaise: subscriptionRevenue._sum.amountPaise || 0,
      },
      charts: await this.charts(from),
      topStores: leaders.map((l) => ({
        ...stores.find((s) => s.id === l.storeId)!,
        ordersCount: l._count._all,
      })),
    };
  }
  async themes() {
    return this.db.theme.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        isDefault: true,
        updatedAt: true,
        _count: { select: { storeConfigs: true } },
      },
    });
  }
  async settings() {
    const brand = getBrandConfig();
    const growth = await this.db.plan.findUnique({
      where: { code: 'GROWTH_MONTHLY' },
    });
    return {
      platformName: brand.brandName,
      supportEmail: brand.supportEmail,
      currency: brand.defaultCurrency,
      timezone: brand.timezone,
      source: 'Current backend deployment configuration (read-only)',
      moderation:
        'Merchant reports stay visible until an admin removes a review.',
      plansSource: 'Canonical backend plan records',
      growthPurchaseEnabled: growth
        ? planAvailability(growth).purchasable
        : false,
    };
  }
}

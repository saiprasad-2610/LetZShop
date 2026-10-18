import { AdminDashboardService } from './admin-dashboard.service';
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
    '90d': 90,
    '6m': 180,
    '12m': 365,
  };
  if (range === 'ALL') return null;
  if (!Object.prototype.hasOwnProperty.call(days, range))
    throw new BadRequestException('Choose 7d, 30d, 90d, 3m, 6m, 12m or ALL.');
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
  constructor(
    private readonly db: PrismaClient,
    private readonly dashboard: AdminDashboardService,
  ) {}
  async overview(range = '30d', fromStr?: string, toStr?: string) {
    let from: Date | null = null;
    let to: Date | null = null;
    if (range === 'custom') {
      if ((fromStr && !toStr) || (!fromStr && toStr)) {
        throw new BadRequestException(
          'Both "from" and "to" query parameters are required for custom date range.',
        );
      }
      if (fromStr && toStr) {
        from = new Date(fromStr);
        to = new Date(toStr);
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
          throw new BadRequestException(
            'Invalid date format for custom range. Use YYYY-MM-DD.',
          );
        }
        if (from > to) {
          throw new BadRequestException(
            'From date must be on or before To date.',
          );
        }
        // Set to end of day in UTC
        to = new Date(
          Date.UTC(
            to.getUTCFullYear(),
            to.getUTCMonth(),
            to.getUTCDate(),
            23,
            59,
            59,
            999,
          ),
        );
      } else {
        from = adminRange('30d');
      }
    } else {
      from = adminRange(range);
    }
    return this.dashboard.read(from, range, to);
  }

  async attentionSummary() {
    return this.dashboard.getAttentionSummary();
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
      const s = q.status.toUpperCase();
      if (s === 'SUSPENDED') {
        conditions.push(
          Prisma.sql`(t.status='SUSPENDED' OR EXISTS(SELECT 1 FROM stores st WHERE st.tenant_id=t.id AND st.deleted_at IS NULL AND st.status='SUSPENDED'))`,
        );
      } else if (s === 'LIVE') {
        conditions.push(
          Prisma.sql`EXISTS(SELECT 1 FROM stores st WHERE st.tenant_id=t.id AND st.deleted_at IS NULL AND st.status='LIVE')`,
        );
      } else if (s === 'PRIVATE_PREVIEW' || s === 'TRIAL') {
        conditions.push(
          Prisma.sql`EXISTS(SELECT 1 FROM stores st WHERE st.tenant_id=t.id AND st.deleted_at IS NULL AND st.status='PRIVATE_PREVIEW')`,
        );
      } else if (s === 'DRAFT') {
        conditions.push(
          Prisma.sql`EXISTS(SELECT 1 FROM stores st WHERE st.tenant_id=t.id AND st.deleted_at IS NULL AND st.status='DRAFT')`,
        );
      } else if (s === 'ARCHIVED') {
        conditions.push(
          Prisma.sql`(t.status='ARCHIVED' OR EXISTS(SELECT 1 FROM stores st WHERE st.tenant_id=t.id AND st.deleted_at IS NULL AND st.status='ARCHIVED'))`,
        );
      } else if (s === 'SUBSCRIBED') {
        conditions.push(
          Prisma.sql`sub.status='ACTIVE' AND sub.current_period_end > ${new Date()}`,
        );
      } else if (s === 'EXPIRED') {
        conditions.push(
          Prisma.sql`(sub.status IN ('EXPIRED','PAST_DUE') OR sub.current_period_end <= ${new Date()})`,
        );
      } else {
        throw new BadRequestException('Invalid store status filter.');
      }
    }
    if (q.planId && q.planId !== 'ALL') {
      if (q.planId === 'NONE' || q.planId === 'NO_SUBSCRIPTION') {
        conditions.push(Prisma.sql`sub.plan_id IS NULL`);
      } else {
        conditions.push(
          Prisma.sql`(sub.plan_id=${q.planId} OR EXISTS(SELECT 1 FROM subscription_plans sp WHERE sp.id=sub.plan_id AND (sp.code ILIKE ${q.planId} OR sp.name ILIKE ${q.planId})))`,
        );
      }
    }
    if (q.subscriptionStatus && q.subscriptionStatus !== 'ALL') {
      const subStatus = q.subscriptionStatus.toUpperCase();
      if (subStatus === 'NONE' || subStatus === 'NO_SUBSCRIPTION') {
        conditions.push(Prisma.sql`sub.status IS NULL`);
      } else if (
        [
          'ACTIVE',
          'TRIALING',
          'PAST_DUE',
          'EXPIRED',
          'CANCELED',
          'UNPAID',
        ].includes(subStatus)
      ) {
        conditions.push(Prisma.sql`sub.status::text=${subStatus}`);
      } else {
        throw new BadRequestException('Invalid subscription status.');
      }
    }
    const base = Prisma.sql`FROM tenants t LEFT JOIN LATERAL(SELECT status,plan_id,current_period_end FROM subscriptions WHERE tenant_id=t.id ORDER BY created_at DESC LIMIT 1) sub ON true WHERE ${Prisma.join(conditions, ' AND ')}`;
    let orderBySql = Prisma.sql`t.created_at DESC, t.id ASC`;
    if (q.sort === 'oldest') {
      orderBySql = Prisma.sql`t.created_at ASC, t.id ASC`;
    } else if (q.sort === 'alpha_asc' || q.sort === 'name_asc') {
      orderBySql = Prisma.sql`t.name ASC, t.id ASC`;
    } else if (q.sort === 'alpha_desc' || q.sort === 'name_desc') {
      orderBySql = Prisma.sql`t.name DESC, t.id ASC`;
    }
    const [[count], ids] = await Promise.all([
      this.db.$queryRaw<Array<{ total: number }>>(
        Prisma.sql`SELECT count(*)::int AS total ${base}`,
      ),
      this.db.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT t.id ${base} ORDER BY ${orderBySql} LIMIT ${p.pageSize} OFFSET ${p.skip}`,
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
    const p = paging(q);
    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (q.role && q.role !== 'ALL') {
      if (!Object.values(UserRole).includes(q.role as UserRole))
        throw new BadRequestException('Invalid role.');
      where.role = q.role as UserRole;
    }
    if (q.status && q.status !== 'ALL') {
      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(q.status))
        throw new BadRequestException('Invalid user status.');
      where.isActive = q.status === 'ACTIVE';
    }
    if (q.search?.trim()) {
      const term = q.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        {
          memberships: {
            some: {
              tenant: {
                OR: [
                  { name: { contains: term, mode: 'insensitive' } },
                  { stores: { some: { name: { contains: term, mode: 'insensitive' } } } },
                ],
              },
            },
          },
        },
      ];
    }

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' };
    if (q.sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (q.sort === 'name_asc') {
      orderBy = { fullName: 'asc' };
    } else if (q.sort === 'name_desc') {
      orderBy = { fullName: 'desc' };
    }

    const [total, rows, totalUsers, merchantOwners, staffUsers, platformAdmins, suspendedUsers] =
      await Promise.all([
        this.db.user.count({ where }),
        this.db.user.findMany({
          where,
          take: p.pageSize,
          skip: p.skip,
          orderBy,
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            isSuperAdmin: true,
            createdAt: true,
            updatedAt: true,
            memberships: {
              where: { isActive: true },
              select: {
                role: true,
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    stores: {
                      where: { deletedAt: null },
                      select: { id: true, name: true, slug: true, status: true },
                    },
                  },
                },
              },
            },
            devices: {
              take: 1,
              orderBy: { lastSeenAt: 'desc' },
              select: { lastSeenAt: true },
            },
            sessions: {
              take: 1,
              orderBy: { updatedAt: 'desc' },
              select: { createdAt: true, updatedAt: true },
            },
          },
        }),
        this.db.user.count({ where: { deletedAt: null } }),
        this.db.user.count({ where: { deletedAt: null, role: 'SELLER_OWNER' } }),
        this.db.user.count({ where: { deletedAt: null, role: 'SELLER_STAFF' } }),
        this.db.user.count({ where: { deletedAt: null, role: 'PLATFORM_ADMIN' } }),
        this.db.user.count({ where: { deletedAt: null, isActive: false } }),
      ]);

    const userIds = rows.map((u) => u.id);
    const recentAuditLogs = userIds.length
      ? await this.db.auditLog.findMany({
          where: {
            entityType: 'User',
            entityId: { in: userIds },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            action: true,
            entityId: true,
            createdAt: true,
            actorId: true,
            metadata: true,
          },
        })
      : [];

    const auditByUserId = new Map<string, any[]>();
    for (const a of recentAuditLogs) {
      if (!a.entityId) continue;
      const list = auditByUserId.get(a.entityId) || [];
      const meta =
        a.metadata && typeof a.metadata === 'object'
          ? (a.metadata as any)
          : {};
      list.push({
        id: a.id,
        action: a.action,
        date: a.createdAt.toISOString(),
        reason: meta.reason || null,
        adminName: meta.adminName || 'Admin',
      });
      auditByUserId.set(a.entityId, list);
    }

    const items = rows.map(({ memberships, devices, sessions, ...u }) => {
      const primaryMembership = memberships[0];
      const tenant = primaryMembership?.tenant || null;
      const stores = tenant?.stores || [];
      const primaryStore = stores[0] || null;

      const deviceSeen = devices[0]?.lastSeenAt;
      const sessionUpdated = sessions[0]?.updatedAt;
      let lastLoginAt: string | null = null;
      if (deviceSeen && sessionUpdated) {
        lastLoginAt = (
          deviceSeen > sessionUpdated ? deviceSeen : sessionUpdated
        ).toISOString();
      } else if (deviceSeen) {
        lastLoginAt = deviceSeen.toISOString();
      } else if (sessionUpdated) {
        lastLoginAt = sessionUpdated.toISOString();
      }

      return {
        ...u,
        tenant: tenant
          ? { id: tenant.id, name: tenant.name, slug: tenant.slug }
          : null,
        store: primaryStore,
        stores,
        lastLoginAt,
        recentActivity: auditByUserId.get(u.id) || [],
      };
    });

    const kpis = {
      totalUsers,
      merchantOwners,
      staffUsers,
      platformAdmins,
      suspendedUsers,
    };

    const result = envelope(items, total, p);
    return {
      ...result,
      kpis,
    };
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
      this.db.plan.findMany({
        include: {
          highlights: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.db.$queryRaw<
        Array<{ planId: string; merchants: number; active: number }>
      >`SELECT plan_id AS "planId",count(DISTINCT tenant_id)::int AS merchants,count(DISTINCT tenant_id) FILTER(WHERE status='ACTIVE' AND current_period_end > ${new Date()})::int AS active FROM subscriptions GROUP BY plan_id`,
    ]);

    // Plans with numeric price sort ascending by pricePaise.
    // Plans without a fixed numeric price (0/contact) sort LAST.
    const sortedPlans = [...plans].sort((a, b) => {
      const aIsCustom = a.pricePaise <= 0 || a.code === 'CUSTOM';
      const bIsCustom = b.pricePaise <= 0 || b.code === 'CUSTOM';
      if (aIsCustom && !bIsCustom) return 1;
      if (!aIsCustom && bIsCustom) return -1;
      return a.pricePaise - b.pricePaise;
    });

    return sortedPlans.map((p) => ({
      ...p,
      ...planAvailability(p),
      merchantCount: counts.find((c) => c.planId === p.id)?.merchants || 0,
      activeSubscribersCount:
        counts.find((c) => c.planId === p.id)?.active || 0,
    }));
  }

  async subscriptionKpis() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [activeSubscriptions, paidInvoices, expiringSoon, failedInvoices, pastDueSubscriptions] =
      await Promise.all([
        this.db.subscription.count({
          where: { status: 'ACTIVE' },
        }),
        this.db.subscriptionInvoice.aggregate({
          where: { status: 'PAID' },
          _sum: { amountPaise: true },
        }),
        this.db.subscription.count({
          where: {
            status: 'ACTIVE',
            currentPeriodEnd: { lte: sevenDaysFromNow },
          },
        }),
        this.db.subscriptionInvoice.count({
          where: { status: { in: ['FAILED', 'UNPAID'] } },
        }),
        this.db.subscription.count({
          where: { status: 'PAST_DUE' },
        }),
      ]);

    return {
      activeSubscriptions,
      paidRevenuePaise: paidInvoices._sum.amountPaise || 0,
      expiringSoon,
      failedPayments: failedInvoices + pastDueSubscriptions,
    };
  }

  async subscriptions(q: AdminQuery = {}) {
    const p = paging(q);
    const where: Prisma.SubscriptionWhereInput = {};
    if (q.tenantId) {
      where.tenantId = q.tenantId;
    }
    if (q.status && q.status !== 'ALL') {
      where.status = q.status.toUpperCase() as any;
    }
    if (q.planId && q.planId !== 'ALL') {
      where.planId = q.planId;
    }
    if (q.range === 'EXPIRING_SOON') {
      const now = new Date();
      const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      where.currentPeriodEnd = { gte: now, lte: next7Days };
    } else if (q.range === 'EXPIRED') {
      where.currentPeriodEnd = { lt: new Date() };
    }
    if (q.search?.trim()) {
      const term = q.search.trim();
      where.OR = [
        { tenant: { name: { contains: term, mode: 'insensitive' } } },
        { plan: { name: { contains: term, mode: 'insensitive' } } },
        { plan: { code: { contains: term, mode: 'insensitive' } } },
        { invoices: { some: { invoiceNumber: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    let orderBy: Prisma.SubscriptionOrderByWithRelationInput = { createdAt: 'desc' };
    if (q.sort === 'createdAt_asc') {
      orderBy = { createdAt: 'asc' };
    } else if (q.sort === 'expiry_asc') {
      orderBy = { currentPeriodEnd: 'asc' };
    } else if (q.sort === 'expiry_desc') {
      orderBy = { currentPeriodEnd: 'desc' };
    }

    const [total, items] = await Promise.all([
      this.db.subscription.count({ where }),
      this.db.subscription.findMany({
        where,
        take: p.pageSize,
        skip: p.skip,
        orderBy,
        select: {
          id: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          createdAt: true,
          tenant: { select: { id: true, name: true, slug: true } },
          plan: {
            select: { id: true, name: true, pricePaise: true, code: true },
          },
          invoices: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, invoiceNumber: true, status: true, paidAt: true, amountPaise: true, invoicePdfUrl: true },
          },
        },
      }),
    ]);
    const mappedItems = items.map((sub) => ({
      ...sub,
      invoices: sub.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
        amountPaise: inv.amountPaise,
        pdfUrl: inv.invoicePdfUrl,
      })),
    }));
    return envelope(mappedItems, total, p);
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

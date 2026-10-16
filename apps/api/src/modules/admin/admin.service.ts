import { AdminDataService, AdminQuery } from './admin-data.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  TenantStatus,
  StoreStatus,
  UserRole,
} from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { planAvailability } from '../subscriptions/plan-policy';

@Injectable()
export class AdminService {
  public getThemes() {
    return this.data.themes();
  }
  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentsService: PaymentsService,
    private readonly data: AdminDataService,
  ) {}

  public getOverview(range?: string) {
    return this.data.overview(range);
  }

  public getMerchants(query: string | AdminQuery = {}) {
    return this.data.merchants(
      typeof query === 'string' ? { search: query } : query,
    );
  }

  public async getMerchantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          where: { role: 'SELLER_OWNER' },
          take: 10,
          select: {
            id: true,
            role: true,
            user: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
        stores: {
          where: { deletedAt: null },
          take: 100,
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                products: { where: { deletedAt: null } },
                orders: true,
                customers: true,
                productReviews: { where: { status: 'ACTIVE' } },
              },
            },
          },
        },
        subscriptions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            createdAt: true,
            plan: {
              select: { id: true, name: true, code: true, pricePaise: true },
            },
          },
        },
        invoices: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            amountPaise: true,
            currency: true,
            status: true,
            createdAt: true,
            paidAt: true,
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Merchant not found.');
    const [reports] = await this.prisma.$queryRaw<
      Array<{ count: number }>
    >`SELECT count(DISTINCT r.review_id)::int AS count FROM review_reports r JOIN product_reviews v ON v.id=r.review_id JOIN stores s ON s.id=v.store_id WHERE s.tenant_id=${tenantId}`;
    const { invoices, ...merchant } = tenant;
    return {
      ...merchant,
      paymentHistory: invoices,
      reportedReviewCount: reports.count,
    };
  }

  public async suspendMerchant(
    tenantId: string,
    actorId: string,
    reason: string,
  ) {
    if (!reason?.trim() || reason.length > 2000)
      throw new BadRequestException('An audit reason is required.');
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`;
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        include: {
          stores: {
            where: { deletedAt: null },
            select: { id: true, status: true, isPubliclyAccessible: true },
          },
        },
      });
      if (!tenant || tenant.deletedAt)
        throw new NotFoundException('Merchant not found.');
      if (tenant.status === 'SUSPENDED')
        throw new BadRequestException('Merchant is already suspended.');
      const updated = await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'SUSPENDED' },
      });
      await tx.store.updateMany({
        where: { tenantId, deletedAt: null, status: { not: 'ARCHIVED' } },
        data: { status: 'SUSPENDED', isPubliclyAccessible: false },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'ADMIN',
          tenantId,
          action: 'MERCHANT_SUSPENDED',
          entityType: 'Tenant',
          entityId: tenantId,
          metadata: {
            reason: reason.trim(),
            previousStatus: tenant.status,
            stores: tenant.stores,
          },
        },
      });
      return updated;
    });
  }

  public async reactivateMerchant(
    tenantId: string,
    actorId: string,
    reason: string,
  ) {
    if (!reason?.trim() || reason.length > 2000)
      throw new BadRequestException('An audit reason is required.');
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`;
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        include: {
          stores: { where: { deletedAt: null } },
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      if (!tenant || tenant.deletedAt)
        throw new NotFoundException('Merchant not found.');
      if (tenant.status !== 'SUSPENDED')
        throw new BadRequestException(
          'Only suspended merchants can be reactivated.',
        );
      const suspension = await tx.auditLog.findFirst({
        where: { entityId: tenantId, action: 'MERCHANT_SUSPENDED' },
        orderBy: { createdAt: 'desc' },
      });
      const previous = ((suspension?.metadata as any)?.stores || []) as Array<{
        id: string;
        status: string;
        isPubliclyAccessible: boolean;
      }>;
      const sub = tenant.subscriptions[0],
        paid = Boolean(
          sub && sub.status === 'ACTIVE' && sub.currentPeriodEnd > new Date(),
        );
      for (const store of tenant.stores) {
        if (store.status !== 'SUSPENDED') continue;
        const old = previous.find((s) => s.id === store.id),
          live = paid && old?.status === 'LIVE' && old?.isPubliclyAccessible;
        await tx.store.update({
          where: { id: store.id },
          data: {
            status: live ? 'LIVE' : 'PRIVATE_PREVIEW',
            isPubliclyAccessible: Boolean(live),
          },
        });
      }
      const updated = await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'ADMIN',
          tenantId,
          action: 'MERCHANT_REACTIVATED',
          entityType: 'Tenant',
          entityId: tenantId,
          metadata: {
            reason: reason.trim(),
            previousStatus: tenant.status,
            paidSubscription: paid,
          },
        },
      });
      return updated;
    });
  }

  public getCommerceMonitoring(query: AdminQuery = {}) {
    return this.data.orders(query);
  }

  public async getOperationsSummary() {
    const [totalEvents, pendingEvents, failedEvents, failedOutbox] =
      await Promise.all([
        this.prisma.outboxEvent.count(),
        this.prisma.outboxEvent.count({ where: { status: 'PENDING' } }),
        this.prisma.outboxEvent.count({
          where: { status: { in: ['FAILED', 'DEAD_LETTER'] } },
        }),
        this.prisma.outboxEvent.findMany({
          where: { status: { in: ['FAILED', 'DEAD_LETTER'] } },
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            eventType: true,
            status: true,
            retryCount: true,
            maxRetries: true,
          },
        }),
      ]);
    return {
      outbox: { totalEvents, pendingEvents, failedEvents },
      failedOutbox,
    };
  }

  public async retryOutboxEvent(eventId: string, actorId: string) {
    const event = await this.prisma.outboxEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Outbox event not found.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: 'PENDING',
          retryCount: 0,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: event.tenantId,
          storeId: event.storeId,
          action: 'OUTBOX_EVENT_RETRY_TRIGGERED',
          entityType: 'OutboxEvent',
          entityId: event.id,
          metadata: {
            eventType: event.eventType,
            previousStatus: event.status,
          },
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        retryCount: updated.retryCount,
      };
    });
  }

  public async reconcilePaymentOrder(
    paymentOrderId: string,
    adminUserId?: string,
  ) {
    return this.paymentsService.reconcilePaymentOrder(
      paymentOrderId,
      adminUserId,
    );
  }

  public getUsers(query: AdminQuery = {}) {
    return this.data.users(query);
  }

  public async toggleUserStatus(userId: string, actorId: string) {
    if (userId === actorId)
      throw new BadRequestException(
        'You cannot deactivate your own admin account.',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
      const user = await tx.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true, isActive: true, role: true, isSuperAdmin: true },
      });
      if (!user) throw new NotFoundException('User not found.');
      if (user.role === 'PLATFORM_ADMIN' || user.isSuperAdmin)
        throw new BadRequestException(
          'Platform administrator access cannot be changed here.',
        );
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
        select: { id: true, isActive: true },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'ADMIN',
          action: user.isActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
          entityType: 'User',
          entityId: userId,
          metadata: {
            previousStatus: user.isActive ? 'ACTIVE' : 'INACTIVE',
            status: updated.isActive ? 'ACTIVE' : 'INACTIVE',
          },
        },
      });
      return updated;
    });
  }

  public getAnalytics(range?: string) {
    return this.data.analytics(range);
  }

  public getPlans() {
    return this.data.plans();
  }

  public getSubscriptionList(query: AdminQuery = {}) {
    return this.data.subscriptions(query);
  }

  public async getSubscriptionPayments(query: {
    status?: string;
    search?: string;
    page?: string;
  }) {
    const page = Math.max(
      1,
      Math.min(100000, parseInt(query.page || '1', 10) || 1),
    );
    const where: Prisma.SubscriptionPaymentWhereInput = {};
    if (query.status && query.status !== 'ALL') {
      if (!['PAID', 'PENDING', 'FAILED'].includes(query.status))
        throw new BadRequestException('Invalid payment status.');
      where.status =
        query.status === 'PAID' ? { in: ['SUCCESS', 'PAID'] } : query.status;
    }
    if (query.search?.trim())
      where.invoice = {
        tenant: {
          name: { contains: query.search.trim(), mode: 'insensitive' },
        },
      };
    const [total, items] = await Promise.all([
      this.prisma.subscriptionPayment.count({ where }),
      this.prisma.subscriptionPayment.findMany({
        where,
        skip: (page - 1) * 20,
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amountPaise: true,
          status: true,
          paymentMethod: true,
          providerPaymentId: true,
          createdAt: true,
          invoice: {
            select: {
              invoiceNumber: true,
              currency: true,
              paidAt: true,
              tenant: { select: { id: true, name: true } },
              subscription: { select: { plan: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);
    return {
      items,
      total,
      page,
      pageSize: 20,
      totalPages: Math.ceil(total / 20),
    };
  }

  public async getAuditLogs(query: { search?: string; page?: string }) {
    const page = Math.max(
      1,
      Math.min(100000, parseInt(query.page || '1', 10) || 1),
    );
    const where: Prisma.AuditLogWhereInput = query.search
      ? {
          OR: [
            { action: { contains: query.search, mode: 'insensitive' } },
            { entityId: { contains: query.search } },
            { actorId: { contains: query.search } },
          ],
        }
      : {};
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20,
        take: 20,
      }),
    ]);
    const actors = await this.prisma.user.findMany({
      where: {
        id: {
          in: rows
            .map((r) => r.actorId)
            .filter((id): id is string => Boolean(id)),
        },
      },
      select: { id: true, fullName: true },
    });
    // Only known administrative reason/status metadata is shown, never arbitrary gateway/auth payloads.
    const items = rows.map((row) => {
      const meta =
        row.metadata &&
        typeof row.metadata === 'object' &&
        !Array.isArray(row.metadata)
          ? row.metadata
          : {};
      return {
        id: row.id,
        actorId: row.actorId,
        actorName:
          actors.find((a) => a.id === row.actorId)?.fullName || row.actorType,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        createdAt: row.createdAt,
        reason: typeof meta?.reason === 'string' ? meta.reason : null,
        previousStatus:
          typeof meta.previousStatus === 'string'
            ? meta.previousStatus
            : undefined,
        status: typeof meta.status === 'string' ? meta.status : undefined,
      };
    });
    return {
      items,
      total,
      page,
      pageSize: 20,
      totalPages: Math.ceil(total / 20),
    };
  }

  public getSafeSettings() {
    return this.data.settings();
  }

  public async createPlan(
    data: {
      name: string;
      code?: string;
      description?: string;
      pricePaise: number;
      billingCycle?: string;
      maxProducts?: number;
      maxStaff?: number;
      maxStorageMb?: number;
      customDomainAllowed?: boolean;
      isPublic?: boolean;
    },
    actorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (!data.name?.trim())
        throw new BadRequestException('Plan name is required.');

      // Auto-generate unique code
      const baseCode = (
        data.code?.trim() ||
        data.name
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_') +
          '_' +
          (data.billingCycle || 'MONTHLY')
      ).toUpperCase();

      const existing = await tx.plan.findUnique({ where: { code: baseCode } });
      if (existing) {
        throw new BadRequestException(
          `A plan with code "${baseCode}" already exists.`,
        );
      }

      const plan = await tx.plan.create({
        data: {
          name: data.name.trim(),
          code: baseCode,
          description: data.description?.trim() || null,
          pricePaise: Number(data.pricePaise) || 0,
          billingCycle: data.billingCycle || 'MONTHLY',
          maxProducts: Number(data.maxProducts ?? 100),
          maxStaff: Number(data.maxStaff ?? 5),
          maxStorageMb: Number(data.maxStorageMb ?? 2048),
          customDomainAllowed: Boolean(data.customDomainAllowed),
          isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'PLAN_CREATED',
          entityType: 'Plan',
          entityId: plan.id,
          metadata: {
            code: plan.code,
            name: plan.name,
            pricePaise: plan.pricePaise,
          },
        },
      });

      return plan;
    });
  }

  public async updatePlan(
    id: string,
    data: {
      name?: string;
      description?: string;
      pricePaise?: number;
      billingCycle?: string;
      maxProducts?: number;
      maxStaff?: number;
      maxStorageMb?: number;
      customDomainAllowed?: boolean;
      isPublic?: boolean;
    },
    actorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.plan.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Plan not found.');

      const updated = await tx.plan.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.description !== undefined
            ? { description: data.description?.trim() || null }
            : {}),
          ...(data.pricePaise !== undefined
            ? { pricePaise: Number(data.pricePaise) }
            : {}),
          ...(data.billingCycle ? { billingCycle: data.billingCycle } : {}),
          ...(data.maxProducts !== undefined
            ? { maxProducts: Number(data.maxProducts) }
            : {}),
          ...(data.maxStaff !== undefined
            ? { maxStaff: Number(data.maxStaff) }
            : {}),
          ...(data.maxStorageMb !== undefined
            ? { maxStorageMb: Number(data.maxStorageMb) }
            : {}),
          ...(data.customDomainAllowed !== undefined
            ? { customDomainAllowed: Boolean(data.customDomainAllowed) }
            : {}),
          ...(data.isPublic !== undefined
            ? { isPublic: Boolean(data.isPublic) }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'PLAN_UPDATED',
          entityType: 'Plan',
          entityId: id,
          metadata: { previousName: existing.name, newName: updated.name },
        },
      });

      return updated;
    });
  }

  public async deletePlan(id: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.plan.findUnique({
        where: { id },
        include: {
          _count: { select: { subscriptions: true } },
        },
      });

      if (!plan) throw new NotFoundException('Plan not found.');

      if (plan._count.subscriptions > 0) {
        await tx.plan.update({
          where: { id },
          data: { isPublic: false },
        });

        await tx.auditLog.create({
          data: {
            actorId,
            action: 'PLAN_ARCHIVED_WITH_SUBSCRIPTIONS',
            entityType: 'Plan',
            entityId: id,
            metadata: {
              planCode: plan.code,
              subscriptionRecords: plan._count.subscriptions,
            },
          },
        });

        return {
          success: true,
          archived: true,
          message: `Plan "${plan.name}" has ${plan._count.subscriptions} subscription record(s). It has been archived and hidden from public signups.`,
        };
      }

      await tx.plan.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'PLAN_DELETED',
          entityType: 'Plan',
          entityId: id,
          metadata: { planCode: plan.code, name: plan.name },
        },
      });

      return {
        success: true,
        archived: false,
        message: `Plan "${plan.name}" successfully deleted.`,
      };
    });
  }
}

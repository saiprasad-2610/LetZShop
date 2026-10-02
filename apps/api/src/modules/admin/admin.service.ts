import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, TenantStatus, StoreStatus, UserRole } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentsService: PaymentsService
  ) {}

  public async getOverview() {
    const [
      totalMerchants,
      liveStores,
      privateStores,
      expiredStores,
      totalOrders,
      gmvAggregate,
      recentOrders,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.store.count({ where: { status: StoreStatus.LIVE, deletedAt: null } }),
      this.prisma.store.count({ where: { status: StoreStatus.PRIVATE_PREVIEW, deletedAt: null } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { totalPaise: true },
        where: { paymentStatus: 'PAID' },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { store: { select: { name: true, slug: true } } },
      }),
    ]);

    return {
      metrics: {
        totalMerchants,
        liveStores,
        privateStores,
        expiredStores,
        totalOrders,
        totalGmvPaise: gmvAggregate._sum.totalPaise || 0,
      },
      recentOrders,
      systemHealth: {
        database: 'HEALTHY',
        storage: 'HEALTHY',
        outbox: 'OPERATIONAL',
      },
    };
  }

  public async getMerchants(search?: string) {
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          where: { role: UserRole.SELLER_OWNER },
          include: { user: true },
          take: 1,
        },
        stores: {
          where: { deletedAt: null },
          include: {
            _count: { select: { products: true, orders: true } },
          },
          take: 1,
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return tenants.map((t) => {
      const owner = t.memberships[0]?.user;
      const store = t.stores[0];
      const activeSub = t.subscriptions[0];

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        owner: owner
          ? { id: owner.id, fullName: owner.fullName, phone: owner.phone, email: owner.email }
          : null,
        store: store
          ? {
              id: store.id,
              name: store.name,
              slug: store.slug,
              status: store.status,
              productCount: store._count.products,
              orderCount: store._count.orders,
            }
          : null,
        subscription: activeSub
          ? {
              planId: activeSub.planId,
              status: activeSub.status,
              paidThrough: activeSub.currentPeriodEnd,
            }
          : null,
        createdAt: t.createdAt,
      };
    });
  }

  public async getMerchantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        memberships: {
          include: { user: true },
        },
        stores: {
          include: {
            branding: true,
            sections: true,
            shippingProfiles: true,
            _count: { select: { products: true, orders: true, customers: true, enquiries: true } },
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Merchant not found.');
    return tenant;
  }

  public async suspendMerchant(tenantId: string, actorId: string, reason: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Merchant not found.');

    return this.prisma.$transaction(async (tx) => {
      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: { status: TenantStatus.SUSPENDED },
      });

      await tx.store.updateMany({
        where: { tenantId },
        data: { status: StoreStatus.SUSPENDED },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          tenantId,
          action: 'MERCHANT_SUSPENDED',
          entityType: 'Tenant',
          entityId: tenantId,
          metadata: { reason, previousStatus: tenant.status },
        },
      });

      return updatedTenant;
    });
  }

  public async reactivateMerchant(tenantId: string, actorId: string, reason: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Merchant not found.');

    return this.prisma.$transaction(async (tx) => {
      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: { status: TenantStatus.ACTIVE },
      });

      await tx.store.updateMany({
        where: { tenantId },
        data: { status: StoreStatus.LIVE },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          tenantId,
          action: 'MERCHANT_REACTIVATED',
          entityType: 'Tenant',
          entityId: tenantId,
          metadata: { reason, previousStatus: tenant.status },
        },
      });

      return updatedTenant;
    });
  }

  public async getCommerceMonitoring() {
    const [recentOrders, failedPayments, refunds, problematicShipments] = await Promise.all([
      this.prisma.order.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: {
          store: { select: { id: true, name: true, slug: true } },
          customer: { select: { fullName: true, phone: true } },
        },
      }),
      this.prisma.paymentTransaction.findMany({
        where: { status: 'FAILED' },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.refund.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { order: true },
      }),
      this.prisma.shipment.findMany({
        where: { status: { in: ['CANCELLED', 'RTO'] } },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      recentOrders,
      failedPayments,
      refunds,
      problematicShipments,
    };
  }

  public async getOperationsSummary() {
    const [failedOutbox, recentAudits, recentWebhooks] = await Promise.all([
      this.prisma.outboxEvent.findMany({
        where: { status: { in: ['FAILED', 'DEAD_LETTER'] } },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentWebhookEvent.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      failedOutbox,
      recentAudits,
      recentWebhooks,
    };
  }

  public async retryOutboxEvent(eventId: string, actorId: string) {
    const event = await this.prisma.outboxEvent.findUnique({ where: { id: eventId } });
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
          metadata: { eventType: event.eventType, previousStatus: event.status },
        },
      });

      return updated;
    });
  }

  public async reconcilePaymentOrder(paymentOrderId: string, adminUserId?: string) {
    return this.paymentsService.reconcilePaymentOrder(paymentOrderId, adminUserId);
  }
}

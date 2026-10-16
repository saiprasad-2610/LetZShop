import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, TenantStatus, StoreStatus, UserRole } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { planAvailability } from '../subscriptions/plan-policy';

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

    const totalGmvPaise = gmvAggregate._sum.totalPaise || 0;
    const kpis = {
      totalMerchants,
      activeStores: liveStores,
      liveStores,
      privateStores,
      expiredSubscriptions: expiredStores,
      expiredStores,
      totalOrders,
      platformGmvPaise: totalGmvPaise,
      totalGmvPaise,
    };

    const [activeSubscriptions, subscriptionRevenue, recentlyJoinedMerchants, pendingReports, removedThisMonth, resolvedReports, latestPendingReports] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'ACTIVE', currentPeriodEnd: { gt: new Date() } } }),
      this.prisma.subscriptionPayment.aggregate({ where: { status: { in: ['SUCCESS', 'PAID'] } }, _sum: { amountPaise: true } }),
      this.prisma.tenant.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, createdAt: true } }),
      this.prisma.reviewReport.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      this.prisma.auditLog.count({ where: { action: 'REVIEW_REMOVED', createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      this.prisma.reviewReport.count({ where: { status: 'RESOLVED' } }),
      this.prisma.reviewReport.findMany({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, reason: true, status: true, createdAt: true, review: { select: { id: true, reviewerName: true, rating: true, store: { select: { name: true } }, product: { select: { name: true } } } } } }),
    ]);
    Object.assign(kpis, { activeSubscriptions, subscriptionRevenuePaise: subscriptionRevenue._sum.amountPaise || 0, pendingReviewReports: pendingReports });
    return {
      kpis,
      metrics: kpis,
      recentOrders,
      recentlyJoinedMerchants,
      reviewModeration: { pendingReports, removedThisMonth, resolvedReports, latestPendingReports },
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
        { memberships: { some: { user: { OR: [{ fullName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] } } } },
        { stores: { some: { OR: [{ name: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }] } } },
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
          include: { plan: true },
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
              id: activeSub.id,
              planId: activeSub.planId,
              plan: activeSub.plan,
              status: activeSub.status,
              currentPeriodStart: activeSub.currentPeriodStart,
              currentPeriodEnd: activeSub.currentPeriodEnd,
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
            themeConfigs: {
              include: { theme: true },
            },
            shippingProfiles: true,
            _count: { select: { products: true, orders: true, customers: true, enquiries: true, productReviews: true } },
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            plan: true,
            events: {
              orderBy: { createdAt: 'desc' },
            },
            invoices: {
              orderBy: { createdAt: 'desc' },
              include: { payments: true },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { payments: true },
        },
        auditLogs: {
          take: 15,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Merchant not found.');

    const reportedReviewCount = await this.prisma.reviewReport.count({ where: { review: { store: { tenantId } } } });
    const invoices = tenant.invoices.map(invoice => ({ ...invoice, payments: invoice.payments.map(({ metadata, ...payment }) => payment) }));
    return { ...tenant, reportedReviewCount, paymentHistory: invoices, invoices, subscriptions: tenant.subscriptions.map(sub => ({ ...sub, invoices: sub.invoices.map(invoice => ({ ...invoice, payments: invoice.payments.map(({ metadata, ...payment }) => payment) })) })) };
  }

  public async suspendMerchant(tenantId: string, actorId: string, reason: string) {
    if(!reason?.trim()||reason.length>2000)throw new BadRequestException('An audit reason is required.');
    return this.prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`;
      const tenant=await tx.tenant.findUnique({where:{id:tenantId},include:{stores:{where:{deletedAt:null},select:{id:true,status:true,isPubliclyAccessible:true}}}});
      if(!tenant||tenant.deletedAt)throw new NotFoundException('Merchant not found.');
      if(tenant.status==='SUSPENDED')throw new BadRequestException('Merchant is already suspended.');
      const updated=await tx.tenant.update({where:{id:tenantId},data:{status:'SUSPENDED'}});
      await tx.store.updateMany({where:{tenantId,deletedAt:null,status:{not:'ARCHIVED'}},data:{status:'SUSPENDED',isPubliclyAccessible:false}});
      await tx.auditLog.create({data:{actorId,actorType:'ADMIN',tenantId,action:'MERCHANT_SUSPENDED',entityType:'Tenant',entityId:tenantId,metadata:{reason:reason.trim(),previousStatus:tenant.status,stores:tenant.stores}}});
      return updated;
    });
  }

  public async reactivateMerchant(tenantId: string, actorId: string, reason: string) {
    if(!reason?.trim()||reason.length>2000)throw new BadRequestException('An audit reason is required.');
    return this.prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`;
      const tenant=await tx.tenant.findUnique({where:{id:tenantId},include:{stores:{where:{deletedAt:null}},subscriptions:{orderBy:{createdAt:'desc'},take:1}}});
      if(!tenant||tenant.deletedAt)throw new NotFoundException('Merchant not found.');
      if(tenant.status!=='SUSPENDED')throw new BadRequestException('Only suspended merchants can be reactivated.');
      const suspension=await tx.auditLog.findFirst({where:{entityId:tenantId,action:'MERCHANT_SUSPENDED'},orderBy:{createdAt:'desc'}});
      const previous=((suspension?.metadata as any)?.stores||[]) as Array<{id:string;status:string;isPubliclyAccessible:boolean}>;
      const sub=tenant.subscriptions[0],paid=Boolean(sub&&sub.status==='ACTIVE'&&sub.currentPeriodEnd>new Date());
      for(const store of tenant.stores){
        if(store.status!=='SUSPENDED')continue;
        const old=previous.find(s=>s.id===store.id),live=paid&&old?.status==='LIVE'&&old?.isPubliclyAccessible;
        await tx.store.update({where:{id:store.id},data:{status:live?'LIVE':'PRIVATE_PREVIEW',isPubliclyAccessible:Boolean(live)}});
      }
      const updated=await tx.tenant.update({where:{id:tenantId},data:{status:'ACTIVE'}});
      await tx.auditLog.create({data:{actorId,actorType:'ADMIN',tenantId,action:'MERCHANT_REACTIVATED',entityType:'Tenant',entityId:tenantId,metadata:{reason:reason.trim(),previousStatus:tenant.status,paidSubscription:paid}}});
      return updated;
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

  public async getUsers(search?: string, role?: string) {
    const where: any = { deletedAt: null };
    if (role) {
      if (!Object.values(UserRole).includes(role as UserRole)) throw new BadRequestException('Invalid user role.');
      where.role = role;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        memberships: {
          include: {
            tenant: {
              include: {
                stores: {
                  select: { id: true, name: true, slug: true, status: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return users.map((u) => {
      const membership = u.memberships[0];
      const store = membership?.tenant?.stores[0];
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        isSuperAdmin: u.isSuperAdmin,
        createdAt: u.createdAt,
        store: store ? { id: store.id, name: store.name, slug: store.slug, status: store.status } : null,
      };
    });
  }

  public async toggleUserStatus(userId: string, actorId: string) {
    if (userId === actorId) throw new BadRequestException('You cannot deactivate your own admin account.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: user.isActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
        entityType: 'User',
        entityId: userId,
        metadata: { previousState: user.isActive, newState: !user.isActive },
      },
    }).catch(() => {});

    return updated;
  }

  public async getAnalytics() {
    const [totalOrders, paidOrders, stores, tenants, topStores] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.findMany({
        where: { paymentStatus: 'PAID' },
        select: { totalPaise: true, createdAt: true, storeId: true },
      }),
      this.prisma.store.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.store.findMany({
        where: { deletedAt: null },
        take: 5,
        include: {
          _count: { select: { orders: true, products: true } },
        },
      }),
    ]);

    const totalRevenuePaise = paidOrders.reduce((sum, o) => sum + (o.totalPaise || 0), 0);
    const averageOrderValuePaise = paidOrders.length > 0 ? Math.round(totalRevenuePaise / paidOrders.length) : 0;
    const platformCommissionPaise = Math.round(totalRevenuePaise * 0.02); // 2% platform fee

    return {
      kpis: {
        totalRevenuePaise,
        totalOrders,
        paidOrdersCount: paidOrders.length,
        averageOrderValuePaise,
        platformCommissionPaise,
        totalStores: stores,
        totalTenants: tenants,
      },
      topStores: topStores.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        ordersCount: s._count.orders,
        productsCount: s._count.products,
      })),
    };
  }

  public async getPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { pricePaise: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    const subscriptions = await this.prisma.subscription.findMany({ select: { planId: true, tenantId: true, status: true, currentPeriodEnd: true } });
    return plans.map((p) => ({
      ...p,
      ...planAvailability(p),
      merchantCount: new Set(subscriptions.filter(s => s.planId === p.id).map(s => s.tenantId)).size,
      activeSubscribersCount: new Set(subscriptions.filter(s => s.planId === p.id && s.status === 'ACTIVE' && s.currentPeriodEnd > new Date()).map(s => s.tenantId)).size,
    }));
  }

  public async getSubscriptionList(tenantId?: string) {
    return this.prisma.subscription.findMany({ where: tenantId ? { tenantId } : {}, orderBy: { createdAt: 'desc' }, take: 200,
      select: { id: true, status: true, currentPeriodEnd: true, createdAt: true, tenant: { select: { id: true, name: true } }, plan: { select: { id: true, name: true, pricePaise: true, code: true } } } });
  }

  public async getSubscriptionPayments(query: { status?: string; search?: string; page?: string }) {
    const page = Math.max(1, Math.min(100000, parseInt(query.page || '1', 10) || 1));
    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      if (!['PAID', 'PENDING', 'FAILED'].includes(query.status)) throw new BadRequestException('Invalid payment status.');
      where.status = query.status === 'PAID' ? { in: ['SUCCESS', 'PAID'] } : query.status;
    }
    if (query.search?.trim()) where.invoice = { tenant: { name: { contains: query.search.trim(), mode: 'insensitive' } } };
    const [total, items] = await Promise.all([
      this.prisma.subscriptionPayment.count({ where }),
      this.prisma.subscriptionPayment.findMany({ where, skip: (page - 1) * 20, take: 20, orderBy: { createdAt: 'desc' }, select: {
        id: true, amountPaise: true, status: true, paymentMethod: true, providerPaymentId: true, createdAt: true,
        invoice: { select: { invoiceNumber: true, tenant: { select: { id: true, name: true } }, subscription: { select: { plan: { select: { name: true } } } } } },
      } }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / 20) };
  }

  public async getAuditLogs(query: { search?: string; page?: string }) {
    const page = Math.max(1, Math.min(100000, parseInt(query.page || '1', 10) || 1));
    const where: any = query.search ? { OR: [{ action: { contains: query.search, mode: 'insensitive' } }, { entityId: { contains: query.search } }, { actorId: { contains: query.search } }] } : {};
    const [total, rows] = await Promise.all([this.prisma.auditLog.count({ where }), this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 20, take: 20 })]);
    const actors = await this.prisma.user.findMany({ where: { id: { in: rows.map(r => r.actorId).filter((id): id is string => Boolean(id)) } }, select: { id: true, fullName: true } });
    // Only known administrative reason/status metadata is shown, never arbitrary gateway/auth payloads.
    const items = rows.map(row => { const meta = row.metadata as any; return { id: row.id, actorId: row.actorId, actorName: actors.find(a => a.id === row.actorId)?.fullName || row.actorType, action: row.action, entityType: row.entityType, entityId: row.entityId, createdAt: row.createdAt, reason: typeof meta?.reason === 'string' ? meta.reason : null, previousStatus: meta?.previousStatus, status: meta?.status }; });
    return { items, total, page, totalPages: Math.ceil(total / 20) };
  }

  public getSafeSettings() {
    return { platformName: 'LetzShop', supportEmail: 'letzshop@aikyamaisystems.com', currency: 'INR', moderation: 'Merchant reports stay visible until an admin removes a review.', plansSource: 'Canonical backend plan records', growthPurchaseEnabled: false };
  }

  public async createPlan(data: {
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
  }, actorId: string) {
    if (!data.name?.trim()) throw new BadRequestException('Plan name is required.');
    
    // Auto-generate unique code
    const baseCode = (data.code?.trim() || data.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_') + '_' + (data.billingCycle || 'MONTHLY')).toUpperCase();

    const existing = await this.prisma.plan.findUnique({ where: { code: baseCode } });
    if (existing) {
      throw new BadRequestException(`A plan with code "${baseCode}" already exists.`);
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: data.name.trim(),
        code: baseCode,
        description: data.description?.trim() || null,
        pricePaise: Number(data.pricePaise) || 0,
        billingCycle: data.billingCycle || 'MONTHLY',
        maxProducts: Number(data.maxProducts) ?? 50,
        maxStaff: Number(data.maxStaff) ?? 2,
        maxStorageMb: Number(data.maxStorageMb) ?? 1024,
        customDomainAllowed: Boolean(data.customDomainAllowed),
        isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'PLAN_CREATED',
        entityType: 'Plan',
        entityId: plan.id,
        metadata: { code: plan.code, name: plan.name, pricePaise: plan.pricePaise },
      },
    }).catch(() => {});

    return plan;
  }

  public async updatePlan(id: string, data: {
    name?: string;
    description?: string;
    pricePaise?: number;
    billingCycle?: string;
    maxProducts?: number;
    maxStaff?: number;
    maxStorageMb?: number;
    customDomainAllowed?: boolean;
    isPublic?: boolean;
  }, actorId: string) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Plan not found.');

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.pricePaise !== undefined ? { pricePaise: Number(data.pricePaise) } : {}),
        ...(data.billingCycle ? { billingCycle: data.billingCycle } : {}),
        ...(data.maxProducts !== undefined ? { maxProducts: Number(data.maxProducts) } : {}),
        ...(data.maxStaff !== undefined ? { maxStaff: Number(data.maxStaff) } : {}),
        ...(data.maxStorageMb !== undefined ? { maxStorageMb: Number(data.maxStorageMb) } : {}),
        ...(data.customDomainAllowed !== undefined ? { customDomainAllowed: Boolean(data.customDomainAllowed) } : {}),
        ...(data.isPublic !== undefined ? { isPublic: Boolean(data.isPublic) } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'PLAN_UPDATED',
        entityType: 'Plan',
        entityId: id,
        metadata: { previousName: existing.name, newName: updated.name },
      },
    }).catch(() => {});

    return updated;
  }

  public async deletePlan(id: string, actorId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) throw new NotFoundException('Plan not found.');

    if (plan._count.subscriptions > 0) {
      await this.prisma.plan.update({
        where: { id },
        data: { isPublic: false },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'PLAN_ARCHIVED_WITH_ACTIVE_SUBSCRIBERS',
          entityType: 'Plan',
          entityId: id,
          metadata: { planCode: plan.code, activeSubscribers: plan._count.subscriptions },
        },
      }).catch(() => {});

      return {
        success: true,
        archived: true,
        message: `Plan "${plan.name}" has ${plan._count.subscriptions} active subscriber(s). It has been archived and hidden from public signups.`,
      };
    }

    await this.prisma.plan.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'PLAN_DELETED',
        entityType: 'Plan',
        entityId: id,
        metadata: { planCode: plan.code, name: plan.name },
      },
    }).catch(() => {});

    return {
      success: true,
      archived: false,
      message: `Plan "${plan.name}" successfully deleted.`,
    };
  }
}

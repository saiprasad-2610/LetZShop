import { AdminDataService, AdminQuery } from './admin-data.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { generateInvoicePdfBuffer } from './invoice-pdf.util';
import {
  Prisma,
  PrismaClient,
  TenantStatus,
  StoreStatus,
  UserRole,
} from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { planAvailability } from '../subscriptions/plan-policy';

import { MailService } from '../notifications/mail.service';
import { WhatsAppService } from '../notifications/whatsapp.service';

@Injectable()
export class AdminService {
  public getThemes() {
    return this.data.themes();
  }
  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentsService: PaymentsService,
    private readonly data: AdminDataService,
    private readonly mailService: MailService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  public getOverview(range?: string, from?: string, to?: string) {
    return this.data.overview(range, from, to);
  }

  public getAttentionSummary() {
    return this.data.attentionSummary();
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
            isPubliclyAccessible: true,
            previewSecret: true,
            fulfillmentMode: true,
            supportPhone: true,
            supportEmail: true,
            whatsappNumber: true,
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
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            createdAt: true,
            plan: {
              select: { id: true, name: true, code: true, pricePaise: true, billingCycle: true },
            },
          },
        },
        invoices: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            amountPaise: true,
            currency: true,
            status: true,
            createdAt: true,
            paidAt: true,
            subscription: {
              select: {
                currentPeriodStart: true,
                currentPeriodEnd: true,
                plan: { select: { name: true, code: true } },
              },
            },
            payments: {
              select: {
                id: true,
                paymentMethod: true,
                providerPaymentId: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Merchant not found.');
    const [reports] = await this.prisma.$queryRaw<
      Array<{ count: number }>
    >`SELECT count(DISTINCT r.review_id)::int AS count FROM review_reports r JOIN product_reviews v ON v.id=r.review_id JOIN stores s ON s.id=v.store_id WHERE s.tenant_id=${tenantId}`;
    
    // Fetch recent 5 orders for merchant
    const recentOrders = await this.prisma.order.findMany({
      where: { store: { tenantId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalPaise: true,
        currency: true,
        createdAt: true,
        customer: { select: { fullName: true, phone: true } },
        store: { select: { name: true, slug: true } },
      },
    });

    // Fetch review statistics
    const [reviewStats] = await this.prisma.$queryRaw<
      Array<{ activeCount: number; avgRating: number | null }>
    >`SELECT count(*)::int AS "activeCount", avg(rating)::float AS "avgRating" FROM product_reviews r JOIN stores s ON s.id=r.store_id WHERE s.tenant_id=${tenantId} AND r.status='ACTIVE'`;

    // Fetch communication and moderation audit history
    const commLogs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        action: {
          in: [
            'MERCHANT_MESSAGE_SENT',
            'MERCHANT_SUSPENDED',
            'MERCHANT_REACTIVATED',
            'MERCHANT_ARCHIVED',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const actorIds = [...new Set(commLogs.map((l) => l.actorId).filter(Boolean))] as string[];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const actorMap = new Map(actors.map((a) => [a.id, a.fullName || a.email || 'Admin']));

    const communicationHistory = commLogs.map((l) => {
      const meta = (l.metadata as any) || {};
      let channel = meta.channel || 'SYSTEM';
      if (meta.notifications) {
        const parts: string[] = [];
        if (meta.notifications.email && meta.notifications.email !== 'Not requested') parts.push('Email');
        if (meta.notifications.whatsapp && meta.notifications.whatsapp !== 'Not requested') parts.push('WhatsApp');
        if (parts.length) channel = parts.join(', ');
      }
      return {
        id: l.id,
        date: l.createdAt.toISOString(),
        channel,
        subject: meta.subject || l.action.replace(/_/g, ' '),
        message: meta.message || meta.merchantMessage || meta.reason || null,
        status: meta.status || (meta.notifications?.email === 'Sent' ? 'Sent' : meta.notifications?.whatsapp ? 'Opened in WhatsApp' : 'Completed'),
        adminName: (l.actorId && actorMap.get(l.actorId)) || 'Admin',
      };
    });

    const suspensionHistory = commLogs
      .filter((l) => ['MERCHANT_SUSPENDED', 'MERCHANT_REACTIVATED'].includes(l.action))
      .map((l) => {
        const meta = (l.metadata as any) || {};
        return {
          id: l.id,
          date: l.createdAt.toISOString(),
          action: l.action === 'MERCHANT_SUSPENDED' ? 'SUSPENDED' : 'REACTIVATED',
          target: l.entityType === 'Store' ? 'Store' : 'Merchant Account',
          reason: meta.reason || meta.internalNote || 'Administrative action',
          adminName: (l.actorId && actorMap.get(l.actorId)) || 'Admin',
        };
      });

    const { invoices, ...merchant } = tenant;
    return {
      ...merchant,
      paymentHistory: invoices,
      reportedReviewCount: reports?.count || 0,
      communicationHistory,
      suspensionHistory,
      recentOrders,
      reviewStats: {
        activeCount: reviewStats?.activeCount || 0,
        avgRating: reviewStats?.avgRating ? Number(reviewStats.avgRating.toFixed(1)) : null,
      },
    };
  }

  public async generateInvoicePdf(
    invoiceId: string,
    merchantTenantId?: string,
  ): Promise<Buffer> {
    const invoice = await this.prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: {
          include: {
            memberships: {
              where: { role: 'SELLER_OWNER', isActive: true },
              include: { user: true },
            },
            stores: { where: { deletedAt: null }, take: 1 },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${invoiceId}" not found.`);
    }

    if (merchantTenantId && invoice.tenantId !== merchantTenantId) {
      throw new ForbiddenException('Access denied to requested invoice.');
    }

    const owner = invoice.tenant.memberships[0]?.user;
    const store = invoice.tenant.stores[0];
    const payment = invoice.payments[0];

    const formatDate = (d: Date | string | null | undefined) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    };

    const formatDateTime = (d: Date | string | null | undefined) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const amountInRupees = (invoice.amountPaise / 100).toFixed(2);
    const startStr = formatDate(invoice.subscription?.currentPeriodStart);
    const endStr = formatDate(invoice.subscription?.currentPeriodEnd);

    return generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      tenantName: invoice.tenant.name,
      tenantSlug: store?.slug || invoice.tenant.slug,
      ownerName: owner?.fullName || 'Merchant Seller',
      ownerPhone: owner?.phone || store?.supportPhone || store?.whatsappNumber || 'Not provided',
      ownerEmail: owner?.email || store?.supportEmail || 'Not provided',
      invoiceDate: formatDate(invoice.createdAt),
      billingPeriod: `${startStr} – ${endStr}`,
      billingPeriodShort: `${startStr} – ${endStr}`,
      currency: invoice.currency || 'INR',
      paymentMethod: payment?.paymentMethod || 'RAZORPAY',
      paymentReference: payment?.providerPaymentId || 'N/A',
      paidAtDate: formatDateTime(invoice.paidAt || payment?.createdAt),
      paymentStatus: payment?.status || invoice.status,
      planName: invoice.subscription?.plan?.name || 'Launch',
      formattedAmount: `INR ${amountInRupees}`,
    });
  }

  public async getCommunicationHistory(tenantId: string) {
    const detail = await this.getMerchantById(tenantId);
    return detail.communicationHistory || [];
  }

  public async getMerchantSubscriptions(tenantId: string, page = 1, pageSize = 5) {
    const p = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Math.min(100, Number(pageSize) || 5));
    const skip = (p - 1) * limit;

    const [total, subs] = await Promise.all([
      this.prisma.subscription.count({ where: { tenantId } }),
      this.prisma.subscription.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: { id: true, name: true, code: true, pricePaise: true, billingCycle: true },
          },
          invoices: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              payments: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: { status: true, amountPaise: true, createdAt: true },
              },
            },
          },
        },
      }),
    ]);

    const data = subs.map((s) => {
      const inv = s.invoices?.[0];
      const payment = inv?.payments?.[0];
      const amountPaise = inv?.amountPaise || payment?.amountPaise || s.plan?.pricePaise || 0;
      const paymentStatus = payment?.status || inv?.status || (s.status === 'ACTIVE' ? 'PAID' : s.status === 'PAST_DUE' ? 'FAILED' : 'UNPAID');
      return {
        id: s.id,
        plan: s.plan,
        amountPaise,
        status: s.status,
        currentPeriodStart: s.currentPeriodStart.toISOString(),
        currentPeriodEnd: s.currentPeriodEnd.toISOString(),
        paymentStatus,
        createdAt: s.createdAt.toISOString(),
      };
    });

    return {
      data,
      pagination: {
        page: p,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getMerchantInvoices(tenantId: string, page = 1, pageSize = 5) {
    const p = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Math.min(100, Number(pageSize) || 5));
    const skip = (p - 1) * limit;

    const [total, invoices] = await Promise.all([
      this.prisma.subscriptionInvoice.count({ where: { tenantId } }),
      this.prisma.subscriptionInvoice.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: { plan: { select: { name: true, code: true } } },
          },
        },
      }),
    ]);

    const data = invoices.map((inv) => {
      let billingPeriod = 'N/A';
      if (inv.subscription) {
        const start = new Date(inv.subscription.currentPeriodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const end = new Date(inv.subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        billingPeriod = `${start} – ${end}`;
      }
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        billingPeriod,
        plan: inv.subscription?.plan?.name || 'Launch',
        amountPaise: inv.amountPaise,
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
        paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
      };
    });

    return {
      data,
      pagination: {
        page: p,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getMerchantOrders(tenantId: string, page = 1, pageSize = 5) {
    const p = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Math.min(100, Number(pageSize) || 5));
    const skip = (p - 1) * limit;

    const where = { store: { tenantId } };
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true } },
          orderAddress: { select: { fullName: true } },
        },
      }),
    ]);

    const data = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer?.fullName || (o.orderAddress as any)?.fullName || 'Guest',
      amountPaise: o.totalPaise,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }));

    return {
      data,
      pagination: {
        page: p,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getMerchantCommunications(tenantId: string, page = 1, pageSize = 5) {
    const p = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Math.min(100, Number(pageSize) || 5));
    const skip = (p - 1) * limit;

    const where = {
      tenantId,
      action: {
        in: [
          'MERCHANT_MESSAGE_SENT',
          'MERCHANT_SUSPENDED',
          'MERCHANT_REACTIVATED',
          'MERCHANT_ARCHIVED',
        ],
      },
    };

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))] as string[];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const actorMap = new Map(actors.map((a) => [a.id, a.fullName || a.email || 'Admin']));

    const data = logs.map((l) => {
      const meta = (l.metadata as any) || {};
      let channel = meta.channel || 'SYSTEM';
      if (meta.notifications) {
        const parts: string[] = [];
        if (meta.notifications.email && meta.notifications.email !== 'Not requested') parts.push('Email');
        if (meta.notifications.whatsapp && meta.notifications.whatsapp !== 'Not requested') parts.push('WhatsApp');
        if (parts.length) channel = parts.join(', ');
      }
      return {
        id: l.id,
        date: l.createdAt.toISOString(),
        channel,
        subject: meta.subject || l.action.replace(/_/g, ' '),
        message: meta.message || meta.merchantMessage || meta.reason || null,
        status: meta.status || (meta.notifications?.email === 'Sent' ? 'Sent' : meta.notifications?.whatsapp ? 'Opened in WhatsApp' : 'Completed'),
        adminName: (l.actorId && actorMap.get(l.actorId)) || 'Admin',
      };
    });

    return {
      data,
      pagination: {
        page: p,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getMerchantModerationSummary(tenantId: string, reviewPage = 1, statusPage = 1, pageSize = 5) {
    const rPage = Math.max(1, Number(reviewPage) || 1);
    const sPage = Math.max(1, Number(statusPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(pageSize) || 5));

    const [
      activeCount,
      avgResult,
      pendingReports,
      underReviewReports,
      removedReviews,
    ] = await Promise.all([
      this.prisma.productReview.count({
        where: { store: { tenantId }, status: 'ACTIVE' },
      }),
      this.prisma.productReview.aggregate({
        where: { store: { tenantId }, status: 'ACTIVE' },
        _avg: { rating: true },
      }),
      this.prisma.reviewReport.count({
        where: { review: { store: { tenantId } }, status: 'PENDING' },
      }),
      this.prisma.reviewReport.count({
        where: { review: { store: { tenantId } }, status: 'UNDER_REVIEW' },
      }),
      this.prisma.productReview.count({
        where: { store: { tenantId }, status: 'REMOVED' },
      }),
    ]);

    const reviewLogWhere = {
      tenantId,
      action: {
        in: [
          'REVIEW_REPORTED',
          'REVIEW_REPORT_UNDER_REVIEW',
          'REVIEW_REMOVED',
          'REVIEW_RESTORED',
          'REVIEW_REPORT_DISMISSED',
        ],
      },
    };
    const statusLogWhere = {
      tenantId,
      action: {
        in: ['MERCHANT_SUSPENDED', 'MERCHANT_REACTIVATED', 'MERCHANT_ARCHIVED'],
      },
    };

    const [reviewTotal, reviewLogs, statusTotal, statusLogs] = await Promise.all([
      this.prisma.auditLog.count({ where: reviewLogWhere }),
      this.prisma.auditLog.findMany({
        where: reviewLogWhere,
        skip: (rPage - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where: statusLogWhere }),
      this.prisma.auditLog.findMany({
        where: statusLogWhere,
        skip: (sPage - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const allActorIds = [...new Set([...reviewLogs, ...statusLogs].map((l) => l.actorId).filter(Boolean))] as string[];
    const actors = allActorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: allActorIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const actorMap = new Map(actors.map((a) => [a.id, a.fullName || a.email || 'Admin']));

    const reviewModerationActivity = {
      data: reviewLogs.map((l) => {
        const meta = (l.metadata as any) || {};
        return {
          id: l.id,
          date: l.createdAt.toISOString(),
          action: l.action.replace(/_/g, ' '),
          reason: meta.reason || meta.note || meta.details || null,
          adminName: (l.actorId && actorMap.get(l.actorId)) || 'Admin',
        };
      }),
      pagination: {
        page: rPage,
        pageSize: limit,
        total: reviewTotal,
        totalPages: Math.ceil(reviewTotal / limit) || 1,
      },
    };

    const statusHistory = {
      data: statusLogs.map((l) => {
        const meta = (l.metadata as any) || {};
        return {
          id: l.id,
          date: l.createdAt.toISOString(),
          action: l.action === 'MERCHANT_SUSPENDED' ? 'SUSPENDED' : l.action === 'MERCHANT_REACTIVATED' ? 'REACTIVATED' : 'ARCHIVED',
          target: l.entityType === 'Store' ? 'Store' : 'Merchant Account',
          reason: meta.reason || meta.internalNote || 'Administrative action',
          adminName: (l.actorId && actorMap.get(l.actorId)) || 'Admin',
        };
      }),
      pagination: {
        page: sPage,
        pageSize: limit,
        total: statusTotal,
        totalPages: Math.ceil(statusTotal / limit) || 1,
      },
    };

    return {
      stats: {
        activeReviews: activeCount,
        avgRating: avgResult._avg?.rating ? Number(avgResult._avg.rating.toFixed(1)) : null,
        pendingReports,
        underReviewReports,
        removedReviews,
      },
      reviewModerationActivity,
      statusHistory,
    };
  }

  public async sendMessageToMerchant(
    tenantId: string,
    actorId: string,
    dto: {
      channels: Array<'EMAIL' | 'WHATSAPP'>;
      subject: string;
      message: string;
    },
  ) {
    if (!dto.subject?.trim()) throw new BadRequestException('Subject is required.');
    if (!dto.message?.trim()) throw new BadRequestException('Message is required.');
    if (!dto.channels?.length) throw new BadRequestException('Select at least one delivery channel (Email or WhatsApp).');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
      include: {
        memberships: {
          where: { role: 'SELLER_OWNER', isActive: true },
          include: { user: true },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Merchant not found.');
    const owner = tenant.memberships[0]?.user;
    if (!owner) throw new BadRequestException('Merchant owner contact information not found.');

    let emailSent = false;
    let emailStatus = 'Not requested';
    let whatsAppUrl: string | null = null;
    let whatsAppStatus = 'Not requested';

    if (dto.channels.includes('EMAIL')) {
      if (!owner.email) {
        throw new BadRequestException('No email address available for this merchant owner.');
      }
      try {
        emailSent = await this.mailService.sendAdminMerchantEmail(
          owner.email,
          dto.subject.trim(),
          dto.message.trim(),
          tenant.name,
        );
        emailStatus = emailSent ? 'Sent' : 'Failed to deliver';
      } catch (err: any) {
        emailStatus = `Failed: ${err.message || 'SMTP error'}`;
      }
    }

    if (dto.channels.includes('WHATSAPP')) {
      if (!owner.phone) {
        throw new BadRequestException('No phone number available for this merchant owner.');
      }
      const fullText = `*${dto.subject.trim()}*\n\n${dto.message.trim()}`;
      const wa = this.whatsAppService.generateAdminMerchantWhatsAppMessage(owner.phone, fullText);
      whatsAppUrl = wa.url;
      whatsAppStatus = 'Opened in WhatsApp';
    }

    const primaryStatus = dto.channels.includes('EMAIL')
      ? emailStatus
      : whatsAppStatus;

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorType: 'ADMIN',
        tenantId,
        action: 'MERCHANT_MESSAGE_SENT',
        entityType: 'Tenant',
        entityId: tenantId,
        metadata: {
          channel: dto.channels.join(', '),
          subject: dto.subject.trim(),
          message: dto.message.trim(),
          recipientEmail: owner.email,
          recipientPhone: owner.phone,
          status: primaryStatus,
          emailStatus,
          whatsAppStatus,
          whatsAppUrl,
        },
      },
    });

    return {
      success: true,
      emailSent,
      whatsAppUrl,
      status: primaryStatus,
    };
  }

  public async suspendMerchant(
    tenantId: string,
    actorId: string,
    dto:
      | {
          reason: string;
          internalNote?: string;
          merchantMessage?: string;
          notifyEmail?: boolean;
          notifyWhatsApp?: boolean;
          storeId?: string;
        }
      | string,
  ) {
    const reasonText = typeof dto === 'string' ? dto : dto.reason || 'Administrative suspension';
    const internalNote = typeof dto === 'object' ? dto.internalNote : undefined;
    const merchantMessage = typeof dto === 'object' ? dto.merchantMessage : undefined;
    const notifyEmail = typeof dto === 'object' ? Boolean(dto.notifyEmail) : false;
    const notifyWhatsApp = typeof dto === 'object' ? Boolean(dto.notifyWhatsApp) : false;
    const targetStoreId = typeof dto === 'object' ? dto.storeId : undefined;

    if (!reasonText?.trim() || reasonText.length > 2000)
      throw new BadRequestException('An audit reason is required.');

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`;
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        include: {
          stores: {
            where: { deletedAt: null },
            select: { id: true, name: true, status: true, isPubliclyAccessible: true },
          },
          memberships: {
            where: { role: 'SELLER_OWNER', isActive: true },
            include: { user: true },
          },
        },
      });
      if (!tenant || tenant.deletedAt)
        throw new NotFoundException('Merchant not found.');
      if (tenant.status === 'SUSPENDED' && !targetStoreId)
        throw new BadRequestException('Merchant is already suspended.');

      let updatedTenant = tenant;
      if (!targetStoreId) {
        updatedTenant = await tx.tenant.update({
          where: { id: tenantId },
          data: { status: 'SUSPENDED' },
          include: {
            stores: { where: { deletedAt: null }, select: { id: true, name: true, status: true, isPubliclyAccessible: true } },
            memberships: { where: { role: 'SELLER_OWNER', isActive: true }, include: { user: true } },
          },
        });
        await tx.store.updateMany({
          where: { tenantId, deletedAt: null, status: { not: 'ARCHIVED' } },
          data: { status: 'SUSPENDED', isPubliclyAccessible: false },
        });
      } else {
        await tx.store.update({
          where: { id: targetStoreId },
          data: { status: 'SUSPENDED', isPubliclyAccessible: false },
        });
      }

      const owner = tenant.memberships[0]?.user;
      return { tenant: updatedTenant, owner };
    });

    // Handle notifications outside transaction so failure doesn't rollback suspension
    let emailSent = false;
    let emailStatus = 'Not requested';
    let whatsAppUrl: string | null = null;
    let whatsAppStatus = 'Not requested';

    const defaultMsg =
      `Hello ${result.tenant.name},\n\n` +
      `Your LetzShop store access has temporarily been suspended.\n\n` +
      `Reason:\n${reasonText}\n\n` +
      (merchantMessage ? `Additional Information:\n${merchantMessage}\n\n` : '') +
      `Please contact the LetzShop team if you require assistance.\n\n` +
      `— LetzShop Support`;

    const finalNoticeText = merchantMessage?.trim() || defaultMsg;

    if (notifyEmail && result.owner?.email) {
      try {
        emailSent = await this.mailService.sendAdminMerchantEmail(
          result.owner.email,
          `Store Suspension Notice — ${result.tenant.name}`,
          finalNoticeText,
          result.tenant.name,
        );
        emailStatus = emailSent ? 'Sent' : 'Failed to deliver';
      } catch (err: any) {
        emailStatus = `Failed: ${err.message || 'SMTP error'}`;
      }
    }

    if (notifyWhatsApp && result.owner?.phone) {
      const wa = this.whatsAppService.generateAdminMerchantWhatsAppMessage(
        result.owner.phone,
        `*Store Suspension Notice — ${result.tenant.name}*\n\n${finalNoticeText}`,
      );
      whatsAppUrl = wa.url;
      whatsAppStatus = 'Opened in WhatsApp';
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorType: 'ADMIN',
        tenantId,
        storeId: targetStoreId || null,
        action: 'MERCHANT_SUSPENDED',
        entityType: targetStoreId ? 'Store' : 'Tenant',
        entityId: targetStoreId || tenantId,
        metadata: {
          reason: reasonText.trim(),
          internalNote: internalNote?.trim() || null,
          merchantMessage: finalNoticeText,
          previousStatus: result.tenant.status,
          stores: result.tenant.stores,
          subject: 'Store Suspension Notification',
          status: 'Suspended',
          notifications: {
            email: emailStatus,
            whatsapp: whatsAppStatus,
          },
          whatsAppUrl,
        },
      },
    });

    return {
      success: true,
      merchant: result.tenant,
      emailSent,
      whatsAppUrl,
      status: 'Suspended',
    };
  }

  public async reactivateMerchant(
    tenantId: string,
    actorId: string,
    dto?:
      | {
          reason?: string;
          merchantMessage?: string;
          notifyEmail?: boolean;
          notifyWhatsApp?: boolean;
          storeId?: string;
        }
      | string,
  ) {
    const reasonText =
      typeof dto === 'string'
        ? dto
        : dto?.reason || 'Administrative reactivation';
    const merchantMessage = typeof dto === 'object' ? dto?.merchantMessage : undefined;
    const notifyEmail = typeof dto === 'object' ? Boolean(dto?.notifyEmail) : false;
    const notifyWhatsApp = typeof dto === 'object' ? Boolean(dto?.notifyWhatsApp) : false;
    const targetStoreId = typeof dto === 'object' ? dto?.storeId : undefined;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`;
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        include: {
          stores: { where: { deletedAt: null } },
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
          memberships: {
            where: { role: 'SELLER_OWNER', isActive: true },
            include: { user: true },
          },
        },
      });
      if (!tenant || tenant.deletedAt)
        throw new NotFoundException('Merchant not found.');

      const hasSuspendedStore = tenant.stores.some((s) => s.status === 'SUSPENDED');
      if (tenant.status !== 'SUSPENDED' && !hasSuspendedStore)
        throw new BadRequestException(
          'Neither the merchant nor any store is currently suspended.',
        );

      const suspension = await tx.auditLog.findFirst({
        where: {
          OR: [
            { entityId: targetStoreId || tenantId, action: 'MERCHANT_SUSPENDED' },
            { entityId: tenantId, action: 'MERCHANT_SUSPENDED' },
          ],
        },
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

      if (targetStoreId) {
        const store = tenant.stores.find((s) => s.id === targetStoreId);
        if (!store) throw new NotFoundException('Store not found.');
        if (store.status !== 'SUSPENDED') {
          throw new BadRequestException('This store is not suspended.');
        }
        const old = previous.find((s) => s.id === store.id);
        const live = paid && (old ? old.status === 'LIVE' && old.isPubliclyAccessible : true);
        await tx.store.update({
          where: { id: store.id },
          data: {
            status: live ? 'LIVE' : 'PRIVATE_PREVIEW',
            isPubliclyAccessible: Boolean(live),
          },
        });
      } else {
        for (const store of tenant.stores) {
          if (store.status !== 'SUSPENDED') continue;
          const old = previous.find((s) => s.id === store.id);
          const live = paid && (old ? old.status === 'LIVE' && old.isPubliclyAccessible : true);
          await tx.store.update({
            where: { id: store.id },
            data: {
              status: live ? 'LIVE' : 'PRIVATE_PREVIEW',
              isPubliclyAccessible: Boolean(live),
            },
          });
        }
      }

      let updated = tenant;
      if (tenant.status === 'SUSPENDED') {
        updated = await tx.tenant.update({
          where: { id: tenantId },
          data: { status: 'ACTIVE' },
          include: {
            stores: { where: { deletedAt: null } },
            subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
            memberships: {
              where: { role: 'SELLER_OWNER', isActive: true },
              include: { user: true },
            },
          },
        });
      }
      const owner = tenant.memberships[0]?.user;
      return { tenant: updated, owner, paid };
    });

    let emailSent = false;
    let emailStatus = 'Not requested';
    let whatsAppUrl: string | null = null;
    let whatsAppStatus = 'Not requested';

    const defaultMsg =
      `Hello ${result.tenant.name},\n\n` +
      `Your LetzShop store access has been reactivated successfully.\n\n` +
      (merchantMessage ? `Additional Information:\n${merchantMessage}\n\n` : '') +
      `Thank you for selling with LetzShop.\n\n` +
      `— LetzShop Support`;

    const finalNoticeText = merchantMessage?.trim() || defaultMsg;

    if (notifyEmail && result.owner?.email) {
      try {
        emailSent = await this.mailService.sendAdminMerchantEmail(
          result.owner.email,
          `Store Reactivated — ${result.tenant.name}`,
          finalNoticeText,
          result.tenant.name,
        );
        emailStatus = emailSent ? 'Sent' : 'Failed to deliver';
      } catch (err: any) {
        emailStatus = `Failed: ${err.message || 'SMTP error'}`;
      }
    }

    if (notifyWhatsApp && result.owner?.phone) {
      const wa = this.whatsAppService.generateAdminMerchantWhatsAppMessage(
        result.owner.phone,
        `*Store Reactivated — ${result.tenant.name}*\n\n${finalNoticeText}`,
      );
      whatsAppUrl = wa.url;
      whatsAppStatus = 'Opened in WhatsApp';
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorType: 'ADMIN',
        tenantId,
        storeId: targetStoreId || null,
        action: 'MERCHANT_REACTIVATED',
        entityType: targetStoreId ? 'Store' : 'Tenant',
        entityId: targetStoreId || tenantId,
        metadata: {
          reason: reasonText.trim(),
          merchantMessage: finalNoticeText,
          previousStatus: 'SUSPENDED',
          paidSubscription: result.paid,
          subject: 'Store Reactivation Notification',
          status: 'Reactivated',
          notifications: {
            email: emailStatus,
            whatsapp: whatsAppStatus,
          },
          whatsAppUrl,
        },
      },
    });

    return {
      success: true,
      merchant: result.tenant,
      emailSent,
      whatsAppUrl,
      status: 'Reactivated',
    };
  }

  public async archiveMerchant(
    tenantId: string,
    actorId: string,
    dto?: {
      reason?: string;
      internalNote?: string;
      merchantMessage?: string;
      notifyEmail?: boolean;
      notifyWhatsApp?: boolean;
    },
  ) {
    const reasonText = dto?.reason?.trim() || 'Administrative archival';
    const internalNote = dto?.internalNote?.trim();
    const merchantMessage = dto?.merchantMessage?.trim();
    const notifyEmail = Boolean(dto?.notifyEmail);
    const notifyWhatsApp = Boolean(dto?.notifyWhatsApp);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`;
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        include: {
          stores: { where: { deletedAt: null } },
          memberships: {
            where: { role: 'SELLER_OWNER', isActive: true },
            include: { user: true },
          },
        },
      });
      if (!tenant || tenant.deletedAt)
        throw new NotFoundException('Merchant not found.');
      if (tenant.status === 'ARCHIVED')
        throw new BadRequestException('Merchant is already archived.');

      // Update tenant status to ARCHIVED while strictly preserving orders, payments, reviews
      const updated = await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'ARCHIVED' },
      });
      await tx.store.updateMany({
        where: { tenantId, deletedAt: null },
        data: { status: 'ARCHIVED', isPubliclyAccessible: false },
      });

      const owner = tenant.memberships[0]?.user;
      return { tenant: updated, owner };
    });

    let emailSent = false;
    let emailStatus = 'Not requested';
    let whatsAppUrl: string | null = null;
    let whatsAppStatus = 'Not requested';

    const noticeText =
      merchantMessage ||
      `Hello ${result.tenant.name},\n\n` +
        `Your LetzShop merchant account has been archived. All your past transaction records, orders, and financial history have been preserved.\n\n` +
        `Reason:\n${reasonText}\n\n` +
        `Please reach out to LetzShop Support for any questions.\n\n` +
        `— LetzShop Support`;

    if (notifyEmail && result.owner?.email) {
      try {
        emailSent = await this.mailService.sendAdminMerchantEmail(
          result.owner.email,
          `Account Archival Notice — ${result.tenant.name}`,
          noticeText,
          result.tenant.name,
        );
        emailStatus = emailSent ? 'Sent' : 'Failed to deliver';
      } catch (err: any) {
        emailStatus = `Failed: ${err.message || 'SMTP error'}`;
      }
    }

    if (notifyWhatsApp && result.owner?.phone) {
      const wa = this.whatsAppService.generateAdminMerchantWhatsAppMessage(
        result.owner.phone,
        `*Account Archival Notice — ${result.tenant.name}*\n\n${noticeText}`,
      );
      whatsAppUrl = wa.url;
      whatsAppStatus = 'Opened in WhatsApp';
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorType: 'ADMIN',
        tenantId,
        action: 'MERCHANT_ARCHIVED',
        entityType: 'Tenant',
        entityId: tenantId,
        metadata: {
          reason: reasonText,
          internalNote: internalNote || null,
          merchantMessage: noticeText,
          previousStatus: result.tenant.status,
          subject: 'Account Archival Notification',
          status: 'Archived',
          notifications: {
            email: emailStatus,
            whatsapp: whatsAppStatus,
          },
          whatsAppUrl,
        },
      },
    });

    return {
      success: true,
      merchant: result.tenant,
      emailSent,
      whatsAppUrl,
      status: 'Archived',
    };
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

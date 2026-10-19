import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma, ReviewReportStatus } from '@prisma/client';
import { MailService } from '../notifications/mail.service';

export interface ModerateReviewOptions {
  internalNote?: string;
  buyerMessage?: string;
  merchantMessage?: string;
  notifyBuyerEmail?: boolean;
  notifyBuyerWhatsapp?: boolean;
  notifyMerchantEmail?: boolean;
  notifyMerchantWhatsapp?: boolean;
}

@Injectable()
export class ReviewModerationService {
  private readonly logger = new Logger(ReviewModerationService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly mailService: MailService,
  ) {}

  async getFilters() {
    const [tenants, stores, products] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          memberships: {
            where: { role: 'SELLER_OWNER', isActive: true },
            take: 1,
            select: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.store.findMany({
        where: { deletedAt: null },
        take: 500,
        select: { id: true, name: true, slug: true, tenantId: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null },
        take: 500,
        select: { id: true, name: true, slug: true, storeId: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const merchants = tenants.map((t) => {
      const owner = t.memberships[0]?.user;
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        ownerName: owner?.fullName,
        email: owner?.email,
        phone: owner?.phone,
      };
    });

    return { merchants, stores, products };
  }

  async getSummary() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      pendingReports,
      underReviewReports,
      removedReviews,
      resolvedThisMonth,
      activeReviews,
      totalReviews,
    ] = await Promise.all([
      this.prisma.reviewReport.count({ where: { status: 'PENDING' } }),
      this.prisma.reviewReport.count({ where: { status: 'UNDER_REVIEW' } }),
      this.prisma.productReview.count({ where: { status: 'REMOVED' } }),
      this.prisma.reviewReport.count({
        where: { status: 'RESOLVED', resolvedAt: { gte: firstDayOfMonth } },
      }),
      this.prisma.productReview.count({ where: { status: 'ACTIVE' } }),
      this.prisma.productReview.count(),
    ]);

    return {
      pendingReports,
      underReviewReports,
      removedReviews,
      resolvedThisMonth,
      activeReviews,
      totalReviews,
    };
  }

  async getReviews(query: {
    status?: string;
    reportStatus?: string;
    search?: string;
    merchantId?: string;
    storeId?: string;
    productId?: string;
    rating?: string;
    verified?: string | boolean;
    hasComplaint?: string | boolean;
    from?: string;
    to?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number.isFinite(Number(query.page))
      ? Math.max(1, Math.floor(Number(query.page) || 1))
      : 1;
    const limit = Number.isFinite(Number(query.limit))
      ? Math.max(1, Math.min(100, Math.floor(Number(query.limit) || 20)))
      : 20;
    const where: Prisma.ProductReviewWhereInput = {};

    if (
      query.status &&
      query.status !== 'ALL' &&
      query.status !== 'SENT_FOR_REVIEW'
    ) {
      if (!['ACTIVE', 'REMOVED'].includes(query.status))
        throw new BadRequestException('Invalid review visibility.');
      where.status = query.status;
    }

    const reportStatus =
      query.status === 'SENT_FOR_REVIEW' ? 'PENDING' : query.reportStatus;
    if (reportStatus && reportStatus !== 'ALL') {
      if (
        !['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].includes(
          reportStatus,
        )
      )
        throw new BadRequestException('Invalid report status.');
      where.reports = {
        some: {
          status:
            reportStatus === 'PENDING'
              ? { in: ['PENDING', 'UNDER_REVIEW'] }
              : (reportStatus as ReviewReportStatus),
        },
      };
    }

    if (query.hasComplaint !== undefined && query.hasComplaint !== '' && query.hasComplaint !== 'ALL') {
      const hasC = String(query.hasComplaint) === 'true' || String(query.hasComplaint) === 'YES';
      if (hasC) {
        where.reports = { some: {} };
      } else {
        where.reports = { none: {} };
      }
    }

    if (query.verified !== undefined && query.verified !== '' && query.verified !== 'ALL') {
      where.verifiedPurchase = String(query.verified) === 'true';
    }

    if (query.storeId) {
      where.storeId = query.storeId;
    } else if (query.merchantId) {
      where.store = { tenantId: query.merchantId };
    }
    if (query.productId) where.productId = query.productId;
    if (query.rating) {
      const rating = Number(query.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5)
        throw new BadRequestException('Rating must be 1–5.');
      where.rating = rating;
    }
    if (query.from || query.to) {
      const from = query.from ? new Date(query.from) : undefined,
        to = query.to ? new Date(query.to + 'T23:59:59.999Z') : undefined;
      if (
        (from && isNaN(from.getTime())) ||
        (to && isNaN(to.getTime())) ||
        (from && to && from > to)
      )
        throw new BadRequestException('Invalid date range.');
      where.createdAt = { gte: from, lte: to };
    }

    if (query.search?.trim()) {
      const text = query.search.trim().slice(0, 200);
      where.OR = [
        { id: text },
        { reviewerName: { contains: text, mode: 'insensitive' } },
        { body: { contains: text, mode: 'insensitive' } },
        { title: { contains: text, mode: 'insensitive' } },
        { product: { name: { contains: text, mode: 'insensitive' } } },
        { store: { name: { contains: text, mode: 'insensitive' } } },
        { store: { tenant: { name: { contains: text, mode: 'insensitive' } } } },
        { order: { orderNumber: { contains: text, mode: 'insensitive' } } },
        { order: { customer: { fullName: { contains: text, mode: 'insensitive' } } } },
        { order: { customer: { email: { contains: text, mode: 'insensitive' } } } },
        { order: { customer: { phone: { contains: text, mode: 'insensitive' } } } },
        {
          reports: {
            some: {
              OR: [
                { reason: { contains: text, mode: 'insensitive' } },
                { merchantNote: { contains: text, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    let orderBy: Prisma.ProductReviewOrderByWithRelationInput[] = [
      { createdAt: 'desc' },
      { id: 'asc' },
    ];
    if (query.sort === 'oldest') {
      orderBy = [{ createdAt: 'asc' }, { id: 'asc' }];
    } else if (query.sort === 'highest_rating') {
      orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
    } else if (query.sort === 'lowest_rating') {
      orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }];
    }

    const [total, items] = await Promise.all([
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              tenant: { select: { id: true, name: true } },
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              media: {
                where: { mediaAsset: { deletedAt: null } },
                include: { mediaAsset: true },
                take: 1,
              },
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              createdAt: true,
              customer: {
                select: { id: true, fullName: true, email: true, phone: true },
              },
            },
          },
          reports: { take: 50, orderBy: { createdAt: 'desc' } },
        },
      }),
    ]);

    const formatted = items.map((r) => ({
      ...r,
      product: {
        id: r.product.id,
        name: r.product.name,
        slug: r.product.slug,
        media: r.product.media.map((m) => ({
          publicUrl: m.mediaAsset?.publicUrl || '',
        })),
      },
    }));

    return {
      items: formatted,
      reviews: formatted,
      total,
      page,
      limit,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReviewTimeline(reviewId: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        store: { select: { id: true, name: true, tenantId: true } },
        product: { select: { id: true, name: true } },
        order: { select: { orderNumber: true } },
        reports: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!review) throw new NotFoundException('Review not found.');

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'ProductReview', entityId: reviewId },
          {
            entityType: 'ReviewReport',
            entityId: { in: review.reports.map((r) => r.id) },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    const events: Array<{
      id: string;
      type: string;
      title: string;
      actor: string;
      timestamp: string;
      date: string;
      details?: string | null;
      description?: string | null;
    }> = [];

    events.push({
      id: `created-${review.id}`,
      type: 'REVIEW_CREATED',
      title: 'Review Created',
      actor: review.reviewerName,
      timestamp: review.createdAt.toISOString(),
      date: review.createdAt.toISOString(),
      details: `${review.rating} Stars — "${review.title || review.body.slice(0, 40)}"`,
      description: `${review.rating} Stars — "${review.title || review.body.slice(0, 40)}"`,
    });

    for (const report of review.reports) {
      const desc = `Reason: ${report.reason}${report.merchantNote ? ` · Note: ${report.merchantNote}` : ''}`;
      events.push({
        id: `report-${report.id}`,
        type: 'MERCHANT_REPORTED',
        title: 'Merchant Reported Review',
        actor: 'Merchant',
        timestamp: report.createdAt.toISOString(),
        date: report.createdAt.toISOString(),
        details: desc,
        description: desc,
      });
    }

    for (const log of auditLogs) {
      const meta = (log.metadata as any) || {};
      let title = log.action.replace(/_/g, ' ');
      if (log.action === 'REVIEW_REPORT_UNDER_REVIEW') title = 'Admin Started Review';
      if (log.action === 'REVIEW_REPORT_DISMISSED') title = 'Complaint Dismissed';
      if (log.action === 'REVIEW_REMOVED') title = 'Review Removed';
      if (log.action === 'REVIEW_RESTORED') title = 'Review Restored';
      if (log.action === 'BUYER_NOTIFIED') title = 'Buyer Notified (Email)';
      if (log.action === 'MERCHANT_NOTIFIED') title = 'Merchant Notified (Email)';
      if (log.action === 'OPENED_IN_WHATSAPP') title = 'Opened in WhatsApp';

      const desc = meta.reason || meta.note || meta.details || null;
      events.push({
        id: `audit-${log.id}`,
        type: log.action,
        title,
        actor: log.actorType === 'ADMIN' ? 'Platform Admin' : 'System',
        timestamp: log.createdAt.toISOString(),
        date: log.createdAt.toISOString(),
        details: desc,
        description: desc,
      });
    }

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      review,
      timeline: events,
    };
  }

  async moderate(
    reviewId: string,
    actorId: string,
    action: 'REMOVE' | 'RESTORE',
    reason?: string,
    opts?: ModerateReviewOptions,
  ) {
    const note = (reason || opts?.internalNote || '').trim();
    if (!note || note.length > 2000) {
      throw new BadRequestException(
        'A moderation reason of 1–2000 characters is required.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM product_reviews WHERE id = ${reviewId} FOR UPDATE`;
      const review = await tx.productReview.findUnique({
        where: { id: reviewId },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              tenantId: true,
              supportEmail: true,
              supportPhone: true,
              whatsappNumber: true,
            },
          },
          product: { select: { id: true, name: true } },
          order: {
            select: {
              id: true,
              orderNumber: true,
              customer: { select: { fullName: true, email: true, phone: true } },
            },
          },
        },
      });
      if (!review) throw new NotFoundException('Review not found.');

      const status = action === 'REMOVE' ? 'REMOVED' : 'ACTIVE';
      if (review.status === status) {
        throw new ConflictException(
          'Review already has this visibility status.',
        );
      }

      const updated = await tx.productReview.update({
        where: { id: reviewId },
        data: {
          status,
          moderatedAt: new Date(),
          moderatedBy: actorId,
          moderationReason: note,
        },
      });

      if (action === 'REMOVE') {
        await tx.reviewReport.updateMany({
          where: { reviewId, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedById: actorId,
            adminNote: note,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'ADMIN',
          tenantId: review.store.tenantId,
          storeId: review.storeId,
          action: action === 'REMOVE' ? 'REVIEW_REMOVED' : 'REVIEW_RESTORED',
          entityType: 'ProductReview',
          entityId: review.id,
          metadata: {
            reason: note,
            internalNote: opts?.internalNote || null,
            buyerMessage: opts?.buyerMessage || null,
            merchantMessage: opts?.merchantMessage || null,
            previousStatus: review.status,
            status,
          },
        },
      });

      // Buyer Notification
      let buyerNotified = false;
      const buyerEmail = review.order.customer?.email;
      if (
        action === 'REMOVE' &&
        opts?.notifyBuyerEmail &&
        buyerEmail &&
        buyerEmail.includes('@')
      ) {
        try {
          await this.mailService.sendReviewRemovedBuyerEmail({
            recipientEmail: buyerEmail,
            buyerName: review.reviewerName || review.order.customer?.fullName || 'Customer',
            productName: review.product.name,
            storeName: review.store.name,
            buyerFacingReason: opts.buyerMessage?.trim() || note,
          });
          buyerNotified = true;
          await tx.auditLog.create({
            data: {
              actorId,
              actorType: 'ADMIN',
              tenantId: review.store.tenantId,
              storeId: review.storeId,
              action: 'BUYER_NOTIFIED',
              entityType: 'ProductReview',
              entityId: review.id,
              metadata: {
                channel: 'EMAIL',
                recipient: buyerEmail,
                reason: opts.buyerMessage?.trim() || note,
              },
            },
          });
        } catch (err: any) {
          this.logger.warn(`Failed to send buyer removal email: ${err.message}`);
        }
      }

      // Merchant Notification
      let merchantNotified = false;
      if (opts?.notifyMerchantEmail) {
        const ownerMembership = await tx.tenantMembership.findFirst({
          where: { tenantId: review.store.tenantId, role: 'SELLER_OWNER' },
          include: { user: true },
        });
        const merchantEmail =
          ownerMembership?.user?.email || review.store.supportEmail;
        if (merchantEmail && merchantEmail.includes('@')) {
          try {
            if (action === 'REMOVE') {
              await this.mailService.sendReviewModeratedMerchantEmail({
                recipientEmail: merchantEmail,
                storeName: review.store.name,
                productName: review.product.name,
                orderNumber: review.order.orderNumber,
                result: 'Review removed',
                safeReason: opts.merchantMessage?.trim() || note,
              });
            } else {
              await this.mailService.sendReviewRestoredMerchantEmail({
                recipientEmail: merchantEmail,
                storeName: review.store.name,
                productName: review.product.name,
                orderNumber: review.order.orderNumber,
              });
            }
            merchantNotified = true;
            await tx.auditLog.create({
              data: {
                actorId,
                actorType: 'ADMIN',
                tenantId: review.store.tenantId,
                storeId: review.storeId,
                action: 'MERCHANT_NOTIFIED',
                entityType: 'ProductReview',
                entityId: review.id,
                metadata: {
                  channel: 'EMAIL',
                  recipient: merchantEmail,
                  action,
                  reason: opts.merchantMessage?.trim() || note,
                },
              },
            });
          } catch (err: any) {
            this.logger.warn(`Failed to send merchant review notification email: ${err.message}`);
          }
        }
      }

      // WhatsApp link preparation (wa.me)
      let whatsappBuyerUrl: string | null = null;
      let whatsappMerchantUrl: string | null = null;
      if (opts?.notifyBuyerWhatsapp && review.order.customer?.phone) {
        const cleanPhone = review.order.customer.phone.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(
          `Hello ${review.reviewerName}, your review for ${review.product.name} at ${review.store.name} was removed following a LetzShop moderation review. Reason: ${opts.buyerMessage?.trim() || note}`,
        );
        whatsappBuyerUrl = `https://wa.me/${cleanPhone}?text=${msg}`;
      }
      if (opts?.notifyMerchantWhatsapp && (review.store.whatsappNumber || review.store.supportPhone)) {
        const cleanPhone = (review.store.whatsappNumber || review.store.supportPhone)!.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(
          `Hello ${review.store.name}, the reported review for ${review.product.name} (Order #${review.order.orderNumber}) has been reviewed. Result: ${action === 'REMOVE' ? 'Review removed' : 'Review restored'}.`,
        );
        whatsappMerchantUrl = `https://wa.me/${cleanPhone}?text=${msg}`;
      }

      return {
        ...updated,
        buyerNotified,
        merchantNotified,
        whatsappBuyerUrl,
        whatsappMerchantUrl,
      };
    });
  }

  async updateReport(
    reportId: string,
    actorId: string,
    status: 'UNDER_REVIEW' | 'DISMISSED',
    note?: string,
  ) {
    if (!['UNDER_REVIEW', 'DISMISSED'].includes(status))
      throw new BadRequestException('Choose UNDER_REVIEW or DISMISSED.');
    if (status === 'DISMISSED' && !note?.trim())
      throw new BadRequestException(
        'A reason is required to dismiss a report.',
      );
    if ((note?.length || 0) > 2000)
      throw new BadRequestException('Moderation note is too long.');

    const found = await this.prisma.reviewReport.findUnique({
      where: { id: reportId },
    });
    if (!found) throw new NotFoundException('Report not found.');

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM product_reviews WHERE id = ${found.reviewId} FOR UPDATE`;
      const report = await tx.reviewReport.findUnique({
        where: { id: reportId },
        include: {
          review: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  tenantId: true,
                  supportEmail: true,
                },
              },
              product: { select: { id: true, name: true } },
              order: { select: { orderNumber: true } },
            },
          },
        },
      });
      if (!report || !['PENDING', 'UNDER_REVIEW'].includes(report.status))
        throw new ConflictException('This report is already closed.');

      const updated = await tx.reviewReport.update({
        where: { id: reportId },
        data: {
          status,
          adminNote: note?.trim() || null,
          ...(status === 'DISMISSED'
            ? { resolvedAt: new Date(), resolvedById: actorId }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'ADMIN',
          tenantId: report.review.store.tenantId,
          storeId: report.review.storeId,
          action:
            status === 'DISMISSED'
              ? 'REVIEW_REPORT_DISMISSED'
              : 'REVIEW_REPORT_UNDER_REVIEW',
          entityType: 'ReviewReport',
          entityId: reportId,
          metadata: {
            reviewId: report.reviewId,
            reason: note?.trim() || null,
            previousStatus: report.status,
            status,
          },
        },
      });

      if (status === 'DISMISSED') {
        const ownerMembership = await tx.tenantMembership.findFirst({
          where: { tenantId: report.review.store.tenantId, role: 'SELLER_OWNER' },
          include: { user: true },
        });
        const merchantEmail =
          ownerMembership?.user?.email || report.review.store.supportEmail;
        if (merchantEmail && merchantEmail.includes('@')) {
          try {
            await this.mailService.sendReviewModeratedMerchantEmail({
              recipientEmail: merchantEmail,
              storeName: report.review.store.name,
              productName: report.review.product.name,
              orderNumber: report.review.order.orderNumber,
              result: 'Complaint dismissed',
              safeReason: note?.trim() || 'Reviewed and dismissed by administrator',
            });
            await tx.auditLog.create({
              data: {
                actorId,
                actorType: 'ADMIN',
                tenantId: report.review.store.tenantId,
                storeId: report.review.storeId,
                action: 'MERCHANT_NOTIFIED',
                entityType: 'ReviewReport',
                entityId: reportId,
                metadata: {
                  channel: 'EMAIL',
                  recipient: merchantEmail,
                  status: 'DISMISSED',
                  reason: note?.trim(),
                },
              },
            });
          } catch (err: any) {
            this.logger.warn(`Failed to send dismissal email to merchant: ${err.message}`);
          }
        }
      }

      return updated;
    });
  }

  async recordWhatsAppOpened(
    reviewId: string,
    actorId: string,
    recipientType: 'MERCHANT' | 'BUYER',
    phone?: string,
  ) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
      include: { store: true },
    });
    if (!review) throw new NotFoundException('Review not found.');

    return this.prisma.auditLog.create({
      data: {
        actorId,
        actorType: 'ADMIN',
        tenantId: review.store.tenantId,
        storeId: review.storeId,
        action: 'OPENED_IN_WHATSAPP',
        entityType: 'ProductReview',
        entityId: review.id,
        metadata: {
          recipientType,
          phone,
          channel: 'WHATSAPP_DEEP_LINK',
          status: 'Opened in WhatsApp',
        },
      },
    });
  }

  async createReport(
    reviewId: string,
    tenantId: string,
    storeId: string,
    actorId: string | undefined,
    reason: string,
    note?: string,
  ) {
    if (!reason?.trim() || reason.length > 1000 || (note?.length || 0) > 2000)
      throw new BadRequestException(
        'Provide a reason up to 1000 characters and a note up to 2000 characters.',
      );
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM product_reviews WHERE id = ${reviewId} FOR UPDATE`;
        const review = await tx.productReview.findUnique({
          where: { id: reviewId },
        });
        if (!review || review.storeId !== storeId)
          throw new NotFoundException('Review not found for this store.');
        if (review.status !== 'ACTIVE')
          throw new ConflictException('Only active reviews can be reported.');
        const open = await tx.reviewReport.findFirst({
          where: actorId
            ? { reviewId, reportedById: actorId, status: { in: ['PENDING', 'UNDER_REVIEW'] } }
            : { reviewId, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
        });
        if (open)
          throw new ConflictException(
            'You have already submitted a pending moderation report for this review.',
          );
        const report = await tx.reviewReport.create({
          data: {
            reviewId,
            reportedById: actorId,
            reason: reason.trim(),
            merchantNote: note?.trim() || null,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            tenantId,
            storeId,
            action: 'REVIEW_REPORTED',
            entityType: 'ReviewReport',
            entityId: report.id,
            metadata: { reviewId, reason: reason.trim() },
          },
        });

        // Enforce Moderation Policy: AUTO_HIDE_ON_REPORTS threshold check
        try {
          const modSetting = await tx.platformSetting.findUnique({
            where: { key: 'moderation' },
          });
          const modVal = (modSetting?.value as any) || {};
          const policy = modVal.reviewModerationPolicy || 'MANUAL_REMOVAL';
          const autoHideThreshold = Number(modVal.autoHideAfterReports ?? 0);

          if (policy === 'AUTO_HIDE_ON_REPORTS' && autoHideThreshold > 0) {
            const qualifyingReportsCount = await tx.reviewReport.count({
              where: { reviewId },
            });
            if (qualifyingReportsCount >= autoHideThreshold) {
              await tx.productReview.update({
                where: { id: reviewId },
                data: { status: 'REMOVED' },
              });
              await tx.auditLog.create({
                data: {
                  actorId: actorId || null,
                  tenantId,
                  storeId,
                  action: 'REVIEW_AUTO_HIDDEN',
                  entityType: 'ProductReview',
                  entityId: reviewId,
                  metadata: {
                    reason: `Auto-hidden by moderation policy (${qualifyingReportsCount} reports >= threshold ${autoHideThreshold})`,
                    policy,
                    autoHideThreshold,
                    qualifyingReportsCount,
                    module: 'Reviews',
                    result: 'SUCCESS',
                  },
                },
              });
            }
          }
        } catch (policyErr) {
          // Graceful fallback: do not fail report creation if policy check errors
        }

        return report;
      });
    } catch (error: any) {
      if (error.code === 'P2002')
        throw new ConflictException(
          'This review is already pending admin moderation.',
        );
      throw error;
    }
  }
}

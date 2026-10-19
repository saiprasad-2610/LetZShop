import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext, AuthenticatedUser } from '@simply/types';
import { ReviewModerationService } from './review-moderation.service';
import { MailService } from '../notifications/mail.service';

export interface SubmitReviewDto {
  orderNumber: string;
  token: string;
  orderItemId: string;
  productId: string;
  reviewerName?: string;
  rating: number;
  title?: string;
  body: string;
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly mailService: MailService,
    private readonly moderation: ReviewModerationService,
  ) {}

  /**
   * Returns order items eligible for verified product reviews.
   * Requires valid security token and order status === COMPLETED.
   */
  async getEligibleOrderReviews(storeSlug: string, orderNumber: string, token: string) {
    if (!token || !token.trim()) {
      throw new BadRequestException('Security review token is required.');
    }

    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });
    if (!store) {
      throw new NotFoundException(`Store "${storeSlug}" not found.`);
    }

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        orderAddress: true,
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    media: {
                      where: { mediaAsset: { deletedAt: null } },
                      include: { mediaAsset: true },
                      take: 1,
                    },
                  },
                },
              },
            },
            product: {
              include: {
                media: {
                  where: { mediaAsset: { deletedAt: null } },
                  include: { mediaAsset: true },
                  take: 1,
                },
              },
            },
            reviews: true,
          },
        },
      },
    });

    if (!order || order.storeId !== store.id) {
      throw new NotFoundException(`Order "${orderNumber}" not found for this store.`);
    }

    // Verify token matches order.reviewToken or order.trackingToken
    const validToken = order.reviewToken || order.trackingToken;
    if (token.trim() !== validToken) {
      throw new BadRequestException('Invalid or expired review authorization token.');
    }

    // Must be DELIVERED / COMPLETED
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException(
        `Reviews are only allowed for delivered orders. Current order status: ${order.status}.`
      );
    }

    const customerName =
      order.customer?.fullName || (order.orderAddress as any)?.fullName || 'Valued Customer';

    const items = order.items.map((item) => {
      const resolvedProductId =
        item.productId || item.variant?.productId || item.product?.id || '';
      const resolvedProductName = item.productName || item.product?.name || 'Product';
      const imageUrl =
        item.product?.media?.[0]?.mediaAsset?.publicUrl ||
        item.variant?.product?.media?.[0]?.mediaAsset?.publicUrl ||
        null;

      // Check if review already submitted
      const submittedReview = item.reviews.find(
        (r) => r.productId === resolvedProductId && r.orderItemId === item.id
      );

      return {
        orderItemId: item.id,
        productId: resolvedProductId,
        productName: resolvedProductName,
        variantTitle: item.variantTitle,
        unitPricePaise: item.unitPricePaise,
        quantity: item.quantity,
        imageUrl,
        isReviewed: Boolean(submittedReview),
        existingReview: submittedReview
          ? {
              id: submittedReview.id,
              rating: submittedReview.rating,
              title: submittedReview.title,
              body: submittedReview.body,
              status: submittedReview.status,
              createdAt: submittedReview.createdAt,
            }
          : null,
      };
    });

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      customerName,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
      },
      items,
    };
  }

  /**
   * Submits a verified purchase review.
   * Performs complete server-side security, order eligibility, and duplicate checks.
   */
  async submitReview(storeSlug: string, dto: SubmitReviewDto) {
    if (!dto.token || !dto.token.trim()) {
      throw new BadRequestException('Missing review token.');
    }

    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });
    if (!store) {
      throw new NotFoundException(`Store "${storeSlug}" not found.`);
    }

    const order = await this.prisma.order.findUnique({
      where: { orderNumber: dto.orderNumber },
      include: {
        customer: true,
        orderAddress: true,
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!order || order.storeId !== store.id) {
      throw new NotFoundException('Order not found for this store.');
    }

    // 1. Verify token
    const validToken = order.reviewToken || order.trackingToken;
    if (dto.token.trim() !== validToken) {
      throw new BadRequestException('Invalid or expired review authorization token.');
    }

    // 2. Verify order status is COMPLETED
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Reviews can only be submitted for completed/delivered orders.');
    }

    // 3. Verify orderItem belongs to order
    const orderItem = order.items.find((it) => it.id === dto.orderItemId);
    if (!orderItem) {
      throw new BadRequestException('The specified item is not part of this order.');
    }

    // 4. Verify product matches orderItem
    const itemProductId = orderItem.productId || orderItem.variant?.productId;
    if (dto.productId && itemProductId && dto.productId !== itemProductId) {
      throw new BadRequestException('Product does not match the purchased order item.');
    }
    const finalProductId = itemProductId || dto.productId;
    if (!finalProductId) {
      throw new BadRequestException('Could not resolve product ID for this item.');
    }

    // 5. Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: finalProductId },
    });
    if (!product || product.storeId !== store.id) {
      throw new BadRequestException('Product does not exist or does not belong to this store.');
    }

    // 6. Check duplicates (Unique constraint: orderItemId + productId)
    const existing = await this.prisma.productReview.findUnique({
      where: {
        orderItemId_productId: {
          orderItemId: orderItem.id,
          productId: finalProductId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('You have already submitted a review for this purchased item.');
    }

    // 7. Validate rating and body
    const rating = Math.max(1, Math.min(5, Math.floor(Number(dto.rating) || 5)));
    const body = (dto.body || '').trim();
    if (body.length < 3) {
      throw new BadRequestException('Review text must be at least 3 characters long.');
    }
    if (body.length > 2000) {
      throw new BadRequestException('Review text cannot exceed 2000 characters.');
    }

    const reviewerName =
      dto.reviewerName?.trim() ||
      order.customer?.fullName ||
      (order.orderAddress as any)?.fullName ||
      'Verified Customer';

    // 8. Create Verified Product Review
    return await this.prisma.productReview.create({
      data: {
        storeId: store.id,
        productId: finalProductId,
        orderId: order.id,
        orderItemId: orderItem.id,
        reviewerName,
        rating,
        title: dto.title?.trim() || null,
        body,
        verifiedPurchase: true,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Public storefront endpoint: returns active reviews, rating average, and distribution.
   * Soft-deleted / REMOVED reviews are excluded.
   */
  async getProductReviews(storeSlug: string, productId: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });
    if (!store) {
      throw new NotFoundException(`Store "${storeSlug}" not found.`);
    }

    const reviews = await this.prisma.productReview.findMany({
      where: {
        productId,
        storeId: store.id,
        status: { in: ['ACTIVE', 'SENT_FOR_REVIEW'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reviewerName: true,
        rating: true,
        title: true,
        body: true,
        verifiedPurchase: true,
        createdAt: true,
      },
    });

    const totalReviews = reviews.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const r of reviews) {
      const star = Math.max(1, Math.min(5, r.rating));
      distribution[star] = (distribution[star] || 0) + 1;
      sum += star;
    }

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

    return {
      averageRating,
      totalReviews,
      distribution,
      reviews,
    };
  }

  /**
   * Super Admin Moderation: List all reviews with filters.
   */
  async getAdminReviews(query: Parameters<ReviewModerationService['getReviews']>[0]) { return this.moderation.getReviews(query); }

  async getAdminReviewSummary() { return this.moderation.getSummary(); }

  async getAdminReviewFilters() { return this.moderation.getFilters(); }

  async getAdminReviewTimeline(reviewId: string) { return this.moderation.getReviewTimeline(reviewId); }

  async moderateReview(
    reviewId: string,
    moderator: { userId: string; fullName: string },
    action: 'REMOVE' | 'RESTORE',
    reason?: string,
    opts?: import('./review-moderation.service').ModerateReviewOptions,
  ) {
    return this.moderation.moderate(reviewId, moderator.userId, action, reason, opts);
  }

  async updateReviewReport(reportId: string, actorId: string, status: 'UNDER_REVIEW' | 'DISMISSED', note?: string) { return this.moderation.updateReport(reportId, actorId, status, note); }

  async recordWhatsAppOpened(reviewId: string, actorId: string, recipientType: 'MERCHANT' | 'BUYER', phone?: string) {
    return this.moderation.recordWhatsAppOpened(reviewId, actorId, recipientType, phone);
  }

  /**
   * Seller Portal: View reviews for their store's products with filtering, search, metrics, and pagination.
   * Can accept either a TenantContext object or legacy storeId string for full compatibility.
   */
  async getSellerReviews(
    tenantOrStoreId: TenantContext | string,
    query: {
      page?: number;
      pageSize?: number;
      rating?: number | string;
      productId?: string;
      verified?: string | boolean;
      status?: string;
      sort?: string;
      search?: string;
      dateRange?: string;
    } = {}
  ) {
    let storeId: string | undefined;

    if (typeof tenantOrStoreId === 'string') {
      storeId = tenantOrStoreId;
    } else {
      storeId = tenantOrStoreId.storeId;
      if (!storeId && tenantOrStoreId.tenantId) {
        const store = await this.prisma.store.findFirst({
          where: { tenantId: tenantOrStoreId.tenantId },
          select: { id: true },
        });
        storeId = store?.id;
      }
    }

    if (!storeId) {
      throw new NotFoundException('Store not found for this merchant account.');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    // 1. Calculate store-level summary metrics across ACTIVE reviews (Requirements 5, 6, 22)
    const allActiveReviews = await this.prisma.productReview.findMany({
      where: {
        storeId,
        status: { in: ['ACTIVE', 'SENT_FOR_REVIEW'] },
      },
      select: {
        rating: true,
        verifiedPurchase: true,
      },
    });

    const totalActive = allActiveReviews.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;
    let verifiedCount = 0;
    let fiveStarCount = 0;
    let negativeCount = 0;

    for (const rev of allActiveReviews) {
      const star = Math.max(1, Math.min(5, rev.rating));
      distribution[star] = (distribution[star] || 0) + 1;
      ratingSum += star;
      if (rev.verifiedPurchase) {
        verifiedCount++;
      }
      if (star === 5) {
        fiveStarCount++;
      }
      if (star < 3) {
        negativeCount++;
      }
    }

    const averageRating = totalActive > 0 ? Number((ratingSum / totalActive).toFixed(1)) : 0;

    const summary = {
      total: totalActive,
      averageRating,
      verifiedCount,
      fiveStarCount,
      negativeCount,
      distribution,
    };

    // 2. Build filtered WHERE clause
    const where: any = {
      storeId,
    };

    // Status filter:
    // 'SENT_FOR_REVIEW' -> only reviews reported by merchant awaiting admin moderation
    // 'REMOVED' -> only reviews taken down by admin
    // 'ALL' -> all reviews
    // 'ACTIVE' (default) -> active reviews (including those sent for review, excluding removed)
    if (query.status === 'SENT_FOR_REVIEW') {
      where.reports = { some: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } };
    } else if (query.status === 'REMOVED') {
      where.status = 'REMOVED';
    } else if (query.status === 'ALL') {
      // No status filter applied
    } else if (query.status === 'ACTIVE_ONLY') {
      where.status = 'ACTIVE';
    } else {
      where.status = { in: ['ACTIVE', 'SENT_FOR_REVIEW'] };
    }

    // Rating filter (1..5 or BELOW_3 / LESS_THAN_3 / NEGATIVE)
    if (query.rating === 'BELOW_3' || query.rating === 'LESS_THAN_3' || query.rating === 'NEGATIVE') {
      where.rating = { lt: 3 };
    } else if (query.rating && [1, 2, 3, 4, 5].includes(Number(query.rating))) {
      where.rating = Number(query.rating);
    }

    // Product filter
    if (query.productId && query.productId !== 'ALL') {
      where.productId = query.productId;
    }

    // Verified purchase filter
    if (query.verified !== undefined && query.verified !== '' && query.verified !== 'ALL') {
      where.verifiedPurchase = String(query.verified) === 'true';
    }

    // Date range filter
    if (query.dateRange && query.dateRange !== 'all') {
      const now = new Date();
      let fromDate: Date | null = null;
      if (query.dateRange === 'today') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (query.dateRange === '7d') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (query.dateRange === '30d') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (query.dateRange === '90d') {
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      if (fromDate) {
        where.createdAt = { gte: fromDate };
      }
    }

    // Search filter: Product name, Reviewer name, Review title, Review body, Order number
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { reviewerName: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
        { body: { contains: s, mode: 'insensitive' } },
        { product: { name: { contains: s, mode: 'insensitive' } } },
        { order: { orderNumber: { contains: s, mode: 'insensitive' } } },
      ];
    }

    // 3. Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (query.sort === 'highest_rating') {
      orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    } else if (query.sort === 'lowest_rating') {
      orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
    }

    // 4. Query reviews with pagination
    const [totalFiltered, rawReviews] = await Promise.all([
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          reports: { orderBy: { createdAt: 'desc' }, take: 1 },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              media: {
                select: { publicUrl: true, sortOrder: true },
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    // Format reviews for client (ensuring privacy: no customer email or phone)
    const reviews = rawReviews.map((r) => ({
      id: r.id,
      report: r.reports[0] ? { id: r.reports[0].id, status: r.reports[0].status, reason: r.reports[0].reason, merchantNote: r.reports[0].merchantNote, createdAt: r.reports[0].createdAt, resolvedAt: r.reports[0].resolvedAt } : null,
      storeId: r.storeId,
      productId: r.productId,
      orderId: r.orderId,
      orderItemId: r.orderItemId,
      reviewerName: r.reviewerName,
      rating: r.rating,
      title: r.title,
      body: r.body,
      verifiedPurchase: r.verifiedPurchase,
      status: r.status,
      moderatedAt: r.moderatedAt,
      moderatedBy: r.moderatedBy,
      moderationReason: r.moderationReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      product: {
        id: r.product.id,
        name: r.product.name,
        slug: r.product.slug,
        image: r.product.media?.[0]?.publicUrl || null,
      },
      order: {
        id: r.order.id,
        orderNumber: r.order.orderNumber,
        createdAt: r.order.createdAt,
      },
    }));

    return {
      reviews,
      items: reviews, // Backwards compatibility for any callers expecting items
      summary,
      pagination: {
        page,
        pageSize,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / pageSize),
      },
    };
  }

  /**
   * Merchant Report Review: Request platform moderation for a review.
   */
  async reportReviewByMerchant(
    tenant: TenantContext,
    reviewId: string,
    reason: string,
    details?: string,
    user?: AuthenticatedUser
  ) {
    let storeId: string | undefined = tenant.storeId;
    if (!storeId && tenant.tenantId) {
      const store = await this.prisma.store.findFirst({
        where: { tenantId: tenant.tenantId },
        select: { id: true },
      });
      storeId = store?.id;
    }

    if (!storeId) {
      throw new NotFoundException('Store not found for this merchant account.');
    }

    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        store: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { orderNumber: true } },
      },
    });

    if (!review || review.storeId !== storeId) {
      throw new NotFoundException('Review not found for this store.');
    }

    if (review.status === 'REMOVED') {
      throw new BadRequestException('This review has already been removed by platform moderation.');
    }

    const report = await this.moderation.createReport(reviewId, tenant.tenantId, storeId, user?.userId, reason, details);

    this.logger.log(
      `[MERCHANT_REVIEW_REPORT] Review ID ${reviewId} reported by merchant ${user?.phone || user?.userId} (Store: ${review.store.name}). Reason: "${reason}". Details: "${details || 'N/A'}"`
    );

    // Check platform setting for notifyAdminOnReviewReport
    let shouldNotifyAdmin = true;
    try {
      const notifSetting = await this.prisma.platformSetting.findUnique({
        where: { key: 'notifications' },
      });
      if (notifSetting?.value && typeof notifSetting.value === 'object') {
        shouldNotifyAdmin = (notifSetting.value as any).notifyAdminOnReviewReport ?? true;
      }
    } catch {
      // Default to true if setting query fails
    }

    if (shouldNotifyAdmin) {
      // Send moderation request email to letzshop@aikyamaisystems.com, business@aikyamaisystems.com, and admin
      try {
        await this.mailService.sendReviewReportModerationEmail({
          storeName: review.store.name,
          storeId: review.store.id,
          productName: review.product.name,
          productId: review.productId,
          orderNumber: review.order.orderNumber,
          reviewId: review.id,
          reviewerName: review.reviewerName,
          rating: review.rating,
          title: review.title,
          body: review.body,
          reason,
          details,
          merchantIdentifier: user?.phone || user?.userId || 'Merchant',
        });
      } catch (mailErr: any) {
        this.logger.error(
          `Failed to send review report moderation email for review ${reviewId}: ${mailErr?.message || mailErr}`
        );
      }
    } else {
      this.logger.log(`[NOTIFICATIONS] notifyAdminOnReviewReport disabled; email alert skipped for review ${reviewId}`);
    }

    return {
      success: true,
      message: 'Moderation request received. Platform administrators will review this submission.',
      reportedAt: report.createdAt.toISOString(),
      report: { id: report.id, status: report.status },
    };
  }
}

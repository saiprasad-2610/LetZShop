import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
  constructor(private readonly prisma: PrismaClient) {}

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
        status: 'ACTIVE',
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
  async getAdminReviews(query: {
    status?: string;
    search?: string;
    storeId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.storeId) {
      where.storeId = query.storeId;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { reviewerName: { contains: s, mode: 'insensitive' } },
        { body: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
        { product: { name: { contains: s, mode: 'insensitive' } } },
        { store: { name: { contains: s, mode: 'insensitive' } } },
        { order: { orderNumber: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, reviews] = await Promise.all([
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          store: { select: { id: true, name: true, slug: true } },
          product: { select: { id: true, name: true, slug: true } },
          order: { select: { id: true, orderNumber: true, status: true } },
        },
      }),
    ]);

    return {
      items: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Super Admin Moderation: Remove (soft-delete) or Restore review.
   */
  async moderateReview(
    reviewId: string,
    moderator: { userId: string; fullName: string },
    action: 'REMOVE' | 'RESTORE',
    reason?: string
  ) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException(`Review "${reviewId}" not found.`);
    }

    const newStatus = action === 'REMOVE' ? 'REMOVED' : 'ACTIVE';
    const moderationReason =
      reason?.trim() ||
      (action === 'REMOVE'
        ? 'Removed by Platform Administrator'
        : 'Restored by Platform Administrator');

    return await this.prisma.productReview.update({
      where: { id: reviewId },
      data: {
        status: newStatus,
        moderatedAt: new Date(),
        moderatedBy: moderator.fullName || moderator.userId,
        moderationReason,
      },
    });
  }

  /**
   * Seller Portal: View reviews for their store's products.
   */
  async getSellerReviews(storeId: string) {
    return await this.prisma.productReview.findMany({
      where: { storeId },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        order: { select: { id: true, orderNumber: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

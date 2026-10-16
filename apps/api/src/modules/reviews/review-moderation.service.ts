import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, Prisma, ReviewReportStatus } from '@prisma/client';

@Injectable()
export class ReviewModerationService {
  constructor(private readonly prisma: PrismaClient) {}

  async getFilters() {
    const [stores, products] = await Promise.all([
      this.prisma.store.findMany({
        where: { productReviews: { some: {} } },
        take: 500,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { reviews: { some: {} } },
        take: 500,
        select: { id: true, name: true, storeId: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { stores, products };
  }

  async getReviews(query: {
    status?: string;
    reportStatus?: string;
    search?: string;
    storeId?: string;
    productId?: string;
    rating?: string;
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
    if (query.storeId) where.storeId = query.storeId;
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
        { order: { orderNumber: { contains: text, mode: 'insensitive' } } },
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
    const [total, items] = await Promise.all([
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { createdAt: query.sort === 'oldest' ? 'asc' : 'desc' },
          { id: 'asc' },
        ],
        include: {
          store: { select: { id: true, name: true, slug: true } },
          product: { select: { id: true, name: true, slug: true } },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              createdAt: true,
            },
          },
          reports: { take: 50, orderBy: { createdAt: 'desc' } },
        },
      }),
    ]);
    return {
      items,
      reviews: items,
      total,
      page,
      limit,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async moderate(
    reviewId: string,
    actorId: string,
    action: 'REMOVE' | 'RESTORE',
    reason?: string,
  ) {
    const note = reason?.trim();
    if (!note || note.length > 2000)
      throw new BadRequestException(
        'A moderation reason of 1–2000 characters is required.',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM product_reviews WHERE id = ${reviewId} FOR UPDATE`;
      const review = await tx.productReview.findUnique({
        where: { id: reviewId },
        include: { store: { select: { tenantId: true } } },
      });
      if (!review) throw new NotFoundException('Review not found.');
      const status = action === 'REMOVE' ? 'REMOVED' : 'ACTIVE';
      if (review.status === status)
        throw new ConflictException(
          'Review already has this visibility status.',
        );
      const updated = await tx.productReview.update({
        where: { id: reviewId },
        data: {
          status,
          moderatedAt: new Date(),
          moderatedBy: actorId,
          moderationReason: note,
        },
      });
      if (action === 'REMOVE')
        await tx.reviewReport.updateMany({
          where: { reviewId, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedById: actorId,
            adminNote: note,
          },
        });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'ADMIN',
          tenantId: review.store.tenantId,
          storeId: review.storeId,
          action: action === 'REMOVE' ? 'REVIEW_REMOVED' : 'REVIEW_RESTORED',
          entityType: 'ProductReview',
          entityId: review.id,
          metadata: { reason: note, previousStatus: review.status, status },
        },
      });
      return updated;
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
          review: { include: { store: { select: { tenantId: true } } } },
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
      return updated;
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
          where: { reviewId, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
        });
        if (open)
          throw new ConflictException(
            'This review is already pending admin moderation.',
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

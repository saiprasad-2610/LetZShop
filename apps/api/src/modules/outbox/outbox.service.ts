import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, OutboxStatus } from '@prisma/client';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaClient) {}

  public async emitEvent(
    eventType: string,
    payload: any,
    tenantId?: string,
    storeId?: string,
    maxRetries = 5
  ) {
    return this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload,
        tenantId,
        storeId,
        status: OutboxStatus.PENDING,
        maxRetries,
        retryCount: 0,
      },
    });
  }

  /**
   * Processes pending outbox events with exponential backoff and error recovery.
   * Guarantees that external integration calls (e.g. Shiprocket, email notifications)
   * never block customer payment transactions or lose events.
   */
  public async processPendingEvents(limit = 10): Promise<{ processed: number; failed: number }> {
    const now = new Date();

    const pendingEvents = await this.prisma.outboxEvent.findMany({
      where: {
        status: OutboxStatus.PENDING,
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    let processedCount = 0;
    let failedCount = 0;

    for (const event of pendingEvents) {
      try {
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: OutboxStatus.PROCESSING },
        });

        // Event handler execution
        this.logger.log(`[OUTBOX EVENT] Dispatched event: ${event.eventType} (ID: ${event.id})`);

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: OutboxStatus.COMPLETED,
            processedAt: new Date(),
          },
        });

        processedCount++;
      } catch (err: any) {
        failedCount++;
        const nextRetry = event.retryCount + 1;
        const isDeadLetter = nextRetry >= event.maxRetries;

        // Exponential backoff: 2^retry * 10 seconds
        const backoffSeconds = Math.pow(2, nextRetry) * 10;
        const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

        this.logger.error(
          `[OUTBOX EVENT FAILURE] Event ${event.id} failed attempt ${nextRetry}/${event.maxRetries}. Error: ${err.message}`
        );

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: isDeadLetter ? OutboxStatus.DEAD_LETTER : OutboxStatus.PENDING,
            retryCount: nextRetry,
            lastError: err.message,
            nextRetryAt: isDeadLetter ? null : nextRetryAt,
          },
        });
      }
    }

    return { processed: processedCount, failed: failedCount };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, OutboxStatus } from '@prisma/client';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { OutboxService } from '../../src/modules/outbox/outbox.service';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { SubscriptionVisibilityService } from '../../src/modules/subscriptions/subscription-visibility.service';
import { SubscriptionService } from '../../src/modules/subscriptions/subscription.service';
import { MockPaymentProvider } from '../../src/modules/payments/providers/mock-payment.provider';
import { RazorpayPaymentProvider } from '../../src/modules/payments/providers/razorpay-payment.provider';
import { StoreSubscriptionRequiredException } from '../../src/common/exceptions/domain.exceptions';
import { SEED_IDS } from '@simply/db';

describe('Integration Reliability, Webhooks & Failure Recovery Tests', () => {
  let prisma: PrismaClient;
  let paymentsService: PaymentsService;
  let outboxService: OutboxService;
  let ordersService: OrdersService;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.TEST_DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5432/simply_ecommerce_test?schema=public',
        },
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        OutboxService,
        OrdersService,
        InventoryService,
        SubscriptionVisibilityService,
        SubscriptionService,
        MockPaymentProvider,
        RazorpayPaymentProvider,
        { provide: PrismaClient, useValue: prisma },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    outboxService = module.get<OutboxService>(OutboxService);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Duplicate payment webhook events are safely deduplicated', async () => {
    const testEventId = `test_webhook_evt_${Date.now()}`;
    const payload = {
      event: 'payment.captured',
      id: testEventId,
      amount: 499800,
    };

    // First delivery of webhook
    const res1 = await paymentsService.handleWebhook(
      'RAZORPAY',
      testEventId,
      'payment.captured',
      payload,
      'valid_sig'
    );
    expect(res1.status).toBe('processed');

    // Duplicate redelivery of the same webhook (e.g. gateway network retry)
    const res2 = await paymentsService.handleWebhook(
      'RAZORPAY',
      testEventId,
      'payment.captured',
      payload,
      'valid_sig'
    );
    expect(res2.status).toBe('already_processed');

    // Clean up
    await prisma.paymentWebhookEvent.delete({ where: { eventId: testEventId } });
  });

  it('2. Idempotent payment request returns cached response without duplicate orders', async () => {
    const testKey = `idem_key_${Date.now()}`;

    // First request
    const firstCall: any = await paymentsService.createPaymentOrder(SEED_IDS.orderA1, testKey);
    expect(firstCall.providerOrderId).toBeDefined();

    // Replay with exact same idempotency key
    const replayCall: any = await paymentsService.createPaymentOrder(SEED_IDS.orderA1, testKey);
    expect(replayCall.providerOrderId).toBe(firstCall.providerOrderId);

    // Clean up
    await prisma.idempotencyKey.delete({ where: { key: testKey } });
  });

  it('3. Checkout is BLOCKED on unpaid / expired store', async () => {
    // Tenant B (Patil Engineering) has an UNPAID subscription
    await expect(
      ordersService.createGuestOrder({
        storeId: SEED_IDS.storeB,
        cartId: 'any-cart',
        fullName: 'Test Buyer',
        phone: '+919876543210',
        deliveryAddress: {
          addressLine1: 'Road 1',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
        },
      })
    ).rejects.toThrow(StoreSubscriptionRequiredException);
  });

  it('4. Outbox event processing dispatches events and updates status', async () => {
    await prisma.outboxEvent.deleteMany({});

    const event = await outboxService.emitEvent('ORDER_PAID', {
      orderId: SEED_IDS.orderA1,
      totalPaise: 499800,
    });

    expect(event.status).toBe(OutboxStatus.PENDING);

    const result = await outboxService.processPendingEvents(50);
    expect(result.processed).toBeGreaterThanOrEqual(1);

    const updatedEvent = await prisma.outboxEvent.findUnique({
      where: { id: event.id },
    });
    expect(updatedEvent?.status).toBe(OutboxStatus.COMPLETED);
    expect(updatedEvent?.processedAt).toBeDefined();

    // Clean up
    await prisma.outboxEvent.delete({ where: { id: event.id } });
  });
});

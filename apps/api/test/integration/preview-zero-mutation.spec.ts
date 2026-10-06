import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { SubscriptionVisibilityService } from '../../src/modules/subscriptions/subscription-visibility.service';
import { CartService } from '../../src/modules/cart/cart.service';
import { SEED_IDS } from '@simply/db';

describe('Merchant Preview Mode - Zero Commerce Mutation Test Suite', () => {
  let prisma: PrismaClient;
  let ordersService: OrdersService;
  let cartService: CartService;

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
        OrdersService,
        InventoryService,
        SubscriptionVisibilityService,
        CartService,
        { provide: PrismaClient, useValue: prisma },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    cartService = module.get<CartService>(CartService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Backend explicitly rejects preview mode guest order creation with BadRequestException', async () => {
    // Record baseline counts before attempt
    const baselineOrdersCount = await prisma.order.count();
    const baselineCustomersCount = await prisma.customer.count();
    const baselineInventory = await prisma.inventory.findUnique({
      where: { variantId: SEED_IDS.variantA1NavyS },
    });

    // Test rejection with preview flag
    await expect(
      ordersService.createGuestOrder({
        storeId: SEED_IDS.storeA,
        cartId: 'valid-cart-id',
        customerName: 'Preview Merchant Tester',
        phone: '9876543210',
        paymentMethod: 'COD',
        preview: true,
      } as any)
    ).rejects.toThrow(BadRequestException);

    // Test rejection with isPreview flag
    await expect(
      ordersService.createGuestOrder({
        storeId: SEED_IDS.storeA,
        cartId: 'valid-cart-id',
        customerName: 'Preview Merchant Tester',
        phone: '9876543210',
        paymentMethod: 'COD',
        isPreview: true,
      } as any)
    ).rejects.toThrow(BadRequestException);

    // Test rejection with preview cartId
    await expect(
      ordersService.createGuestOrder({
        storeId: SEED_IDS.storeA,
        cartId: 'preview_cart_session_123',
        customerName: 'Preview Merchant Tester',
        phone: '9876543210',
        paymentMethod: 'COD',
      } as any)
    ).rejects.toThrow(BadRequestException);

    // Verify baseline counts are 100% UNCHANGED (Zero mutations)
    const afterOrdersCount = await prisma.order.count();
    const afterCustomersCount = await prisma.customer.count();
    const afterInventory = await prisma.inventory.findUnique({
      where: { variantId: SEED_IDS.variantA1NavyS },
    });

    expect(afterOrdersCount).toBe(baselineOrdersCount);
    expect(afterCustomersCount).toBe(baselineCustomersCount);
    expect(afterInventory?.stockOnHand).toBe(baselineInventory?.stockOnHand);
    expect(afterInventory?.stockReserved).toBe(baselineInventory?.stockReserved);
  });
});

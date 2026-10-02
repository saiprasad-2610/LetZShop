import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { SubscriptionVisibilityService } from '../../src/modules/subscriptions/subscription-visibility.service';
import { CartService } from '../../src/modules/cart/cart.service';
import { SEED_IDS } from '@simply/db';
import { InsufficientStockException } from '../../src/common/exceptions/domain.exceptions';

describe('Order Transaction & Concurrency Rollback Tests', () => {
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

  it('1. Out-of-stock / Insufficient stock rolls back entire transaction cleanly', async () => {
    // 1. Get initial inventory
    const initialInv = await prisma.inventory.findUnique({
      where: { variantId: SEED_IDS.variantA1NavyS },
    });
    expect(initialInv).toBeDefined();
    const originalStock = initialInv!.stockOnHand;

    // 2. Create a test cart and force quantity to exceed available stock (e.g. originalStock + 500)
    const cart = await cartService.getOrCreateCart(SEED_IDS.storeA);

    // Insert an item that exceeds available stock directly into cart to test transaction boundary
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: SEED_IDS.variantA1NavyS,
        quantity: originalStock + 500,
        unitPricePaise: 249900,
      },
    });

    const initialOrderCount = await prisma.order.count();

    // 3. Attempt guest checkout - should fail during stock reservation
    await expect(
      ordersService.createGuestOrder({
        storeId: SEED_IDS.storeA,
        cartId: cart.id,
        fullName: 'Test Rollback Buyer',
        phone: '+919999988888',
        deliveryAddress: {
          addressLine1: 'Flat 1',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
      })
    ).rejects.toThrow(InsufficientStockException);

    // 4. Verify transaction rollback: No new order created!
    const postOrderCount = await prisma.order.count();
    expect(postOrderCount).toBe(initialOrderCount);

    // 5. Verify inventory was NOT modified or corrupted
    const postInv = await prisma.inventory.findUnique({
      where: { variantId: SEED_IDS.variantA1NavyS },
    });
    expect(postInv!.stockOnHand).toBe(originalStock);
    expect(postInv!.stockReserved).toBe(initialInv!.stockReserved);

    // Cleanup cart
    await prisma.cart.delete({ where: { id: cart.id } });
  });

  it('2. Successful checkout reserves stock and snapshots order items atomically', async () => {
    const initialInv = await prisma.inventory.findUnique({
      where: { variantId: SEED_IDS.variantA1NavyM },
    });
    const startingStock = initialInv!.stockOnHand;
    const startingReserved = initialInv!.stockReserved;

    const cart = await cartService.getOrCreateCart(SEED_IDS.storeA);
    await cartService.addItem(cart.id, SEED_IDS.variantA1NavyM, 2);

    const order = await ordersService.createGuestOrder({
      storeId: SEED_IDS.storeA,
      cartId: cart.id,
      fullName: 'Vikram Singh',
      phone: '+919811223344',
      deliveryAddress: {
        addressLine1: 'Plot 45, Sector 12',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
      },
    });

    expect(order).toBeDefined();
    expect(order.orderNumber).toMatch(/^ORD-\d{8}-[A-F0-9]{6}$/);
    expect(order.totalPaise).toBeGreaterThan(0);

    // Verify inventory state: stockOnHand decremented by 2, stockReserved incremented by 2
    const updatedInv = await prisma.inventory.findUnique({
      where: { variantId: SEED_IDS.variantA1NavyM },
    });
    expect(updatedInv!.stockOnHand).toBe(startingStock - 2);
    expect(updatedInv!.stockReserved).toBe(startingReserved + 2);

    // Verify OrderItem snapshot preservation
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });
    expect(orderItems.length).toBe(1);
    expect(orderItems[0].productName).toBe('Classic Linen Shirt');
    expect(orderItems[0].sku).toBe('AUR-LSH-NVY-M');
    expect(orderItems[0].quantity).toBe(2);

    // Cleanup created order and customer
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.cart.delete({ where: { id: cart.id } });

    // Restore inventory
    await prisma.inventory.update({
      where: { variantId: SEED_IDS.variantA1NavyM },
      data: { stockOnHand: startingStock, stockReserved: startingReserved },
    });
  });
});

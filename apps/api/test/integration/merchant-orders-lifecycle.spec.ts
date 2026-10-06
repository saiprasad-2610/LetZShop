import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, OrderStatus, PaymentStatus, FulfillmentStatus, FulfillmentMode } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { SubscriptionVisibilityService } from '../../src/modules/subscriptions/subscription-visibility.service';
import { SEED_IDS } from '@simply/db';
import { TenantContext } from '@simply/types';

describe('Merchant Orders Lifecycle & Status Workflow Integration Tests', () => {
  let prisma: PrismaClient;
  let ordersService: OrdersService;
  let inventoryService: InventoryService;

  // Tenant A: Aurelia Atelier
  const tenantContextA: TenantContext = {
    tenantId: SEED_IDS.tenantA,
    storeId: SEED_IDS.storeA,
  };

  // Tenant B: Patil Engineering
  const tenantContextB: TenantContext = {
    tenantId: SEED_IDS.tenantB,
    storeId: SEED_IDS.storeB,
  };

  let testOrderAId: string;
  let testOrderBId: string;
  let testOrderANumber: string;
  let testVariantId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.TEST_DATABASE_URL ||
            process.env.DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5432/simply_ecommerce?schema=public',
        },
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        InventoryService,
        SubscriptionVisibilityService,
        { provide: PrismaClient, useValue: prisma },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    inventoryService = module.get<InventoryService>(InventoryService);

    // Fetch an existing variant for Tenant A
    const variantA = await prisma.productVariant.findFirst({
      where: { product: { storeId: SEED_IDS.storeA } },
    });
    testVariantId = variantA?.id || 'dummy-variant';

    // Create an isolated test customer for Tenant A
    const customerA = await prisma.customer.create({
      data: {
        tenantId: SEED_IDS.tenantA,
        storeId: SEED_IDS.storeA,
        fullName: 'Rahul Test Patil',
        phone: '+919988776655',
        email: 'rahul.test@example.com',
      },
    });

    // Create an isolated test order for Tenant A
    const orderA = await prisma.order.create({
      data: {
        tenantId: SEED_IDS.tenantA,
        storeId: SEED_IDS.storeA,
        customerId: customerA.id,
        orderNumber: `TEST-ORD-A-${Date.now()}`,
        status: OrderStatus.NEW,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        paymentStatus: PaymentStatus.PAID,
        fulfillmentMode: FulfillmentMode.DELIVERY,
        subtotalPaise: 150000,
        shippingPaise: 5000,
        totalPaise: 155000,
        currency: 'INR',
        deliveryAddress: {
          fullName: 'Rahul Test Patil',
          phone: '+919988776655',
          addressLine1: 'Flat 402, High Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        orderAddress: {
          create: {
            fullName: 'Rahul Test Patil',
            phone: '+919988776655',
            addressLine1: 'Flat 402, High Street',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
          },
        },
        items: {
          create: [
            {
              variantId: testVariantId,
              productName: 'Test Linen Shirt',
              variantTitle: 'White / M',
              sku: 'TLS-M',
              selectedOptions: { Color: 'White', Size: 'M' },
              quantity: 2,
              unitPricePaise: 75000,
              totalPaise: 150000,
            },
          ],
        },
      },
    });
    testOrderAId = orderA.id;
    testOrderANumber = orderA.orderNumber;

    // Create an isolated test customer for Tenant B
    const customerB = await prisma.customer.create({
      data: {
        tenantId: SEED_IDS.tenantB,
        storeId: SEED_IDS.storeB,
        fullName: 'B2B Purchaser',
        phone: '+919111222333',
        email: 'b2b@patileng.com',
      },
    });

    // Create an isolated test order for Tenant B
    const orderB = await prisma.order.create({
      data: {
        tenantId: SEED_IDS.tenantB,
        storeId: SEED_IDS.storeB,
        customerId: customerB.id,
        orderNumber: `TEST-ORD-B-${Date.now()}`,
        status: OrderStatus.NEW,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        paymentStatus: PaymentStatus.PENDING,
        subtotalPaise: 250000,
        totalPaise: 250000,
        currency: 'INR',
        deliveryAddress: {
          fullName: 'B2B Purchaser',
          phone: '+919111222333',
          addressLine1: 'Industrial Area',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
        },
      },
    });
    testOrderBId = orderB.id;
  });

  afterAll(async () => {
    // Clean up test orders and customers
    if (testOrderAId) {
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: testOrderAId } });
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderAId } });
      await prisma.orderAddress.deleteMany({ where: { orderId: testOrderAId } });
      await prisma.order.delete({ where: { id: testOrderAId } }).catch(() => {});
    }
    if (testOrderBId) {
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: testOrderBId } });
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderBId } });
      await prisma.order.delete({ where: { id: testOrderBId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('1. Orders List, Search, and Filtering', () => {
    it('should list merchant orders for authenticated tenant A', async () => {
      const result = await ordersService.getOrders(tenantContextA, { page: 1, pageSize: 20 });
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.summaryCounts).toBeDefined();
      expect(result.summaryCounts.all).toBeGreaterThanOrEqual(1);

      const found = result.items.find((o) => o.id === testOrderAId);
      expect(found).toBeDefined();
      expect(found?.orderNumber).toBe(testOrderANumber);
      expect(found?.totalPaise).toBe(155000);
      expect(found?.customer?.fullName || (found as any).customerName).toContain('Rahul');
    });

    it('should search order by exact order number', async () => {
      const result = await ordersService.getOrders(tenantContextA, {
        search: testOrderANumber,
      });
      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.items[0].orderNumber).toBe(testOrderANumber);
    });

    it('should search order by customer name', async () => {
      const result = await ordersService.getOrders(tenantContextA, {
        search: 'Rahul Test',
      });
      const found = result.items.find((o) => o.id === testOrderAId);
      expect(found).toBeDefined();
    });

    it('should search order by customer phone', async () => {
      const result = await ordersService.getOrders(tenantContextA, {
        search: '9988776655',
      });
      const found = result.items.find((o) => o.id === testOrderAId);
      expect(found).toBeDefined();
    });

    it('should filter by order status', async () => {
      const result = await ordersService.getOrders(tenantContextA, {
        status: 'NEW',
      });
      expect(result.items.every((o) => o.status === 'NEW')).toBe(true);
    });

    it('should filter by payment status (PAID and PARTIALLY_REFUNDED)', async () => {
      const resultPaid = await ordersService.getOrders(tenantContextA, {
        paymentStatus: 'PAID',
      });
      expect(resultPaid.items.every((o) => o.paymentStatus === 'PAID')).toBe(true);

      const resultPartial = await ordersService.getOrders(tenantContextA, {
        paymentStatus: 'PARTIALLY_REFUNDED',
      });
      expect(resultPartial.items.every((o) => o.paymentStatus === 'PARTIALLY_REFUNDED')).toBe(true);
    });

    it('should support server-side pagination metadata', async () => {
      const result = await ordersService.getOrders(tenantContextA, {
        page: 1,
        pageSize: 5,
      });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(5);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Tenant Isolation Enforcement', () => {
    it('Tenant A should NOT see Tenant B orders in order list', async () => {
      const result = await ordersService.getOrders(tenantContextA, {});
      const leakedOrder = result.items.find((o) => o.id === testOrderBId);
      expect(leakedOrder).toBeUndefined();
    });

    it('Tenant A should NOT be able to view Tenant B order details', async () => {
      await expect(
        ordersService.getOrderById(testOrderBId, tenantContextA)
      ).rejects.toThrow(NotFoundException);
    });

    it('Tenant A should NOT be able to change status of Tenant B order', async () => {
      await expect(
        ordersService.updateOrderStatus(testOrderBId, OrderStatus.ACCEPTED, tenantContextA)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Status Workflow & Transition Validation', () => {
    it('should retrieve full order details for own order', async () => {
      const order = await ordersService.getOrderById(testOrderAId, tenantContextA);
      expect(order).toBeDefined();
      expect(order.id).toBe(testOrderAId);
      expect(order.items.length).toBe(1);
      expect(order.items[0].unitPricePaise).toBe(75000);
      expect(order.items[0].totalPaise).toBe(150000);
      expect(order.orderAddress).toBeDefined();
      expect(order.orderAddress?.city).toBe('Bengaluru');
    });

    it('should successfully transition from NEW to ACCEPTED', async () => {
      const updated = await ordersService.updateOrderStatus(
        testOrderAId,
        OrderStatus.ACCEPTED,
        tenantContextA
      );
      expect(updated.status).toBe(OrderStatus.ACCEPTED);
      expect(updated.fulfillmentStatus).toBe(FulfillmentStatus.PROCESSING);
    });

    it('should successfully transition from ACCEPTED to READY', async () => {
      const updated = await ordersService.updateOrderStatus(
        testOrderAId,
        OrderStatus.READY,
        tenantContextA
      );
      expect(updated.status).toBe(OrderStatus.READY);
      expect(updated.fulfillmentStatus).toBe(FulfillmentStatus.READY_TO_SHIP);
    });

    it('should reject invalid transition backwards (READY to NEW)', async () => {
      await expect(
        ordersService.updateOrderStatus(testOrderAId, OrderStatus.NEW, tenantContextA)
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully transition from READY to DISPATCHED', async () => {
      const updated = await ordersService.updateOrderStatus(
        testOrderAId,
        OrderStatus.DISPATCHED,
        tenantContextA
      );
      expect(updated.status).toBe(OrderStatus.DISPATCHED);
      expect(updated.fulfillmentStatus).toBe(FulfillmentStatus.SHIPPED);
    });

    it('should reject invalid transition backwards (DISPATCHED to ACCEPTED)', async () => {
      await expect(
        ordersService.updateOrderStatus(testOrderAId, OrderStatus.ACCEPTED, tenantContextA)
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully transition from DISPATCHED to COMPLETED', async () => {
      const updated = await ordersService.updateOrderStatus(
        testOrderAId,
        OrderStatus.COMPLETED,
        tenantContextA
      );
      expect(updated.status).toBe(OrderStatus.COMPLETED);
      expect(updated.fulfillmentStatus).toBe(FulfillmentStatus.DELIVERED);
    });

    it('COMPLETED order cannot be transitioned by merchant to NEW, READY, CANCELLED, or RETURN_REQUESTED', async () => {
      await expect(
        ordersService.updateOrderStatus(testOrderAId, OrderStatus.NEW, tenantContextA)
      ).rejects.toThrow(BadRequestException);

      await expect(
        ordersService.updateOrderStatus(testOrderAId, OrderStatus.READY, tenantContextA)
      ).rejects.toThrow(BadRequestException);

      // Merchant cannot initiate return requests directly; returns must originate from buyer/support
      await expect(
        ordersService.updateOrderStatus(testOrderAId, OrderStatus.RETURN_REQUESTED, tenantContextA)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Cancellation Workflow & Audit History', () => {
    let cancelableOrderId: string;

    beforeAll(async () => {
      const customer = await prisma.customer.create({
        data: {
          tenantId: SEED_IDS.tenantA,
          storeId: SEED_IDS.storeA,
          fullName: 'Cancellation Test Buyer',
          phone: '+919888877777',
        },
      });

      const order = await prisma.order.create({
        data: {
          tenantId: SEED_IDS.tenantA,
          storeId: SEED_IDS.storeA,
          customerId: customer.id,
          orderNumber: `TEST-ORD-CANCEL-${Date.now()}`,
          status: OrderStatus.NEW,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          paymentStatus: PaymentStatus.PENDING,
          subtotalPaise: 99000,
          totalPaise: 99000,
          currency: 'INR',
          deliveryAddress: {},
          items: {
            create: [
              {
                variantId: testVariantId,
                productName: 'Cancellable Item',
                variantTitle: 'Default',
                sku: 'CANCEL-SKU',
                selectedOptions: {},
                quantity: 1,
                unitPricePaise: 99000,
                totalPaise: 99000,
              },
            ],
          },
        },
      });
      cancelableOrderId = order.id;
    });

    afterAll(async () => {
      if (cancelableOrderId) {
        await prisma.orderStatusHistory.deleteMany({ where: { orderId: cancelableOrderId } });
        await prisma.orderItem.deleteMany({ where: { orderId: cancelableOrderId } });
        await prisma.order.delete({ where: { id: cancelableOrderId } }).catch(() => {});
      }
    });

    it('should cancel order with reason and record status history', async () => {
      const cancelled = await ordersService.updateOrderStatus(
        cancelableOrderId,
        OrderStatus.CANCELLED,
        tenantContextA,
        'Customer requested'
      );
      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
      expect(cancelled.fulfillmentStatus).toBe(FulfillmentStatus.CANCELLED);

      // Verify audit history was recorded
      const history = await prisma.orderStatusHistory.findMany({
        where: { orderId: cancelableOrderId },
      });
      expect(history.length).toBeGreaterThanOrEqual(1);
      const latest = history[history.length - 1];
      expect(latest.toStatus).toBe(OrderStatus.CANCELLED);
      expect(latest.reason).toBe('Customer requested');
    });

    it('terminal state: CANCELLED order cannot be re-activated to NEW or READY', async () => {
      await expect(
        ordersService.updateOrderStatus(cancelableOrderId, OrderStatus.NEW, tenantContextA)
      ).rejects.toThrow(BadRequestException);

      await expect(
        ordersService.updateOrderStatus(cancelableOrderId, OrderStatus.READY, tenantContextA)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Inventory Exactly-Once Guarantees & Status Idempotency', () => {
    let invTestOrderId: string;
    let invVariantId: string;
    const initialStockOnHand = 50;
    const initialStockReserved = 10;
    const orderQuantity = 2;

    beforeAll(async () => {
      // Find or create a test variant with known stock levels
      const variant = await prisma.productVariant.findFirst({
        where: { product: { storeId: SEED_IDS.storeA } },
      });
      invVariantId = variant!.id;

      await prisma.inventory.update({
        where: { variantId: invVariantId },
        data: { stockOnHand: initialStockOnHand, stockReserved: initialStockReserved },
      });

      const customer = await prisma.customer.create({
        data: {
          tenantId: SEED_IDS.tenantA,
          storeId: SEED_IDS.storeA,
          fullName: 'Inventory Exactly-Once Tester',
          phone: '+919777766666',
        },
      });

      const order = await prisma.order.create({
        data: {
          tenantId: SEED_IDS.tenantA,
          storeId: SEED_IDS.storeA,
          customerId: customer.id,
          orderNumber: `TEST-ORD-INV-${Date.now()}`,
          status: OrderStatus.READY,
          fulfillmentStatus: FulfillmentStatus.READY_TO_SHIP,
          paymentStatus: PaymentStatus.PAID,
          subtotalPaise: 100000,
          totalPaise: 100000,
          currency: 'INR',
          deliveryAddress: {},
          items: {
            create: [
              {
                variantId: invVariantId,
                productName: 'Inventory Test Item',
                variantTitle: 'Default',
                sku: 'INV-TEST-SKU',
                selectedOptions: {},
                quantity: orderQuantity,
                unitPricePaise: 50000,
                totalPaise: 100000,
              },
            ],
          },
        },
      });
      invTestOrderId = order.id;
    });

    afterAll(async () => {
      if (invTestOrderId) {
        await prisma.orderStatusHistory.deleteMany({ where: { orderId: invTestOrderId } });
        await prisma.orderItem.deleteMany({ where: { orderId: invTestOrderId } });
        await prisma.order.delete({ where: { id: invTestOrderId } }).catch(() => {});
      }
    });

    it('repeated cancellation request is idempotent and does NOT release stock twice', async () => {
      // Step 1: First cancellation call
      const firstCancel = await ordersService.updateOrderStatus(
        invTestOrderId,
        OrderStatus.CANCELLED,
        tenantContextA,
        'Merchant cancelled'
      );
      expect(firstCancel.status).toBe(OrderStatus.CANCELLED);

      // Verify stock was released once: stock_on_hand + 2, stock_reserved - 2
      const invAfterFirst = await prisma.inventory.findUnique({
        where: { variantId: invVariantId },
      });
      expect(invAfterFirst!.stockOnHand).toBe(initialStockOnHand + orderQuantity);
      expect(invAfterFirst!.stockReserved).toBe(initialStockReserved - orderQuantity);

      // Step 2: Repeated cancellation call on the already cancelled order
      const secondCancel = await ordersService.updateOrderStatus(
        invTestOrderId,
        OrderStatus.CANCELLED,
        tenantContextA,
        'Repeated cancellation attempt'
      );
      expect(secondCancel.status).toBe(OrderStatus.CANCELLED);

      // Verify stock was NOT released a second time!
      const invAfterSecond = await prisma.inventory.findUnique({
        where: { variantId: invVariantId },
      });
      expect(invAfterSecond!.stockOnHand).toBe(initialStockOnHand + orderQuantity);
      expect(invAfterSecond!.stockReserved).toBe(initialStockReserved - orderQuantity);
    });

    it('invalid status transition does NOT mutate inventory', async () => {
      const invBefore = await prisma.inventory.findUnique({
        where: { variantId: invVariantId },
      });

      // Attempt invalid transition: CANCELLED -> READY
      await expect(
        ordersService.updateOrderStatus(invTestOrderId, OrderStatus.READY, tenantContextA)
      ).rejects.toThrow(BadRequestException);

      const invAfter = await prisma.inventory.findUnique({
        where: { variantId: invVariantId },
      });
      expect(invAfter!.stockOnHand).toBe(invBefore!.stockOnHand);
      expect(invAfter!.stockReserved).toBe(invBefore!.stockReserved);
    });

    it('repeated completion request is idempotent and does NOT fulfill stock twice', async () => {
      // Create a fresh order in READY state to test completion idempotency
      const order = await prisma.order.create({
        data: {
          tenantId: SEED_IDS.tenantA,
          storeId: SEED_IDS.storeA,
          customerId: (await prisma.customer.findFirst({ where: { storeId: SEED_IDS.storeA } }))!.id,
          orderNumber: `TEST-ORD-COMPL-${Date.now()}`,
          status: OrderStatus.READY,
          fulfillmentStatus: FulfillmentStatus.READY_TO_SHIP,
          paymentStatus: PaymentStatus.PAID,
          subtotalPaise: 50000,
          totalPaise: 50000,
          currency: 'INR',
          deliveryAddress: {},
          items: {
            create: [
              {
                variantId: invVariantId,
                productName: 'Completion Item',
                variantTitle: 'Default',
                sku: 'COMPL-SKU',
                selectedOptions: {},
                quantity: 1,
                unitPricePaise: 50000,
                totalPaise: 50000,
              },
            ],
          },
        },
      });

      const invBefore = await prisma.inventory.findUnique({
        where: { variantId: invVariantId },
      });

      // 1. First completion call
      const firstComplete = await ordersService.updateOrderStatus(
        order.id,
        OrderStatus.COMPLETED,
        tenantContextA,
        'Delivered'
      );
      expect(firstComplete.status).toBe(OrderStatus.COMPLETED);

      const invAfterFirst = await prisma.inventory.findUnique({
        where: { variantId: invVariantId },
      });
      expect(invAfterFirst!.stockReserved).toBe(Math.max(0, invBefore!.stockReserved - 1));

      // 2. Repeated completion call
      const secondComplete = await ordersService.updateOrderStatus(
        order.id,
        OrderStatus.COMPLETED,
        tenantContextA,
        'Retried delivery confirmation'
      );
      expect(secondComplete.status).toBe(OrderStatus.COMPLETED);

      const invAfterSecond = await prisma.inventory.findUnique({
        where: { variantId: invVariantId },
      });
      expect(invAfterSecond!.stockReserved).toBe(invAfterFirst!.stockReserved);
      expect(invAfterSecond!.stockOnHand).toBe(invAfterFirst!.stockOnHand);

      // Cleanup
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
    });
  });
});

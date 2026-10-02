import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PrismaClient,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
} from '@prisma/client';
import { GuestCheckoutDto } from './dto/checkout.dto';
import { SubscriptionVisibilityService } from '../subscriptions/subscription-visibility.service';
import { InventoryService } from '../inventory/inventory.service';
import { TenantContext, BuyerSafeTrackOrderDto } from '@simply/types';
import { normalizePhone } from '@simply/validation';
import { InvalidTrackingTokenException } from '../../common/exceptions/domain.exceptions';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly visibilityService: SubscriptionVisibilityService,
    private readonly inventoryService: InventoryService
  ) {}

  /**
   * Guest-first checkout transaction:
   * 1. Enforces subscription gating on the store
   * 2. Reserves stock atomically
   * 3. Creates customer & snapshots product/variant data into OrderItem
   */
  public async createGuestOrder(dto: GuestCheckoutDto) {
    // 1. Enforce Server-Side Subscription Check: Store MUST be LIVE with active paid subscription
    const { store } = await this.visibilityService.evaluateVisibility(dto.storeId);

    // 2. Load Cart
    const cart = await this.prisma.cart.findUnique({
      where: { id: dto.cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                optionValues: { include: { optionValue: true } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Shopping cart is empty or not found.');
    }

    if (cart.storeId !== store.id) {
      throw new BadRequestException('Cart does not belong to this store.');
    }

    const cleanPhone = normalizePhone(dto.phone);

    // 3. Execute Transaction
    return this.prisma.$transaction(async (tx) => {
      // Step A: Concurrency-safe inventory reservation for every item
      for (const item of cart.items) {
        await this.inventoryService.reserveStock(
          item.variantId,
          item.quantity,
          `checkout_${cart.id}`,
          tx
        );
      }

      // Step B: Upsert Customer (Guest-First)
      let customer = await tx.customer.findFirst({
        where: {
          tenantId: store.tenantId,
          storeId: store.id,
          phone: cleanPhone,
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            tenantId: store.tenantId,
            storeId: store.id,
            fullName: dto.fullName,
            phone: cleanPhone,
            email: dto.email || null,
            isGuest: true,
          },
        });
      }

      // Step C: Record Customer Delivery Address
      await tx.customerAddress.create({
        data: {
          customerId: customer.id,
          addressLine1: dto.deliveryAddress.addressLine1,
          addressLine2: dto.deliveryAddress.addressLine2,
          landmark: dto.deliveryAddress.landmark,
          city: dto.deliveryAddress.city,
          state: dto.deliveryAddress.state,
          pincode: dto.deliveryAddress.pincode,
          country: dto.deliveryAddress.country || 'India',
          isDefault: true,
        },
      });

      // Step D: Calculate Monetary Amounts (paise)
      let subtotalPaise = 0;
      for (const item of cart.items) {
        subtotalPaise += item.quantity * item.unitPricePaise;
      }

      // Shipping calculation based on default profile
      const shippingProfile = await tx.shippingProfile.findFirst({
        where: { storeId: store.id, isDefault: true },
      });

      let shippingPaise = 0;
      if (shippingProfile) {
        if (
          shippingProfile.freeShippingThresholdPaise &&
          subtotalPaise >= shippingProfile.freeShippingThresholdPaise
        ) {
          shippingPaise = 0;
        } else {
          shippingPaise = shippingProfile.flatRatePaise;
        }
      }

      const taxPaise = Math.round(subtotalPaise * 0.05); // 5% GST estimate in paise
      const totalPaise = subtotalPaise + shippingPaise + taxPaise;

      // Generate Order Number: ORD-YYYYMMDD-XXXX
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const orderNumber = `ORD-${datePrefix}-${randomSuffix}`;
      const trackingToken = crypto.randomBytes(16).toString('hex');

      // Step E: Create Order
      const order = await tx.order.create({
        data: {
          tenantId: store.tenantId,
          storeId: store.id,
          customerId: customer.id,
          orderNumber,
          trackingToken,
          status: OrderStatus.NEW,
          paymentStatus: PaymentStatus.PENDING,
          shipmentStatus: ShipmentStatus.PENDING,
          subtotalPaise,
          taxPaise,
          shippingPaise,
          discountPaise: 0,
          totalPaise,
          currency: 'INR',
          notes: dto.notes,
          deliveryAddress: dto.deliveryAddress as any,
          guestCheckout: true,
        },
      });

      // Step F: Create OrderItem records with complete historical snapshots
      for (const item of cart.items) {
        const optionSnapshot: Record<string, string> = {};
        for (const optVal of item.variant.optionValues) {
          optionSnapshot['Option'] = optVal.optionValue.value;
        }

        const variantTitle =
          Object.values(optionSnapshot).join(' / ') || item.variant.sku;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantTitle,
            sku: item.variant.sku,
            selectedOptions: optionSnapshot,
            quantity: item.quantity,
            unitPricePaise: item.unitPricePaise,
            taxPaise: Math.round(item.unitPricePaise * 0.05),
            totalPaise: item.quantity * item.unitPricePaise,
          },
        });
      }

      // Step G: Create OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: OrderStatus.NEW,
          reason: 'Guest checkout order created.',
        },
      });

      // Step H: Clear cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }

  public async getOrderById(orderId: string, tenant?: TenantContext) {
    const where: any = { id: orderId };
    if (tenant) {
      where.tenantId = tenant.tenantId;
      where.storeId = tenant.storeId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        customer: true,
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        paymentOrders: { include: { transactions: true } },
        shipments: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  public async getOrderByOrderNumberOrId(identifier: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: identifier }, { id: identifier }],
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        shipments: true,
        store: { select: { id: true, name: true, slug: true, branding: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found with the provided details.');
    return order;
  }

  /**
   * Secure buyer order tracking with mandatory tracking token validation.
   * Returns a privacy-safe masked DTO preventing PII leaks to unauthenticated visitors.
   */
  public async trackOrder(identifier: string, token?: string): Promise<BuyerSafeTrackOrderDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: identifier }, { id: identifier }],
      },
      include: {
        items: true,
        shipments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found with the provided details.');

    // Enforce token verification if trackingToken exists on the order
    if (order.trackingToken) {
      if (!token || token !== order.trackingToken) {
        throw new InvalidTrackingTokenException(
          'Access denied: A valid tracking token is required to view order status.'
        );
      }
    }

    const deliveryAddress = (order.deliveryAddress as any) || {};
    const rawPincode = String(deliveryAddress.pincode || '');
    const maskedPincode =
      rawPincode.length >= 6
        ? `${rawPincode.slice(0, 2)}**${rawPincode.slice(4)}`
        : '******';

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shipmentStatus: order.shipmentStatus,
      createdAt: order.createdAt,
      deliveryCity: deliveryAddress.city || 'Confidential',
      deliveryState: deliveryAddress.state || 'Confidential',
      deliveryPincode: maskedPincode,
      itemCount: order.items.reduce((acc, it) => acc + it.quantity, 0),
      totalPaise: order.totalPaise,
      currency: order.currency,
      items: order.items.map((it) => ({
        productName: it.productName,
        variantTitle: it.variantTitle,
        quantity: it.quantity,
      })),
      trackingNumber: order.shipments[0]?.awbNumber || null,
      carrier: order.shipments[0]?.courierName || null,
      estimatedDelivery: null,
    };
  }

  public async getOrders(
    tenant: TenantContext,
    params: { page?: number; limit?: number; status?: OrderStatus } = {}
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: tenant.tenantId,
      storeId: tenant.storeId,
    };
    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit, hasMore: skip + items.length < total };
  }

  public async updateOrderStatus(
    orderId: string,
    toStatus: OrderStatus,
    tenant: TenantContext,
    reason?: string,
    actorId?: string
  ) {
    const order = await this.getOrderById(orderId, tenant);

    return this.prisma.$transaction(async (tx) => {
      // If cancelling: release stock reservations
      if (toStatus === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (item.variantId) {
            await this.inventoryService.releaseStockReservation(
              item.variantId,
              item.quantity,
              order.id,
              tx
            );
          }
        }
      }

      // If completing/dispatching: finalize stock deduction
      if (toStatus === OrderStatus.COMPLETED && order.status !== OrderStatus.COMPLETED) {
        for (const item of order.items) {
          if (item.variantId) {
            await this.inventoryService.fulfillStock(
              item.variantId,
              item.quantity,
              order.id,
              tx
            );
          }
        }
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: toStatus,
          cancelledAt: toStatus === OrderStatus.CANCELLED ? new Date() : undefined,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus,
          reason,
          actorId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          action: 'ORDER_STATUS_CHANGED',
          entityType: 'Order',
          entityId: order.id,
          metadata: { fromStatus: order.status, toStatus, reason },
        },
      });

      return updated;
    });
  }
}

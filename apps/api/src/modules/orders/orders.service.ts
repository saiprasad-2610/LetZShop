import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  PrismaClient,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  FulfillmentStatus,
  ShippingProviderType,
} from '@prisma/client';
import { GuestCheckoutDto } from './dto/checkout.dto';
import { SubscriptionVisibilityService } from '../subscriptions/subscription-visibility.service';
import { InventoryService } from '../inventory/inventory.service';
import { ShippingService } from '../shipping/shipping.service';
import { TenantContext, BuyerSafeTrackOrderDto } from '@simply/types';
import { normalizePhone } from '@simply/validation';
import { InvalidTrackingTokenException } from '../../common/exceptions/domain.exceptions';
import * as crypto from 'crypto';
import { MailService } from '../notifications/mail.service';
import { WhatsAppService } from '../notifications/whatsapp.service';

/**
 * Full Domain Order Lifecycle:
 * Defines system/buyer/admin/logistics transition capabilities.
 * NOTE: COMPLETED -> RETURN_REQUESTED is preserved for future Buyer/Support returns workflow.
 * Terminal states in the domain are CANCELLED and RETURNED. COMPLETED is not terminal.
 */
export const DOMAIN_ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.CONFIRMED, OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.ACCEPTED, OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DISPATCHED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCHED]: [OrderStatus.COMPLETED, OrderStatus.RETURN_REQUESTED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [OrderStatus.RETURN_REQUESTED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.COMPLETED],
  [OrderStatus.RETURNED]: [],
};

/**
 * Merchant-Allowed Status Transitions:
 * Defines actions permitted directly by the seller via merchant order management.
 * In V1:
 * - Merchants CANNOT initiate returns on COMPLETED orders (returns originate from buyer/support).
 * - Merchants CANNOT transition from terminal CANCELLED or RETURNED states.
 * - When in RETURN_REQUESTED, merchants can confirm receipt of returned items (-> RETURNED).
 */
export const SELLER_ALLOWED_ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.CONFIRMED, OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.ACCEPTED, OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DISPATCHED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCHED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [], // No direct seller-initiated transition; returns must originate from buyer/support
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED],
  [OrderStatus.RETURNED]: [],
};

// Maintained for backward compatibility
export const ALLOWED_ORDER_STATUS_TRANSITIONS = DOMAIN_ORDER_STATUS_TRANSITIONS;

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  orderStatus?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly visibilityService: SubscriptionVisibilityService,
    private readonly inventoryService: InventoryService,
    private readonly shippingService: ShippingService,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsAppService
  ) {}

  /**
   * Guest-first checkout transaction:
   * 1. Enforces subscription gating on the store
   * 2. Reserves stock atomically
   * 3. Creates customer & snapshots product/variant data into OrderItem
   */
  public async createGuestOrder(dto: GuestCheckoutDto) {
    // Defense-in-depth: Reject preview simulation orders from creating persistent commerce records
    if (
      (dto as any).preview === true ||
      (dto as any).isPreview === true ||
      dto.cartId?.startsWith('preview_') ||
      dto.cartId === 'preview-cart'
    ) {
      throw new BadRequestException('Orders cannot be created in merchant preview mode.');
    }

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

    // Verify payment method eligibility
    if (dto.paymentMethod === 'COD') {
      const paymentAccount = await this.prisma.merchantPaymentAccount.findFirst({
        where: { storeId: store.id },
      });
      const paymentCaps = (paymentAccount?.capabilities as any) || {};
      if (paymentCaps.codEnabled === false) {
        throw new BadRequestException(
          'Cash on Delivery (COD) is currently disabled by this seller. Please pay online with UPI or Card.'
        );
      }
    }

    const cleanPhone = normalizePhone(dto.phone);

    // 3. Execute Transaction
    const resultOrder = await this.prisma.$transaction(async (tx) => {
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
      } else if (dto.fullName && (!customer.fullName || customer.fullName === 'Guest Customer' || customer.fullName !== dto.fullName)) {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            fullName: dto.fullName,
            ...(dto.email ? { email: dto.email } : {}),
          },
        });
      }

      // Step C: Record Customer Delivery Address
      if (dto.deliveryAddress) {
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
      }

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

      let discountPaise = typeof dto.discountPaise === 'number' && dto.discountPaise > 0 
        ? Math.min(dto.discountPaise, subtotalPaise) 
        : 0;

      const taxableAmount = Math.max(0, subtotalPaise - discountPaise);
      const taxPaise = Math.round(taxableAmount * 0.05); // 5% GST estimate in paise
      const totalPaise = Math.max(0, taxableAmount + shippingPaise + taxPaise);

      // Generate Order Number: ORD-YYYYMMDD-XXXX
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const orderNumber = `ORD-${datePrefix}-${randomSuffix}`;
      const trackingToken = crypto.randomBytes(16).toString('hex');

      const fullNotes = [
        dto.notes?.trim(),
        dto.couponCode ? `Coupon applied: ${dto.couponCode}` : null,
      ].filter(Boolean).join(' | ') || null;

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
          fulfillmentMode: dto.fulfillmentMode === 'PICKUP' ? ('PICKUP' as any) : ('DELIVERY' as any),
          subtotalPaise,
          taxPaise,
          shippingPaise,
          discountPaise,
          totalPaise,
          currency: 'INR',
          notes: fullNotes,
          deliveryAddress: dto.deliveryAddress as any,
          guestCheckout: true,
        },
      });

      // Step E2: Create OrderAddress record snapshot
      if (dto.deliveryAddress) {
        await tx.orderAddress.create({
          data: {
            orderId: order.id,
            fullName: dto.fullName,
            phone: cleanPhone,
            addressLine1: dto.deliveryAddress.addressLine1 || '',
            addressLine2: dto.deliveryAddress.addressLine2 || null,
            landmark: dto.deliveryAddress.landmark || null,
            city: dto.deliveryAddress.city || '',
            state: dto.deliveryAddress.state || '',
            pincode: dto.deliveryAddress.pincode || '',
            country: dto.deliveryAddress.country || 'India',
          },
        });
      }

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

    // Auto-create order in Shiprocket when placed
    try {
      const shippingAccount = await this.prisma.merchantShippingAccount.findFirst({
        where: { storeId: store.id, isEnabled: true, provider: ShippingProviderType.SHIPROCKET },
      });

      if (shippingAccount) {
        this.shippingService
          .createShipmentForOrder(resultOrder.id, {
            tenantId: store.tenantId,
            storeId: store.id,
          })
          .catch((err) => {
            this.logger.warn(
              `[SHIPROCKET AUTO-ORDER] Order #${resultOrder.orderNumber} background manifest notice: ${err.message}`
            );
          });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to check auto-shipping for order #${resultOrder.orderNumber}: ${err.message}`);
    }

    // Trigger asynchronous notifications (Order Placed Email to Buyer + Alert to Vendor)
    try {
      const fullOrder = await this.prisma.order.findUnique({
        where: { id: resultOrder.id },
        include: { items: true, customer: true, orderAddress: true, store: true },
      });

      if (fullOrder) {
        const customerEmail = fullOrder.customer?.email || (fullOrder.deliveryAddress as any)?.email;
        const customerPhone = fullOrder.customer?.phone || (fullOrder.deliveryAddress as any)?.phone;
        const customerName = fullOrder.customer?.fullName || (fullOrder.deliveryAddress as any)?.fullName || 'Customer';
        const trackingUrl = fullOrder.trackingToken
          ? `${process.env.STOREFRONT_BASE_URL || process.env.STOREFRONT_URL || 'https://letzshop.com'}/track/${fullOrder.orderNumber}?t=${fullOrder.trackingToken}`
          : undefined;

        const emailContext = {
          order: fullOrder,
          store: {
            id: store.id,
            name: store.name,
            supportEmail: store.supportEmail || undefined,
            supportPhone: store.supportPhone || undefined,
          },
          customer: {
            fullName: customerName,
            email: customerEmail || '',
            phone: customerPhone,
          },
          trackingUrl,
        };

        if (customerEmail) {
          this.mailService.sendOrderPlacedEmail(emailContext).catch((err) => {
            this.logger.warn(`Failed to send order placed email: ${err.message}`);
          });
        }

        const vendorAlertEmail = store.supportEmail || process.env.ORDERS_ALERT_EMAIL;
        if (vendorAlertEmail) {
          this.mailService.sendVendorNewOrderAlert(emailContext, vendorAlertEmail).catch((err) => {
            this.logger.warn(`Failed to send vendor order alert: ${err.message}`);
          });
        }
      }
    } catch (notifErr: any) {
      this.logger.warn(`Notification trigger error on checkout: ${notifErr.message}`);
    }

    return resultOrder;
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
        orderAddress: true,
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    media: {
                      take: 1,
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        paymentOrders: { include: { transactions: true } },
        shipments: { include: { events: { orderBy: { createdAt: 'desc' } } } },
        refunds: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found.');

    const deliveryAddress = (order.deliveryAddress as any) || {};
    const customerName =
      order.customer?.fullName ||
      order.orderAddress?.fullName ||
      deliveryAddress.fullName ||
      (order.customer?.email ? order.customer.email.split('@')[0] : null) ||
      'Guest Customer';

    const customerPhone =
      order.customer?.phone ||
      order.orderAddress?.phone ||
      deliveryAddress.phone ||
      null;

    const customerEmail =
      order.customer?.email ||
      deliveryAddress.email ||
      null;

    return {
      ...order,
      customerName,
      customerPhone,
      customerEmail,
    };
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
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            supportPhone: true,
            supportEmail: true,
          },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found with the provided details.');
    const fullOrder = order as any;

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
      itemCount: fullOrder.items.reduce((acc: number, it: any) => acc + it.quantity, 0),
      subtotalPaise: order.subtotalPaise,
      discountPaise: order.discountPaise,
      shippingPaise: order.shippingPaise,
      totalPaise: order.totalPaise,
      currency: order.currency,
      store: fullOrder.store,
      history: fullOrder.statusHistory?.map((h: any) => ({
        status: h.toStatus,
        reason: h.reason,
        timestamp: h.createdAt,
      })) || [],
      items: fullOrder.items.map((it: any) => ({
        productName: it.productName,
        variantTitle: it.variantTitle,
        quantity: it.quantity,
      })),
      trackingNumber: fullOrder.shipments?.[0]?.awbNumber || null,
      carrier: fullOrder.shipments?.[0]?.courierName || null,
      estimatedDelivery: null,
    };
  }

  public async getOrders(tenant: TenantContext, params: GetOrdersParams = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.pageSize || params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: tenant.tenantId,
      storeId: tenant.storeId,
    };

    // 1. Search filter: order number, customer name, customer phone
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customer: { fullName: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q } } },
        { orderAddress: { fullName: { contains: q, mode: 'insensitive' } } },
        { orderAddress: { phone: { contains: q } } },
      ];
    }

    // 2. Order status filter
    const statusVal = params.status || params.orderStatus;
    if (statusVal && statusVal !== 'ALL') {
      if (statusVal === 'NEEDS_ACTION') {
        where.status = {
          in: [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.ACCEPTED],
        };
      } else if (Object.values(OrderStatus).includes(statusVal as OrderStatus)) {
        where.status = statusVal as OrderStatus;
      }
    }

    // 3. Payment status filter
    if (
      params.paymentStatus &&
      params.paymentStatus !== 'ALL' &&
      Object.values(PaymentStatus).includes(params.paymentStatus as PaymentStatus)
    ) {
      where.paymentStatus = params.paymentStatus as PaymentStatus;
    }

    // 4. Date range filter
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate);
      }
    }

    // 5. Parallel queries for list items, total, and compact summary counts
    const [items, total, allCount, needsActionCount, readyCount, dispatchedCount, completedCount, cancelledCount] =
      await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      include: {
                        media: {
                          take: 1,
                          orderBy: { sortOrder: 'asc' },
                        },
                      },
                    },
                  },
                },
              },
            },
            orderAddress: true,
            shipments: {
              take: 1,
              select: {
                awbNumber: true,
                courierName: true,
                status: true,
              },
            },
            paymentOrders: {
              take: 1,
              select: {
                provider: true,
                status: true,
                transactions: {
                  take: 1,
                  select: {
                    paymentMethod: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.order.count({ where }),
        this.prisma.order.count({
          where: { tenantId: tenant.tenantId, storeId: tenant.storeId },
        }),
        this.prisma.order.count({
          where: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            status: { in: [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.ACCEPTED] },
          },
        }),
        this.prisma.order.count({
          where: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            status: OrderStatus.READY,
          },
        }),
        this.prisma.order.count({
          where: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            status: OrderStatus.DISPATCHED,
          },
        }),
        this.prisma.order.count({
          where: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            status: OrderStatus.COMPLETED,
          },
        }),
        this.prisma.order.count({
          where: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            status: OrderStatus.CANCELLED,
          },
        }),
      ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const mappedItems = items.map((o) => {
      const deliveryAddress = (o.deliveryAddress as any) || {};
      const customerName =
        o.customer?.fullName ||
        o.orderAddress?.fullName ||
        deliveryAddress.fullName ||
        (o.customer?.email ? o.customer.email.split('@')[0] : null) ||
        'Guest Customer';

      const customerPhone =
        o.customer?.phone ||
        o.orderAddress?.phone ||
        deliveryAddress.phone ||
        null;

      const customerEmail =
        o.customer?.email ||
        deliveryAddress.email ||
        null;

      const itemsCount =
        o.items?.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) ||
        o.items?.length ||
        0;

      const firstItem = o.items?.[0];
      const itemsSummary = firstItem
        ? `${firstItem.productName || 'Item'}${o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}`
        : 'Order items';

      return {
        ...o,
        customerName,
        customerPhone,
        customerEmail,
        itemsCount,
        itemsSummary,
      };
    });

    return {
      items: mappedItems,
      total,
      page,
      limit,
      pageSize: limit,
      totalPages,
      hasMore: skip + items.length < total,
      summaryCounts: {
        all: allCount,
        needsAction: needsActionCount,
        ready: readyCount,
        dispatched: dispatchedCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
    };
  }

  public async updateOrderStatus(
    orderId: string,
    toStatus: OrderStatus,
    tenant: TenantContext,
    reason?: string,
    actorId?: string,
    isSellerContext: boolean = true,
    customMessage?: string,
    riderName?: string,
    riderPhone?: string
  ) {
    const order = await this.getOrderById(orderId, tenant);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Concurrency Safety: Acquire pessimistic row-level exclusive lock on the order
      await tx.$executeRaw`SELECT 1 FROM "orders" WHERE "id" = ${order.id} FOR UPDATE;`;

      // 2. Re-read the latest persisted order state within the locked transaction
      const lockedOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (!lockedOrder) {
        throw new NotFoundException('Order not found.');
      }

      // Idempotency: If the order has already achieved target status, return it safely without duplicate side-effects
      if (lockedOrder.status === toStatus) {
        return lockedOrder;
      }

      // 3. Validate Allowed Status Transitions based on actor context
      const allowedTransitions = isSellerContext
        ? SELLER_ALLOWED_ORDER_STATUS_TRANSITIONS[lockedOrder.status] || []
        : DOMAIN_ORDER_STATUS_TRANSITIONS[lockedOrder.status] || [];

      if (!allowedTransitions.includes(toStatus)) {
        if (lockedOrder.status === OrderStatus.COMPLETED) {
          throw new BadRequestException(
            `Cannot transition order from status COMPLETED to ${toStatus}. COMPLETED orders cannot be transitioned by merchants. Return requests must originate from buyer or customer support workflows.`
          );
        }
        if (lockedOrder.status === OrderStatus.CANCELLED) {
          throw new BadRequestException(
            `Cannot transition order from status CANCELLED to ${toStatus}. Order is CANCELLED (Terminal state).`
          );
        }
        if (lockedOrder.status === OrderStatus.RETURNED) {
          throw new BadRequestException(
            `Cannot transition order from status RETURNED to ${toStatus}. Order is RETURNED (Terminal state).`
          );
        }
        throw new BadRequestException(
          `Cannot transition order from status ${lockedOrder.status} to ${toStatus}. Allowed transitions: ${
            allowedTransitions.join(', ') || 'None'
          }`
        );
      }

      // 4. Exactly-Once Inventory Mutation
      // Step A: If cancelling: release reserved stock atomically back to inventory
      if (toStatus === OrderStatus.CANCELLED && lockedOrder.status !== OrderStatus.CANCELLED) {
        for (const item of lockedOrder.items) {
          if (item.variantId) {
            await this.inventoryService.releaseStockReservation(
              item.variantId,
              item.quantity,
              lockedOrder.id,
              tx
            );
          }
        }
      }

      // Step B: If completing: finalize stock deduction (fulfill reserved stock)
      if (toStatus === OrderStatus.COMPLETED && lockedOrder.status !== OrderStatus.COMPLETED) {
        for (const item of lockedOrder.items) {
          if (item.variantId) {
            await this.inventoryService.fulfillStock(
              item.variantId,
              item.quantity,
              lockedOrder.id,
              tx
            );
          }
        }
      }

      // Step C: Determine aligned fulfillment and shipment statuses
      const updateData: any = {
        status: toStatus,
        cancelledAt: toStatus === OrderStatus.CANCELLED ? new Date() : undefined,
      };

      if (toStatus === OrderStatus.CONFIRMED || toStatus === OrderStatus.ACCEPTED) {
        updateData.fulfillmentStatus = FulfillmentStatus.PROCESSING;
      } else if (toStatus === OrderStatus.READY) {
        updateData.fulfillmentStatus = FulfillmentStatus.READY_TO_SHIP;
      } else if (toStatus === OrderStatus.DISPATCHED) {
        updateData.fulfillmentStatus = FulfillmentStatus.SHIPPED;
        updateData.shipmentStatus = ShipmentStatus.IN_TRANSIT;
      } else if (toStatus === OrderStatus.COMPLETED) {
        updateData.fulfillmentStatus = FulfillmentStatus.DELIVERED;
        updateData.shipmentStatus = ShipmentStatus.DELIVERED;
      } else if (toStatus === OrderStatus.CANCELLED) {
        updateData.fulfillmentStatus = FulfillmentStatus.CANCELLED;
        updateData.shipmentStatus = ShipmentStatus.CANCELLED;
      } else if (toStatus === OrderStatus.RETURN_REQUESTED) {
        updateData.fulfillmentStatus = FulfillmentStatus.RETURN_REQUESTED;
      } else if (toStatus === OrderStatus.RETURNED) {
        updateData.fulfillmentStatus = FulfillmentStatus.RETURNED;
        updateData.shipmentStatus = ShipmentStatus.RTO;
      }

      const updated = await tx.order.update({
        where: { id: lockedOrder.id },
        data: updateData,
      });

      // Step D: If DISPATCHED and rider info is supplied, record shipment details atomically
      if (toStatus === OrderStatus.DISPATCHED && (riderName || riderPhone)) {
        const courierName = riderName ? `Store Team: ${riderName.trim()}` : 'Store Team Self-Delivery';
        const awbNumber = riderPhone
          ? `SELF_${lockedOrder.orderNumber}_${riderPhone.replace(/[^0-9]/g, '').slice(-4)}`
          : `SELF_${lockedOrder.orderNumber}`;

        const existingShipment = await tx.shipment.findFirst({ where: { orderId: lockedOrder.id } });
        let sId = existingShipment?.id;

        if (existingShipment) {
          await tx.shipment.update({
            where: { id: existingShipment.id },
            data: {
              provider: 'SELF_DELIVERY',
              status: ShipmentStatus.IN_TRANSIT,
              fulfillmentStatus: FulfillmentStatus.SHIPPED,
              courierName,
              awbNumber: existingShipment.awbNumber || awbNumber,
            },
          });
        } else {
          const newShipment = await tx.shipment.create({
            data: {
              tenantId: tenant.tenantId,
              storeId: tenant.storeId,
              orderId: lockedOrder.id,
              provider: 'SELF_DELIVERY',
              status: ShipmentStatus.IN_TRANSIT,
              fulfillmentStatus: FulfillmentStatus.SHIPPED,
              courierName,
              awbNumber,
            },
          });
          sId = newShipment.id;
        }

        if (sId) {
          await tx.shipmentEvent.create({
            data: {
              shipmentId: sId,
              status: 'OUT_FOR_DELIVERY',
              description: `Dispatched with ${courierName}${riderPhone ? ` (${riderPhone})` : ''}.${customMessage ? ` Note: ${customMessage}` : ''}`,
            },
          });
        }
      }

      // Step E: Create OrderStatusHistory record
      const fullReason = reason
        ? customMessage
          ? `${reason} - "${customMessage}"`
          : reason
        : customMessage
          ? `Note: ${customMessage}`
          : undefined;

      await tx.orderStatusHistory.create({
        data: {
          orderId: lockedOrder.id,
          fromStatus: lockedOrder.status,
          toStatus,
          reason: fullReason,
          actorId,
        },
      });

      // Step F: Create AuditLog record
      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          action: 'ORDER_STATUS_CHANGED',
          entityType: 'Order',
          entityId: lockedOrder.id,
          metadata: { fromStatus: lockedOrder.status, toStatus, reason: fullReason, customMessage, riderName, riderPhone },
        },
      });

      return updated;
    });

    // Trigger status transition notifications asynchronously to buyer at EVERY step
    this.triggerStatusNotifications(order.id, toStatus, customMessage, riderName, riderPhone).catch((err) => {
      this.logger.warn(`Failed to trigger status notification: ${err.message}`);
    });

    return result;
  }

  private async triggerStatusNotifications(
    orderId: string,
    toStatus: OrderStatus,
    customMessage?: string,
    riderName?: string,
    riderPhone?: string
  ) {
    try {
      const fullOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true, orderAddress: true, store: true, shipments: true },
      });

      if (!fullOrder) return;

      const store = fullOrder.store;
      const deliveryAddress = (fullOrder.deliveryAddress as any) || fullOrder.orderAddress || {};
      const customerEmail = fullOrder.customer?.email || deliveryAddress.email;
      const customerPhone = fullOrder.customer?.phone || deliveryAddress.phone;
      const customerName = fullOrder.customer?.fullName || deliveryAddress.fullName || 'Valued Customer';
      const trackingUrl = fullOrder.trackingToken
        ? `${process.env.STOREFRONT_BASE_URL || process.env.STOREFRONT_URL || 'https://letzshop.com'}/track/${fullOrder.orderNumber}?t=${fullOrder.trackingToken}`
        : undefined;

      const shipment = fullOrder.shipments?.[0];
      const deliveryMode = shipment?.provider === 'SELF_DELIVERY' ? 'SELF_DELIVERY' : 'SHIPROCKET';

      const emailContext = {
        order: fullOrder,
        store: {
          id: store.id,
          name: store.name,
          supportEmail: store.supportEmail || undefined,
          supportPhone: store.supportPhone || undefined,
        },
        customer: {
          fullName: customerName,
          email: customerEmail || '',
          phone: customerPhone,
        },
        trackingUrl,
        courierName: shipment?.courierName || (riderName ? `Store Team: ${riderName}` : undefined),
        awbNumber: shipment?.awbNumber || undefined,
        riderName: riderName || undefined,
        riderPhone: riderPhone || undefined,
        deliveryMode: deliveryMode as any,
        customMessage,
      };

      if (!customerEmail) return;

      if (toStatus === OrderStatus.DISPATCHED) {
        await this.mailService.sendOrderDispatchedEmail(emailContext);
      } else if (toStatus === OrderStatus.COMPLETED) {
        await this.mailService.sendOrderDeliveredEmail(emailContext);
      } else {
        await this.mailService.sendOrderStatusUpdateEmail(emailContext, toStatus);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch status update email: ${err.message}`);
    }
  }
}

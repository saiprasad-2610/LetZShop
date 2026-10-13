import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient, ShipmentStatus, ShippingProviderType } from '@prisma/client';
import { MockShippingProvider } from './providers/mock-shipping.provider';
import { ShiprocketShippingProvider } from './providers/shiprocket-shipping.provider';
import { ShippingProvider } from './interfaces/shipping-provider.interface';
import { TenantContext } from '@simply/types';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly mockProvider: MockShippingProvider,
    private readonly shiprocketProvider: ShiprocketShippingProvider
  ) {}

  private getProvider(type: ShippingProviderType): ShippingProvider {
    return type === ShippingProviderType.SHIPROCKET ? this.shiprocketProvider : this.mockProvider;
  }

  public async createShipmentForOrder(orderId: string, tenant: TenantContext) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: tenant.tenantId, storeId: tenant.storeId },
      include: { items: true, customer: true, shipments: true },
    });

    if (!order) throw new NotFoundException('Order not found.');

    // If shipment already manifested for this order, return it idempotently
    if (order.shipments && order.shipments.length > 0) {
      return order.shipments[0];
    }

    const merchantShipping = await this.prisma.merchantShippingAccount.findFirst({
      where: { storeId: tenant.storeId, isEnabled: true },
    });

    if (merchantShipping?.accountId === 'SELF_DELIVERY') {
      const selfShipment = await this.prisma.shipment.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          orderId: order.id,
          provider: ShippingProviderType.MOCK,
          status: 'OUT_FOR_DELIVERY',
          courierName: 'Store Owner Self-Delivery',
          awbNumber: `OWNER_DELIVERY_${order.orderNumber}`,
          trackingUrl: null,
          labelUrl: null,
          manifestUrl: null,
        },
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'DISPATCHED' },
      });

      return selfShipment;
    }

    const providerType = merchantShipping?.provider || ShippingProviderType.MOCK;
    const provider = this.getProvider(providerType);

    const deliveryAddress = (order.deliveryAddress as any) || {};

    try {
      const shipmentResult = await provider.createShipment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        pickupPincode: '400001',
        pickupLocation: merchantShipping?.accountId || 'Primary',
        totalPaise: order.totalPaise,
        paymentMethod: order.paymentStatus === 'PAID' ? 'Prepaid' : 'COD',
        deliveryAddress: {
          fullName: order.customer?.fullName || deliveryAddress.fullName || 'Customer',
          phone: order.customer?.phone || deliveryAddress.phone || '9999999999',
          addressLine1: deliveryAddress.addressLine1 || 'Street',
          addressLine2: deliveryAddress.addressLine2 || '',
          city: deliveryAddress.city || 'City',
          state: deliveryAddress.state || 'State',
          pincode: deliveryAddress.pincode || '400001',
          email: order.customer?.email || deliveryAddress.email || '',
        },
        items: order.items.map((it) => ({
          name: it.productName,
          sku: it.sku,
          quantity: it.quantity,
          pricePaise: it.unitPricePaise,
        })),
        weightKg: 0.5,
        merchantApiKey: merchantShipping?.apiKeyEncrypted,
        merchantApiSecret: merchantShipping?.apiSecretEncrypted,
      });

      return await this.prisma.$transaction(async (tx) => {
        const shipment = await tx.shipment.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            orderId: order.id,
            provider: providerType,
            awbNumber: shipmentResult.awbNumber,
            courierName: shipmentResult.courierName,
            trackingUrl: shipmentResult.trackingUrl,
            labelUrl: shipmentResult.labelUrl,
            manifestUrl: shipmentResult.manifestUrl,
            status: ShipmentStatus.MANIFESTED,
            weightKg: 0.5,
          },
        });

        await tx.shipmentEvent.create({
          data: {
            shipmentId: shipment.id,
            status: 'MANIFESTED',
            description: `Shipment created with ${shipmentResult.courierName}. AWB: ${shipmentResult.awbNumber}`,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { shipmentStatus: ShipmentStatus.MANIFESTED },
        });

        return shipment;
      });
    } catch (err: any) {
      // CRITICAL INTEGRATION FAILURE SAFETY:
      // A shipping provider outage or timeout MUST NEVER roll back a captured customer payment!
      this.logger.error(
        `[SHIPPING PROVIDER FAILURE] Failed to create shipment for order ${order.orderNumber}: ${err.message}. Enqueuing outbox retry.`
      );

      // Enqueue / update Outbox retry event
      await this.prisma.outboxEvent.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          eventType: 'SHIPMENT_CREATION_FAILED_RETRY',
          payload: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            provider: providerType,
            error: err.message,
          },
          status: 'PENDING',
          retryCount: 0,
          maxRetries: 5,
        },
      });

      // Keep order paymentStatus intact (PAID) and shipmentStatus as PENDING
      await this.prisma.order.update({
        where: { id: order.id },
        data: { shipmentStatus: ShipmentStatus.PENDING },
      });

      return {
        id: `pending_shipment_${order.id}`,
        status: ShipmentStatus.PENDING,
        orderId: order.id,
        isRetryQueued: true,
        message: 'Logistics provider temporarily unavailable. Shipment is queued for automatic background retry.',
      };
    }
  }

  public async trackShipment(awbNumber: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { awbNumber },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    if (!shipment) throw new NotFoundException('Shipment not found.');
    return shipment;
  }
}

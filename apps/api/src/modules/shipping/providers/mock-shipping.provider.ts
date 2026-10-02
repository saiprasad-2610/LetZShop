import { Injectable, Logger } from '@nestjs/common';
import {
  ShippingProvider,
  CheckServiceabilityInput,
  CreateShipmentInput,
  ShipmentResult,
} from '../interfaces/shipping-provider.interface';

@Injectable()
export class MockShippingProvider implements ShippingProvider {
  private readonly logger = new Logger(MockShippingProvider.name);

  public async checkServiceability(input: CheckServiceabilityInput): Promise<boolean> {
    this.logger.log(`[MOCK SHIPPING] Checked serviceability for delivery pincode: ${input.deliveryPincode} -> true`);
    return true;
  }

  public async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const awbNumber = `AWB_MOCK_${Date.now()}`;
    const courierName = 'Blue Dart Express';
    const trackingUrl = `https://mock-track.simplyecommerce.in/track/${awbNumber}`;
    const labelUrl = `https://mock-track.simplyecommerce.in/label/${awbNumber}.pdf`;

    this.logger.log(`[MOCK SHIPPING] Created shipment for order ${input.orderNumber}: AWB ${awbNumber} via ${courierName}`);

    return {
      awbNumber,
      courierName,
      trackingUrl,
      labelUrl,
      manifestUrl: `https://mock-track.simplyecommerce.in/manifest/${awbNumber}.pdf`,
    };
  }

  public async cancelShipment(awbNumber: string): Promise<boolean> {
    this.logger.log(`[MOCK SHIPPING] Cancelled shipment AWB: ${awbNumber}`);
    return true;
  }

  public async trackShipment(awbNumber: string) {
    return {
      status: 'IN_TRANSIT',
      location: 'Hub Mumbai - BKC',
      activities: [
        { date: new Date().toISOString(), status: 'Manifested', location: 'Merchant Warehouse' },
        { date: new Date().toISOString(), status: 'In Transit', location: 'Hub Mumbai - BKC' },
      ],
    };
  }
}

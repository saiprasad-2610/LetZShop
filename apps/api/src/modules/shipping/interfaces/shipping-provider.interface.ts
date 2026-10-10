export interface CheckServiceabilityInput {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  cod?: boolean;
}

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  pickupPincode: string;
  pickupLocation?: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    email?: string;
  };
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    pricePaise: number;
  }>;
  totalPaise?: number;
  paymentMethod?: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  merchantApiKey?: string;
  merchantApiSecret?: string;
}

export interface ShipmentResult {
  awbNumber: string;
  courierName: string;
  trackingUrl: string;
  labelUrl?: string;
  manifestUrl?: string;
  shipmentId?: string | number;
  shiprocketOrderId?: string | number;
}

export interface ShippingProvider {
  checkServiceability(input: CheckServiceabilityInput): Promise<boolean>;
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  cancelShipment(awbNumber: string): Promise<boolean>;
  trackShipment(awbNumber: string): Promise<{ status: string; location?: string; activities: any[] }>;
}

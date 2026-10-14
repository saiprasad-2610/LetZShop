// ==============================================================================
// Enums matching Domain & PostgreSQL Prisma Schema
// ==============================================================================

export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  SELLER_OWNER = 'SELLER_OWNER',
  SELLER_STAFF = 'SELLER_STAFF',
}

export enum CredentialType {
  PIN = 'PIN',
  PASSKEY = 'PASSKEY',
  BIOMETRIC = 'BIOMETRIC',
}

export enum OtpPurpose {
  REGISTRATION = 'REGISTRATION',
  LOGIN = 'LOGIN',
  RECOVERY = 'RECOVERY',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum StoreStatus {
  DRAFT = 'DRAFT',
  PRIVATE_PREVIEW = 'PRIVATE_PREVIEW',
  LIVE = 'LIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID',
  EXPIRED = 'EXPIRED',
}

export enum ProductMode {
  SELL_ONLINE = 'SELL_ONLINE',
  ENQUIRY_ONLY = 'ENQUIRY_ONLY',
  SELL_AND_ENQUIRY = 'SELL_AND_ENQUIRY',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum VariantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export enum OptionType {
  COLOUR = 'COLOUR',
  SIZE = 'SIZE',
  MATERIAL = 'MATERIAL',
  STORAGE = 'STORAGE',
  PACK_SIZE = 'PACK_SIZE',
  CUSTOM = 'CUSTOM',
}

export enum InventoryMovementType {
  INITIAL_STOCK = 'INITIAL_STOCK',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  ORDER_RESERVATION = 'ORDER_RESERVATION',
  ORDER_FULFILLMENT = 'ORDER_FULFILLMENT',
  ORDER_CANCELLATION = 'ORDER_CANCELLATION',
  RETURN_RESTOCK = 'RETURN_RESTOCK',
}

export enum OrderStatus {
  NEW = 'NEW',
  CONFIRMED = 'CONFIRMED',
  ACCEPTED = 'ACCEPTED',
  READY = 'READY',
  DISPATCHED = 'DISPATCHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum FulfillmentStatus {
  UNFULFILLED = 'UNFULFILLED',
  PROCESSING = 'PROCESSING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum ShipmentStatus {
  PENDING = 'PENDING',
  MANIFESTED = 'MANIFESTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RTO = 'RTO',
}

export enum ThemeKey {
  ATELIER = 'ATELIER',
  PULSE = 'PULSE',
  HARVEST = 'HARVEST',
  FOUNDRY = 'FOUNDRY',
  HABITAT = 'HABITAT',
  LOCAL = 'LOCAL',
  FEAST = 'FEAST',
  AURA = 'AURA',
  NOIR = 'NOIR',
  VISTA = 'VISTA',
  HORIZON = 'HORIZON',
  CANVAS = 'CANVAS',
}

export enum FulfillmentMode {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  DELIVERY_AND_PICKUP = 'DELIVERY_AND_PICKUP',
}

export enum SectionType {
  HERO = 'HERO',
  CATEGORIES = 'CATEGORIES',
  FEATURED_COLLECTION = 'FEATURED_COLLECTION',
  NEW_ARRIVALS = 'NEW_ARRIVALS',
  BESTSELLERS = 'BESTSELLERS',
  STORY = 'STORY',
  TESTIMONIALS = 'TESTIMONIALS',
  PHYSICAL_STORE = 'PHYSICAL_STORE',
  CUSTOM_BANNER = 'CUSTOM_BANNER',
  CONTACT = 'CONTACT',
}

export enum EnquiryStatus {
  NEW = 'NEW',
  IN_REVIEW = 'IN_REVIEW',
  QUOTATION_SENT = 'QUOTATION_SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER',
}

export enum IdempotencyStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ConsentPurpose {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  MARKETING_COMMUNICATION = 'MARKETING_COMMUNICATION',
  ORDER_TRACKING = 'ORDER_TRACKING',
}

export enum DataSubjectRequestType {
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_ERASURE = 'DATA_ERASURE',
  CONSENT_WITHDRAWAL = 'CONSENT_WITHDRAWAL',
  DATA_RECTIFICATION = 'DATA_RECTIFICATION',
}

export enum DataSubjectRequestStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  FULFILLED = 'FULFILLED',
  REJECTED = 'REJECTED',
}

export enum PaymentProviderType {
  MOCK = 'MOCK',
  RAZORPAY = 'RAZORPAY',
}

export enum PaymentPurpose {
  PLATFORM_SUBSCRIPTION = 'PLATFORM_SUBSCRIPTION',
  MERCHANT_ORDER = 'MERCHANT_ORDER',
}

export enum ShippingProviderType {
  MOCK = 'MOCK',
  SHIPROCKET = 'SHIPROCKET',
}

// ==============================================================================
// Common Interfaces
// ==============================================================================

export interface AuthenticatedUser {
  userId: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  tenantId?: string | null;
  storeId?: string | null;
  sessionId?: string;
  isPlatformAdmin?: boolean;
}

export interface TenantContext {
  tenantId: string;
  storeId: string;
}

export interface Money {
  amountPaise: number; // e.g. 129950 for ₹1,299.50
  currency: string;    // 'INR'
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface BuyerSafeTrackOrderDto {
  orderNumber: string;
  status: OrderStatus | string;
  paymentStatus: PaymentStatus | string;
  shipmentStatus: ShipmentStatus | string;
  fulfillmentStatus?: FulfillmentStatus | string;
  createdAt: string | Date;
  deliveryCity: string;
  deliveryState: string;
  deliveryPincode: string;
  itemCount: number;
  subtotalPaise?: number;
  discountPaise?: number;
  shippingPaise?: number;
  totalPaise: number;
  currency: string;
  items: Array<{
    productName: string;
    variantTitle?: string;
    titleSnapshot?: string;
    variantTitleSnapshot?: string;
    sku?: string | null;
    imageUrl?: string | null;
    quantity: number;
    unitPricePaise?: number;
    totalPricePaise?: number;
  }>;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | Date | null;
  store?: {
    id: string;
    name: string;
    slug: string;
    supportPhone?: string | null;
    supportEmail?: string | null;
  } | null;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  transactionId?: string | null;
  codCollectionMethod?: string | null;
  codCollectedAt?: string | Date | null;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    postalCode?: string;
    country?: string;
  };
  riderName?: string | null;
  riderPhone?: string | null;
  history?: Array<{
    status: string;
    reason?: string | null;
    timestamp: string | Date;
  }>;
}

export interface CreatePaymentOrderInput {
  amountPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  purpose?: PaymentPurpose;
  orderId?: string;
  subscriptionId?: string;
}

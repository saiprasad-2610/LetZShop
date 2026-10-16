/**
 * Centralized Payment Method Mapping and Label Formatting
 * Consistently used across Merchant Dashboard, Customer Order Tracking, Invoices, and Emails.
 */

export interface PaymentDisplayDetails {
  /** Customer-friendly payment method label (e.g., "Cash on Delivery", "UPI", "Card", "Net Banking") */
  methodLabel: string;
  /** Normalized method identifier (e.g., "COD", "UPI", "CARD", "NETBANKING") */
  normalizedMethod: string;
  /** Whether the order was placed as Cash on Delivery */
  isCod: boolean;
  /** Whether COD payment has been officially marked as collected by the merchant */
  isCodCollected: boolean;
  /** Actual collection mode if COD was collected at delivery (e.g. "Cash", "UPI", "Card", "Other") */
  codCollectionLabel?: string;
  /** Timestamp when COD was collected */
  codCollectedAt?: string | Date | null;
  /** Actor/user ID who recorded the COD collection */
  codCollectedBy?: string | null;
  /** Digital gateway payment / transaction identifier (e.g. pay_XXXXX), null for unpaid COD */
  transactionId?: string | null;
}

/**
 * Normalizes and maps raw payment methods from database, Razorpay, or user input
 * into user-friendly display labels.
 *
 * Examples:
 * - "upi" -> "UPI"
 * - "card" -> "Card"
 * - "netbanking" -> "Net Banking"
 * - "wallet" -> "Wallet"
 * - "COD" -> "Cash on Delivery"
 * - "ONLINE" -> "Online Payment"
 */
export function formatPaymentMethod(
  method?: string | null,
  codCollectionMethod?: string | null
): string {
  if (!method) {
    return 'Online Payment';
  }

  const raw = method.trim().toLowerCase();

  // If COD with an explicit delivery collection mode
  if ((raw === 'cod' || raw === 'cash on delivery') && codCollectionMethod) {
    const colMethod = formatCollectionMode(codCollectionMethod);
    return `Cash on Delivery (${colMethod})`;
  }

  switch (raw) {
    case 'upi':
      return 'UPI';
    case 'card':
    case 'credit_card':
    case 'debit_card':
      return 'Card';
    case 'netbanking':
    case 'net_banking':
      return 'Net Banking';
    case 'wallet':
      return 'Wallet';
    case 'cod':
    case 'cash on delivery':
    case 'cash_on_delivery':
      return 'Cash on Delivery';
    case 'cash':
      return 'Cash';
    case 'razorpay':
    case 'online':
    case 'prepaid':
      return 'Online Payment';
    default:
      // Capitalize cleanly if title case
      if (raw.length <= 4) return raw.toUpperCase();
      return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' ');
  }
}

/**
 * Formats the COD collection mode chosen by the merchant upon delivery.
 */
export function formatCollectionMode(mode?: string | null): string {
  if (!mode) return '';
  const m = mode.trim().toUpperCase();
  switch (m) {
    case 'UPI':
      return 'UPI';
    case 'CASH':
      return 'Cash';
    case 'CARD':
      return 'Card';
    case 'OTHER':
      return 'Other';
    default:
      return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
  }
}

/**
 * Extracts complete display details from an order payload or DB model.
 */
export function getPaymentDisplayDetails(order: any): PaymentDisplayDetails {
  if (!order) {
    return {
      methodLabel: 'Online Payment',
      normalizedMethod: 'ONLINE',
      isCod: false,
      isCodCollected: false,
      transactionId: null,
    };
  }

  // 1. Resolve raw payment method from order or nested payment orders / transactions
  const paymentOrder = order.paymentOrders?.[0];
  const paymentTx = paymentOrder?.transactions?.[0];

  let rawMethod: string | null =
    order.paymentMethod ||
    paymentTx?.paymentMethod ||
    (order.notes?.includes('COD') ? 'COD' : null) ||
    paymentOrder?.provider ||
    null;

  // If order is online prepaid but rawMethod is still generic 'ONLINE' or 'RAZORPAY',
  // check if transaction has a specific method (e.g. 'upi' or 'card')
  if (paymentTx?.paymentMethod && (rawMethod === 'ONLINE' || rawMethod === 'RAZORPAY' || !rawMethod)) {
    rawMethod = paymentTx.paymentMethod;
  }

  const isCod = Boolean(
    rawMethod?.toUpperCase() === 'COD' ||
    rawMethod?.toLowerCase() === 'cash on delivery' ||
    order.paymentMethod?.toUpperCase() === 'COD'
  );

  const isPaid = String(order.paymentStatus).toUpperCase() === 'PAID';
  const isCodCollected = isCod && isPaid;

  // 2. Resolve Transaction ID
  let transactionId: string | null = null;
  if (!isCod) {
    transactionId =
      paymentTx?.providerPaymentId ||
      order.transactionId ||
      paymentOrder?.providerOrderId ||
      null;
  }

  const codCollectionLabel = order.codCollectionMethod
    ? formatCollectionMode(order.codCollectionMethod)
    : undefined;

  const methodLabel = isCod ? 'Cash on Delivery' : formatPaymentMethod(rawMethod);

  return {
    methodLabel,
    normalizedMethod: (rawMethod || 'ONLINE').toUpperCase(),
    isCod,
    isCodCollected,
    codCollectionLabel,
    codCollectedAt: order.codCollectedAt || null,
    codCollectedBy: order.codCollectedBy || null,
    transactionId,
  };
}

/**
 * Centralized Payment Gateway Minimum Rule (Razorpay INR API Constraint)
 * Razorpay orders must have amount >= 100 paise (₹1.00).
 */
export const PAYMENT_GATEWAY_MIN_AMOUNT_PAISE = 100;
export const PAYMENT_GATEWAY_MIN_AMOUNT_RUPEES = 1;

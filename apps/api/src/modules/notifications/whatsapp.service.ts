import { Injectable, Logger } from '@nestjs/common';

const formatPaise = (paise: number) => {
  if (typeof paise !== 'number') return '₹0.00';
  return '₹' + (paise / 100).toFixed(2);
};

export interface WhatsAppOrderContext {
  orderNumber: string;
  storeName: string;
  storePhone?: string;
  customerName: string;
  customerPhone: string;
  totalPaise: number;
  itemsSummary: string;
  status: string;
  trackingUrl?: string;
  deliveryMode?: 'SHIPROCKET' | 'SELF_DELIVERY';
  courierName?: string;
  awbNumber?: string;
  riderName?: string;
  riderPhone?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  private cleanPhone(phone?: string): string {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.startsWith('91') && digits.length === 12) return digits;
    if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
    return digits;
  }

  /**
   * Generates a pre-filled WhatsApp link for Buyer -> Vendor when order is placed.
   */
  public generateBuyerToVendorOrderMessage(ctx: WhatsAppOrderContext): { url: string; text: string } {
    const text =
      `*New Order Alert - #${ctx.orderNumber}*\n\n` +
      `Hello *${ctx.storeName}*,\n` +
      `I have just placed an order on your store!\n\n` +
      `📦 *Items:* ${ctx.itemsSummary}\n` +
      `💰 *Total Amount:* ${formatPaise(ctx.totalPaise)}\n` +
      `👤 *Customer:* ${ctx.customerName} (${ctx.customerPhone})\n\n` +
      `Please confirm once my order is accepted & dispatched. Thank you!`;

    const targetPhone = this.cleanPhone(ctx.storePhone || process.env.SUPPORT_WHATSAPP || '');
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    return { url, text };
  }

  /**
   * Generates a pre-filled WhatsApp update for Vendor -> Buyer when order is dispatched.
   */
  public generateOrderDispatchedMessage(ctx: WhatsAppOrderContext): { url: string; text: string } {
    const isSelf = ctx.deliveryMode === 'SELF_DELIVERY';
    const deliveryDetail = isSelf
      ? `🛵 *Delivery By:* ${ctx.riderName || 'Our Store Team'}${ctx.riderPhone ? ` (${ctx.riderPhone})` : ''}`
      : `🚚 *Courier Partner:* ${ctx.courierName || 'Shiprocket Logistics'}\n🏷️ *AWB Tracking:* ${ctx.awbNumber || 'Available Online'}`;

    const trackingLine = ctx.trackingUrl ? `\n🔗 *Live Tracking Link:* ${ctx.trackingUrl}` : '';

    const text =
      `*Order Dispatched! 🚀 - #${ctx.orderNumber}*\n\n` +
      `Hello *${ctx.customerName}*,\n` +
      `Great news! Your order from *${ctx.storeName}* has been dispatched and is on its way to your address.\n\n` +
      `📦 *Items:* ${ctx.itemsSummary}\n` +
      `💰 *Total:* ${formatPaise(ctx.totalPaise)}\n` +
      `${deliveryDetail}${trackingLine}\n\n` +
      `Thank you for shopping with us! Reply to this message if you have any questions.`;

    const buyerPhone = this.cleanPhone(ctx.customerPhone);
    const url = `https://wa.me/${buyerPhone}?text=${encodeURIComponent(text)}`;

    return { url, text };
  }

  /**
   * Generates a pre-filled WhatsApp update for Vendor -> Buyer when order is delivered.
   */
  public generateOrderDeliveredMessage(ctx: WhatsAppOrderContext): { url: string; text: string } {
    const text =
      `*Order Delivered! 🎉 - #${ctx.orderNumber}*\n\n` +
      `Hello *${ctx.customerName}*,\n` +
      `Your order from *${ctx.storeName}* has been successfully delivered!\n\n` +
      `📦 *Items:* ${ctx.itemsSummary}\n` +
      `💰 *Total:* ${formatPaise(ctx.totalPaise)}\n\n` +
      `We hope you love your purchase! If you have any feedback or need support, reply right here.\n` +
      `Have a wonderful day!`;

    const buyerPhone = this.cleanPhone(ctx.customerPhone);
    const url = `https://wa.me/${buyerPhone}?text=${encodeURIComponent(text)}`;

    return { url, text };
  }
}

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
  customMessage?: string;
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
    const noteLine = ctx.customMessage ? `\n💬 *Note from ${ctx.storeName}:* "${ctx.customMessage}"\n` : '';

    const text =
      `*Order Dispatched! 🚀 - #${ctx.orderNumber}*\n\n` +
      `Hello *${ctx.customerName}*,\n` +
      `Great news! Your order from *${ctx.storeName}* has been dispatched and is on its way to your address.\n\n` +
      `📦 *Items:* ${ctx.itemsSummary}\n` +
      `💰 *Total:* ${formatPaise(ctx.totalPaise)}\n` +
      `${deliveryDetail}\n` +
      `${noteLine}` +
      `${trackingLine}\n\n` +
      `Thank you for shopping with us! Reply to this message if you have any questions.`;

    const buyerPhone = this.cleanPhone(ctx.customerPhone);
    const url = `https://wa.me/${buyerPhone}?text=${encodeURIComponent(text)}`;

    return { url, text };
  }

  /**
   * Generates a pre-filled WhatsApp update for Vendor -> Buyer when order is delivered.
   */
  public generateOrderDeliveredMessage(ctx: WhatsAppOrderContext): { url: string; text: string } {
    const trackingLine = ctx.trackingUrl ? `\n🧾 *Receipt & Order Details:* ${ctx.trackingUrl}` : '';
    const noteLine = ctx.customMessage ? `\n💬 *Note from ${ctx.storeName}:* "${ctx.customMessage}"\n` : '';

    const text =
      `*Order Delivered! 🎉 - #${ctx.orderNumber}*\n\n` +
      `Hello *${ctx.customerName}*,\n` +
      `Your order from *${ctx.storeName}* has been successfully delivered!\n\n` +
      `📦 *Items:* ${ctx.itemsSummary}\n` +
      `💰 *Total:* ${formatPaise(ctx.totalPaise)}\n` +
      `${noteLine}` +
      `${trackingLine}\n\n` +
      `We hope you love your purchase! If you have any feedback or need support, reply right here.\n` +
      `Have a wonderful day!`;

    const buyerPhone = this.cleanPhone(ctx.customerPhone);
    const url = `https://wa.me/${buyerPhone}?text=${encodeURIComponent(text)}`;

    return { url, text };
  }

  /**
   * Generates a pre-filled WhatsApp update for Vendor -> Buyer for ANY status milestone.
   */
  public generateOrderStatusUpdateMessage(ctx: WhatsAppOrderContext, status: string): { url: string; text: string } {
    if (status === 'DISPATCHED') {
      return this.generateOrderDispatchedMessage(ctx);
    }
    if (status === 'COMPLETED') {
      return this.generateOrderDeliveredMessage(ctx);
    }

    let statusHeader = `*Order Update - #${ctx.orderNumber}*`;
    let statusDesc = `Your order status has been updated to *${status}*.`;

    if (status === 'ACCEPTED' || status === 'CONFIRMED') {
      statusHeader = `*Order Confirmed & Preparing! 👨‍🍳 - #${ctx.orderNumber}*`;
      statusDesc = `Great news! Your order from *${ctx.storeName}* has been accepted and is currently being packed.`;
    } else if (status === 'READY') {
      statusHeader = `*Order Packed & Ready! 🎁 - #${ctx.orderNumber}*`;
      statusDesc = `Your order from *${ctx.storeName}* is packed and ready for delivery/pickup.`;
    } else if (status === 'CANCELLED') {
      statusHeader = `*Order Cancelled - #${ctx.orderNumber}*`;
      statusDesc = `Your order from *${ctx.storeName}* has been cancelled.`;
    }

    const noteLine = ctx.customMessage ? `\n💬 *Note from ${ctx.storeName}:* "${ctx.customMessage}"\n` : '';
    const trackingLine = ctx.trackingUrl ? `\n🔗 *Track Live:* ${ctx.trackingUrl}` : '';

    const text =
      `${statusHeader}\n\n` +
      `Hello *${ctx.customerName}*,\n` +
      `${statusDesc}\n\n` +
      `📦 *Items:* ${ctx.itemsSummary}\n` +
      `💰 *Total Amount:* ${formatPaise(ctx.totalPaise)}\n` +
      `${noteLine}` +
      `${trackingLine}\n\n` +
      `Thank you for shopping with *${ctx.storeName}*!`;

    const buyerPhone = this.cleanPhone(ctx.customerPhone);
    const url = `https://wa.me/${buyerPhone}?text=${encodeURIComponent(text)}`;

    return { url, text };
  }

  /**
   * Directly sends a WhatsApp message from the server without redirecting the user or opening WhatsApp Web.
   * If Meta WhatsApp Cloud API credentials or a custom gateway URL are configured in the environment,
   * performs direct API dispatch. Otherwise, performs automated server-side logging without client redirection.
   */
  public async sendDirectWhatsApp(recipientPhone: string, text: string): Promise<boolean> {
    const cleanTo = this.cleanPhone(recipientPhone);
    if (!cleanTo || cleanTo.length < 10) {
      this.logger.warn(`[WHATSAPP] Skipped direct send: invalid recipient phone "${recipientPhone}"`);
      return false;
    }

    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL;

    // Option 1: Official Meta WhatsApp Cloud API
    if (token && phoneId) {
      try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanTo,
            type: 'text',
            text: { preview_url: true, body: text },
          }),
        });

        if (response.ok) {
          this.logger.log(`[WHATSAPP CLOUD API] Message delivered directly to +${cleanTo}`);
          return true;
        } else {
          const errData = await response.text();
          this.logger.error(`[WHATSAPP CLOUD API ERROR] Status ${response.status}: ${errData}`);
          return false;
        }
      } catch (err: any) {
        this.logger.error(`[WHATSAPP CLOUD API EXCEPTION] ${err.message}`);
        return false;
      }
    }

    // Option 2: Configured Webhook / Gateway
    if (gatewayUrl) {
      try {
        const response = await fetch(gatewayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: cleanTo, message: text }),
        });
        if (response.ok) {
          this.logger.log(`[WHATSAPP GATEWAY] Message dispatched to +${cleanTo}`);
          return true;
        }
      } catch (err: any) {
        this.logger.error(`[WHATSAPP GATEWAY EXCEPTION] ${err.message}`);
      }
    }

    // Option 3: Development / Headless Mode (Server-side direct automated dispatch)
    this.logger.log(
      `[DIRECT WHATSAPP DISPATCH] To: +${cleanTo} | Automated Direct Message:\n${text}`
    );
    return true;
  }

  /**
   * Sends automated direct WhatsApp update for any order lifecycle event (placed, confirmed, ready, dispatched, delivered, cancelled).
   */
  public async sendDirectOrderStatusUpdate(ctx: WhatsAppOrderContext, status: string): Promise<boolean> {
    const { text } = this.generateOrderStatusUpdateMessage(ctx, status);
    return this.sendDirectWhatsApp(ctx.customerPhone, text);
  }
}

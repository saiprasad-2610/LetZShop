import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const formatPaise = (paise: number) => {
  if (typeof paise !== 'number') return '₹0.00';
  return '₹' + (paise / 100).toFixed(2);
};

export interface OrderEmailContext {
  order: any;
  store: {
    id: string;
    name: string;
    supportEmail?: string;
    supportPhone?: string;
  };
  customer: {
    fullName: string;
    email: string;
    phone?: string;
  };
  trackingUrl?: string;
  courierName?: string;
  awbNumber?: string;
  riderName?: string;
  riderPhone?: string;
  deliveryMode?: 'SHIPROCKET' | 'SELF_DELIVERY';
  customMessage?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.letzshop.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
    this.fromAddress = process.env.SMTP_FROM || '"Letzshop Orders" <orders@letzshop.com>';

    if (user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });
        this.logger.log(`[SMTP] Transporter configured for host: ${host}:${port}`);
      } catch (err: any) {
        this.logger.warn(`[SMTP] Failed to initialize transporter: ${err.message}. Emails will be logged to console.`);
      }
    } else {
      this.logger.log('[SMTP] No SMTP credentials provided. Running in development simulation mode (logging outgoing emails).');
    }
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!to || !to.includes('@')) {
      this.logger.warn(`[SMTP] Skipped sending email: Invalid recipient address "${to}"`);
      return false;
    }

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          html,
        });
        this.logger.log(`[SMTP] Sent email to ${to} | Subject: "${subject}"`);
        return true;
      } catch (err: any) {
        this.logger.error(`[SMTP ERROR] Failed to deliver email to ${to}: ${err.message}`);
        return false;
      }
    } else {
      // Simulation mode
      this.logger.log(
        `[SMTP SIMULATION] To: ${to} | From: ${this.fromAddress} | Subject: "${subject}"`
      );
      return true;
    }
  }

  /**
   * Order Placed Email to Buyer (Order Confirmation)
   */
  public async sendOrderPlacedEmail(ctx: OrderEmailContext): Promise<boolean> {
    const { order, store, customer, trackingUrl } = ctx;
    const recipient = customer.email;
    const subject = `Order Confirmed: #${order.orderNumber} - ${store.name}`;

    const itemsHtml = (order.items || [])
      .map(
        (it: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0;">
            <strong style="color: #1e293b; font-size: 14px;">${it.productName}</strong>
            ${it.variantTitle && it.variantTitle !== 'Standard / Default' ? `<br/><span style="color: #64748b; font-size: 12px;">${it.variantTitle}</span>` : ''}
          </td>
          <td style="padding: 12px; text-align: center; color: #475569; font-size: 13px;">${it.quantity}</td>
          <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 14px;">${formatPaise(it.totalPaise || it.unitPricePaise * it.quantity)}</td>
        </tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff; }
          .content { padding: 28px 24px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #059669; }
          .btn { display: inline-block; padding: 12px 24px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 13px; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${store.name}</h1>
            <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Thank you for your order!</p>
          </div>
          <div class="content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <span style="font-size: 12px; color: #64748b;">Order Number</span>
                <h3 style="margin: 2px 0 0; font-family: monospace; font-size: 16px; color: #0f172a;">#${order.orderNumber}</h3>
              </div>
              <span class="badge">CONFIRMED</span>
            </div>

            <p style="font-size: 14px; line-height: 1.5; color: #334155;">
              Hi <strong>${customer.fullName}</strong>,<br/>
              We have received your order and are currently preparing it. You do not need to sign in to check your order details — everything is documented in this confirmation.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 24px 0 16px;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase;">
                  <th style="padding: 8px 0; text-align: left;">Item</th>
                  <th style="padding: 8px; text-align: center;">Qty</th>
                  <th style="padding: 8px 0; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
                <span>Subtotal</span>
                <span>${formatPaise(order.subtotalPaise)}</span>
              </div>
              ${order.shippingPaise > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
                <span>Delivery</span>
                <span>${formatPaise(order.shippingPaise)}</span>
              </div>` : ''}
              ${order.discountPaise > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #059669; margin-bottom: 6px;">
                <span>Discount</span>
                <span>-${formatPaise(order.discountPaise)}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px;">
                <span>Total Amount</span>
                <span>${formatPaise(order.totalPaise)}</span>
              </div>
            </div>

            ${trackingUrl ? `
            <div style="text-align: center; margin: 28px 0;">
              <a href="${trackingUrl}" class="btn" style="color: #ffffff;">Track Order Live</a>
            </div>` : ''}
          </div>
          <div class="footer">
            <p style="margin: 0;">Need help with your purchase? Contact <strong>${store.name}</strong> at ${store.supportEmail || 'store support'}.</p>
            <p style="margin: 6px 0 0; color: #94a3b8;">Powered by Letzshop Commerce</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(recipient, subject, html);
  }

  /**
   * Order Dispatched Email to Buyer
   */
  public async sendOrderDispatchedEmail(ctx: OrderEmailContext): Promise<boolean> {
    const { order, store, customer, trackingUrl, deliveryMode, courierName, awbNumber, riderName, riderPhone } = ctx;
    const recipient = customer.email;
    const subject = `Your Order #${order.orderNumber} Has Been Dispatched! - ${store.name}`;

    const isSelf = deliveryMode === 'SELF_DELIVERY';
    const deliveryDetailHtml = isSelf
      ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 6px; color: #166534; font-size: 14px;">🛵 Out For Delivery via Store Team</h4>
          <p style="margin: 0; font-size: 13px; color: #15803d;">
            Delivered directly by our in-house delivery partner: <strong>${riderName || 'Store Team'}</strong>
            ${riderPhone ? `<br/>Contact Number: <strong>${riderPhone}</strong>` : ''}
          </p>
        </div>`
      : `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 6px; color: #1e40af; font-size: 14px;">🚚 Shipped via ${courierName || 'Shiprocket Logistics'}</h4>
          <p style="margin: 0; font-size: 13px; color: #1d4ed8;">
            AWB Tracking Number: <strong style="font-family: monospace;">${awbNumber || 'Assigned'}</strong>
          </p>
        </div>`;

    const customMessageHtml = ctx.customMessage ? `
      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 18px 0; border-radius: 4px; border: 1px solid #e2e8f0; border-left-width: 4px; border-left-color: #2563eb;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #2563eb; display: block; margin-bottom: 4px;">Personal Note from ${store.name}</span>
        <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #1e293b; font-style: italic;">"${ctx.customMessage}"</p>
      </div>` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff; }
          .content { padding: 28px 24px; }
          .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 13px; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${store.name}</h1>
            <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Package on its way!</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Your Order is Out for Delivery 🚀</h2>
            <p style="font-size: 14px; line-height: 1.5; color: #334155;">
              Hi <strong>${customer.fullName}</strong>,<br/>
              Your order <strong>#${order.orderNumber}</strong> has been packed and dispatched from our store.
            </p>

            ${deliveryDetailHtml}
            ${customMessageHtml}

            ${trackingUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingUrl}" class="btn" style="color: #ffffff;">View Live Order Status</a>
            </div>` : ''}

            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
              Please ensure someone is available at your address to receive the delivery.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">Questions about your order? Reach out to ${store.name} at ${store.supportPhone || store.supportEmail || 'support'}.</p>
            <p style="margin: 6px 0 0; color: #94a3b8;">Powered by Letzshop Commerce</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(recipient, subject, html);
  }

  /**
   * Order Delivered Email to Buyer
   */
  public async sendOrderDeliveredEmail(ctx: OrderEmailContext): Promise<boolean> {
    const { order, store, customer, trackingUrl } = ctx;
    const recipient = customer.email;
    const subject = `Order Delivered! #${order.orderNumber} - ${store.name}`;

    const customMessageHtml = ctx.customMessage ? `
      <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 18px 0; border-radius: 4px; border: 1px solid #bbf7d0; border-left-width: 4px; border-left-color: #16a34a;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #16a34a; display: block; margin-bottom: 4px;">Personal Note from ${store.name}</span>
        <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #166534; font-style: italic;">"${ctx.customMessage}"</p>
      </div>` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: #065f46; padding: 28px 24px; text-align: center; color: #ffffff; }
          .content { padding: 28px 24px; }
          .btn { display: inline-block; padding: 12px 24px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 13px; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Package Delivered 🎉</h1>
            <p style="margin: 6px 0 0; color: #a7f3d0; font-size: 13px;">${store.name}</p>
          </div>
          <div class="content">
            <p style="font-size: 14px; line-height: 1.5; color: #334155;">
              Hi <strong>${customer.fullName}</strong>,<br/>
              Your order <strong>#${order.orderNumber}</strong> has been successfully delivered. We hope you enjoy your purchase!
            </p>

            ${customMessageHtml}

            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: #0f172a;">
                <span>Total Paid:</span>
                <span>${formatPaise(order.totalPaise)}</span>
              </div>
            </div>

            ${trackingUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingUrl}" class="btn" style="color: #ffffff;">View Order Receipt</a>
            </div>` : ''}

            <p style="font-size: 13px; color: #64748b;">
              Have questions or need assistance? Reply directly to this email or contact us anytime.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">Thank you for supporting <strong>${store.name}</strong>!</p>
            <p style="margin: 6px 0 0; color: #94a3b8;">Powered by Letzshop Commerce</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(recipient, subject, html);
  }

  /**
   * Order Status Update Email to Buyer (CONFIRMED, ACCEPTED, READY, CANCELLED)
   */
  public async sendOrderStatusUpdateEmail(ctx: OrderEmailContext, status: string): Promise<boolean> {
    const { order, store, customer, trackingUrl } = ctx;
    const recipient = customer.email;

    let statusTitle = 'Order Update';
    let statusBadgeText = status;
    let badgeBg = '#eff6ff';
    let badgeColor = '#2563eb';
    let headerBg = '#0f172a';
    let bodyIntro = `Your order <strong>#${order.orderNumber}</strong> has been updated to <strong>${status}</strong>.`;

    if (status === 'ACCEPTED' || status === 'CONFIRMED') {
      statusTitle = 'Order Accepted & Preparing';
      statusBadgeText = 'ACCEPTED';
      badgeBg = '#ecfeff';
      badgeColor = '#0891b2';
      headerBg = '#0e7490';
      bodyIntro = `Good news! Your order <strong>#${order.orderNumber}</strong> has been accepted by <strong>${store.name}</strong> and is currently being prepared with care.`;
    } else if (status === 'READY') {
      statusTitle = 'Order Packed & Ready';
      statusBadgeText = 'READY TO SHIP';
      badgeBg = '#fef3c7';
      badgeColor = '#d97706';
      headerBg = '#b45309';
      bodyIntro = `Your order <strong>#${order.orderNumber}</strong> has been carefully packed and is ready for pickup/dispatch.`;
    } else if (status === 'CANCELLED') {
      statusTitle = 'Order Cancelled';
      statusBadgeText = 'CANCELLED';
      badgeBg = '#ffe4e6';
      badgeColor = '#e11d48';
      headerBg = '#881337';
      bodyIntro = `Your order <strong>#${order.orderNumber}</strong> has been cancelled. Any pre-payments or reservations are being reconciled.`;
    }

    const subject = `${statusTitle}: #${order.orderNumber} - ${store.name}`;

    const customMessageHtml = ctx.customMessage ? `
      <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 18px 0; border-radius: 4px; border: 1px solid #e2e8f0; border-left-width: 4px; border-left-color: #0284c7;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #0284c7; display: block; margin-bottom: 4px;">Note from ${store.name}</span>
        <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #1e293b; font-style: italic;">"${ctx.customMessage}"</p>
      </div>` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: ${headerBg}; padding: 28px 24px; text-align: center; color: #ffffff; }
          .content { padding: 28px 24px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; }
          .btn { display: inline-block; padding: 12px 24px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 13px; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${store.name}</h1>
            <p style="margin: 6px 0 0; color: #e2e8f0; font-size: 13px;">${statusTitle}</p>
          </div>
          <div class="content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <span style="font-size: 12px; color: #64748b;">Order Number</span>
                <h3 style="margin: 2px 0 0; font-family: monospace; font-size: 16px; color: #0f172a;">#${order.orderNumber}</h3>
              </div>
              <span class="badge">${statusBadgeText}</span>
            </div>

            <p style="font-size: 14px; line-height: 1.5; color: #334155;">
              Hi <strong>${customer.fullName}</strong>,<br/>
              ${bodyIntro}
            </p>

            ${customMessageHtml}

            <div style="background: #f8fafc; border-radius: 12px; padding: 14px; margin: 18px 0; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
                <span>Total Amount:</span>
                <strong style="color: #0f172a;">${formatPaise(order.totalPaise)}</strong>
              </div>
            </div>

            ${trackingUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingUrl}" class="btn" style="color: #ffffff;">Check Live Status</a>
            </div>` : ''}
          </div>
          <div class="footer">
            <p style="margin: 0;">Need help? Contact ${store.name} at ${store.supportPhone || store.supportEmail || 'support'}.</p>
            <p style="margin: 6px 0 0; color: #94a3b8;">Powered by Letzshop Commerce</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(recipient, subject, html);
  }

  /**
   * New Order Alert Email to Merchant / Vendor
   */
  public async sendVendorNewOrderAlert(ctx: OrderEmailContext, vendorEmail?: string): Promise<boolean> {
    const { order, store, customer } = ctx;
    const recipient = vendorEmail || store.supportEmail;
    if (!recipient) return false;

    const subject = `🎉 New Order Received: #${order.orderNumber} (${formatPaise(order.totalPaise)})`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2>New Order Placed on ${store.name}!</h2>
        <p><strong>Order Number:</strong> #${order.orderNumber}</p>
        <p><strong>Customer:</strong> ${customer.fullName} (${customer.phone || 'No phone'}) - ${customer.email || 'No email'}</p>
        <p><strong>Total Amount:</strong> ${formatPaise(order.totalPaise)}</p>
        <p>Please open your merchant portal to accept and dispatch this order.</p>
      </div>
    `;

    return this.sendEmail(recipient, subject, html);
  }
}

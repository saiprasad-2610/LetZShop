import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { PaymentsService } from './payments.service';
import { RazorpayPaymentProvider } from './providers/razorpay-payment.provider';
import { Public } from '../../common/decorators';

@ApiTags('Webhooks')
@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly razorpayProvider: RazorpayPaymentProvider
  ) {}

  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public reprocessable webhook endpoint for Razorpay payment events' })
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<FastifyRequest>,
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature?: string
  ) {
    if (!signature) {
      this.logger.warn('Received Razorpay webhook missing signature header.');
      throw new BadRequestException('Missing x-razorpay-signature header');
    }

    const webhookSecret = this.razorpayProvider.platformWebhookSecret;
    if (!webhookSecret) {
      this.logger.error(
        'Razorpay platform webhook secret is not configured in environment (RAZORPAY_PLATFORM_WEBHOOK_SECRET). Failing closed.'
      );
      throw new BadRequestException('Webhook verification disabled: secret not configured');
    }

    // Capture the original raw byte buffer or string as sent over HTTP to verify HMAC
    const rawPayload: string | Buffer =
      req.rawBody ??
      (typeof req.body === 'string'
        ? req.body
        : typeof payload === 'string'
        ? payload
        : JSON.stringify(payload));

    const isValid = this.razorpayProvider.verifyWebhookSignature(
      rawPayload,
      signature,
      webhookSecret
    );

    if (!isValid) {
      this.logger.warn(`Invalid Razorpay webhook signature for request`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const eventId = data?.id || data?.payload?.payment?.entity?.id || `rzp_evt_${Date.now()}`;
    const eventType = data?.event || 'payment.captured';

    return this.paymentsService.handleWebhook('RAZORPAY', eventId, eventType, data, signature);
  }
}

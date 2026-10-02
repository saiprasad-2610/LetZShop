import { Controller, Get, Inject, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { Public } from '../../common/decorators';
import { STORAGE_PROVIDER_TOKEN } from '../media/media.service';
import { StorageProvider } from '@simply/storage';
import { getBrandConfig } from '@simply/config';
import { RazorpayPaymentProvider } from '../payments/providers/razorpay-payment.provider';

@ApiTags('Observability & Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject(STORAGE_PROVIDER_TOKEN) private readonly storageProvider: StorageProvider,
    private readonly razorpayProvider: RazorpayPaymentProvider
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe - checks API process status' })
  getLiveness() {
    const brand = getBrandConfig();
    return {
      status: 'UP',
      brand: brand.brandName,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Provider configuration indicator (no secrets, zero API calls)' })
  getProviderStatus() {
    const razorpayConfigured = !!(
      this.razorpayProvider.platformKeyId &&
      this.razorpayProvider.platformKeySecret
    );
    const webhookConfigured = !!this.razorpayProvider.platformWebhookSecret;

    return {
      status: 'UP',
      providers: {
        razorpay: razorpayConfigured ? 'Configured' : 'Not Configured',
        webhook: webhookConfigured ? 'Configured' : 'Not Configured',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - checks database, storage, and provider configurations' })
  async getReadiness(@Res() res: any) {
    const checks: Record<string, any> = {
      database: 'DOWN',
      storage: 'DOWN',
    };

    let isReady = true;

    // Check 1: PostgreSQL Connection
    try {
      await this.prisma.$queryRaw`SELECT 1;`;
      checks.database = 'UP';
    } catch (err: any) {
      checks.database = `DOWN: ${err.message}`;
      isReady = false;
    }

    // Check 2: Storage Availability
    try {
      await this.storageProvider.exists('health-check-probe.tmp');
      checks.storage = 'UP';
    } catch (err: any) {
      checks.storage = `DOWN: ${err.message}`;
      isReady = false;
    }

    // Check 3: Provider Configuration Status (Safe, offline)
    const razorpayConfigured = !!(
      this.razorpayProvider.platformKeyId &&
      this.razorpayProvider.platformKeySecret
    );
    const webhookConfigured = !!this.razorpayProvider.platformWebhookSecret;

    checks.providers = {
      razorpay: razorpayConfigured ? 'Configured' : 'Not Configured',
      webhook: webhookConfigured ? 'Configured' : 'Not Configured',
    };

    const statusCode = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(statusCode).send({
      status: isReady ? 'READY' : 'NOT_READY',
      checks,
      timestamp: new Date().toISOString(),
    });
  }
}

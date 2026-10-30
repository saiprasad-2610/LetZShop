import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Req,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { QrCodeService } from './qr-code.service';
import { Public, CurrentTenant, CurrentUser } from '../../common/decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantContext, AuthenticatedUser } from '@simply/types';

@ApiTags('Store QR Code')
@Controller()
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  /**
   * Public Permanent QR Code Redirect Endpoint.
   * Resolves token to current canonical storefront URL and redirects 302.
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Get('q/:token')
  @ApiOperation({ summary: 'Resolve permanent merchant QR code and redirect to live storefront' })
  async redirectPublicQr(
    @Param('token') token: string,
    @Res() res: any,
    @Req() req: any
  ) {
    const { targetUrl } = await this.qrCodeService.resolvePublicToken(token);

    // Prevent open redirect vulnerabilities: Ensure target destination is safe
    const parsed = new URL(targetUrl);
    const allowedRoot = process.env.STOREFRONT_ROOT_DOMAIN || 'letzshop.store';
    const isLocal = parsed.hostname.endsWith('localhost') || parsed.hostname === '127.0.0.1';
    const isDomainAllowed = parsed.hostname.endsWith(allowedRoot) || isLocal || parsed.protocol === 'https:';

    if (!isDomainAllowed) {
      throw new BadRequestException('Disallowed redirect destination.');
    }

    // Set non-cachable headers so future merchant domain changes take effect immediately
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    return res.status(HttpStatus.FOUND).redirect(targetUrl);
  }

  /**
   * Merchant: Fetch Store Permanent QR Details.
   */
  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('stores/:storeId/qr-code')
  @ApiOperation({ summary: 'Get permanent QR code information for store' })
  async getStoreQr(
    @Param('storeId') storeId: string,
    @CurrentTenant() tenant: TenantContext
  ) {
    return this.qrCodeService.getOrCreateStoreQr(storeId, tenant.tenantId);
  }

  /**
   * Merchant: Get QR Code Preview Image (512x512 PNG).
   */
  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('stores/:storeId/qr-code/preview')
  @ApiOperation({ summary: 'Stream 512px QR code preview PNG for dashboard display' })
  async getQrPreview(
    @Param('storeId') storeId: string,
    @CurrentTenant() tenant: TenantContext,
    @Res() res: any
  ) {
    const qrDetails = await this.qrCodeService.getOrCreateStoreQr(storeId, tenant.tenantId);
    const asset = await this.qrCodeService.generateQrAsset(qrDetails.permanentUrl, 'png', 512);

    res.header('Content-Type', asset.contentType);
    res.header('Cache-Control', 'private, max-age=86400');
    return res.send(asset.buffer);
  }

  /**
   * Merchant: Download High-Resolution or Vector QR Code.
   */
  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('stores/:storeId/qr-code/download')
  @ApiOperation({ summary: 'Download high-resolution PNG or SVG QR code for printing' })
  async downloadQr(
    @Param('storeId') storeId: string,
    @Query('format') format: string = 'png',
    @Query('size') size: string = '1200',
    @CurrentTenant() tenant: TenantContext,
    @Res() res: any
  ) {
    const safeFormat = format?.toLowerCase() === 'svg' ? 'svg' : 'png';
    const numSize = parseInt(size, 10) || 1200;

    const qrDetails = await this.qrCodeService.getOrCreateStoreQr(storeId, tenant.tenantId);
    const asset = await this.qrCodeService.generateQrAsset(qrDetails.permanentUrl, safeFormat, numSize);

    res.header('Content-Type', asset.contentType);
    res.header(
      'Content-Disposition',
      `attachment; filename="letzshop-qr-${qrDetails.publicToken}.${safeFormat}"`
    );
    res.header('Cache-Control', 'private, max-age=3600');
    return res.send(asset.buffer);
  }
}

import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Res,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, Public } from '../../common/decorators';
import { TenantContext } from '@simply/types';
import * as fs from 'fs';
import * as path from 'path';
import { isPublicMediaKey, localMediaRoot } from './local-media-root';
import { avifFallbackFormat, compatibleAvifFile, convertAvifBuffer } from './compatible-image';
import { resolveSafeStoragePath } from '@simply/storage';

@ApiTags('Media & Storage')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Post('upload')
  @ApiOperation({ summary: 'Upload product media with metadata storage' })
  async uploadMedia(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: {
      productId: string;
      variantId?: string;
      filename: string;
      mimeType: string;
      base64Data: string;
      altText?: string;
    }
  ) {
    const buffer = Buffer.from(body.base64Data, 'base64');
    return this.mediaService.uploadProductMedia(
      tenant,
      {
        buffer,
        originalFilename: body.filename,
        mimeType: body.mimeType,
      },
      body.productId,
      body.variantId,
      body.altText
    );
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Post('asset')
  @ApiOperation({ summary: 'Upload standalone media asset and return MediaAsset reference' })
  async uploadMediaAsset(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: {
      filename: string;
      mimeType: string;
      base64Data: string;
      altText?: string;
    }
  ) {
    const buffer = Buffer.from(body.base64Data, 'base64');
    return this.mediaService.uploadStandaloneMediaAsset(
      tenant,
      {
        buffer,
        originalFilename: body.filename,
        mimeType: body.mimeType,
      },
      body.altText
    );
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Post('store-asset')
  @ApiOperation({ summary: 'Upload store brand asset (logo, banner, favicon) with 5MB limit' })
  async uploadStoreAsset(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: {
      type: 'logo' | 'banner' | 'favicon';
      filename: string;
      mimeType: string;
      base64Data: string;
    }
  ) {
    const buffer = Buffer.from(body.base64Data, 'base64');
    return this.mediaService.uploadStoreAsset(
      tenant,
      {
        buffer,
        originalFilename: body.filename,
        mimeType: body.mimeType,
      },
      body.type
    );
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product media and physical file' })
  async deleteMedia(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    return this.mediaService.deleteProductMedia(tenant, id);
  }

  private async streamMediaFile(storageKey: string, res: any, accept?: string) {
    const rootDir = localMediaRoot();
    const normalizedRoot = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;

    let safeKey = (storageKey || '').replace(/^[\/\\]+/, '');
    if (safeKey.startsWith('file/')) safeKey = safeKey.slice(5).replace(/^[\/\\]+/, '');
    if (!isPublicMediaKey(safeKey)) throw new NotFoundException('Requested media file not found.');

    const { isSafe, absolutePath } = resolveSafeStoragePath(rootDir, safeKey);
    if (!isSafe) {
      throw new NotFoundException('Requested media file not found.');
    }

    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    // 1. Check local disk first (preserves 100% backward compatibility for existing local files)
    if (absolutePath.startsWith(normalizedRoot) && fs.existsSync(absolutePath)) {
      try {
        const stat = fs.statSync(absolutePath);
        if (stat.isFile()) {
          let responsePath = absolutePath;
          if (path.extname(absolutePath).toLowerCase() === '.avif') {
            const vary = String(res.getHeader('Vary') || '').split(',').map((value: string) => value.trim()).filter(Boolean);
            res.header('Vary', [...new Set([...vary, 'Accept'])].join(', '));
            const fallback = avifFallbackFormat(accept);
            if (fallback) responsePath = await compatibleAvifFile(absolutePath, fallback);
          }
          const ext = path.extname(responsePath).toLowerCase();
          if (mimeMap[ext]) {
            res.header('Content-Type', mimeMap[ext]);
          }

          const stream = fs.createReadStream(responsePath);
          res.header('Cache-Control', 'public, max-age=86400');
          res.header('Cross-Origin-Resource-Policy', 'cross-origin');
          res.header('Access-Control-Allow-Origin', '*');
          return res.send(stream);
        }
      } catch {
        // Fall through to remote storage provider check
      }
    }

    // 2. If not on local disk, check the storage provider (Cloudflare R2 / S3)
    const storageProvider = this.mediaService.getStorageProvider();
    if (storageProvider.getObject) {
      const s3Object = await storageProvider.getObject(safeKey);
      if (s3Object && s3Object.stream) {
        const ext = path.extname(safeKey).toLowerCase();

        // Handle AVIF fallback transcoding for browsers lacking AVIF support
        if (ext === '.avif') {
          const vary = String(res.getHeader('Vary') || '').split(',').map((value: string) => value.trim()).filter(Boolean);
          res.header('Vary', [...new Set([...vary, 'Accept'])].join(', '));
          const fallback = avifFallbackFormat(accept);
          if (fallback) {
            const chunks: Buffer[] = [];
            for await (const chunk of s3Object.stream as any) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const converted = await convertAvifBuffer(Buffer.concat(chunks), fallback);
            res.header('Content-Type', fallback === 'webp' ? 'image/webp' : 'image/png');
            res.header('Cache-Control', 'public, max-age=86400');
            res.header('Cross-Origin-Resource-Policy', 'cross-origin');
            res.header('Access-Control-Allow-Origin', '*');
            return res.send(converted);
          }
        }

        res.header('Content-Type', s3Object.contentType || mimeMap[ext] || 'application/octet-stream');
        res.header('Cache-Control', 'public, max-age=86400');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        res.header('Access-Control-Allow-Origin', '*');
        return res.send(s3Object.stream);
      }
    }

    throw new NotFoundException('Requested media file not found.');
  }

  @Public()
  @Get('file/*')
  @ApiOperation({ summary: 'Serve stored media file safely' })
  async serveFile(@Param('*') storageKey: string, @Res() res: any, @Req() req?: any) {
    return this.streamMediaFile(storageKey, res, req?.headers?.accept);
  }

  @Public()
  @Get(':tenantId/:storeId/*')
  @ApiOperation({ summary: 'Serve stored media file safely via tenant/store path' })
  async serveDirectFile(
    @Param('tenantId') tenantId: string,
    @Param('storeId') storeId: string,
    @Param('*') restKey: string,
    @Res() res: any,
    @Req() req?: any
  ) {
    const storageKey = `${tenantId}/${storeId}/${restKey}`;
    return this.streamMediaFile(storageKey, res, req?.headers?.accept);
  }
}

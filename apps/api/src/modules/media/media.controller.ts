import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, Public } from '../../common/decorators';
import { TenantContext } from '@simply/types';
import * as fs from 'fs';
import * as path from 'path';

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

  @Public()
  @Get('file/*')
  @ApiOperation({ summary: 'Serve stored media file safely' })
  async serveFile(@Param('*') storageKey: string, @Res() res: any) {
    const rootDir = path.resolve(process.env.MEDIA_STORAGE_LOCAL_ROOT || './media-storage');
    const safeKey = storageKey.replace(/^[\/\\]+/, '');
    const absolutePath = path.resolve(rootDir, safeKey);

    // Path traversal defense
    if (!absolutePath.startsWith(rootDir) || !fs.existsSync(absolutePath)) {
      throw new NotFoundException('Requested media file not found.');
    }

    const stream = fs.createReadStream(absolutePath);
    res.header('Cache-Control', 'public, max-age=86400');
    return res.send(stream);
  }
}

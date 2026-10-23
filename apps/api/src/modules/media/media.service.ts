import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { StorageProvider } from '@simply/storage';
import { TenantContext } from '@simply/types';
import { validateProductImageBuffer } from '@simply/validation';
import * as path from 'path';

export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaClient,
    @Inject(STORAGE_PROVIDER_TOKEN) private readonly storageProvider: StorageProvider,
  ) {}

  public async uploadProductMedia(
    tenant: TenantContext,
    file: {
      buffer: Buffer;
      originalFilename: string;
      mimeType: string;
    },
    productId: string,
    variantId?: string,
    altText?: string,
  ) {
    // 1. Verify product belongs to current tenant
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId: tenant.tenantId, storeId: tenant.storeId },
    });
    if (!product) throw new NotFoundException('Product not found in this store.');
    if (
      variantId &&
      !(await this.prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId,
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          deletedAt: null,
        },
      }))
    ) {
      throw new NotFoundException('Product variant not found in this store.');
    }

    // 2. Validate real binary magic bytes & file size (5MB limit)
    const validation = validateProductImageBuffer(file.buffer, file.originalFilename);
    if (!validation.isValid || !validation.mimeType) {
      throw new BadRequestException(validation.error || 'Invalid product image file.');
    }

    // Ensure filename has proper extension matching verified MIME type
    let safeFilename = file.originalFilename || `image${validation.extension}`;
    if (!path.extname(safeFilename)) {
      safeFilename = `${safeFilename}${validation.extension}`;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.buffer.length > MAX_SIZE) {
      throw new BadRequestException(`File size ${file.buffer.length} bytes exceeds 5MB limit.`);
    }

    // 3. Upload via Storage Provider (strictly filesystem/cloud, never PostgreSQL binary)
    const uploadResult = await this.storageProvider.upload({
      tenantId: tenant.tenantId,
      storeId: tenant.storeId,
      buffer: file.buffer,
      originalFilename: safeFilename,
      mimeType: validation.mimeType,
      prefix: 'products',
    });

    // 4. Save metadata in PostgreSQL; if DB write fails, rollback uploaded storage file
    try {
      const media = await this.prisma.productMedia.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          productId,
          variantId: variantId || null,
          storageKey: uploadResult.storageKey,
          publicUrl: uploadResult.publicUrl,
          filePath: uploadResult.filePath,
          mimeType: uploadResult.mimeType,
          sizeBytes: uploadResult.sizeBytes,
          altText: altText || product.name,
        },
      });

      return media;
    } catch (dbError: any) {
      this.logger.error(
        `Database record creation failed for media ${uploadResult.storageKey}. Rolling back storage file: ${dbError.message}`,
      );
      await this.storageProvider.delete(uploadResult.storageKey).catch((cleanupError) => {
        this.logger.error(
          `Failed to clean up orphaned storage file ${uploadResult.storageKey}: ${cleanupError.message}`,
        );
      });
      throw dbError;
    }
  }

  /**
   * Upload standalone media asset (for product creation before product ID exists).
   * Persists to storage provider and creates MediaAsset record with dynamic provider type.
   */
  public async uploadStandaloneMediaAsset(
    tenant: TenantContext,
    file: {
      buffer: Buffer;
      originalFilename: string;
      mimeType: string;
    },
    altText?: string,
  ) {
    // 1. Validate real binary magic bytes & file size (5MB limit)
    const validation = validateProductImageBuffer(file.buffer, file.originalFilename);
    if (!validation.isValid || !validation.mimeType) {
      throw new BadRequestException(validation.error || 'Invalid product image file.');
    }

    // Ensure filename has proper extension matching verified MIME type
    let safeFilename = file.originalFilename || `image${validation.extension}`;
    if (!path.extname(safeFilename)) {
      safeFilename = `${safeFilename}${validation.extension}`;
    }

    const uploadResult = await this.storageProvider.upload({
      tenantId: tenant.tenantId,
      storeId: tenant.storeId,
      buffer: file.buffer,
      originalFilename: safeFilename,
      mimeType: validation.mimeType,
      prefix: 'products',
    });

    // Dynamic storage provider (CLOUDFLARE_R2, S3, or LOCAL)
    const storageProviderName =
      this.storageProvider.type ||
      (process.env.MEDIA_STORAGE_DRIVER === 'r2'
        ? 'CLOUDFLARE_R2'
        : process.env.MEDIA_STORAGE_DRIVER === 's3'
        ? 'S3'
        : 'LOCAL');

    try {
      const mediaAsset = await this.prisma.mediaAsset.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          storageProvider: storageProviderName,
          storageKey: uploadResult.storageKey,
          publicUrl: uploadResult.publicUrl,
          fileName: safeFilename,
          mimeType: uploadResult.mimeType,
          sizeBytes: uploadResult.sizeBytes,
          altText: altText || null,
        },
      });

      return mediaAsset;
    } catch (dbError: any) {
      this.logger.error(
        `Database record creation failed for mediaAsset ${uploadResult.storageKey}. Rolling back storage file: ${dbError.message}`,
      );
      await this.storageProvider.delete(uploadResult.storageKey).catch((cleanupError) => {
        this.logger.error(
          `Failed to clean up orphaned storage file ${uploadResult.storageKey}: ${cleanupError.message}`,
        );
      });
      throw dbError;
    }
  }

  /**
   * Upload store brand asset (logo, banner, favicon) with 5MB limit and MIME validation.
   */
  public async uploadStoreAsset(
    tenant: TenantContext,
    file: {
      buffer: Buffer;
      originalFilename: string;
      mimeType: string;
    },
    type: 'logo' | 'banner' | 'favicon',
  ) {
    const validation = validateProductImageBuffer(file.buffer, file.originalFilename);
    if (!validation.isValid || !validation.mimeType) {
      throw new BadRequestException(validation.error || 'Use a JPEG, PNG, WebP or AVIF image.');
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.buffer.length > MAX_SIZE) {
      throw new BadRequestException(`Asset file size ${file.buffer.length} bytes exceeds 5MB limit.`);
    }

    const uploadResult = await this.storageProvider.upload({
      tenantId: tenant.tenantId,
      storeId: tenant.storeId,
      buffer: file.buffer,
      originalFilename: file.originalFilename,
      mimeType: validation.mimeType,
      prefix: 'branding',
    });

    try {
      // If logo or favicon, update StoreBranding directly
      if (type === 'logo') {
        await this.prisma.storeBranding.upsert({
          where: { storeId: tenant.storeId },
          update: { logoUrl: uploadResult.publicUrl },
          create: {
            storeId: tenant.storeId,
            logoUrl: uploadResult.publicUrl,
          },
        });
      } else if (type === 'favicon') {
        await this.prisma.storeBranding.upsert({
          where: { storeId: tenant.storeId },
          update: { faviconUrl: uploadResult.publicUrl },
          create: {
            storeId: tenant.storeId,
            faviconUrl: uploadResult.publicUrl,
          },
        });
      }

      return {
        type,
        publicUrl: uploadResult.publicUrl,
        storageKey: uploadResult.storageKey,
        sizeBytes: uploadResult.sizeBytes,
        mimeType: uploadResult.mimeType,
      };
    } catch (dbError: any) {
      this.logger.error(
        `Database upsert failed for store branding ${uploadResult.storageKey}. Rolling back storage file: ${dbError.message}`,
      );
      await this.storageProvider.delete(uploadResult.storageKey).catch((cleanupError) => {
        this.logger.error(
          `Failed to clean up orphaned storage file ${uploadResult.storageKey}: ${cleanupError.message}`,
        );
      });
      throw dbError;
    }
  }

  public async deleteProductMedia(tenant: TenantContext, mediaId: string) {
    const media = await this.prisma.productMedia.findFirst({
      where: { id: mediaId, tenantId: tenant.tenantId, storeId: tenant.storeId },
    });
    if (!media) throw new NotFoundException('Media item not found.');

    // Delete physical file from storage provider first
    try {
      await this.storageProvider.delete(media.storageKey);
    } catch (error: any) {
      this.logger.error(`Storage deletion failed for ${media.storageKey}: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete media asset from storage provider.');
    }

    // Delete database record only after storage file is successfully removed
    await this.prisma.productMedia.delete({
      where: { id: media.id },
    });

    return { success: true, message: 'Media deleted successfully.' };
  }

  public getStorageProvider(): StorageProvider {
    return this.storageProvider;
  }
}

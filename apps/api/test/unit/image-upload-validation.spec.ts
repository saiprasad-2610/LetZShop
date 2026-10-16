import {
  detectImageFormatFromBytes,
  validateProductImageBuffer,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
} from '@simply/validation';
import { MediaService } from '../../src/modules/media/media.service';
import { BadRequestException } from '@nestjs/common';

describe('Product Image File Selection, Magic Bytes & Upload Validation Suite', () => {
  // Sample buffers with real magic headers
  const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const validWebpBuffer = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8 \x14\x00\x00\x00');
  const validAvifBuffer = Buffer.from('\x00\x00\x00\x1cftypavif\x00\x00\x00\x00avifmif1');
  const validHeicBuffer = Buffer.from('\x00\x00\x00\x18ftypheic\x00\x00\x00\x00mif1heic');
  const fakeExeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00');
  const fakePdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n');

  describe('1. Binary Magic Bytes Sniffing', () => {
    it('accurately identifies JPEG from magic bytes', () => {
      const res = detectImageFormatFromBytes(validJpgBuffer);
      expect(res).not.toBeNull();
      expect(res?.mimeType).toBe('image/jpeg');
      expect(res?.extension).toBe('.jpg');
      expect(res?.isSupportedProductFormat).toBe(true);
    });

    it('accurately identifies PNG from magic bytes', () => {
      const res = detectImageFormatFromBytes(validPngBuffer);
      expect(res).not.toBeNull();
      expect(res?.mimeType).toBe('image/png');
      expect(res?.extension).toBe('.png');
      expect(res?.isSupportedProductFormat).toBe(true);
    });

    it('accurately identifies WebP from magic bytes', () => {
      const res = detectImageFormatFromBytes(validWebpBuffer);
      expect(res).not.toBeNull();
      expect(res?.mimeType).toBe('image/webp');
      expect(res?.extension).toBe('.webp');
      expect(res?.isSupportedProductFormat).toBe(true);
    });

    it('accurately identifies AVIF from magic bytes', () => {
      const res = detectImageFormatFromBytes(validAvifBuffer);
      expect(res).not.toBeNull();
      expect(res?.mimeType).toBe('image/avif');
      expect(res?.extension).toBe('.avif');
      expect(res?.isSupportedProductFormat).toBe(true);
    });

    it('detects HEIC format and marks it as unsupported product format', () => {
      const res = detectImageFormatFromBytes(validHeicBuffer);
      expect(res).not.toBeNull();
      expect(res?.mimeType).toBe('image/heic');
      expect(res?.isHeic).toBe(true);
      expect(res?.isSupportedProductFormat).toBe(false);
    });

    it('returns null for non-image buffers like executables and PDFs', () => {
      expect(detectImageFormatFromBytes(fakeExeBuffer)).toBeNull();
      expect(detectImageFormatFromBytes(fakePdfBuffer)).toBeNull();
    });
  });

  describe('2. Product Image Buffer Validation Rules', () => {
    it('accepts valid JPEG, PNG, WebP, and AVIF files', () => {
      expect(validateProductImageBuffer(validJpgBuffer, 'photo.jpg').isValid).toBe(true);
      expect(validateProductImageBuffer(validPngBuffer, 'product.png').isValid).toBe(true);
      expect(validateProductImageBuffer(validWebpBuffer, 'banner.webp').isValid).toBe(true);
      expect(validateProductImageBuffer(validAvifBuffer, 'item.avif').isValid).toBe(true);
    });

    it('validates images without file extensions (e.g. WhatsApp downloads)', () => {
      const res = validateProductImageBuffer(validJpgBuffer, 'WhatsApp Image 2026-10-08 at 18.13.32');
      expect(res.isValid).toBe(true);
      expect(res.mimeType).toBe('image/jpeg');
      expect(res.extension).toBe('.jpg');
    });

    it('rejects HEIC with specific friendly user instruction', () => {
      const res = validateProductImageBuffer(validHeicBuffer, 'IMG_9941.heic');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('HEIC images are not currently supported. Please upload JPG, PNG or WebP.');
    });

    it('rejects renamed non-image executable (e.g. virus.exe renamed to product.jpg)', () => {
      const res = validateProductImageBuffer(fakeExeBuffer, 'product.jpg');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('not a supported image format');
    });

    it('rejects file larger than 5MB limit', () => {
      const largeBuffer = Buffer.alloc(MAX_PRODUCT_IMAGE_SIZE_BYTES + 1024);
      validJpgBuffer.copy(largeBuffer, 0, 0, 12); // Has valid JPG header but > 5MB
      const res = validateProductImageBuffer(largeBuffer, 'large_photo.jpg');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Image file size exceeds the 5MB limit. Please upload an image under 5MB.');
    });

    it('rejects 0-byte empty file', () => {
      const res = validateProductImageBuffer(Buffer.alloc(0), 'empty.jpg');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('empty');
    });
  });

  describe('3. Backend MediaService Standalone Upload Integration', () => {
    let mediaService: MediaService;
    let mockPrisma: any;
    let mockStorage: any;

    const tenant = {
      tenantId: 'tenant-123',
      storeId: 'store-456',
      role: 'SELLER_OWNER',
    } as any;

    beforeEach(() => {
      mockPrisma = {
        mediaAsset: {
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({
              id: 'media-asset-uuid-1',
              ...data,
            })
          ),
        },
      };
      mockStorage = {
        upload: jest.fn().mockImplementation((input) =>
          Promise.resolve({
            storageKey: `${input.tenantId}/${input.storeId}/products/unique.jpg`,
            publicUrl: `http://localhost:4000/media/${input.tenantId}/${input.storeId}/products/unique.jpg`,
            filePath: `/tmp/${input.originalFilename}`,
            mimeType: input.mimeType,
            sizeBytes: input.buffer.length,
          })
        ),
      };

      mediaService = new MediaService(mockPrisma, mockStorage);
    });

    it('uploads valid JPEG and saves canonical media asset record', async () => {
      const result = await mediaService.uploadStandaloneMediaAsset(tenant, {
        buffer: validJpgBuffer,
        originalFilename: 'product-front.jpg',
        mimeType: 'image/jpeg',
      });

      expect(result.id).toBe('media-asset-uuid-1');
      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'image/jpeg',
          originalFilename: 'product-front.jpg',
        })
      );
    });

    it('rejects renamed executable disguised as JPG with BadRequestException', async () => {
      await expect(
        mediaService.uploadStandaloneMediaAsset(tenant, {
          buffer: fakeExeBuffer,
          originalFilename: 'sneaky-malware.jpg',
          mimeType: 'image/jpeg',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects HEIC upload with BadRequestException explaining lack of HEIC support', async () => {
      await expect(
        mediaService.uploadStandaloneMediaAsset(tenant, {
          buffer: validHeicBuffer,
          originalFilename: 'iphone-shot.heic',
          mimeType: 'image/heic',
        })
      ).rejects.toThrow('HEIC images are not currently supported. Please upload JPG, PNG or WebP.');
    });

    it('automatically ensures file without extension receives verified extension (.jpg)', async () => {
      await mediaService.uploadStandaloneMediaAsset(tenant, {
        buffer: validJpgBuffer,
        originalFilename: 'WhatsApp Image 2026-10-08',
        mimeType: 'image/jpeg',
      });

      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          originalFilename: 'WhatsApp Image 2026-10-08.jpg',
        })
      );
    });
  });
});

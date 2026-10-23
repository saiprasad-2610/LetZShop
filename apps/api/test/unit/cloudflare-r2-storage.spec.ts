import {
  S3StorageProvider,
  StorageFactory,
  UploadFileInput,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@simply/storage';
import { Readable } from 'stream';
import { MediaService, STORAGE_PROVIDER_TOKEN } from '../../src/modules/media/media.service';
import { VerificationService, PRIVATE_STORAGE_PROVIDER_TOKEN } from '../../src/modules/verification/verification.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, MerchantDocumentType, MerchantDocumentStatus } from '@prisma/client';
import { MailService } from '../../src/modules/notifications/mail.service';
import { TenantContext } from '@simply/types';
import { InternalServerErrorException } from '@nestjs/common';

describe('Cloudflare R2 Storage Provider (Unit Tests with Mocked S3 Client)', () => {
  let mockSend: jest.Mock;
  let mockS3Client: any;
  let publicProvider: S3StorageProvider;
  let privateProvider: S3StorageProvider;

  beforeEach(() => {
    mockSend = jest.fn();
    mockS3Client = { send: mockSend };

    publicProvider = new S3StorageProvider({
      bucket: 'letzshop-public-media',
      region: 'auto',
      publicUrlPrefix: 'https://media.letzshop.store',
      driver: 'r2',
      s3Client: mockS3Client,
    });

    privateProvider = new S3StorageProvider({
      bucket: 'letzshop-private-documents',
      region: 'auto',
      publicUrlPrefix: '', // Private documents have no public URL
      driver: 'r2',
      s3Client: mockS3Client,
    });
  });

  describe('1. S3StorageProvider & Cloudflare R2 Operations', () => {
    it('identifies its provider type as CLOUDFLARE_R2 when configured with driver r2', () => {
      expect(publicProvider.type).toBe('CLOUDFLARE_R2');
      expect(privateProvider.type).toBe('CLOUDFLARE_R2');

      const s3Provider = new S3StorageProvider({
        bucket: 'my-s3-bucket',
        driver: 's3',
        s3Client: mockS3Client,
      });
      expect(s3Provider.type).toBe('S3');
    });

    it('uploads public media to letzshop-public-media with tenant-aware key and returns publicUrl', async () => {
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });

      const buffer = Buffer.from('fake image content');
      const input: UploadFileInput = {
        tenantId: 'tenant-abc',
        storeId: 'store-123',
        buffer,
        originalFilename: 'product-photo.jpg',
        mimeType: 'image/jpeg',
        prefix: 'products',
      };

      const result = await publicProvider.upload(input);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input.Bucket).toBe('letzshop-public-media');
      expect(command.input.ContentType).toBe('image/jpeg');
      expect(command.input.ContentLength).toBe(buffer.length);
      expect(command.input.Key).toMatch(/^tenant-abc\/store-123\/products\/[a-f0-9-]+\.jpg$/);
      expect(command.input.Metadata.tenantId).toBe('tenant-abc');
      expect(command.input.Metadata.storeId).toBe('store-123');

      expect(result.storageKey).toBe(command.input.Key);
      expect(result.filePath).toBe(`s3://letzshop-public-media/${command.input.Key}`);
      expect(result.publicUrl).toBe(`https://media.letzshop.store/${command.input.Key}`);
      expect(result.sizeBytes).toBe(buffer.length);
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('uploads private verification document to letzshop-private-documents without publicUrl', async () => {
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });

      const pdfBuffer = Buffer.from('%PDF-1.4 test verification document');
      const input: UploadFileInput = {
        tenantId: 'tenant-abc',
        buffer: pdfBuffer,
        originalFilename: 'pan-card.pdf',
        mimeType: 'application/pdf',
        prefix: 'private-documents',
        storageKey: 'private-documents/tenant-abc/pan-card-123.pdf',
      };

      const result = await privateProvider.upload(input);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input.Bucket).toBe('letzshop-private-documents');
      expect(command.input.Key).toBe('private-documents/tenant-abc/pan-card-123.pdf');
      expect(command.input.ContentType).toBe('application/pdf');

      // Private documents must have NO publicUrl
      expect(result.publicUrl).toBe('');
      expect(result.storageKey).toBe('private-documents/tenant-abc/pan-card-123.pdf');
    });

    it('enforces file size limits and rejects oversized buffers', async () => {
      const limitedProvider = new S3StorageProvider({
        bucket: 'letzshop-public-media',
        maxSizeBytes: 500,
        s3Client: mockS3Client,
      });

      const oversized = Buffer.alloc(1000);
      await expect(
        limitedProvider.upload({
          tenantId: 't1',
          storeId: 's1',
          buffer: oversized,
          originalFilename: 'test.jpg',
          mimeType: 'image/jpeg',
        }),
      ).rejects.toThrow(/exceeds maximum limit/);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('enforces MIME validation and rejects disallowed types', async () => {
      const strictProvider = new S3StorageProvider({
        bucket: 'letzshop-public-media',
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        s3Client: mockS3Client,
      });

      await expect(
        strictProvider.upload({
          tenantId: 't1',
          storeId: 's1',
          buffer: Buffer.from('shell'),
          originalFilename: 'script.sh',
          mimeType: 'application/x-sh',
        }),
      ).rejects.toThrow(/Unsupported MIME type/);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('checks object existence via HeadObjectCommand and handles 404 cleanly', async () => {
      // 1. Existing object
      mockSend.mockResolvedValueOnce({
        ContentLength: 1234,
        ContentType: 'image/jpeg',
      });
      const exists = await publicProvider.exists('tenant/store/products/photo.jpg');
      expect(exists).toBe(true);
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);

      // 2. Missing object (NoSuchKey / NotFound 404)
      const notFoundError: any = new Error('NotFound');
      notFoundError.name = 'NotFound';
      notFoundError.$metadata = { httpStatusCode: 404 };
      mockSend.mockRejectedValueOnce(notFoundError);

      const notFoundExists = await publicProvider.exists('tenant/store/products/missing.jpg');
      expect(notFoundExists).toBe(false);

      // 3. Network or service error (should throw)
      mockSend.mockRejectedValueOnce(new Error('Connection refused'));
      await expect(publicProvider.exists('tenant/store/products/error.jpg')).rejects.toThrow(
        'Connection refused',
      );
    });

    it('retrieves object metadata and handles missing files', async () => {
      const lastModified = new Date();
      mockSend.mockResolvedValueOnce({
        ContentLength: 54321,
        ContentType: 'image/png',
        LastModified: lastModified,
        ETag: '"etag-12345"',
      });

      const meta = await publicProvider.getMetadata('tenant/store/products/logo.png');
      expect(meta).toEqual({
        storageKey: 'tenant/store/products/logo.png',
        sizeBytes: 54321,
        mimeType: 'image/png',
        lastModified,
        etag: 'etag-12345',
      });

      // 404 returns null
      const notFoundError: any = new Error('NoSuchKey');
      notFoundError.name = 'NoSuchKey';
      notFoundError.$metadata = { httpStatusCode: 404 };
      mockSend.mockRejectedValueOnce(notFoundError);

      const missingMeta = await publicProvider.getMetadata('tenant/store/products/missing.png');
      expect(missingMeta).toBeNull();
    });

    it('deletes an object via DeleteObjectCommand and throws on real service failure', async () => {
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } });
      const deleted = await publicProvider.delete('tenant/store/products/photo.jpg');
      expect(deleted).toBe(true);
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand);

      // S3 error throws so caller can handle failure
      mockSend.mockRejectedValueOnce(new Error('S3 Access Denied'));
      await expect(publicProvider.delete('tenant/store/products/error.jpg')).rejects.toThrow(
        'S3 Access Denied',
      );
    });

    it('retrieves object stream via GetObjectCommand', async () => {
      const stream = Readable.from(['hello cloudflare r2']);
      mockSend.mockResolvedValueOnce({
        Body: stream,
        ContentType: 'image/jpeg',
        ContentLength: 19,
      });

      const obj = await publicProvider.getObject('tenant/store/products/photo.jpg');
      expect(obj).not.toBeNull();
      expect(obj?.contentType).toBe('image/jpeg');
      expect(obj?.contentLength).toBe(19);
      expect(obj?.stream).toBeDefined();

      const notFoundError: any = new Error('NoSuchKey');
      notFoundError.name = 'NoSuchKey';
      notFoundError.$metadata = { httpStatusCode: 404 };
      mockSend.mockRejectedValueOnce(notFoundError);

      const missingObj = await publicProvider.getObject('tenant/store/products/missing.jpg');
      expect(missingObj).toBeNull();
    });

    it('generates presigned URLs for secure authorized access', async () => {
      const realConfigProvider = new S3StorageProvider({
        bucket: 'letzshop-private-documents',
        region: 'auto',
        endpoint: 'https://test.r2.cloudflarestorage.com',
        accessKeyId: 'test-access-key-id',
        secretAccessKey: 'test-secret-access-key-secret-32-chars',
      });
      const signedUrl = await realConfigProvider.getSignedUrl(
        'private-documents/tenant/doc.pdf',
        300,
      );
      expect(typeof signedUrl).toBe('string');
      expect(signedUrl).toContain('letzshop-private-documents');
      expect(signedUrl).toContain('X-Amz-Signature');
    });
  });

  describe('2. StorageFactory Driver Instantiation', () => {
    it('creates LocalDiskStorageProvider when driver is "local"', () => {
      const provider = StorageFactory.create({
        driver: 'local',
        localConfig: {
          rootDir: './test-media',
          publicUrlPrefix: 'http://localhost:4000/media',
        },
      });
      expect(provider.type).toBe('LOCAL');
    });

    it('creates S3StorageProvider when driver is "r2" or "s3"', () => {
      const r2Provider = StorageFactory.create({
        driver: 'r2',
        s3Config: {
          bucket: 'letzshop-public-media',
          endpoint: 'https://test-account.r2.cloudflarestorage.com',
          s3Client: mockS3Client,
        },
      });
      expect(r2Provider.type).toBe('CLOUDFLARE_R2');

      const s3Provider = StorageFactory.create({
        driver: 's3',
        s3Config: {
          bucket: 'my-s3-bucket',
          region: 'ap-south-1',
          s3Client: mockS3Client,
        },
      });
      expect(s3Provider.type).toBe('S3');
    });

    it('throws error when required config is missing', () => {
      expect(() => StorageFactory.create({ driver: 'local' })).toThrow(/LocalDiskStorageConfig is required/);
      expect(() => StorageFactory.create({ driver: 'r2' })).toThrow(/S3StorageConfig is required/);
    });
  });

  describe('3. MediaService R2 Integration & Consistency Handling', () => {
    let mediaService: MediaService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        product: { findFirst: jest.fn() },
        productVariant: { findFirst: jest.fn() },
        productMedia: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
        mediaAsset: { create: jest.fn() },
        storeBranding: { upsert: jest.fn() },
      };

      mediaService = new MediaService(mockPrisma as any, publicProvider);
    });

    const tenant: TenantContext = {
      tenantId: 'tenant-test',
      storeId: 'store-test',
    };

    // Valid 1x1 PNG binary buffer
    const validPngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d4' +
      'b0000000049454e44ae426082',
      'hex',
    );

    it('uploads standalone media asset with dynamic CLOUDFLARE_R2 storageProvider type', async () => {
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });
      mockPrisma.mediaAsset.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'asset-1', ...data }));

      const asset = await mediaService.uploadStandaloneMediaAsset(tenant, {
        buffer: validPngBuffer,
        originalFilename: 'product-display.png',
        mimeType: 'image/png',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockPrisma.mediaAsset.create).toHaveBeenCalledTimes(1);
      const createdData = mockPrisma.mediaAsset.create.mock.calls[0][0].data;

      // Verifies defect fix: storageProvider is dynamically set to CLOUDFLARE_R2 instead of hardcoded LOCAL
      expect(createdData.storageProvider).toBe('CLOUDFLARE_R2');
      expect(createdData.publicUrl).toContain('https://media.letzshop.store/tenant-test/store-test/products/');
      expect(asset.storageProvider).toBe('CLOUDFLARE_R2');
    });

    it('rolls back uploaded R2 object if database insert fails', async () => {
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } }); // PutObject succeeds
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // DeleteObject cleanup succeeds
      mockPrisma.mediaAsset.create.mockRejectedValueOnce(new Error('PostgreSQL connection lost'));

      await expect(
        mediaService.uploadStandaloneMediaAsset(tenant, {
          buffer: validPngBuffer,
          originalFilename: 'product-display.png',
          mimeType: 'image/png',
        }),
      ).rejects.toThrow('PostgreSQL connection lost');

      // Verifies storage cleanup DeleteObjectCommand was sent to prevent orphaned file
      expect(mockSend).toHaveBeenCalledTimes(2);
      const deleteCommand = mockSend.mock.calls[1][0];
      expect(deleteCommand).toBeInstanceOf(DeleteObjectCommand);
      expect(deleteCommand.input.Bucket).toBe('letzshop-public-media');
    });

    it('does not delete database record if storage deletion fails', async () => {
      mockPrisma.productMedia.findFirst.mockResolvedValueOnce({
        id: 'media-1',
        tenantId: tenant.tenantId,
        storeId: tenant.storeId,
        storageKey: 'tenant-test/store-test/products/photo.jpg',
      });

      // Storage deletion fails
      mockSend.mockRejectedValueOnce(new Error('Cloudflare R2 timeout'));

      await expect(mediaService.deleteProductMedia(tenant, 'media-1')).rejects.toThrow(
        InternalServerErrorException,
      );

      // Verifies Prisma record was NOT deleted
      expect(mockPrisma.productMedia.delete).not.toHaveBeenCalled();
    });
  });

  describe('4. VerificationService Private Documents R2 Integration', () => {
    let verificationService: VerificationService;
    let mockPrisma: any;
    let mockMailService: any;

    beforeEach(() => {
      mockPrisma = {
        tenant: { findUnique: jest.fn(), update: jest.fn() },
        merchantDocument: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
        auditLog: { create: jest.fn() },
        $transaction: jest.fn(),
      };
      mockMailService = { sendVerificationStatusUpdate: jest.fn() };

      verificationService = new VerificationService(
        mockPrisma as any,
        mockMailService as any,
        privateProvider,
      );
    });

    // Valid PDF buffer: "%PDF-1.4"
    const validPdfBuffer = Buffer.from('%PDF-1.4 fake pdf content for business verification');

    it('uploads business document to private R2 bucket and cleans up if DB transaction fails', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({ id: 'tenant-99', businessType: 'SOLE_PROPRIETORSHIP' });
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } }); // PutObject succeeds
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // DeleteObject cleanup succeeds

      // Transaction fails
      mockPrisma.$transaction.mockRejectedValueOnce(new Error('Database lock error'));

      await expect(
        verificationService.uploadDocument('tenant-99', 'user-1', {
          type: 'PAN',
          documentNumber: 'ABCDE1234F',
          filename: 'pan.pdf',
          mimeType: 'application/pdf',
          base64Data: validPdfBuffer.toString('base64'),
        }),
      ).rejects.toThrow('Database lock error');

      // PutObject to private bucket followed by DeleteObject cleanup
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[0][0].input.Bucket).toBe('letzshop-private-documents');
      expect(mockSend.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand);
    });

    it('streams private document from R2 storage with IDOR protection and audit logging', async () => {
      const fakeStream = Readable.from(['pdf file content']);
      mockPrisma.merchantDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        tenantId: 'tenant-99',
        storageKey: 'private-documents/tenant-99/doc.pdf',
        mimeType: 'application/pdf',
        originalFilename: 'pan.pdf',
        type: 'PAN',
        status: 'PENDING_REVIEW',
        createdAt: new Date(),
        updatedAt: new Date(),
        uploadedAt: new Date(),
      });

      mockSend.mockResolvedValueOnce({
        Body: fakeStream,
        ContentType: 'application/pdf',
      });

      const result = await verificationService.getDocumentStream('doc-1', 'tenant-99', false);

      expect(result.stream).toBeDefined();
      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toBe('pan.pdf');

      // Verifies audit log created for sensitive view
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'DOCUMENT_DOWNLOADED',
            entityType: 'MerchantDocument',
            entityId: 'doc-1',
          }),
        }),
      );
    });

    it('enforces IDOR protection when merchant attempts to view another merchant document', async () => {
      mockPrisma.merchantDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        tenantId: 'tenant-A',
        storageKey: 'private-documents/tenant-A/doc.pdf',
        mimeType: 'application/pdf',
        originalFilename: 'pan.pdf',
      });

      // Tenant B requests Tenant A document
      await expect(
        verificationService.getDocumentStream('doc-1', 'tenant-B', false),
      ).rejects.toThrow('Access denied');

      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});

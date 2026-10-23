import { S3StorageProvider, PutObjectCommand, DeleteObjectCommand } from '@simply/storage';
import { Readable } from 'stream';

const mockMkdirSync = jest.fn();
const mockWriteFileSync = jest.fn();
let overrideExistsSync: boolean | null = null;

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: (...args: any[]) => {
      if (overrideExistsSync !== null) {
        return overrideExistsSync;
      }
      return actualFs.existsSync(...args);
    },
    mkdirSync: (...args: any[]) => mockMkdirSync(...args),
    writeFileSync: (...args: any[]) => mockWriteFileSync(...args),
  };
});

import { VerificationService } from '../../src/modules/verification/verification.service';

describe('VerificationService Production Docker Read-Only Filesystem Regression Tests', () => {
  let mockPrisma: any;
  let mockMailService: any;
  let mockS3Send: jest.Mock;
  let r2Provider: S3StorageProvider;
  let s3Provider: S3StorageProvider;

  const validPdfBuffer = Buffer.from('%PDF-1.4 test document for verification');

  beforeEach(() => {
    jest.clearAllMocks();
    overrideExistsSync = null;

    mockPrisma = {
      tenant: { findUnique: jest.fn(), update: jest.fn() },
      merchantDocument: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    mockMailService = {
      sendAdminMerchantEmail: jest.fn().mockResolvedValue(true),
    };

    mockS3Send = jest.fn();
    const mockS3Client = { send: mockS3Send };

    r2Provider = new S3StorageProvider({
      bucket: 'letzshop-private-documents',
      region: 'auto',
      publicUrlPrefix: '',
      driver: 'r2',
      s3Client: mockS3Client as any,
    });

    s3Provider = new S3StorageProvider({
      bucket: 'letzshop-private-documents',
      region: 'us-east-1',
      publicUrlPrefix: '',
      driver: 's3',
      s3Client: mockS3Client as any,
    });
  });

  it('starts successfully in R2 mode on a read-only filesystem without calling mkdirSync (ENOENT prevention)', () => {
    // Simulate read-only container error if mkdirSync is ever attempted
    mockMkdirSync.mockImplementation(() => {
      const err: any = new Error(
        "ENOENT: no such file or directory, mkdir '/app/apps/api/media-storage/private-documents'",
      );
      err.code = 'ENOENT';
      throw err;
    });

    // When MEDIA_STORAGE_DRIVER is r2, VerificationService must initialize without error
    let service: VerificationService | undefined;
    expect(() => {
      service = new VerificationService(
        mockPrisma as any,
        mockMailService as any,
        r2Provider,
      );
    }).not.toThrow();

    expect(service).toBeDefined();
    expect(mockMkdirSync).not.toHaveBeenCalled();
  });

  it('starts successfully in S3 mode on a read-only filesystem without calling mkdirSync', () => {
    mockMkdirSync.mockImplementation(() => {
      const err: any = new Error('EROFS: read-only file system, mkdir');
      err.code = 'EROFS';
      throw err;
    });

    let service: VerificationService | undefined;
    expect(() => {
      service = new VerificationService(
        mockPrisma as any,
        mockMailService as any,
        s3Provider,
      );
    }).not.toThrow();

    expect(service).toBeDefined();
    expect(mockMkdirSync).not.toHaveBeenCalled();
  });

  it('handles local storage directory creation failures gracefully without throwing fatal errors', () => {
    overrideExistsSync = false;
    mockMkdirSync.mockImplementationOnce(() => {
      const err: any = new Error('EACCES: permission denied, mkdir');
      err.code = 'EACCES';
      throw err;
    });

    const mockLocalProvider = {
      type: 'LOCAL',
      upload: jest.fn(),
      delete: jest.fn(),
      getUrl: jest.fn(),
      getMetadata: jest.fn(),
      exists: jest.fn(),
    };

    try {
      let service: VerificationService | undefined;
      expect(() => {
        service = new VerificationService(
          mockPrisma as any,
          mockMailService as any,
          mockLocalProvider as any,
        );
      }).not.toThrow();

      expect(service).toBeDefined();
      expect(mockMkdirSync).toHaveBeenCalled();
    } finally {
      overrideExistsSync = null;
    }
  });

  it('performs private document upload and rollback in R2 mode without writing to local filesystem', async () => {
    mockMkdirSync.mockImplementation(() => {
      throw new Error('EROFS: read-only file system');
    });
    mockWriteFileSync.mockImplementation(() => {
      throw new Error('EROFS: read-only file system');
    });

    const service = new VerificationService(
      mockPrisma as any,
      mockMailService as any,
      r2Provider,
    );

    mockPrisma.tenant.findUnique.mockResolvedValueOnce({
      id: 'tenant-ro',
      businessType: 'SOLE_PROPRIETORSHIP',
    });
    mockS3Send.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } }); // PutObject succeeds
    mockS3Send.mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // DeleteObject cleanup succeeds

    // DB transaction fails -> triggers rollback
    mockPrisma.$transaction.mockRejectedValueOnce(new Error('Simulated DB deadlock error'));

    await expect(
      service.uploadDocument('tenant-ro', 'user-1', {
        type: 'PAN',
        documentNumber: 'ABCDE1234F',
        filename: 'pan.pdf',
        mimeType: 'application/pdf',
        base64Data: validPdfBuffer.toString('base64'),
      }),
    ).rejects.toThrow('Simulated DB deadlock error');

    // S3 commands should have been sent to Cloudflare R2: PutObject then DeleteObject
    expect(mockS3Send).toHaveBeenCalledTimes(2);
    expect(mockS3Send.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
    expect(mockS3Send.mock.calls[0][0].input.Bucket).toBe('letzshop-private-documents');
    expect(mockS3Send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand);
    expect(mockS3Send.mock.calls[1][0].input.Bucket).toBe('letzshop-private-documents');

    // No local filesystem write or directory creation was attempted
    expect(mockMkdirSync).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('retrieves private document in R2 mode from cloud storage provider without touching local disk', async () => {
    const service = new VerificationService(
      mockPrisma as any,
      mockMailService as any,
      r2Provider,
    );

    const fakeStream = Readable.from(['secure private pdf content']);
    mockPrisma.merchantDocument.findUnique.mockResolvedValueOnce({
      id: 'doc-ro-1',
      tenantId: 'tenant-ro',
      storageKey: 'private-documents/tenant-ro/pan.pdf',
      mimeType: 'application/pdf',
      originalFilename: 'pan.pdf',
      type: 'PAN',
      status: 'VERIFIED',
      createdAt: new Date(),
      updatedAt: new Date(),
      uploadedAt: new Date(),
    });

    mockS3Send.mockResolvedValueOnce({
      Body: fakeStream,
      ContentType: 'application/pdf',
    });

    const result = await service.getDocumentStream('doc-ro-1', 'tenant-ro', false);

    expect(result.stream).toBeDefined();
    expect(result.mimeType).toBe('application/pdf');
    expect(result.filename).toBe('pan.pdf');
    expect(mockMkdirSync).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });
});

import {
  StorageProvider,
  UploadFileInput,
  UploadFileResult,
  FileMetadata,
} from './storage-provider.interface';

export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrlPrefix: string;
}

/**
 * Production-ready interface scaffold for Amazon S3 / Cloudflare R2 / MinIO / Google Cloud Storage.
 * Conforms identically to StorageProvider so application business logic remains 100% agnostic.
 */
export class S3StorageProvider implements StorageProvider {
  private readonly config: S3StorageConfig;

  constructor(config: S3StorageConfig) {
    this.config = config;
  }

  public async upload(input: UploadFileInput): Promise<UploadFileResult> {
    const extension = input.originalFilename.split('.').pop() || 'bin';
    const uniqueKey = `${input.tenantId}/${input.storeId}/${input.prefix || 'media'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const publicUrl = `${this.config.publicUrlPrefix.replace(/\/$/, '')}/${uniqueKey}`;

    // Note: In production, inject @aws-sdk/client-s3 PutObjectCommand here.
    return {
      storageKey: uniqueKey,
      filePath: `s3://${this.config.bucket}/${uniqueKey}`,
      publicUrl,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
    };
  }

  public async delete(storageKey: string): Promise<boolean> {
    // Note: In production, inject @aws-sdk/client-s3 DeleteObjectCommand here.
    return true;
  }

  public getUrl(storageKey: string): string {
    return `${this.config.publicUrlPrefix.replace(/\/$/, '')}/${storageKey}`;
  }

  public async getMetadata(storageKey: string): Promise<FileMetadata | null> {
    // Note: In production, inject @aws-sdk/client-s3 HeadObjectCommand here.
    return {
      storageKey,
      sizeBytes: 0,
      mimeType: 'application/octet-stream',
      lastModified: new Date(),
    };
  }

  public async exists(storageKey: string): Promise<boolean> {
    // Note: In production, inject @aws-sdk/client-s3 HeadObjectCommand here.
    return true;
  }
}

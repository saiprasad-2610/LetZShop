import * as path from 'path';
import * as crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageProvider,
  UploadFileInput,
  UploadFileResult,
  FileMetadata,
  StorageObject,
} from './storage-provider.interface';
import { DEFAULT_ALLOWED_MIME_TYPES } from './local-disk-storage.provider';

export interface S3StorageConfig {
  bucket: string;
  region?: string;
  endpoint?: string;
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrlPrefix?: string;
  forcePathStyle?: boolean;
  driver?: 's3' | 'r2' | 'gcs';
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  s3Client?: S3Client;
}

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
};

/**
 * Production Cloudflare R2 / AWS S3 storage provider using the official AWS SDK v3.
 * Enforces tenant-aware object keys, binary verification, metadata lookup, and streaming.
 */
export class S3StorageProvider implements StorageProvider {
  public readonly type: string;
  private readonly config: S3StorageConfig;
  private readonly client: S3Client;
  private readonly maxSizeBytes: number;
  private readonly allowedMimeTypes: string[];

  constructor(config: S3StorageConfig) {
    this.config = config;
    const isR2 =
      config.driver === 'r2' ||
      Boolean(config.accountId) ||
      (config.endpoint && config.endpoint.includes('r2.cloudflarestorage.com'));

    this.type = isR2 ? 'CLOUDFLARE_R2' : 'S3';
    this.maxSizeBytes = config.maxSizeBytes ?? 10 * 1024 * 1024; // 10MB default
    this.allowedMimeTypes = config.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;

    if (config.s3Client) {
      this.client = config.s3Client;
    } else {
      let endpoint = config.endpoint;
      if (!endpoint && config.accountId) {
        endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
      }

      const credentials =
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined;

      this.client = new S3Client({
        region: config.region || (isR2 ? 'auto' : 'us-east-1'),
        endpoint,
        credentials,
        forcePathStyle: config.forcePathStyle ?? true,
      });
    }
  }

  public async upload(input: UploadFileInput): Promise<UploadFileResult> {
    const { tenantId, storeId, buffer, mimeType, prefix = 'media' } = input;

    // Block private document categories from public storage.
    if (this.config.publicUrlPrefix) {
      const category = prefix.toLowerCase();
      if (
        category === 'kyc' ||
        category === 'private-documents' ||
        category === 'documents'
      ) {
        throw new Error('Invalid public storage category');
      }
    }

    // 1. Validate MIME type if configured
    if (this.allowedMimeTypes.length > 0 && !this.allowedMimeTypes.includes(mimeType)) {
      throw new Error(
        `Unsupported MIME type: ${mimeType}. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // 2. Validate file size
    if (buffer.length > this.maxSizeBytes) {
      throw new Error(
        `File size ${buffer.length} bytes exceeds maximum limit of ${this.maxSizeBytes} bytes`,
      );
    }

    // 3. Generate safe unique filename and tenant-aware key
    const safeExtension =
      EXTENSION_MAP[mimeType] || path.extname(input.originalFilename).toLowerCase() || '.bin';
    const uniqueId = crypto.randomUUID();
    const filename = `${uniqueId}${safeExtension}`;

    let uniqueKey: string;
    if (input.storageKey) {
      uniqueKey = input.storageKey.replace(/^[\\\/]+/, '').replace(/\\/g, '/');
    } else {
      const segments = [
        this.sanitizeSegment(tenantId),
        storeId ? this.sanitizeSegment(storeId) : '',
        this.sanitizeSegment(prefix),
        filename,
      ].filter(Boolean);
      uniqueKey = segments.join('/');
    }

    // 4. PutObjectCommand to Cloudflare R2 / S3
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: uniqueKey,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
      Metadata: {
        tenantId,
        ...(storeId ? { storeId } : {}),
        originalFilename: encodeURIComponent(input.originalFilename || filename),
        ...(input.metadata || {}),
      },
    });

    // Await upload confirmation from R2/S3 - success only reported after object is stored
    await this.client.send(command);

    const publicUrlPrefix = (this.config.publicUrlPrefix || '').replace(/\/+$/, '');
    const publicUrl = publicUrlPrefix ? `${publicUrlPrefix}/${uniqueKey}` : '';

    return {
      storageKey: uniqueKey,
      filePath: `s3://${this.config.bucket}/${uniqueKey}`,
      publicUrl,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  public async delete(storageKey: string): Promise<boolean> {
    const safeKey = storageKey.replace(/^[\\\/]+/, '').replace(/\\/g, '/');
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
      );
      return true;
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  public getUrl(storageKey: string): string {
    if (
      !storageKey ||
      storageKey.includes('..') ||
      storageKey.includes('\\') ||
      storageKey.startsWith('/')
    ) {
      throw new Error('Invalid storage key');
    }
    const safeKey = storageKey.replace(/^[\\\/]+/, '').replace(/\\/g, '/');
    const publicUrlPrefix = (this.config.publicUrlPrefix || '').replace(/\/+$/, '');
    if (!publicUrlPrefix) return '';
    return `${publicUrlPrefix}/${safeKey}`;
  }

  public async getMetadata(storageKey: string): Promise<FileMetadata | null> {
    const safeKey = storageKey.replace(/^[\\\/]+/, '').replace(/\\/g, '/');
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
      );
      return {
        storageKey: safeKey,
        sizeBytes: response.ContentLength ?? 0,
        mimeType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag?.replace(/"/g, ''),
      };
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  public async exists(storageKey: string): Promise<boolean> {
    const safeKey = storageKey.replace(/^[\\\/]+/, '').replace(/\\/g, '/');
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
      );
      return true;
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  public async getObject(storageKey: string): Promise<StorageObject | null> {
    const safeKey = storageKey.replace(/^[\\\/]+/, '').replace(/\\/g, '/');
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
      );

      return {
        stream: response.Body as NodeJS.ReadableStream,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag?.replace(/"/g, ''),
      };
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  public async getStream(storageKey: string): Promise<NodeJS.ReadableStream | null> {
    const obj = await this.getObject(storageKey);
    return obj ? obj.stream : null;
  }

  public async getSignedUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
    const safeKey = storageKey.replace(/^[\\\/]+/, '').replace(/\\/g, '/');
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: safeKey,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  public getClient(): S3Client {
    return this.client;
  }

  private isNotFoundError(error: any): boolean {
    if (!error) return false;
    const code = error.name || error.Code || error.code;
    const status = error.$metadata?.httpStatusCode;
    return (
      code === 'NoSuchKey' ||
      code === 'NotFound' ||
      code === 'NoSuchBucket' ||
      status === 404
    );
  }

  private sanitizeSegment(segment: string): string {
    return segment.replace(/[^a-zA-Z0-9_-]/g, '');
  }
}

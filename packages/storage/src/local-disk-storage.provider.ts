import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  StorageProvider,
  UploadFileInput,
  UploadFileResult,
  FileMetadata,
  StorageObject,
} from './storage-provider.interface';

export interface LocalDiskStorageConfig {
  rootDir: string;
  publicUrlPrefix: string;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
];

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
 * Validates and safely resolves a storage key within rootDir.
 * Defends against:
 * 1. Standard directory traversal (../, ..\, mixed / and \)
 * 2. Sibling-prefix bypasses (e.g. /media-storage-evil starting with /media-storage)
 * 3. URL-encoded and double-encoded traversal (%2e%2e%2f, %252e%252e)
 * 4. Unsafe filenames with null bytes (\0)
 */
export function resolveSafeStoragePath(
  rootDir: string,
  storageKey: string,
): { isSafe: boolean; absolutePath: string } {
  if (!storageKey || typeof storageKey !== 'string') {
    return { isSafe: false, absolutePath: '' };
  }

  // 1. Reject null bytes and control characters
  if (storageKey.includes('\0')) {
    return { isSafe: false, absolutePath: '' };
  }

  // 2. Decode URL encoding (including recursive/double encoding)
  let decoded = storageKey;
  try {
    decoded = decodeURIComponent(storageKey);
    if (decoded.includes('%')) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        // ignore
      }
    }
  } catch {
    return { isSafe: false, absolutePath: '' };
  }

  if (decoded.includes('\0')) {
    return { isSafe: false, absolutePath: '' };
  }

  // 3. Cross-platform normalization: convert all backslashes to forward slashes
  const normalizedKey = decoded.replace(/\\/g, '/').replace(/^\/+/, '');

  // 4. Resolve absolute path against rootDir
  const resolvedRoot = path.resolve(rootDir);
  const normalizedRoot = resolvedRoot.endsWith(path.sep)
    ? resolvedRoot
    : resolvedRoot + path.sep;
  const absolutePath = path.resolve(resolvedRoot, normalizedKey);

  // 5. Boundary confinement & sibling-prefix defense:
  // - absolutePath must be inside normalizedRoot (has trailing separator)
  // - path.relative must not start with '..' and must not be an absolute path
  const relative = path.relative(resolvedRoot, absolutePath);
  const isContained =
    (absolutePath === resolvedRoot || absolutePath.startsWith(normalizedRoot)) &&
    !relative.startsWith('..') &&
    !path.isAbsolute(relative);

  return {
    isSafe: isContained,
    absolutePath,
  };
}

export class LocalDiskStorageProvider implements StorageProvider {
  public readonly type = 'LOCAL';
  private readonly rootDir: string;
  private readonly publicUrlPrefix: string;
  private readonly maxSizeBytes: number;
  private readonly allowedMimeTypes: string[];

  constructor(config: LocalDiskStorageConfig) {
    this.rootDir = path.resolve(config.rootDir);
    this.publicUrlPrefix = (config.publicUrlPrefix || '').replace(/\/+$/, '');
    this.maxSizeBytes = config.maxSizeBytes ?? 10 * 1024 * 1024; // 10 MB default
    this.allowedMimeTypes = config.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;

    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true });
    }
  }

  public async upload(input: UploadFileInput): Promise<UploadFileResult> {
    const { tenantId, storeId, buffer, mimeType, prefix = 'media' } = input;

    // 1. Validate MIME type
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // 2. Validate file size
    if (buffer.length > this.maxSizeBytes) {
      throw new Error(`File size ${buffer.length} bytes exceeds maximum limit of ${this.maxSizeBytes} bytes`);
    }

    // 3. Generate safe unique filename
    const safeExtension = EXTENSION_MAP[mimeType] || path.extname(input.originalFilename).toLowerCase();
    const uniqueId = crypto.randomUUID();
    const filename = `${uniqueId}${safeExtension}`;

    // 4. Construct path and prevent directory traversal
    let relativeKey: string;
    let absoluteFilePath: string;
    let absoluteTargetDir: string;

    if (input.storageKey) {
      const { isSafe, absolutePath } = resolveSafeStoragePath(this.rootDir, input.storageKey);
      if (!isSafe) {
        throw new Error('Access denied: target path escapes media storage root boundary');
      }
      absoluteFilePath = absolutePath;
      relativeKey = path.relative(this.rootDir, absolutePath).replace(/\\/g, '/');
      absoluteTargetDir = path.dirname(absoluteFilePath);
    } else {
      const segments = [
        this.sanitizeSegment(tenantId),
        storeId ? this.sanitizeSegment(storeId) : '',
        this.sanitizeSegment(prefix),
        filename,
      ].filter(Boolean);

      relativeKey = path.posix.join(...segments);
      const { isSafe, absolutePath } = resolveSafeStoragePath(this.rootDir, relativeKey);
      if (!isSafe) {
        throw new Error('Access denied: target path escapes media storage root boundary');
      }
      absoluteFilePath = absolutePath;
      absoluteTargetDir = path.dirname(absoluteFilePath);
    }

    // 5. Ensure directory exists and write file
    await fs.promises.mkdir(absoluteTargetDir, { recursive: true });
    await fs.promises.writeFile(absoluteFilePath, buffer);

    const publicUrl = this.publicUrlPrefix ? `${this.publicUrlPrefix}/${relativeKey}` : '';

    return {
      storageKey: relativeKey,
      filePath: absoluteFilePath,
      publicUrl,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  public async delete(storageKey: string): Promise<boolean> {
    try {
      const absolutePath = this.resolvePath(storageKey);
      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        for (const format of ['webp', 'png']) {
          await fs.promises.unlink(`${absolutePath}.compat.${format}`).catch((error) => {
            if (error.code !== 'ENOENT') throw error;
          });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public getUrl(storageKey: string): string {
    if (!this.publicUrlPrefix) return '';
    return `${this.publicUrlPrefix}/${storageKey.replace(/\\/g, '/')}`;
  }

  public async getMetadata(storageKey: string): Promise<FileMetadata | null> {
    const absolutePath = this.resolvePath(storageKey);
    try {
      const stats = await fs.promises.stat(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();
      const mime = Object.keys(EXTENSION_MAP).find(k => EXTENSION_MAP[k] === ext) || 'application/octet-stream';
      return {
        storageKey,
        sizeBytes: stats.size,
        mimeType: mime,
        lastModified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  public async exists(storageKey: string): Promise<boolean> {
    const absolutePath = this.resolvePath(storageKey);
    return fs.existsSync(absolutePath);
  }

  public async getObject(storageKey: string): Promise<StorageObject | null> {
    try {
      const absolutePath = this.resolvePath(storageKey);
      if (!fs.existsSync(absolutePath)) {
        return null;
      }
      const stats = await fs.promises.stat(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();
      const mime = Object.keys(EXTENSION_MAP).find(k => EXTENSION_MAP[k] === ext) || 'application/octet-stream';
      return {
        stream: fs.createReadStream(absolutePath),
        contentType: mime,
        contentLength: stats.size,
        lastModified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  public async getStream(storageKey: string): Promise<NodeJS.ReadableStream | null> {
    const obj = await this.getObject(storageKey);
    return obj ? obj.stream : null;
  }

  public resolvePath(storageKey: string): string {
    const { isSafe, absolutePath } = resolveSafeStoragePath(this.rootDir, storageKey);
    if (!isSafe) {
      throw new Error('Access denied: Path traversal detected in storageKey');
    }
    return absolutePath;
  }

  private sanitizeSegment(segment: string): string {
    return segment.replace(/[^a-zA-Z0-9_-]/g, '');
  }
}

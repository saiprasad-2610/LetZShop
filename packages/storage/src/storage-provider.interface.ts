export interface UploadFileInput {
  tenantId: string;
  storeId?: string;
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  prefix?: string; // e.g. 'products', 'branding', 'themes', 'private-documents'
  storageKey?: string;
  metadata?: Record<string, string>;
}

export interface UploadFileResult {
  storageKey: string;
  filePath: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface FileMetadata {
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
  lastModified: Date;
  etag?: string;
}

export interface StorageObject {
  stream: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
}

export interface StorageProvider {
  readonly type: string;
  upload(input: UploadFileInput): Promise<UploadFileResult>;
  delete(storageKey: string): Promise<boolean>;
  getUrl(storageKey: string): string;
  getMetadata(storageKey: string): Promise<FileMetadata | null>;
  exists(storageKey: string): Promise<boolean>;
  getObject?(storageKey: string): Promise<StorageObject | null>;
  getStream?(storageKey: string): Promise<NodeJS.ReadableStream | null>;
}

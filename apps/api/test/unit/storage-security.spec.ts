import { LocalDiskStorageProvider } from '@simply/storage';
import * as fs from 'fs';
import * as path from 'path';

describe('Storage Provider & Media Security (Unit Tests)', () => {
  const testStorageDir = path.resolve(__dirname, '../../test-media-scratch');
  let storageProvider: LocalDiskStorageProvider;

  beforeAll(() => {
    storageProvider = new LocalDiskStorageProvider({
      rootDir: testStorageDir,
      publicUrlPrefix: 'http://localhost:4000/media/file',
      maxSizeBytes: 1024 * 1024, // 1 MB max for test
    });
  });

  afterAll(async () => {
    if (fs.existsSync(testStorageDir)) {
      await fs.promises.rm(testStorageDir, { recursive: true, force: true });
    }
  });

  it('1. Uploads file with safe unique storage key and returns metadata', async () => {
    const buffer = Buffer.from('fake image binary stream');
    const result = await storageProvider.upload({
      tenantId: 'tenant-100',
      storeId: 'store-100',
      buffer,
      originalFilename: 'user-uploaded-product.jpg',
      mimeType: 'image/jpeg',
      prefix: 'products',
    });

    expect(result.storageKey).toMatch(/^tenant-100\/store-100\/products\/[a-f0-9-]+\.jpg$/);
    expect(result.publicUrl).toContain('http://localhost:4000/media/file/tenant-100/store-100/products/');
    expect(result.sizeBytes).toBe(buffer.length);

    // Verify file exists on disk
    expect(fs.existsSync(result.filePath)).toBe(true);

    // Test exists & getMetadata
    const exists = await storageProvider.exists(result.storageKey);
    expect(exists).toBe(true);

    const meta = await storageProvider.getMetadata(result.storageKey);
    expect(meta?.sizeBytes).toBe(buffer.length);

    // Clean up
    await storageProvider.delete(result.storageKey);
    expect(await storageProvider.exists(result.storageKey)).toBe(false);
  });

  it('2. Rejects unsupported MIME types (e.g. executable .exe or shell scripts)', async () => {
    const evilBuffer = Buffer.from('malicious payload');
    await expect(
      storageProvider.upload({
        tenantId: 'tenant-100',
        storeId: 'store-100',
        buffer: evilBuffer,
        originalFilename: 'exploit.sh',
        mimeType: 'application/x-sh',
      })
    ).rejects.toThrow('Unsupported MIME type: application/x-sh');
  });

  it('3. Rejects files exceeding the configured maximum size limit', async () => {
    const oversizedBuffer = Buffer.alloc(2 * 1024 * 1024); // 2 MB (limit is 1 MB)
    await expect(
      storageProvider.upload({
        tenantId: 'tenant-100',
        storeId: 'store-100',
        buffer: oversizedBuffer,
        originalFilename: 'huge.png',
        mimeType: 'image/png',
      })
    ).rejects.toThrow('exceeds maximum limit');
  });

  it('4. Prevents directory / path traversal attacks', async () => {
    await expect(
      storageProvider.exists('../../../../../windows/system32/cmd.exe')
    ).rejects.toThrow('Access denied: Path traversal detected');
  });
});

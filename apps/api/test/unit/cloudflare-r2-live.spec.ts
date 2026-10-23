import { S3StorageProvider } from '@simply/storage';
import { randomUUID } from 'crypto';

const hasR2Credentials = Boolean(
  (process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID) &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
);

const describeR2 = hasR2Credentials ? describe : describe.skip;

describeR2('Cloudflare R2 Live Integration Tests (Active only when credentials supplied)', () => {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const publicBucket = process.env.R2_PUBLIC_BUCKET || 'letzshop-public-media';
  const privateBucket = process.env.R2_PRIVATE_BUCKET || 'letzshop-private-documents';
  const endpoint =
    process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
  const region = process.env.R2_REGION || 'auto';

  let publicProvider: S3StorageProvider;
  let privateProvider: S3StorageProvider;

  beforeAll(() => {
    publicProvider = new S3StorageProvider({
      bucket: publicBucket,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
      publicUrlPrefix: process.env.R2_PUBLIC_URL_PREFIX || `https://${publicBucket}.r2.dev`,
      driver: 'r2',
    });

    privateProvider = new S3StorageProvider({
      bucket: privateBucket,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
      publicUrlPrefix: '',
      driver: 'r2',
    });
  });

  it('1. Performs real upload, existence check, metadata retrieval, and deletion in public media bucket', async () => {
    const testId = randomUUID();
    const testContent = Buffer.from(`Live R2 public media integration test ${testId}`);

    // 1. Upload
    const uploadResult = await publicProvider.upload({
      tenantId: 'live-test-tenant',
      storeId: 'live-test-store',
      buffer: testContent,
      originalFilename: `live-test-${testId}.jpg`,
      mimeType: 'image/jpeg',
      prefix: 'products',
    });

    expect(uploadResult.storageKey).toBeDefined();
    expect(uploadResult.sizeBytes).toBe(testContent.length);

    try {
      // 2. Existence check
      const exists = await publicProvider.exists(uploadResult.storageKey);
      expect(exists).toBe(true);

      // 3. Metadata check
      const meta = await publicProvider.getMetadata(uploadResult.storageKey);
      expect(meta).not.toBeNull();
      expect(meta?.sizeBytes).toBe(testContent.length);
      expect(meta?.mimeType).toBe('image/jpeg');

      // 4. Download and verify content
      const obj = await publicProvider.getObject(uploadResult.storageKey);
      expect(obj).not.toBeNull();
      expect(obj?.stream).toBeDefined();

      const chunks: Buffer[] = [];
      for await (const chunk of obj!.stream as any) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const downloaded = Buffer.concat(chunks);
      expect(downloaded.toString('utf8')).toBe(testContent.toString('utf8'));
    } finally {
      // 5. Delete and verify removal
      await publicProvider.delete(uploadResult.storageKey);
      const existsAfterDelete = await publicProvider.exists(uploadResult.storageKey);
      expect(existsAfterDelete).toBe(false);
    }
  });

  it('2. Performs real upload, retrieval, and deletion in private documents bucket', async () => {
    const testId = randomUUID();
    const testContent = Buffer.from(`%PDF-1.4 Live R2 private document integration test ${testId}`);
    const storageKey = `private-documents/live-test-tenant/verification-${testId}.pdf`;

    // 1. Upload to private bucket
    const uploadResult = await privateProvider.upload({
      tenantId: 'live-test-tenant',
      buffer: testContent,
      originalFilename: `pan-card-${testId}.pdf`,
      mimeType: 'application/pdf',
      prefix: 'private-documents',
      storageKey,
    });

    expect(uploadResult.publicUrl).toBe(''); // Never publicly exposed
    expect(uploadResult.storageKey).toBe(storageKey);

    try {
      // 2. Existence check
      const exists = await privateProvider.exists(storageKey);
      expect(exists).toBe(true);

      // 3. Presigned URL generation
      const signedUrl = await privateProvider.getSignedUrl(storageKey, 300);
      expect(signedUrl).toContain(privateBucket);
      expect(signedUrl).toContain('X-Amz-Signature');
    } finally {
      // 4. Clean up
      await privateProvider.delete(storageKey);
      const existsAfterDelete = await privateProvider.exists(storageKey);
      expect(existsAfterDelete).toBe(false);
    }
  });
});

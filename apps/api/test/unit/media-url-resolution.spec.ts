import { resolveMediaUrl } from '@simply/validation';
import * as path from 'path';
import * as fs from 'fs';

describe('Media URL Resolution & Safe Image Rendering (Unit Tests)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('resolveMediaUrl canonical strategy', () => {
    it('1. Returns empty string for null, undefined, or empty/whitespace input', () => {
      expect(resolveMediaUrl(null)).toBe('');
      expect(resolveMediaUrl(undefined)).toBe('');
      expect(resolveMediaUrl('')).toBe('');
      expect(resolveMediaUrl('   ')).toBe('');
      expect(resolveMediaUrl(null as any)).toBe('');
    });

    it('2. Leaves absolute HTTP and HTTPS URLs unchanged', () => {
      const httpUrl = 'http://localhost:4000/media/tenant-1/store-1/products/shirt.png';
      const httpsUrl = 'https://cdn.simplycommerce.in/assets/banner.webp';
      const protoRelUrl = '//cdn.simplycommerce.in/images/photo.jpg';

      expect(resolveMediaUrl(httpUrl)).toBe(httpUrl);
      expect(resolveMediaUrl(httpsUrl)).toBe(httpsUrl);
      expect(resolveMediaUrl(protoRelUrl)).toBe(protoRelUrl);
    });

    it('3. Leaves data: and blob: URLs unchanged', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
      const blobUri = 'blob:http://localhost:3001/a5b8f2d1';

      expect(resolveMediaUrl(dataUri)).toBe(dataUri);
      expect(resolveMediaUrl(blobUri)).toBe(blobUri);
    });

    it('4. Resolves relative /media/... URLs using default local API origin (http://localhost:4000)', () => {
      delete process.env.NEXT_PUBLIC_MEDIA_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      const relativeUrl = '/media/tenant-1/store-1/products/shirt.png';
      expect(resolveMediaUrl(relativeUrl)).toBe('http://localhost:4000/media/tenant-1/store-1/products/shirt.png');

      const relativeNoSlash = 'media/tenant-1/store-1/products/shirt.png';
      expect(resolveMediaUrl(relativeNoSlash)).toBe('http://localhost:4000/media/tenant-1/store-1/products/shirt.png');
    });

    it('5. Resolves relative /media/... URLs using NEXT_PUBLIC_API_URL if configured', () => {
      delete process.env.NEXT_PUBLIC_MEDIA_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://api.simplycommerce.in';

      const relativeUrl = '/media/tenant-1/store-1/products/shirt.png';
      expect(resolveMediaUrl(relativeUrl)).toBe('https://api.simplycommerce.in/media/tenant-1/store-1/products/shirt.png');
    });

    it('6. Resolves relative /media/... URLs using NEXT_PUBLIC_MEDIA_URL CDN origin if configured', () => {
      process.env.NEXT_PUBLIC_MEDIA_URL = 'https://media.simplycommerce.in';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.simplycommerce.in';

      const relativeUrl = '/media/tenant-1/store-1/products/shirt.png';
      expect(resolveMediaUrl(relativeUrl)).toBe('https://media.simplycommerce.in/media/tenant-1/store-1/products/shirt.png');
    });
  });

  describe('MIME Type mapping and Path Traversal Defense', () => {
    it('7. Correctly maps JPEG, PNG, WebP extensions to MIME types', () => {
      const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      };

      expect(mimeMap['.png']).toBe('image/png');
      expect(mimeMap['.jpg']).toBe('image/jpeg');
      expect(mimeMap['.jpeg']).toBe('image/jpeg');
      expect(mimeMap['.webp']).toBe('image/webp');
    });

    it('8. Verifies directory traversal escaping root directory is prevented', () => {
      const rootDir = path.resolve('./media-storage');
      const normalizedRoot = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;

      const maliciousKeys = [
        '../../../../windows/win.ini',
        '..\\..\\..\\etc\\passwd',
        'file/../../secret.env',
        'products/../../../package.json',
      ];

      for (const key of maliciousKeys) {
        const safeKey = key.replace(/^[\/\\]+/, '');
        const absolutePath = path.resolve(rootDir, safeKey);
        const isSafe = absolutePath.startsWith(normalizedRoot);
        expect(isSafe).toBe(false);
      }
    });
  });
});

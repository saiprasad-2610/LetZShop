import * as path from 'node:path';
import {
  isPublicMediaKey,
  localMediaRoot,
} from '../../src/modules/media/local-media-root';
import { publicMediaErrors } from '@simply/types';
import { MediaController } from '../../src/modules/media/media.controller';
import { MediaService } from '../../src/modules/media/media.service';
import { avifFallbackFormat } from '../../src/modules/media/compatible-image';
import { publicMediaReference } from '../../src/modules/media/public-media-reference';

describe('public media boundaries', () => {
  it('rebases legacy development image hosts using the configured public provider prefix', () => {
    expect(
      publicMediaReference(
        'http://localhost:4000/media/tenant/store/products/a.jpg',
        'https://api.example.com/media/file',
      ),
    ).toBe('https://api.example.com/media/file/tenant/store/products/a.jpg');
    expect(
      publicMediaReference(
        'https://cdn.example.com/a.jpg',
        'https://api.example.com/media',
      ),
    ).toBe('https://cdn.example.com/a.jpg');
    expect(publicMediaReference('blob:http://localhost/local')).toBe('');
    expect(
      publicMediaReference(
        'http://localhost:4000/media/private-documents/a.png',
        'https://api.example.com/media',
      ),
    ).toBe('');
  });
  it.each([
    ['image/avif,image/webp,image/*', null],
    ['image/webp,image/jxl,image/png,image/*;q=0.8,*/*;q=0.5', 'webp'],
    ['image/avif;q=0,image/webp', 'webp'],
    ['image/png,image/*', 'png'],
    ['*/*', null],
  ])('negotiates only unsupported AVIF responses: %s', (accept, format) => {
    expect(avifFallbackFormat(accept)).toBe(format);
  });
  it('resolves the same API media directory independently of launch directory', () => {
    const root = localMediaRoot('./media-storage');
    expect(root).toBe(path.resolve(__dirname, '../../media-storage'));
    expect(localMediaRoot(root)).toBe(root);
  });
  it.each([
    'tenant/store/products/file.jpg',
    'tenant/store/branding/file.avif',
  ])('permits public uploads: %s', (key) =>
    expect(isPublicMediaKey(key)).toBe(true),
  );
  it.each([
    'private-documents/tenant/passport.png',
    'tenant/store/private-documents/passport.pdf',
    'business-docs/merchant/pan.png',
    'tenant/store/products/../../private-documents/file',
    'tenant\\store\\products\\file.png',
  ])('blocks private and traversal paths: %s', (key) =>
    expect(isPublicMediaKey(key)).toBe(false),
  );
  it('rejects private documents before touching the filesystem', async () => {
    const controller = new MediaController({} as any);
    await expect(
      controller.serveFile('private-documents/tenant/file.png', {}),
    ).rejects.toThrow('not found');
  });
  it.each([
    'blob:http://localhost/abc',
    'file:///C:/image.jpg',
    'C:\\image.jpg',
    'D:\\uploads\\image.png',
  ])('rejects persisted browser/local paths: %s', (url) => {
    expect(
      publicMediaErrors({ pages: { home: { heroBannerUrl: url } } }),
    ).toHaveLength(1);
  });
  it.each([
    'https://cdn.example.com/a.jpg',
    '/media/tenant/store/products/a.webp',
    'data:image/png;base64,iVBORw0KGgo=',
  ])('preserves supported persisted resources: %s', (url) =>
    expect(publicMediaErrors({ logoUrl: url })).toEqual([]),
  );
  it('rejects an unsupported binary disguised as a branding image', async () => {
    const storage = { upload: jest.fn() };
    const service = new MediaService({} as any, storage as any);
    await expect(
      service.uploadStoreAsset(
        { storeId: 's', tenantId: 't' },
        {
          buffer: Buffer.from('%PDF-not-an-image'),
          originalFilename: 'fake.jpg',
          mimeType: 'image/jpeg',
        },
        'logo',
      ),
    ).rejects.toThrow();
    expect(storage.upload).not.toHaveBeenCalled();
  });
});

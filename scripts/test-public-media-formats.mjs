import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium, firefox, webkit } from 'playwright';
process.loadEnvFile('.env');
const require = createRequire(import.meta.url);
const sharp = createRequire(
  new URL('../apps/storefront/package.json', import.meta.url),
)('sharp');
const {
  LocalDiskStorageProvider,
} = require('../packages/storage/dist/index.js');
const {
  localMediaRoot,
} = require('../apps/api/dist/modules/media/local-media-root.js');
const root = localMediaRoot();
const run = `format-test-${Date.now()}`;
const provider = new LocalDiskStorageProvider({
  rootDir: root,
  publicUrlPrefix: 'http://localhost:4000/media',
});
const uploads = [],
  results = [];
const privateDir = path.join(root, 'private-documents', run);
let browser;
try {
  for (const [format, mime] of [
    ['jpeg', 'image/jpeg'],
    ['png', 'image/png'],
    ['webp', 'image/webp'],
    ['avif', 'image/avif'],
  ]) {
    const buffer = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#e28a32' },
    })
      .toFormat(format)
      .toBuffer();
    const upload = await provider.upload({
      tenantId: 'compatibility-tests',
      storeId: run,
      prefix: 'products',
      buffer,
      originalFilename: `sample.${format}`,
      mimeType: mime,
    });
    uploads.push(upload);
    const response = await fetch(upload.publicUrl);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), mime);
    results.push({
      format,
      mime,
      status: response.status,
      headers: Object.fromEntries(response.headers),
    });
  }
  const avif = uploads.find((upload) => upload.mimeType === 'image/avif');
  const fallbackResponses = await Promise.all(
    Array.from({ length: 10 }, () =>
      fetch(avif.publicUrl, {
        headers: { Accept: 'image/webp,image/png,image/*' },
      }),
    ),
  );
  for (const response of fallbackResponses) {
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    assert.ok(response.headers.get('vary').toLowerCase().includes('accept'));
    assert.equal(
      (await sharp(Buffer.from(await response.arrayBuffer())).metadata())
        .format,
      'webp',
    );
  }
  const cachedBefore = await fs.stat(`${avif.filePath}.compat.webp`);
  const reuse = await fetch(avif.publicUrl, {
    headers: { Accept: 'image/webp' },
  });
  await reuse.arrayBuffer();
  assert.equal(
    (await fs.stat(`${avif.filePath}.compat.webp`)).mtimeMs,
    cachedBefore.mtimeMs,
  );
  const changed = await sharp({
    create: { width: 16, height: 16, channels: 3, background: '#123456' },
  })
    .avif()
    .toBuffer();
  await fs.writeFile(avif.filePath, changed);
  const refreshed = await fetch(avif.publicUrl, {
    headers: { Accept: 'image/webp' },
  });
  const refreshedMetadata = await sharp(
    Buffer.from(await refreshed.arrayBuffer()),
  ).metadata();
  assert.equal(refreshedMetadata.width, 16);
  // Restore the original 8px fixture for the engine decode matrix.
  await fs.writeFile(
    avif.filePath,
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#e28a32' },
    })
      .avif()
      .toBuffer(),
  );
  results.push({
    negotiatedCache: 'PASS',
    concurrentFallbacks: 10,
    cacheReuse: 'PASS',
    sourceReplacementInvalidation: 'PASS',
    varyAccept: 'PASS',
  });
  await fs.mkdir(privateDir, { recursive: true });
  await fs.writeFile(
    path.join(privateDir, 'private.png'),
    Buffer.from('private fixture'),
  );
  assert.equal(
    (
      await fetch(
        `http://localhost:4000/media/file/private-documents/${run}/private.png`,
      )
    ).status,
    404,
  );
  for (const [name, engine, options] of [
    ['Chrome', chromium, { channel: 'chrome' }],
    ['Edge', chromium, { channel: 'msedge' }],
    ['Firefox', firefox, {}],
    ['WebKit', webkit, {}],
  ]) {
    browser = await engine.launch({ headless: true, ...options });
    try {
      const page = await browser.newPage();
      const decoded = await page.evaluate(
        async (urls) =>
          Promise.all(
            urls.map(
              (url) =>
                new Promise((resolve) => {
                  const image = new Image();
                  image.crossOrigin = 'anonymous';
                  const timer = setTimeout(
                    () => resolve({ url, error: 'timeout' }),
                    10000,
                  );
                  image.onload = () => {
                    clearTimeout(timer);
                    resolve({
                      url,
                      width: image.naturalWidth,
                      height: image.naturalHeight,
                    });
                  };
                  image.onerror = () => {
                    clearTimeout(timer);
                    resolve({ url, error: 'decode/load failure' });
                  };
                  image.src = url;
                }),
            ),
          ),
        uploads.map((upload) => upload.publicUrl),
      );
      assert.ok(
        decoded.every((image) => image.width === 8 && image.height === 8),
        JSON.stringify({ name, decoded }),
      );
      console.log(`${name}: JPEG, PNG, WebP and AVIF decoded across origins.`);
      results.push({ browser: name, decoded });
    } finally {
      await browser.close();
      browser = undefined;
    }
  }
  await fs.writeFile(
    'artifacts/rail-media-identity/media-format-results.json',
    JSON.stringify({ results, privateDocumentPublicAccess: 404 }, null, 2),
  );
} finally {
  await browser?.close();
  for (const upload of uploads) {
    assert.ok(
      path
        .resolve(upload.filePath)
        .startsWith(path.resolve(root, 'compatibility-tests', run) + path.sep),
    );
    assert.equal(await provider.delete(upload.storageKey), true);
  }
  await fs.unlink(path.join(privateDir, 'private.png')).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  await fs.rmdir(privateDir).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  await fs.rmdir(path.join(root, 'compatibility-tests', run, 'products'));
  await fs.rmdir(path.join(root, 'compatibility-tests', run));
}

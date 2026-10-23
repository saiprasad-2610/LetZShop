import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('../apps/storefront/node_modules/sharp');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIconPath = path.resolve(__dirname, '../apps/storefront/public/images/letzshop-icon.png');
const sourceLogoPath = path.resolve(__dirname, '../apps/storefront/public/images/letzshop-logo.png');

if (!fs.existsSync(sourceIconPath)) {
  console.error('Source icon not found at:', sourceIconPath);
  process.exit(1);
}

function pngsToIco(images) {
  const count = images.length;
  const headerSize = 6 + 16 * count;
  let currentOffset = headerSize;
  const header = Buffer.alloc(headerSize);

  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(count, 4); // count

  const buffers = [header];

  for (let i = 0; i < count; i++) {
    const img = images[i];
    const entryOffset = 6 + i * 16;
    header.writeUInt8(img.width >= 256 ? 0 : img.width, entryOffset + 0);
    header.writeUInt8(img.height >= 256 ? 0 : img.height, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2); // color count
    header.writeUInt8(0, entryOffset + 3); // reserved
    header.writeUInt16LE(1, entryOffset + 4); // color planes
    header.writeUInt16LE(32, entryOffset + 6); // bits per pixel
    header.writeUInt32LE(img.buffer.length, entryOffset + 8); // size
    header.writeUInt32LE(currentOffset, entryOffset + 12); // offset

    buffers.push(img.buffer);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat(buffers);
}

async function generate() {
  console.log('Generating official LetzShop favicons and icon assets...');

  // 1. Generate PNG buffers at exact sizes
  const [b16, b32, b48, b180, b192, b512] = await Promise.all([
    sharp(sourceIconPath)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
    sharp(sourceIconPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
    sharp(sourceIconPath)
      .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
    sharp(sourceIconPath)
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
    sharp(sourceIconPath)
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
    sharp(sourceIconPath)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
  ]);

  // 2. Generate multi-resolution ICO (16x16, 32x32, 48x48)
  const icoBuffer = pngsToIco([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ]);

  const targetDirs = [
    path.resolve(__dirname, '../apps/storefront/public'),
    path.resolve(__dirname, '../apps/seller/public'),
    path.resolve(__dirname, '../apps/admin/public'),
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const imagesDir = path.join(dir, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Write all favicon and PWA icons
    fs.writeFileSync(path.join(dir, 'favicon.ico'), icoBuffer);
    fs.writeFileSync(path.join(dir, 'favicon-16x16.png'), b16);
    fs.writeFileSync(path.join(dir, 'favicon-32x32.png'), b32);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), b180);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon-precomposed.png'), b180);
    fs.writeFileSync(path.join(dir, 'icon-192.png'), b192);
    fs.writeFileSync(path.join(dir, 'icon-512.png'), b512);

    // Ensure official brand images are available in every app's public/images
    fs.copyFileSync(sourceIconPath, path.join(imagesDir, 'letzshop-icon.png'));
    if (fs.existsSync(sourceLogoPath)) {
      fs.copyFileSync(sourceLogoPath, path.join(imagesDir, 'letzshop-logo.png'));
    }

    console.log(`✓ Updated favicons and brand assets in ${dir}`);
  }

  console.log('Successfully generated all LetzShop favicons across apps!');
}

generate().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});

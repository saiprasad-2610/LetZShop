import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sanitizeSubdomain, validateSubdomain } from '@simply/types';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();

async function generateQrAsset(url: string, outputPath: string, size = 1200): Promise<void> {
  const pythonScript = path.resolve(__dirname, 'generate_store_qr.py');
  await execFileAsync('python', [pythonScript, '--url', url, '--output', outputPath, '--size', String(size)]);
}

async function main() {
  console.log('[Migration] Starting merchant subdomain and permanent QR code backfill...');

  const stores = await prisma.store.findMany({
    where: { deletedAt: null },
    include: { qrCode: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`[Migration] Found ${stores.length} existing store(s) to inspect.`);

  const mediaDir = path.resolve(process.cwd(), 'uploads', 'qr-codes');

  for (const store of stores) {
    // 1. Assign or normalize unique compact subdomain (e.g. sairamteacompany)
    let candidate = sanitizeSubdomain(store.name || store.slug);
    const validation = validateSubdomain(candidate);
    if (!validation.valid) {
      candidate = `store${candidate}`.slice(0, 63);
    }

    if (store.subdomain !== candidate) {
      let suffix = 1;
      let finalSubdomain = candidate;
      while (true) {
        const existing = await prisma.store.findFirst({
          where: { subdomain: finalSubdomain, id: { not: store.id } },
        });
        if (!existing) break;
        suffix += 1;
        finalSubdomain = `${candidate.slice(0, 58)}${suffix}`;
      }

      await prisma.store.update({
        where: { id: store.id },
        data: { subdomain: finalSubdomain },
      });
      console.log(`[Migration] Store "${store.name}" updated subdomain: "${store.subdomain}" -> "${finalSubdomain}"`);
    } else {
      console.log(`[Migration] Store "${store.name}" already has compact subdomain: "${store.subdomain}"`);
    }

    // 2. Provision permanent QR code if not present
    if (!store.qrCode) {
      let token = crypto.randomBytes(4).toString('hex'); // 8-character token
      while (true) {
        const existingToken = await prisma.storeQRCode.findUnique({
          where: { publicToken: token },
        });
        if (!existingToken) break;
        token = crypto.randomBytes(4).toString('hex');
      }

      const permanentUrl = `https://letzshop.store/q/${token}`;
      const fileName = `store-${store.id}-${token}.png`;
      const outputPath = path.join(mediaDir, fileName);

      try {
        await generateQrAsset(permanentUrl, outputPath, 1200);
      } catch (err) {
        console.warn(`[Migration] Warning: Could not generate pre-cached file for ${token}:`, err);
      }

      await prisma.storeQRCode.create({
        data: {
          storeId: store.id,
          publicToken: token,
          qrCodeStorageKey: fileName,
        },
      });
      console.log(`[Migration] Store "${store.name}" provisioned permanent QR token: "${token}" -> ${permanentUrl}`);
    } else {
      console.log(`[Migration] Store "${store.name}" already has permanent QR token: "${store.qrCode.publicToken}"`);
    }
  }

  console.log('[Migration] Backfill completed successfully.');
}

main()
  .catch((err) => {
    console.error('[Migration] Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

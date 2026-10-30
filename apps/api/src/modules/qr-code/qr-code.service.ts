import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient, StoreStatus } from '@prisma/client';
import { StoreSuspendedException } from '../../common/exceptions/domain.exceptions';

const execFileAsync = promisify(execFile);

export interface StoreQrDetails {
  id: string;
  storeId: string;
  publicToken: string;
  permanentUrl: string;
  currentTargetUrl: string;
  createdAt: Date;
}

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Locate the Python QR code generator script within the monorepo.
   */
  private getPythonQrScriptPath(): string {
    const candidates = [
      path.resolve(process.cwd(), 'scripts', 'generate_store_qr.py'),
      path.resolve(process.cwd(), '..', '..', 'scripts', 'generate_store_qr.py'),
      path.resolve(__dirname, '..', '..', '..', '..', '..', 'scripts', 'generate_store_qr.py'),
      path.resolve(__dirname, '..', '..', '..', 'scripts', 'generate_store_qr.py'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    throw new Error('Python QR generation script not found in scripts/generate_store_qr.py');
  }

  /**
   * Resolves the canonical live storefront target URL for a store.
   * Order of priority:
   * 1. Verified Custom Domain (e.g. https://www.sairamtea.com)
   * 2. Merchant Subdomain (e.g. https://sairamtea.letzshop.store or http://sairamtea.localhost:3000)
   * 3. Legacy Slug Path (e.g. https://letzshop.store/store/sairam-tea)
   */
  public resolveStoreTargetUrl(store: {
    id: string;
    slug: string;
    subdomain: string | null;
    customDomain: string | null;
  }): string {
    const storefrontDomain = process.env.STOREFRONT_ROOT_DOMAIN || 'letzshop.store';
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

    if (store.customDomain) {
      return `https://${store.customDomain}`;
    }

    if (store.subdomain) {
      if (isDev) {
        return `http://${store.subdomain}.localhost:3000`;
      }
      return `https://${store.subdomain}.${storefrontDomain}`;
    }

    if (isDev) {
      return `http://localhost:3000/store/${store.slug}`;
    }
    return `https://${storefrontDomain}/store/${store.slug}`;
  }

  /**
   * Computes the permanent, unchangeable QR redirect URL.
   */
  public getPermanentQrUrl(token: string): string {
    const domain =
      process.env.QR_REDIRECT_ROOT_DOMAIN ||
      process.env.STOREFRONT_ROOT_DOMAIN ||
      'letzshop.store';
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

    if (isDev) {
      return `http://localhost:4000/q/${token}`;
    }
    return `https://${domain}/q/${token}`;
  }

  /**
   * Retrieves or idempotently provisions the permanent QR record for a store.
   */
  public async getOrCreateStoreQr(
    storeId: string,
    tenantId?: string
  ): Promise<StoreQrDetails> {
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        ...(tenantId ? { tenantId } : {}),
        deletedAt: null,
      },
      include: { qrCode: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    let qrCode = store.qrCode;

    if (!qrCode) {
      let token = crypto.randomBytes(4).toString('hex');
      while (true) {
        const existingToken = await this.prisma.storeQRCode.findUnique({
          where: { publicToken: token },
        });
        if (!existingToken) break;
        token = crypto.randomBytes(4).toString('hex');
      }

      qrCode = await this.prisma.storeQRCode.create({
        data: {
          storeId: store.id,
          publicToken: token,
        },
      });
      this.logger.log(`Provisioned permanent QR code token "${token}" for store ${store.id}`);
    }

    const currentTargetUrl = this.resolveStoreTargetUrl(store);
    const permanentUrl = this.getPermanentQrUrl(qrCode.publicToken);

    return {
      id: qrCode.id,
      storeId: store.id,
      publicToken: qrCode.publicToken,
      permanentUrl,
      currentTargetUrl,
      createdAt: qrCode.createdAt,
    };
  }

  /**
   * Resolves a public permanent QR token to the merchant's live destination.
   */
  public async resolvePublicToken(token: string): Promise<{
    targetUrl: string;
    store: { id: string; name: string; slug: string; status: StoreStatus };
  }> {
    if (!token || typeof token !== 'string' || !/^[a-zA-Z0-9_-]{4,32}$/.test(token)) {
      throw new BadRequestException('Invalid QR code identifier format.');
    }

    const qrRecord = await this.prisma.storeQRCode.findUnique({
      where: { publicToken: token },
      include: { store: true },
    });

    if (!qrRecord || !qrRecord.store || qrRecord.store.deletedAt) {
      throw new NotFoundException('Permanent store QR code not found or inactive.');
    }

    const { store } = qrRecord;

    if (store.status === StoreStatus.SUSPENDED) {
      throw new StoreSuspendedException(
        'This store has been temporarily suspended. Please contact store support.'
      );
    }

    const targetUrl = this.resolveStoreTargetUrl(store);
    return {
      targetUrl,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        status: store.status,
      },
    };
  }

  /**
   * Generates a high-resolution or vector QR asset using the standalone Python generator.
   */
  public async generateQrAsset(
    permanentUrl: string,
    format: 'png' | 'svg' = 'png',
    size = 1200
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const validFormats = ['png', 'svg'];
    const chosenFormat = validFormats.includes(format.toLowerCase())
      ? (format.toLowerCase() as 'png' | 'svg')
      : 'png';

    const validSizes = [256, 512, 1024, 1200, 2048];
    const chosenSize = validSizes.includes(Number(size)) ? Number(size) : 1200;

    const pythonScript = this.getPythonQrScriptPath();
    const tempFileName = `qr-${crypto.randomBytes(8).toString('hex')}.${chosenFormat}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    try {
      const pythonBin = process.env.PYTHON_BIN || 'python';
      await execFileAsync(pythonBin, [
        pythonScript,
        '--url',
        permanentUrl,
        '--output',
        tempFilePath,
        '--size',
        String(chosenSize),
        '--format',
        chosenFormat,
      ]);

      const buffer = await fs.promises.readFile(tempFilePath);
      return {
        buffer,
        contentType: chosenFormat === 'svg' ? 'image/svg+xml' : 'image/png',
      };
    } catch (error: any) {
      this.logger.error(`Failed to generate QR asset via Python: ${error?.message}`, error?.stack);
      throw new BadRequestException('Failed to generate store QR code asset.');
    } finally {
      fs.promises.unlink(tempFilePath).catch(() => {});
    }
  }
}

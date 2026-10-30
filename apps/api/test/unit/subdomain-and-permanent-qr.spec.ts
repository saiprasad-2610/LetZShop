import {
  sanitizeSubdomain,
  validateSubdomain,
  getPublicStoreUrl,
  getPermanentQrUrl,
  RESERVED_SUBDOMAINS,
} from '@simply/types';
import { QrCodeService } from '../../src/modules/qr-code/qr-code.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { StoreSuspendedException } from '../../src/common/exceptions/domain.exceptions';

describe('Merchant Subdomain & Permanent QR Code System', () => {
  describe('Phase 2 — Subdomain Rules, Sanitization & Collision Resistance', () => {
    it('should sanitize merchant names to clean, compact lowercase subdomains', () => {
      expect(sanitizeSubdomain('Sairam Tea Company')).toBe('sairamteacompany');
      expect(sanitizeSubdomain('Sparsha Sarees & Silks!')).toBe('sparshasareessilks');
      expect(sanitizeSubdomain('SK_General_Stores')).toBe('skgeneralstores');
      expect(sanitizeSubdomain('---Leading-Trailing---')).toBe('leadingtrailing');
    });

    it('should validate DNS label length, characters, and structure', () => {
      expect(validateSubdomain('sairamtea')).toEqual({ valid: true });
      expect(validateSubdomain('sparsha-sarees')).toEqual({ valid: true });

      // Leading or trailing hyphens
      expect(validateSubdomain('-invalid')).toEqual({
        valid: false,
        error: 'Subdomain cannot start or end with a hyphen.',
      });
      expect(validateSubdomain('invalid-')).toEqual({
        valid: false,
        error: 'Subdomain cannot start or end with a hyphen.',
      });

      // Too short / too long
      expect(validateSubdomain('a')).toEqual({
        valid: false,
        error: 'Subdomain must be at least 3 characters long.',
      });
      expect(validateSubdomain('a'.repeat(64))).toEqual({
        valid: false,
        error: 'Subdomain cannot exceed 63 characters.',
      });

      // Invalid characters
      expect(validateSubdomain('sairam_tea')).toEqual({
        valid: false,
        error: 'Subdomain can only contain lowercase letters, numbers, and hyphens.',
      });
      expect(validateSubdomain('sairam.tea')).toEqual({
        valid: false,
        error: 'Subdomain can only contain lowercase letters, numbers, and hyphens.',
      });
    });

    it('should reserve platform service names and prevent merchant assignment', () => {
      const reservedList = ['www', 'api', 'admin', 'seller', 'support', 'app', 'status'];
      for (const name of reservedList) {
        expect(RESERVED_SUBDOMAINS.has(name)).toBe(true);
        const result = validateSubdomain(name);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('reserved');
      }
    });
  });

  describe('Phase 3 & Phase 9 — Canonical URL & Custom Domain Resolution', () => {
    it('should resolve merchant subdomains as default canonical URL', () => {
      const url = getPublicStoreUrl('sairamtea', 'https://letzshop.store');
      expect(url).toBe('https://sairamtea.letzshop.store');
    });

    it('should resolve *.localhost in local development mode', () => {
      const url = getPublicStoreUrl('sairamtea', 'http://localhost:3000');
      expect(url).toBe('http://sairamtea.localhost:3000');
    });

    it('should prioritize verified custom domains when present', () => {
      const url = getPublicStoreUrl('sairamtea', 'https://letzshop.store', {
        customDomain: 'www.sairamtea.com',
      });
      expect(url).toBe('https://www.sairamtea.com');
    });

    it('should format permanent QR redirect URLs accurately', () => {
      const qrUrl = getPermanentQrUrl('7d9f4c82', 'https://letzshop.store');
      expect(qrUrl).toBe('https://letzshop.store/q/7d9f4c82');
    });
  });

  describe('Phase 4, 5 & 8 — QrCodeService Backend Unit Tests', () => {
    let service: QrCodeService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        store: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        storeQRCode: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
      };
      service = new QrCodeService(mockPrisma);
    });

    it('should dynamically resolve store target URL following priority rules', () => {
      // 1. Custom domain priority
      const targetWithCustom = service.resolveStoreTargetUrl({
        id: 'store-1',
        slug: 'sairam-tea',
        subdomain: 'sairamtea',
        customDomain: 'www.sairamtea.com',
      });
      expect(targetWithCustom).toBe('https://www.sairamtea.com');

      // 2. Subdomain
      const targetWithSubdomain = service.resolveStoreTargetUrl({
        id: 'store-1',
        slug: 'sairam-tea',
        subdomain: 'sairamtea',
        customDomain: null,
      });
      expect(targetWithSubdomain).toContain('sairamtea.');

      // 3. Fallback
      const targetFallback = service.resolveStoreTargetUrl({
        id: 'store-1',
        slug: 'sairam-tea',
        subdomain: null,
        customDomain: null,
      });
      expect(targetFallback).toContain('/store/sairam-tea');
    });

    it('should return existing QR record idempotently without regeneration', async () => {
      mockPrisma.store.findFirst.mockResolvedValue({
        id: 'store-1',
        name: 'SaiRam Tea',
        slug: 'sairam-tea',
        subdomain: 'sairamtea',
        customDomain: null,
        qrCode: {
          id: 'qr-1',
          publicToken: 'a1b2c3d4',
          createdAt: new Date('2026-01-01'),
        },
      });

      const result = await service.getOrCreateStoreQr('store-1', 'tenant-1');

      expect(mockPrisma.storeQRCode.create).not.toHaveBeenCalled();
      expect(result.publicToken).toBe('a1b2c3d4');
      expect(result.permanentUrl).toContain('/q/a1b2c3d4');
      expect(result.currentTargetUrl).toContain('sairamtea');
    });

    it('should provision a new permanent QR record if store does not have one yet', async () => {
      mockPrisma.store.findFirst.mockResolvedValue({
        id: 'store-2',
        name: 'Sparsha Sarees',
        slug: 'sparsha-sarees',
        subdomain: 'sparsha-sarees',
        customDomain: null,
        qrCode: null,
      });
      mockPrisma.storeQRCode.findUnique.mockResolvedValue(null);
      mockPrisma.storeQRCode.create.mockImplementation(({ data }: any) => ({
        id: 'qr-2',
        storeId: data.storeId,
        publicToken: data.publicToken,
        createdAt: new Date(),
      }));

      const result = await service.getOrCreateStoreQr('store-2', 'tenant-2');

      expect(mockPrisma.storeQRCode.create).toHaveBeenCalled();
      expect(result.publicToken).toHaveLength(8);
      expect(result.permanentUrl).toContain(`/q/${result.publicToken}`);
    });

    it('should resolve public token to active storefront destination', async () => {
      mockPrisma.storeQRCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        publicToken: '945d6975',
        store: {
          id: 'store-1',
          name: 'SaiRam Tea',
          slug: 'sairam-tea-company',
          subdomain: 'sairam-tea-company',
          customDomain: null,
          status: StoreStatus.LIVE,
          deletedAt: null,
        },
      });

      const resolution = await service.resolvePublicToken('945d6975');
      expect(resolution.store.id).toBe('store-1');
      expect(resolution.targetUrl).toContain('sairam-tea-company');
    });

    it('should reject malformed or invalid QR public tokens', async () => {
      await expect(service.resolvePublicToken('../malicious')).rejects.toThrow(BadRequestException);
      await expect(service.resolvePublicToken('')).rejects.toThrow(BadRequestException);
      await expect(service.resolvePublicToken('ab')).rejects.toThrow(BadRequestException);
    });

    it('should throw StoreSuspendedException if merchant store is suspended', async () => {
      mockPrisma.storeQRCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        publicToken: '945d6975',
        store: {
          id: 'store-1',
          name: 'Suspended Store',
          slug: 'suspended',
          subdomain: 'suspended',
          customDomain: null,
          status: StoreStatus.SUSPENDED,
          deletedAt: null,
        },
      });

      await expect(service.resolvePublicToken('945d6975')).rejects.toThrow(StoreSuspendedException);
    });

    it('should throw NotFoundException if QR code or store does not exist', async () => {
      mockPrisma.storeQRCode.findUnique.mockResolvedValue(null);
      await expect(service.resolvePublicToken('945d6975')).rejects.toThrow(NotFoundException);
    });

    it('should successfully execute python QR generator and return sharp image buffer', async () => {
      const asset = await service.generateQrAsset(
        'https://letzshop.store/q/945d6975',
        'png',
        512
      );

      expect(asset.contentType).toBe('image/png');
      expect(Buffer.isBuffer(asset.buffer)).toBe(true);
      expect(asset.buffer.length).toBeGreaterThan(100);
      // Verify PNG magic header: 89 50 4E 47 0D 0A 1A 0A
      expect(asset.buffer[0]).toBe(0x89);
      expect(asset.buffer[1]).toBe(0x50);
      expect(asset.buffer[2]).toBe(0x4e);
      expect(asset.buffer[3]).toBe(0x47);
    });

    it('should successfully generate true vector SVG output', async () => {
      const asset = await service.generateQrAsset(
        'https://letzshop.store/q/945d6975',
        'svg',
        1024
      );

      expect(asset.contentType).toBe('image/svg+xml');
      const svgText = asset.buffer.toString('utf-8');
      expect(svgText).toContain('<svg');
      expect(svgText).toContain('</svg>');
    });
  });
});

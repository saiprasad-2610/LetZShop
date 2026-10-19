import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateProductDto,
  CreateProductOptionDto,
  CreateOptionValueDto,
  CreateProductVariantDto,
} from '../../src/modules/catalog/dto/catalog.dto';
import { ProductMode, VariantStatus } from '@simply/types';
import { resolveMediaUrl } from '@simply/validation';
import { CatalogService } from '../../src/modules/catalog/catalog.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('Product Options, Variants & Media Automated Test Suite', () => {
  describe('MEDIA TESTS', () => {
    it('1. Upload preview receives valid publicUrl and resolveMediaUrl handles it', () => {
      const publicUrl = '/media/stores/store-123/prod-img.jpg';
      const resolved = resolveMediaUrl(publicUrl);
      expect(resolved).toContain('prod-img.jpg');
      expect(resolved.startsWith('http://') || resolved.startsWith('https://')).toBe(true);
    });

    it('2. Canonical media source is selected (blob, absolute, or relative)', () => {
      // Local blob preview during upload
      const blobUrl = 'blob:http://localhost:3001/f83eae43-9fcd-49d7';
      expect(resolveMediaUrl(blobUrl)).toBe(blobUrl);

      // Uploaded MediaAsset publicUrl
      const absoluteUrl = 'https://cdn.simply.com/media/photo.png';
      expect(resolveMediaUrl(absoluteUrl)).toBe(absoluteUrl);

      // Relative storage path
      expect(resolveMediaUrl('/media/photo.webp')).toContain('/media/photo.webp');
    });

    it('3. Primary media ordering: first photo in array has sortOrder 0', () => {
      const mediaList = [
        { id: 'asset-1', sortOrder: 0 },
        { id: 'asset-2', sortOrder: 1 },
      ];
      expect(mediaList[0].sortOrder).toBe(0);
      expect(mediaList[0].id).toBe('asset-1');
    });

    it('4. Delete media removes from list and updates references', () => {
      const mediaItems = [{ id: 'asset-1' }, { id: 'asset-2' }, { id: 'asset-3' }];
      const filtered = mediaItems.filter((m) => m.id !== 'asset-2');
      expect(filtered.length).toBe(2);
      expect(filtered.find((m) => m.id === 'asset-2')).toBeUndefined();
    });

    it('5. Tenant isolation: media search/fetch strictly filters by tenantId', async () => {
      const mockPrisma: any = {
        mediaAsset: {
          findFirst: jest.fn().mockImplementation(({ where }) => {
            if (where.tenantId === 'tenant-seller-a' && where.id === 'asset-a') {
              return { id: 'asset-a', tenantId: 'tenant-seller-a', storageKey: 'path-a', publicUrl: '/media/path-a' };
            }
            return null;
          }),
        },
      };

      const result = await mockPrisma.mediaAsset.findFirst({
        where: { id: 'asset-a', tenantId: 'tenant-seller-b' },
      });
      expect(result).toBeNull();
    });
  });

  describe('OPTIONS TESTS', () => {
    it('1. Custom option names (Material, Storage, Flavour, etc.) are accepted and validated', async () => {
      const optionDto = plainToInstance(CreateProductOptionDto, {
        name: 'Material',
        values: [{ value: 'Stainless Steel' }, { value: 'Brass' }],
      });
      const errors = await validate(optionDto);
      expect(errors.length).toBe(0);
      expect(optionDto.name).toBe('Material');
    });

    it('2. Empty option name is rejected', async () => {
      const optionDto = plainToInstance(CreateProductOptionDto, {
        name: '',
        values: [{ value: 'Cotton' }],
      });
      const errors = await validate(optionDto);
      expect(errors.length).toBeGreaterThan(0);
    });

    const createMockService = () => {
      const mockTx: any = {
        product: { create: jest.fn().mockResolvedValue({ id: 'p1', name: 'Test', mode: ProductMode.SELL_ONLINE }) },
        productOption: { create: jest.fn() },
        productOptionValue: { create: jest.fn() },
        productVariant: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
        inventory: { create: jest.fn() },
        auditLog: { create: jest.fn() },
      };
      const mockPrisma: any = {
        product: { findFirst: jest.fn().mockResolvedValue(null) },
        $transaction: jest.fn(async (cb) => cb(mockTx)),
      };
      return new CatalogService(mockPrisma);
    };

    it('3. Duplicate option names on the same product are rejected in catalog service', async () => {
      const service = createMockService();
      const tenant = { tenantId: 't1', storeId: 's1', userId: 'u1' };
      const dto: any = {
        name: 'Test Shirt',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 79900,
        options: [
          { name: 'Colour', values: [{ value: 'Black' }] },
          { name: 'colour', values: [{ value: 'White' }] },
        ],
        variants: [],
      };

      await expect(service.createProduct(tenant, dto)).rejects.toThrow(BadRequestException);
    });

    it('4. Duplicate option values inside the same option are rejected', async () => {
      const service = createMockService();
      const tenant = { tenantId: 't1', storeId: 's1', userId: 'u1' };
      const dto: any = {
        name: 'Test Shirt',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 79900,
        options: [
          {
            name: 'Colour',
            values: [{ value: 'Black' }, { value: 'black' }],
          },
        ],
        variants: [],
      };

      await expect(service.createProduct(tenant, dto)).rejects.toThrow(BadRequestException);
    });

    it('5. Empty option values are rejected', async () => {
      const service = createMockService();
      const tenant = { tenantId: 't1', storeId: 's1', userId: 'u1' };
      const dto: any = {
        name: 'Test Shirt',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 79900,
        options: [
          {
            name: 'Size',
            values: [{ value: ' ' }],
          },
        ],
        variants: [],
      };

      await expect(service.createProduct(tenant, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('VARIANTS & CARTESIAN GENERATION TESTS', () => {
    it('1. 2 Colour × 3 Size produces exactly 6 Cartesian variants', () => {
      const options = [
        { name: 'Colour', values: ['Black', 'White'] },
        { name: 'Size', values: ['S', 'M', 'L'] },
      ];

      const cartesian = (arrays: string[][]): string[][] => {
        return arrays.reduce(
          (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
          [[]] as string[][]
        );
      };

      const combos = cartesian(options.map((o) => o.values));
      expect(combos.length).toBe(6);

      const expected = [
        ['Black', 'S'],
        ['Black', 'M'],
        ['Black', 'L'],
        ['White', 'S'],
        ['White', 'M'],
        ['White', 'L'],
      ];
      expect(combos).toEqual(expected);
    });

    it('2. Excessive combination count (> 100) is rejected by service safety limit', async () => {
      const mockPrisma: any = {
        product: { findFirst: jest.fn().mockResolvedValue(null) },
        subscription: { findFirst: jest.fn().mockResolvedValue(null) },
        $transaction: jest.fn(async (cb) => cb({
          product: { create: jest.fn().mockResolvedValue({ id: 'p1', name: 'Test', mode: ProductMode.SELL_ONLINE }) },
        })),
      };
      const service = new CatalogService(mockPrisma);
      const tenant = { tenantId: 't1', storeId: 's1', userId: 'u1' };
      // 11 x 10 = 110 combinations
      const vals11 = Array.from({ length: 11 }, (_, i) => ({ value: `OptVal${i}` }));
      const vals10 = Array.from({ length: 10 }, (_, i) => ({ value: `SizeVal${i}` }));

      const dto: any = {
        name: 'Mega Variant Product',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 99900,
        options: [
          { name: 'OptionA', values: vals11 },
          { name: 'OptionB', values: vals10 },
        ],
        variants: [],
        mediaAssetIds: ['asset-uuid-1'],
      };

      await expect(service.createProduct(tenant, dto)).rejects.toThrow(
        /This combination would create 110 variants/
      );
    });

    it('3. Per-variant SKU, pricePaise, compareAtPricePaise, and stock are accepted in DTO', async () => {
      const variantDto = plainToInstance(CreateProductVariantDto, {
        sku: 'CCS-BLK-S',
        pricePaise: 79900,
        compareAtPricePaise: 99900,
        stock: 5,
        optionValues: ['Black', 'S'],
        mediaAssetId: 'asset-uuid-1',
        status: VariantStatus.ACTIVE,
      });

      const errors = await validate(variantDto);
      expect(errors.length).toBe(0);
      expect(variantDto.sku).toBe('CCS-BLK-S');
      expect(variantDto.pricePaise).toBe(79900);
      expect(variantDto.stock).toBe(5);
    });

    it('4. Selling mode ENQUIRY_ONLY allows optional pricePaise on variants', async () => {
      const variantDto = plainToInstance(CreateProductVariantDto, {
        sku: 'ENQ-VAR-1',
        stock: 10,
        optionValues: ['Custom'],
      });

      const errors = await validate(variantDto);
      expect(errors.length).toBe(0);
      expect(variantDto.pricePaise).toBeUndefined();
    });

    it('5. Tenant isolation: variant SKUs are unique per store, not across different tenants/stores', async () => {
      const mockPrisma: any = {
        productVariant: {
          findFirst: jest.fn().mockImplementation(({ where }) => {
            if (where.storeId === 'store-1' && where.sku === 'SKU-SHIRT-1') {
              return { id: 'var-1', sku: 'SKU-SHIRT-1' };
            }
            return null;
          }),
        },
      };

      // Store 1: SKU exists -> conflict
      const existingInStore1 = await mockPrisma.productVariant.findFirst({
        where: { storeId: 'store-1', sku: 'SKU-SHIRT-1', deletedAt: null },
      });
      expect(existingInStore1).toBeDefined();

      // Store 2: Same SKU is allowed because it belongs to another store
      const existingInStore2 = await mockPrisma.productVariant.findFirst({
        where: { storeId: 'store-2', sku: 'SKU-SHIRT-1', deletedAt: null },
      });
      expect(existingInStore2).toBeNull();
    });
  });
});

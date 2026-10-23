import { BadRequestException } from '@nestjs/common';
import { CATALOG_HEADER_LIMITS, catalogHeaderErrors, normalizeCatalogHeader } from '@simply/types';
import { ThemesService } from '../../src/modules/themes/themes.service';

describe('catalog header contract', () => {
  for (const [field, max] of Object.entries(CATALOG_HEADER_LIMITS)) {
    for (const seed of ['English text ', 'मराठी मजकूर ', 'हिन्दी विवरण ', '😀']) {
      it(`${field} counts UTF-16 units consistently (${seed})`, () => {
        const text = seed.repeat(max).slice(0, max);
        expect(catalogHeaderErrors({ pages: { products: { [field]: text } } })).toEqual([]);
        expect(catalogHeaderErrors({ pages: { products: { [field]: text + 'x' } } })).toHaveLength(1);
        expect(catalogHeaderErrors({ pages: { products: { [field]: '' } } })).toEqual([]);
      });
    }
    it(`${field} rejects oversized and non-string direct requests before writing`, async () => {
      const prisma = { $transaction: jest.fn() };
      const service = new ThemesService(prisma as any);
      for (const value of ['x'.repeat(max + 100), 'word '.repeat(1900), 42, null, ['text']]) {
        await expect(service.updateStoreThemeConfig({ storeId: 'store' } as any, {
          themeCode: 'aura', configJson: { pages: { products: { [field]: value } } },
        })).rejects.toBeInstanceOf(BadRequestException);
      }
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  }

  it('normalizes only catalog fields without mutating legacy or unrelated settings', () => {
    const source = { extra: { kept: true }, pages: { home: { heroTitle: 'keep' }, products: {
      badgeText: 'a'.repeat(900), pageTitle: '', pageSubtitle: 'word '.repeat(1900), custom: 'keep',
    } } };
    const normalized = normalizeCatalogHeader(source);
    expect(normalized.pages.products.badgeText).toHaveLength(48);
    expect(normalized.pages.products.pageTitle).toBe('');
    expect(normalized.pages.products.pageSubtitle).toHaveLength(220);
    expect(normalized.pages.products.custom).toBe('keep');
    expect(normalized.pages.home).toBe(source.pages.home);
    expect(normalized.extra).toBe(source.extra);
    expect(source.pages.products.badgeText).toHaveLength(900);
    expect(normalizeCatalogHeader({ pages: { home: {} } })).toEqual({ pages: { home: {} } });
  });

  it('saves valid submitted values unchanged in the tenant transaction', async () => {
    const config = { pages: { products: { badgeText: '', pageTitle: 'Our products', pageSubtitle: 'Made with care.' } } };
    const tx = {
      theme: { findUnique: jest.fn().mockResolvedValue({ id: 'theme' }), findFirst: jest.fn() },
      storeThemeConfig: { upsert: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      storeBranding: { findUnique: jest.fn() }, storeSection: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new ThemesService({ $transaction: (callback: any) => callback(tx) } as any);
    await service.updateStoreThemeConfig({ storeId: 'owned-store' } as any, { themeCode: 'aura', configJson: config });
    expect(tx.storeThemeConfig.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { storeId_themeId: { storeId: 'owned-store', themeId: 'theme' } },
      update: expect.objectContaining({ configJson: config }),
    }));
  });
});

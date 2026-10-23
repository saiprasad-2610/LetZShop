import { BadRequestException } from '@nestjs/common';
import {
  ABOUT_TEXT_LIMITS,
  ABOUT_VALUE_LIMITS,
  BRAND_TEXT_LIMITS,
  HOME_TEXT_LIMITS,
  brandTextErrors,
  normalizeBrandText,
} from '@simply/types';
import { ThemesService } from '../../src/modules/themes/themes.service';

const paths = [
  ...Object.entries(HOME_TEXT_LIMITS).map(([key, max]) => ({
    path: ['pages', 'home', key],
    max,
  })),
  ...Object.entries(ABOUT_TEXT_LIMITS).map(([key, max]) => ({
    path: ['pages', 'about', key],
    max,
  })),
  ...[0, 1, 2].flatMap((index) =>
    Object.entries(ABOUT_VALUE_LIMITS).map(([key, max]) => ({
      path: ['pages', 'about', 'values', index, key],
      max,
    })),
  ),
  { path: ['announcement', 'text'], max: BRAND_TEXT_LIMITS.subtitle },
  { path: ['storeStory'], max: ABOUT_TEXT_LIMITS.storyParagraph1 },
  { path: ['physicalStoreAddress'], max: ABOUT_TEXT_LIMITS.storeAddress },
  { path: ['physicalStoreTimings'], max: ABOUT_TEXT_LIMITS.storeHours },
  { path: ['footer', 'contactPhone'], max: ABOUT_TEXT_LIMITS.contactPhone },
  { path: ['footer', 'contactEmail'], max: ABOUT_TEXT_LIMITS.contactEmail },
  { path: ['footer', 'address'], max: ABOUT_TEXT_LIMITS.storeAddress },
];

function configAt(path: Array<string | number>, value: unknown) {
  const result: any = {};
  let target = result;
  path.forEach((key, index) => {
    if (index === path.length - 1) target[key] = value;
    else target = target[key] ||= typeof path[index + 1] === 'number' ? [] : {};
  });
  return result;
}
function valueAt(source: any, path: Array<string | number>) {
  return path.reduce((value, key) => value[key], source);
}

describe('Home/About shared text contract', () => {
  it('preserves the existing inline image upload fallback while rejecting oversized plain URLs', () => {
    const inline = 'data:image/jpeg;base64,' + 'YQ=='.repeat(2000);
    const config = {
      pages: { home: { heroBannerUrl: inline }, about: { bannerUrl: inline } },
    };
    expect(brandTextErrors(config)).toEqual([]);
    expect(normalizeBrandText(config)).toEqual(config);
    expect(
      brandTextErrors({
        pages: {
          home: { heroBannerUrl: 'https://example.test/' + 'a'.repeat(2048) },
        },
      }),
    ).toHaveLength(1);
  });
  for (const { path, max } of paths) {
    it(`${path.join('.')} enforces ${max} UTF-16 units across all three languages`, () => {
      for (const seed of ['English ', 'मराठी मजकूर ', 'हिन्दी विवरण ', '😀']) {
        for (const length of [0, 5, max - 1, max]) {
          expect(
            brandTextErrors(configAt(path, seed.repeat(max).slice(0, length))),
          ).toEqual([]);
        }
        for (const value of [
          seed.repeat(max).slice(0, max) + 'x',
          seed.repeat(16000),
          'word '.repeat(1900),
        ]) {
          const source = configAt(path, value);
          expect(brandTextErrors(source)).not.toHaveLength(0);
          expect(valueAt(normalizeBrandText(source), path)).toBe(
            value.slice(0, max),
          );
          expect(valueAt(source, path)).toBe(value);
        }
      }
    });

    it(`${path.join('.')} rejects oversized direct saves before the tenant transaction`, async () => {
      const prisma = { $transaction: jest.fn() };
      const service = new ThemesService(prisma as any);
      await expect(
        service.updateStoreThemeConfig({ storeId: 'owned-store' } as any, {
          themeCode: 'aura',
          configJson: configAt(path, 'x'.repeat(max + 1)),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  }

  it('preserves unknown nested settings and explicit blanks when normalizing legacy data', () => {
    const source = {
      custom: { keep: true },
      pages: {
        home: { heroTitle: '', extra: 'keep' },
        about: {
          storyParagraph1: 'word '.repeat(1900),
          extra: 'keep',
          values: [{ title: 't'.repeat(900), desc: '', custom: 'keep' }],
        },
      },
      footer: { description: 'unrelated', address: 'a'.repeat(16000) },
    };
    const normalized = normalizeBrandText(source);
    expect(normalized.custom).toBe(source.custom);
    expect(normalized.pages.home).toEqual(source.pages.home);
    expect(normalized.pages.about.storyParagraph1).toHaveLength(700);
    expect(normalized.pages.about.values[0]).toEqual({
      title: 't'.repeat(60),
      desc: '',
      custom: 'keep',
    });
    expect(normalized.footer.description).toBe('unrelated');
    expect(source.pages.about.storyParagraph1).toHaveLength(9500);
    expect(normalizeBrandText(normalized)).toEqual(normalized);
  });

  it('protects the legacy branding announcement endpoint too', async () => {
    const prisma = { storeBranding: { upsert: jest.fn() } };
    const service = new ThemesService(prisma as any);
    await expect(
      service.updateBranding({ storeId: 'owned-store' } as any, {
        announcement: 'x'.repeat(181),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.storeBranding.upsert).not.toHaveBeenCalled();
  });
});

import { BadRequestException } from '@nestjs/common';
import {
  parseSocialLink,
  normalizeSocialLinks,
  normalizeThemeSocialLinks,
  socialLinkErrors,
  themeSocialLinkErrors,
  SOCIAL_PLATFORMS,
  SocialPlatform,
} from '@simply/types';
import { ThemesService } from '../../src/modules/themes/themes.service';
import { SellerController } from '../../src/modules/seller/seller.controller';

const valid: Array<[SocialPlatform, string, string]> = [
  ['instagram', '@brand.name', 'https://instagram.com/brand.name'],
  ['instagram', 'brand_name', 'https://instagram.com/brand_name'],
  ['instagram', ' www.instagram.com/brand/ ', 'https://instagram.com/brand/'],
  ['instagram', 'http://instagram.com/brand', 'https://instagram.com/brand'],
  ['whatsapp', '+91 (98765) 43210', 'https://wa.me/919876543210'],
  ['whatsapp', '919876543210', 'https://wa.me/919876543210'],
  [
    'whatsapp',
    'https://api.whatsapp.com/send?phone=%2B919876543210&text=Hello',
    'https://wa.me/919876543210?text=Hello',
  ],
  ['whatsapp', 'wa.me/919876543210', 'https://wa.me/919876543210'],
  [
    'whatsapp',
    'https://wa.me/message/ABCDEF1234',
    'https://wa.me/message/ABCDEF1234',
  ],
  ['facebook', 'brand.page', 'https://facebook.com/brand.page'],
  [
    'facebook',
    'https://www.facebook.com/profile.php?id=123456',
    'https://facebook.com/profile.php?id=123456',
  ],
  ['youtube', '@brandchannel', 'https://youtube.com/@brandchannel'],
  [
    'youtube',
    '@मराठीदुकान',
    'https://youtube.com/@' + encodeURIComponent('मराठीदुकान'),
  ],
  [
    'youtube',
    'https://www.youtube.com/channel/UC_abcdef123',
    'https://youtube.com/channel/UC_abcdef123',
  ],
  [
    'youtube',
    'https://youtube.com/@brandchannel',
    'https://youtube.com/@brandchannel',
  ],
  ['twitter', '@brand_name', 'https://x.com/brand_name'],
  ['twitter', 'brand', 'https://x.com/brand'],
  [
    'twitter',
    'https://twitter.com/brand/status/123',
    'https://x.com/brand/status/123',
  ],
  ['linkedin', 'brand-company', 'https://linkedin.com/company/brand-company'],
  [
    'linkedin',
    'https://www.linkedin.com/in/person-name/',
    'https://linkedin.com/in/person-name/',
  ],
  [
    'linkedin',
    'https://linkedin.com/company/brand/',
    'https://linkedin.com/company/brand/',
  ],
];
describe('shared social-link contract', () => {
  it.each(valid)('normalizes supported %s input %s', (platform, raw, url) => {
    expect(parseSocialLink(platform, raw)).toEqual({ valid: true, url });
    expect(parseSocialLink(platform, url)).toEqual({ valid: true, url });
  });
  it.each(SOCIAL_PLATFORMS)(
    'rejects unsafe and off-platform %s values',
    (platform) => {
      for (const raw of [
        'arbitrary invalid text',
        'javascript:alert(1)',
        'data:text/html,hello',
        'https://evil.test/name',
        'https://instagram.com.evil.test/brand',
        'https://evil.test@instagram.com/brand',
        'https://instagram.com:8080/brand',
        '<script>alert(1)</script>',
        'bad\nhandle',
        'x'.repeat(2049),
        123,
        null,
        {},
        [],
      ])
        expect(parseSocialLink(platform, raw)).toEqual({
          valid: false,
          url: '',
        });
      expect(parseSocialLink(platform, '')).toEqual({ valid: true, url: '' });
    },
  );
  it.each([
    ['instagram', '@bad..name'],
    ['instagram', 'bad/name'],
    ['instagram', 'a'.repeat(31)],
    ['whatsapp', '+0001234567'],
    ['whatsapp', 'call 919876543210'],
    ['whatsapp', '12345'],
    ['whatsapp', 'https://wa.me/notaphone'],
    ['whatsapp', 'https://api.whatsapp.com/send?text=hello'],
    ['youtube', 'plainchannel'],
    ['youtube', '@x'],
    ['twitter', 'a'.repeat(16)],
    ['linkedin', 'https://linkedin.com/not-a-profile'],
    ['linkedin', 'bad company slug'],
  ])('rejects invalid %s format %s', (platform, raw) =>
    expect(parseSocialLink(platform as SocialPlatform, raw).valid).toBe(false),
  );
  it('rejects canonical WhatsApp URLs that exceed the bound after encoding', () => {
    expect(
      parseSocialLink(
        'whatsapp',
        'https://api.whatsapp.com/send?phone=919876543210&text=' +
          'अ'.repeat(500),
      ).valid,
    ).toBe(false);
  });
  it('preserves unrelated delivery metadata and does not mutate the source', () => {
    const source = {
      instagram: '@brand',
      facebook: 'bad text',
      deliveryPartners: [{ name: 'Courier' }],
    };
    expect(normalizeSocialLinks(source)).toEqual({
      ...source,
      instagram: 'https://instagram.com/brand',
      facebook: '',
    });
    expect(source.instagram).toBe('@brand');
    expect(socialLinkErrors(source)).toEqual([
      expect.stringContaining('facebook'),
    ]);
  });
  it('validates and normalizes both current and legacy footer branches', () => {
    const config = {
      footer: { socialLinks: { instagram: '@brand' } },
      pages: { footer: { socialLinks: { youtube: 'bad text' } } },
      custom: 42,
    };
    expect(themeSocialLinkErrors(config)).toEqual([
      expect.stringContaining('configJson.pages.footer.socialLinks.youtube'),
    ]);
    expect(normalizeThemeSocialLinks(config)).toEqual({
      ...config,
      footer: { socialLinks: { instagram: 'https://instagram.com/brand' } },
      pages: { footer: { socialLinks: { youtube: '' } } },
    });
    expect(config.pages.footer.socialLinks.youtube).toBe('bad text');
  });
  it('rejects theme social payloads before any transaction or write', async () => {
    const prisma = { $transaction: jest.fn() };
    const service = new ThemesService(prisma as any);
    await expect(
      service.updateStoreThemeConfig({} as any, {
        configJson: { footer: { socialLinks: { instagram: 'bad text' } } },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('also rejects the store-settings bypass before a database write', async () => {
    const controller = Object.create(SellerController.prototype);
    controller.prisma = { store: { update: jest.fn() } };
    await expect(
      controller.updateStore({} as any, {
        socialLinks: { twitter: 'bad text' },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(controller.prisma.store.update).not.toHaveBeenCalled();
  });
});

/** One platform-aware contract for Brand Studio, API writes and storefront links. */
export const SOCIAL_PLATFORMS = [
  'instagram',
  'whatsapp',
  'facebook',
  'youtube',
  'twitter',
  'linkedin',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export const SOCIAL_LINK_MAX = 2048;
export const SOCIAL_INPUT_EXAMPLES: Record<SocialPlatform, string> = {
  instagram: 'https://instagram.com/yourbrand or @yourbrand',
  whatsapp: '+919876543210 or https://wa.me/919876543210',
  facebook: 'https://facebook.com/yourpage or yourpage',
  youtube: 'https://youtube.com/@yourchannel or @yourchannel',
  twitter: 'https://x.com/yourbrand or @yourbrand',
  linkedin:
    'https://linkedin.com/company/yourbrand, /in/yourname or a company slug',
};
const hosts: Record<SocialPlatform, readonly string[]> = {
  instagram: ['instagram.com', 'www.instagram.com', 'm.instagram.com'],
  whatsapp: ['wa.me', 'www.wa.me', 'api.whatsapp.com'],
  facebook: [
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'web.facebook.com',
  ],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
  twitter: [
    'x.com',
    'www.x.com',
    'twitter.com',
    'www.twitter.com',
    'mobile.twitter.com',
  ],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
};
const instagramHandle = (s: string) =>
  /^[a-z\d_](?:[a-z\d_.]{0,28}[a-z\d_])?$/i.test(s) && !s.includes('..');
const twitterHandle = (s: string) => /^[a-z\d_]{1,15}$/i.test(s);
const facebookSlug = (s: string) =>
  /^[a-z\d][a-z\d._-]{1,98}[a-z\d]$/i.test(s) && !s.includes('..');
const companySlug = (s: string) => /^[a-z\d][a-z\d-]{1,98}[a-z\d]$/i.test(s);
const youtubeHandle = (s: string) =>
  /^[\p{L}\p{N}_][\p{L}\p{N}\p{M}_.-]{1,28}[\p{L}\p{N}\p{M}_]$/u.test(s);
const phoneDigits = (s: string) =>
  /^\+?[\d ()-]+$/.test(s) && /^[1-9]\d{7,14}$/.test(s.replace(/\D/g, ''))
    ? s.replace(/\D/g, '')
    : '';

export function parseSocialLink(
  platform: SocialPlatform,
  raw: unknown,
): { url: string; valid: boolean } {
  const invalid = { url: '', valid: false };
  if (typeof raw !== 'string')
    return raw === undefined ? { url: '', valid: true } : invalid;
  const value = raw.trim();
  if (!value) return { url: '', valid: true };
  if (value.length > SOCIAL_LINK_MAX || /[\u0000-\u001f\u007f]/.test(value))
    return invalid;
  const looksLikeUrl =
    /[:/]/.test(value) ||
    hosts[platform].some(
      (host) => value === host || value.startsWith(host + '/'),
    );
  if (looksLikeUrl) {
    if (/\s/.test(value) || /\\/.test(value)) return invalid;
    try {
      const url = new URL(
        /^[a-z][a-z\d+.-]*:/i.test(value) ? value : 'https://' + value,
      );
      if (
        !['https:', 'http:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.port ||
        !(
          hosts[platform].includes(url.hostname) ||
          (platform === 'linkedin' &&
            /^[a-z]{2}\.linkedin\.com$/.test(url.hostname))
        )
      )
        return invalid;
      const pathname = decodeURIComponent(url.pathname);
      if (/\s|[\u0000-\u001f\u007f\\]/.test(pathname)) return invalid;
      const parts = pathname.split('/').filter(Boolean);
      if (!parts.length) return invalid;
      if (platform === 'whatsapp') {
        if (url.hostname === 'api.whatsapp.com') {
          if (pathname !== '/send' && pathname !== '/send/') return invalid;
          const phone = phoneDigits(url.searchParams.get('phone') || '');
          if (!phone) return invalid;
          const target = new URL('https://wa.me/' + phone);
          if (url.searchParams.has('text'))
            target.searchParams.set('text', url.searchParams.get('text')!);
          return target.href.length <= SOCIAL_LINK_MAX
            ? { url: target.href, valid: true }
            : invalid;
        }
        if (
          parts.length === 2 &&
          parts[0] === 'message' &&
          /^[a-z\d]{6,64}$/i.test(parts[1])
        ) {
          url.hostname = 'wa.me';
        } else {
          const phone = parts.length === 1 ? phoneDigits(parts[0]) : '';
          if (!phone) return invalid;
          url.hostname = 'wa.me';
          url.pathname = '/' + phone;
        }
      } else if (platform === 'linkedin') {
        if (
          parts.length < 2 ||
          !['company', 'in'].includes(parts[0]) ||
          !/^[\p{L}\p{N}_-]+$/u.test(parts[1])
        )
          return invalid;
        url.hostname = 'linkedin.com';
      } else if (platform === 'youtube') {
        // Existing channel vanity/subpage and video URLs remain valid platform links.
        if (parts[0].startsWith('@') && !youtubeHandle(parts[0].slice(1)))
          return invalid;
        if (!/^@?[\p{L}\p{N}\p{M}_.-]+$/u.test(parts[0])) return invalid;
        if (
          ['channel', 'c', 'user'].includes(parts[0]) &&
          (parts.length < 2 || !/^[\p{L}\p{N}\p{M}_.-]+$/u.test(parts[1]))
        )
          return invalid;
        url.hostname = 'youtube.com';
      } else {
        if (platform === 'instagram' && !instagramHandle(parts[0]))
          return invalid;
        if (platform === 'twitter' && !twitterHandle(parts[0])) return invalid;
        if (
          platform === 'facebook' &&
          parts[0] === 'profile.php' &&
          !/^\d{1,30}$/.test(url.searchParams.get('id') || '')
        )
          return invalid;
        if (platform === 'facebook' && !/^[\p{L}\p{N}_.-]+$/u.test(parts[0]))
          return invalid;
        url.hostname = platform === 'twitter' ? 'x.com' : platform + '.com';
      }
      url.protocol = 'https:';
      const canonical = url.toString();
      return canonical.length <= SOCIAL_LINK_MAX
        ? { url: canonical, valid: true }
        : invalid;
    } catch {
      return invalid;
    }
  }
  const handle = value.replace(/^@/, '');
  if (platform === 'instagram' && instagramHandle(handle))
    return { url: 'https://instagram.com/' + handle, valid: true };
  if (platform === 'twitter' && twitterHandle(handle))
    return { url: 'https://x.com/' + handle, valid: true };
  if (platform === 'facebook' && facebookSlug(handle))
    return { url: 'https://facebook.com/' + handle, valid: true };
  if (platform === 'youtube' && value.startsWith('@') && youtubeHandle(handle))
    return { url: new URL('https://youtube.com/@' + handle).href, valid: true };
  // Legacy footer rendering already supported company slugs.
  if (platform === 'linkedin' && companySlug(value))
    return { url: 'https://linkedin.com/company/' + value, valid: true };
  if (platform === 'whatsapp' && phoneDigits(value))
    return { url: 'https://wa.me/' + phoneDigits(value), valid: true };
  return invalid;
}

const isObject = (value: unknown): value is Record<string, any> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));
/** Drop invalid known links, preserving unrelated metadata such as deliveryPartners. */
export function normalizeSocialLinks(value: unknown): Record<string, any> {
  const result = isObject(value) ? { ...value } : {};
  for (const platform of SOCIAL_PLATFORMS)
    if (Object.prototype.hasOwnProperty.call(result, platform))
      result[platform] = parseSocialLink(platform, result[platform]).url;
  return result;
}
export function socialLinkErrors(
  value: unknown,
  path = 'socialLinks',
): string[] {
  if (value === undefined) return [];
  if (!isObject(value)) return [path + ' must be an object'];
  return SOCIAL_PLATFORMS.filter(
    (platform) => !parseSocialLink(platform, value[platform]).valid,
  ).map(
    (platform) =>
      `${path}.${platform}: enter ${SOCIAL_INPUT_EXAMPLES[platform]}`,
  );
}
export function themeSocialLinkErrors(config: any): string[] {
  return [
    ...socialLinkErrors(
      config?.footer?.socialLinks,
      'configJson.footer.socialLinks',
    ),
    ...socialLinkErrors(
      config?.pages?.footer?.socialLinks,
      'configJson.pages.footer.socialLinks',
    ),
  ];
}
export function normalizeThemeSocialLinks<T>(config: T): T {
  if (!isObject(config)) return config;
  const result = { ...config } as any;
  if (isObject(result.footer) && result.footer.socialLinks !== undefined)
    result.footer = {
      ...result.footer,
      socialLinks: normalizeSocialLinks(result.footer.socialLinks),
    };
  if (
    isObject(result.pages?.footer) &&
    result.pages.footer.socialLinks !== undefined
  )
    result.pages = {
      ...result.pages,
      footer: {
        ...result.pages.footer,
        socialLinks: normalizeSocialLinks(result.pages.footer.socialLinks),
      },
    };
  return result;
}

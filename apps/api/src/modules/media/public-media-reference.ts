import { isPublicMediaKey } from './local-media-root';

const IMAGE_REFERENCE =
  /^(?:publicUrl|url|logoUrl|faviconUrl|bannerUrl|heroBannerUrl|imageUrl|backgroundImage|backgroundImageUrl)$/;

export function publicMediaReference(
  value: string,
  prefix = process.env.MEDIA_PUBLIC_URL_PREFIX,
): string {
  if (/^(?:blob:|file:|[a-z]:[\\/])/i.test(value)) return '';
  // Existing local-provider rows may retain a development host after deployment.
  // Reuse the configured provider prefix rather than rewriting merchant data or external CDN URLs.
  if (
    !prefix ||
    !/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/media\//i.test(
      value,
    )
  )
    return value;
  const key = new URL(value).pathname.replace(/^\/media\/(?:file\/)?/, '');
  return isPublicMediaKey(key) ? `${prefix.replace(/\/+$/, '')}/${key}` : '';
}

export function normalizePublicMedia<T>(value: T): T {
  if (Array.isArray(value)) return value.map(normalizePublicMedia) as T;
  if (
    !value ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      IMAGE_REFERENCE.test(key) && typeof entry === 'string'
        ? publicMediaReference(entry)
        : normalizePublicMedia(entry),
    ]),
  ) as T;
}

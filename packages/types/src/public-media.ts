const MEDIA_KEYS =
  /^(?:logoUrl|faviconUrl|bannerUrl|heroBannerUrl|imageUrl|backgroundImage|backgroundImageUrl)$/;

/** Validate persisted image fields, while retaining existing bounded inline image support. */
export function publicMediaErrors(value: unknown, path = 'media'): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, entry]) => {
    const field = `${path}.${key}`;
    if (MEDIA_KEYS.test(key) && typeof entry === 'string' && entry.trim()) {
      const url = entry.trim();
      if (
        /^https?:\/\//i.test(url) ||
        /^\/media\//.test(url) ||
        /^data:image\/(png|jpe?g|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(url)
      )
        return [];
      return [
        `${field}: upload an image or use a public HTTP(S) image URL; browser-local URLs cannot be saved.`,
      ];
    }
    return publicMediaErrors(entry, field);
  });
}

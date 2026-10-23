/** Canonical path-based public routing. Display names never participate in URLs. */
export function getPublicStoreUrl(
  store: { slug: string } | string,
  origin: string = '',
  options: { preview?: boolean; previewSecret?: string; page?: 'products' | 'about' } = {},
): string {
  const slug = typeof store === 'string' ? store : store.slug;
  const url = `${origin.replace(/\/+$/, '')}/store/${encodeURIComponent(slug)}${options.page ? `/${options.page}` : ''}`;
  if (options.previewSecret)
    return `${url}?previewSecret=${encodeURIComponent(options.previewSecret)}`;
  return options.preview ? `${url}?preview=true` : url;
}

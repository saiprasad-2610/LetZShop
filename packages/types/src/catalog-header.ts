/** Catalog text uses UTF-16 string.length/slice in every application. */
export const CATALOG_EYEBROW_MAX = 48;
export const CATALOG_TITLE_MAX = 80;
export const CATALOG_SUBTITLE_MAX = 220;

export const CATALOG_HEADER_LIMITS = {
  badgeText: CATALOG_EYEBROW_MAX,
  pageTitle: CATALOG_TITLE_MAX,
  pageSubtitle: CATALOG_SUBTITLE_MAX,
} as const;

export function clampCatalogText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

/** Copy only the affected branches; preserve unknown settings and explicit blanks. */
export function normalizeCatalogHeader<T>(config: T): T {
  const source = config as any;
  const products = source?.pages?.products;
  if (!products || typeof products !== 'object' || Array.isArray(products)) return config;
  const normalized = { ...products };
  for (const [field, max] of Object.entries(CATALOG_HEADER_LIMITS)) {
    if (Object.prototype.hasOwnProperty.call(products, field)) {
      normalized[field] = clampCatalogText(products[field], max);
    }
  }
  return { ...source, pages: { ...source.pages, products: normalized } };
}

/** Validate submitted values before any database writes, without altering the request. */
export function catalogHeaderErrors(config: unknown): string[] {
  const products = (config as any)?.pages?.products;
  if (products === undefined) return [];
  if (!products || typeof products !== 'object' || Array.isArray(products)) {
    return ['configJson.pages.products must be an object'];
  }
  return Object.entries(CATALOG_HEADER_LIMITS).flatMap(([field, max]) => {
    const value = products[field];
    if (value === undefined) return [];
    if (typeof value !== 'string') return [`configJson.pages.products.${field} must be a string`];
    return value.length > max ? [`configJson.pages.products.${field} must be at most ${max} characters`] : [];
  });
}

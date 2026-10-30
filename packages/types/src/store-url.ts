export interface StoreUrlTarget {
  slug: string;
  subdomain?: string | null;
  customDomain?: string | null;
}

export interface StoreUrlOptions {
  preview?: boolean;
  previewSecret?: string;
  page?: 'products' | 'about' | 'cart' | 'checkout' | string;
  preferSubdomain?: boolean;
  subdomain?: string | null;
  customDomain?: string | null;
}

/**
 * Constructs the canonical public URL for a store.
 * Supports:
 * 1. Verified custom domains (e.g. https://www.sairamtea.com)
 * 2. Merchant subdomains (e.g. https://sairamtea.letzshop.store or http://sairamtea.localhost:3000)
 * 3. Backward-compatible path routing (e.g. https://letzshop.store/store/sairam-tea)
 */
export function getPublicStoreUrl(
  store: StoreUrlTarget | string,
  origin: string = '',
  options?: StoreUrlOptions | string | null,
): string {
  const safeOptions: StoreUrlOptions =
    typeof options === 'string'
      ? { customDomain: options }
      : options || {};

  const slug = typeof store === 'string' ? store : store.slug;
  const subdomain =
    typeof store === 'string'
      ? safeOptions.subdomain || store
      : store.subdomain || safeOptions.subdomain;
  const customDomain =
    typeof store === 'string'
      ? safeOptions.customDomain
      : store.customDomain || safeOptions.customDomain;
  const pagePath = safeOptions.page ? `/${safeOptions.page.replace(/^\/+/, '')}` : '';

  // 1. Priority 1: Verified Custom Domain
  if (customDomain && customDomain.trim()) {
    const cleanDomain = customDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const url = `https://${cleanDomain}${pagePath}`;
    return appendQueryParameters(url, safeOptions);
  }

  // 2. Priority 2: Subdomain routing (preferred by default unless explicitly disabled)
  const shouldPreferSubdomain = safeOptions.preferSubdomain !== false;
  if (subdomain && subdomain.trim() && shouldPreferSubdomain) {
    const cleanSubdomain = subdomain.trim().toLowerCase();
    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    if (cleanOrigin) {
      try {
        const parsed = new URL(cleanOrigin.startsWith('http') ? cleanOrigin : `https://${cleanOrigin}`);
        const hostname = parsed.hostname.toLowerCase();
        const portStr = parsed.port ? `:${parsed.port}` : '';
        const protocol = parsed.protocol || 'https:';

        // Local development: http://subdomain.localhost:3000
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          const url = `${protocol}//${cleanSubdomain}.localhost${portStr}${pagePath}`;
          return appendQueryParameters(url, safeOptions);
        }

        // Wildcard production / staging root domain:
        // Strip www. or previous subdomains, resolve to root apex (e.g. letzshop.store)
        const hostParts = hostname.split('.');
        let rootDomain = hostname;
        if (hostParts.length > 2) {
          if (hostParts[0] === 'www') {
            rootDomain = hostParts.slice(1).join('.');
          } else if (hostname.endsWith('letzshop.store')) {
            rootDomain = 'letzshop.store';
          }
        }

        const url = `${protocol}//${cleanSubdomain}.${rootDomain}${portStr}${pagePath}`;
        return appendQueryParameters(url, safeOptions);
      } catch {
        // Fallback to path routing if origin is not a parseable URL
      }
    }
  }

  // 3. Legacy path-based routing (preserves full backward compatibility)
  const cleanOrigin = origin.replace(/\/+$/, '');
  const url = `${cleanOrigin}/store/${encodeURIComponent(slug)}${pagePath}`;
  return appendQueryParameters(url, safeOptions);
}

/**
 * Generates the permanent LetZShop redirect URL encoded in the merchant QR code.
 */
export function getPermanentQrUrl(token: string, baseOrigin: string = 'https://letzshop.store'): string {
  const cleanOrigin = baseOrigin.replace(/\/+$/, '');
  return `${cleanOrigin}/q/${encodeURIComponent(token.trim())}`;
}

function appendQueryParameters(baseUrl: string, options: StoreUrlOptions): string {
  const query = new URLSearchParams();
  if (options.previewSecret) {
    query.set('previewSecret', options.previewSecret);
  }
  if (options.preview) {
    query.set('preview', 'true');
  }

  const qs = query.toString();
  if (!qs) return baseUrl;
  return baseUrl.includes('?') ? `${baseUrl}&${qs}` : `${baseUrl}?${qs}`;
}

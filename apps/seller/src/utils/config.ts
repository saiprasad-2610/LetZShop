/**
 * Environment-safe URL configuration helpers for Seller Portal.
 * Resolves origins without hardcoding localhost in production
 * and without routing to suspended or deprecated endpoints.
 */

export function getStorefrontUrl(): string {
  // 1. Explicit build/runtime environment variable
  const envStorefront =
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    process.env.STOREFRONT_URL ||
    process.env.STOREFRONT_BASE_URL;

  if (envStorefront && envStorefront.trim() !== '') {
    return envStorefront.trim().replace(/\/+$/, '');
  }

  // 2. Client-side dynamic origin resolution
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();

    // Local development
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      return `http://${host}:3000`;
    }

    // Letz Shop production domain
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://letzshop.store';
    }

    // Dynamic sibling resolution if deployed on a custom domain with subdomains
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        return `${window.location.protocol}//${parts.slice(-2).join('.')}`;
      }
    }
  }

  // 3. Server-side SSR / SSG build fallback
  return 'http://localhost:3000';
}

export function getSellerUrl(): string {
  // 1. Explicit build/runtime environment variable
  const envSeller =
    process.env.NEXT_PUBLIC_SELLER_URL ||
    process.env.SELLER_URL ||
    process.env.SELLER_DASHBOARD_URL;

  if (envSeller && envSeller.trim() !== '') {
    return envSeller.trim().replace(/\/+$/, '');
  }

  // 2. Client-side dynamic origin resolution
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();

    // Local development
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      return `http://${host}:3001`;
    }

    // Letz Shop production domain
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://seller.letzshop.store';
    }

    // Dynamic sibling resolution if deployed on a custom domain with subdomains
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        return `${window.location.protocol}//seller.${parts.slice(-2).join('.')}`;
      }
    }
  }

  // 3. Server-side SSR / SSG build fallback
  return 'http://localhost:3001';
}

export function getStoreCustomerPreviewUrl(slug: string): string {
  const origin = getStorefrontUrl();
  return `${origin}/store/${slug}?preview=true`;
}

export function getStorePublicShareUrl(slug: string, isLive: boolean = false): string {
  const origin = getStorefrontUrl();
  return `${origin}/store/${slug}${isLive ? '' : '?preview=true'}`;
}

/**
 * Environment-safe URL configuration helpers for Seller Portal.
 * Resolves origins without hardcoding localhost in production.
 */

export function getStorefrontUrl(): string {
  // 1. Explicit build/runtime environment variable
  if (process.env.NEXT_PUBLIC_STOREFRONT_URL && process.env.NEXT_PUBLIC_STOREFRONT_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_STOREFRONT_URL.trim().replace(/\/+$/, '');
  }

  // 2. Client-side dynamic origin resolution
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();

    // Vercel deployment detection
    if (host.includes('vercel.app')) {
      return 'https://letzshop-storefront.vercel.app';
    }

    // Render cloud deployment (fallback)
    if (host.includes('onrender.com')) {
      return 'https://letzshop-storefront.vercel.app';
    }

    // Letz Shop production domain
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://letzshop.store';
    }

    // Any other live production domain or public IP
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      return 'https://letzshop-storefront.vercel.app';
    }
  }

  // 3. Server-side SSR / SSG build fallback: in production or cloud builds, default to deployed storefront URL
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' || process.env.VERCEL === '1') {
    return 'https://letzshop-storefront.vercel.app';
  }

  // 4. Fallback for local development
  return 'http://localhost:3000';
}

export function getSellerUrl(): string {
  // 1. Explicit build/runtime environment variable
  if (process.env.NEXT_PUBLIC_SELLER_URL && process.env.NEXT_PUBLIC_SELLER_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_SELLER_URL.trim().replace(/\/+$/, '');
  }

  // 2. Client-side dynamic origin resolution
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();

    // Vercel deployment detection
    if (host.includes('vercel.app')) {
      return 'https://let-z-shop.vercel.app';
    }

    // Render cloud deployment
    if (host.includes('onrender.com')) {
      return 'https://let-z-shop.vercel.app';
    }

    // Letz Shop production domain
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://seller.letzshop.store';
    }

    // Any other live production domain or public IP
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      return 'https://let-z-shop.vercel.app';
    }
  }

  // 3. Server-side SSR / SSG build fallback: in production or cloud builds, default to deployed seller URL
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' || process.env.VERCEL === '1') {
    return 'https://let-z-shop.vercel.app';
  }

  // 4. Fallback for local development
  return 'http://localhost:3001';
}

export interface StorePreviewOptions {
  previewSecret?: string;
  subpath?: string;
}

export function getStoreCustomerPreviewUrl(
  slug: string,
  options?: StorePreviewOptions | string
): string {
  const origin = getStorefrontUrl();
  let subpath = '';
  let previewSecret: string | undefined;

  if (typeof options === 'string') {
    subpath = options;
  } else if (options) {
    subpath = options.subpath || '';
    previewSecret = options.previewSecret;
  }

  const cleanSubpath = subpath ? (subpath.startsWith('/') ? subpath : `/${subpath}`) : '';
  const params = new URLSearchParams({ preview: 'true' });
  if (previewSecret && previewSecret.trim()) {
    params.set('previewSecret', previewSecret.trim());
  }
  return `${origin}/store/${slug}${cleanSubpath}?${params.toString()}`;
}

export function getStorePublicShareUrl(
  slug: string,
  isLive: boolean = false,
  previewSecret?: string
): string {
  const origin = getStorefrontUrl();
  if (isLive) {
    return `${origin}/store/${slug}`;
  }
  const params = new URLSearchParams({ preview: 'true' });
  if (previewSecret && previewSecret.trim()) {
    params.set('previewSecret', previewSecret.trim());
  }
  return `${origin}/store/${slug}?${params.toString()}`;
}

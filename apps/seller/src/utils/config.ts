import { getPublicStoreUrl } from '@simply/types';

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
      if (parts.length >= 2 && !host.includes('vercel.app') && !host.includes('onrender.com')) {
        return `${window.location.protocol}//${parts.slice(-2).join('.')}`;
      }
    }

    // Vercel deployment detection
    if (host.includes('vercel.app')) {
      return 'https://letzshop-storefront.vercel.app';
    }

    // Render cloud deployment (fallback)
    if (host.includes('onrender.com')) {
      return 'https://letzshop-storefront.vercel.app';
    }

    // Any other live production domain or public IP
    return 'https://letzshop-storefront.vercel.app';
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
      if (parts.length >= 2 && !host.includes('vercel.app') && !host.includes('onrender.com')) {
        return `${window.location.protocol}//seller.${parts.slice(-2).join('.')}`;
      }
    }

    // Vercel deployment detection
    if (host.includes('vercel.app')) {
      return 'https://let-z-shop.vercel.app';
    }

    // Render cloud deployment
    if (host.includes('onrender.com')) {
      return 'https://let-z-shop.vercel.app';
    }

    // Any other live production domain or public IP
    return 'https://let-z-shop.vercel.app';
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
  page?: 'products' | 'about';
}

export function getStoreCustomerPreviewUrl(
  slug: string,
  options?: StorePreviewOptions | string
): string {
  const origin = getStorefrontUrl();
  let subpath = '';
  let previewSecret: string | undefined;

  if (typeof options === 'string') {
    if (options === 'products' || options === 'about') {
      return getPublicStoreUrl(slug, origin, { preview: true, page: options });
    }
    subpath = options;
  } else if (options) {
    if (options.page) {
      return getPublicStoreUrl(slug, origin, {
        preview: true,
        previewSecret: options.previewSecret,
        page: options.page,
      });
    }
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

import { getPublicStoreUrl } from '@simply/types';

/**
 * Environment-safe URL configuration helpers for Seller Portal.
 * Resolves origins without hardcoding localhost in production
 */

export function getStorefrontUrl(): string {
  // 1. Explicit build/runtime environment variable
  const envStorefront =
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    process.env.STOREFRONT_PUBLIC_URL ||
    process.env.STOREFRONT_URL ||
    process.env.STOREFRONT_BASE_URL;

  if (envStorefront && envStorefront.trim() !== '') {
    return envStorefront.trim().replace(/\/+$/, '');
  }

  // 2. Client-side runtime detection
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.host.toLowerCase();

    // Local development
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const port = window.location.port ? ':3000' : '';
      return `${window.location.protocol}//${window.location.hostname}${port}`;
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
  return process.env.NODE_ENV === 'production' ? 'https://www.letzshop.store' : 'http://localhost:3000';
}

export function getSellerUrl(): string {
  // 1. Explicit build/runtime environment variable
  const envSeller =
    process.env.NEXT_PUBLIC_SELLER_URL ||
    process.env.SELLER_PUBLIC_URL ||
    process.env.SELLER_URL ||
    process.env.SELLER_DASHBOARD_URL;

  if (envSeller && envSeller.trim() !== '') {
    return envSeller.trim().replace(/\/+$/, '');
  }

  // 2. Client-side runtime detection
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.host.toLowerCase();

    // Local development
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const port = window.location.port ? ':3001' : '';
      return `${window.location.protocol}//${window.location.hostname}${port}`;
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
  return process.env.NODE_ENV === 'production' ? 'https://seller.letzshop.store' : 'http://localhost:3001';
}

export interface StorePreviewOptions {
  previewSecret?: string;
  subpath?: string;
  page?: 'products' | 'about';
}

export function getStoreCustomerPreviewUrl(
  slug: string,
  options?: StorePreviewOptions | 'products' | 'about'
): string {
  const origin = getStorefrontUrl();
  if (typeof options === 'string') {
    return getPublicStoreUrl(slug, origin, { preview: true, page: options });
  }
  return getPublicStoreUrl(slug, origin, {
    preview: true,
    previewSecret: options?.previewSecret,
    page: options?.page,
  });
}

export function getStorePublicShareUrl(
  slug: string,
  isLive: boolean = false,
  previewSecret?: string
): string {
  const origin = getStorefrontUrl();
  if (isLive) {
    return getPublicStoreUrl(slug, origin);
  }
  return getPublicStoreUrl(slug, origin, { preview: true, previewSecret });
}

export function getApiUrl(): string {
  const envApi =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.API_URL;
  if (envApi && envApi.trim() !== '') {
    return envApi.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      return `http://${host}:4000`;
    }
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://api.letzshop.store';
    }
  }
  return process.env.NODE_ENV === 'production' ? 'https://api.letzshop.store' : 'http://localhost:4000';
}

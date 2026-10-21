/**
 * Environment-safe URL configuration helpers for Storefront.
 * Resolves Seller Portal origin without hardcoding localhost in production.
 */

export function getSellerUrl(): string {
  // 1. Explicit build/runtime environment variable
  if (process.env.NEXT_PUBLIC_SELLER_URL && process.env.NEXT_PUBLIC_SELLER_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_SELLER_URL.trim().replace(/\/+$/, '');
  }

  // 2. Client-side dynamic origin resolution based on actual browser location
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

    // Letz Shop production domain (e.g. letzshop.store, *.letzshop.store)
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://seller.letzshop.store';
    }

    // Any other live production domain or public IP (never send users to localhost from a remote domain)
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      return 'https://let-z-shop.vercel.app';
    }
  }

  // 3. Server-side SSR / SSG build fallback: in production or cloud builds, default to deployed seller URL
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' || process.env.VERCEL === '1') {
    return 'https://let-z-shop.vercel.app';
  }

  // 4. Fallback for local development only
  return 'http://localhost:3001';
}

export function getSellerStorePreviewUrl(): string {
  const sellerOrigin = getSellerUrl();
  return `${sellerOrigin}/store-preview`;
}

export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('onrender.com')) {
      return 'https://simply-ecommerce-api.onrender.com';
    }
  }
  return 'http://localhost:4000';
}

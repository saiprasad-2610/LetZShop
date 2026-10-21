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

    // Render cloud deployment
    if (host.includes('onrender.com')) {
      return 'https://simply-ecommerce-storefront.onrender.com';
    }

    // Letz Shop production domain
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://letzshop.store';
    }

    // Any other live production domain or public IP
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      return 'https://simply-ecommerce-storefront.onrender.com';
    }
  }

  // 3. Server-side SSR / SSG build fallback: in production or cloud builds, default to deployed storefront URL
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    return 'https://simply-ecommerce-storefront.onrender.com';
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

    // Render cloud deployment
    if (host.includes('onrender.com')) {
      return 'https://simply-ecommerce-seller.onrender.com';
    }

    // Letz Shop production domain
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://seller.letzshop.store';
    }

    // Any other live production domain or public IP
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      return 'https://simply-ecommerce-seller.onrender.com';
    }
  }

  // 3. Server-side SSR / SSG build fallback: in production or cloud builds, default to deployed seller URL
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    return 'https://simply-ecommerce-seller.onrender.com';
  }

  // 4. Fallback for local development
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

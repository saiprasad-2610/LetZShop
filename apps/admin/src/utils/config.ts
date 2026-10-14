/**
 * Environment-safe URL configuration helpers for Admin Portal.
 * Resolves origins without hardcoding localhost in production.
 */

export function getStorefrontUrl(): string {
  if (process.env.NEXT_PUBLIC_STOREFRONT_URL && process.env.NEXT_PUBLIC_STOREFRONT_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_STOREFRONT_URL.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('onrender.com')) {
      return 'https://simply-e-commerce-frontend.onrender.com';
    }
    if (host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://letzshop.store';
    }
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      return 'https://simply-e-commerce-frontend.onrender.com';
    }
  }

  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    return 'https://simply-e-commerce-frontend.onrender.com';
  }

  return 'http://localhost:3000';
}

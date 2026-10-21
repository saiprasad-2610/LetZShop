/**
 * Environment-safe URL configuration helpers for Admin Portal.
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
    // Local development origins
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return 'http://localhost:3000';
    }
    // Vercel deployment detection
    if (host.includes('vercel.app')) {
      return 'https://letzshop-storefront.vercel.app';
    }
    // Render cloud deployment
    if (host.includes('onrender.com')) {
      return 'https://letzshop-storefront.vercel.app';
    }
    // Production LetzShop domain
    if (host === 'admin.letzshop.store' || host === 'letzshop.store' || host.endsWith('.letzshop.store')) {
      return 'https://letzshop.store';
    }
    // Any other live production domain or public IP
    return 'https://letzshop-storefront.vercel.app';
  }

  // 3. Fallback for production cloud builds
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' || process.env.VERCEL === '1') {
    return 'https://letzshop-storefront.vercel.app';
  }

  // 4. Fallback for local development
  return 'http://localhost:3000';
}

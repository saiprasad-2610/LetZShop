/**
 * Environment-safe URL configuration helpers for Seller Portal.
 * Resolves origins without hardcoding localhost in production.
 */

export function getStorefrontUrl(): string {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STOREFRONT_URL) {
    return process.env.NEXT_PUBLIC_STOREFRONT_URL;
  }
  return process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';
}

export function getSellerUrl(): string {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SELLER_URL) {
    return process.env.NEXT_PUBLIC_SELLER_URL;
  }
  return process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3001';
}

export function getStoreCustomerPreviewUrl(slug: string): string {
  const origin = getStorefrontUrl();
  return `${origin}/store/${slug}?preview=true`;
}

export function getStorePublicShareUrl(slug: string, isLive: boolean = false): string {
  const origin = getStorefrontUrl();
  return `${origin}/store/${slug}${isLive ? '' : '?preview=true'}`;
}

/**
 * Environment-safe URL configuration helpers for Storefront.
 * Resolves Seller Portal origin without hardcoding localhost in production.
 */

export function getSellerUrl(): string {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SELLER_URL) {
    return process.env.NEXT_PUBLIC_SELLER_URL;
  }
  return process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3001';
}

export function getSellerStorePreviewUrl(): string {
  const sellerOrigin = getSellerUrl();
  return `${sellerOrigin}/store-preview`;
}

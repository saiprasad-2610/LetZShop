/**
 * Shared Canonical Media URL Resolver
 *
 * Environment-safe method for resolving MediaAsset / image URLs:
 * - Absolute URLs (https://, http://, //): returned unchanged.
 * - Data & Blob URLs (data:, blob:): returned unchanged.
 * - Relative media paths (/media/..., media/...): prepends configured origin
 *   (NEXT_PUBLIC_MEDIA_URL, NEXT_PUBLIC_API_URL, or local dev fallback http://localhost:4000).
 * - Empty / null / undefined / whitespace: returns empty string (triggers UI fallback).
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  // 1. If already an absolute URL with scheme (http:// or https://) or protocol-relative (//)
  if (/^(?:https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }

  // 2. If data URI (e.g. inline base64 preview) or blob URI (e.g. FileReader object URL)
  if (/^(?:data|blob):/i.test(trimmed)) {
    return trimmed;
  }

  // 3. Resolve configured media/API origin
  // Priority: NEXT_PUBLIC_MEDIA_URL -> NEXT_PUBLIC_API_URL -> local dev port 4000
  let configuredOrigin = '';
  if (typeof process !== 'undefined' && process.env) {
    configuredOrigin =
      process.env.NEXT_PUBLIC_MEDIA_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      '';
  }

  if (!configuredOrigin) {
    configuredOrigin = 'http://localhost:4000';
  }

  const cleanOrigin = configuredOrigin.replace(/\/+$/, '');
  const cleanPath = trimmed.replace(/^\/+/, '');

  return `${cleanOrigin}/${cleanPath}`;
}

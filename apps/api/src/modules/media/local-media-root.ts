import * as path from 'node:path';

/** Source and compiled modules both sit three levels below the API package root. */
export function localMediaRoot(
  configured = process.env.MEDIA_STORAGE_LOCAL_ROOT || './media-storage',
): string {
  return path.resolve(__dirname, '../../..', configured);
}

/** Only merchant product/branding upload namespaces are public; KYC is never served here. */
export function isPublicMediaKey(key: string): boolean {
  return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/(?:products|branding)\/[a-zA-Z0-9_.-]+$/.test(
    key,
  );
}

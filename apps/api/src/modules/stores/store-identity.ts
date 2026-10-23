import { randomBytes } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { isReservedSlug, normalizeSlug } from '@simply/validation';

export function storeSlugBase(name: string): string {
  const normalized =
    normalizeSlug(name).slice(0, 48).replace(/-+$/, '') || 'shop';
  return isReservedSlug(normalized) ? `${normalized}-store` : normalized;
}

export function storeSlugCandidate(base: string, attempt: number): string {
  return attempt === 0
    ? base
    : attempt < 20
      ? `${base}-${attempt + 1}`
      : `${base}-${randomBytes(3).toString('hex')}`;
}

/** Retry the entire transaction: PostgreSQL aborts a transaction after a unique conflict. */
export async function withUniqueStoreSlug<T>(
  name: string,
  insert: (slug: string) => Promise<T>,
): Promise<T> {
  const base = storeSlugBase(name);
  for (let attempt = 0; attempt < 24; attempt++) {
    try {
      return await insert(storeSlugCandidate(base, attempt));
    } catch (error: any) {
      const target = error?.meta?.target;
      const slugConflict =
        error?.code === 'P2002' &&
        (Array.isArray(target)
          ? target.includes('slug')
          : typeof target === 'string' && /slug/.test(target));
      if (!slugConflict) throw error;
    }
  }
  throw new ConflictException(
    'Could not reserve a store URL. Please try again.',
  );
}

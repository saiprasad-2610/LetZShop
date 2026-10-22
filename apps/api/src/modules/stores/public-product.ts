import { normalizePublicMedia } from '../media/public-media-reference';

const publicVariant = (variant: any) => {
  if (!variant) return variant;
  const { costPricePaise, ...publicFields } = variant;
  return publicFields;
};
const publicMedia = (media: any) =>
  media.variant ? { ...media, variant: publicVariant(media.variant) } : media;

/** Preserve buyer prices/options/inventory; internal merchant acquisition cost is never public. */
export function publicProduct<T extends { variants?: any[]; media?: any[] }>(
  product: T,
): T {
  return normalizePublicMedia({
    ...product,
    ...(product.variants
      ? {
          variants: product.variants.map((variant) => ({
            ...publicVariant(variant),
            ...(variant.media ? { media: variant.media.map(publicMedia) } : {}),
          })),
        }
      : {}),
    ...(product.media ? { media: product.media.map(publicMedia) } : {}),
  });
}

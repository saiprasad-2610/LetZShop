import {
  CATALOG_EYEBROW_MAX,
  CATALOG_TITLE_MAX,
  CATALOG_SUBTITLE_MAX,
  catalogHeaderErrors,
  clampCatalogText,
  normalizeCatalogHeader,
} from './catalog-header';

/** Shared UTF-16 limits. Resource/contact fields have their own semantics. */
export const BRAND_TEXT_LIMITS = {
  badge: CATALOG_EYEBROW_MAX,
  eyebrow: CATALOG_EYEBROW_MAX,
  shortTitle: 60,
  heading: CATALOG_TITLE_MAX,
  heroHeading: 100,
  subtitle: 180,
  shortDescription: CATALOG_SUBTITLE_MAX,
  aboutParagraph: 700,
  ctaLabel: 32,
  navLabel: 32,
  smallLabel: 40,
  email: 254,
  resourceUrl: 2048,
} as const;

export const HOME_TEXT_LIMITS = {
  heroBadge: BRAND_TEXT_LIMITS.badge,
  heroTitle: BRAND_TEXT_LIMITS.heroHeading,
  heroSubtitle: BRAND_TEXT_LIMITS.shortDescription,
  heroCtaText: BRAND_TEXT_LIMITS.ctaLabel,
  heroSecondaryCtaText: BRAND_TEXT_LIMITS.ctaLabel,
  heroBannerUrl: BRAND_TEXT_LIMITS.resourceUrl,
  heroCtaLink: BRAND_TEXT_LIMITS.resourceUrl,
  heroSecondaryCtaLink: BRAND_TEXT_LIMITS.resourceUrl,
} as const;

export const ABOUT_TEXT_LIMITS = {
  pageTitle: BRAND_TEXT_LIMITS.heading,
  tagline: BRAND_TEXT_LIMITS.subtitle,
  storyParagraph1: BRAND_TEXT_LIMITS.aboutParagraph,
  storyParagraph2: BRAND_TEXT_LIMITS.aboutParagraph,
  missionTitle: BRAND_TEXT_LIMITS.shortTitle,
  missionText: BRAND_TEXT_LIMITS.shortDescription,
  visionTitle: BRAND_TEXT_LIMITS.shortTitle,
  visionText: BRAND_TEXT_LIMITS.shortDescription,
  storeAddress: BRAND_TEXT_LIMITS.shortDescription,
  storeHours: BRAND_TEXT_LIMITS.subtitle,
  contactPhone: BRAND_TEXT_LIMITS.smallLabel,
  contactEmail: BRAND_TEXT_LIMITS.email,
  bannerUrl: BRAND_TEXT_LIMITS.resourceUrl,
  imageUrl: BRAND_TEXT_LIMITS.resourceUrl,
  // Existing renderer fields may be present in saved/custom configurations.
  storyBadge: BRAND_TEXT_LIMITS.badge,
  storyHeading: BRAND_TEXT_LIMITS.heading,
} as const;

export const ABOUT_VALUE_LIMITS = {
  title: BRAND_TEXT_LIMITS.shortTitle,
  desc: BRAND_TEXT_LIMITS.shortDescription,
} as const;

// Existing media-upload fallback stores an inline image, rather than a display string.
// Keep that bounded resource path usable without permitting long ordinary URLs/text.
export const BRAND_INLINE_IMAGE_MAX = 20 * 1024 * 1024 + 256;
export function brandTextLimit(
  value: unknown,
  max: number,
  imageResource = false,
): number {
  return imageResource &&
    typeof value === 'string' &&
    /^data:image\/(?:png|jpe?g|webp);base64,/i.test(value)
    ? BRAND_INLINE_IMAGE_MAX
    : max;
}
const isImageField = (key: string) =>
  ['heroBannerUrl', 'bannerUrl', 'imageUrl'].includes(key);

type Limits = Readonly<Record<string, number>>;
const ROOT_LIMITS = {
  storeStory: BRAND_TEXT_LIMITS.aboutParagraph,
  physicalStoreAddress: BRAND_TEXT_LIMITS.shortDescription,
  physicalStoreTimings: BRAND_TEXT_LIMITS.subtitle,
};
const FOOTER_CONTACT_LIMITS = {
  address: ABOUT_TEXT_LIMITS.storeAddress,
  contactPhone: ABOUT_TEXT_LIMITS.contactPhone,
  contactEmail: ABOUT_TEXT_LIMITS.contactEmail,
};
const ANNOUNCEMENT_LIMITS = { text: BRAND_TEXT_LIMITS.subtitle };
const isObject = (value: unknown): value is Record<string, any> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

function normalizeFields(source: any, limits: Limits) {
  if (!isObject(source)) return source;
  const result = { ...source };
  for (const [key, max] of Object.entries(limits)) {
    if (Object.prototype.hasOwnProperty.call(source, key))
      result[key] = clampCatalogText(
        source[key],
        brandTextLimit(source[key], max, isImageField(key)),
      );
  }
  return result;
}

/** Normalize affected branches only; explicit empty strings and unknown settings survive. */
export function normalizeBrandText<T>(config: T): T {
  const source = normalizeCatalogHeader(config) as any;
  if (!isObject(source)) return config;
  const result = normalizeFields(source, ROOT_LIMITS);
  if (isObject(source.announcement))
    result.announcement = normalizeFields(
      source.announcement,
      ANNOUNCEMENT_LIMITS,
    );
  if (isObject(source.footer))
    result.footer = normalizeFields(source.footer, FOOTER_CONTACT_LIMITS);
  if (isObject(source.pages)) {
    result.pages = { ...source.pages };
    if (isObject(source.pages.home))
      result.pages.home = normalizeFields(source.pages.home, HOME_TEXT_LIMITS);
    if (isObject(source.pages.about)) {
      result.pages.about = normalizeFields(
        source.pages.about,
        ABOUT_TEXT_LIMITS,
      );
      if (Array.isArray(source.pages.about.values)) {
        result.pages.about.values = source.pages.about.values.map(
          (value: unknown) => normalizeFields(value, ABOUT_VALUE_LIMITS),
        );
      }
    }
  }
  return result;
}

function fieldErrors(source: unknown, limits: Limits, path: string): string[] {
  if (source === undefined) return [];
  if (!isObject(source)) return [`${path} must be an object`];
  return Object.entries(limits).flatMap(([field, max]) => {
    const value = source[field];
    if (value === undefined) return [];
    if (typeof value !== 'string') return [`${path}.${field} must be a string`];
    const effectiveMax = brandTextLimit(value, max, isImageField(field));
    return value.length > effectiveMax
      ? [`${path}.${field} must be at most ${effectiveMax} characters`]
      : [];
  });
}

/** Use the API's existing explicit validation, before its tenant transaction starts. */
export function brandTextErrors(config: unknown): string[] {
  if (config === undefined) return [];
  const source = config as any;
  const errors = [
    ...catalogHeaderErrors(config),
    ...fieldErrors(source, ROOT_LIMITS, 'configJson'),
    ...fieldErrors(
      source?.announcement,
      ANNOUNCEMENT_LIMITS,
      'configJson.announcement',
    ),
    ...fieldErrors(source?.footer, FOOTER_CONTACT_LIMITS, 'configJson.footer'),
    ...fieldErrors(
      source?.pages?.home,
      HOME_TEXT_LIMITS,
      'configJson.pages.home',
    ),
    ...fieldErrors(
      source?.pages?.about,
      ABOUT_TEXT_LIMITS,
      'configJson.pages.about',
    ),
  ];
  const values = source?.pages?.about?.values;
  if (values !== undefined) {
    if (!Array.isArray(values))
      errors.push('configJson.pages.about.values must be an array');
    else
      values.forEach((value, index) =>
        errors.push(
          ...fieldErrors(
            value,
            ABOUT_VALUE_LIMITS,
            `configJson.pages.about.values[${index}]`,
          ),
        ),
      );
  }
  return errors;
}

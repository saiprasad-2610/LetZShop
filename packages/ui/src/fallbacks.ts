// ==============================================================================
// Simply E-Commerce: Design Fallback Engine
// "A store must NEVER look unfinished."
// ==============================================================================

import { FOUNDATIONAL_THEMES, ThemeConfig } from './themes';

export interface ProductMediaRef {
  publicUrl?: string;
  storageKey?: string;
  altText?: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  description?: string | null;
  media?: ProductMediaRef[];
}

export class DesignFallbackEngine {
  /**
   * Generates a professional typography wordmark if no logo is provided.
   */
  public static getWordmark(businessName: string, themeCode = 'atelier') {
    const theme = FOUNDATIONAL_THEMES[themeCode] || FOUNDATIONAL_THEMES.atelier;
    const cleanName = (businessName || 'Store').trim();

    return {
      text: cleanName,
      fontFamily: theme.typography.heading,
      letterSpacing: themeCode === 'atelier' ? '0.15em' : 'normal',
      textTransform: (themeCode === 'atelier' ? 'uppercase' : 'none') as 'uppercase' | 'none',
      fontWeight: themeCode === 'pulse' || themeCode === 'foundry' ? '800' : '600',
    };
  }

  /**
   * Generates an intelligent hero layout using existing product imagery
   * if no dedicated hero banner has been uploaded.
   * Modes:
   * 1. 'featured_product' - Large single hero featuring the best product
   * 2. 'product_mosaic' - Dynamic visual grid of 3-4 real product photos
   * 3. 'typography_hero' - Elegant statement hero using brand typography
   */
  public static resolveHeroLayout(
    configuredHeroImage: string | null | undefined,
    products: ProductSummary[] = [],
    themeCode = 'atelier'
  ): {
    mode: 'custom_image' | 'featured_product' | 'product_mosaic' | 'typography_hero';
    imageUrl?: string;
    productImages: string[];
    featuredProduct?: ProductSummary;
  } {
    if (configuredHeroImage && configuredHeroImage.trim()) {
      return {
        mode: 'custom_image',
        imageUrl: configuredHeroImage,
        productImages: [configuredHeroImage],
      };
    }

    // Collect all real product images
    const realImages: string[] = [];
    for (const p of products) {
      if (p.media && p.media.length > 0) {
        for (const m of p.media) {
          const url = m.publicUrl || (m.storageKey ? `/api/v1/media/file/${m.storageKey}` : undefined);
          if (url) realImages.push(url);
        }
      }
    }

    if (realImages.length >= 3) {
      return {
        mode: 'product_mosaic',
        productImages: realImages.slice(0, 4),
      };
    }

    if (realImages.length >= 1 && products[0]) {
      return {
        mode: 'featured_product',
        imageUrl: realImages[0],
        productImages: [realImages[0]],
        featuredProduct: products[0],
      };
    }

    return {
      mode: 'typography_hero',
      productImages: [],
    };
  }

  /**
   * Resolves category image fallback:
   * Uses the primary image of the best/first product in that category.
   */
  public static resolveCategoryImage(
    categoryImageUrl: string | null | undefined,
    categoryProducts: ProductSummary[] = []
  ): string | null {
    if (categoryImageUrl && categoryImageUrl.trim()) {
      return categoryImageUrl;
    }

    for (const p of categoryProducts) {
      if (p.media && p.media.length > 0) {
        const first = p.media[0];
        const url = first.publicUrl || (first.storageKey ? `/api/v1/media/file/${first.storageKey}` : null);
        if (url) return url;
      }
    }

    return null;
  }

  /**
   * Returns curated theme defaults when merchant hasn't specified custom styling.
   */
  public static getThemeDefaults(themeCode = 'atelier'): ThemeConfig {
    return FOUNDATIONAL_THEMES[themeCode] || FOUNDATIONAL_THEMES.atelier;
  }
}

export const getWordmark = (businessName: string, themeCode = 'atelier') => {
  const mark = DesignFallbackEngine.getWordmark(businessName, themeCode);
  return {
    ...mark,
    monogram: (businessName || 'S').trim().charAt(0).toUpperCase(),
  };
};

export const getThemeDefaults = (themeCode = 'atelier') => DesignFallbackEngine.getThemeDefaults(themeCode);
export const resolveHeroLayout = DesignFallbackEngine.resolveHeroLayout;
export const resolveCategoryImage = DesignFallbackEngine.resolveCategoryImage;


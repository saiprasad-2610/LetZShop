// ==============================================================================
// Simply E-Commerce: 6 Foundational Themes Engine
// ==============================================================================

export interface ThemePalette {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
}

export interface ThemeTypography {
  heading: string;
  body: string;
}

export interface ThemeConfig {
  code: string;
  name: string;
  tagline: string;
  bestFor: string;
  palette: ThemePalette;
  typography: ThemeTypography;
  headerStyle: 'minimal-center' | 'sticky-action' | 'warm-friendly' | 'industrial-meta' | 'spacious-lifestyle' | 'quick-search-bar';
  heroStyle: 'split-editorial' | 'full-banner' | 'organic-showcase' | 'technical-hero' | 'lifestyle-immersive' | 'product-mosaic';
  cardStyle: 'framed-luxury' | 'elevated-modern' | 'rounded-soft' | 'spec-sheet-card' | 'minimal-bleed' | 'high-density-buy';
  buttonStyle: 'sharp-pill' | 'rounded-heavy' | 'pill-friendly' | 'square-solid' | 'underline-refined' | 'quick-add';
  imageRatio: '3/4' | '1/1' | '4/3' | '4/5' | '16/9';
  spacingDensity: 'generous' | 'compact' | 'comfortable' | 'dense' | 'airy';
  backgroundTreatment: 'clean' | 'warm-tint' | 'cool-slate' | 'editorial-subtle' | 'high-contrast';
  defaultSectionOrder: string[];
}

export const FOUNDATIONAL_THEMES: Record<string, ThemeConfig> = {
  atelier: {
    code: 'atelier',
    name: 'Atelier',
    tagline: 'Luxury / Editorial Elegance',
    bestFor: 'Jewellery, premium fashion, beauty, watches, leather craftsmanship',
    palette: {
      primary: '#1C1917',
      accent: '#D4AF37', // Refined warm gold
      background: '#FAFAF9',
      surface: '#FFFFFF',
      text: '#1C1917',
      muted: '#78716C',
      border: '#E7E5E4',
    },
    typography: {
      heading: 'Playfair Display',
      body: 'Plus Jakarta Sans',
    },
    headerStyle: 'minimal-center',
    heroStyle: 'split-editorial',
    cardStyle: 'framed-luxury',
    buttonStyle: 'sharp-pill',
    imageRatio: '3/4',
    spacingDensity: 'generous',
    backgroundTreatment: 'editorial-subtle',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'featured_products',
      'categories',
      'editorial_image_text',
      'testimonials',
      'about_business',
      'contact',
    ],
  },

  pulse: {
    code: 'pulse',
    name: 'Pulse',
    tagline: 'Bold Contemporary Commerce',
    bestFor: 'Fashion streetwear, electronics, youth brands, modern accessories',
    palette: {
      primary: '#0F172A',
      accent: '#EC4899', // Electric pink
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#0F172A',
      muted: '#64748B',
      border: '#E2E8F0',
    },
    typography: {
      heading: 'Cabinet Grotesk',
      body: 'Inter',
    },
    headerStyle: 'sticky-action',
    heroStyle: 'full-banner',
    cardStyle: 'elevated-modern',
    buttonStyle: 'rounded-heavy',
    imageRatio: '1/1',
    spacingDensity: 'compact',
    backgroundTreatment: 'cool-slate',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'new_arrivals',
      'categories',
      'offer_banner',
      'featured_products',
      'gallery',
      'contact',
    ],
  },

  harvest: {
    code: 'harvest',
    name: 'Harvest',
    tagline: 'Friendly Fast Commerce',
    bestFor: 'Food, sweets, bakery, gourmet, grocery, organic products',
    palette: {
      primary: '#14532D', // Earthy forest green
      accent: '#F59E0B',  // Warm amber
      background: '#FEFCE8',
      surface: '#FFFFFF',
      text: '#1E293B',
      muted: '#475569',
      border: '#FDE68A',
    },
    typography: {
      heading: 'DM Serif Display',
      body: 'Plus Jakarta Sans',
    },
    headerStyle: 'warm-friendly',
    heroStyle: 'organic-showcase',
    cardStyle: 'rounded-soft',
    buttonStyle: 'pill-friendly',
    imageRatio: '1/1',
    spacingDensity: 'comfortable',
    backgroundTreatment: 'warm-tint',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'categories',
      'featured_products',
      'certifications',
      'offer_banner',
      'testimonials',
      'about_business',
      'contact',
    ],
  },

  foundry: {
    code: 'foundry',
    name: 'Foundry',
    tagline: 'Professional Industrial & B2B',
    bestFor: 'Manufacturing, machinery, chemicals, electrical, industrial suppliers',
    palette: {
      primary: '#1E293B',
      accent: '#0284C7', // Industrial precision blue
      background: '#F1F5F9',
      surface: '#FFFFFF',
      text: '#0F172A',
      muted: '#475569',
      border: '#CBD5E1',
    },
    typography: {
      heading: 'Space Grotesk',
      body: 'Inter',
    },
    headerStyle: 'industrial-meta',
    heroStyle: 'technical-hero',
    cardStyle: 'spec-sheet-card',
    buttonStyle: 'square-solid',
    imageRatio: '4/3',
    spacingDensity: 'dense',
    backgroundTreatment: 'cool-slate',
    defaultSectionOrder: [
      'hero',
      'categories',
      'featured_products',
      'certifications',
      'brochure_download',
      'request_quote',
      'about_business',
      'contact',
    ],
  },

  habitat: {
    code: 'habitat',
    name: 'Habitat',
    tagline: 'Visual Lifestyle & Living',
    bestFor: 'Furniture, home decor, pottery, handicrafts, architectural interiors',
    palette: {
      primary: '#292524',
      accent: '#C2410C', // Terracotta accent
      background: '#F5F5F4',
      surface: '#FFFFFF',
      text: '#292524',
      muted: '#78716C',
      border: '#E7E5E4',
    },
    typography: {
      heading: 'Cinzel',
      body: 'Plus Jakarta Sans',
    },
    headerStyle: 'spacious-lifestyle',
    heroStyle: 'lifestyle-immersive',
    cardStyle: 'minimal-bleed',
    buttonStyle: 'underline-refined',
    imageRatio: '4/5',
    spacingDensity: 'airy',
    backgroundTreatment: 'editorial-subtle',
    defaultSectionOrder: [
      'hero',
      'collections',
      'featured_products',
      'editorial_image_text',
      'gallery',
      'about_business',
      'physical_store',
      'contact',
    ],
  },

  local: {
    code: 'local',
    name: 'Local',
    tagline: 'Fast Premium Catalogue',
    bestFor: 'General retailers, local physical shops, wholesalers, quick catalogs',
    palette: {
      primary: '#1E40AF',
      accent: '#16A34A', // WhatsApp green accent
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#0F172A',
      muted: '#64748B',
      border: '#E2E8F0',
    },
    typography: {
      heading: 'Inter',
      body: 'Inter',
    },
    headerStyle: 'quick-search-bar',
    heroStyle: 'product-mosaic',
    cardStyle: 'high-density-buy',
    buttonStyle: 'quick-add',
    imageRatio: '1/1',
    spacingDensity: 'dense',
    backgroundTreatment: 'clean',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'categories',
      'featured_products',
      'best_sellers',
      'physical_store',
      'contact',
    ],
  },

  feast: {
    code: 'feast',
    name: 'Feast',
    tagline: 'Food-First Visual Commerce',
    bestFor: 'Baking, gourmet dining, confectioneries, cloud kitchens, artisanal provisions',
    palette: {
      primary: '#78350F', // Rich cocoa
      accent: '#E11D48',  // Berry rose
      background: '#FFFBEB', // Warm buttercream
      surface: '#FFFFFF',
      text: '#451A03',
      muted: '#92400E',
      border: '#FDE68A',
    },
    typography: {
      heading: 'Playfair Display',
      body: 'Plus Jakarta Sans',
    },
    headerStyle: 'warm-friendly',
    heroStyle: 'organic-showcase',
    cardStyle: 'rounded-soft',
    buttonStyle: 'pill-friendly',
    imageRatio: '1/1',
    spacingDensity: 'comfortable',
    backgroundTreatment: 'warm-tint',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'categories',
      'featured_products',
      'about_business',
      'testimonials',
      'contact',
    ],
  },

  aura: {
    code: 'aura',
    name: 'Aura',
    tagline: 'Luminous Glow & Clean Beauty',
    bestFor: 'Skincare, cosmetics, perfumes, organic serums, luxury spas, aesthetic wellness',
    palette: {
      primary: '#881337', // Deep rose wine
      accent: '#FB7185',  // Luminous rose quartz
      background: '#FFF1F2', // Soft blush mist
      surface: '#FFFFFF',
      text: '#4C0519',
      muted: '#9F1239',
      border: '#FFE4E6',
    },
    typography: {
      heading: 'Playfair Display',
      body: 'Plus Jakarta Sans',
    },
    headerStyle: 'minimal-center',
    heroStyle: 'split-editorial',
    cardStyle: 'framed-luxury',
    buttonStyle: 'sharp-pill',
    imageRatio: '3/4',
    spacingDensity: 'generous',
    backgroundTreatment: 'warm-tint',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'featured_products',
      'categories',
      'editorial_image_text',
      'testimonials',
      'about_business',
      'contact',
    ],
  },

  noir: {
    code: 'noir',
    name: 'Noir',
    tagline: 'Avant-Garde Dark Studio & Monolith',
    bestFor: 'Luxury streetwear, haute horlogerie, cyberpunk audio & gear, minimalist apparel',
    palette: {
      primary: '#09090B', // Deep void black
      accent: '#10B981',  // Electric neon emerald
      background: '#09090B', // Stealth obsidian dark
      surface: '#18181B', // Dark carbon surface
      text: '#F4F4F5',    // Crisp titanium white
      muted: '#A1A1AA',   // Cool steel muted
      border: '#27272A',  // Subtle hairline border
    },
    typography: {
      heading: 'Space Grotesk',
      body: 'Inter',
    },
    headerStyle: 'sticky-action',
    heroStyle: 'full-banner',
    cardStyle: 'elevated-modern',
    buttonStyle: 'sharp-pill',
    imageRatio: '4/5',
    spacingDensity: 'compact',
    backgroundTreatment: 'high-contrast',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'new_arrivals',
      'featured_products',
      'categories',
      'offer_banner',
      'gallery',
      'contact',
    ],
  },

  vista: {
    code: 'vista',
    name: 'Vista',
    tagline: 'Earth & Craft Heritage Showcase',
    bestFor: 'Handloom textiles, artisan ceramics, organic roasters, sustainable heirloom crafts',
    palette: {
      primary: '#9A3412', // Sun-baked terracotta
      accent: '#D97706',  // Warm amber gold
      background: '#FDFBF7', // Natural raw linen canvas
      surface: '#FFFFFF',
      text: '#431407',    // Deep earth bark
      muted: '#78350F',
      border: '#FED7AA',  // Warm woven sand border
    },
    typography: {
      heading: 'DM Serif Display',
      body: 'Plus Jakarta Sans',
    },
    headerStyle: 'warm-friendly',
    heroStyle: 'organic-showcase',
    cardStyle: 'rounded-soft',
    buttonStyle: 'pill-friendly',
    imageRatio: '4/3',
    spacingDensity: 'comfortable',
    backgroundTreatment: 'warm-tint',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'categories',
      'featured_products',
      'editorial_image_text',
      'testimonials',
      'about_business',
      'physical_store',
      'contact',
    ],
  },

  horizon: {
    code: 'horizon',
    name: 'Horizon',
    tagline: 'Enterprise Panorama & Heritage Tech',
    bestFor: 'Textile & technology conglomerates, industrial innovation, high-value enterprise brands, engineering & labs',
    palette: {
      primary: '#0F172A', // Deep enterprise slate
      accent: '#2563EB',  // Electric lab blue
      background: '#FFFFFF', // Crisp clean canvas
      surface: '#F8FAFC', // Sleek tech surface
      text: '#0F172A',    // Deep slate text
      muted: '#64748B',   // Cool steel muted
      border: '#E2E8F0',  // Minimal border
    },
    typography: {
      heading: 'Plus Jakarta Sans',
      body: 'Inter',
    },
    headerStyle: 'sticky-action',
    heroStyle: 'full-banner',
    cardStyle: 'elevated-modern',
    buttonStyle: 'rounded-heavy',
    imageRatio: '16/9',
    spacingDensity: 'generous',
    backgroundTreatment: 'clean',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'featured_products',
      'categories',
      'editorial_image_text',
      'testimonials',
      'about_business',
      'contact',
    ],
  },

  canvas: {
    code: 'canvas',
    name: 'Canvas',
    tagline: 'Full-Bleed Cinematic Showcase',
    bestFor: 'Flagship lifestyle apparel, gourmet provisions, artisan goods, cinematic visual brands',
    palette: {
      primary: '#0F172A', // Deep slate primary
      accent: '#D97706',  // Warm amber gold
      background: '#F8FAFC', // Crisp light background
      surface: '#FFFFFF', // Clean white card surface
      text: '#0F172A',    // Deep slate text
      muted: '#64748B',   // Cool steel muted
      border: '#E2E8F0',  // Minimal border
    },
    typography: {
      heading: 'Outfit',
      body: 'Plus Jakarta Sans',
    },
    headerStyle: 'minimal-center',
    heroStyle: 'full-banner',
    cardStyle: 'rounded-soft',
    buttonStyle: 'sharp-pill',
    imageRatio: '1/1',
    spacingDensity: 'generous',
    backgroundTreatment: 'clean',
    defaultSectionOrder: [
      'announcement',
      'hero',
      'featured_products',
      'categories',
      'editorial_image_text',
      'testimonials',
      'about_business',
      'contact',
    ],
  },
};

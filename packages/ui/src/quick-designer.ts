// ==============================================================================
// Simply E-Commerce: Quick Mode ("Design it for me")
// Maps Business Category to optimal Theme Archetype, Palette, Fonts & Sections
// ==============================================================================

import { FOUNDATIONAL_THEMES, ThemeConfig } from './themes';

export type BusinessCategory =
  | 'Fashion'
  | 'Jewellery'
  | 'Beauty'
  | 'Food'
  | 'Grocery'
  | 'Furniture'
  | 'Manufacturing / Industrial'
  | 'Electronics'
  | 'General Retail'
  | 'Other';

export interface QuickDesignOutput {
  themeCode: string;
  theme: ThemeConfig;
  primaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  recommendedSections: Array<{
    sectionType: string;
    title: string;
    sortOrder: number;
    isEnabled: boolean;
  }>;
}

export class QuickDesigner {
  public static designForCategory(category: string, businessName: string): QuickDesignOutput {
    let themeCode = 'atelier';
    const norm = (category || '').toLowerCase();

    if (norm.includes('jewel') || norm.includes('luxury') || norm.includes('beauty')) {
      themeCode = 'atelier';
    } else if (norm.includes('fashion') || norm.includes('electronic') || norm.includes('youth')) {
      themeCode = 'pulse';
    } else if (norm.includes('food') || norm.includes('sweet') || norm.includes('baker') || norm.includes('grocer')) {
      themeCode = 'harvest';
    } else if (norm.includes('manufact') || norm.includes('industr') || norm.includes('machin') || norm.includes('chemical')) {
      themeCode = 'foundry';
    } else if (norm.includes('furnitur') || norm.includes('decor') || norm.includes('interior') || norm.includes('lifestyle')) {
      themeCode = 'habitat';
    } else {
      themeCode = 'local';
    }

    const theme = FOUNDATIONAL_THEMES[themeCode] || FOUNDATIONAL_THEMES.atelier;

    const recommendedSections = theme.defaultSectionOrder.map((sectionType, idx) => {
      let title = '';
      switch (sectionType) {
        case 'hero':
          title = `Welcome to ${businessName || 'Our Store'}`;
          break;
        case 'announcement':
          title = 'Special Launch Offer — Free Shipping Across India';
          break;
        case 'featured_products':
          title = 'Featured Products';
          break;
        case 'categories':
          title = 'Shop By Category';
          break;
        case 'new_arrivals':
          title = 'Fresh Arrivals';
          break;
        case 'best_sellers':
          title = 'Customer Favorites';
          break;
        case 'offer_banner':
          title = 'Limited Time Festive Discounts';
          break;
        case 'editorial_image_text':
          title = 'Crafted With Passion & Tradition';
          break;
        case 'about_business':
          title = `About ${businessName || 'Our Business'}`;
          break;
        case 'testimonials':
          title = 'What Our Customers Say';
          break;
        case 'certifications':
          title = 'Certified Quality & Standards';
          break;
        case 'brochure_download':
          title = 'Download Product Specifications & Catalog';
          break;
        case 'request_quote':
          title = 'Request a Bulk Wholesale Quotation';
          break;
        case 'physical_store':
          title = 'Visit Our Physical Store';
          break;
        case 'contact':
          title = 'Get In Touch';
          break;
        default:
          title = sectionType.replace(/_/g, ' ').toUpperCase();
      }

      return {
        sectionType,
        title,
        sortOrder: idx,
        isEnabled: true,
      };
    });

    return {
      themeCode,
      theme,
      primaryColor: theme.palette.primary,
      accentColor: theme.palette.accent,
      fontHeading: theme.typography.heading,
      fontBody: theme.typography.body,
      recommendedSections,
    };
  }
}

export interface BrandConfig {
  brandName: string;
  tagline: string;
  defaultCurrency: string;
  currencySymbol: string;
  countryCode: string;
  supportEmail: string;
  defaultLocale: string;
  timezone: string;
}

export const getBrandConfig = (): BrandConfig => {
  return {
    brandName: process.env.BRAND_NAME || 'Simply E-Commerce',
    tagline: 'Fast, simple, premium ecommerce for Indian businesses',
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    countryCode: 'IN',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@simplyecommerce.in',
    defaultLocale: 'en-IN',
    timezone: 'Asia/Kolkata',
  };
};

export const BRAND_CONFIG = getBrandConfig();

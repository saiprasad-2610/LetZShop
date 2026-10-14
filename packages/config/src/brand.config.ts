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

/**
 * Razorpay Minimum Transaction Constraints
 * Razorpay INR API enforces a minimum order amount of ₹1.00 (100 paise).
 * Attempting to create orders or charge amounts below 100 paise results in HTTP 400 rejection:
 * "amount should be at least 100"
 */
export const PAYMENT_GATEWAY_MIN_AMOUNT_PAISE = 100;
export const PAYMENT_GATEWAY_MIN_AMOUNT_RUPEES = 1;

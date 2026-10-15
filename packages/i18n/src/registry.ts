export type SupportedLocale =
  | 'en-IN'
  | 'mr-IN'
  | 'hi-IN'
  | 'gu-IN'
  | 'kn-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'bn-IN'
  | 'ml-IN'
  | 'pa-IN';

export interface LocaleMetadata {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  script: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  'en-IN',
  'mr-IN',
  'hi-IN',
  'gu-IN',
  'kn-IN',
  'ta-IN',
  'te-IN',
  'bn-IN',
  'ml-IN',
  'pa-IN',
];

export const DEFAULT_LOCALE: SupportedLocale = 'en-IN';

export const LOCALE_REGISTRY: Record<SupportedLocale, LocaleMetadata> = {
  'en-IN': {
    code: 'en-IN',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    direction: 'ltr',
  },
  'mr-IN': {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    direction: 'ltr',
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    direction: 'ltr',
  },
  'gu-IN': {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    direction: 'ltr',
  },
  'kn-IN': {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    direction: 'ltr',
  },
  'ta-IN': {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    direction: 'ltr',
  },
  'te-IN': {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    direction: 'ltr',
  },
  'bn-IN': {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    direction: 'ltr',
  },
  'ml-IN': {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    direction: 'ltr',
  },
  'pa-IN': {
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    direction: 'ltr',
  },
};

export function isValidLocale(code: unknown): code is SupportedLocale {
  return typeof code === 'string' && SUPPORTED_LOCALES.includes(code as SupportedLocale);
}

export function sanitizeLocale(code: unknown, fallback: SupportedLocale = DEFAULT_LOCALE): SupportedLocale {
  if (isValidLocale(code)) return code;
  if (typeof code === 'string') {
    const trimmed = code.trim().toLowerCase();
    const match = SUPPORTED_LOCALES.find(
      (loc) => loc.toLowerCase() === trimmed || loc.split('-')[0].toLowerCase() === trimmed
    );
    if (match) return match;
  }
  return fallback;
}

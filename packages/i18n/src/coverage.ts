import { enIN } from './locales/en-IN';
import { DICTIONARIES } from './locales';
import { SUPPORTED_LOCALES, SupportedLocale } from './registry';

export interface CoverageResult {
  locale: SupportedLocale;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  extraKeys: string[];
  coveragePercentage: number;
}

/**
 * Recursively extracts all dot-path keys from a dictionary object.
 */
export function extractKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const nextPrefix = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      keys.push(...extractKeys(obj[k], nextPrefix));
    } else {
      keys.push(nextPrefix);
    }
  }
  return keys;
}

/**
 * Compares any locale dictionary against canonical en-IN.
 */
export function validateLocaleCoverage(locale: SupportedLocale): CoverageResult {
  const canonicalKeys = extractKeys(enIN);
  const targetDict = DICTIONARIES[locale];
  const targetKeys = targetDict ? extractKeys(targetDict) : [];

  const missingKeys = canonicalKeys.filter((k) => !targetKeys.includes(k));
  const extraKeys = targetKeys.filter((k) => !canonicalKeys.includes(k));
  const translatedKeys = canonicalKeys.length - missingKeys.length;
  const coveragePercentage = Math.round((translatedKeys / canonicalKeys.length) * 100);

  return {
    locale,
    totalKeys: canonicalKeys.length,
    translatedKeys,
    missingKeys,
    extraKeys,
    coveragePercentage,
  };
}

/**
 * Validates coverage for all supported locales.
 */
export function validateAllLocalesCoverage(): Record<SupportedLocale, CoverageResult> {
  const results: Partial<Record<SupportedLocale, CoverageResult>> = {};
  for (const loc of SUPPORTED_LOCALES) {
    results[loc] = validateLocaleCoverage(loc);
  }
  return results as Record<SupportedLocale, CoverageResult>;
}

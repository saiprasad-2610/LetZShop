import { SupportedLocale, DEFAULT_LOCALE, sanitizeLocale } from './registry';
import { enIN, TranslationDictionary } from './locales/en-IN';
import { DICTIONARIES } from './locales';

export type TranslateFunction = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

/**
 * Traverses a nested dictionary using a dot-delimited path (e.g. 'orders.title').
 */
function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: any = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  if (typeof current === 'string' && current.trim().length > 0) {
    return current;
  }
  return undefined;
}

/**
 * Interpolates parameters like `{count}` or `{name}` into template string.
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, paramName) => {
    if (paramName in params) {
      return String(params[paramName]);
    }
    return match;
  });
}

/**
 * Creates a type-safe, resilient translator for a given locale with automatic English fallback.
 */
export function createTranslator(
  requestedLocale: string = DEFAULT_LOCALE,
  customDict?: Partial<TranslationDictionary>
): TranslateFunction {
  const locale = sanitizeLocale(requestedLocale);
  const activeDict = customDict ? { ...(DICTIONARIES[locale] || enIN), ...customDict } : DICTIONARIES[locale] || enIN;
  const fallbackDict = enIN;

  return function t(key: string, params?: Record<string, string | number>, fallback?: string): string {
    if (!key) return fallback || '';

    // 1. Pluralization check if count is present
    if (params && typeof params.count === 'number') {
      const pluralKey = params.count === 1 ? `${key}_one` : `${key}_other`;
      const valPlural = getNestedValue(activeDict, pluralKey) || getNestedValue(fallbackDict, pluralKey);
      if (valPlural) {
        return interpolate(valPlural, params);
      }
    }

    // 2. Lookup in current locale dictionary
    const val = getNestedValue(activeDict, key);
    if (val !== undefined) {
      return interpolate(val, params);
    }

    // 3. Fallback to English canonical dictionary
    const fallbackVal = getNestedValue(fallbackDict, key);
    if (fallbackVal !== undefined) {
      return interpolate(fallbackVal, params);
    }

    // 4. If explicit fallback string was provided, use it
    if (fallback !== undefined) {
      return interpolate(fallback, params);
    }

    // 5. In development, log missing key; in production return the key name gracefully
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Missing translation key '${key}' for locale '${locale}'`);
    }

    // Never return undefined or blank
    const lastPart = key.split('.').pop() || key;
    return interpolate(lastPart, params);
  };
}

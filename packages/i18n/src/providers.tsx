import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  SupportedLocale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  ACTIVE_LOCALES,
  LOCALE_REGISTRY,
  LocaleMetadata,
  sanitizeLocale,
  isActiveLocale,
} from './registry';
import { createTranslator, TranslateFunction } from './translator';
import { formatCurrency, formatDate, formatNumber } from './formatters';

export type InitStoreLocalesFn = (
  defaultOrOptions?: string | { defaultLocale?: string; enabledLocales?: string[]; storeSlug?: string },
  enabledLocs?: string[]
) => void;

export interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (newLocale: SupportedLocale) => void;
  t: TranslateFunction;
  formatCurrency: (amountPaise: number) => string;
  formatPrice: (amountPaise: number) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  direction: 'ltr' | 'rtl';
  metadata: LocaleMetadata;
  availableLocales: LocaleMetadata[];
  initStoreLocales: InitStoreLocalesFn;
}

// ==============================================================================
// 1. SELLER / MERCHANT LOCALE CONTEXT
// ==============================================================================

const SellerI18nContext = createContext<I18nContextValue | null>(null);

export interface SellerLocaleProviderProps {
  initialLocale?: string;
  userLocale?: string;
  onLocaleChange?: (locale: SupportedLocale) => void | Promise<void>;
  children: React.ReactNode;
}

const SELLER_LOCALE_STORAGE_KEY = 'letzshop_seller_preferred_locale';

export const SellerLocaleProvider: React.FC<SellerLocaleProviderProps> = ({
  initialLocale,
  userLocale,
  onLocaleChange,
  children,
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (userLocale) return sanitizeLocale(userLocale);
    if (initialLocale) return sanitizeLocale(initialLocale);
    return DEFAULT_LOCALE;
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sync from user's persisted profile or local storage
    if (userLocale) {
      const sanitized = sanitizeLocale(userLocale);
      setLocaleState(sanitized);
      try {
        localStorage.setItem(SELLER_LOCALE_STORAGE_KEY, sanitized);
      } catch {}
    } else {
      try {
        const stored = localStorage.getItem(SELLER_LOCALE_STORAGE_KEY);
        if (stored) {
          setLocaleState(sanitizeLocale(stored));
        }
      } catch {}
    }
  }, [userLocale]);

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      const sanitized = sanitizeLocale(newLocale);
      setLocaleState(sanitized);
      try {
        localStorage.setItem(SELLER_LOCALE_STORAGE_KEY, sanitized);
      } catch {}
      if (onLocaleChange) {
        onLocaleChange(sanitized);
      }
    },
    [onLocaleChange]
  );

  const t = useMemo(() => createTranslator(locale), [locale]);
  const metadata = useMemo(() => LOCALE_REGISTRY[locale] || LOCALE_REGISTRY[DEFAULT_LOCALE], [locale]);
  const availableLocales = useMemo(() => ACTIVE_LOCALES.map((code) => LOCALE_REGISTRY[code]), []);

  const curFormat = useCallback(
    (amountPaise: number) => formatCurrency(amountPaise, locale),
    [locale]
  );
  const dtFormat = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
    [locale]
  );
  const numFormat = useCallback(
    (val: number, options?: Intl.NumberFormatOptions) => formatNumber(val, locale, options),
    [locale]
  );

  const value: I18nContextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatCurrency: curFormat,
      formatPrice: curFormat,
      formatDate: dtFormat,
      formatNumber: numFormat,
      direction: metadata.direction,
      metadata,
      availableLocales,
      initStoreLocales: () => {},
    }),
    [locale, setLocale, t, curFormat, dtFormat, numFormat, metadata, availableLocales]
  );

  return <SellerI18nContext.Provider value={value}>{children}</SellerI18nContext.Provider>;
};

export function useSellerI18n(): I18nContextValue {
  const ctx = useContext(SellerI18nContext);
  if (!ctx) {
    // Fallback default if used outside provider
    const fallbackT = createTranslator(DEFAULT_LOCALE);
    const curFmt = (p: number) => formatCurrency(p, DEFAULT_LOCALE);
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: fallbackT,
      formatCurrency: curFmt,
      formatPrice: curFmt,
      formatDate: (d, o) => formatDate(d, DEFAULT_LOCALE, o),
      formatNumber: (n, o) => formatNumber(n, DEFAULT_LOCALE, o),
      direction: 'ltr',
      metadata: LOCALE_REGISTRY[DEFAULT_LOCALE],
      availableLocales: ACTIVE_LOCALES.map((code) => LOCALE_REGISTRY[code]),
      initStoreLocales: () => {},
    };
  }
  return ctx;
}

// ==============================================================================
// 2. STOREFRONT LOCALE CONTEXT (Scoped per store, visitor overrideable)
// ==============================================================================

const StorefrontI18nContext = createContext<I18nContextValue | null>(null);

export interface StorefrontLocaleProviderProps {
  storeSlug: string;
  defaultLocale?: string;
  enabledLocales?: string[];
  children: React.ReactNode;
}

export const StorefrontLocaleProvider: React.FC<StorefrontLocaleProviderProps> = ({
  storeSlug,
  defaultLocale = DEFAULT_LOCALE,
  enabledLocales,
  children,
}) => {
  const [currentDefault, setCurrentDefault] = useState<string>(defaultLocale);
  const [currentEnabled, setCurrentEnabled] = useState<string[] | undefined>(enabledLocales);

  const storageKey = storeSlug ? `letzshop_storefront_locale_${storeSlug}` : 'letzshop_storefront_locale';

  const [locale, setLocaleState] = useState<SupportedLocale>(() => sanitizeLocale(defaultLocale));

  useEffect(() => {
    if (defaultLocale) setCurrentDefault(defaultLocale);
  }, [defaultLocale]);

  useEffect(() => {
    if (enabledLocales) setCurrentEnabled(enabledLocales);
  }, [enabledLocales]);

  useEffect(() => {
    const storeDefault = sanitizeLocale(currentDefault);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const sanitized = sanitizeLocale(stored);
        if (!currentEnabled || currentEnabled.includes(sanitized)) {
          setLocaleState(sanitized);
          return;
        }
      }
    } catch {}

    setLocaleState(storeDefault);
  }, [storageKey, currentDefault, currentEnabled]);

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      const sanitized = sanitizeLocale(newLocale);
      setLocaleState(sanitized);
      try {
        localStorage.setItem(storageKey, sanitized);
      } catch {}
    },
    [storageKey]
  );

  const initStoreLocales: InitStoreLocalesFn = useCallback((defOrOptions, enabled) => {
    if (typeof defOrOptions === 'object' && defOrOptions !== null) {
      if (defOrOptions.defaultLocale) setCurrentDefault(defOrOptions.defaultLocale);
      if (defOrOptions.enabledLocales && Array.isArray(defOrOptions.enabledLocales)) {
        setCurrentEnabled(defOrOptions.enabledLocales);
      }
    } else {
      if (defOrOptions) setCurrentDefault(defOrOptions);
      if (enabled && Array.isArray(enabled)) setCurrentEnabled(enabled);
    }
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);
  const metadata = useMemo(() => LOCALE_REGISTRY[locale] || LOCALE_REGISTRY[DEFAULT_LOCALE], [locale]);

  const availableLocales = useMemo(() => {
    const list = Array.isArray(currentEnabled) && currentEnabled.length > 0
      ? currentEnabled.filter(isActiveLocale)
      : ACTIVE_LOCALES;

    const effectiveList = list.length > 0 ? list : ACTIVE_LOCALES;
    return Array.from(new Set(effectiveList)).map((c) => LOCALE_REGISTRY[c] || LOCALE_REGISTRY[DEFAULT_LOCALE]);
  }, [currentEnabled]);

  const curFormat = useCallback(
    (amountPaise: number) => formatCurrency(amountPaise, locale),
    [locale]
  );
  const dtFormat = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
    [locale]
  );
  const numFormat = useCallback(
    (val: number, options?: Intl.NumberFormatOptions) => formatNumber(val, locale, options),
    [locale]
  );

  const value: I18nContextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatCurrency: curFormat,
      formatPrice: curFormat,
      formatDate: dtFormat,
      formatNumber: numFormat,
      direction: metadata.direction,
      metadata,
      availableLocales,
      initStoreLocales,
    }),
    [locale, setLocale, t, curFormat, dtFormat, numFormat, metadata, availableLocales, initStoreLocales]
  );

  return <StorefrontI18nContext.Provider value={value}>{children}</StorefrontI18nContext.Provider>;
};

export function useStorefrontI18n(): I18nContextValue {
  const ctx = useContext(StorefrontI18nContext);
  if (!ctx) {
    const fallbackT = createTranslator(DEFAULT_LOCALE);
    const curFmt = (p: number) => formatCurrency(p, DEFAULT_LOCALE);
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: fallbackT,
      formatCurrency: curFmt,
      formatPrice: curFmt,
      formatDate: (d, o) => formatDate(d, DEFAULT_LOCALE, o),
      formatNumber: (n, o) => formatNumber(n, DEFAULT_LOCALE, o),
      direction: 'ltr',
      metadata: LOCALE_REGISTRY[DEFAULT_LOCALE],
      availableLocales: ACTIVE_LOCALES.map((code) => LOCALE_REGISTRY[code]),
      initStoreLocales: () => {},
    };
  }
  return ctx;
}

// ==============================================================================
// 3. LANDING PAGE LOCALE CONTEXT (Independent visitor preference)
// ==============================================================================

const LandingI18nContext = createContext<I18nContextValue | null>(null);

const LANDING_LOCALE_STORAGE_KEY = 'letzshop_landing_locale';

export const LandingLocaleProvider: React.FC<{ initialLocale?: string; children: React.ReactNode }> = ({
  initialLocale = DEFAULT_LOCALE,
  children,
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => sanitizeLocale(initialLocale));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANDING_LOCALE_STORAGE_KEY);
      if (stored) {
        setLocaleState(sanitizeLocale(stored));
      }
    } catch {}
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    const sanitized = sanitizeLocale(newLocale);
    setLocaleState(sanitized);
    try {
      localStorage.setItem(LANDING_LOCALE_STORAGE_KEY, sanitized);
    } catch {}
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);
  const metadata = useMemo(() => LOCALE_REGISTRY[locale] || LOCALE_REGISTRY[DEFAULT_LOCALE], [locale]);
  const availableLocales = useMemo(() => ACTIVE_LOCALES.map((code) => LOCALE_REGISTRY[code]), []);

  const curFormat = useCallback(
    (amountPaise: number) => formatCurrency(amountPaise, locale),
    [locale]
  );
  const dtFormat = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
    [locale]
  );
  const numFormat = useCallback(
    (val: number, options?: Intl.NumberFormatOptions) => formatNumber(val, locale, options),
    [locale]
  );

  const value: I18nContextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatCurrency: curFormat,
      formatPrice: curFormat,
      formatDate: dtFormat,
      formatNumber: numFormat,
      direction: metadata.direction,
      metadata,
      availableLocales,
      initStoreLocales: () => {},
    }),
    [locale, setLocale, t, curFormat, dtFormat, numFormat, metadata, availableLocales]
  );

  return <LandingI18nContext.Provider value={value}>{children}</LandingI18nContext.Provider>;
};

export function useLandingI18n(): I18nContextValue {
  const ctx = useContext(LandingI18nContext);
  if (!ctx) {
    const fallbackT = createTranslator(DEFAULT_LOCALE);
    const curFmt = (p: number) => formatCurrency(p, DEFAULT_LOCALE);
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: fallbackT,
      formatCurrency: curFmt,
      formatPrice: curFmt,
      formatDate: (d, o) => formatDate(d, DEFAULT_LOCALE, o),
      formatNumber: (n, o) => formatNumber(n, DEFAULT_LOCALE, o),
      direction: 'ltr',
      metadata: LOCALE_REGISTRY[DEFAULT_LOCALE],
      availableLocales: ACTIVE_LOCALES.map((code) => LOCALE_REGISTRY[code]),
      initStoreLocales: () => {},
    };
  }
  return ctx;
}

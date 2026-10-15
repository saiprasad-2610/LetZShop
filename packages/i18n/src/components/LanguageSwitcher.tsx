import React from 'react';
import { useSellerI18n, useStorefrontI18n, useLandingI18n } from '../providers';
import { SupportedLocale } from '../registry';

/**
 * Merchant Dashboard Language Switcher.
 * Compact, accessible, shows native script names, does NOT disrupt UI layout.
 */
export const SellerLanguageSelect: React.FC<{
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
}> = ({ className = '', showIcon = true, compact = false }) => {
  const { locale, setLocale, availableLocales, t } = useSellerI18n();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {showIcon && (
        <span className="mr-1.5 text-xs select-none opacity-70" aria-hidden="true">
          🌐
        </span>
      )}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        aria-label={t('common.language')}
        title={t('common.language')}
        className="bg-transparent text-xs font-semibold py-1 px-2 rounded-lg border border-merchant-sidebar-border text-merchant-sidebar-text hover:bg-merchant-sidebar-hover focus:outline-none focus:ring-1 focus:ring-merchant-primary cursor-pointer transition"
      >
        {availableLocales.map((loc) => (
          <option
            key={loc.code}
            value={loc.code}
            className="bg-slate-900 text-white py-1"
          >
            {loc.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Customer Storefront Language Switcher.
 * Respects store's enabledStorefrontLocales list.
 */
export const StorefrontLanguageSelect: React.FC<{
  className?: string;
  compact?: boolean;
}> = ({ className = '', compact = false }) => {
  const { locale, setLocale, availableLocales, t } = useStorefrontI18n();

  // If store only enabled 1 language, hide switcher to avoid clutter
  if (availableLocales.length <= 1) {
    return null;
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        aria-label={t('common.language')}
        title={t('common.language')}
        className={`text-xs font-medium py-1.5 pl-2 pr-6 rounded-lg border border-gray-200 bg-white/90 text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer shadow-xs transition ${
          compact ? 'text-[11px] py-1' : ''
        }`}
      >
        {availableLocales.map((loc) => (
          <option key={loc.code} value={loc.code}>
            {loc.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Public Landing Page Language Switcher.
 */
export const LandingLanguageSelect: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { locale, setLocale, availableLocales, t } = useLandingI18n();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span className="mr-1 text-slate-400 text-xs">🌐</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        aria-label={t('common.language')}
        title={t('common.language')}
        className="bg-slate-900/90 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition shadow-xs"
      >
        {availableLocales.map((loc) => (
          <option key={loc.code} value={loc.code} className="bg-slate-950 text-white">
            {loc.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

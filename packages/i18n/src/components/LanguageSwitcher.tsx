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
  fullWidth?: boolean;
}> = ({ className = '', showIcon = true, compact = false, fullWidth = false }) => {
  const { locale, setLocale, availableLocales, t } = useSellerI18n();

  if (fullWidth) {
    return (
      <div className={`relative w-full flex items-center justify-between px-3 py-2 md:py-2 md:px-3 lg:py-2.5 lg:px-3.5 rounded-xl border border-merchant-sidebar-border bg-merchant-surface-raised/40 hover:bg-merchant-sidebar-hover text-merchant-sidebar-text min-h-[42px] md:min-h-[44px] lg:min-h-[48px] transition-colors ${className}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm select-none shrink-0" aria-hidden="true">
            🌐
          </span>
          <span className="text-xs font-semibold truncate hidden sm:inline md:inline">
            {t('common.language')}
          </span>
        </div>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as SupportedLocale)}
          aria-label={t('common.language')}
          title={t('common.language')}
          className="bg-transparent font-bold text-xs py-1.5 pl-2.5 pr-7 rounded-lg border border-merchant-sidebar-border/80 text-merchant-sidebar-text focus:outline-none focus:ring-1 focus:ring-merchant-primary cursor-pointer transition min-w-[115px] md:min-w-[125px] lg:min-w-[140px]"
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
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {showIcon && (
        <span className="mr-1.5 text-xs select-none opacity-70 shrink-0" aria-hidden="true">
          🌐
        </span>
      )}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        aria-label={t('common.language')}
        title={t('common.language')}
        className={`bg-transparent font-semibold rounded-lg border border-merchant-sidebar-border text-merchant-sidebar-text hover:bg-merchant-sidebar-hover focus:outline-none focus:ring-1 focus:ring-merchant-primary cursor-pointer transition ${
          compact
            ? 'py-1 pl-2 pr-5 text-[11px] min-w-[96px] h-8'
            : 'py-1.5 pl-2.5 pr-6 text-xs min-w-[120px] md:w-[130px] md:min-h-[44px] lg:w-[150px] lg:min-h-[48px]'
        }`}
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

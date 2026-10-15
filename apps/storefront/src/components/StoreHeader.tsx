import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingBag, Search, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getWordmark } from '@simply/ui';
import { useStorefrontI18n, StorefrontLanguageSelect } from '@simply/i18n';
import { logWhatsappEnquiry } from '../utils/enquiry';

interface StoreHeaderProps {
  store: any;
  themeConfig?: any;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ store, themeConfig }) => {
  const router = useRouter();
  const { itemCount } = useCart();
  const { t } = useStorefrontI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const themeCode = themeConfig?.themeId || 'atelier';
  const announcement = themeConfig?.announcement;
  const wordmark = getWordmark(store.name || 'Store');
  const slug = store.slug;
  const logoSize = Number(themeConfig?.logoSize) || Number(store?.branding?.logoSize) || 40;
  const storeNameSize = Number(themeConfig?.storeNameSize) || Number(store?.branding?.storeNameSize) || 18;

  const getQueryPath = (path: string) => {
    const params = new URLSearchParams();
    if (router.query.preview === 'true') params.set('preview', 'true');
    if (router.query.embedded === 'true') params.set('embedded', 'true');
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  // Resolve theme announcement styling & content
  const isAnnouncementEnabled = announcement ? announcement.enabled !== false : true;
  const isFloating = Boolean(announcement?.floating);

  const getThemeAnnouncementDefault = () => {
    switch (themeCode) {
      case 'foundry':
        return 'GSTIN REGISTERED • ISO 9001:2015 COMPLIANT • DIRECT FACTORY SUPPLY';
      case 'pulse':
        return '⚡ LIMITED DROP ONLINE NOW • FREE PAN-INDIA EXPRESS SHIPPING OVER ₹999 • 100% AUTHENTIC';
      case 'harvest':
        return '🌿 Pure & Handcrafted Daily • No Artificial Preservatives • Fresh Dispatch Within 24 Hours';
      case 'habitat':
        return 'Artisanal Living & Contemporary Furnishings • Pan-India White-Glove Logistics';
      case 'atelier':
        return 'Haute Joaillerie & Timeless Craftsmanship • Hallmarked 100% Certified';
      case 'horizon':
        return 'ENTERPRISE HERITAGE & INNOVATION • ISO CERTIFIED • PAN-INDIA & GLOBAL LOGISTICS';
      case 'canvas':
        return 'CINEMATIC FLAGSHIP RELEASE • DIRECT ARCHIVE DISPATCH • 100% VERIFIED AUTHENTIC';
      default:
        return 'Complimentary pan-India insured shipping on all orders';
    }
  };

  const displayText = announcement?.text?.trim() ? announcement.text : getThemeAnnouncementDefault();

  const getThemeStripClasses = () => {
    switch (themeCode) {
      case 'foundry':
        return 'bg-slate-900 text-slate-300 text-[11px] font-mono border-b border-slate-800';
      case 'pulse':
        return 'bg-black text-pink-300 text-[11px] font-black tracking-widest border-b border-pink-500/30';
      case 'harvest':
        return 'bg-amber-100/90 text-amber-900 text-[11px] font-medium border-b border-amber-200';
      case 'habitat':
        return 'bg-stone-100 text-stone-700 text-[11px] tracking-wider uppercase font-serif border-b border-stone-200';
      case 'atelier':
        return 'bg-stone-900 text-amber-200/90 text-[10px] tracking-[0.2em] uppercase font-medium border-b border-amber-900/30';
      case 'horizon':
        return 'bg-slate-950 text-sky-300 text-[11px] font-mono tracking-wider border-b border-slate-800';
      case 'canvas':
        return 'bg-black text-amber-300 text-[11px] font-medium tracking-widest uppercase border-b border-amber-900/40';
      default:
        return 'bg-slate-900 text-slate-100 text-xs border-b border-slate-800';
    }
  };


  const resolvedHeaderStyle =
    themeConfig?.headerStyle ||
    (themeCode === 'atelier'
      ? 'minimal-center'
      : themeCode === 'local'
      ? 'quick-search-bar'
      : 'sticky-action');

  const renderBrandWordmark = () => (
    <Link href={getQueryPath(`/store/${slug}`)} className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
      {(themeConfig?.branding?.logoUrl || store?.branding?.logoUrl || store?.logoUrl) ? (
        <img
          src={themeConfig?.branding?.logoUrl || store?.branding?.logoUrl || store?.logoUrl}
          alt={store.name}
          style={{
            width: `${logoSize}px`,
            height: `${logoSize}px`,
            maxHeight: `${logoSize}px`,
            maxWidth: `${logoSize}px`,
          }}
          className="rounded-full object-contain p-0.5 bg-white border border-gray-200/80 shadow-xs group-hover:scale-105 transition-all shrink-0"
        />
      ) : (
        <span
          style={{
            width: `${logoSize}px`,
            height: `${logoSize}px`,
            fontSize: `${Math.max(10, Math.round(logoSize * 0.4))}px`,
            backgroundColor: 'var(--theme-primary, #111827)',
          }}
          className={`rounded-lg flex items-center justify-center font-black text-white shadow-xs shrink-0 group-hover:scale-105 transition-all ${
            themeCode === 'atelier' ? 'rounded-none border border-amber-500/50' :
            themeCode === 'pulse' ? 'rounded-none transform -skew-x-6' :
            themeCode === 'foundry' ? 'rounded-sm font-mono' :
            themeCode === 'horizon' ? 'rounded-lg bg-blue-600' :
            themeCode === 'canvas' ? 'rounded-lg bg-slate-900 text-white' : 'rounded-lg'
          }`}
        >
          {wordmark.monogram}
        </span>
      )}

      <div className="flex flex-col text-left">
        <span
          style={{
            fontSize: `${storeNameSize}px`,
            lineHeight: '1.2',
          }}
          className={`font-bold tracking-tight transition-all ${
            themeCode === 'atelier' ? 'font-serif tracking-wide text-stone-900 group-hover:text-amber-800' :
            themeCode === 'pulse' ? 'font-black uppercase tracking-tight text-slate-900 group-hover:text-pink-600' :
            themeCode === 'harvest' ? 'font-serif font-bold tracking-tight text-stone-900 group-hover:text-emerald-800' :
            themeCode === 'foundry' ? 'font-mono uppercase font-bold tracking-wider text-slate-900 group-hover:text-sky-600' :
            themeCode === 'habitat' ? 'font-serif tracking-wide font-medium text-stone-900 group-hover:text-stone-700' :
            themeCode === 'canvas' ? 'font-sans font-black uppercase text-slate-900 group-hover:text-amber-600' :
            themeCode === 'horizon' ? 'font-sans font-bold text-slate-900 group-hover:text-blue-600' :
            'font-bold text-gray-900 group-hover:text-blue-700'
          }`}
        >
          {store.name}
        </span>
        <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase -mt-0.5 hidden xs:inline">
          {themeCode === 'harvest' ? 'Pure & Artisanal' :
           themeCode === 'atelier' ? 'Haute Maison' :
           themeCode === 'pulse' ? 'Verified Drop' :
           themeCode === 'foundry' ? 'Direct OEM Supply' :
           themeCode === 'habitat' ? 'Sanctuary Living' :
           themeCode === 'horizon' ? 'Enterprise & Heritage' :
           themeCode === 'canvas' ? 'Cinematic Flagship' : 'Official Store'}
        </span>
      </div>
    </Link>
  );

  const renderNavLinks = (extraClass = '') => (
    <nav className={`items-center gap-6 text-sm font-medium ${
      themeCode === 'atelier' ? 'uppercase text-xs tracking-widest text-stone-600' :
      themeCode === 'foundry' ? 'font-mono text-xs uppercase tracking-wider text-slate-700' :
      themeCode === 'pulse' ? 'font-bold uppercase text-xs tracking-wider text-slate-800' : 'text-gray-600'
    } ${extraClass}`}>
      <Link href={getQueryPath(`/store/${slug}`)} className="hover:text-gray-900 transition">
        {t('storefront.home')}
      </Link>
      <Link href={getQueryPath(`/store/${slug}/products`)} className="hover:text-gray-900 transition">
        {t('storefront.products')}
      </Link>
      <Link href={getQueryPath(`/store/${slug}/about`)} className="hover:text-gray-900 transition">
        {t('storefront.aboutUs')}
      </Link>
    </nav>
  );

  const renderActions = (showSearchIcon = true) => (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <StorefrontLanguageSelect />
      {showSearchIcon && (
        <Link
          href={getQueryPath(`/store/${slug}/search`)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          title="Search Products"
          aria-label="Search Catalog"
        >
          <Search className="w-5 h-5" />
        </Link>
      )}

      {/* Foundry Specific Quick RFQ Button */}
      {themeCode === 'foundry' && (
        <a
          href={`https://wa.me/919822012345?text=Hi%20${encodeURIComponent(store.name)}%2C%20please%20send%20catalog%20and%20quotation`}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            if (store?.id) {
              logWhatsappEnquiry({
                storeId: store.id,
                customerName: 'WhatsApp Buyer',
                message: `Catalog & quotation enquiry for ${store.name}`,
              });
            }
          }}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-800 text-white font-mono text-xs font-semibold shadow-sm transition"
        >
          <span>Instant RFQ</span>
        </a>
      )}

      <Link
        href={getQueryPath(`/store/${slug}/cart`)}
        data-theme-btn="true"
        className="relative flex items-center gap-1.5 px-3 py-2 text-white font-medium text-xs shadow-sm transition hover:opacity-90 store-btn"
        style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
        aria-label={`Shopping Cart with ${itemCount} items`}
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="hidden sm:inline">
          {themeCode === 'foundry' ? t('navigation.orders') : t('storefront.cart')}
        </span>
        {itemCount > 0 && (
          <span
            className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
              themeCode === 'pulse' ? 'animate-bounce' : ''
            }`}
            style={{ backgroundColor: 'var(--theme-accent, #D97706)' }}
          >
            {itemCount}
          </span>
        )}
      </Link>
    </div>
  );

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b transition shadow-sm ${
      themeCode === 'foundry' ? 'border-slate-300' :
      themeCode === 'pulse' ? 'border-slate-800' :
      themeCode === 'harvest' ? 'border-amber-200' :
      themeCode === 'habitat' ? 'border-stone-200' :
      themeCode === 'atelier' ? 'border-stone-200' :
      themeCode === 'horizon' ? 'border-slate-200' :
      themeCode === 'canvas' ? 'border-slate-200' : 'border-gray-200'
    }`}>
      {/* 1. Universal Top Announcement Bar with Theme Styling & Floating Marquee */}
      {isAnnouncementEnabled && (
        <div className={`${getThemeStripClasses()} py-1.5 px-4 overflow-hidden select-none`}>
          {isFloating ? (
            <div className="relative w-full overflow-hidden whitespace-nowrap flex items-center">
              <div className="inline-flex animate-marquee gap-10 items-center">
                <span>{displayText}</span>
                <span className="opacity-60">•</span>
                <span>{displayText}</span>
                <span className="opacity-60">•</span>
                <span>{displayText}</span>
                <span className="opacity-60">•</span>
                <span>{displayText}</span>
                <span className="opacity-60">•</span>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto flex items-center justify-center text-center truncate">
              <span>{displayText}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Header Container: Distinct Layouts for Header Styles */}
      {resolvedHeaderStyle === 'minimal-center' ? (
        /* Minimal Centered Layout: Nav Left, Centered Brand Logo, Actions Right */
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4 transition-all"
          style={{ minHeight: `${Math.max(64, logoSize + 16)}px` }}
        >
          {/* Left: Mobile Menu (<sm) or Desktop Nav (>=sm) */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {renderNavLinks('hidden sm:flex')}
          </div>

          {/* Center: Brand Logo & Highlighted Store Name */}
          <div className="flex items-center justify-center shrink-0">
            {renderBrandWordmark()}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1">
            {renderActions(true)}
          </div>
        </div>
      ) : resolvedHeaderStyle === 'quick-search-bar' ? (
        /* Quick Search Bar Layout: Brand Left, Inline Search in Center, Nav/Actions Right */
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 sm:gap-4 transition-all"
          style={{ minHeight: `${Math.max(64, logoSize + 16)}px` }}
        >
          {/* Left: Mobile Menu + Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {renderBrandWordmark()}
          </div>

          {/* Middle: Prominent Inline Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-2 lg:mx-4">
            <Link
              href={getQueryPath(`/store/${slug}/search`)}
              className="w-full flex items-center gap-2 bg-gray-100 hover:bg-gray-200/80 border border-gray-300 rounded-full px-3.5 py-1.5 text-xs text-gray-500 transition shadow-2xs"
            >
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">Search products, categories, daily essentials...</span>
            </Link>
          </div>

          {/* Right: Desktop Nav + Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {renderNavLinks('hidden lg:flex text-xs uppercase tracking-wider')}
            {renderActions(false)}
          </div>
        </div>
      ) : (
        /* Sticky Action Layout (Default): Brand Left, Desktop Nav Center, Actions Right */
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4 transition-all"
          style={{ minHeight: `${Math.max(64, logoSize + 16)}px` }}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {renderBrandWordmark()}
          </div>

          {renderNavLinks('hidden sm:flex')}

          {renderActions(true)}
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 shadow-lg">
          {themeCode === 'local' && (
            <div className="mb-3">
              <Link
                href={`/store/${slug}/search`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span>Search provisions & catalog...</span>
              </Link>
            </div>
          )}

          <Link
            href={getQueryPath(`/store/${slug}`)}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-800 py-1"
          >
            {t('storefront.home')}
          </Link>
          <Link
            href={getQueryPath(`/store/${slug}/products`)}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-800 py-1"
          >
            {t('storefront.products')}
          </Link>
          <Link
            href={getQueryPath(`/store/${slug}/about`)}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-800 py-1"
          >
            {t('storefront.aboutUs')}
          </Link>
          <Link
            href={getQueryPath(`/store/${slug}/cart`)}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-800 py-1"
          >
            {t('storefront.cart')} ({itemCount})
          </Link>
          {themeCode === 'foundry' && (
            <a
              href={`https://wa.me/919822012345?text=RFQ%20Inquiry%20for%20${encodeURIComponent(store.name)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                if (store?.id) {
                  logWhatsappEnquiry({
                    storeId: store.id,
                    customerName: 'WhatsApp Buyer',
                    message: `B2B RFQ quotation enquiry for ${store.name}`,
                  });
                }
              }}
              className="block text-sm font-bold text-sky-700 py-1 font-mono"
            >
              📞 Request B2B Quotation (WhatsApp)
            </a>
          )}
        </div>
      )}
    </header>
  );
};

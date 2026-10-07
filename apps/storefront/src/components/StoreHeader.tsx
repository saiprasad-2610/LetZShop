import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingBag, Search, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getWordmark } from '@simply/ui';

interface StoreHeaderProps {
  store: any;
  themeConfig?: any;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ store, themeConfig }) => {
  const router = useRouter();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const themeCode = themeConfig?.themeId || 'atelier';
  const announcement = themeConfig?.announcement;
  const wordmark = getWordmark(store.name || 'Store');
  const slug = store.slug;

  const getQueryPath = (path: string) => {
    const params = new URLSearchParams();
    if (router.query.preview === 'true') params.set('preview', 'true');
    if (router.query.embedded === 'true') params.set('embedded', 'true');
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b transition shadow-sm ${
      themeCode === 'foundry' ? 'border-slate-300' :
      themeCode === 'pulse' ? 'border-slate-800' :
      themeCode === 'harvest' ? 'border-amber-200' :
      themeCode === 'habitat' ? 'border-stone-200' :
      themeCode === 'atelier' ? 'border-stone-200' : 'border-gray-200'
    }`}>
      {/* 1. Theme-Specific Top Meta Strips */}
      {themeCode === 'foundry' ? (
        <div className="bg-slate-900 text-slate-300 text-[11px] font-mono py-1.5 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GSTIN REGISTERED • ISO 9001:2015 COMPLIANT • DIRECT FACTORY SUPPLY</span>
            </span>
            <span className="hidden sm:inline text-slate-400">
              Bulk Orders & Custom Engineering RFQ Desk: <strong>+91 98220 12345</strong>
            </span>
          </div>
        </div>
      ) : themeCode === 'pulse' ? (
        <div className="bg-black text-white text-[11px] font-black tracking-widest py-1.5 px-4 overflow-hidden border-b border-pink-500/30">
          <div className="whitespace-nowrap flex items-center justify-center gap-6 animate-pulse">
            <span>⚡ LIMITED DROP ONLINE NOW</span>
            <span>•</span>
            <span>FREE PAN-INDIA EXPRESS SHIPPING OVER ₹999</span>
            <span>•</span>
            <span>100% VERIFIED AUTHENTIC</span>
          </div>
        </div>
      ) : themeCode === 'harvest' ? (
        <div className="bg-amber-100/80 text-amber-900 text-[11px] font-medium py-1.5 px-4 border-b border-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span>🌿 Pure & Handcrafted Daily • No Artificial Preservatives</span>
            <span className="hidden sm:inline font-semibold">Fresh Dispatch Within 24 Hours</span>
          </div>
        </div>
      ) : themeCode === 'habitat' ? (
        <div className="bg-stone-100 text-stone-700 text-[11px] tracking-wider py-1.5 px-4 uppercase font-serif border-b border-stone-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span>Artisanal Living & Contemporary Furnishings</span>
            <span className="hidden sm:inline">Pan-India White-Glove Logistics</span>
          </div>
        </div>
      ) : themeCode === 'atelier' ? (
        <div className="bg-stone-900 text-amber-200/90 text-[10px] tracking-[0.2em] uppercase py-1.5 px-4 text-center font-medium border-b border-amber-900/30">
          {announcement?.enabled && announcement?.text ? announcement.text : 'Haute Joaillerie & Timeless Craftsmanship • Hallmarked 100% Certified'}
        </div>
      ) : (
        /* Local theme announcement / contact bar */
        <div className="bg-blue-900 text-blue-100 text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span>📍 Your Trusted Neighborhood Store • Fast Local Delivery</span>
            <a
              href={`https://wa.me/919822012345?text=Hello%20${encodeURIComponent(store.name)}%2C%20I%20would%20like%20to%20place%20an%20order`}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline text-white hover:text-green-300"
            >
              Order directly via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo / Wordmark */}
        <Link href={getQueryPath(`/store/${slug}`)} className="flex items-center gap-3">
          {(themeConfig?.branding?.logoUrl || store?.branding?.logoUrl || store?.logoUrl) ? (
            <img
              src={themeConfig?.branding?.logoUrl || store?.branding?.logoUrl || store?.logoUrl}
              alt={store.name}
              className="h-9 w-auto max-w-[150px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-sm ${
                  themeCode === 'atelier' ? 'rounded-none border border-amber-500/50' :
                  themeCode === 'pulse' ? 'rounded-none transform -skew-x-6' :
                  themeCode === 'foundry' ? 'rounded-sm font-mono' : 'rounded-lg'
                }`}
                style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
              >
                {wordmark.monogram}
              </span>
              <span className={`font-bold tracking-tight text-gray-900 ${
                themeCode === 'atelier' ? 'font-serif text-xl tracking-wider' :
                themeCode === 'pulse' ? 'font-black uppercase tracking-tight text-lg' :
                themeCode === 'foundry' ? 'font-mono uppercase text-base tracking-wider' :
                themeCode === 'habitat' ? 'font-serif text-xl tracking-wide' : 'text-lg'
              }`}>
                {store.name}
              </span>
            </div>
          )}
        </Link>

        {/* Local Theme Inline Search Bar (Desktop) */}
        {themeCode === 'local' && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <Link
              href={getQueryPath(`/store/${slug}/search`)}
              className="w-full flex items-center gap-2 bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 transition"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span>Search products, provisions, daily essentials...</span>
            </Link>
          </div>
        )}

        {/* Desktop Navigation Links */}
        <nav className={`hidden sm:flex items-center gap-6 text-sm font-medium ${
          themeCode === 'atelier' ? 'uppercase text-xs tracking-widest text-stone-600' :
          themeCode === 'foundry' ? 'font-mono text-xs uppercase tracking-wider text-slate-700' :
          themeCode === 'pulse' ? 'font-bold uppercase text-xs tracking-wider text-slate-800' : 'text-gray-600'
        }`}>
          <Link href={getQueryPath(`/store/${slug}`)} className="hover:text-gray-900 transition">
            Home
          </Link>
          <Link href={getQueryPath(`/store/${slug}/search`)} className="hover:text-gray-900 transition">
            {themeCode === 'foundry' ? 'Product Catalog' : 'All Products'}
          </Link>
          {themeCode === 'habitat' ? (
            <Link href={getQueryPath(`/store/${slug}/search?category=living`)} className="hover:text-gray-900 transition">
              Living Spaces
            </Link>
          ) : themeCode === 'foundry' ? (
            <a
              href={`https://wa.me/919822012345?text=RFQ%20Inquiry%20for%20${encodeURIComponent(store.name)}`}
              target="_blank"
              rel="noreferrer"
              className="text-sky-700 font-bold hover:text-sky-900 transition flex items-center gap-1"
            >
              <span>Request RFQ</span>
            </a>
          ) : (
            <Link href={getQueryPath(`/store/${slug}/search?featured=true`)} className="hover:text-gray-900 transition">
              Featured
            </Link>
          )}
        </nav>

        {/* Right Action Icons (Search, RFQ, Cart) */}
        <div className="flex items-center gap-3">
          <Link
            href={getQueryPath(`/store/${slug}/search`)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Search Products"
            aria-label="Search Catalog"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Foundry Specific Quick RFQ Button */}
          {themeCode === 'foundry' && (
            <a
              href={`https://wa.me/919822012345?text=Hi%20${encodeURIComponent(store.name)}%2C%20please%20send%20catalog%20and%20quotation`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-800 text-white font-mono text-xs font-semibold shadow-sm transition"
            >
              <span>Instant RFQ</span>
            </a>
          )}

          <Link
            href={getQueryPath(`/store/${slug}/cart`)}
            className={`relative flex items-center gap-1.5 px-3 py-2 text-white font-medium text-xs shadow-sm transition hover:opacity-90 ${
              themeCode === 'atelier' ? 'rounded-none' :
              themeCode === 'pulse' ? 'rounded-none skew-x-[-4deg]' :
              themeCode === 'foundry' ? 'rounded-sm font-mono' :
              themeCode === 'harvest' ? 'rounded-full' : 'rounded-lg'
            }`}
            style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
            aria-label={`Shopping Cart with ${itemCount} items`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">
              {themeCode === 'foundry' ? 'Order' : 'Cart'}
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
      </div>

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
            Home
          </Link>
          <Link
            href={getQueryPath(`/store/${slug}/search`)}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-800 py-1"
          >
            {themeCode === 'foundry' ? 'Industrial Catalog' : 'All Products'}
          </Link>
          <Link
            href={getQueryPath(`/store/${slug}/cart`)}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-800 py-1"
          >
            {themeCode === 'foundry' ? 'Order List' : 'Shopping Cart'} ({itemCount})
          </Link>
          {themeCode === 'foundry' && (
            <a
              href={`https://wa.me/919822012345?text=RFQ%20Inquiry%20for%20${encodeURIComponent(store.name)}`}
              target="_blank"
              rel="noreferrer"
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

import React, { useState } from 'react';
import { Menu, X, ArrowRight, Store, Globe } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

interface LandingNavbarProps {
  sellerUrl: string;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ sellerUrl }) => {
  const { t, locale, setLocale } = useLandingI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: t('landing.navFeatures') },
    { href: '#themes', label: t('landing.navThemes') },
    { href: '#how-it-works', label: t('landing.navHowItWorks') },
    { href: '#pricing', label: t('landing.navPricing') },
    { href: '#faq', label: t('landing.navFaq') },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform duration-200 relative overflow-hidden">
            <span className="tracking-tighter text-sm font-black">LS</span>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-700 transition">
              LetZshop
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
              .store
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="hover:text-blue-600 transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Section: Language Switcher & CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Simple English | मराठी Language Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-semibold" aria-label="Language Selector">
            <button
              type="button"
              onClick={() => setLocale('en-IN')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                locale === 'en-IN'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <span className="text-slate-300 select-none">|</span>
            <button
              type="button"
              onClick={() => setLocale('mr-IN')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                locale === 'mr-IN'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Secondary Action: Merchant Login */}
          <a
            href={`${sellerUrl}/login`}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-lg transition border border-transparent hover:border-slate-200"
          >
            {t('landing.merchantLogin')}
          </a>

          {/* Primary Action: Create Store */}
          <a
            href={`${sellerUrl}/login?mode=register`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm hover:shadow flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>{t('landing.createStore')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setLocale('en-IN')}
              className={`px-1.5 py-0.5 rounded transition ${locale === 'en-IN' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600'}`}
            >
              EN
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setLocale('mr-IN')}
              className={`px-1.5 py-0.5 rounded transition ${locale === 'mr-IN' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600'}`}
            >
              मराठी
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-fadeInDown">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={`${sellerUrl}/login`}
              className="w-full text-center py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {t('landing.merchantLogin')}
            </a>
            <a
              href={`${sellerUrl}/login?mode=register`}
              className="w-full text-center py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
            >
              <span>{t('landing.createStore')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import Image from 'next/image';
import { ArrowRight, Link2, CreditCard, MessageCircle, Palette } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

interface Screen1HeroProps {
  sellerUrl: string;
}

export const Screen1Hero: React.FC<Screen1HeroProps> = ({ sellerUrl }) => {
  const { t, locale } = useLandingI18n();

  return (
    <section id="hero" className="relative pt-4 pb-8 lg:pt-6 lg:pb-10 px-4 sm:px-6 lg:px-8 xl:px-10 bg-white overflow-hidden border-b border-slate-100">
      <div className="max-w-[1720px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-6 xl:gap-10">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Narrative & CTAs (Clean, balanced column)   */}
          {/* ======================================================== */}
          <div className="w-full lg:w-[450px] xl:w-[500px] shrink-0 space-y-5 lg:space-y-6">
            
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wider shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>{t('landing.heroEyebrow')}</span>
            </div>

            {/* Headline with 2 distinct lines */}
            <h1 className="text-4xl sm:text-5xl lg:text-[42px] xl:text-[48px] 2xl:text-[52px] font-black text-slate-900 tracking-tight leading-[1.04]">
              <span className="block xl:whitespace-nowrap">{t('landing.heroTitlePrefix')}</span>
              <span className="block mt-1">
                {locale === 'en-IN' || t('landing.heroTitleHighlight').toLowerCase().includes('your brand') ? (
                  <>
                    <span className="text-orange-500">your brand</span>{' '}
                    <span className="text-slate-900">deserves.</span>
                  </>
                ) : (
                  <span className="text-orange-500">{t('landing.heroTitleHighlight')}</span>
                )}
              </span>
            </h1>

            {/* Hero Description */}
            <p className="text-base sm:text-lg lg:text-[18px] xl:text-[19px] text-slate-600 leading-relaxed font-normal">
              {t('landing.heroSupporting')}
            </p>

            {/* Account Actions: ONLY TWO (Create Store & Merchant Login) */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href={`${sellerUrl}/login?mode=register`}
                  id="hero-cta-create-store"
                  className="h-13 sm:h-[54px] px-8 sm:px-9 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-orange-500/35 hover:shadow-orange-500/45 flex items-center justify-center gap-2.5 active:scale-[0.98]"
                >
                  <span>{t('landing.heroCtaPrimary')}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href={`${sellerUrl}/login`}
                  id="hero-cta-merchant-login"
                  className="h-13 sm:h-[54px] px-8 rounded-full bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border-2 border-slate-300/90 font-bold text-sm tracking-wide transition shadow-xs hover:shadow flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>{t('landing.heroCtaSecondary')}</span>
                </a>
              </div>

              {/* Reassurance text */}
              <p className="text-xs text-slate-400 font-medium pl-1">
                {t('landing.heroReassurance')}
              </p>
            </div>

            {/* 4 Benefits */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
              {/* 1. Branded storefront */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs border border-blue-100 group-hover:scale-105 transition-transform">
                  <Link2 className="w-5 h-5 -rotate-45" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageStorefront')}
                </span>
              </div>

              {/* 2. UPI & Razorpay */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs border border-orange-100 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantagePayments')}
                </span>
              </div>

              {/* 3. WhatsApp commerce */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-100 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageWhatsapp')}
                </span>
              </div>

              {/* 4. Custom storefront */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs border border-purple-100 group-hover:scale-105 transition-transform">
                  <Palette className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageCustom')}
                </span>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Massive Dominant Hero Artwork              */}
          {/* ======================================================== */}
          <div className="w-full lg:flex-1 flex justify-center lg:justify-end items-center min-w-0">
            <div className="heroVisual w-full max-w-[1024px] xl:max-w-[1120px] 2xl:max-w-[1200px] flex justify-center lg:justify-end items-center">
              <Image
                src="/images/landing/hero-daily-bakehouse.png"
                alt="LetZshop merchant dashboard and Daily Bakehouse online store on desktop and mobile"
                width={1024}
                height={546}
                priority
                unoptimized
                className="w-full h-auto object-contain select-none"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Check, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

interface Screen7PricingProps {
  sellerUrl: string;
}

export const Screen7Pricing: React.FC<Screen7PricingProps> = ({ sellerUrl }) => {
  const { t } = useLandingI18n();

  const separateItems = [
    t('landing.pricingSeparate1'),
    t('landing.pricingSeparate2'),
    t('landing.pricingSeparate3'),
    t('landing.pricingSeparate4'),
    t('landing.pricingSeparate5'),
    t('landing.pricingSeparate6'),
  ];

  const letzshopFeatures = [
    t('landing.pricingF1'),
    t('landing.pricingF2'),
    t('landing.pricingF3'),
    t('landing.pricingF4'),
    t('landing.pricingF5'),
    t('landing.pricingF6'),
    t('landing.pricingF7'),
    t('landing.pricingF8'),
    t('landing.pricingF9'),
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/50 border-b border-slate-100 scroll-mt-16">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('landing.pricingEyebrow')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {t('landing.pricingTitle')}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t('landing.pricingSupporting')}
          </p>
        </div>

        {/* Two-Column Restrained Comparison */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Doing it Separately (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Traditional Approach</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1">{t('landing.pricingLeftTitle')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('landing.pricingLeftSubtitle')}</p>
              </div>

              {/* Items List */}
              <ul className="space-y-3 pt-2 text-xs">
                {separateItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                      ✕
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 italic">
              {t('landing.pricingDisclaimer')}
            </div>
          </div>

          {/* Right Column: With LetZshop prominently featuring ₹999 (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between space-y-8 shadow-xl border border-blue-800/60 relative overflow-hidden">
            {/* Subtle Glow Accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/10 pb-6">
                <div>
                  <span className="text-xs font-mono font-bold tracking-wider text-blue-300 uppercase bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-400/30">
                    {t('landing.pricingRightTitle')}
                  </span>
                  <p className="text-xs text-slate-300 mt-2">All connected commerce tools included from day one</p>
                </div>

                <div className="text-left sm:text-right pt-2 sm:pt-0">
                  <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline sm:justify-end gap-1">
                    <span>{t('landing.pricingPrice')}</span>
                    <span className="text-xs font-normal text-slate-300">/ {t('landing.pricingPeriod')}</span>
                  </div>
                </div>
              </div>

              {/* Functionality List */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
                  Current Features Provided By LetZshop:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
                  {letzshopFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug text-[11px] sm:text-xs">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 relative z-10">
              <a
                href={`${sellerUrl}/login?mode=register`}
                className="w-full py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{t('landing.pricingCta')}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

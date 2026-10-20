import React from 'react';
import { ArrowRight, Globe, CreditCard, MessageCircle, Palette, Lock, ShoppingBag, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

interface Screen1HeroProps {
  sellerUrl: string;
}

export const Screen1Hero: React.FC<Screen1HeroProps> = ({ sellerUrl }) => {
  const { t } = useLandingI18n();

  return (
    <section id="hero" className="relative pt-12 pb-20 md:pt-16 md:pb-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/20 to-white overflow-hidden border-b border-slate-100">
      {/* Background Subtle Accent Grids & Circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 right-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-48 -left-20 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Text Content */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-bold tracking-wide shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>{t('landing.heroEyebrow')}</span>
          </div>

          {/* Headline with "your brand" highlighted in orange */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            {t('landing.heroTitlePrefix')}{' '}
            <span className="text-orange-600 relative inline-block">
              {t('landing.heroTitleHighlight')}
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-2 text-orange-200 -z-10"
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
              >
                <path d="M0,8 Q50,0 100,8" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
            {t('landing.heroSupporting')}
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <a
              href={`${sellerUrl}/login?mode=register`}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>{t('landing.heroCtaPrimary')}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={`${sellerUrl}/login`}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>{t('landing.heroCtaSecondary')}</span>
            </a>
          </div>

          {/* Bottom Advantage Row */}
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">{t('landing.advantageStorefront')}</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">{t('landing.advantagePayments')}</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">{t('landing.advantageWhatsapp')}</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">{t('landing.advantageCustom')}</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup: Real-looking Dashboard + Floating Mobile Storefront */}
        <div className="relative max-w-5xl mx-auto pt-4">
          {/* Main Desktop Container Mockup */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
            {/* Browser Header Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="ml-2 font-mono text-slate-500 text-[11px] bg-white px-3 py-1 rounded-md border border-slate-200 hidden sm:inline-block">
                  https://kalyani.letzshop.store
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Verified LetZshop Storefront</span>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/40">
              {/* Left 7 Cols: Merchant Dashboard Overview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Merchant Command</span>
                    <h3 className="text-base font-bold text-slate-900">Kalyani Crafts & Textiles</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Store Active
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block">Today's Sales</span>
                    <span className="text-lg font-black text-slate-900">₹48,250</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">↑ 100% Direct UPI</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block">Orders</span>
                    <span className="text-lg font-black text-slate-900">34</span>
                    <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">All synced live</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block">Active Products</span>
                    <span className="text-lg font-black text-slate-900">58</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Variants managed</span>
                  </div>
                </div>

                {/* Recent Orders List */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Live Order Pipeline</span>
                  
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          ₹
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Handloom Chanderi Silk Saree</p>
                          <p className="text-[10px] text-slate-500">Order #8942 • Pune, Maharashtra</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">₹3,450</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold block mt-0.5">UPI • Paid</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                          ₹
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Brass Urli with Floating Candle Stand</p>
                          <p className="text-[10px] text-slate-500">Order #8941 • Bengaluru, Karnataka</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">₹1,690</span>
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold block mt-0.5">Card • Paid</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Customer Mobile Storefront Mockup */}
              <div className="lg:col-span-5 bg-gradient-to-b from-blue-500/5 to-slate-100 p-4 rounded-xl border border-blue-200/60 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Customer Mobile Storefront</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">yourbrand.letzshop.store</span>
                </div>

                {/* Mini Phone Frame */}
                <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                    <span className="font-bold text-slate-900 tracking-tight">KALYANI SILKS</span>
                    <div className="flex items-center gap-1 text-slate-500">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1 rounded-full">2</span>
                    </div>
                  </div>

                  {/* Product Mini Banner */}
                  <div className="h-24 rounded-lg bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 p-3 text-white flex flex-col justify-between">
                    <span className="text-[9px] font-bold tracking-wider uppercase bg-black/20 self-start px-1.5 py-0.5 rounded">
                      Festive Collection 2026
                    </span>
                    <div>
                      <p className="text-xs font-black">Handloom Sarees & Heritage Decor</p>
                      <p className="text-[9px] text-orange-100">Free delivery on orders above ₹999</p>
                    </div>
                  </div>

                  {/* Product Cards */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="h-14 rounded bg-orange-100/60 mb-1 flex items-center justify-center text-lg">
                        🧵
                      </div>
                      <span className="font-bold text-slate-800 text-[11px] block truncate">Tussar Silk Saree</span>
                      <span className="text-orange-600 font-bold text-xs">₹3,450</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="h-14 rounded bg-amber-100/60 mb-1 flex items-center justify-center text-lg">
                        🪔
                      </div>
                      <span className="font-bold text-slate-800 text-[11px] block truncate">Engraved Brass Urli</span>
                      <span className="text-orange-600 font-bold text-xs">₹1,690</span>
                    </div>
                  </div>

                  {/* WhatsApp Action Strip */}
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp Direct Enquiry
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { ArrowRight, Link2, CreditCard, MessageCircle, Palette, Sparkles, TrendingUp, ShoppingBag, Search, Bell, User, Check, ArrowUpRight } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { LetZshopLogo } from './LetZshopLogo';

interface Screen1HeroProps {
  sellerUrl: string;
}

export const Screen1Hero: React.FC<Screen1HeroProps> = ({ sellerUrl }) => {
  const { t } = useLandingI18n();

  return (
    <section id="hero" className="relative pt-6 pb-16 md:pt-10 md:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/25 to-white overflow-hidden border-b border-slate-100">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 right-12 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-44 -left-20 w-80 h-80 bg-orange-100/35 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Headline, copy, CTAs, advantages (~48% width) */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6 lg:pr-2">
            
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>{t('landing.heroEyebrow')}</span>
            </div>

            {/* Headline with "your brand" highlighted in LetZshop orange */}
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] xl:text-[58px] font-black text-slate-900 tracking-tight leading-[1.08]">
              {t('landing.heroTitlePrefix')}{' '}
              <span className="text-orange-500 inline-block">
                {t('landing.heroTitleHighlight')}
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              {t('landing.heroSupporting')}
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href={`${sellerUrl}/login?mode=register`}
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>{t('landing.heroCtaPrimary')}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href={`${sellerUrl}/login`}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300/90 font-bold text-sm transition shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>{t('landing.heroCtaSecondary')}</span>
                </a>
              </div>

              {/* Reassurance text */}
              <p className="text-xs text-slate-400 font-medium pl-1">
                {t('landing.heroReassurance')}
              </p>
            </div>

            {/* 4 Compact Advantage Items matching Reference 3 */}
            <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2">
              {/* 1. Branded storefront */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-xl bg-white/60 hover:bg-white transition border border-slate-100 shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs border border-blue-100/60">
                  <Link2 className="w-4 h-4 -rotate-45" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {t('landing.advantageStorefront')}
                </span>
              </div>

              {/* 2. UPI & Razorpay */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-xl bg-white/60 hover:bg-white transition border border-slate-100 shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs border border-orange-100/60">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {t('landing.advantagePayments')}
                </span>
              </div>

              {/* 3. WhatsApp commerce */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-xl bg-white/60 hover:bg-white transition border border-slate-100 shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-100/60">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {t('landing.advantageWhatsapp')}
                </span>
              </div>

              {/* 4. Custom storefront */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-xl bg-white/60 hover:bg-white transition border border-slate-100 shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs border border-purple-100/60">
                  <Palette className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {t('landing.advantageCustom')}
                </span>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Composition: Dashboard + Laptop + Phone    */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 xl:col-span-6 relative mt-4 lg:mt-0">
            <div className="relative w-full h-[470px] sm:h-[530px] md:h-[560px] lg:h-[530px] xl:h-[560px] select-none">
              
              {/* ---------------------------------------------------- */}
              {/* LAYER 1 (BACK): Merchant Dashboard Panel             */}
              {/* ---------------------------------------------------- */}
              <div className="absolute top-0 right-0 sm:right-2 w-[95%] sm:w-[90%] lg:w-[94%] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-10 transition-all">
                {/* Dashboard Top Header Bar */}
                <div className="h-10 border-b border-slate-100 px-3.5 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2.5">
                    <LetZshopLogo size="sm" iconOnly />
                    <span className="font-extrabold text-xs text-slate-800">LetZshop</span>
                    <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">/ dashboard</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-400 w-36">
                      <Search className="w-2.5 h-2.5 text-slate-400" />
                      <span>Search orders...</span>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                      <Bell className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-1.5 pl-1">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                        S
                      </div>
                      <span className="hidden md:inline-block text-[10px] font-bold text-slate-700">Store ▾</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard Body */}
                <div className="p-3 sm:p-4 grid grid-cols-12 gap-3 bg-white">
                  {/* Left Mini Sidebar */}
                  <div className="hidden sm:block sm:col-span-3 space-y-1 text-[11px] font-semibold text-slate-500 border-r border-slate-100 pr-2">
                    <div className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-bold flex items-center justify-between">
                      <span>Dashboard</span>
                    </div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Orders</div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Products</div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Customers</div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Marketing</div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Analytics</div>
                  </div>

                  {/* Main Metrics Area */}
                  <div className="col-span-12 sm:col-span-9 space-y-2.5 pl-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Overview</span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Last 30 days ▾</span>
                    </div>

                    {/* Metric Cards Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium block">Total Sales</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">₹1,24,580</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> ↑ 28%
                        </span>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium block">Orders</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">243</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> ↑ 32%
                        </span>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium block">Customers</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">1,921</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> ↑ 18%
                        </span>
                      </div>
                    </div>

                    {/* Mini Sales Growth Chart */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-700">Sales Growth</span>
                        <span className="inline-block text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 rounded ml-1.5">+32%</span>
                      </div>
                      <svg className="w-28 sm:w-36 h-6 text-blue-600" viewBox="0 0 140 30" fill="none">
                        <path
                          d="M0 25C20 22 40 28 60 18C80 8 100 12 120 4L140 2"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Annotation 1: Pointing to Dashboard */}
              <div className="hidden sm:flex items-center gap-1.5 absolute -top-4 left-6 sm:left-12 z-20">
                <span className="text-xs font-bold text-slate-600 italic tracking-tight font-sans">
                  {t('landing.heroAnnotationDashboard')}
                </span>
                <svg className="w-8 h-8 text-orange-500" viewBox="0 0 40 40" fill="none">
                  <path d="M5 10 C 15 8, 28 12, 32 25" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" strokeLinecap="round" />
                  <path d="M28 25 L 33 26 L 31 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* ---------------------------------------------------- */}
              {/* LAYER 2 (MIDDLE / FOREGROUND): Dominant Laptop Frame */}
              {/* ---------------------------------------------------- */}
              <div className="absolute bottom-2 sm:bottom-4 left-0 sm:left-2 w-[88%] sm:w-[84%] lg:w-[86%] z-20 shadow-2xl rounded-2xl border border-slate-300 bg-slate-900 pt-2.5 px-2.5 pb-2 transition-transform duration-300">
                {/* Laptop Camera dot */}
                <div className="flex items-center justify-center pb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>

                {/* Laptop Storefront Screen: Everyday Goods (Gender-Neutral) */}
                <div className="w-full bg-white rounded-lg overflow-hidden border border-slate-200">
                  
                  {/* Storefront Navbar */}
                  <div className="h-8 bg-white border-b border-slate-100 px-3 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 tracking-tight text-[11px]">Everyday Goods</span>
                      <div className="hidden md:flex items-center gap-2.5 text-slate-500 font-medium pl-2">
                        <span className="text-slate-900 font-bold">Home</span>
                        <span>Shop</span>
                        <span>Collections</span>
                        <span>About</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Search className="w-3 h-3" />
                      <div className="flex items-center gap-1 font-bold text-[10px]">
                        <ShoppingBag className="w-3 h-3 text-slate-800" />
                        <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[8px] font-bold">3</span>
                      </div>
                    </div>
                  </div>

                  {/* Storefront Hero Banner */}
                  <div className="relative h-28 sm:h-32 bg-stone-900 overflow-hidden flex items-center px-4">
                    <img
                      src="https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&auto=format&fit=crop&q=80"
                      alt="Everyday Goods Storefront"
                      className="absolute inset-0 w-full h-full object-cover opacity-45"
                    />
                    <div className="relative z-10 space-y-1 max-w-[240px]">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded">
                        Artisanal & Minimal
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
                        Minimal Goods for Everyday Living
                      </h4>
                      <button className="text-[9px] font-bold bg-white text-slate-900 px-2.5 py-1 rounded shadow-sm hover:bg-slate-100 transition">
                        Shop Now →
                      </button>
                    </div>
                  </div>

                  {/* Storefront Best Sellers Row (4 Products) */}
                  <div className="p-2 sm:p-2.5 bg-slate-50/60">
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="text-[10px] font-bold text-slate-800">Best Sellers</span>
                      <span className="text-[9px] font-semibold text-blue-600">View All →</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {/* Product 1: Amber Diffuser */}
                      <div className="bg-white rounded-md p-1 border border-slate-100 space-y-0.5 shadow-2xs">
                        <img
                          src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80"
                          alt="Amber Diffuser"
                          className="w-full h-12 object-cover rounded"
                        />
                        <div className="text-[8px] font-bold text-slate-800 truncate">Amber Diffuser</div>
                        <div className="text-[8px] font-black text-slate-900">₹1,290</div>
                      </div>

                      {/* Product 2: Ceramic Dripper */}
                      <div className="bg-white rounded-md p-1 border border-slate-100 space-y-0.5 shadow-2xs">
                        <img
                          src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80"
                          alt="Ceramic Dripper"
                          className="w-full h-12 object-cover rounded"
                        />
                        <div className="text-[8px] font-bold text-slate-800 truncate">Ceramic Dripper</div>
                        <div className="text-[8px] font-black text-slate-900">₹1,450</div>
                      </div>

                      {/* Product 3: Coffee Mug */}
                      <div className="bg-white rounded-md p-1 border border-slate-100 space-y-0.5 shadow-2xs">
                        <img
                          src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80"
                          alt="Coffee Mug"
                          className="w-full h-12 object-cover rounded"
                        />
                        <div className="text-[8px] font-bold text-slate-800 truncate">Stoneware Mug</div>
                        <div className="text-[8px] font-black text-slate-900">₹890</div>
                      </div>

                      {/* Product 4: Hand-Poured Candle */}
                      <div className="bg-white rounded-md p-1 border border-slate-100 space-y-0.5 shadow-2xs">
                        <img
                          src="https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&auto=format&fit=crop&q=80"
                          alt="Soy Candle"
                          className="w-full h-12 object-cover rounded"
                        />
                        <div className="text-[8px] font-bold text-slate-800 truncate">Soy Candle</div>
                        <div className="text-[8px] font-black text-slate-900">₹990</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laptop Base Lip / Notch */}
                <div className="h-2 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-b-lg mt-1.5 flex justify-center">
                  <div className="w-14 h-1 bg-slate-900 rounded-b" />
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* LAYER 3 (FRONT RIGHT): Matching Mobile Storefront    */}
              {/* ---------------------------------------------------- */}
              <div className="absolute -bottom-1 -right-1 sm:right-6 md:right-10 lg:right-8 xl:right-10 w-[145px] sm:w-[170px] md:w-[180px] z-30 shadow-2xl rounded-[28px] p-1.5 bg-slate-900 border-2 border-slate-700/80 transition-transform duration-300 hover:scale-[1.02]">
                {/* Phone Speaker / Dynamic Island */}
                <div className="flex items-center justify-center pb-1">
                  <div className="w-10 h-2 bg-black rounded-full" />
                </div>

                {/* Mobile Storefront Screen */}
                <div className="w-full bg-white rounded-[20px] overflow-hidden border border-slate-200">
                  {/* Mobile Store Navbar */}
                  <div className="h-7 bg-white border-b border-slate-100 px-2 flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-2 flex flex-col justify-between">
                        <span className="w-full h-0.5 bg-slate-700 rounded" />
                        <span className="w-full h-0.5 bg-slate-700 rounded" />
                      </div>
                      <span className="font-extrabold text-[9px] text-slate-900">Everyday</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-2.5 h-2.5 text-slate-800" />
                      <span className="w-3 h-3 rounded-full bg-orange-500 text-white flex items-center justify-center text-[7px] font-bold">3</span>
                    </div>
                  </div>

                  {/* Mobile Store Banner */}
                  <div className="relative h-16 bg-stone-900 overflow-hidden flex items-center p-2">
                    <img
                      src="https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80"
                      alt="Mobile Banner"
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <div className="relative z-10 space-y-0.5">
                      <span className="text-[7px] uppercase font-bold text-amber-300">Minimal Living</span>
                      <h6 className="text-[8px] font-black text-white leading-tight">Minimal Goods</h6>
                      <button className="text-[7px] font-bold bg-white text-slate-900 px-1.5 py-0.5 rounded shadow-2xs">
                        Shop →
                      </button>
                    </div>
                  </div>

                  {/* Mobile Product Cards */}
                  <div className="p-1.5 bg-slate-50 space-y-1">
                    <span className="text-[8px] font-bold text-slate-800 block">Best Sellers</span>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="bg-white rounded p-1 border border-slate-100 space-y-0.5">
                        <img
                          src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80"
                          alt="Diffuser"
                          className="w-full h-10 object-cover rounded"
                        />
                        <div className="text-[7px] font-bold text-slate-800 truncate">Diffuser</div>
                        <div className="text-[7px] font-black text-slate-900">₹1,290</div>
                      </div>

                      <div className="bg-white rounded p-1 border border-slate-100 space-y-0.5">
                        <img
                          src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80"
                          alt="Dripper"
                          className="w-full h-10 object-cover rounded"
                        />
                        <div className="text-[7px] font-bold text-slate-800 truncate">Dripper</div>
                        <div className="text-[7px] font-black text-slate-900">₹1,450</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone Bottom Home Bar */}
                <div className="h-1 flex justify-center items-center mt-1">
                  <div className="w-8 h-0.5 bg-slate-500 rounded-full" />
                </div>
              </div>

              {/* Annotation 2: Pointing to Phone */}
              <div className="hidden md:flex flex-col items-center text-center absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-1 md:-right-1 lg:-right-2 xl:-right-1 z-40 pointer-events-none">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 italic tracking-tight font-sans leading-tight">
                  {t('landing.heroAnnotationDevice')}
                </span>
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500 mt-1" viewBox="0 0 30 30" fill="none">
                  <path d="M22 6 C16 12, 10 16, 6 20" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" strokeLinecap="round" />
                  <path d="M5 14 L 5 21 L 12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

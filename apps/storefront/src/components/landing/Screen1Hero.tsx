import React from 'react';
import { ArrowRight, Link2, CreditCard, MessageCircle, Palette, TrendingUp, ShoppingBag, Search, Bell, Star } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { LetZshopLogo } from './LetZshopLogo';

interface Screen1HeroProps {
  sellerUrl: string;
}

export const Screen1Hero: React.FC<Screen1HeroProps> = ({ sellerUrl }) => {
  const { t, locale } = useLandingI18n();

  return (
    <section id="hero" className="relative pt-4 pb-12 md:pt-6 md:pb-16 px-4 sm:px-6 lg:px-8 bg-[#FCFCFA] overflow-hidden border-b border-slate-100">
      {/* ======================================================== */}
      {/* ATMOSPHERIC BACKGROUND & LIGHTING                        */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft Sunlight Beam / Amber Radiance (Upper Left) */}
        <div className="absolute -top-32 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-amber-100/40 via-orange-50/25 to-transparent rounded-full blur-3xl" />
        
        {/* Cool Atmospheric Sky Blue Radiance (Upper Right behind Dashboard) */}
        <div className="absolute -top-24 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-blue-100/45 via-indigo-50/20 to-transparent rounded-full blur-3xl" />
        
        {/* Warm Orange Glow (Lower Right Corner) */}
        <div className="absolute bottom-0 right-10 w-[550px] h-[450px] bg-gradient-to-tl from-orange-100/35 via-amber-50/15 to-transparent rounded-full blur-3xl" />

        {/* Realistic Desk Surface Table Plane across right side */}
        <div className="hidden lg:block absolute bottom-0 right-0 w-[62%] h-40 bg-gradient-to-t from-stone-200/40 via-stone-100/20 to-transparent border-t border-stone-200/30" />
      </div>

      <div className="max-w-[1480px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Narrative & CTAs (~45% width)               */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6 lg:pr-2">
            
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wider shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>{t('landing.heroEyebrow')}</span>
            </div>

            {/* Headline with 2 distinct lines matching Reference */}
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] xl:text-[60px] 2xl:text-[66px] font-black text-slate-900 tracking-tight leading-[1.02]">
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

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg lg:text-[19px] text-slate-600 leading-relaxed font-normal max-w-[540px]">
              {t('landing.heroSupporting')}
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href={`${sellerUrl}/login?mode=register`}
                  className="h-13 sm:h-[56px] px-8 sm:px-9 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-orange-500/35 hover:shadow-orange-500/45 flex items-center justify-center gap-2.5 active:scale-[0.98]"
                >
                  <span>{t('landing.heroCtaPrimary')}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href={`${sellerUrl}/login`}
                  className="h-13 sm:h-[56px] px-8 rounded-full bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border-2 border-slate-300/90 font-bold text-sm tracking-wide transition shadow-xs hover:shadow flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>{t('landing.heroCtaSecondary')}</span>
                </a>
              </div>

              {/* Reassurance text */}
              <p className="text-xs text-slate-400 font-medium pl-1">
                {t('landing.heroReassurance')}
              </p>
            </div>

            {/* 4 Compact Advantage Items matching Approved Reference */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. Branded storefront */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs border border-blue-100 group-hover:scale-105 transition-transform">
                  <Link2 className="w-5 h-5 -rotate-45" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageStorefront')}
                </span>
              </div>

              {/* 2. UPI & Razorpay */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs border border-orange-100 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantagePayments')}
                </span>
              </div>

              {/* 3. WhatsApp commerce */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-100 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageWhatsapp')}
                </span>
              </div>

              {/* 4. Custom storefront */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs border border-purple-100 group-hover:scale-105 transition-transform">
                  <Palette className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageCustom')}
                </span>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Contained HeroCommerceScene (~57% width)   */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 xl:col-span-7 relative mt-6 lg:mt-0 flex items-center justify-center lg:justify-end">
            <div
              data-testid="hero-commerce-scene"
              className="hero-scene relative w-full max-w-[920px] aspect-[1.28/1] min-h-[500px] sm:min-h-[560px] md:min-h-[600px] select-none"
            >
              
              {/* ---------------------------------------------------- */}
              {/* AMBIENT ENVIRONMENT ELEMENTS (Natural Subtle Depth)   */}
              {/* ---------------------------------------------------- */}
              {/* Soft Organic Plant Silhouette on Left Background */}
              <div className="hidden lg:block absolute -top-8 -left-6 w-44 h-60 pointer-events-none -z-0 opacity-45 blur-[0.8px]">
                <svg viewBox="0 0 180 220" className="w-full h-full text-emerald-800" fill="currentColor">
                  <path d="M40 180 Q 70 90 140 25" stroke="#065f46" strokeWidth="3" fill="none" />
                  <ellipse cx="65" cy="115" rx="26" ry="40" transform="rotate(-35 65 115)" fill="#047857" opacity="0.8" />
                  <ellipse cx="105" cy="75" rx="24" ry="36" transform="rotate(25 105 75)" fill="#059669" opacity="0.75" />
                  <ellipse cx="135" cy="35" rx="18" ry="28" transform="rotate(-15 135 35)" fill="#10b981" opacity="0.85" />
                  <ellipse cx="45" cy="150" rx="22" ry="32" transform="rotate(-45 45 150)" fill="#064e3b" opacity="0.7" />
                  <ellipse cx="90" cy="140" rx="20" ry="30" transform="rotate(40 90 140)" fill="#047857" opacity="0.65" />
                </svg>
              </div>

              {/* Warm Golden Glow Behind Laptop */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

              {/* ---------------------------------------------------- */}
              {/* LAYER 1 (BACK): Merchant Dashboard Panel             */}
              {/* Proportions: 74% width, top: 1%, right: 1%           */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-dashboard-layer"
                className="absolute top-[1%] right-[1%] w-[76%] bg-white rounded-2xl border border-blue-100 shadow-[0_20px_45px_-10px_rgba(30,58,138,0.10)] overflow-hidden z-10 opacity-[0.97]"
              >
                {/* Dashboard Top Header Bar */}
                <div className="h-9 sm:h-10 border-b border-slate-100 px-3.5 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2.5">
                    <LetZshopLogo size="sm" iconOnly />
                    <span className="font-extrabold text-xs text-slate-800">LetZshop</span>
                    <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">/ dashboard</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-400 w-32 md:w-36">
                      <Search className="w-2.5 h-2.5 text-slate-400" />
                      <span>Search orders, products...</span>
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
                <div className="p-3 sm:p-3.5 grid grid-cols-12 gap-3 bg-white">
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

              {/* Annotation 1: Pointing to Dashboard (Inside scene bounds) */}
              <div
                data-testid="hero-annot-dash"
                className="hidden sm:flex items-center gap-1.5 absolute top-[0%] left-[8%] sm:left-[12%] z-20 pointer-events-none"
              >
                <span className="text-xs font-bold text-slate-600 italic tracking-tight font-sans">
                  {t('landing.heroAnnotationDashboard')}
                </span>
                <svg className="w-7 h-7 text-orange-500" viewBox="0 0 40 40" fill="none">
                  <path d="M5 10 C 15 8, 28 12, 32 25" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" strokeLinecap="round" />
                  <path d="M28 25 L 33 26 L 31 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* ---------------------------------------------------- */}
              {/* LAYER 2 (MIDDLE): Dominant Laptop Storefront Shell   */}
              {/* Proportions: 88-92% width, left: 2%, top: 35%        */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-laptop-layer"
                className="absolute top-[35%] left-[2%] w-[90%] z-20 transition-transform duration-300"
              >
                {/* Contact Shadow Underneath Laptop Base */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[94%] h-8 bg-slate-950/40 blur-xl -z-10 rounded-full" />

                {/* Laptop Display Bezel Shell */}
                <div className="rounded-t-2xl bg-[#0f172a] p-2 sm:p-2.5 pb-0 border border-slate-700/90 shadow-[0_36px_75px_-20px_rgba(15,23,42,0.48),0_18px_36px_-10px_rgba(15,23,42,0.3)]">
                  
                  {/* Laptop Top Bezel Camera Dot */}
                  <div className="flex justify-center pb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800 ring-1 ring-slate-600/60" />
                  </div>

                  {/* Laptop Screen Area: The Live Storefront */}
                  <div
                    data-testid="hero-storefront-screen"
                    className="bg-white rounded-t-lg overflow-hidden border border-slate-800 flex flex-col"
                  >
                    
                    {/* Storefront Navigation Bar */}
                    <div
                      data-testid="hero-storefront-nav"
                      className="h-9 sm:h-10 bg-white border-b border-slate-100 px-3 sm:px-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 sm:gap-6">
                        {/* Daily Bakehouse Logo & Brand */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-300/50 flex items-center justify-center text-amber-600 shrink-0">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-amber-500 stroke-amber-700 stroke-[0.7]">
                              <path d="M18.06 6.88C17.5 4.09 15.02 2 12 2s-5.5 2.09-6.06 4.88C4.16 7.42 2.8 9.32 2.8 11.55c0 2.65 1.95 4.82 4.5 5.17V20c0 .55.45 1 1 1h7.4c.55 0 1-.45 1-1v-3.28c2.55-.35 4.5-2.52 4.5-5.17 0-2.23-1.36-4.13-3.14-4.67z" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-serif font-black text-xs sm:text-sm text-amber-950 tracking-tight leading-none">
                              Daily Bakehouse
                            </span>
                            <span className="text-[7px] text-amber-700/80 font-sans tracking-tight">
                              Freshly Baked Happiness
                            </span>
                          </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden sm:flex items-center gap-3 text-[10px] font-semibold text-slate-600">
                          <span className="text-orange-600 font-bold border-b-2 border-orange-500 pb-0.5">Home</span>
                          <span className="hover:text-slate-900 cursor-pointer">Shop</span>
                          <span className="hover:text-slate-900 cursor-pointer">Cakes</span>
                          <span className="hover:text-slate-900 cursor-pointer">Cookies</span>
                          <span className="hover:text-slate-900 cursor-pointer">Breads</span>
                          <span className="hover:text-slate-900 cursor-pointer">About</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-slate-600">
                        <Search className="w-3 h-3 hover:text-slate-900 cursor-pointer" />
                        <div className="flex items-center gap-1 font-bold text-[10px]">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-800" />
                          <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[8px] font-bold">3</span>
                        </div>
                      </div>
                    </div>

                    {/* Storefront Hero Banner (Freshly Baked Everyday Happiness) */}
                    <div className="relative h-28 sm:h-34 bg-gradient-to-r from-[#FDF7F0] via-[#FBF1E6] to-[#F5E6D3] overflow-hidden flex items-center px-4 sm:px-6">
                      <div className="relative z-10 space-y-1 sm:space-y-1.5 max-w-[260px] sm:max-w-[280px]">
                        <h4 className="font-serif text-sm sm:text-lg font-black text-amber-950 leading-tight">
                          Freshly Baked <br />
                          <span className="text-orange-600">Everyday Happiness</span>
                        </h4>
                        <p className="text-[9px] sm:text-[10px] text-amber-900/80 leading-snug line-clamp-2">
                          Artisanal breads, cakes, cookies and more, made with the finest ingredients.
                        </p>
                        <button className="text-[9px] sm:text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md shadow-xs transition flex items-center gap-1">
                          <span>Shop Now</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Right Hero Image (Artisanal Bakery Spread) */}
                      <div className="absolute right-0 top-0 bottom-0 w-[55%] sm:w-[50%] h-full">
                        <img
                          src="/images/hero/bannerHero.png"
                          alt="Freshly Baked Artisanal Goods"
                          className="w-full h-full object-cover object-left"
                        />
                      </div>
                    </div>

                    {/* Storefront Best Sellers Row (4 Bakery Products) */}
                    <div className="p-2 sm:p-2.5 bg-white border-t border-amber-100/50">
                      <div className="flex items-center justify-between pb-1.5">
                        <span className="text-[10px] font-black text-slate-900 tracking-tight">Best Sellers</span>
                        <span className="text-[9px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer">View All →</span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {/* Product 1: Butter Croissant */}
                        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-lg p-1.5 border border-slate-100 space-y-1 shadow-2xs transition">
                          <div className="w-full h-11 sm:h-12 overflow-hidden rounded bg-amber-50/50 flex items-center justify-center">
                            <img
                              src="/images/hero/productCroissant.png"
                              alt="Butter Croissant"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-[8px] font-bold text-slate-900 truncate">Butter Croissant</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-900">₹120</span>
                            <span className="text-[7px] text-amber-600 font-bold flex items-center gap-0.5">
                              <Star className="w-2 h-2 fill-amber-400 text-amber-400" /> 4.8
                            </span>
                          </div>
                        </div>

                        {/* Product 2: Chocolate Cake */}
                        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-lg p-1.5 border border-slate-100 space-y-1 shadow-2xs transition">
                          <div className="w-full h-11 sm:h-12 overflow-hidden rounded bg-amber-50/50 flex items-center justify-center">
                            <img
                              src="/images/hero/productCake.png"
                              alt="Chocolate Cake"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-[8px] font-bold text-slate-900 truncate">Chocolate Cake</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-900">₹699</span>
                            <span className="text-[7px] text-amber-600 font-bold flex items-center gap-0.5">
                              <Star className="w-2 h-2 fill-amber-400 text-amber-400" /> 4.9
                            </span>
                          </div>
                        </div>

                        {/* Product 3: Artisanal Bread */}
                        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-lg p-1.5 border border-slate-100 space-y-1 shadow-2xs transition">
                          <div className="w-full h-11 sm:h-12 overflow-hidden rounded bg-amber-50/50 flex items-center justify-center">
                            <img
                              src="/images/hero/productBread.png"
                              alt="Artisanal Bread"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-[8px] font-bold text-slate-900 truncate">Artisanal Bread</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-900">₹180</span>
                            <span className="text-[7px] text-amber-600 font-bold flex items-center gap-0.5">
                              <Star className="w-2 h-2 fill-amber-400 text-amber-400" /> 4.7
                            </span>
                          </div>
                        </div>

                        {/* Product 4: Chocolate Cookies */}
                        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-lg p-1.5 border border-slate-100 space-y-1 shadow-2xs transition">
                          <div className="w-full h-11 sm:h-12 overflow-hidden rounded bg-amber-50/50 flex items-center justify-center">
                            <img
                              src="/images/hero/productCookies.png"
                              alt="Chocolate Cookies"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-[8px] font-bold text-slate-900 truncate">Chocolate Cookies</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-900">₹220</span>
                            <span className="text-[7px] text-amber-600 font-bold flex items-center gap-0.5">
                              <Star className="w-2 h-2 fill-amber-400 text-amber-400" /> 4.8
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Laptop Base Lip / Thick Lower Base with Metallic Edge */}
                  <div className="h-3 bg-gradient-to-r from-slate-700 via-slate-400 to-slate-700 rounded-b-xl mt-1.5 flex justify-center shadow-md">
                    <div className="w-20 h-1.5 bg-slate-950 rounded-b" />
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* LAYER 3 (FRONT RIGHT): Matching Mobile Storefront    */}
              {/* Proportions: 22-25% width, right: 2%, bottom: 4%     */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-phone-layer"
                className="absolute bottom-[4%] right-[2%] w-[23%] sm:w-[22%] md:w-[21%] lg:w-[22%] xl:w-[22%] max-w-[185px] z-30 shadow-[0_28px_55px_-10px_rgba(0,0,0,0.55)] rounded-[28px] p-1.5 bg-slate-950 border-2 border-slate-700/80 transition-transform duration-300 hover:scale-[1.02]"
              >
                {/* Phone Speaker / Dynamic Island */}
                <div className="flex items-center justify-center pb-1">
                  <div className="w-10 sm:w-12 h-2 bg-black rounded-full" />
                </div>

                {/* Mobile Storefront Screen */}
                <div className="w-full bg-white rounded-[20px] overflow-hidden border border-slate-200">
                  {/* Mobile Store Navbar */}
                  <div className="h-6 sm:h-7 bg-white border-b border-slate-100 px-2 flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-1.5 flex flex-col justify-between">
                        <span className="w-full h-0.5 bg-slate-700 rounded" />
                        <span className="w-full h-0.5 bg-slate-700 rounded" />
                      </div>
                      <div className="w-3.5 h-3.5 rounded bg-amber-500/15 border border-amber-300/50 flex items-center justify-center text-amber-600 shrink-0">
                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-amber-500 stroke-amber-700 stroke-[0.7]">
                          <path d="M18.06 6.88C17.5 4.09 15.02 2 12 2s-5.5 2.09-6.06 4.88C4.16 7.42 2.8 9.32 2.8 11.55c0 2.65 1.95 4.82 4.5 5.17V20c0 .55.45 1 1 1h7.4c.55 0 1-.45 1-1v-3.28c2.55-.35 4.5-2.52 4.5-5.17 0-2.23-1.36-4.13-3.14-4.67z" />
                        </svg>
                      </div>
                      <span className="font-extrabold text-[8px] sm:text-[9px] text-amber-950">Daily Bakehouse</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-slate-800" />
                      <span className="w-3 h-3 rounded-full bg-orange-500 text-white flex items-center justify-center text-[7px] font-bold">3</span>
                    </div>
                  </div>

                  {/* Mobile Store Banner */}
                  <div className="relative h-14 sm:h-16 bg-gradient-to-r from-[#FDF7F0] to-[#F5E6D3] overflow-hidden flex items-center p-2">
                    <div className="relative z-10 space-y-0.5 max-w-[90px]">
                      <h6 className="text-[7.5px] font-black text-amber-950 leading-tight">
                        Freshly Baked <br />
                        <span className="text-orange-600">Happiness</span>
                      </h6>
                      <button className="text-[6.5px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded shadow-2xs">
                        Shop →
                      </button>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[55%] h-full">
                      <img
                        src="/images/hero/bannerHero.png"
                        alt=""
                        className="w-full h-full object-cover object-left"
                      />
                    </div>
                  </div>

                  {/* Mobile Product Cards */}
                  <div className="p-1 sm:p-1.5 bg-slate-50 space-y-1">
                    <span className="text-[8px] font-bold text-slate-800 block">Best Sellers</span>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="bg-white rounded p-1 border border-slate-100 space-y-0.5 shadow-2xs">
                        <img
                          src="/images/hero/productCroissant.png"
                          alt="Butter Croissant"
                          className="w-full h-9 sm:h-10 object-cover rounded"
                        />
                        <div className="text-[7px] font-bold text-slate-900 truncate">Butter Croissant</div>
                        <div className="text-[7px] font-black text-slate-900">₹120</div>
                      </div>

                      <div className="bg-white rounded p-1 border border-slate-100 space-y-0.5 shadow-2xs">
                        <img
                          src="/images/hero/productCake.png"
                          alt="Chocolate Cake"
                          className="w-full h-9 sm:h-10 object-cover rounded"
                        />
                        <div className="text-[7px] font-bold text-slate-900 truncate">Chocolate Cake</div>
                        <div className="text-[7px] font-black text-slate-900">₹699</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone Bottom Home Bar */}
                <div className="h-1 flex justify-center items-center mt-1">
                  <div className="w-8 h-0.5 bg-slate-500 rounded-full" />
                </div>
              </div>

              {/* Annotation 2: Positioned safely to the top of phone, strictly outside laptop UI */}
              <div
                data-testid="hero-annot-device"
                className="hidden xl:flex flex-col items-center text-center absolute top-[22%] right-[2%] z-40 pointer-events-none"
              >
                <span className="text-[11px] font-bold text-slate-600 italic tracking-tight font-sans leading-tight bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs border border-slate-200/60">
                  {t('landing.heroAnnotationDevice')}
                </span>
                <svg className="w-5 h-7 text-orange-500 mt-0.5" viewBox="0 0 24 32" fill="none">
                  <path d="M12 2 C12 12, 15 20, 18 26" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" strokeLinecap="round" />
                  <path d="M11 23 L 18 27 L 21 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

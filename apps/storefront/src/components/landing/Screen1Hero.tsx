import React from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Link2,
  CreditCard,
  MessageCircle,
  Palette,
  Search,
  Bell,
  Star,
  ShoppingBag,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { LetZshopLogo } from './LetZshopLogo';
import { bakeryDemoData } from './bakeryDemoData';

interface Screen1HeroProps {
  sellerUrl: string;
}

export const Screen1Hero: React.FC<Screen1HeroProps> = ({ sellerUrl }) => {
  const { t, locale } = useLandingI18n();

  return (
    <section
      id="hero"
      className="relative min-h-[calc(100vh-68px)] flex items-center bg-white overflow-hidden border-b border-slate-100 py-6 md:py-8 lg:py-10"
    >
      {/* Subtle Atmospheric Wash */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 right-0 w-[650px] h-[550px] bg-blue-50/35 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-orange-50/25 rounded-full blur-3xl" />
      </div>

      <div className="w-[min(1600px,calc(100%-48px))] sm:w-[min(1600px,calc(100%-64px))] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] gap-8 lg:gap-8 xl:gap-12 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Narrative & CTAs (41-43% width)              */}
          {/* ======================================================== */}
          <div className="space-y-6 lg:pr-2 max-w-[620px]">
            
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wider shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>{t('landing.heroEyebrow')}</span>
            </div>

            {/* Headline with 2 distinct lines */}
            <h1 className="text-4xl sm:text-5xl lg:text-[clamp(48px,3.6vw,66px)] font-black text-slate-900 tracking-tight leading-[1.02]">
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
            <p className="text-base sm:text-lg lg:text-[20px] text-slate-600 leading-relaxed font-normal max-w-[600px]">
              {t('landing.heroSupporting')}
            </p>

            {/* Account Actions: ONLY TWO (Create Store & Merchant Login) */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href={`${sellerUrl}/login?mode=register`}
                  id="hero-cta-create-store"
                  className="h-13 sm:h-[56px] px-8 sm:px-9 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-orange-500/35 hover:shadow-orange-500/45 flex items-center justify-center gap-2.5 active:scale-[0.98]"
                >
                  <span>{t('landing.heroCtaPrimary')}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href={`${sellerUrl}/login`}
                  id="hero-cta-merchant-login"
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

            {/* 4 Benefits */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-[600px]">
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
          {/* RIGHT COLUMN: Contained HeroScene (57-59% width)          */}
          {/* ======================================================== */}
          <div className="relative w-full flex items-center justify-center lg:justify-end min-w-0">
            <div
              data-testid="hero-scene"
              className="heroScene relative w-full aspect-[1.25/1] min-h-[500px] sm:min-h-[560px] md:min-h-[600px] max-h-[660px] select-none"
            >
              
              {/* ---------------------------------------------------- */}
              {/* LAYER 1 (BACK): Merchant Dashboard Panel             */}
              {/* Proportions: ~78-80% width, top: 0, right: 0        */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-dashboard"
                className="absolute top-0 right-0 w-[78%] bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_45px_-10px_rgba(30,58,138,0.10)] overflow-hidden z-10"
              >
                {/* Dashboard Top Header Bar */}
                <div className="h-9 sm:h-10 border-b border-slate-100 px-3.5 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2.5">
                    <LetZshopLogo size="sm" iconOnly />
                    <span className="font-extrabold text-xs text-slate-800">LetZshop</span>
                    <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">/ dashboard</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-400 w-28 md:w-34">
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
                <div className="p-3 sm:p-3.5 grid grid-cols-12 gap-3 bg-white">
                  {/* Left Sidebar */}
                  <div className="hidden sm:block sm:col-span-3 space-y-1 text-[11px] font-semibold text-slate-500 border-r border-slate-100 pr-2">
                    <div className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-bold flex items-center gap-1">
                      <LayoutDashboard className="w-3 h-3" />
                      <span>Dashboard</span>
                    </div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Orders</div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Products</div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Customers</div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Marketing</div>
                    <div className="px-2 py-1 hover:bg-slate-50 rounded-md">Analytics</div>
                  </div>

                  {/* Main Metrics Area */}
                  <div className="col-span-12 sm:col-span-9 space-y-2.5 pl-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Overview</span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Last 30 days ▾</span>
                    </div>

                    {/* Metric Cards Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium block">Total Sales</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">₹1,24,580</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> ↑ 28%
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium block">Orders</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">243</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> ↑ 32%
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium block">Customers</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">1,921</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> ↑ 18%
                        </span>
                      </div>
                    </div>

                    {/* Mini Sales Growth Chart (Pure SVG) */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-700">Sales Growth</span>
                        <span className="inline-block text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 rounded ml-1.5">+32%</span>
                      </div>
                      <svg className="w-32 sm:w-40 h-7 text-blue-600" viewBox="0 0 150 32" fill="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 5,26 C 25,24 45,28 70,18 C 95,8 115,14 130,4 L 145,2 L 145,32 L 5,32 Z"
                          fill="url(#chartGrad)"
                        />
                        <path
                          d="M 5,26 C 25,24 45,28 70,18 C 95,8 115,14 130,4 L 145,2"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="130" cy="4" r="3" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* LAYER 2 (MIDDLE): Dominant Laptop Storefront Shell   */}
              {/* Proportions: ~91% width, left: 0, bottom: 4%        */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-laptop"
                className="absolute bottom-[4%] left-0 w-[91%] z-20"
              >
                {/* Contact Shadow Underneath Base */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[94%] h-8 bg-slate-950/30 blur-lg -z-10 rounded-full" />

                {/* Display Bezel Shell */}
                <div className="rounded-t-2xl bg-[#0B1220] p-2 sm:p-2.5 pb-0 border border-slate-750 shadow-[0_32px_75px_-18px_rgba(15,23,42,0.48),0_16px_36px_-10px_rgba(15,23,42,0.25)]">
                  
                  {/* Laptop Top Bezel Camera Dot */}
                  <div className="flex justify-center pb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900 ring-1 ring-slate-700/60" />
                  </div>

                  {/* Laptop Screen Area: Real DOM Storefront */}
                  <div className="bg-white rounded-t-lg overflow-hidden border border-slate-800 flex flex-col">
                    
                    {/* Storefront Navigation Bar */}
                    <div className="h-9 sm:h-10 bg-white border-b border-slate-100 px-3 sm:px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-6">
                        {/* Daily Bakehouse Brand Logo */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-300/50 flex items-center justify-center text-amber-600 shrink-0">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-amber-500 stroke-amber-700 stroke-[0.7]">
                              <path d="M18.06 6.88C17.5 4.09 15.02 2 12 2s-5.5 2.09-6.06 4.88C4.16 7.42 2.8 9.32 2.8 11.55c0 2.65 1.95 4.82 4.5 5.17V20c0 .55.45 1 1 1h7.4c.55 0 1-.45 1-1v-3.28c2.55-.35 4.5-2.52 4.5-5.17 0-2.23-1.36-4.13-3.14-4.67z" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-serif font-black text-xs sm:text-sm text-amber-950 tracking-tight leading-none">
                              {bakeryDemoData.storeName}
                            </span>
                            <span className="text-[7px] text-amber-700/80 font-sans tracking-tight">
                              {bakeryDemoData.storeTagline}
                            </span>
                          </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden sm:flex items-center gap-3 text-[10px] font-semibold text-slate-600">
                          {bakeryDemoData.navLinks.map((link, idx) => (
                            <span
                              key={link}
                              className={idx === 0 ? "text-orange-600 font-bold border-b-2 border-orange-500 pb-0.5" : "hover:text-slate-900"}
                            >
                              {link}
                            </span>
                          ))}
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

                    {/* Storefront Hero Banner with High-Resolution Photography */}
                    <div className="relative h-28 sm:h-34 md:h-36 bg-gradient-to-r from-[#FDF8F3] via-[#FAF1E6] to-[#F5E6D3] overflow-hidden flex items-center px-4 sm:px-6">
                      <div className="relative z-10 space-y-1 sm:space-y-1.5 max-w-[240px] sm:max-w-[280px]">
                        <h4 className="font-serif text-sm sm:text-lg font-black text-amber-950 leading-tight">
                          {bakeryDemoData.heroTitle} <br />
                          <span className="text-orange-600">{bakeryDemoData.heroHighlight}</span>
                        </h4>
                        <p className="text-[9px] sm:text-[10px] text-amber-900/80 leading-snug line-clamp-2">
                          {bakeryDemoData.heroDescription}
                        </p>
                        <button className="text-[9px] sm:text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md shadow-xs transition flex items-center gap-1">
                          <span>{bakeryDemoData.heroCta}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Right Hero Image (High-Resolution Artisanal Bakery Spread) */}
                      <div className="absolute right-0 top-0 bottom-0 w-[55%] h-full">
                        <Image
                          src={bakeryDemoData.heroBannerImage}
                          alt="Artisanal Bakery Spread"
                          fill
                          sizes="(max-width: 1024px) 50vw, 40vw"
                          priority
                          className="object-cover object-left"
                        />
                      </div>
                    </div>

                    {/* Storefront Best Sellers Row (4 Products from bakeryDemoData) */}
                    <div className="p-2 sm:p-2.5 bg-white border-t border-amber-100/50">
                      <div className="flex items-center justify-between pb-1.5">
                        <span className="text-[10px] font-black text-slate-900 tracking-tight">
                          {bakeryDemoData.bestSellersTitle}
                        </span>
                        <span className="text-[9px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer">View All →</span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {bakeryDemoData.products.map((prod) => (
                          <div
                            key={prod.id}
                            className="bg-slate-50/70 hover:bg-slate-50 rounded-lg p-1.5 border border-slate-100 space-y-1 shadow-2xs transition"
                          >
                            <div className="relative w-full h-11 sm:h-13 overflow-hidden rounded bg-amber-50/50 flex items-center justify-center">
                              <Image
                                src={prod.image}
                                alt={prod.name}
                                fill
                                sizes="(max-width: 1024px) 25vw, 15vw"
                                className="object-cover"
                              />
                            </div>
                            <div className="text-[8px] sm:text-[9px] font-bold text-slate-900 truncate">{prod.name}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] sm:text-[9px] font-black text-slate-900">₹{prod.price}</span>
                              <span className="text-[7px] text-amber-600 font-bold flex items-center gap-0.5">
                                <Star className="w-2 h-2 fill-amber-400 text-amber-400" /> {prod.rating}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Laptop Base Lip with Metallic Edge */}
                  <div className="h-3 bg-gradient-to-r from-slate-700 via-slate-400 to-slate-700 rounded-b-xl mt-1.5 flex justify-center shadow-md">
                    <div className="w-20 h-1.5 bg-slate-950 rounded-b" />
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* LAYER 3 (FRONT RIGHT): Matching Mobile Storefront    */}
              {/* Proportions: ~23% width, right: 0, bottom: 2%        */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-phone"
                className="absolute bottom-[2%] right-0 w-[23%] sm:w-[22%] max-w-[190px] z-30 shadow-[0_28px_55px_-10px_rgba(0,0,0,0.55)] rounded-[28px] p-1.5 bg-[#0B1220] border-2 border-slate-700/80 transition-transform hover:scale-[1.02]"
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
                  <div className="relative h-14 sm:h-16 bg-gradient-to-r from-[#FDF8F3] to-[#F5E6D3] overflow-hidden flex items-center p-2">
                    <div className="relative z-10 space-y-0.5 max-w-[85px]">
                      <h6 className="text-[7.5px] font-black text-amber-950 leading-tight">
                        Freshly Baked <br />
                        <span className="text-orange-600">Happiness</span>
                      </h6>
                      <button className="text-[6.5px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded shadow-2xs">
                        Shop →
                      </button>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[55%] h-full">
                      <Image
                        src={bakeryDemoData.heroBannerImage}
                        alt=""
                        fill
                        sizes="20vw"
                        className="object-cover object-left"
                      />
                    </div>
                  </div>

                  {/* Mobile Product Cards (2 Items from bakeryDemoData) */}
                  <div className="p-1 sm:p-1.5 bg-slate-50 space-y-1">
                    <span className="text-[8px] font-bold text-slate-800 block">Best Sellers</span>
                    <div className="grid grid-cols-2 gap-1">
                      {bakeryDemoData.products.slice(0, 2).map((prod) => (
                        <div key={prod.id} className="bg-white rounded p-1 border border-slate-100 space-y-0.5 shadow-2xs">
                          <div className="relative w-full h-8 sm:h-9 rounded overflow-hidden">
                            <Image
                              src={prod.image}
                              alt={prod.name}
                              fill
                              sizes="15vw"
                              className="object-cover"
                            />
                          </div>
                          <div className="text-[7px] font-bold text-slate-900 truncate">{prod.name}</div>
                          <div className="text-[7px] font-black text-slate-900">₹{prod.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phone Bottom Home Bar */}
                <div className="h-1 flex justify-center items-center mt-1">
                  <div className="w-8 h-0.5 bg-slate-500 rounded-full" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

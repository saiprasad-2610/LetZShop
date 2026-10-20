import React from 'react';
import { ArrowRight, Link2, CreditCard, MessageCircle, Palette, TrendingUp, ShoppingBag, Search, Bell, Sparkles } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { LetZshopLogo } from './LetZshopLogo';

interface Screen1HeroProps {
  sellerUrl: string;
}

export const Screen1Hero: React.FC<Screen1HeroProps> = ({ sellerUrl }) => {
  const { t, locale } = useLandingI18n();

  return (
    <section id="hero" className="relative pt-6 pb-16 md:pt-10 md:pb-24 px-4 sm:px-6 lg:px-8 bg-[#FCFCFA] overflow-hidden border-b border-slate-100">
      {/* ======================================================== */}
      {/* ATMOSPHERIC BACKGROUND & LIGHTING                        */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft Sunlight Beam / Amber Radiance (Upper Left) */}
        <div className="absolute -top-32 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-amber-100/40 via-orange-50/25 to-transparent rounded-full blur-3xl" />
        
        {/* Cool Atmospheric Sky Blue Radiance (Upper Right behind Dashboard) */}
        <div className="absolute -top-24 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-blue-100/50 via-indigo-50/20 to-transparent rounded-full blur-3xl" />
        
        {/* Warm Orange Glow (Lower Right Corner) */}
        <div className="absolute bottom-0 right-10 w-[550px] h-[450px] bg-gradient-to-tl from-orange-100/35 via-amber-50/15 to-transparent rounded-full blur-3xl" />

        {/* Realistic Desk Surface Table Plane across right side */}
        <div className="hidden lg:block absolute bottom-0 right-0 w-[62%] h-44 bg-gradient-to-t from-stone-200/50 via-stone-100/25 to-transparent border-t border-stone-200/40" />
      </div>

      <div className="max-w-[1480px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Narrative & CTAs (~45% width)               */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6 lg:pr-2">
            
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wider shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>{t('landing.heroEyebrow')}</span>
            </div>

            {/* Headline with 2 distinct lines matching Reference 3 */}
            <h1 className="text-4xl sm:text-5xl lg:text-[46px] xl:text-[54px] 2xl:text-[60px] font-black text-slate-900 tracking-tight leading-[1.02]">
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
            <p className="text-base sm:text-lg lg:text-[18px] text-slate-600 leading-relaxed font-normal max-w-[560px]">
              {t('landing.heroSupporting')}
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href={`${sellerUrl}/login?mode=register`}
                  className="h-14 sm:h-[58px] px-8 sm:px-9 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-orange-500/35 hover:shadow-orange-500/45 flex items-center justify-center gap-2.5 active:scale-[0.98]"
                >
                  <span>{t('landing.heroCtaPrimary')}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href={`${sellerUrl}/login`}
                  className="h-14 sm:h-[58px] px-8 rounded-full bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border-2 border-slate-300/90 font-bold text-sm tracking-wide transition shadow-xs hover:shadow flex items-center justify-center gap-2 active:scale-[0.98]"
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
            <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-3">
              {/* 1. Branded storefront */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-xl bg-white/70 hover:bg-white transition border border-slate-100 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs border border-blue-100/70">
                  <Link2 className="w-5 h-5 -rotate-45" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageStorefront')}
                </span>
              </div>

              {/* 2. UPI & Razorpay */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-xl bg-white/70 hover:bg-white transition border border-slate-100 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs border border-orange-100/70">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantagePayments')}
                </span>
              </div>

              {/* 3. WhatsApp commerce */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-xl bg-white/70 hover:bg-white transition border border-slate-100 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-100/70">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageWhatsapp')}
                </span>
              </div>

              {/* 4. Custom storefront */}
              <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-xl bg-white/70 hover:bg-white transition border border-slate-100 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs border border-purple-100/70">
                  <Palette className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {t('landing.advantageCustom')}
                </span>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Contained HeroCommerceScene (~56% width)   */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 xl:col-span-7 relative mt-8 lg:mt-0 flex items-center justify-center lg:justify-end">
            <div
              data-testid="hero-commerce-scene"
              className="hero-scene relative w-full max-w-[850px] aspect-[1.25/1] min-h-[500px] sm:min-h-[560px] md:min-h-[600px] select-none"
            >
              
              {/* ---------------------------------------------------- */}
              {/* AMBIENT SCENE BACKGROUND                             */}
              {/* ---------------------------------------------------- */}
              {/* Indoor Plant Leaves (Background behind laptop) */}
              <div className="hidden lg:block absolute top-2 left-6 w-36 h-40 pointer-events-none -z-0 opacity-40">
                <svg viewBox="0 0 160 160" className="w-full h-full text-emerald-700/60" fill="currentColor">
                  <path d="M40 140 Q 60 70 120 20" stroke="#047857" strokeWidth="3" fill="none" />
                  <ellipse cx="65" cy="85" rx="22" ry="34" transform="rotate(-35 65 85)" fill="#059669" opacity="0.75" />
                  <ellipse cx="95" cy="55" rx="20" ry="30" transform="rotate(25 95 55)" fill="#10B981" opacity="0.7" />
                  <ellipse cx="115" cy="25" rx="16" ry="24" transform="rotate(-15 115 25)" fill="#34D399" opacity="0.8" />
                  <ellipse cx="45" cy="115" rx="20" ry="28" transform="rotate(-45 45 115)" fill="#047857" opacity="0.75" />
                </svg>
              </div>

              {/* Table Desk Plane across lower scene */}
              <div className="hidden sm:block absolute bottom-2 inset-x-0 h-36 bg-gradient-to-t from-stone-200/50 via-stone-100/25 to-transparent border-t border-stone-200/40 pointer-events-none rounded-xl" />

              {/* ---------------------------------------------------- */}
              {/* LAYER 1 (BACK): Merchant Dashboard Panel             */}
              {/* Proportions: 78-82% width, top: 3%, right: 1%        */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-dashboard-layer"
                className="absolute top-[3%] right-[1%] w-[80%] bg-white rounded-2xl border border-blue-100 shadow-[0_20px_45px_-10px_rgba(30,58,138,0.12)] overflow-hidden z-10 transition-all"
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

              {/* Annotation 1: Pointing to Dashboard (Inside scene bounds) */}
              <div
                data-testid="hero-annot-dash"
                className="hidden sm:flex items-center gap-1.5 absolute top-[0%] left-[6%] sm:left-[10%] z-20 pointer-events-none"
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
              {/* Proportions: 88-92% width, left: 2%, top: 36%        */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-laptop-layer"
                className="absolute top-[36%] left-[2%] w-[90%] z-20 transition-transform duration-300"
              >
                {/* Contact Shadow Underneath Laptop */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[92%] h-7 bg-slate-900/35 blur-xl -z-10 rounded-full" />

                {/* Laptop Outer Bezel */}
                <div className="rounded-t-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-2.5 pb-0 border border-slate-700/80 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.38),0_15px_30px_-10px_rgba(15,23,42,0.25)]">
                  
                  {/* Laptop Top Bezel Camera Dot */}
                  <div className="flex justify-center pb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 ring-1 ring-slate-600/50" />
                  </div>

                  {/* Laptop Screen Area: The Live Storefront */}
                  <div
                    data-testid="hero-storefront-screen"
                    className="bg-white rounded-t-lg overflow-hidden border border-slate-800"
                  >
                    
                    {/* Storefront Navigation Bar */}
                    <div
                      data-testid="hero-storefront-nav"
                      className="h-9 bg-white border-b border-slate-100 px-3 sm:px-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 sm:gap-6">
                        <span className="font-serif font-black text-xs sm:text-sm text-slate-900 tracking-tight">
                          Everyday Goods
                        </span>
                        <div className="hidden sm:flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                          <span className="text-orange-600 font-bold">Home</span>
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
                  <div className="h-2.5 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 rounded-b-lg mt-1.5 flex justify-center">
                    <div className="w-16 h-1 bg-slate-900 rounded-b" />
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* LAYER 3 (FRONT RIGHT): Matching Mobile Storefront    */}
              {/* Proportions: 22-25% width, right: 2%, bottom: 5%     */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="hero-phone-layer"
                className="absolute bottom-[5%] right-[2%] w-[23%] sm:w-[22%] md:w-[21%] lg:w-[22%] xl:w-[22%] max-w-[185px] z-30 shadow-[0_28px_55px_-10px_rgba(0,0,0,0.55)] rounded-[28px] p-1.5 bg-slate-950 border-2 border-slate-700/80 transition-transform duration-300 hover:scale-[1.02]"
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
                      <span className="font-extrabold text-[8px] sm:text-[9px] text-slate-900">Everyday</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-slate-800" />
                      <span className="w-3 h-3 rounded-full bg-orange-500 text-white flex items-center justify-center text-[7px] font-bold">3</span>
                    </div>
                  </div>

                  {/* Mobile Store Banner */}
                  <div className="relative h-14 sm:h-16 bg-stone-900 overflow-hidden flex items-center p-2">
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
                  <div className="p-1 sm:p-1.5 bg-slate-50 space-y-1">
                    <span className="text-[8px] font-bold text-slate-800 block">Best Sellers</span>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="bg-white rounded p-1 border border-slate-100 space-y-0.5">
                        <img
                          src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80"
                          alt="Diffuser"
                          className="w-full h-9 sm:h-10 object-cover rounded"
                        />
                        <div className="text-[7px] font-bold text-slate-800 truncate">Diffuser</div>
                        <div className="text-[7px] font-black text-slate-900">₹1,290</div>
                      </div>

                      <div className="bg-white rounded p-1 border border-slate-100 space-y-0.5">
                        <img
                          src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80"
                          alt="Dripper"
                          className="w-full h-9 sm:h-10 object-cover rounded"
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

              {/* Annotation 2: Positioned safely to the top of phone, strictly outside laptop UI */}
              <div
                data-testid="hero-annot-device"
                className="hidden xl:flex flex-col items-center text-center absolute top-[23%] right-[2%] z-40 pointer-events-none"
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

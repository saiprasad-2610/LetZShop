import React from 'react';
import {
  Layers,
  Package,
  ShoppingBag,
  CreditCard,
  Truck,
  Users,
  Star,
  Search,
  Bell,
} from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { LetZshopLogo } from './LetZshopLogo';

export const Screen3System: React.FC = () => {
  const { t } = useLandingI18n();

  const capabilities = [
    {
      id: 'catalog',
      title: t('landing.capCatalog'),
      desc: t('landing.capCatalogDesc'),
      icon: Package,
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'orders',
      title: t('landing.capOrders'),
      desc: t('landing.capOrdersDesc'),
      icon: ShoppingBag,
      badgeColor: 'text-[#FF6B00] bg-orange-50 border-orange-200',
    },
    {
      id: 'payments',
      title: t('landing.capPayments'),
      desc: t('landing.capPaymentsDesc'),
      icon: CreditCard,
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      id: 'shipping',
      title: t('landing.capShipping'),
      desc: t('landing.capShippingDesc'),
      icon: Truck,
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      id: 'customers',
      title: t('landing.capCustomers'),
      desc: t('landing.capCustomersDesc'),
      icon: Users,
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'reviews',
      title: t('landing.capReviews'),
      desc: t('landing.capReviewsDesc'),
      icon: Star,
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    },
  ];

  return (
    <section
      id="features"
      className="screen3 relative bg-[#FAFBFC] border-b border-slate-100 overflow-hidden py-10 lg:py-12 scroll-mt-16"
    >
      <div className="screen3Inner max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-12 space-y-7">
        
        {/* ======================================================== */}
        {/* MAIN TWO-COLUMN COMPOSITION: Left Copy (~35%) + Right Scene (~65%) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] items-center gap-6 xl:gap-8">
          
          {/* ------------------------------------------------------ */}
          {/* LEFT CONTENT (Vertically Centered with Scene)           */}
          {/* ------------------------------------------------------ */}
          <div
            data-testid="screen3-copy"
            className="screen3Copy w-full max-w-[460px] mx-auto lg:mx-0 text-center lg:text-left space-y-3.5"
          >
            {/* Small Pill: ONE SYSTEM */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-orange-200/80 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-slate-800" />
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-800">
                {t('landing.systemPill')}
              </span>
            </div>

            {/* Headline: One Store. One System. */}
            <h2 className="text-[38px] sm:text-[46px] lg:text-[52px] xl:text-[60px] font-black tracking-tight leading-[0.96]">
              <span className="block text-[#0B1528]">{t('landing.systemTitlePart1')}</span>
              <span className="block text-[#FF6B00]">{t('landing.systemTitlePart2')}</span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-[17px] lg:text-[18px] text-slate-500 font-normal leading-relaxed max-w-[420px]">
              {t('landing.systemSupporting')}
            </p>
          </div>

          {/* ------------------------------------------------------ */}
          {/* RIGHT-SIDE SYSTEM SCENE (~1000px width, 575px height)   */}
          {/* ------------------------------------------------------ */}
          <div className="w-full flex justify-center items-center overflow-visible">
            
            {/* DESKTOP / TABLET SCENE (>= 768px): Symmetrical 1000px */}
            <div className="sceneWrapper hidden md:block relative shrink-0">
              <div
                data-testid="system-scene"
                className="systemScene relative w-[1000px] h-[575px] select-none"
              >
                <style jsx>{`
                  :global(.sceneWrapper) {
                    --scene-scale: 1;
                    width: calc(1000px * var(--scene-scale));
                    height: calc(575px * var(--scene-scale));
                  }
                  :global(.systemScene) {
                    transform: scale(var(--scene-scale));
                    transform-origin: top left;
                  }
                  @media (min-width: 1600px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 1;
                    }
                  }
                  @media (min-width: 1400px) and (max-width: 1599px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.90;
                    }
                  }
                  @media (min-width: 1100px) and (max-width: 1399px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.76;
                    }
                  }
                  @media (min-width: 768px) and (max-width: 1099px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.62;
                    }
                  }
                `}</style>
              {/* Soft Ambient Depth Washes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[380px] bg-gradient-to-tr from-orange-100/25 via-sky-50/20 to-blue-100/25 rounded-[100px] blur-3xl pointer-events-none z-0" />
              <div className="absolute top-4 left-6 w-48 h-48 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none z-0" />
              <div className="absolute top-4 right-6 w-48 h-48 bg-purple-100/20 rounded-full blur-3xl pointer-events-none z-0" />
              <div className="absolute bottom-6 right-6 w-48 h-48 bg-amber-100/20 rounded-full blur-3xl pointer-events-none z-0" />

              {/* ================================================== */}
              {/* SVG SUBTLE CONNECTOR NETWORK (z-10, behind cards)  */}
              {/* ================================================== */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 1000 575"
                preserveAspectRatio="none"
                fill="none"
              >
                {/* Products (upper-left) -> Dashboard */}
                <path
                  d="M 180 190 C 210 205 235 215 258 225"
                  stroke="#FF6B00"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />

                {/* Orders (upper-center) -> Dashboard */}
                <path
                  d="M 500 190 L 500 206"
                  stroke="#FF6B00"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />

                {/* Payments (upper-right) -> Dashboard */}
                <path
                  d="M 825 165 C 795 185 765 205 742 225"
                  stroke="#FF6B00"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />

                {/* Customers (left) -> Dashboard */}
                <path
                  d="M 262 345 L 248 345"
                  stroke="#FF6B00"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />

                {/* Shipping (right-upper) -> Dashboard */}
                <path
                  d="M 738 265 L 752 265"
                  stroke="#FF6B00"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />

                {/* Reviews (right-lower) -> Dashboard */}
                <path
                  d="M 738 420 L 752 420"
                  stroke="#FF6B00"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />
              </svg>

              {/* Small Connector Nodes with clean icons */}
              <div className="absolute top-[198px] left-[225px] w-5 h-5 rounded-full bg-white border border-emerald-300 shadow-2xs flex items-center justify-center text-emerald-600 z-15 pointer-events-none">
                <Package className="w-2.5 h-2.5" />
              </div>
              <div className="absolute top-[192px] left-[490px] w-5 h-5 rounded-full bg-white border border-orange-300 shadow-2xs flex items-center justify-center text-[#FF6B00] z-15 pointer-events-none">
                <ShoppingBag className="w-2.5 h-2.5" />
              </div>
              <div className="absolute top-[182px] left-[758px] w-5 h-5 rounded-full bg-white border border-purple-300 shadow-2xs flex items-center justify-center text-purple-600 z-15 pointer-events-none">
                <CreditCard className="w-2.5 h-2.5" />
              </div>
              <div className="absolute top-[340px] left-[242px] w-5 h-5 rounded-full bg-white border border-indigo-300 shadow-2xs flex items-center justify-center text-indigo-600 z-15 pointer-events-none">
                <Users className="w-2.5 h-2.5" />
              </div>
              <div className="absolute top-[255px] left-[742px] w-5 h-5 rounded-full bg-white border border-blue-300 shadow-2xs flex items-center justify-center text-blue-600 z-15 pointer-events-none">
                <Truck className="w-2.5 h-2.5" />
              </div>
              <div className="absolute top-[410px] left-[742px] w-5 h-5 rounded-full bg-white border border-amber-300 shadow-2xs flex items-center justify-center text-amber-600 z-15 pointer-events-none">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              </div>

              {/* ================================================== */}
              {/* 1. CENTRAL LETZSHOP DASHBOARD (Main Visual Anchor)  */}
              {/* Centered at left-1/2, 510px wide, 100% unobstructed */}
              {/* ================================================== */}
              <div
                data-testid="system-dashboard"
                className="absolute top-[206px] left-1/2 -translate-x-1/2 w-[510px] z-20 pointer-events-none"
              >
                {/* Laptop / Monitor Dark Bezel Frame */}
                <div className="bg-slate-900 p-2 sm:p-2.5 rounded-2xl shadow-[0_20px_50px_-12px_rgba(15,23,42,0.28)] border border-slate-800">
                  
                  {/* Camera Dot */}
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mx-auto mb-1" />

                  {/* Inner Screen Display (Crisp HTML UI) */}
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
                    
                    {/* Header Bar */}
                    <div className="h-8 bg-slate-50 border-b border-slate-100 px-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <LetZshopLogo size="sm" iconOnly />
                        <span className="font-extrabold text-[11px] text-slate-800 tracking-tight">LetZshop</span>
                        <span className="text-[9px] font-mono text-slate-400">/ dashboard</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded text-[8.5px] text-slate-400 w-28">
                          <Search className="w-2.5 h-2.5 text-slate-400" />
                          <span className="truncate">Search products...</span>
                        </div>
                        <div className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                          <Bell className="w-2.5 h-2.5" />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white font-bold text-[8px] flex items-center justify-center">
                            S
                          </div>
                          <span className="text-[8.5px] font-bold text-slate-700">Store ▾</span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Body (Sidebar + Main Content) */}
                    <div className="p-2.5 grid grid-cols-12 gap-2.5 bg-white">
                      
                      {/* Left Mini Sidebar */}
                      <div className="col-span-3 space-y-0.5 text-[8.5px] font-semibold text-slate-500 border-r border-slate-100 pr-1">
                        <div className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold flex items-center gap-1">
                          <span>Dashboard</span>
                        </div>
                        <div className="px-1.5 py-0.5 hover:bg-slate-50 rounded">Orders</div>
                        <div className="px-1.5 py-0.5 hover:bg-slate-50 rounded">Products</div>
                        <div className="px-1.5 py-0.5 hover:bg-slate-50 rounded">Customers</div>
                        <div className="px-1.5 py-0.5 hover:bg-slate-50 rounded">Payments</div>
                        <div className="px-1.5 py-0.5 hover:bg-slate-50 rounded">Shipping</div>
                        <div className="px-1.5 py-0.5 hover:bg-slate-50 rounded">Reviews</div>
                        <div className="px-1.5 py-0.5 hover:bg-slate-50 rounded">Marketing</div>
                        <div className="px-1.5 py-0.5 hover:bg-slate-50 rounded">Analytics</div>
                      </div>

                      {/* Main Metrics Area */}
                      <div className="col-span-9 space-y-2">
                        <div className="flex items-center justify-between pb-0.5">
                          <span className="text-[10px] font-black text-slate-800">Overview</span>
                          <span className="text-[7.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ● Live Sync Active
                          </span>
                        </div>

                        {/* 4 KPI Cards */}
                        <div className="grid grid-cols-4 gap-1.5">
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[7px] text-slate-400 block font-medium">Total Sales</span>
                            <span className="text-[10px] font-black text-slate-900 block leading-tight">₹1,24,580</span>
                            <span className="text-[7px] font-bold text-emerald-600 flex items-center gap-0.5">
                              ↑ 28%
                            </span>
                          </div>
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[7px] text-slate-400 block font-medium">Orders</span>
                            <span className="text-[10px] font-black text-slate-900 block leading-tight">243</span>
                            <span className="text-[7px] font-bold text-emerald-600 flex items-center gap-0.5">
                              ↑ 32%
                            </span>
                          </div>
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[7px] text-slate-400 block font-medium">Customers</span>
                            <span className="text-[10px] font-black text-slate-900 block leading-tight">1,921</span>
                            <span className="text-[7px] font-bold text-emerald-600 flex items-center gap-0.5">
                              ↑ 18%
                            </span>
                          </div>
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[7px] text-slate-400 block font-medium">{t('landing.systemAvgRating')}</span>
                            <span className="text-[10px] font-black text-slate-900 block leading-tight flex items-center gap-0.5">
                              4.8 <Star className="w-2 h-2 fill-amber-400 text-amber-400 inline" />
                            </span>
                            <span className="text-[7px] font-bold text-amber-600">★ 98%</span>
                          </div>
                        </div>

                        {/* Sales & Orders Chart */}
                        <div className="p-1.5 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between text-[7.5px]">
                            <span className="font-bold text-slate-700">Sales & Orders</span>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 font-semibold text-blue-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" /> Sales
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-[#FF6B00]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] inline-block" /> Orders
                              </span>
                            </div>
                          </div>

                          {/* Dual-Line Illustrative SVG Chart */}
                          <svg className="w-full h-11" viewBox="0 0 320 50" fill="none">
                            <defs>
                              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.20" />
                                <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            <line x1="0" y1="12" x2="320" y2="12" stroke="#E2E8F0" strokeWidth="0.7" strokeDasharray="3 3" />
                            <line x1="0" y1="30" x2="320" y2="30" stroke="#E2E8F0" strokeWidth="0.7" strokeDasharray="3 3" />

                            {/* Sales Area & Line (Blue) */}
                            <path
                              d="M 5,42 C 45,38 80,32 120,20 C 160,10 210,22 250,12 C 280,5 300,8 315,4 L 315,48 L 5,48 Z"
                              fill="url(#salesGrad)"
                            />
                            <path
                              d="M 5,42 C 45,38 80,32 120,20 C 160,10 210,22 250,12 C 280,5 300,8 315,4"
                              stroke="#2563EB"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <circle cx="315" cy="4" r="2" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1" />

                            {/* Orders Area & Line (Orange) */}
                            <path
                              d="M 5,45 C 50,42 90,38 130,28 C 170,20 215,30 260,18 C 285,14 305,16 315,10 L 315,48 L 5,48 Z"
                              fill="url(#ordersGrad)"
                            />
                            <path
                              d="M 5,45 C 50,42 90,38 130,28 C 170,20 215,30 260,18 C 285,14 305,16 315,10"
                              stroke="#FF6B00"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                            <circle cx="315" cy="10" r="2" fill="#FF6B00" stroke="#FFFFFF" strokeWidth="1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laptop Stand Base */}
                <div className="w-16 h-1.5 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b mx-auto shadow-xs" />
                <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto shadow-xs" />
              </div>

              {/* ================================================== */}
              {/* TOP ROW: PRODUCTS, ORDERS, PAYMENTS                 */}
              {/* Symmetrical alignment, top edges at top-[10px]      */}
              {/* ================================================== */}

              {/* 2. CARD: PRODUCTS (Upper-Left: left 15px, top 10px) */}
              <div
                data-testid="card-products"
                className="absolute top-[10px] left-[15px] w-[290px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1 z-30 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5.5 h-5.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <Package className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-[11px]">
                        {t('landing.systemCardProducts')}
                      </h4>
                      <p className="text-[7.5px] text-slate-400">4 Active Items</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Catalog
                  </span>
                </div>

                {/* 4 Clean Neutral Product Representations (SVG/CSS) */}
                <div className="space-y-0.5 text-[8.5px]">
                  {/* Product 1: Perfume */}
                  <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="6" y="8" width="12" height="13" rx="2" />
                          <path d="M10 8V5h4v3" />
                          <circle cx="12" cy="14" r="2" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate leading-tight">Artisan Perfume (50ml)</span>
                        <span className="text-[7px] text-amber-600 font-semibold flex items-center gap-0.5">
                          <Star className="w-1.5 h-1.5 fill-amber-400 text-amber-400 inline" /> 4.8 (124)
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-[9.5px] shrink-0">₹1,299</span>
                  </div>

                  {/* Product 2: Coffee */}
                  <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-orange-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                          <line x1="6" y1="1" x2="6" y2="4" />
                          <line x1="10" y1="1" x2="10" y2="4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate leading-tight">Arabica Roast Coffee</span>
                        <span className="text-[7px] text-amber-600 font-semibold flex items-center gap-0.5">
                          <Star className="w-1.5 h-1.5 fill-amber-400 text-amber-400 inline" /> 4.7 (89)
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-[9.5px] shrink-0">₹899</span>
                  </div>

                  {/* Product 3: Vitamin C */}
                  <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m14 4 4 4" />
                          <path d="m10.5 7.5 6 6" />
                          <path d="M17.5 10.5 8 20l-5-1 1-5 9.5-9.5" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate leading-tight">Vitamin C Serum (30ml)</span>
                        <span className="text-[7px] text-amber-600 font-semibold flex items-center gap-0.5">
                          <Star className="w-1.5 h-1.5 fill-amber-400 text-amber-400 inline" /> 4.9 (210)
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-[9.5px] shrink-0">₹749</span>
                  </div>

                  {/* Product 4: Night Care */}
                  <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="10" width="18" height="11" rx="2" />
                          <path d="M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate leading-tight">Botanical Night Care</span>
                        <span className="text-[7px] text-amber-600 font-semibold flex items-center gap-0.5">
                          <Star className="w-1.5 h-1.5 fill-amber-400 text-amber-400 inline" /> 4.8 (156)
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-[9.5px] shrink-0">₹1,499</span>
                  </div>
                </div>
              </div>

              {/* 3. CARD: ORDERS (Upper-Center: centered at left-1/2, top 10px) */}
              <div
                data-testid="card-orders"
                className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[290px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1 z-30 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5.5 h-5.5 rounded-lg bg-orange-50 border border-orange-200 text-[#FF6B00] flex items-center justify-center">
                      <ShoppingBag className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-[11px]">
                        {t('landing.systemCardOrders')}
                      </h4>
                      <p className="text-[7.5px] text-slate-400">Live Fulfillment Flow</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    4 Active
                  </span>
                </div>

                {/* 4 Orders Rows with status pills */}
                <div className="space-y-0.5 text-[8.5px]">
                  <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[7.5px] text-slate-400 block leading-none">#LZ789456</span>
                      <span className="font-bold text-slate-800 leading-tight">Priya Mehta</span>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <span className="font-black text-slate-900 text-[9.5px]">₹1,299</span>
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Packed
                      </span>
                    </div>
                  </div>

                  <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[7.5px] text-slate-400 block leading-none">#LZ789455</span>
                      <span className="font-bold text-slate-800 leading-tight">Rohit Sharma</span>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <span className="font-black text-slate-900 text-[9.5px]">₹2,499</span>
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Shipped
                      </span>
                    </div>
                  </div>

                  <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[7.5px] text-slate-400 block leading-none">#LZ789454</span>
                      <span className="font-bold text-slate-800 leading-tight">Sneha Kapoor</span>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <span className="font-black text-slate-900 text-[9.5px]">₹899</span>
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Delivered
                      </span>
                    </div>
                  </div>

                  <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[7.5px] text-slate-400 block leading-none">#LZ789453</span>
                      <span className="font-bold text-slate-800 leading-tight">Arjun Verma</span>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <span className="font-black text-slate-900 text-[9.5px]">₹1,749</span>
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Processing
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. CARD: PAYMENTS (Upper-Right: right 15px, top 10px) */}
              <div
                data-testid="card-payments"
                className="absolute top-[10px] right-[15px] w-[285px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1.5 z-30 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5.5 h-5.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                      <CreditCard className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-[11px]">
                        {t('landing.systemCardPayments')}
                      </h4>
                      <p className="text-[7.5px] text-slate-400">Direct Settlements</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Daily Payout
                  </span>
                </div>

                <div className="p-1 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[7.5px] text-slate-400 block">{t('landing.systemTotalReceived')}</span>
                  <div className="text-sm font-black text-slate-900 tracking-tight leading-tight">₹1,24,580</div>
                </div>

                {/* Methods */}
                <div className="grid grid-cols-2 gap-1 text-[8px]">
                  <div className="p-1 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800">UPI</span>
                    <span className="text-[7px] font-mono text-emerald-600 font-bold">54%</span>
                  </div>
                  <div className="p-1 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Razorpay</span>
                    <span className="text-[7px] font-mono text-blue-600 font-bold">26%</span>
                  </div>
                  <div className="p-1 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Cards</span>
                    <span className="text-[7px] font-mono text-purple-600 font-bold">12%</span>
                  </div>
                  <div className="p-1 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800">COD</span>
                    <span className="text-[7px] font-mono text-amber-600 font-bold">8%</span>
                  </div>
                </div>
              </div>

              {/* ================================================== */}
              {/* SATELLITE CARDS: CUSTOMERS, SHIPPING, REVIEWS      */}
              {/* ================================================== */}

              {/* 5. CARD: CUSTOMERS (Satellite attached to left bezel) */}
              <div
                data-testid="card-customers"
                className="absolute top-[260px] left-[12px] w-[250px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1.5 z-30 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5.5 h-5.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                      <Users className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-[11px]">
                        {t('landing.systemCardCustomers')}
                      </h4>
                      <p className="text-[7.5px] text-slate-400">Buyer Directory</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    1,921 Total
                  </span>
                </div>

                {/* 4 Customer rows with initials in colored circles */}
                <div className="space-y-1 text-[8.5px]">
                  <div className="p-1 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[7.5px] flex items-center justify-center">
                        PM
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block leading-tight">Priya Mehta</span>
                        <span className="text-[7px] text-slate-400">12 orders</span>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      VIP
                    </span>
                  </div>

                  <div className="p-1 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[7.5px] flex items-center justify-center">
                        RS
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block leading-tight">Rohit Sharma</span>
                        <span className="text-[7px] text-slate-400">5 orders</span>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Regular
                    </span>
                  </div>

                  <div className="p-1 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold text-[7.5px] flex items-center justify-center">
                        SK
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block leading-tight">Sneha Kapoor</span>
                        <span className="text-[7px] text-slate-400">8 orders</span>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      VIP
                    </span>
                  </div>

                  <div className="p-1 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[7.5px] flex items-center justify-center">
                        AV
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block leading-tight">Arjun Verma</span>
                        <span className="text-[7px] text-slate-400">3 orders</span>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      New
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. CARD: SHIPPING (Satellite attached to right bezel) */}
              <div
                data-testid="card-shipping"
                className="absolute top-[205px] right-[12px] w-[250px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1.5 z-30 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5.5 h-5.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                      <Truck className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-[11px]">
                        {t('landing.systemCardShipping')}
                      </h4>
                      <p className="text-[7.5px] text-slate-400">Live Parcel Timeline</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Live Tracking
                  </span>
                </div>

                {/* Shipment Timeline */}
                <div className="p-1 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[7.5px] font-mono text-slate-400">
                    <span>LZ-904128</span>
                    <span className="text-blue-600 font-bold">Express Transit</span>
                  </div>

                  <div className="grid grid-cols-4 gap-0.5 text-center relative pt-0.5">
                    {/* Progress Bar Line */}
                    <div className="absolute top-[10px] left-[12%] right-[12%] h-0.5 bg-slate-200 z-0">
                      <div className="h-full bg-emerald-500 w-[66%]" />
                    </div>

                    <div className="relative z-10 space-y-0.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-[7.5px] shadow-2xs">
                        ✓
                      </div>
                      <span className="text-[6.5px] font-bold text-slate-700 block">Ordered</span>
                    </div>

                    <div className="relative z-10 space-y-0.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-[7.5px] shadow-2xs">
                        ✓
                      </div>
                      <span className="text-[6.5px] font-bold text-slate-700 block">Packed</span>
                    </div>

                    <div className="relative z-10 space-y-0.5">
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-[7.5px] shadow-sm animate-pulse">
                        <Truck className="w-2 h-2" />
                      </div>
                      <span className="text-[6.5px] font-extrabold text-blue-700 block">In Transit</span>
                    </div>

                    <div className="relative z-10 space-y-0.5">
                      <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto text-[7.5px]">
                        •
                      </div>
                      <span className="text-[6.5px] font-semibold text-slate-400 block">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. CARD: REVIEWS (Directly below Shipping, gap: 18px) */}
              <div
                data-testid="card-reviews"
                className="absolute top-[355px] right-[12px] w-[250px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1 z-30 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5.5 h-5.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-[11px]">
                        {t('landing.systemCardReviews')}
                      </h4>
                      <p className="text-[7.5px] text-slate-400">Verified Ratings</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ★ 4.8 / 5.0
                  </span>
                </div>

                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-center px-1">
                    <div className="text-base font-black text-slate-900 leading-none">4.8</div>
                    <div className="flex justify-center text-amber-400 gap-0.5 mt-0.5">
                      {'★★★★★'.split('').map((s, i) => (
                        <span key={i} className="text-[7.5px] leading-none">★</span>
                      ))}
                    </div>
                    <span className="text-[6.5px] text-slate-400 block mt-0.5">342 ratings</span>
                  </div>

                  {/* Compact Rating Distribution Bars */}
                  <div className="flex-1 space-y-0.5 text-[7px] font-medium text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="w-3">5★</span>
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '82%' }} />
                      </div>
                      <span className="w-4 text-right font-mono text-[6.5px]">82%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3">4★</span>
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '14%' }} />
                      </div>
                      <span className="w-4 text-right font-mono text-[6.5px]">14%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3">3★</span>
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '3%' }} />
                      </div>
                      <span className="w-4 text-right font-mono text-[6.5px]">3%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3">2★</span>
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '1%' }} />
                      </div>
                      <span className="w-4 text-right font-mono text-[6.5px]">1%</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* ==================================================== */}
            {/* MOBILE VIEWPORT (< 768px): Responsive Composition   */}
            {/* ==================================================== */}
            <div className="md:hidden w-full space-y-4">
              
              {/* Responsive Central Dashboard */}
              <div className="w-full bg-slate-900 p-2 rounded-2xl shadow-lg border border-slate-800">
                <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <LetZshopLogo size="sm" iconOnly />
                      <span className="font-extrabold text-xs text-slate-800">LetZshop</span>
                      <span className="text-[10px] font-mono text-slate-400">/ dashboard</span>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● Live Sync
                    </span>
                  </div>

                  {/* Mobile 4 KPI Grid */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-medium">Total Sales</span>
                      <span className="text-sm font-black text-slate-900 block">₹1,24,580</span>
                      <span className="text-[8px] font-bold text-emerald-600">↑ 28%</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-medium">Orders</span>
                      <span className="text-sm font-black text-slate-900 block">243</span>
                      <span className="text-[8px] font-bold text-emerald-600">↑ 32%</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-medium">Customers</span>
                      <span className="text-sm font-black text-slate-900 block">1,921</span>
                      <span className="text-[8px] font-bold text-emerald-600">↑ 18%</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-medium">{t('landing.systemAvgRating')}</span>
                      <span className="text-sm font-black text-slate-900 block">4.8 ★</span>
                      <span className="text-[8px] font-bold text-amber-600">98% Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horizontal Swipeable Track of 6 Surrounding Cards */}
              <div className="flex overflow-x-auto gap-3 pb-2 pt-1 snap-x snap-mandatory no-scrollbar -mx-4 px-4">
                
                {/* 1. Products Card */}
                <div className="w-[270px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-extrabold text-xs text-slate-900">{t('landing.systemCardProducts')}</h4>
                    </div>
                    <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Catalog</span>
                  </div>
                  <div className="space-y-1.5 text-[9px]">
                    <div className="p-1.5 bg-slate-50 rounded flex justify-between items-center">
                      <span className="font-bold">Artisan Perfume (50ml)</span>
                      <span className="font-black">₹1,299</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded flex justify-between items-center">
                      <span className="font-bold">Arabica Roast Coffee (250g)</span>
                      <span className="font-black">₹899</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded flex justify-between items-center">
                      <span className="font-bold">Vitamin C Glow Serum</span>
                      <span className="font-black">₹749</span>
                    </div>
                  </div>
                </div>

                {/* 2. Orders Card */}
                <div className="w-[270px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-[#FF6B00]" />
                      <h4 className="font-extrabold text-xs text-slate-900">{t('landing.systemCardOrders')}</h4>
                    </div>
                    <span className="text-[8.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Pipeline</span>
                  </div>
                  <div className="space-y-1.5 text-[9px]">
                    <div className="p-1.5 bg-slate-50 rounded flex justify-between items-center">
                      <div>
                        <span className="font-bold block">Priya Mehta</span>
                        <span className="text-[8px] text-slate-400">#LZ789456</span>
                      </div>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Packed</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded flex justify-between items-center">
                      <div>
                        <span className="font-bold block">Rohit Sharma</span>
                        <span className="text-[8px] text-slate-400">#LZ789455</span>
                      </div>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Shipped</span>
                    </div>
                  </div>
                </div>

                {/* 3. Payments Card */}
                <div className="w-[270px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <h4 className="font-extrabold text-xs text-slate-900">{t('landing.systemCardPayments')}</h4>
                    </div>
                    <span className="text-[8.5px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Settled</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <span className="text-[8px] text-slate-400 block">{t('landing.systemTotalReceived')}</span>
                    <span className="text-base font-black text-slate-900">₹1,24,580</span>
                  </div>
                </div>

                {/* 4. Customers Card */}
                <div className="w-[270px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-extrabold text-xs text-slate-900">{t('landing.systemCardCustomers')}</h4>
                    </div>
                    <span className="text-[8.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">1,921 Users</span>
                  </div>
                  <div className="space-y-1.5 text-[9px]">
                    <div className="p-1.5 bg-slate-50 rounded flex justify-between items-center">
                      <span className="font-bold">Priya Mehta</span>
                      <span className="text-[8px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">VIP (12)</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded flex justify-between items-center">
                      <span className="font-bold">Rohit Sharma</span>
                      <span className="text-[8px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Regular (5)</span>
                    </div>
                  </div>
                </div>

                {/* 5. Shipping Card */}
                <div className="w-[270px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <h4 className="font-extrabold text-xs text-slate-900">{t('landing.systemCardShipping')}</h4>
                    </div>
                    <span className="text-[8.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Live SMS</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <span className="text-[8.5px] font-bold text-blue-700 block">Express Dispatch In Transit</span>
                    <span className="text-[8px] text-slate-400 font-mono">Waybill #LZ-89042</span>
                  </div>
                </div>

                {/* 6. Reviews Card */}
                <div className="w-[270px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <h4 className="font-extrabold text-xs text-slate-900">{t('landing.systemCardReviews')}</h4>
                    </div>
                    <span className="text-[8.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">4.8 / 5.0</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <span className="text-base font-black text-slate-900 block">4.8 ★★★★★</span>
                    <span className="text-[8px] text-slate-500">98% Positive Feedback from verified buyers</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* BOTTOM CAPABILITY RAIL: Compact 100-115px Height         */}
        {/* Directly below main composition (gap: 28px)              */}
        {/* ======================================================== */}
        <div
          data-testid="capability-strip"
          className="capabilityRail bg-white border border-slate-200/90 rounded-2xl shadow-xs p-2.5 sm:p-3"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/90 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-200 space-y-1"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${cap.badgeColor}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[11.5px] text-slate-900 leading-tight">
                      {cap.title}
                    </h5>
                    <p className="text-[9px] text-slate-500 leading-snug mt-0.5">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

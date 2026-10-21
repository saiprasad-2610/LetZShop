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
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    },
    {
      id: 'orders',
      title: t('landing.capOrders'),
      desc: t('landing.capOrdersDesc'),
      icon: ShoppingBag,
      badgeColor: 'text-[#FF6B00] bg-orange-50 border-orange-300',
    },
    {
      id: 'payments',
      title: t('landing.capPayments'),
      desc: t('landing.capPaymentsDesc'),
      icon: CreditCard,
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-300',
    },
    {
      id: 'shipping',
      title: t('landing.capShipping'),
      desc: t('landing.capShippingDesc'),
      icon: Truck,
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-300',
    },
    {
      id: 'customers',
      title: t('landing.capCustomers'),
      desc: t('landing.capCustomersDesc'),
      icon: Users,
      badgeColor: 'text-violet-700 bg-violet-50 border-violet-300',
    },
    {
      id: 'reviews',
      title: t('landing.capReviews'),
      desc: t('landing.capReviewsDesc'),
      icon: Star,
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-300',
    },
  ];

  return (
    <section
      id="features"
      className="screen3 relative bg-[#FAFBFC] border-b border-slate-100 overflow-hidden py-8 lg:py-10 scroll-mt-16"
    >
      <div className="screen3Inner max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-4 xl:px-3 space-y-6">
        
        {/* ======================================================== */}
        {/* MAIN TWO-COLUMN COMPOSITION: Left Copy + Symmetrical Scene */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] items-center gap-4 xl:gap-5">
          
          {/* ------------------------------------------------------ */}
          {/* LEFT CONTENT (Vertically Centered with Scene)           */}
          {/* ------------------------------------------------------ */}
          <div
            data-testid="screen3-copy"
            className="screen3Copy w-full lg:w-[260px] xl:w-[275px] shrink-0 text-center lg:text-left space-y-3.5"
          >
            {/* Small Pill: ONE SYSTEM */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-orange-200/80 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-slate-800" />
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-800">
                {t('landing.systemPill')}
              </span>
            </div>

            {/* Headline: One Store. One System. */}
            <h2 className="text-[36px] sm:text-[44px] lg:text-[46px] xl:text-[50px] font-black tracking-tight leading-[0.96]">
              <span className="block text-[#0B1528]">{t('landing.systemTitlePart1')}</span>
              <span className="block text-[#FF6B00]">{t('landing.systemTitlePart2')}</span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-[16px] lg:text-[17px] text-slate-500 font-normal leading-relaxed max-w-[340px]">
              {t('landing.systemSupporting')}
            </p>
          </div>

          {/* ------------------------------------------------------ */}
          {/* RIGHT-SIDE SYSTEM SCENE (~1440px width, 680px height)   */}
          {/* ------------------------------------------------------ */}
          <div className="w-full flex justify-center items-center overflow-visible">
            
            {/* DESKTOP / TABLET SCENE (>= 768px) */}
            <div className="sceneWrapper hidden md:block relative shrink-0">
              <div
                data-testid="system-scene"
                className="systemScene relative w-[1440px] h-[680px] select-none"
              >
                <style jsx>{`
                  :global(.sceneWrapper) {
                    --scene-scale: 1;
                    width: calc(1440px * var(--scene-scale));
                    height: calc(680px * var(--scene-scale));
                  }
                  :global(.systemScene) {
                    transform: scale(var(--scene-scale));
                    transform-origin: top left;
                  }
                  @media (min-width: 1750px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 1;
                    }
                  }
                  @media (min-width: 1550px) and (max-width: 1749px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.95;
                    }
                  }
                  @media (min-width: 1350px) and (max-width: 1549px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.82;
                    }
                  }
                  @media (min-width: 1100px) and (max-width: 1349px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.70;
                    }
                  }
                  @media (min-width: 768px) and (max-width: 1099px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.56;
                    }
                  }
                `}</style>

                {/* Soft Ambient Depth Washes */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[480px] bg-gradient-to-tr from-orange-100/30 via-sky-50/25 to-blue-100/30 rounded-[120px] blur-3xl pointer-events-none z-0" />
                <div className="absolute top-4 left-6 w-60 h-60 bg-emerald-100/25 rounded-full blur-3xl pointer-events-none z-0" />
                <div className="absolute top-4 right-6 w-60 h-60 bg-purple-100/25 rounded-full blur-3xl pointer-events-none z-0" />
                <div className="absolute bottom-6 right-6 w-60 h-60 bg-amber-100/25 rounded-full blur-3xl pointer-events-none z-0" />

                {/* ================================================== */}
                {/* SVG DASHED CONNECTOR ARROWS (z-10, behind cards)   */}
                {/* ================================================== */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 1440 680"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <defs>
                    <marker
                      id="orangeArrow"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="5.5"
                      markerHeight="5.5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#FF6B00" />
                    </marker>
                  </defs>

                  {/* 1. Products (upper-left) -> Laptop Products Sidebar */}
                  <path
                    d="M 270,178 C 282,220 288,270 296,318"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="270" cy="178" r="3.5" fill="#FF6B00" />

                  {/* 2. Orders (upper-center) -> Laptop Overview Top */}
                  <path
                    d="M 748,178 L 748,229"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="748" cy="178" r="3.5" fill="#FF6B00" />

                  {/* 3. Payments (upper-right) -> Laptop Payments Top Right */}
                  <path
                    d="M 1170,168 C 1152,192 1136,212 1122,229"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="1170" cy="168" r="3.5" fill="#FF6B00" />

                  {/* 4. Customers (left-lower) -> Laptop Customers Sidebar */}
                  <path
                    d="M 272,345 L 296,345"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="272" cy="345" r="3.5" fill="#FF6B00" />

                  {/* 5. Shipping (right-middle) -> Laptop Metrics/Chart Area */}
                  <path
                    d="M 1224,312 C 1218,315 1214,318 1208,320"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="1224" cy="312" r="3.5" fill="#FF6B00" />

                  {/* 6. Reviews (right-lower) -> Laptop Metrics/Rating Area */}
                  <path
                    d="M 1224,485 C 1218,472 1214,458 1208,452"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="1224" cy="485" r="3.5" fill="#FF6B00" />
                </svg>

                {/* ================================================== */}
                {/* 1. CENTRAL LETZSHOP LAPTOP DASHBOARD (Main Hero)   */}
                {/* 900px wide, ~445px height, visually dominating     */}
                {/* ================================================== */}
                <div
                  data-testid="system-dashboard"
                  className="systemLaptop absolute top-[232px] left-[298px] w-[900px] z-20 pointer-events-none"
                >
                  {/* Laptop Screen Lid / Dark Navy Bezel */}
                  <div className="bg-[#0F172A] pt-2.5 px-3 pb-3 rounded-t-2xl rounded-b-md shadow-[0_30px_70px_-15px_rgba(15,23,42,0.38)] border border-slate-800">
                    
                    {/* Centered Camera Dot */}
                    <div className="flex items-center justify-center pb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700 border border-slate-600/50" />
                    </div>

                    {/* Inner Screen Display (Crisp HTML Dashboard) */}
                    <div className="bg-white rounded-lg overflow-hidden border border-slate-200/90 shadow-inner">
                      
                      {/* Dashboard Header Bar */}
                      <div className="h-10 bg-slate-50 border-b border-slate-200/80 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LetZshopLogo size="sm" iconOnly />
                          <span className="font-extrabold text-[12.5px] text-slate-800 tracking-tight">LetZshop</span>
                          <span className="text-[10.5px] font-mono text-slate-400">/ dashboard</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded text-[9.5px] text-slate-400 w-44">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">Search products, orders...</span>
                          </div>
                          <div className="w-6.5 h-6.5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-5.5 h-5.5 rounded-full bg-blue-600 text-white font-bold text-[9.5px] flex items-center justify-center">
                              S
                            </div>
                            <span className="text-[10px] font-bold text-slate-700">Store ▾</span>
                          </div>
                        </div>
                      </div>

                      {/* Dashboard Body (Sidebar + Main Metrics Area) */}
                      <div className="p-3.5 grid grid-cols-12 gap-3.5 bg-white">
                        
                        {/* Left Sidebar Menu */}
                        <div className="col-span-3 space-y-1 text-[10px] font-semibold text-slate-500 border-r border-slate-100 pr-2.5">
                          <div className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold flex items-center gap-1.5">
                            <span>Dashboard</span>
                          </div>
                          <div className="px-2.5 py-0.5 hover:bg-slate-50 rounded">Orders</div>
                          <div className="px-2.5 py-0.5 hover:bg-slate-50 rounded">Products</div>
                          <div className="px-2.5 py-0.5 hover:bg-slate-50 rounded">Customers</div>
                          <div className="px-2.5 py-0.5 hover:bg-slate-50 rounded">Payments</div>
                          <div className="px-2.5 py-0.5 hover:bg-slate-50 rounded">Shipping</div>
                          <div className="px-2.5 py-0.5 hover:bg-slate-50 rounded">Reviews</div>
                          <div className="px-2.5 py-0.5 hover:bg-slate-50 rounded">Marketing</div>
                          <div className="px-2.5 py-0.5 hover:bg-slate-50 rounded">Analytics</div>
                        </div>

                        {/* Main Metrics Area */}
                        <div className="col-span-9 space-y-2.5">
                          <div className="flex items-center justify-between pb-0.5">
                            <span className="text-[12px] font-black text-slate-800">Overview</span>
                            <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                              ● Live Sync Active
                            </span>
                          </div>

                          {/* 4 KPI Cards */}
                          <div className="grid grid-cols-4 gap-2.5">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[8.5px] text-slate-400 block font-medium">Total Sales</span>
                              <span className="text-[12px] font-black text-slate-900 block leading-tight">₹1,24,580</span>
                              <span className="text-[8.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                                ↑ 28%
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[8.5px] text-slate-400 block font-medium">Orders</span>
                              <span className="text-[12px] font-black text-slate-900 block leading-tight">243</span>
                              <span className="text-[8.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                                ↑ 32%
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[8.5px] text-slate-400 block font-medium">Customers</span>
                              <span className="text-[12px] font-black text-slate-900 block leading-tight">1,921</span>
                              <span className="text-[8.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                                ↑ 18%
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[8.5px] text-slate-400 block font-medium">{t('landing.systemAvgRating')}</span>
                              <span className="text-[12px] font-black text-slate-900 block leading-tight flex items-center gap-0.5">
                                4.8 <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                              </span>
                              <span className="text-[8.5px] font-bold text-amber-600">★ 98%</span>
                            </div>
                          </div>

                          {/* Sales & Orders Chart */}
                          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between text-[8.5px]">
                              <span className="font-bold text-slate-700">Sales & Orders Performance</span>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 font-semibold text-blue-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" /> Sales
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-[#FF6B00]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] inline-block" /> Orders
                                </span>
                              </div>
                            </div>

                            {/* Dual-Line Illustrative SVG Chart */}
                            <svg className="w-full h-13" viewBox="0 0 460 52" fill="none">
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

                              <line x1="0" y1="13" x2="460" y2="13" stroke="#E2E8F0" strokeWidth="0.7" strokeDasharray="3 3" />
                              <line x1="0" y1="32" x2="460" y2="32" stroke="#E2E8F0" strokeWidth="0.7" strokeDasharray="3 3" />

                              {/* Sales Area & Line (Blue) */}
                              <path
                                d="M 5,44 C 65,40 120,32 180,22 C 240,12 315,24 375,14 C 420,6 445,9 455,5 L 455,50 L 5,50 Z"
                                fill="url(#salesGrad)"
                              />
                              <path
                                d="M 5,44 C 65,40 120,32 180,22 C 240,12 315,24 375,14 C 420,6 445,9 455,5"
                                stroke="#2563EB"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <circle cx="455" cy="5" r="2.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1" />

                              {/* Orders Area & Line (Orange) */}
                              <path
                                d="M 5,47 C 70,44 130,40 190,30 C 250,22 320,32 385,20 C 425,16 450,18 455,12 L 455,50 L 5,50 Z"
                                fill="url(#ordersGrad)"
                              />
                              <path
                                d="M 5,47 C 70,44 130,40 190,30 C 250,22 320,32 385,20 C 425,16 450,18 455,12"
                                stroke="#FF6B00"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                              <circle cx="455" cy="12" r="2.5" fill="#FF6B00" stroke="#FFFFFF" strokeWidth="1" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Laptop Hinge & Base Impression */}
                  <div className="relative -mt-[1px]">
                    {/* Center Hinge */}
                    <div className="w-32 h-1.5 bg-slate-800 rounded-b-sm mx-auto shadow-xs" />
                    {/* Sleek Aluminum Base Edge with Thumb Notch */}
                    <div className="w-[936px] h-4 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 -ml-[18px] rounded-b-xl border-t border-slate-300/80 shadow-[0_14px_35px_rgba(15,23,42,0.22)] flex items-center justify-center">
                      <div className="w-20 h-1.5 bg-slate-400/80 rounded-b-md" />
                    </div>
                  </div>
                </div>

                {/* ================================================== */}
                {/* TOP ROW: PRODUCTS, ORDERS, PAYMENTS                 */}
                {/* ================================================== */}

                {/* 2. CARD: PRODUCTS (Upper-Left: left 24px, top 6px, width 284px) */}
                <div
                  data-testid="card-products"
                  className="absolute top-[6px] left-[24px] w-[284px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2 space-y-1 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5.5 h-5.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                        <Package className="w-3.5 h-3.5" />
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

                  <div className="space-y-0.5 text-[8.5px]">
                    <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-amber-50 text-amber-700 font-bold text-[7.5px] flex items-center justify-center border border-amber-200/70">
                          🧴
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Artisan Perfume</span>
                          <span className="text-[7px] text-amber-600 font-medium">★ 4.8</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-[10px]">₹1,299</span>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-orange-50 text-orange-700 font-bold text-[7.5px] flex items-center justify-center border border-orange-200/70">
                          ☕
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Arabica Coffee</span>
                          <span className="text-[7px] text-amber-600 font-medium">★ 4.7</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-[10px]">₹899</span>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-rose-50 text-rose-700 font-bold text-[7.5px] flex items-center justify-center border border-rose-200/70">
                          💊
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Vitamin C Serum</span>
                          <span className="text-[7px] text-amber-600 font-medium">★ 4.9</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-[10px]">₹749</span>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-emerald-50 text-emerald-700 font-bold text-[7.5px] flex items-center justify-center border border-emerald-200/70">
                          🌿
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Botanical Night Care</span>
                          <span className="text-[7px] text-amber-600 font-medium">★ 4.8</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-[10px]">₹1,499</span>
                    </div>
                  </div>
                </div>

                {/* 3. CARD: ORDERS (Upper-Center: left 606px, top 6px, width 284px) */}
                <div
                  data-testid="card-orders"
                  className="absolute top-[6px] left-[606px] w-[284px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2 space-y-1 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5.5 h-5.5 rounded-lg bg-orange-50 border border-orange-200 text-[#FF6B00] flex items-center justify-center">
                        <ShoppingBag className="w-3.5 h-3.5" />
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

                  <div className="space-y-0.5 text-[8.5px]">
                    <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[7.5px] text-slate-400 block leading-none">#LZ789456</span>
                        <span className="font-bold text-slate-800 leading-tight">Priya Mehta</span>
                      </div>
                      <div className="text-right flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-[10px]">₹1,299</span>
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Packed
                        </span>
                      </div>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[7.5px] text-slate-400 block leading-none">#LZ789455</span>
                        <span className="font-bold text-slate-800 leading-tight">Rohit Sharma</span>
                      </div>
                      <div className="text-right flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-[10px]">₹2,499</span>
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Shipped
                        </span>
                      </div>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[7.5px] text-slate-400 block leading-none">#LZ789454</span>
                        <span className="font-bold text-slate-800 leading-tight">Sneha Kapoor</span>
                      </div>
                      <div className="text-right flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-[10px]">₹899</span>
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Delivered
                        </span>
                      </div>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[7.5px] text-slate-400 block leading-none">#LZ789453</span>
                        <span className="font-bold text-slate-800 leading-tight">Arjun Verma</span>
                      </div>
                      <div className="text-right flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-[10px]">₹1,749</span>
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Processing
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. CARD: PAYMENTS (Upper-Right: left 1132px, top 6px, width 284px) */}
                <div
                  data-testid="card-payments"
                  className="absolute top-[6px] left-[1132px] w-[284px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2 space-y-1 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5.5 h-5.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5" />
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
                    <div className="text-xs font-black text-slate-900 tracking-tight leading-tight">₹1,24,580</div>
                  </div>

                  {/* Methods */}
                  <div className="grid grid-cols-2 gap-1 text-[8px]">
                    <div className="p-0.5 px-1.5 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800">UPI</span>
                      <span className="text-[7px] font-mono text-emerald-600 font-bold">54%</span>
                    </div>
                    <div className="p-0.5 px-1.5 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800">Razorpay</span>
                      <span className="text-[7px] font-mono text-blue-600 font-bold">26%</span>
                    </div>
                    <div className="p-0.5 px-1.5 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800">Cards</span>
                      <span className="text-[7px] font-mono text-purple-600 font-bold">12%</span>
                    </div>
                    <div className="p-0.5 px-1.5 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800">COD</span>
                      <span className="text-[7px] font-mono text-amber-600 font-bold">8%</span>
                    </div>
                  </div>
                </div>

                {/* ================================================== */}
                {/* SATELLITE CARDS: CUSTOMERS, SHIPPING, REVIEWS      */}
                {/* Clear 25-30px whitespace gap from laptop            */}
                {/* ================================================== */}

                {/* 5. CARD: CUSTOMERS (Beside left-lower: left 12px, top 310px, width 260px) */}
                <div
                  data-testid="card-customers"
                  className="absolute top-[310px] left-[12px] w-[260px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-3 space-y-2 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5.5 h-5.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
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

                  {/* 4 Customer rows */}
                  <div className="space-y-1 text-[8.5px]">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[7.5px] flex items-center justify-center">
                          PM
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Priya Mehta</span>
                          <span className="text-[7px] text-slate-400">12 orders</span>
                        </div>
                      </div>
                      <span className="text-[7px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        VIP
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[7.5px] flex items-center justify-center">
                          RS
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Rohit Sharma</span>
                          <span className="text-[7px] text-slate-400">5 orders</span>
                        </div>
                      </div>
                      <span className="text-[7px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Regular
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold text-[7.5px] flex items-center justify-center">
                          SK
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Sneha Kapoor</span>
                          <span className="text-[7px] text-slate-400">8 orders</span>
                        </div>
                      </div>
                      <span className="text-[7px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        VIP
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[7.5px] flex items-center justify-center">
                          AV
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Arjun Verma</span>
                          <span className="text-[7px] text-slate-400">3 orders</span>
                        </div>
                      </div>
                      <span className="text-[7px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        New
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. CARD: SHIPPING (Beside right-middle: left 1224px, top 240px, width 204px) */}
                <div
                  data-testid="card-shipping"
                  className="absolute top-[240px] left-[1224px] w-[204px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-3 space-y-2 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5.5 h-5.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[11px]">
                          {t('landing.systemCardShipping')}
                        </h4>
                        <p className="text-[7.5px] text-slate-400">Live Parcel Timeline</p>
                      </div>
                    </div>
                    <span className="text-[7.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Live
                    </span>
                  </div>

                  {/* Shipment Timeline */}
                  <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[7px] font-mono text-slate-400">
                      <span>LZ-904128</span>
                      <span className="text-blue-600 font-bold">Express Transit</span>
                    </div>

                    <div className="grid grid-cols-4 gap-0.5 text-center relative pt-0.5">
                      {/* Progress Bar Line */}
                      <div className="absolute top-[9px] left-[12%] right-[12%] h-0.5 bg-slate-200 z-0">
                        <div className="h-full bg-emerald-500 w-[66%]" />
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-[7px] shadow-2xs">
                          ✓
                        </div>
                        <span className="text-[6.5px] font-bold text-slate-700 block">Ordered</span>
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-[7px] shadow-2xs">
                          ✓
                        </div>
                        <span className="text-[6.5px] font-bold text-slate-700 block">Packed</span>
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-[7px] shadow-sm animate-pulse">
                          <Truck className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-[6.5px] font-extrabold text-blue-700 block">Transit</span>
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto text-[7px]">
                          •
                        </div>
                        <span className="text-[6.5px] font-semibold text-slate-400 block">Deliver</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. CARD: REVIEWS (Beside right-lower: left 1224px, top 415px, width 204px) */}
                <div
                  data-testid="card-reviews"
                  className="absolute top-[415px] left-[1224px] w-[204px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-3 space-y-1.5 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5.5 h-5.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[11px]">
                          {t('landing.systemCardReviews')}
                        </h4>
                        <p className="text-[7.5px] text-slate-400">Verified Ratings</p>
                      </div>
                    </div>
                    <span className="text-[7.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      ★ 4.8
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-center px-1">
                      <div className="text-base font-black text-slate-900 leading-none">4.8</div>
                      <div className="flex justify-center text-amber-400 gap-0.5 mt-0.5">
                        {'★★★★★'.split('').map((s, i) => (
                          <span key={i} className="text-[8px] leading-none">★</span>
                        ))}
                      </div>
                      <span className="text-[6.5px] text-slate-400 block mt-0.5">342 reviews</span>
                    </div>

                    {/* Rating Distribution Bars */}
                    <div className="flex-1 space-y-0.5 text-[7px] font-medium text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5">5★</span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '82%' }} />
                        </div>
                        <span className="w-3.5 text-right font-mono text-[6.5px]">82%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5">4★</span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '14%' }} />
                        </div>
                        <span className="w-3.5 text-right font-mono text-[6.5px]">14%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5">3★</span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '3%' }} />
                        </div>
                        <span className="w-3.5 text-right font-mono text-[6.5px]">3%</span>
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
              <div className="w-full bg-[#0F172A] p-2 rounded-2xl shadow-lg border border-slate-800">
                <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <LetZshopLogo size="sm" iconOnly />
                      <span className="font-extrabold text-xs text-slate-900 tracking-tight">LetZshop</span>
                      <span className="text-[10px] font-mono text-slate-400">/ dashboard</span>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ● Live Sync
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[8px] text-slate-400 block font-medium">Total Sales</span>
                      <span className="text-sm font-black text-slate-900 block leading-tight">₹1,24,580</span>
                      <span className="text-[8px] font-bold text-emerald-600">↑ 28%</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[8px] text-slate-400 block font-medium">Orders</span>
                      <span className="text-sm font-black text-slate-900 block leading-tight">243</span>
                      <span className="text-[8px] font-bold text-emerald-600">↑ 32%</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[8px] text-slate-400 block font-medium">Customers</span>
                      <span className="text-sm font-black text-slate-900 block leading-tight">1,921</span>
                      <span className="text-[8px] font-bold text-emerald-600">↑ 18%</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[8px] text-slate-400 block font-medium">Avg. Rating</span>
                      <span className="text-sm font-black text-slate-900 block leading-tight">4.8 ★</span>
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
                    <span className="text-[8px] text-slate-400 block font-medium">Daily Settlements</span>
                    <span className="text-sm font-black text-slate-900">₹1,24,580</span>
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
                  <div className="space-y-1 text-[8.5px]">
                    <div className="p-1 bg-slate-50 rounded flex justify-between items-center">
                      <span className="font-bold">Priya Mehta</span>
                      <span className="text-[7.5px] font-bold text-amber-700">VIP</span>
                    </div>
                    <div className="p-1 bg-slate-50 rounded flex justify-between items-center">
                      <span className="font-bold">Rohit Sharma</span>
                      <span className="text-[7.5px] font-bold text-blue-700">Regular</span>
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
                    <span className="text-[8.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Tracking</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <span className="font-mono text-[9px] text-blue-700 font-bold block">LZ-904128 • In Transit</span>
                    <span className="text-[8px] text-slate-400">Estimated Delivery: Tomorrow</span>
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
        {/* BOTTOM CAPABILITY RAIL: Stronger, Bolder Closing Strip    */}
        {/* Directly below main composition                           */}
        {/* ======================================================== */}
        <div
          data-testid="capability-strip"
          className="capabilityRail bg-white/95 border border-slate-200/90 rounded-[22px] shadow-sm p-3.5 sm:p-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-2.5"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${cap.badgeColor} shadow-2xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[16px] sm:text-[17px] text-slate-900 tracking-tight leading-snug">
                      {cap.title}
                    </h5>
                    <p className="text-[13px] sm:text-[13.5px] text-slate-600 font-normal leading-relaxed mt-1">
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

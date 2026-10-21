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
      <div className="screen3Inner max-w-[1660px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-4 space-y-6">
        
        {/* ======================================================== */}
        {/* MAIN TWO-COLUMN COMPOSITION: Left Copy + Symmetrical Scene */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] items-center gap-5 xl:gap-6">
          
          {/* ------------------------------------------------------ */}
          {/* LEFT CONTENT (Vertically Centered with Scene)           */}
          {/* ------------------------------------------------------ */}
          <div
            data-testid="screen3-copy"
            className="screen3Copy w-full lg:w-[310px] xl:w-[330px] shrink-0 text-center lg:text-left space-y-3.5"
          >
            {/* Small Pill: ONE SYSTEM */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-orange-200/80 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-slate-800" />
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-800">
                {t('landing.systemPill')}
              </span>
            </div>

            {/* Headline: One Store. One System. */}
            <h2 className="text-[38px] sm:text-[46px] lg:text-[50px] xl:text-[56px] font-black tracking-tight leading-[0.96]">
              <span className="block text-[#0B1528]">{t('landing.systemTitlePart1')}</span>
              <span className="block text-[#FF6B00]">{t('landing.systemTitlePart2')}</span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-[17px] lg:text-[18px] text-slate-500 font-normal leading-relaxed max-w-[400px]">
              {t('landing.systemSupporting')}
            </p>
          </div>

          {/* ------------------------------------------------------ */}
          {/* RIGHT-SIDE SYSTEM SCENE (~1290px width, 620px height)   */}
          {/* ------------------------------------------------------ */}
          <div className="w-full flex justify-center items-center overflow-visible">
            
            {/* DESKTOP / TABLET SCENE (>= 768px) */}
            <div className="sceneWrapper hidden md:block relative shrink-0">
              <div
                data-testid="system-scene"
                className="systemScene relative w-[1290px] h-[620px] select-none"
              >
                <style jsx>{`
                  :global(.sceneWrapper) {
                    --scene-scale: 1;
                    width: calc(1290px * var(--scene-scale));
                    height: calc(620px * var(--scene-scale));
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
                      --scene-scale: 0.82;
                    }
                  }
                  @media (min-width: 1100px) and (max-width: 1399px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.70;
                    }
                  }
                  @media (min-width: 768px) and (max-width: 1099px) {
                    :global(.sceneWrapper) {
                      --scene-scale: 0.58;
                    }
                  }
                `}</style>

                {/* Soft Ambient Depth Washes */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-orange-100/30 via-sky-50/25 to-blue-100/30 rounded-[120px] blur-3xl pointer-events-none z-0" />
                <div className="absolute top-4 left-6 w-56 h-56 bg-emerald-100/25 rounded-full blur-3xl pointer-events-none z-0" />
                <div className="absolute top-4 right-6 w-56 h-56 bg-purple-100/25 rounded-full blur-3xl pointer-events-none z-0" />
                <div className="absolute bottom-6 right-6 w-56 h-56 bg-amber-100/25 rounded-full blur-3xl pointer-events-none z-0" />

                {/* ================================================== */}
                {/* SVG DASHED CONNECTOR ARROWS (z-10, behind cards)   */}
                {/* ================================================== */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 1290 620"
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
                    d="M 250,172 C 270,215 300,265 338,308"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="250" cy="172" r="3.5" fill="#FF6B00" />

                  {/* 2. Orders (upper-center) -> Laptop Overview Top */}
                  <path
                    d="M 640,166 L 640,201"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="640" cy="166" r="3.5" fill="#FF6B00" />

                  {/* 3. Payments (upper-right) -> Laptop Payments Top Right */}
                  <path
                    d="M 1030,160 C 1005,180 985,192 970,201"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="1030" cy="160" r="3.5" fill="#FF6B00" />

                  {/* 4. Customers (left) -> Laptop Customers Sidebar */}
                  <path
                    d="M 255,360 C 265,360 270,350 278,346"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="255" cy="360" r="3.5" fill="#FF6B00" />

                  {/* 5. Shipping (right-upper) -> Laptop Metrics/Chart Area */}
                  <path
                    d="M 1065,300 C 1055,300 1050,325 1042,336"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="1065" cy="300" r="3.5" fill="#FF6B00" />

                  {/* 6. Reviews (right-lower) -> Laptop Metrics/Rating Area */}
                  <path
                    d="M 1065,450 C 1055,450 1050,430 1042,422"
                    stroke="#FF6B00"
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    markerEnd="url(#orangeArrow)"
                  />
                  <circle cx="1065" cy="450" r="3.5" fill="#FF6B00" />
                </svg>

                {/* ================================================== */}
                {/* 1. CENTRAL LETZSHOP LAPTOP DASHBOARD (Main Hero)   */}
                {/* 760px wide, 400px height, shifted left to 280px    */}
                {/* ================================================== */}
                <div
                  data-testid="system-dashboard"
                  className="systemLaptop absolute top-[204px] left-[280px] w-[760px] z-20 pointer-events-none"
                >
                  {/* Laptop Screen Lid / Dark Navy Bezel */}
                  <div className="bg-[#0F172A] pt-2 px-2.5 pb-2.5 rounded-t-2xl rounded-b-md shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] border border-slate-800">
                    
                    {/* Centered Camera Dot */}
                    <div className="flex items-center justify-center pb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700 border border-slate-600/50" />
                    </div>

                    {/* Inner Screen Display (Crisp HTML Dashboard) */}
                    <div className="bg-white rounded-lg overflow-hidden border border-slate-200/90 shadow-inner">
                      
                      {/* Dashboard Header Bar */}
                      <div className="h-9 bg-slate-50 border-b border-slate-200/80 px-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LetZshopLogo size="sm" iconOnly />
                          <span className="font-extrabold text-[12px] text-slate-800 tracking-tight">LetZshop</span>
                          <span className="text-[10px] font-mono text-slate-400">/ dashboard</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-[9px] text-slate-400 w-36">
                            <Search className="w-3 h-3 text-slate-400" />
                            <span className="truncate">Search products, orders...</span>
                          </div>
                          <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                            <Bell className="w-3 h-3" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                              S
                            </div>
                            <span className="text-[9.5px] font-bold text-slate-700">Store ▾</span>
                          </div>
                        </div>
                      </div>

                      {/* Dashboard Body (Sidebar + Main Metrics Area) */}
                      <div className="p-3 grid grid-cols-12 gap-3 bg-white">
                        
                        {/* Left Sidebar Menu */}
                        <div className="col-span-3 space-y-1 text-[9.5px] font-semibold text-slate-500 border-r border-slate-100 pr-2">
                          <div className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold flex items-center gap-1.5">
                            <span>Dashboard</span>
                          </div>
                          <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Orders</div>
                          <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Products</div>
                          <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Customers</div>
                          <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Payments</div>
                          <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Shipping</div>
                          <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Reviews</div>
                          <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Marketing</div>
                          <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Analytics</div>
                        </div>

                        {/* Main Metrics Area */}
                        <div className="col-span-9 space-y-2">
                          <div className="flex items-center justify-between pb-0.5">
                            <span className="text-[11px] font-black text-slate-800">Overview</span>
                            <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ● Live Sync Active
                            </span>
                          </div>

                          {/* 4 KPI Cards */}
                          <div className="grid grid-cols-4 gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[8px] text-slate-400 block font-medium">Total Sales</span>
                              <span className="text-[11px] font-black text-slate-900 block leading-tight">₹1,24,580</span>
                              <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5">
                                ↑ 28%
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[8px] text-slate-400 block font-medium">Orders</span>
                              <span className="text-[11px] font-black text-slate-900 block leading-tight">243</span>
                              <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5">
                                ↑ 32%
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[8px] text-slate-400 block font-medium">Customers</span>
                              <span className="text-[11px] font-black text-slate-900 block leading-tight">1,921</span>
                              <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5">
                                ↑ 18%
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[8px] text-slate-400 block font-medium">{t('landing.systemAvgRating')}</span>
                              <span className="text-[11px] font-black text-slate-900 block leading-tight flex items-center gap-0.5">
                                4.8 <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                              </span>
                              <span className="text-[8px] font-bold text-amber-600">★ 98%</span>
                            </div>
                          </div>

                          {/* Sales & Orders Chart */}
                          <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                            <div className="flex items-center justify-between text-[8px]">
                              <span className="font-bold text-slate-700">Sales & Orders Performance</span>
                              <div className="flex items-center gap-2.5">
                                <span className="flex items-center gap-1 font-semibold text-blue-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" /> Sales
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-[#FF6B00]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] inline-block" /> Orders
                                </span>
                              </div>
                            </div>

                            {/* Dual-Line Illustrative SVG Chart */}
                            <svg className="w-full h-12" viewBox="0 0 380 50" fill="none">
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

                              <line x1="0" y1="12" x2="380" y2="12" stroke="#E2E8F0" strokeWidth="0.7" strokeDasharray="3 3" />
                              <line x1="0" y1="30" x2="380" y2="30" stroke="#E2E8F0" strokeWidth="0.7" strokeDasharray="3 3" />

                              {/* Sales Area & Line (Blue) */}
                              <path
                                d="M 5,42 C 55,38 100,30 150,20 C 200,10 260,22 310,12 C 345,5 365,8 375,4 L 375,48 L 5,48 Z"
                                fill="url(#salesGrad)"
                              />
                              <path
                                d="M 5,42 C 55,38 100,30 150,20 C 200,10 260,22 310,12 C 345,5 365,8 375,4"
                                stroke="#2563EB"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <circle cx="375" cy="4" r="2.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1" />

                              {/* Orders Area & Line (Orange) */}
                              <path
                                d="M 5,45 C 60,42 110,38 160,28 C 210,20 265,30 320,18 C 350,14 370,16 375,10 L 375,48 L 5,48 Z"
                                fill="url(#ordersGrad)"
                              />
                              <path
                                d="M 5,45 C 60,42 110,38 160,28 C 210,20 265,30 320,18 C 350,14 370,16 375,10"
                                stroke="#FF6B00"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                              <circle cx="375" cy="10" r="2.5" fill="#FF6B00" stroke="#FFFFFF" strokeWidth="1" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Laptop Hinge & Base Impression */}
                  <div className="relative -mt-[1px]">
                    {/* Center Hinge */}
                    <div className="w-28 h-1.5 bg-slate-800 rounded-b-sm mx-auto shadow-xs" />
                    {/* Sleek Aluminum Base Edge with Thumb Notch */}
                    <div className="w-[790px] h-3.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 -ml-[15px] rounded-b-xl border-t border-slate-300/80 shadow-[0_12px_30px_rgba(15,23,42,0.20)] flex items-center justify-center">
                      <div className="w-16 h-1 bg-slate-400/80 rounded-b-md" />
                    </div>
                  </div>
                </div>

                {/* ================================================== */}
                {/* TOP ROW: PRODUCTS, ORDERS, PAYMENTS                 */}
                {/* ================================================== */}

                {/* 2. CARD: PRODUCTS (Upper-Left: left 15px, top 10px) */}
                <div
                  data-testid="card-products"
                  className="absolute top-[10px] left-[15px] w-[260px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2 space-y-1 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                        <Package className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[10.5px]">
                          {t('landing.systemCardProducts')}
                        </h4>
                        <p className="text-[7px] text-slate-400">4 Active Items</p>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      Live Catalog
                    </span>
                  </div>

                  <div className="space-y-0.5 text-[8px]">
                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded bg-amber-50 text-amber-700 font-bold text-[7px] flex items-center justify-center border border-amber-200/70">
                          🧴
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Artisan Perfume</span>
                          <span className="text-[6.5px] text-amber-600 font-medium">★ 4.8</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-[9px]">₹1,299</span>
                    </div>

                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded bg-orange-50 text-orange-700 font-bold text-[7px] flex items-center justify-center border border-orange-200/70">
                          ☕
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Arabica Coffee</span>
                          <span className="text-[6.5px] text-amber-600 font-medium">★ 4.7</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-[9px]">₹899</span>
                    </div>

                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded bg-rose-50 text-rose-700 font-bold text-[7px] flex items-center justify-center border border-rose-200/70">
                          💊
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Vitamin C Serum</span>
                          <span className="text-[6.5px] text-amber-600 font-medium">★ 4.9</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-[9px]">₹749</span>
                    </div>

                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[7px] flex items-center justify-center border border-emerald-200/70">
                          🌿
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Botanical Night Care</span>
                          <span className="text-[6.5px] text-amber-600 font-medium">★ 4.8</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-[9px]">₹1,499</span>
                    </div>
                  </div>
                </div>

                {/* 3. CARD: ORDERS (Upper-Center: left 510px, top 10px) */}
                <div
                  data-testid="card-orders"
                  className="absolute top-[10px] left-[510px] w-[260px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2 space-y-1 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-orange-50 border border-orange-200 text-[#FF6B00] flex items-center justify-center">
                        <ShoppingBag className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[10.5px]">
                          {t('landing.systemCardOrders')}
                        </h4>
                        <p className="text-[7px] text-slate-400">Live Fulfillment Flow</p>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                      4 Active
                    </span>
                  </div>

                  <div className="space-y-0.5 text-[8px]">
                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[7px] text-slate-400 block leading-none">#LZ789456</span>
                        <span className="font-bold text-slate-800 leading-tight">Priya Mehta</span>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <span className="font-black text-slate-900 text-[9px]">₹1,299</span>
                        <span className="text-[6.5px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Packed
                        </span>
                      </div>
                    </div>

                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[7px] text-slate-400 block leading-none">#LZ789455</span>
                        <span className="font-bold text-slate-800 leading-tight">Rohit Sharma</span>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <span className="font-black text-slate-900 text-[9px]">₹2,499</span>
                        <span className="text-[6.5px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Shipped
                        </span>
                      </div>
                    </div>

                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[7px] text-slate-400 block leading-none">#LZ789454</span>
                        <span className="font-bold text-slate-800 leading-tight">Sneha Kapoor</span>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <span className="font-black text-slate-900 text-[9px]">₹899</span>
                        <span className="text-[6.5px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Delivered
                        </span>
                      </div>
                    </div>

                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[7px] text-slate-400 block leading-none">#LZ789453</span>
                        <span className="font-bold text-slate-800 leading-tight">Arjun Verma</span>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <span className="font-black text-slate-900 text-[9px]">₹1,749</span>
                        <span className="text-[6.5px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Processing
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. CARD: PAYMENTS (Upper-Right: left 1015px, top 10px) */}
                <div
                  data-testid="card-payments"
                  className="absolute top-[10px] left-[1015px] w-[260px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2 space-y-1 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                        <CreditCard className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[10.5px]">
                          {t('landing.systemCardPayments')}
                        </h4>
                        <p className="text-[7px] text-slate-400">Direct Settlements</p>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      Daily Payout
                    </span>
                  </div>

                  <div className="p-1 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[7px] text-slate-400 block">{t('landing.systemTotalReceived')}</span>
                    <div className="text-xs font-black text-slate-900 tracking-tight leading-tight">₹1,24,580</div>
                  </div>

                  {/* Methods */}
                  <div className="grid grid-cols-2 gap-1 text-[7.5px]">
                    <div className="p-0.5 px-1 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800">UPI</span>
                      <span className="text-[6.5px] font-mono text-emerald-600 font-bold">54%</span>
                    </div>
                    <div className="p-0.5 px-1 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800">Razorpay</span>
                      <span className="text-[6.5px] font-mono text-blue-600 font-bold">26%</span>
                    </div>
                    <div className="p-0.5 px-1 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800">Cards</span>
                      <span className="text-[6.5px] font-mono text-purple-600 font-bold">12%</span>
                    </div>
                    <div className="p-0.5 px-1 rounded-lg bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800">COD</span>
                      <span className="text-[6.5px] font-mono text-amber-600 font-bold">8%</span>
                    </div>
                  </div>
                </div>

                {/* ================================================== */}
                {/* SATELLITE CARDS: CUSTOMERS, SHIPPING, REVIEWS      */}
                {/* Clear 25-30px whitespace gap from laptop            */}
                {/* ================================================== */}

                {/* 5. CARD: CUSTOMERS (Beside left edge: left 15px, top 280px) */}
                <div
                  data-testid="card-customers"
                  className="absolute top-[280px] left-[15px] w-[240px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1.5 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                        <Users className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[10.5px]">
                          {t('landing.systemCardCustomers')}
                        </h4>
                        <p className="text-[7px] text-slate-400">Buyer Directory</p>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-200">
                      1,921 Total
                    </span>
                  </div>

                  {/* 4 Customer rows */}
                  <div className="space-y-1 text-[8px]">
                    <div className="p-1 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[7px] flex items-center justify-center">
                          PM
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Priya Mehta</span>
                          <span className="text-[6.5px] text-slate-400">12 orders</span>
                        </div>
                      </div>
                      <span className="text-[6.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        VIP
                      </span>
                    </div>

                    <div className="p-1 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-4.5 h-4.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[7px] flex items-center justify-center">
                          RS
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Rohit Sharma</span>
                          <span className="text-[6.5px] text-slate-400">5 orders</span>
                        </div>
                      </div>
                      <span className="text-[6.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Regular
                      </span>
                    </div>

                    <div className="p-1 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-4.5 h-4.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[7px] flex items-center justify-center">
                          SK
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Sneha Kapoor</span>
                          <span className="text-[6.5px] text-slate-400">8 orders</span>
                        </div>
                      </div>
                      <span className="text-[6.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        VIP
                      </span>
                    </div>

                    <div className="p-1 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-4.5 h-4.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[7px] flex items-center justify-center">
                          AV
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Arjun Verma</span>
                          <span className="text-[6.5px] text-slate-400">3 orders</span>
                        </div>
                      </div>
                      <span className="text-[6.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        New
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. CARD: SHIPPING (Beside right edge: left 1065px, top 240px) */}
                <div
                  data-testid="card-shipping"
                  className="absolute top-[240px] left-[1065px] w-[210px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1.5 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                        <Truck className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[10.5px]">
                          {t('landing.systemCardShipping')}
                        </h4>
                        <p className="text-[7px] text-slate-400">Live Parcel Timeline</p>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                      Live
                    </span>
                  </div>

                  {/* Shipment Timeline */}
                  <div className="p-1 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[6.5px] font-mono text-slate-400">
                      <span>LZ-904128</span>
                      <span className="text-blue-600 font-bold">Express Transit</span>
                    </div>

                    <div className="grid grid-cols-4 gap-0.5 text-center relative pt-0.5">
                      {/* Progress Bar Line */}
                      <div className="absolute top-[8px] left-[12%] right-[12%] h-0.5 bg-slate-200 z-0">
                        <div className="h-full bg-emerald-500 w-[66%]" />
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-[6.5px] shadow-2xs">
                          ✓
                        </div>
                        <span className="text-[6px] font-bold text-slate-700 block">Ordered</span>
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-[6.5px] shadow-2xs">
                          ✓
                        </div>
                        <span className="text-[6px] font-bold text-slate-700 block">Packed</span>
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-[6.5px] shadow-sm animate-pulse">
                          <Truck className="w-2 h-2" />
                        </div>
                        <span className="text-[6px] font-extrabold text-blue-700 block">Transit</span>
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto text-[6.5px]">
                          •
                        </div>
                        <span className="text-[6px] font-semibold text-slate-400 block">Deliver</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. CARD: REVIEWS (Beside right edge: left 1065px, top 395px) */}
                <div
                  data-testid="card-reviews"
                  className="absolute top-[395px] left-[1065px] w-[210px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.07)] p-2.5 space-y-1 z-30 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[10.5px]">
                          {t('landing.systemCardReviews')}
                        </h4>
                        <p className="text-[7px] text-slate-400">Verified Ratings</p>
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                      ★ 4.8
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-center px-1">
                      <div className="text-sm font-black text-slate-900 leading-none">4.8</div>
                      <div className="flex justify-center text-amber-400 gap-0.5 mt-0.5">
                        {'★★★★★'.split('').map((s, i) => (
                          <span key={i} className="text-[7px] leading-none">★</span>
                        ))}
                      </div>
                      <span className="text-[6px] text-slate-400 block mt-0.5">342 reviews</span>
                    </div>

                    {/* Rating Distribution Bars */}
                    <div className="flex-1 space-y-0.5 text-[6.5px] font-medium text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5">5★</span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '82%' }} />
                        </div>
                        <span className="w-3.5 text-right font-mono text-[6px]">82%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5">4★</span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '14%' }} />
                        </div>
                        <span className="w-3.5 text-right font-mono text-[6px]">14%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5">3★</span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '3%' }} />
                        </div>
                        <span className="w-3.5 text-right font-mono text-[6px]">3%</span>
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

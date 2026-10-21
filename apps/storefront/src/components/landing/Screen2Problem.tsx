import React from 'react';
import {
  MessageCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Truck,
  ArrowRight,
  Layers,
  ExternalLink,
  Search,
  Bell,
  LayoutDashboard,
  TrendingUp,
  ArrowDown,
} from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { LetZshopLogo } from './LetZshopLogo';

export const Screen2Problem: React.FC = () => {
  const { t, locale } = useLandingI18n();

  return (
    <section
      id="problem"
      data-testid="screen2-problem"
      className="relative bg-[#FCFCFA] border-b border-slate-100 pt-16 sm:pt-20 pb-12 sm:pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden select-none"
    >
      {/* Background Subtle Atmospheric Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-orange-100/25 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-blue-100/25 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 lg:space-y-8">
        
        {/* Main Grid: Left copy (~36%), Right visual workspace (~64%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Problem Narrative (~36% width)             */}
          {/* ======================================================== */}
          <div className="space-y-6 lg:pr-2 max-w-[560px]">
            
            {/* Eyebrow */}
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase block">
              {t('landing.problemEyebrow')}
            </span>

            {/* Dominant Headline: clamp(54px, 4.1vw, 72px) with tight leading */}
            <h2 className="text-4xl sm:text-5xl lg:text-[clamp(52px,3.9vw,70px)] font-black text-slate-900 tracking-tight leading-[0.98]">
              {locale === 'en-IN' ? (
                <>
                  <span className="block">Selling online</span>
                  <span className="block mt-1">shouldn’t feel</span>
                  <span className="block mt-1 text-[#FF6B00]">this complicated.</span>
                </>
              ) : (
                <>
                  <span className="block">{t('landing.problemTitlePrefix')}</span>
                  <span className="text-[#FF6B00] block mt-1">{t('landing.problemTitleHighlight')}</span>
                </>
              )}
            </h2>

            {/* Description (19-21px) */}
            <p className="text-[18px] sm:text-[19px] lg:text-[20px] text-slate-600 leading-relaxed font-normal">
              {t('landing.problemSupporting')}
            </p>

            {/* Insight Callout Box: 1 order = multiple disconnected tasks (~520-560px) */}
            <div className="w-full max-w-[540px] p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/40 to-orange-50/70 border border-orange-200/90 flex items-start gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-orange-500/25">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                  1 order = <span className="text-[#FF6B00]">{locale === 'en-IN' ? 'multiple disconnected tasks' : t('landing.problemHighlight')}</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {t('landing.problemCalloutSub')}
                </p>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Contained MerchantProblemScene (~64%)     */}
          {/* ======================================================== */}
          <div className="relative w-full">
            
            {/* DESKTOP VIEWPORT (>= 1024px) */}
            <div
              data-testid="merchant-problem-scene"
              className="merchant-problem-scene hidden lg:block relative w-full max-w-[980px] h-[620px] select-none mx-auto"
            >
              
              {/* Soft Gradient Depth Ambient Layers */}
              <div className="absolute -top-4 -left-4 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-4 -right-4 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-4 -right-4 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />
              
              {/* Pale curved orange backdrop wash behind right scene */}
              <div className="absolute inset-x-6 top-6 bottom-6 bg-gradient-to-br from-orange-50/35 via-transparent to-amber-50/20 rounded-3xl pointer-events-none" />

              {/* Subtle Decorative Confetti / Accents */}
              <div className="absolute top-1 left-8 text-emerald-500/80 font-mono text-sm tracking-widest pointer-events-none select-none">
                \\
              </div>
              <div className="absolute top-1 right-10 text-purple-500/80 font-mono text-sm tracking-widest pointer-events-none select-none">
                //
              </div>

              {/* Floating Green Shopping Cart Badge (Left of monitor) */}
              <div className="absolute top-[38%] left-[2%] z-15 pointer-events-none">
                <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center text-emerald-600">
                  <svg className="w-4 h-4 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                </div>
              </div>

              {/* Floating Orange Box Badge (Right of monitor) */}
              <div className="absolute top-[38%] right-[2%] z-15 pointer-events-none">
                <div className="w-8 h-8 rounded-xl bg-white border border-orange-200 shadow-sm flex items-center justify-center text-[#FF6B00]">
                  <svg className="w-4 h-4 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                </div>
              </div>

              {/* ==================================================== */}
              {/* SVG ORANGE CONVERGENCE ARROWS                        */}
              {/* ==================================================== */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-15"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                fill="none"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="4"
                    markerHeight="4"
                    refX="2"
                    refY="2"
                    orient="auto"
                  >
                    <polygon points="0 0, 4 2, 0 4" fill="#FF6B00" />
                  </marker>
                </defs>

                {/* Top-Left: WhatsApp Orders -> Convergence Badge */}
                <path
                  d="M 39 15 C 43 18 46 22 47.8 24.5"
                  stroke="#FF6B00"
                  strokeWidth="0.85"
                  strokeDasharray="1.4 0.9"
                  strokeLinecap="round"
                />

                {/* Top-Right: Payment Screenshots -> Convergence Badge */}
                <path
                  d="M 61 15 C 57 18 54 22 52.2 24.5"
                  stroke="#FF6B00"
                  strokeWidth="0.85"
                  strokeDasharray="1.4 0.9"
                  strokeLinecap="round"
                />

                {/* Center Down Arrow: Badge -> Monitor Top Bezel */}
                <path
                  d="M 50 28.5 L 50 31"
                  stroke="#FF6B00"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                />

                {/* Down-Left Arc: Badge -> Monitor Top Left */}
                <path
                  d="M 48 28 C 45 29.5 41 30.5 38 31.2"
                  stroke="#FF6B00"
                  strokeWidth="0.75"
                  strokeDasharray="1.2 0.8"
                  strokeLinecap="round"
                />

                {/* Down-Right Arc: Badge -> Monitor Top Right */}
                <path
                  d="M 52 28 C 55 29.5 59 30.5 62 31.2"
                  stroke="#FF6B00"
                  strokeWidth="0.75"
                  strokeDasharray="1.2 0.8"
                  strokeLinecap="round"
                />
              </svg>

              {/* Central Convergence Circular Down-Arrow Badge (~52px) */}
              <div className="absolute top-[26%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-25 pointer-events-none">
                <div className="w-13 h-13 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-orange-500/35 border-2 border-white">
                  <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 1 (UPPER LEFT): WhatsApp Orders (~410px wide)   */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="problem-card-whatsapp"
                className="absolute top-[0%] left-[1.5%] w-[41%] max-w-[410px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_18px_40px_-10px_rgba(34,197,94,0.18),0_6px_16px_-4px_rgba(0,0,0,0.04)] p-3.5 space-y-2 z-20 transition-transform duration-300 hover:scale-[1.02] -rotate-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <MessageCircle className="w-4.5 h-4.5 fill-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-[13px] truncate">
                        {t('landing.problemCardWhatsapp')}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {t('landing.problemCardWhatsappSub')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">•••</span>
                </div>

                {/* WhatsApp Chat Rows */}
                <div className="space-y-1.5 pt-0.5 text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[8px] font-bold flex items-center justify-center">PM</span>
                        <span className="font-bold text-slate-800 text-[10px] truncate">Priya Mehta</span>
                        <span className="text-[8px] text-slate-400 ml-auto">11:24 AM</span>
                      </div>
                      <span className="text-slate-500 truncate block text-[9px] pl-5.5">Hi! Do you have this in stock?</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-[#25D366] text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1.5">3</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[8px] font-bold flex items-center justify-center">RS</span>
                        <span className="font-bold text-slate-800 text-[10px] truncate">Rohit Sharma</span>
                        <span className="text-[8px] text-slate-400 ml-auto">10:48 AM</span>
                      </div>
                      <span className="text-slate-500 truncate block text-[9px] pl-5.5">How much for 2 pieces?</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-[#25D366] text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1.5">1</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 text-[8px] font-bold flex items-center justify-center">SK</span>
                        <span className="font-bold text-slate-800 text-[10px] truncate">Sneha Kapoor</span>
                        <span className="text-[8px] text-slate-400 ml-auto">09:15 AM</span>
                      </div>
                      <span className="text-slate-500 truncate block text-[9px] pl-5.5">Can you share payment details?</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-[#25D366] text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1.5">4</span>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 2 (UPPER RIGHT): Payment Screenshots (~375px)   */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="problem-card-payment"
                className="absolute top-[0%] right-[1.5%] w-[38%] max-w-[380px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_18px_40px_-10px_rgba(99,102,241,0.18),0_6px_16px_-4px_rgba(0,0,0,0.04)] p-3.5 space-y-2 z-20 transition-transform duration-300 hover:scale-[1.02] rotate-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <ImageIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-[13px] truncate">
                        {t('landing.problemCardPayment')}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {t('landing.problemCardPaymentSub')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">•••</span>
                </div>

                {/* Screenshot Verification Box */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">
                    Paytm / UPI
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">₹1,299</div>
                  <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Payment Successful ✓
                  </span>
                  <div className="text-[9px] text-slate-500 flex items-center justify-between px-1 pt-1">
                    <span className="font-mono text-[8px] text-slate-400">UPI Ref: 112486759304</span>
                    <span className="text-slate-400 text-[8px]">11:24 AM</span>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CENTRAL DASHBOARD: Dominant Large Object (~700px)    */}
              {/* Position: top: 31%, centered, z-10                   */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="problem-card-dashboard"
                className="absolute top-[31%] left-1/2 -translate-x-1/2 w-[72%] max-w-[710px] z-10"
              >
                {/* Monitor Outer Dark Casing */}
                <div className="bg-slate-900 p-2 sm:p-2.5 rounded-2xl shadow-[0_28px_65px_-12px_rgba(15,23,42,0.30)] border-2 border-slate-800">
                  {/* Monitor Inner Screen Display */}
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
                    {/* Dashboard Top Header Bar */}
                    <div className="h-8.5 bg-slate-50/95 border-b border-slate-100 px-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LetZshopLogo size="sm" iconOnly />
                        <span className="font-extrabold text-[11px] text-slate-800">LetZshop</span>
                        <span className="text-[9px] font-mono text-slate-400">/ dashboard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] text-slate-400 w-28">
                          <Search className="w-2.5 h-2.5 text-slate-400" />
                          <span>Search orders...</span>
                        </div>
                        <div className="w-5.5 h-5.5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                          <Bell className="w-3 h-3" />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-5.5 h-5.5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                            S
                          </div>
                          <span className="text-[9px] font-bold text-slate-700">Store ▾</span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Body */}
                    <div className="p-3 grid grid-cols-12 gap-2.5 bg-white">
                      {/* Left Mini Sidebar */}
                      <div className="hidden sm:block sm:col-span-3 space-y-0.5 text-[9px] font-semibold text-slate-500 border-r border-slate-100 pr-2">
                        <div className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold flex items-center gap-1.5">
                          <LayoutDashboard className="w-3 h-3" />
                          <span>Dashboard</span>
                        </div>
                        <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Orders</div>
                        <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Products</div>
                        <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Customers</div>
                        <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Marketing</div>
                        <div className="px-2 py-0.5 hover:bg-slate-50 rounded">Analytics</div>
                      </div>

                      {/* Main Metrics Area */}
                      <div className="col-span-12 sm:col-span-9 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800">Overview</span>
                          <span className="text-[8px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            4 Disconnected Workflows
                          </span>
                        </div>

                        {/* 3 KPI Cards */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-medium">Total Sales</span>
                            <span className="text-[12px] sm:text-sm font-black text-slate-900 block mt-0.5">₹1,24,580</span>
                            <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" /> ↑ 28%
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-medium">Orders</span>
                            <span className="text-[12px] sm:text-sm font-black text-slate-900 block mt-0.5">243</span>
                            <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" /> ↑ 32%
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-medium">Customers</span>
                            <span className="text-[12px] sm:text-sm font-black text-slate-900 block mt-0.5">1,921</span>
                            <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" /> ↑ 18%
                            </span>
                          </div>
                        </div>

                        {/* Sales Growth Line Chart */}
                        <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-700">Sales Growth</span>
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 rounded">+32%</span>
                          </div>
                          <svg className="w-28 sm:w-32 h-5 text-blue-600" viewBox="0 0 120 20" fill="none">
                            <path
                              d="M 5,16 C 20,15 40,17 60,11 C 80,5 95,9 110,3 L 115,2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle cx="110" cy="3" r="2.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monitor Stand (Neck + Base) */}
                <div className="w-20 h-2.5 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b mx-auto shadow-xs" />
                <div className="w-32 h-1 bg-slate-800 rounded-full mx-auto shadow-xs" />
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 3 (LOWER LEFT): Stock Sheets (~355px)           */}
              {/* Overlaps dashboard lower-left corner by ~15%         */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="problem-card-stock"
                className="absolute bottom-[8%] left-[1.5%] w-[37%] max-w-[365px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_45px_-10px_rgba(16,185,129,0.20),0_6px_16px_-4px_rgba(0,0,0,0.04)] p-3 space-y-2 z-20 transition-transform duration-300 hover:scale-[1.02] -rotate-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7.5 h-7.5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs truncate">
                        {t('landing.problemCardStock')}
                      </h4>
                      <p className="text-[9px] text-slate-400 truncate">
                        {t('landing.problemCardStockSub')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">•••</span>
                </div>

                {/* Stock Table */}
                <div className="rounded-lg border border-slate-100 overflow-hidden text-[9px]">
                  <div className="grid grid-cols-4 bg-slate-100/90 font-bold text-slate-600 px-2 py-1">
                    <span>Product</span>
                    <span>SKU</span>
                    <span>Stock</span>
                    <span className="text-right">Update</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    <div className="grid grid-cols-4 px-2 py-1 items-center">
                      <span className="truncate font-medium text-slate-800">Perfume</span>
                      <span className="text-slate-400 font-mono text-[8px]">PF-001</span>
                      <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded inline-block text-center w-5">12</span>
                      <span className="text-right text-blue-600 cursor-pointer">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center bg-rose-50/40">
                      <span className="truncate font-bold text-rose-700">Moisturizer</span>
                      <span className="text-slate-400 font-mono text-[8px]">MO-002</span>
                      <span className="text-white font-black bg-rose-600 px-1 rounded inline-block text-center w-5">0</span>
                      <span className="text-right text-blue-600 cursor-pointer">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center">
                      <span className="truncate font-medium text-slate-800">Vitamin C</span>
                      <span className="text-slate-400 font-mono text-[8px]">VC-003</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded inline-block text-center w-5">27</span>
                      <span className="text-right text-blue-600 cursor-pointer">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center">
                      <span className="truncate font-medium text-slate-800">Sunscreen</span>
                      <span className="text-slate-400 font-mono text-[8px]">SS-005</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded inline-block text-center w-5">18</span>
                      <span className="text-right text-blue-600 cursor-pointer">✎</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 4 (LOWER RIGHT): Courier Portals (~365px)       */}
              {/* Overlaps dashboard lower-right corner by ~15%        */}
              {/* ---------------------------------------------------- */}
              <div
                data-testid="problem-card-courier"
                className="absolute bottom-[5%] right-[1.5%] w-[38%] max-w-[370px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_45px_-10px_rgba(249,115,22,0.20),0_6px_16px_-4px_rgba(0,0,0,0.04)] p-3 space-y-2 z-20 transition-transform duration-300 hover:scale-[1.02] rotate-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7.5 h-7.5 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs truncate">
                        {t('landing.problemCardShipping')}
                      </h4>
                      <p className="text-[9px] text-slate-400 truncate">
                        {t('landing.problemCardShippingSub')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">•••</span>
                </div>

                {/* Logistics Tabs & Orders */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-1.5 text-[8px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white">Delhivery</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Blue Dart</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">DTDC</span>
                  </div>

                  <div className="space-y-1 text-[9px]">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#DLV123456</span>
                      <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold text-[8px]">In Transit</span>
                      <ExternalLink className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#BLD789012</span>
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold text-[8px]">Picked Up</span>
                      <ExternalLink className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#DTDC341299</span>
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold text-[8px]">Delayed</span>
                      <ExternalLink className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* TABLET VIEWPORT (640px – 1023px) */}
            <div className="hidden sm:block lg:hidden space-y-6 pt-4">
              {/* Central Dashboard First */}
              <div
                data-testid="problem-dashboard-tablet"
                className="w-full max-w-[520px] mx-auto bg-white rounded-2xl p-3.5 shadow-lg border border-slate-200"
              >
                <div className="flex items-center justify-between border-b pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <LetZshopLogo size="sm" iconOnly />
                    <span className="text-xs font-bold">LetZshop</span>
                  </div>
                  <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    4 Disconnected Workflows
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-center">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-bold">₹1,24,580</div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-bold">243 Orders</div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-bold">1,921 Users</div>
                </div>
              </div>

              {/* 2-Column Staged Cards */}
              <div className="grid grid-cols-2 gap-4 max-w-[620px] mx-auto">
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 fill-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{t('landing.problemCardWhatsapp')}</h5>
                    <p className="text-[10px] text-slate-500">{t('landing.problemCardWhatsappSub')}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{t('landing.problemCardPayment')}</h5>
                    <p className="text-[10px] text-slate-500">{t('landing.problemCardPaymentSub')}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{t('landing.problemCardStock')}</h5>
                    <p className="text-[10px] text-slate-500">{t('landing.problemCardStockSub')}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{t('landing.problemCardShipping')}</h5>
                    <p className="text-[10px] text-slate-500">{t('landing.problemCardShippingSub')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE VIEWPORT (< 640px) */}
            <div className="sm:hidden space-y-4 pt-3">
              {/* Dashboard summary card */}
              <div className="w-full max-w-[340px] mx-auto bg-white rounded-xl p-2.5 shadow-md border border-slate-200">
                <div className="flex items-center justify-between border-b pb-1">
                  <div className="flex items-center gap-1">
                    <LetZshopLogo size="sm" iconOnly />
                    <span className="text-[10px] font-bold">LetZshop</span>
                  </div>
                  <span className="text-[8px] text-rose-600 bg-rose-50 px-1 rounded">4 Fragmented Apps</span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1.5 text-[8px] text-center">
                  <div className="bg-slate-50 p-1 rounded font-bold">₹1,24,580</div>
                  <div className="bg-slate-50 p-1 rounded font-bold">243 Orders</div>
                  <div className="bg-slate-50 p-1 rounded font-bold">1,921 Users</div>
                </div>
              </div>

              {/* 1-column staged list for mobile */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{t('landing.problemCardWhatsapp')}</h5>
                    <p className="text-[9px] text-slate-500">{t('landing.problemCardWhatsappSub')}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{t('landing.problemCardPayment')}</h5>
                    <p className="text-[9px] text-slate-500">{t('landing.problemCardPaymentSub')}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{t('landing.problemCardStock')}</h5>
                    <p className="text-[9px] text-slate-500">{t('landing.problemCardStockSub')}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{t('landing.problemCardShipping')}</h5>
                    <p className="text-[9px] text-slate-500">{t('landing.problemCardShippingSub')}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* BOTTOM TRANSITION BANNER (Lead-in to Screen 3)           */}
        {/* ======================================================== */}
        <div className="pt-2 flex justify-center">
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-3 w-full max-w-[560px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white border border-slate-200/90 shadow-md hover:shadow-lg hover:border-orange-300 transition-all group active:scale-[0.99]"
          >
            <LetZshopLogo size="sm" iconOnly />
            <span className="text-sm sm:text-base font-black text-slate-900">
              {t('landing.problemTransitionLead')}{' '}
              <span className="text-[#FF6B00] font-black">
                {t('landing.problemTransitionHighlight')}
              </span>
            </span>
            <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-xs">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>

      </div>
    </section>
  );
};

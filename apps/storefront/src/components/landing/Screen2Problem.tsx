import React from 'react';
import { MessageCircle, FileSpreadsheet, Image as ImageIcon, Truck, ArrowRight, Layers, ExternalLink } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { LetZshopLogo } from './LetZshopLogo';

export const Screen2Problem: React.FC = () => {
  const { t, locale } = useLandingI18n();

  return (
    <section id="merchant-problem" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#FCFCFA] border-b border-slate-100 relative overflow-hidden">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 right-1/4 w-[600px] h-[600px] bg-orange-100/35 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-[650px] h-[650px] bg-blue-100/35 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1480px] mx-auto space-y-16">
        
        {/* Main Grid: Left copy (~40%), Right visual workspace (~60%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Problem Narrative (~40% width)             */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Small Eyebrow */}
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase block">
              {t('landing.problemEyebrow')}
            </span>

            {/* Headline with 2 distinct lines matching Reference 4 */}
            <h2 className="text-[26px] sm:text-4xl lg:text-[44px] xl:text-[50px] font-black text-slate-900 tracking-tight leading-[1.06]">
              {locale === 'en-IN' ? (
                <>
                  <span className="block sm:whitespace-nowrap">Selling online shouldn’t</span>
                  <span className="block mt-1 sm:whitespace-nowrap">
                    feel <span className="text-orange-500">this complicated.</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="block">{t('landing.problemTitlePrefix')}</span>
                  <span className="text-orange-500 block mt-1">{t('landing.problemTitleHighlight')}</span>
                </>
              )}
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg lg:text-[18px] text-slate-600 leading-relaxed font-normal">
              {t('landing.problemSupporting')}
            </p>

            {/* Premium Insight Callout Box: 1 order = multiple disconnected tasks */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/50 to-orange-50/70 border border-orange-200/90 flex items-start gap-3.5 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-orange-500/25">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                  1 order = <span className="text-orange-600">multiple disconnected tasks</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {t('landing.problemCalloutSub')}
                </p>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: MerchantChaosScene Visual (~60% width)     */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 relative">
            
            {/* DESKTOP & TABLET VIEWPORT (>= 640px) */}
            <div className="hidden sm:flex relative w-full min-h-[580px] sm:min-h-[640px] md:min-h-[680px] select-none items-end justify-center pb-4 sm:pb-6">
              
              {/* Desk surface ambient table plane across the bottom */}
              <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-stone-200/60 via-stone-100/30 to-transparent border-t border-stone-200/50 pointer-events-none rounded-2xl" />

              {/* Ambient Peripheral Scene Objects matching Reference 4 */}
              {/* Plant leaves in upper-left background */}
              <div className="hidden lg:block absolute top-2 left-0 w-36 h-40 pointer-events-none -z-0 opacity-40">
                <svg viewBox="0 0 140 140" className="w-full h-full text-emerald-800" fill="currentColor">
                  <path d="M20 120 Q 50 60 100 20" stroke="#047857" strokeWidth="2.5" fill="none" />
                  <ellipse cx="50" cy="70" rx="18" ry="28" transform="rotate(-30 50 70)" fill="#059669" opacity="0.75" />
                  <ellipse cx="80" cy="45" rx="16" ry="24" transform="rotate(25 80 45)" fill="#10B981" opacity="0.7" />
                  <ellipse cx="35" cy="95" rx="16" ry="22" transform="rotate(-40 35 95)" fill="#047857" opacity="0.75" />
                </svg>
              </div>

              {/* Cardboard Packaging Box on left periphery */}
              <div className="hidden xl:block absolute bottom-10 -left-6 w-20 h-16 bg-amber-200/70 rounded border border-amber-300 shadow-sm opacity-60 blur-[0.3px] pointer-events-none -rotate-6">
                <div className="w-full h-3 bg-amber-300/80 mt-6" />
              </div>

              {/* White Ceramic Coffee Mug on right desk edge with LetZshop logo */}
              <div className="hidden xl:flex absolute bottom-6 right-0 items-center pointer-events-none z-30 opacity-80">
                <div className="w-12 h-14 bg-white rounded-b-2xl border-t-2 border-stone-300 relative shadow-md p-1.5 flex flex-col items-center justify-center">
                  <LetZshopLogo size="sm" iconOnly className="h-4" />
                  <span className="text-[7px] font-bold text-slate-700 font-sans tracking-tight">LetZshop</span>
                  <div className="absolute top-2 -right-3 w-3.5 h-6 border-2 border-stone-300 rounded-r-full" />
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CENTRAL LAPTOP: Resting in lower-center on the desk  */}
              {/* Rendered first so overlapping cards sit on top       */}
              {/* ---------------------------------------------------- */}
              <div className="relative w-[340px] sm:w-[440px] md:w-[500px] lg:w-[480px] xl:w-[540px] bg-slate-900 rounded-2xl p-2.5 sm:p-3 shadow-[0_32px_70px_-15px_rgba(15,23,42,0.45)] border border-slate-700/80 z-10 transition-transform duration-300 mb-2">
                {/* Camera dot */}
                <div className="flex justify-center pb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700 ring-1 ring-slate-600/50" />
                </div>

                {/* Screen showing full merchant dashboard matching Reference 4 */}
                <div className="w-full bg-white rounded-lg overflow-hidden border border-slate-200 relative p-2 sm:p-2.5 flex flex-col justify-between">
                  {/* Top Bar of Central Screen */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <LetZshopLogo size="sm" iconOnly />
                      <span className="text-[10px] font-black text-slate-900">LetZshop</span>
                      <span className="text-[8px] font-mono text-slate-400">/ dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        4 Disconnected Workflows
                      </span>
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center">
                        S
                      </div>
                    </div>
                  </div>

                  {/* Overview Stats Bar */}
                  <div className="grid grid-cols-3 gap-1.5 py-1.5">
                    <div className="p-1 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[7px] text-slate-400 block font-medium">Total Sales</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-900 block">₹1,24,580</span>
                      <span className="text-[7px] text-emerald-600 font-bold">↑ 28%</span>
                    </div>
                    <div className="p-1 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[7px] text-slate-400 block font-medium">Orders</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-900 block">243</span>
                      <span className="text-[7px] text-emerald-600 font-bold">↑ 32%</span>
                    </div>
                    <div className="p-1 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[7px] text-slate-400 block font-medium">Customers</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-900 block">1,921</span>
                      <span className="text-[7px] text-emerald-600 font-bold">↑ 18%</span>
                    </div>
                  </div>

                  {/* Recent Orders table inside laptop */}
                  <div className="rounded border border-slate-100 overflow-hidden text-[8px] mt-0.5">
                    <div className="grid grid-cols-4 bg-slate-100/80 font-bold text-slate-600 px-1.5 py-0.5">
                      <span>Customer</span>
                      <span>Product</span>
                      <span>Amount</span>
                      <span className="text-right">Status</span>
                    </div>
                    <div className="divide-y divide-slate-100 bg-white">
                      <div className="grid grid-cols-4 px-1.5 py-0.5 items-center">
                        <span className="truncate font-medium text-slate-800">Priya Mehta</span>
                        <span className="text-slate-500 truncate">Face Serum</span>
                        <span className="font-bold text-slate-900">₹1,299</span>
                        <span className="text-right text-emerald-700 font-bold">Paid</span>
                      </div>
                      <div className="grid grid-cols-4 px-1.5 py-0.5 items-center">
                        <span className="truncate font-medium text-slate-800">Rohit Sharma</span>
                        <span className="text-slate-500 truncate">Night Cream</span>
                        <span className="font-bold text-slate-900">₹899</span>
                        <span className="text-right text-blue-700 font-bold">Processing</span>
                      </div>
                      <div className="grid grid-cols-4 px-1.5 py-0.5 items-center">
                        <span className="truncate font-medium text-slate-800">Sneha Kapoor</span>
                        <span className="text-slate-500 truncate">Vitamin C</span>
                        <span className="font-bold text-slate-900">₹1,499</span>
                        <span className="text-right text-blue-700 font-bold">Shipped</span>
                      </div>
                      <div className="grid grid-cols-4 px-1.5 py-0.5 items-center">
                        <span className="truncate font-medium text-slate-800">Aman Verma</span>
                        <span className="text-slate-500 truncate">Moisturizer</span>
                        <span className="font-bold text-slate-900">₹799</span>
                        <span className="text-right text-emerald-700 font-bold">Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laptop Base Lip / Notch */}
                <div className="h-2 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 rounded-b mt-1.5 flex justify-center">
                  <div className="w-16 h-1 bg-slate-900 rounded-b" />
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 1 (TOP LEFT): WhatsApp Orders                   */}
              {/* ---------------------------------------------------- */}
              <div className="absolute top-2 sm:top-4 left-0 sm:left-2 md:left-4 lg:-left-2 xl:left-2 w-[255px] sm:w-[290px] md:w-[325px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_45px_-10px_rgba(34,197,94,0.22),0_10px_20px_-5px_rgba(0,0,0,0.06)] p-3 sm:p-4 space-y-2 z-20 -rotate-2 transition-transform duration-300 hover:rotate-0 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MessageCircle className="w-4 h-4 fill-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-[13px] truncate">
                        {t('landing.problemCardWhatsapp')}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                        {t('landing.problemCardWhatsappSub')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">•••</span>
                </div>

                {/* Chat items list matching Reference 4 */}
                <div className="space-y-1.5 pt-1 text-[10px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[8px] font-bold flex items-center justify-center">PM</span>
                        <span className="font-bold text-slate-800 text-[10px] truncate">Priya Mehta</span>
                        <span className="text-[8px] text-slate-400 ml-auto">11:24 AM</span>
                      </div>
                      <span className="text-slate-500 truncate block text-[9px] pl-5">Hi! Do you have this in stock?</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">3</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[8px] font-bold flex items-center justify-center">RS</span>
                        <span className="font-bold text-slate-800 text-[10px] truncate">Rohit Sharma</span>
                        <span className="text-[8px] text-slate-400 ml-auto">10:48 AM</span>
                      </div>
                      <span className="text-slate-500 truncate block text-[9px] pl-5">How much for 2 pieces?</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">1</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 hidden sm:flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 text-[8px] font-bold flex items-center justify-center">SK</span>
                        <span className="font-bold text-slate-800 text-[10px] truncate">Sneha Kapoor</span>
                        <span className="text-[8px] text-slate-400 ml-auto">9:12 AM</span>
                      </div>
                      <span className="text-slate-500 truncate block text-[9px] pl-5">Can you share payment details?</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">4</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 hidden md:flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[8px] font-bold flex items-center justify-center">#</span>
                        <span className="font-bold text-slate-800 text-[10px] truncate">+91 98765 43210</span>
                        <span className="text-[8px] text-slate-400 ml-auto">Yesterday</span>
                      </div>
                      <span className="text-slate-500 truncate block text-[9px] pl-5">I've placed the order 👍</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">2</span>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 2 (TOP RIGHT): Payment Screenshots              */}
              {/* ---------------------------------------------------- */}
              <div className="absolute top-2 sm:top-4 right-0 sm:right-2 md:right-4 lg:-right-2 xl:right-2 w-[245px] sm:w-[275px] md:w-[310px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_45px_-10px_rgba(99,102,241,0.22),0_10px_20px_-5px_rgba(0,0,0,0.06)] p-3 sm:p-4 space-y-2 z-20 rotate-2 transition-transform duration-300 hover:rotate-0 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-[13px] truncate">
                        {t('landing.problemCardPayment')}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                        {t('landing.problemCardPaymentSub')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">•••</span>
                </div>

                {/* Screenshot Box matching Reference 4 */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1.5">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">
                    Paytm / UPI
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900">₹1,299</div>
                  <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Payment Successful ✓
                  </span>
                  <div className="text-[9px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs mt-1">
                    "Please confirm this payment 🙏" <span className="text-slate-400 text-[8px]">11:24 AM</span>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 3 (MID LEFT): Stock Sheets (Overlaps Laptop)    */}
              {/* ---------------------------------------------------- */}
              <div className="absolute bottom-16 sm:bottom-20 -left-3 sm:-left-1 md:left-1 lg:-left-4 xl:left-0 w-[255px] sm:w-[290px] md:w-[325px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_22px_45px_-10px_rgba(16,185,129,0.22),0_10px_20px_-5px_rgba(0,0,0,0.06)] p-3 sm:p-4 space-y-2 z-20 rotate-2 transition-transform duration-300 hover:rotate-0 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-[13px] truncate">
                        {t('landing.problemCardStock')}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                        {t('landing.problemCardStockSub')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">•••</span>
                </div>

                {/* Mini Stock Sheet Table */}
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
                      <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded inline-block text-center w-6">12</span>
                      <span className="text-right text-blue-600">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center bg-rose-50/50">
                      <span className="truncate font-bold text-rose-700">Moisturizer</span>
                      <span className="text-slate-400 font-mono text-[8px]">MO-002</span>
                      <span className="text-white font-black bg-rose-600 px-1 rounded inline-block text-center w-6">0</span>
                      <span className="text-right text-blue-600">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center">
                      <span className="truncate font-medium text-slate-800">Vitamin C</span>
                      <span className="text-slate-400 font-mono text-[8px]">VC-003</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded inline-block text-center w-6">27</span>
                      <span className="text-right text-blue-600">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center">
                      <span className="truncate font-medium text-slate-800">Night Cream</span>
                      <span className="text-slate-400 font-mono text-[8px]">NC-004</span>
                      <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded inline-block text-center w-6">5</span>
                      <span className="text-right text-blue-600">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center">
                      <span className="truncate font-medium text-slate-800">Sunscreen</span>
                      <span className="text-slate-400 font-mono text-[8px]">SS-005</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded inline-block text-center w-6">18</span>
                      <span className="text-right text-blue-600">✎</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 4 (MID RIGHT): Courier Portals (Overlaps Laptop)*/}
              {/* ---------------------------------------------------- */}
              <div className="absolute bottom-16 sm:bottom-20 -right-3 sm:-right-1 md:right-1 lg:-right-4 xl:right-0 w-[255px] sm:w-[290px] md:w-[325px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_22px_45px_-10px_rgba(249,115,22,0.22),0_10px_20px_-5px_rgba(0,0,0,0.06)] p-3 sm:p-4 space-y-2 z-20 -rotate-2 transition-transform duration-300 hover:rotate-0 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-[13px] truncate">
                        {t('landing.problemCardShipping')}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                        {t('landing.problemCardShippingSub')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">•••</span>
                </div>

                {/* Logistics Tabs & Orders matching Reference 4 */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-1 text-[8px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white">Delhivery</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Blue Dart</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">DTDC</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Amazon</span>
                  </div>

                  <div className="space-y-1 text-[9px]">
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#DLV123456</span>
                      <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold text-[8px]">In Transit</span>
                      <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                    </div>
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#BLD789012</span>
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold text-[8px]">Picked Up</span>
                      <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                    </div>
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#DTDC341299</span>
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold text-[8px]">Delayed</span>
                      <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                    </div>
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#AMZ556677</span>
                      <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[8px]">Booked</span>
                      <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* PROMINENT ORANGE CONNECTOR ARROWS & CHAOS COIL (z-30)    */}
              {/* ======================================================== */}
              <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 640 580" fill="none">
                  {/* Top-Left Arrow: WhatsApp Orders -> Laptop Center */}
                  <path
                    d="M 210 170 C 260 200, 290 240, 305 310"
                    stroke="#F97316"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                    strokeLinecap="round"
                  />
                  <polygon points="305,310 297,302 308,303" fill="#F97316" />

                  {/* Top-Right Arrow: Payment Screenshots -> Laptop Center */}
                  <path
                    d="M 440 170 C 390 200, 360 240, 345 310"
                    stroke="#F97316"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                    strokeLinecap="round"
                  />
                  <polygon points="345,310 342,303 353,302" fill="#F97316" />

                  {/* Mid-Left Arrow: Stock Sheets -> Laptop */}
                  <path
                    d="M 180 370 C 230 360, 265 340, 285 330"
                    stroke="#F97316"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                    strokeLinecap="round"
                  />
                  <polygon points="285,330 275,327 281,336" fill="#F97316" />

                  {/* Mid-Right Arrow: Courier Portals -> Laptop */}
                  <path
                    d="M 470 370 C 420 360, 385 340, 365 330"
                    stroke="#F97316"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                    strokeLinecap="round"
                  />
                  <polygon points="365,330 369,336 375,327" fill="#F97316" />

                  {/* Central playful orange chaos scribble / tangle */}
                  <path
                    d="M 315 250 Q 330 235 340 252 Q 352 270 330 278 Q 305 265 320 243 Q 338 230 348 252 Q 355 272 335 280"
                    stroke="#EA580C"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.95"
                  />
                </svg>
              </div>

            </div>

            {/* MOBILE VIEWPORT (< 640px) */}
            {/* Clean staged representation as required by Section 9 */}
            <div className="sm:hidden space-y-6 pt-4">
              {/* Laptop Centered First */}
              <div className="w-full max-w-[340px] mx-auto bg-slate-900 rounded-2xl p-2.5 shadow-xl border border-slate-700">
                <div className="flex justify-center pb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>
                <div className="w-full bg-white rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center justify-between border-b pb-1">
                    <div className="flex items-center gap-1">
                      <LetZshopLogo size="sm" iconOnly />
                      <span className="text-[10px] font-bold">LetZshop</span>
                    </div>
                    <span className="text-[8px] text-rose-600 bg-rose-50 px-1 rounded">4 Fragmented Apps</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[8px] text-center">
                    <div className="bg-slate-50 p-1 rounded font-bold">₹1,24,580</div>
                    <div className="bg-slate-50 p-1 rounded font-bold">243 Orders</div>
                    <div className="bg-slate-50 p-1 rounded font-bold">1,921 Users</div>
                  </div>
                </div>
              </div>

              {/* Staged 2x2 cards on mobile for readability */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                {/* 1. WhatsApp Card */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 fill-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">WhatsApp Orders</h5>
                    <p className="text-[10px] text-slate-500">Unread order chats & manual follow-ups</p>
                  </div>
                </div>

                {/* 2. Payment Screenshots Card */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">Payment Screenshots</h5>
                    <p className="text-[10px] text-slate-500">Manual UPI screenshot verification</p>
                  </div>
                </div>

                {/* 3. Stock Sheets Card */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">Stock Spreadsheets</h5>
                    <p className="text-[10px] text-slate-500">Quantity mismatches & manual inventory</p>
                  </div>
                </div>

                {/* 4. Courier Card */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900">Courier Portals</h5>
                    <p className="text-[10px] text-slate-500">Multiple logistics tabs & tracking chaos</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* BOTTOM TRANSITION BANNER (Direct lead-in to Screen 3)    */}
        {/* ======================================================== */}
        <div className="pt-4 flex justify-center">
          <a
            href="#features"
            className="inline-flex items-center gap-3.5 px-7 py-4 rounded-full bg-white border border-slate-200/90 shadow-lg hover:shadow-xl hover:border-orange-300 transition-all group active:scale-[0.99]"
          >
            <LetZshopLogo size="sm" iconOnly />
            <span className="text-sm sm:text-base font-black text-slate-900">
              {t('landing.problemTransitionLead')}{' '}
              <span className="text-orange-500 font-black">
                {t('landing.problemTransitionHighlight')}
              </span>
            </span>
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-xs">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>

      </div>
    </section>
  );
};

import React from 'react';
import { MessageCircle, FileSpreadsheet, Image as ImageIcon, Truck, ArrowRight, Layers, ExternalLink, ArrowDown } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { LetZshopLogo } from './LetZshopLogo';

export const Screen2Problem: React.FC = () => {
  const { t } = useLandingI18n();

  return (
    <section id="merchant-problem" className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-10 w-96 h-96 bg-orange-50/50 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-50/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto space-y-14">
        
        {/* Main Grid: Left copy, Right visual storytelling */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Problem Narrative (~40% width)             */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Small Eyebrow */}
            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase block">
              {t('landing.problemEyebrow')}
            </span>

            {/* Headline with "this complicated." in LetZshop orange */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
              {t('landing.problemTitlePrefix')}{' '}
              <span className="text-orange-500 inline-block">
                {t('landing.problemTitleHighlight')}
              </span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              {t('landing.problemSupporting')}
            </p>

            {/* Compact Callout Box: 1 order = multiple disconnected tasks */}
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Layers className="w-5 h-5 text-orange-600" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  1 order = <span className="text-orange-600">multiple disconnected tasks</span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {t('landing.problemCalloutSub')}
                </p>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Visual Arrangement Around Central Laptop   */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 relative">
            <div className="relative w-full min-h-[480px] sm:min-h-[520px] md:min-h-[540px] bg-slate-50/50 rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs overflow-hidden flex items-center justify-center">
              
              {/* Subtle Chaos Swirl & Connector Arrows Background */}
              <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                <svg className="w-full h-full text-orange-400/70" viewBox="0 0 600 500" fill="none">
                  {/* Top-Left Arrow (WhatsApp -> Laptop) */}
                  <path d="M 180 140 C 230 160, 260 200, 275 230" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
                  <polygon points="275,230 270,221 280,224" fill="currentColor" />

                  {/* Top-Right Arrow (Payment -> Laptop) */}
                  <path d="M 420 140 C 370 160, 340 200, 325 230" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
                  <polygon points="325,230 320,224 330,221" fill="currentColor" />

                  {/* Bottom-Left Arrow (Stock -> Laptop) */}
                  <path d="M 180 370 C 220 350, 255 310, 270 280" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
                  <polygon points="270,280 265,289 275,286" fill="currentColor" />

                  {/* Bottom-Right Arrow (Courier -> Laptop) */}
                  <path d="M 420 370 C 380 350, 345 310, 330 280" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
                  <polygon points="330,280 325,286 335,289" fill="currentColor" />

                  {/* Central playful scribble representing hustle / overload */}
                  <path
                    d="M 285 240 Q 295 230 305 245 Q 315 260 295 265 Q 275 255 290 235 Q 310 225 320 245"
                    stroke="#F97316"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.8"
                  />
                </svg>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 1 (TOP LEFT): WhatsApp Orders                   */}
              {/* ---------------------------------------------------- */}
              <div className="absolute top-3 left-2 sm:left-4 w-[230px] sm:w-[260px] bg-white rounded-2xl border border-slate-200 shadow-md p-3 space-y-2 z-20 transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageCircle className="w-4 h-4 fill-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-xs truncate">
                      {t('landing.problemCardWhatsapp')}
                    </h4>
                    <p className="text-[9px] text-slate-400 truncate">
                      {t('landing.problemCardWhatsappSub')}
                    </p>
                  </div>
                </div>

                {/* Chat items list */}
                <div className="space-y-1.5 pt-1 text-[10px]">
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block text-[10px] truncate">Priya Mehta</span>
                      <span className="text-slate-500 truncate block text-[9px]">Hi! Do you have this in stock?</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">3</span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block text-[10px] truncate">Rohit Sharma</span>
                      <span className="text-slate-500 truncate block text-[9px]">How much for 2 pieces?</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">1</span>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 2 (TOP RIGHT): Payment Screenshots              */}
              {/* ---------------------------------------------------- */}
              <div className="absolute top-3 right-2 sm:right-4 w-[215px] sm:w-[245px] bg-white rounded-2xl border border-slate-200 shadow-md p-3 space-y-2 z-20 transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-xs truncate">
                      {t('landing.problemCardPayment')}
                    </h4>
                    <p className="text-[9px] text-slate-400 truncate">
                      {t('landing.problemCardPaymentSub')}
                    </p>
                  </div>
                </div>

                {/* Screenshot Box */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
                  <div className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">
                    Paytm / UPI
                  </div>
                  <div className="text-sm font-black text-slate-900">₹1,299</div>
                  <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Payment Successful ✓
                  </span>
                  <p className="text-[9px] text-slate-500 italic pt-0.5">
                    "Please confirm this payment 🙏"
                  </p>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CENTRAL LAPTOP: The Overwhelmed Merchant Screen       */}
              {/* ---------------------------------------------------- */}
              <div className="relative w-[280px] sm:w-[320px] md:w-[340px] bg-slate-900 rounded-2xl p-2.5 shadow-2xl border border-slate-300 z-30 transition-transform duration-300">
                {/* Camera dot */}
                <div className="flex justify-center pb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>

                {/* Screen with fragmented overlapping windows */}
                <div className="w-full h-40 sm:h-44 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative p-2 flex flex-col justify-between">
                  {/* Top Bar of Central Screen */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <div className="flex items-center gap-1.5">
                      <LetZshopLogo size="sm" iconOnly />
                      <span className="text-[9px] font-bold text-slate-800">Merchant Operations</span>
                    </div>
                    <span className="text-[8px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      4 Disconnected Apps
                    </span>
                  </div>

                  {/* Overlapping mini app windows simulation */}
                  <div className="relative w-full h-full mt-1.5">
                    {/* Window 1: Orders */}
                    <div className="absolute top-0 left-0 w-44 bg-white rounded-md border border-slate-200 shadow-xs p-1.5 space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-bold text-slate-700 border-b border-slate-100 pb-0.5">
                        <span>Recent Orders</span>
                        <span className="text-emerald-600">Pending</span>
                      </div>
                      <div className="text-[8px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between"><span>Priya M.</span><span>₹1,299</span></div>
                        <div className="flex justify-between"><span>Rohit S.</span><span>₹899</span></div>
                      </div>
                    </div>

                    {/* Window 2: Courier Portal overlapping */}
                    <div className="absolute bottom-1 right-0 w-40 bg-white rounded-md border border-slate-200 shadow-sm p-1.5 space-y-1 z-10">
                      <div className="flex justify-between items-center text-[8px] font-bold text-slate-700 border-b border-slate-100 pb-0.5">
                        <span>Logistics Portal</span>
                        <span className="text-amber-600">In Transit</span>
                      </div>
                      <div className="text-[8px] font-mono text-slate-500">
                        #DLV123456 • Delhivery
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laptop Hinge & Base */}
                <div className="h-1.5 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-b mt-1 flex justify-center">
                  <div className="w-12 h-1 bg-slate-900 rounded-b" />
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 3 (BOTTOM LEFT): Stock Sheets                   */}
              {/* ---------------------------------------------------- */}
              <div className="absolute bottom-2 left-2 sm:left-4 w-[230px] sm:w-[260px] bg-white rounded-2xl border border-slate-200 shadow-md p-3 space-y-2 z-20 transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
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

                {/* Mini Stock Sheet Table */}
                <div className="rounded-lg border border-slate-100 overflow-hidden text-[9px]">
                  <div className="grid grid-cols-4 bg-slate-100/90 font-bold text-slate-600 px-2 py-1">
                    <span>Product</span>
                    <span>SKU</span>
                    <span>Stock</span>
                    <span className="text-right">Action</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    <div className="grid grid-cols-4 px-2 py-1 items-center">
                      <span className="truncate font-medium text-slate-800">Face Serum</span>
                      <span className="text-slate-400 font-mono text-[8px]">FS-001</span>
                      <span className="text-emerald-600 font-bold">12</span>
                      <span className="text-right text-blue-600">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center bg-rose-50/40">
                      <span className="truncate font-medium text-slate-800">Moisturizer</span>
                      <span className="text-slate-400 font-mono text-[8px]">MO-002</span>
                      <span className="text-rose-600 font-black">0</span>
                      <span className="text-right text-blue-600">✎</span>
                    </div>
                    <div className="grid grid-cols-4 px-2 py-1 items-center">
                      <span className="truncate font-medium text-slate-800">Vitamin C</span>
                      <span className="text-slate-400 font-mono text-[8px]">VC-003</span>
                      <span className="text-emerald-600 font-bold">27</span>
                      <span className="text-right text-blue-600">✎</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CARD 4 (BOTTOM RIGHT): Courier Portals               */}
              {/* ---------------------------------------------------- */}
              <div className="absolute bottom-2 right-2 sm:right-4 w-[220px] sm:w-[250px] bg-white rounded-2xl border border-slate-200 shadow-md p-3 space-y-2 z-20 transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
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

                {/* Logistics Tabs & Orders */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-1 text-[8px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white">Delhivery</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">BlueDart</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">DTDC</span>
                  </div>

                  <div className="space-y-1 text-[9px]">
                    <div className="p-1 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#DLV123456</span>
                      <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold text-[8px]">In Transit</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                    <div className="p-1 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-slate-600">#BLD789012</span>
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold text-[8px]">Picked Up</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* BOTTOM TRANSITION BANNER (Direct lead-in to Screen 3)    */}
        {/* ======================================================== */}
        <div className="pt-2 flex justify-center">
          <a
            href="#features"
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white border border-slate-200/90 shadow-md hover:shadow-lg hover:border-orange-300 transition-all group active:scale-[0.99]"
          >
            <LetZshopLogo size="sm" iconOnly />
            <span className="text-xs sm:text-sm font-black text-slate-900">
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

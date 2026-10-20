import React from 'react';
import { MessageSquare, FileSpreadsheet, Receipt, Truck, ArrowDown, AlertTriangle, Layers, Laptop } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

export const Screen2Problem: React.FC = () => {
  const { t } = useLandingI18n();

  return (
    <section id="merchant-problem" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Main Grid: Left copy, Right visual arrangement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Problem Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold tracking-wide">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{t('landing.problemEyebrow')}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {t('landing.problemTitle')}
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {t('landing.problemSupporting')}
            </p>

            {/* Pain Highlight Box */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-black text-sm">
                !
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  {t('landing.problemHighlight')}
                </span>
                <span className="text-xs text-slate-600">
                  Wasting hours every day switching between disconnected apps and notebooks.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Arrangement of Disconnected Tools */}
          <div className="lg:col-span-7 relative">
            <div className="relative p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm">
              {/* Central Laptop Hub in Centre */}
              <div className="max-w-xs mx-auto mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center space-y-2 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
                  <Laptop className="w-5 h-5 text-slate-700" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">The Merchant's Daily Hustle</h4>
                <p className="text-[11px] text-slate-500">Overwhelmed juggling 4 separate tools for every single customer order</p>
              </div>

              {/* 4 Surrounding Disconnected Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. WhatsApp Customer Enquiries */}
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{t('landing.problemEnquiryTitle')}</h4>
                      <span className="text-[10px] text-rose-600 font-semibold">Chaotic chat threads</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('landing.problemEnquiryDesc')}
                  </p>
                  <div className="p-2 rounded bg-slate-50 text-[10px] text-slate-600 font-mono border border-slate-100">
                    "Is size L available? What is best price?"
                  </div>
                </div>

                {/* 2. Payment Confirmation & Screenshots */}
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{t('landing.problemPaymentTitle')}</h4>
                      <span className="text-[10px] text-rose-600 font-semibold">Manual UTR matching</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('landing.problemPaymentDesc')}
                  </p>
                  <div className="p-2 rounded bg-slate-50 text-[10px] text-slate-600 font-mono border border-slate-100">
                    "Sent screenshot. UTR #4092189... please check"
                  </div>
                </div>

                {/* 3. Stock Spreadsheet / Registers */}
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{t('landing.problemStockTitle')}</h4>
                      <span className="text-[10px] text-rose-600 font-semibold">Outdated registers</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('landing.problemStockDesc')}
                  </p>
                  <div className="p-2 rounded bg-slate-50 text-[10px] text-slate-600 font-mono border border-slate-100">
                    Stock sheet out of sync with offline orders
                  </div>
                </div>

                {/* 4. Courier & Shipping Portals */}
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{t('landing.problemShippingTitle')}</h4>
                      <span className="text-[10px] text-rose-600 font-semibold">Manual address typing</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('landing.problemShippingDesc')}
                  </p>
                  <div className="p-2 rounded bg-slate-50 text-[10px] text-slate-600 font-mono border border-slate-100">
                    Copy-pasting pincode and phone into 3rd party apps
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Transition Banner to Screen 3 */}
        <div className="pt-4 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 shadow-2xs">
            <span className="text-sm font-bold text-blue-900">
              {t('landing.problemTransition')}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
              <span>See the unified system</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

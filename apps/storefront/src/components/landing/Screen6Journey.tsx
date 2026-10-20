import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, QrCode, Search, Star, CreditCard, Truck, CheckCircle2, ShieldCheck, MessageCircle, Globe, ShoppingBag, ArrowRight } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

interface JourneyStage {
  step: string;
  titleKey: string;
  descKey: string;
  renderScreen: () => React.ReactNode;
}

export const Screen6Journey: React.FC = () => {
  const { t } = useLandingI18n();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const stages: JourneyStage[] = [
    {
      step: '01',
      titleKey: 'landing.stage1Name',
      descKey: 'landing.stage1Desc',
      renderScreen: () => (
        <div className="p-3 bg-white h-full flex flex-col justify-between text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900">LetZshop Direct</span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-mono">
              yourbrand.letzshop.store
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <div className="w-20 h-20 mx-auto bg-white p-2 rounded-lg border border-slate-300 shadow-2xs flex items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-800" />
            </div>
            <p className="text-[11px] font-bold text-slate-800">Scan QR or Click Link</p>
            <p className="text-[10px] text-slate-500">Instant access from WhatsApp, Instagram, or counter sticker</p>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold flex items-center justify-between">
            <span>Direct Merchant Store</span>
            <span className="text-emerald-700 font-bold">100% Verified</span>
          </div>
        </div>
      ),
    },
    {
      step: '02',
      titleKey: 'landing.stage2Name',
      descKey: 'landing.stage2Desc',
      renderScreen: () => (
        <div className="p-3 bg-white h-full flex flex-col justify-between text-xs space-y-2.5">
          <div className="h-28 rounded-xl bg-gradient-to-tr from-amber-100 to-orange-50 border border-slate-200 flex items-center justify-center text-4xl relative">
            <span>🏺</span>
            <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 text-slate-800 px-1.5 py-0.5 rounded shadow-2xs">
              ★ 4.9 (128)
            </span>
          </div>

          <div className="space-y-1">
            <h5 className="font-bold text-slate-900 text-xs line-clamp-1">Handmade Terracotta Dining Pitcher</h5>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold text-slate-900">₹850</span>
              <span className="text-[11px] text-slate-400 line-through">₹1,150</span>
            </div>
            <p className="text-[10px] text-slate-500 line-clamp-2">Natural clay cooling water carafe crafted by master potters.</p>
          </div>

          <button type="button" className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-2xs">
            Select Options
          </button>
        </div>
      ),
    },
    {
      step: '03',
      titleKey: 'landing.stage3Name',
      descKey: 'landing.stage3Desc',
      renderScreen: () => (
        <div className="p-3 bg-white h-full flex flex-col justify-between text-xs space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Variant Customization</span>
            <h5 className="font-bold text-slate-900 text-xs">Choose Capacity & Glaze</h5>
          </div>

          {/* Size Pills */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-600">Capacity:</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold text-[11px]">
                1.5 Litres
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                2.5 Litres
              </span>
            </div>
          </div>

          {/* Color/Finish */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-600">Finish:</span>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-700 ring-2 ring-blue-600 ring-offset-1" />
              <span className="w-5 h-5 rounded-full bg-stone-800" />
              <span className="w-5 h-5 rounded-full bg-orange-800" />
            </div>
          </div>

          <button type="button" className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-2xs">
            Add to Bag — ₹850
          </button>
        </div>
      ),
    },
    {
      step: '04',
      titleKey: 'landing.stage4Name',
      descKey: 'landing.stage4Desc',
      renderScreen: () => (
        <div className="p-3 bg-white h-full flex flex-col justify-between text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900">Express Checkout</span>
            <span className="text-[10px] text-slate-500 font-mono">1 Item</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-1">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Terracotta Carafe (1.5L)</span>
              <span>₹850</span>
            </div>
            <div className="flex justify-between text-[10px] text-emerald-600 font-medium">
              <span>Delivery Fee</span>
              <span>FREE</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 space-y-0.5">
            <span className="font-bold text-slate-800 block">Delivery Address</span>
            <p>Flat 402, Shivam Residency, FC Road, Pune 411005</p>
          </div>

          <button type="button" className="w-full py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-2xs">
            Continue to Payment
          </button>
        </div>
      ),
    },
    {
      step: '05',
      titleKey: 'landing.stage5Name',
      descKey: 'landing.stage5Desc',
      renderScreen: () => (
        <div className="p-3 bg-white h-full flex flex-col justify-between text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900">Select Payment</span>
            <span className="text-[10px] text-emerald-700 font-bold">100% Secure</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="p-2.5 rounded-xl border-2 border-blue-600 bg-blue-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                  UPI
                </div>
                <span className="font-bold text-slate-900 text-[11px]">Instant UPI / QR</span>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600" />
            </div>

            <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-slate-600 text-[11px]">
              <span>Credit / Debit Cards</span>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>

            <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-slate-600 text-[11px]">
              <span>Cash on Delivery (COD)</span>
              <span className="text-[10px] text-slate-500 font-semibold">Available</span>
            </div>
          </div>

          <button type="button" className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-2xs">
            Pay ₹850 via UPI
          </button>
        </div>
      ),
    },
    {
      step: '06',
      titleKey: 'landing.stage6Name',
      descKey: 'landing.stage6Desc',
      renderScreen: () => (
        <div className="p-3 bg-white h-full flex flex-col justify-between text-xs space-y-3 text-center">
          <div className="pt-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h5 className="font-black text-slate-900 text-sm">Order Confirmed!</h5>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Order ID: #LS-8942</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-slate-800">₹850 (UPI)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt Sent:</span>
              <span className="font-bold text-emerald-700">WhatsApp & SMS</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-blue-50 text-blue-800 text-[10px] font-semibold">
            Merchant has received and queued your order
          </div>
        </div>
      ),
    },
    {
      step: '07',
      titleKey: 'landing.stage7Name',
      descKey: 'landing.stage7Desc',
      renderScreen: () => (
        <div className="p-3 bg-white h-full flex flex-col justify-between text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900">Live Parcel Tracking</span>
            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">In Transit</span>
          </div>

          <div className="space-y-2 text-[10px] text-left">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />
              <div>
                <p className="font-bold text-slate-800">Out for Delivery</p>
                <p className="text-slate-400">Pune Distribution Hub • Expected by 4 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
              <div>
                <p className="font-bold text-slate-700">Dispatched by Merchant</p>
                <p className="text-slate-400">AWB #78291048291 • BlueDart / Delhivery</p>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 flex items-center justify-between">
            <span>Tracking link sent via WhatsApp</span>
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          <button type="button" className="w-full py-1.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs">
            Open Map Route
          </button>
        </div>
      ),
    },
    {
      step: '08',
      titleKey: 'landing.stage8Name',
      descKey: 'landing.stage8Desc',
      renderScreen: () => (
        <div className="p-3 bg-white h-full flex flex-col justify-between text-xs space-y-3 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Rating</span>
            <h5 className="font-bold text-slate-900 text-xs mt-1">Share Your Experience</h5>
          </div>

          <div className="flex items-center justify-center gap-1.5 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-600 text-left italic">
            "Delivered safely in sturdy eco-packaging. Beautiful terracotta finish and naturally cold water. 5 stars!"
          </div>

          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            ✓ Verified Storefront Review
          </div>
        </div>
      ),
    },
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = 280; // approximate device width + gap
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const updateActiveIndexOnScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const cardWidth = 280;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveStepIndex(Math.min(Math.max(index, 0), stages.length - 1));
    }
  };

  return (
    <section id="journey" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide">
              <span>{t('landing.journeyEyebrow')}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {t('landing.journeyTitle')}
            </h2>

            <p className="text-base text-slate-600">
              {t('landing.journeySupporting')}
            </p>
          </div>

          {/* Carousel Navigation Controls & Step Counter */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
              Stage {activeStepIndex + 1} of 8
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                aria-label="Previous step"
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center shadow-xs transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Next step"
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center shadow-xs transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={carouselRef}
          onScroll={updateActiveIndexOnScroll}
          className="flex items-stretch gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-4 px-1"
        >
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className="snap-start shrink-0 w-[270px] sm:w-[290px] rounded-3xl bg-slate-50 border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              {/* Step Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <span className="text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md font-mono">
                  {stage.step}
                </span>
                <span className="text-xs font-bold text-slate-900 truncate ml-2">
                  {t(stage.titleKey)}
                </span>
              </div>

              {/* Device Mockup Body */}
              <div className="h-[280px] rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-2xs">
                {stage.renderScreen()}
              </div>

              {/* Descriptive Step Copy */}
              <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                {t(stage.descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* India-First Capability Strip */}
        <div className="pt-6 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold">
              <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('landing.stripUpi')}</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold">
              <MessageCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>{t('landing.stripWhatsapp')}</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold">
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{t('landing.stripMultilingual')}</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold">
              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{t('landing.stripShipping')}</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold col-span-2 sm:col-span-1">
              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
              <span>{t('landing.stripCheckout')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

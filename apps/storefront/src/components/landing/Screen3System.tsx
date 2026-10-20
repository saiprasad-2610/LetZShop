import React from 'react';
import { Package, ShoppingBag, CreditCard, Truck, Users, Star, Layers, CheckCircle } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

export const Screen3System: React.FC = () => {
  const { t } = useLandingI18n();

  const capabilities = [
    {
      id: 'catalog',
      title: t('landing.capCatalog'),
      desc: t('landing.capCatalogDesc'),
      icon: Package,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'Variants & Media',
    },
    {
      id: 'orders',
      title: t('landing.capOrders'),
      desc: t('landing.capOrdersDesc'),
      icon: ShoppingBag,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      badge: 'Real-time Pipeline',
    },
    {
      id: 'payments',
      title: t('landing.capPayments'),
      desc: t('landing.capPaymentsDesc'),
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'UPI & Razorpay',
    },
    {
      id: 'shipping',
      title: t('landing.capShipping'),
      desc: t('landing.capShippingDesc'),
      icon: Truck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: 'Live Tracking',
    },
    {
      id: 'customers',
      title: t('landing.capCustomers'),
      desc: t('landing.capCustomersDesc'),
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: 'Buyer History',
    },
    {
      id: 'reviews',
      title: t('landing.capReviews'),
      desc: t('landing.capReviewsDesc'),
      icon: Star,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'Verified Ratings',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/50 border-b border-slate-100 scroll-mt-16">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('landing.systemEyebrow')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {t('landing.systemTitle')}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t('landing.systemSupporting')}
          </p>
        </div>

        {/* Connected Dashboard Visual */}
        <div className="relative max-w-5xl mx-auto p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-md">
          {/* Subtle connecting backdrop lines */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg className="w-full h-full" viewBox="0 0 800 400" fill="none">
              <path d="M400,200 L160,80" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M400,200 L400,60" stroke="#EA580C" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M400,200 L640,80" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M400,200 L160,320" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M400,200 L400,340" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M400,200 L640,320" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
          </div>

          {/* Central Hub Card */}
          <div className="max-w-md mx-auto rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 shadow-xl border border-slate-800 text-center relative z-10 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black mx-auto shadow-sm">
              LS
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Centralized Merchant Platform
              </span>
              <h3 className="text-lg font-black text-white mt-1">LetZshop Unified Engine</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                All 6 business operations synchronized in real-time under one single login.
              </p>
            </div>
          </div>

          {/* Connected Capabilities 6-Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-8 relative z-10">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all duration-200 space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cap.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {cap.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
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

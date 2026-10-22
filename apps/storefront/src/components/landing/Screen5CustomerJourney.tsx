import React from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Globe2,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import styles from './Screen5CustomerJourney.module.css';

const STEPS = [
  'discover',
  'product',
  'variants',
  'checkout',
  'payment',
  'confirmed',
  'tracking',
  'review',
] as const;
const BENEFITS = [
  { id: 'payments', icon: CreditCard },
  { id: 'whatsapp', icon: MessageCircle },
  { id: 'languages', icon: Globe2 },
  { id: 'security', icon: ShieldCheck },
  { id: 'shipping', icon: Truck },
] as const;

function ProductArt({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-[#e9f0ee] ${small ? 'h-16' : 'h-24'}`}
    >
      <Shirt
        className={`${small ? 'h-10 w-10' : 'h-16 w-16'} text-[#477b85]`}
        strokeWidth={1.3}
        fill="#a7c3c5"
      />
    </div>
  );
}

/** Illustrative storefront UI: intentionally has no checkout actions or network calls. */
function JourneyPhone({ step }: { step: (typeof STEPS)[number] }) {
  const { t } = useLandingI18n();
  const ui = (key: string) => t('landing.customerJourney.ui.' + key);
  const action = (label: string) => (
    <div className="mt-auto rounded-lg bg-[#225c70] px-2 py-2 text-center text-[11px] font-bold leading-relaxed text-white">
      {label}
    </div>
  );
  const productName = (
    <p className="text-[12px] font-bold leading-snug text-slate-900">
      {ui('product')}
    </p>
  );
  const price = (
    <span className="text-[12px] font-bold text-slate-900">₹899</span>
  );
  const summary = (
    <div className="space-y-2 rounded-xl border border-slate-200 p-2.5">
      <p className="font-bold text-slate-800">{ui('orderSummary')}</p>
      <div className="flex justify-between gap-2">
        <span className="text-slate-500">1 × {ui('product')}</span>
        <span className="shrink-0">₹899</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-slate-500">{ui('shipping')}</span>
        <span className="text-emerald-700">{ui('free')}</span>
      </div>
      <div className="flex justify-between gap-2 border-t border-slate-200 pt-2 font-bold">
        <span>{ui('total')}</span>
        <span>₹899</span>
      </div>
    </div>
  );
  return (
    <div className={styles.phone} aria-hidden="true" data-journey-phone>
      <div className={styles.notch} />
      <div className="flex items-center justify-between gap-1 border-b border-slate-100 px-2 pb-2 text-[10px] font-bold text-[#225c70]">
        <Menu className="h-3 w-3 shrink-0" />
        <span>Urban Loom</span>
        <ShoppingBag className="h-3 w-3 shrink-0" />
      </div>
      <div className={styles.phoneBody}>
        {step === 'discover' && (
          <>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-2 text-slate-500">
              <Search className="h-3 w-3 shrink-0" />
              <span>{ui('search')}</span>
            </div>
            <div className="rounded-xl bg-[#f6ecdc] p-2.5">
              <p className="mb-2 text-[13px] font-bold leading-snug text-[#604828]">
                {ui('collection')}
              </p>
              <ProductArt small />
            </div>
            <p className="text-slate-500">{ui('categories')}</p>
            <div className="grid grid-cols-2 gap-2">
              <ProductArt small />
              <div className="flex items-center justify-center rounded-xl bg-orange-50">
                <ShoppingBag
                  className="h-9 w-9 text-amber-700"
                  strokeWidth={1.3}
                />
              </div>
            </div>
            {action(ui('browse'))}
          </>
        )}
        {step === 'product' && (
          <>
            <ProductArt />
            {productName}
            <div className="flex items-center justify-between">
              {price}
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="h-3 w-3 fill-current" />
                4.8
              </span>
            </div>
            <p className="text-slate-500">{ui('productDetail')}</p>
            {action(ui('addToCart'))}
          </>
        )}
        {step === 'variants' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-14 shrink-0">
                <ProductArt small />
              </div>
              <div>
                {productName}
                {price}
              </div>
            </div>
            <p className="font-bold text-slate-800">{ui('size')}</p>
            <div className="grid grid-cols-4 gap-1">
              {['S', 'M', 'L', 'XL'].map((size) => (
                <span
                  key={size}
                  className={`rounded-lg border py-1.5 text-center font-bold ${size === 'M' ? 'border-[#225c70] bg-[#225c70] text-white' : 'border-slate-200'}`}
                >
                  {size}
                </span>
              ))}
            </div>
            <p className="font-bold text-slate-800">{ui('colour')}</p>
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full border-2 border-white bg-[#477b85] ring-1 ring-[#477b85]" />
              <span>{ui('blue')}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>{ui('quantity')}</span>
              <span className="rounded-lg border border-slate-200 px-3 py-1">
                − &nbsp; 1 &nbsp; +
              </span>
            </div>
            {action(ui('continue'))}
          </>
        )}
        {step === 'checkout' && (
          <>
            <p className="text-[13px] font-bold text-slate-900">
              {ui('checkout')}
            </p>
            <div className="rounded-xl border border-slate-200 p-2.5">
              <p className="mb-1 flex items-center gap-1 font-bold">
                <MapPin className="h-3 w-3 shrink-0 text-orange-600" />
                {ui('delivery')}
              </p>
              <p>Mira Patil</p>
              <p className="mt-1 text-slate-500">{ui('address')}</p>
            </div>
            {summary}
            {action(ui('placeOrder'))}
          </>
        )}
        {step === 'payment' && (
          <>
            <p className="text-[13px] font-bold text-slate-900">
              {ui('payment')}
            </p>
            <div className="rounded-xl bg-slate-50 p-2.5 font-bold">
              {ui('total')} <span className="float-right">₹899</span>
            </div>
            {['upi', 'card', 'cod'].map((key, i) => (
              <div
                key={key}
                className={`flex items-center gap-2 rounded-xl border px-2 py-2.5 ${i === 0 ? 'border-[#225c70] bg-[#edf5f5]' : 'border-slate-200'}`}
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full border ${i === 0 ? 'border-[#225c70] bg-[#225c70] ring-2 ring-white' : 'border-slate-300'}`}
                />
                <span className="font-semibold">{ui(key)}</span>
              </div>
            ))}
            {action(ui('pay'))}
            <p className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
              <ShieldCheck className="h-3 w-3" />
              {ui('secure')}
            </p>
          </>
        )}
        {step === 'confirmed' && (
          <>
            <div className="pt-4 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-50 p-2 text-emerald-600" />
              <p className="text-[15px] font-bold leading-snug text-slate-900">
                {ui('confirmed')}
              </p>
              <p className="mt-2 text-slate-500">{ui('confirmation')}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="font-bold text-emerald-900">{ui('orderId')}</p>
              <p className="mt-1 text-emerald-800">{ui('receipt')}</p>
            </div>
            {action(ui('trackOrder'))}
          </>
        )}
        {step === 'tracking' && (
          <>
            <div className="flex items-center gap-2">
              <Truck className="h-7 w-7 shrink-0 text-[#225c70]" />
              <p className="text-[13px] font-bold leading-snug text-slate-900">
                {ui('tracking')}
              </p>
            </div>
            <p className="text-slate-500">{ui('orderId')}</p>
            <div className="space-y-0 pl-1">
              {['packed', 'shipped', 'outForDelivery', 'delivered'].map(
                (key, i) => (
                  <div
                    key={key}
                    className="relative flex items-start gap-2 pb-5 last:pb-0"
                  >
                    {i < 3 && (
                      <span
                        className={`absolute left-[6px] top-3 h-full w-px ${i < 2 ? 'bg-emerald-300' : 'bg-slate-200'}`}
                      />
                    )}
                    <span
                      className={`relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${i < 2 ? 'bg-emerald-600 text-white' : i === 2 ? 'bg-orange-500 text-white' : 'border border-slate-300 bg-white'}`}
                    >
                      {i < 2 && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span
                      className={
                        i === 3
                          ? 'text-slate-400'
                          : 'font-semibold text-slate-800'
                      }
                    >
                      {ui(key)}
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className="mt-auto flex items-center gap-1 rounded-lg bg-blue-50 p-2 text-[#225c70]">
              <Package className="h-4 w-4 shrink-0" />
              <span>{ui('outForDelivery')}</span>
            </div>
          </>
        )}
        {step === 'review' && (
          <>
            <ProductArt small />
            <p className="text-center text-[13px] font-bold text-slate-900">
              {ui('review')}
            </p>
            <div className="flex justify-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <div className="min-h-[58px] rounded-xl border border-slate-200 p-2.5 text-slate-400">
              {ui('reviewPlaceholder')}
            </div>
            {action(ui('submitReview'))}
            <p className="text-center text-[10px] text-slate-500">
              {ui('reviewThanks')}
            </p>
          </>
        )}
      </div>
      <div className={styles.homeIndicator} />
    </div>
  );
}

export function Screen5CustomerJourney() {
  const { t } = useLandingI18n();
  const tr = (key: string) => t('landing.customerJourney.' + key);
  return (
    <section
      id="journey"
      data-testid="screen5-journey"
      aria-labelledby="customer-journey-title"
      className={styles.section}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>{tr('eyebrow')}</p>
            <h2 id="customer-journey-title">{tr('title')}</h2>
            <p className={styles.supporting}>{tr('supporting')}</p>
          </div>
          <aside className={styles.indiaCard} aria-label={tr('indiaReady')}>
            <p className={styles.indiaTitle}>
              <span className={styles.flag} aria-hidden="true" />
              {tr('indiaReady')}
            </p>
            <div>
              <CreditCard />
              <span>{tr('paymentsReady')}</span>
            </div>
            <div>
              <MessageCircle />
              <span>{tr('whatsappReady')}</span>
            </div>
            <div>
              <Globe2 />
              <span>
                {tr('languagesReady')}
                <small>{tr('languageNames')}</small>
              </span>
            </div>
          </aside>
        </div>
        <p className={styles.scrollHint}>
          {tr('scrollHint')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </p>
        <ol
          className={styles.journey}
          aria-label={tr('railLabel')}
          tabIndex={0}
          data-testid="journey-rail"
        >
          {STEPS.map((step, index) => (
            <li key={step} className={styles.step} data-journey-step={step}>
              <div className={styles.stepCopy}>
                <span className={styles.number} data-step-number>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{tr(`steps.${step}.title`)}</h3>
                <p>{tr(`steps.${step}.description`)}</p>
              </div>
              <JourneyPhone step={step} />
              {index < 7 && (
                <ArrowRight className={styles.connector} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
        <div className={styles.benefits} data-testid="journey-benefits">
          {BENEFITS.map(({ id, icon: Icon }) => (
            <div key={id} className={styles.benefit}>
              <div className={styles.benefitIcon}>
                <Icon aria-hidden="true" />
              </div>
              <h3>{tr(`benefits.${id}.title`)}</h3>
              <p>{tr(`benefits.${id}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  MessageSquare, 
  Clock, 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../../../../context/CartContext';
import { ThemeWrapper } from '../../../../components/ThemeWrapper';
import { StoreHeader } from '../../../../components/StoreHeader';
import { StoreFooter } from '../../../../components/StoreFooter';
import { formatPaise } from '@simply/ui';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { slug, orderNumber, t } = router.query;
  const { api, setStoreId } = useCart();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [trackingDenied, setTrackingDenied] = useState(false);

  useEffect(() => {
    if (!slug || !orderNumber) return;
    loadOrder(String(slug), String(orderNumber), t ? String(t) : undefined);
  }, [slug, orderNumber, t]);

  const loadOrder = async (storeSlug: string, orderNum: string, token?: string) => {
    setLoading(true);
    setTrackingDenied(false);
    try {
      const [sRes, oRes] = await Promise.all([
        api.stores.getPublicStorefront(storeSlug),
        api.orders.trackOrder(orderNum, token),
      ]);
      setStoreData(sRes);
      setOrder(oRes);
      if (sRes.store?.id) {
        setStoreId(sRes.store.id);
      }
    } catch (err: any) {
      console.error('Failed to load tracked order', err);
      if (err?.code === 'INVALID_TRACKING_TOKEN' || err?.status === 403) {
        setTrackingDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const { store, themeConfig } = storeData;

  if (trackingDenied) {
    return (
      <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
        <StoreHeader store={store} themeConfig={themeConfig} />
        <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Secure Tracking Token Required</h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            For privacy and customer security under Indian DPDPA compliance, order tracking requires your unique tracking link with security token (?t=...). Please use the direct link provided in your order confirmation SMS or WhatsApp.
          </p>
          <Link
            href={`/store/${slug}`}
            className="inline-block px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg"
          >
            Back to Store
          </Link>
        </div>
        <StoreFooter store={store} />
      </ThemeWrapper>
    );
  }

  if (!order) {
    return (
      <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
        <StoreHeader store={store} themeConfig={themeConfig} />
        <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
          <h1 className="text-xl font-bold text-gray-900">Order Not Found</h1>
          <p className="text-xs text-gray-500">
            We could not locate an order matching #{orderNumber}.
          </p>
          <Link
            href={`/store/${slug}`}
            className="inline-block px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg"
          >
            Back to Store
          </Link>
        </div>
        <StoreFooter store={store} />
      </ThemeWrapper>
    );
  }

  const addr = order.shippingAddress || {};
  const cleanPhone = (store.contactPhone || '').replace(/[^0-9]/g, '').replace(/^91/, '');
  const waHelpLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${store.name}, I would like to ask about my order #${order.orderNumber}.`
  )}`;

  // Status step calculation
  const statusSteps = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  let currentStepIdx = 0;
  if (order.status === 'PROCESSING') currentStepIdx = 1;
  else if (order.status === 'SHIPPED') currentStepIdx = 2;
  else if (order.status === 'DELIVERED') currentStepIdx = 3;

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>Order #{order.orderNumber} Confirmed | {store.name}</title>
      </Head>

      <StoreHeader store={store} themeConfig={themeConfig} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Success Hero Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Order Confirmed & Placed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-2">
              Thank you for your purchase!
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Order #{order.orderNumber} • Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          {/* WhatsApp Support CTA */}
          {cleanPhone && (
            <div className="pt-2">
              <a
                href={waHelpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <MessageSquare className="w-4 h-4" /> Have questions? Chat on WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* 4-Step Fulfillment Tracker */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Live Delivery & Fulfillment Status
          </h2>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { label: 'Confirmed', icon: CheckCircle },
              { label: 'Processing', icon: Clock },
              { label: 'Shipped', icon: Truck },
              { label: 'Delivered', icon: Package },
            ].map((step, idx) => {
              const Icon = step.icon;
              const isDone = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step.label} className="space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto transition ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <p
                    className={`text-[11px] font-semibold ${
                      isCurrent ? 'text-gray-900 font-bold' : isDone ? 'text-emerald-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & Summary Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Items List */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" /> Ordered Items ({order.items?.length || 0})
            </h2>

            <div className="divide-y divide-gray-100 text-xs">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{item.titleSnapshot}</p>
                    {item.variantTitleSnapshot && (
                      <p className="text-gray-500 text-[11px]">{item.variantTitleSnapshot}</p>
                    )}
                    <p className="text-gray-400 font-mono text-[11px]">
                      Qty: {item.quantity} × {formatPaise(item.unitPricePaise)}
                    </p>
                  </div>
                  <div className="font-mono font-bold text-gray-900">
                    {formatPaise(item.totalPricePaise)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">{formatPaise(order.subtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-emerald-700 font-semibold">FREE</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                <span>Total Paid</span>
                <span className="font-mono">{formatPaise(order.totalAmountPaise)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address & Payment Details */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3 text-xs">
              <h2 className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Destination
              </h2>
              <div className="text-gray-700 space-y-1">
                <p className="font-bold text-gray-900">{order.customerName}</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>
                  {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.postalCode}</span>
                </p>
                <p className="text-gray-500 font-mono">Mobile: {order.customerPhone}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3 text-xs">
              <h2 className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment Status
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-semibold text-gray-900">{order.paymentMethod || 'Online'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {order.paymentStatus || 'PAID'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href={`/store/${slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white shadow-md transition hover:opacity-90"
            style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping at {store.name}</span>
          </Link>
        </div>
      </main>

      <StoreFooter store={store} />
    </ThemeWrapper>
  );
}

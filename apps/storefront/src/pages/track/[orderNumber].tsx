import { getPublicStoreUrl } from '@simply/types';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Phone,
  ShieldCheck,
  Store,
} from 'lucide-react';

export default function DirectOrderTrackingPage() {
  const router = useRouter();
  const { orderNumber, t } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!orderNumber) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/orders/track/${orderNumber}?t=${t || ''}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || 'Could not load order tracking information.');
        }

        const orderData = data.data || data;
        setOrder(orderData);

        // If order has store slug, automatically redirect to canonical storefront order page if desired,
        // or render right here for direct standalone tracking.
        if (orderData.store?.slug && !router.query.direct) {
          router.replace(`/store/${orderData.store.slug}/order/${orderNumber}?t=${t || ''}`);
          return;
        }
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, t, router]);

  const formatPaise = (paise?: number) => {
    if (typeof paise !== 'number') return '₹0.00';
    return '₹' + (paise / 100).toFixed(2);
  };

  return (
    <>
      <Head>
        <title>{`Track Order #${orderNumber || ''} | LetzShop`}</title>
        <meta name="description" content="Track your order status live on LetzShop." />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Simple Header */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-black text-xl tracking-tight text-slate-950 flex items-center gap-1.5">
                <Store className="w-5 h-5 text-indigo-600" />
                LetzShop
              </span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                Live Tracking
              </span>
            </div>
            {order?.store?.slug && (
              <Link
                href={getPublicStoreUrl(order.store)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                Visit {order.store.name} &rarr;
              </Link>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-48 mx-auto" />
              <p className="text-sm text-slate-500">Retrieving live tracking updates...</p>
            </div>
          ) : error ? (
            <div className="bg-white border border-rose-200 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Tracking Information Unavailable</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Go to LetzShop Home
                </Link>
              </div>
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Order Reference
                    </span>
                    <h1 className="text-2xl font-black text-slate-950">#{order.orderNumber}</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Status: {order.status}
                    </span>
                  </div>
                </div>

                {/* Courier / Rider Info */}
                {(order.carrier || order.trackingNumber) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Delivery Partner</div>
                        <div className="text-sm font-bold text-slate-900">{order.carrier}</div>
                      </div>
                    </div>
                    {order.trackingNumber && (
                      <div className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                        AWB: {order.trackingNumber}
                      </div>
                    )}
                  </div>
                )}

                {/* Items Summary */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Ordered Items ({order.itemCount})
                  </span>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {order.items?.map((it: any, idx: number) => (
                      <div key={idx} className="p-3 sm:px-4 flex items-center justify-between text-sm bg-slate-50/50">
                        <span className="font-medium text-slate-900">
                          {it.quantity}x {it.productName}
                          {it.variantTitle ? ` (${it.variantTitle})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 text-sm font-bold text-slate-900">
                    <span>Total Paid</span>
                    <span>{formatPaise(order.totalPaise)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}

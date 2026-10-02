import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { ThemeWrapper } from '../../../components/ThemeWrapper';
import { StoreHeader } from '../../../components/StoreHeader';
import { StoreFooter } from '../../../components/StoreFooter';
import { formatPaise } from '@simply/ui';

export default function StoreCartPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { cart, itemCount, subtotalPaise, updateQuantity, removeItem, api, setStoreId } = useCart();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);

  useEffect(() => {
    if (!slug) return;
    loadStore();
  }, [slug]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const res = await api.stores.getPublicStorefront(String(slug));
      setStoreData(res);
      if (res.store?.id) {
        setStoreId(res.store.id);
      }
    } catch (err) {
      console.error('Failed to load store cart', err);
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
  const items = cart?.items || [];
  const shippingFeePaise = 0; // Free promotional shipping
  const grandTotalPaise = subtotalPaise + shippingFeePaise;

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>Shopping Cart ({itemCount}) | {store.name}</title>
      </Head>

      <StoreHeader store={store} themeConfig={themeConfig} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href={`/store/${slug}`} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">Shopping Cart</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Your cart is empty</h2>
            <p className="text-xs text-gray-500">
              Explore our curated selection and add items to your cart to begin checkout.
            </p>
            <div className="pt-2">
              <Link
                href={`/store/${slug}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Items List */}
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {items.map((item: any) => {
                const variant = item.variant || {};
                const product = variant.product || {};
                const cover =
                  variant.images?.[0]?.url ||
                  product.images?.[0]?.url ||
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';

                return (
                  <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={cover}
                        alt={product.title}
                        className="w-20 h-20 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <Link
                          href={`/store/${slug}/product/${product.id}`}
                          className="font-bold text-sm text-gray-900 hover:text-emerald-700 transition"
                        >
                          {product.title}
                        </Link>
                        {variant.title && (
                          <p className="text-xs text-gray-500">{variant.title}</p>
                        )}
                        <p className="text-xs font-mono font-bold text-gray-900">
                          {formatPaise(variant.pricePaise || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(variant.id, item.quantity - 1)}
                          className="p-1.5 text-gray-500 hover:bg-gray-200 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 text-xs font-mono font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(variant.id, item.quantity + 1)}
                          className="p-1.5 text-gray-500 hover:bg-gray-200 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-gray-900 block">
                          {formatPaise((variant.pricePaise || 0) * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(variant.id)}
                          className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 mt-1 transition"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: Order Summary */}
            <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-base font-bold text-gray-900">Order Summary</h2>

              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {formatPaise(subtotalPaise)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery / Shipping</span>
                  <span className="text-emerald-700 font-semibold">FREE</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span className="font-mono">{formatPaise(grandTotalPaise)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/store/${slug}/checkout`}
                  className="w-full py-3.5 rounded-xl text-xs font-bold text-white shadow-md transition hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
                >
                  <span>Proceed to Guest Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Encrypted payment processing via Razorpay</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Direct door-to-door courier dispatch</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <StoreFooter store={store} />
    </ThemeWrapper>
  );
}

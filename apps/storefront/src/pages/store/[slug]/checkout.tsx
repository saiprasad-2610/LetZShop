import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  ArrowLeft, 
  CheckCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { ThemeWrapper } from '../../../components/ThemeWrapper';
import { StoreHeader } from '../../../components/StoreHeader';
import { StoreFooter } from '../../../components/StoreFooter';
import { formatPaise } from '@simply/ui';

export default function StoreCheckoutPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { cart, guestToken, itemCount, subtotalPaise, api, setStoreId } = useCart();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');

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
      console.error('Failed to load store checkout', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.id || (cart.items || []).length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!phone || phone.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!postalCode || postalCode.length !== 6) {
      alert('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        storeId: storeData.store.id,
        guestToken,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        shippingAddress: {
          name,
          phone,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state,
          postalCode,
          country: 'India',
        },
        paymentMethod,
      };

      const orderResult = await api.orders.checkout(payload);
      // Redirect to confirmation & live tracking page with secure tracking token
      const tokenParam = orderResult.trackingToken ? `?t=${orderResult.trackingToken}` : '';
      router.push(`/store/${slug}/order/${orderResult.orderNumber}${tokenParam}`);
    } catch (err: any) {
      console.error('Checkout error', err);
      alert(err.message || 'Failed to place order. Please review your details.');
    } finally {
      setSubmitting(false);
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
  const grandTotalPaise = subtotalPaise;

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>Express Guest Checkout | {store.name}</title>
      </Head>

      <StoreHeader store={store} themeConfig={themeConfig} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href={`/store/${slug}/cart`} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">One-Page Guest Checkout</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
          <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
          </span>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Checkout Form Steps */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: Contact Information */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" /> 1. Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anand Sharma"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mobile Number (for delivery SMS & WhatsApp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-gray-500 font-semibold">+91</span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address (Optional, for digital receipt)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anand@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: Delivery & Shipping Address */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> 2. Delivery Address (India)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Flat / House No. / Building / Street *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. 402, Lotus Residency, MG Road"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Area / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Near City Mall"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">6-Digit PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="560001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City / District *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Karnataka"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Payment Method */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> 3. Payment Method
              </h2>

              <div className="space-y-3">
                <label
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    paymentMethod === 'RAZORPAY'
                      ? 'border-gray-900 bg-gray-50/70 ring-2 ring-gray-900/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'RAZORPAY'}
                      onChange={() => setPaymentMethod('RAZORPAY')}
                      className="text-gray-900 focus:ring-gray-900"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        Online Payment (UPI, Cards, Netbanking)
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Instant confirmation via Razorpay. Google Pay, PhonePe, Paytm supported.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Fastest
                  </span>
                </label>

                <label
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    paymentMethod === 'COD'
                      ? 'border-gray-900 bg-gray-50/70 ring-2 ring-gray-900/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="text-gray-900 focus:ring-gray-900"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-gray-500">
                        Pay cash directly to the delivery courier upon doorstep package arrival.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    Pay at Doorstep
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary Sidebar */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-base font-bold text-gray-900">Order Summary ({itemCount} items)</h2>

            {/* Compact items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100">
              {items.map((item: any) => (
                <div key={item.id} className="pt-2 first:pt-0 flex justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">{item.variant?.product?.title || 'Item'}</p>
                    <p className="text-[11px] text-gray-500 font-mono">
                      Qty: {item.quantity} × {formatPaise(item.variant?.pricePaise || 0)}
                    </p>
                  </div>
                  <div className="font-mono font-bold text-gray-900">
                    {formatPaise((item.variant?.pricePaise || 0) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">{formatPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-emerald-700 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span className="text-gray-500">Included</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-bold text-gray-900">
                <span>Grand Total</span>
                <span className="font-mono">{formatPaise(grandTotalPaise)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full py-4 rounded-xl text-xs font-bold text-white shadow-lg transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
            >
              {submitting ? (
                <span>Placing Order Securely...</span>
              ) : (
                <>
                  <span>Place Order • {formatPaise(grandTotalPaise)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-[10px] text-gray-400">
              By placing this order, you agree to our Terms of Service & Privacy Policy. No registration required.
            </div>
          </div>
        </form>
      </main>

      <StoreFooter store={store} />
    </ThemeWrapper>
  );
}

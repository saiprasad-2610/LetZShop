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
  ArrowRight,
  Store as StoreIcon,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { ThemeWrapper } from '../../../components/ThemeWrapper';
import { StoreHeader } from '../../../components/StoreHeader';
import { StoreFooter } from '../../../components/StoreFooter';
import { SafeImage } from '../../../components/ui/SafeImage';
import { formatPaise } from '@simply/ui';
import { getSellerStorePreviewUrl } from '../../../utils/config';

export default function StoreCheckoutPage() {
  const router = useRouter();
  const { slug, preview } = router.query;
  const isEmbedded = router.query.embedded === 'true';
  const { cart, guestToken, itemCount, subtotalPaise, api, setStoreId, clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isPreviewMode = Boolean(storeData?.isPreview || preview === 'true');

  // Preview flow completion state
  const [previewCompleted, setPreviewCompleted] = useState(false);
  const [completedOrderSnapshot, setCompletedOrderSnapshot] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('COD');

  const getLink = (path: string) => {
    const params = new URLSearchParams();
    if (preview === 'true' || storeData?.isPreview) params.set('preview', 'true');
    if (isEmbedded) params.set('embedded', 'true');
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  useEffect(() => {
    if (!slug) return;
    loadStore();
  }, [slug, preview]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const res = await api.stores.getPublicStorefront(String(slug), preview ? String(preview) : undefined);
      setStoreData(res);
      if (res.store?.id) {
        setStoreId(res.store.id);
      }
      if (res.store?.fulfillmentMode === 'PICKUP') {
        setFulfillmentType('PICKUP');
      }
    } catch (err) {
      console.error('Failed to load store checkout', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const items = cart?.items || [];
    if (items.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!name.trim()) {
      alert('Please enter your full name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    if (fulfillmentType === 'DELIVERY') {
      if (!addressLine1.trim()) {
        alert('Please enter your delivery street address');
        return;
      }
      if (!postalCode || postalCode.replace(/\D/g, '').length !== 6) {
        alert('Please enter a valid 6-digit Indian PIN code');
        return;
      }
      if (!city.trim() || !state.trim()) {
        alert('Please enter your city and state');
        return;
      }
    }

    // ------------------------------------------------------------------------
    // MERCHANT PREVIEW MODE: ZERO COMMERCE MUTATION SIMULATION
    // ------------------------------------------------------------------------
    if (isPreviewMode) {
      setSubmitting(true);
      setTimeout(() => {
        const orderSnapshot = {
          previewOrderNumber: `PREV-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: name.trim(),
          customerPhone: cleanPhone,
          customerEmail: email.trim() || null,
          fulfillmentType,
          shippingAddress: fulfillmentType === 'DELIVERY' ? {
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim() || null,
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
          } : null,
          pickupStoreAddress: storeData?.store?.businessAddress || 'Store Location',
          paymentMethod,
          items: items.map((it: any) => ({
            id: it.id,
            title: it.variant?.product?.title || it.variant?.title || 'Item',
            quantity: it.quantity,
            pricePaise: it.variant?.pricePaise || 0,
            lineTotalPaise: (it.variant?.pricePaise || 0) * it.quantity,
          })),
          subtotalPaise,
          totalPaise: subtotalPaise,
        };

        setCompletedOrderSnapshot(orderSnapshot);
        setPreviewCompleted(true);
        clearCart();
        setSubmitting(false);
      }, 400);
      return;
    }

    // ------------------------------------------------------------------------
    // REAL BUYER GUEST CHECKOUT
    // ------------------------------------------------------------------------
    setSubmitting(true);
    try {
      const payload = {
        storeId: storeData.store.id,
        guestToken,
        customerName: name,
        customerPhone: cleanPhone,
        customerEmail: email || undefined,
        shippingAddress: fulfillmentType === 'DELIVERY' ? {
          name,
          phone: cleanPhone,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state,
          postalCode,
          country: 'India',
        } : undefined,
        paymentMethod,
      };

      const orderResult = await api.orders.checkout(payload);
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
  const supportsPickup = store.fulfillmentMode === 'PICKUP' || store.fulfillmentMode === 'DELIVERY_AND_PICKUP';
  const supportsDelivery = store.fulfillmentMode === 'DELIVERY' || store.fulfillmentMode === 'DELIVERY_AND_PICKUP';

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>{previewCompleted ? 'Preview Order Complete' : 'Checkout'} | {store.name}</title>
      </Head>

      {/* Merchant Preview Top Banner (Hidden in embedded iframe) */}
      {isPreviewMode && !isEmbedded && (
        <div className="bg-slate-900 text-white text-xs py-2 px-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-400">Merchant Preview</span>
            <span className="text-slate-300">You're viewing your store exactly as customers will see it.</span>
          </div>
          <a
            href={getSellerStorePreviewUrl()}
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-[11px] font-medium transition"
          >
            Exit Preview
          </a>
        </div>
      )}

      <StoreHeader store={store} themeConfig={themeConfig} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* PREVIEW COMPLETED CONFIRMATION VIEW */}
        {previewCompleted && completedOrderSnapshot ? (
          <div className="max-w-2xl mx-auto space-y-6 py-6 animate-fadeIn">
            <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                  Preview Mode
                </span>
                <h1 className="text-2xl font-bold text-gray-900">
                  Customer checkout preview complete
                </h1>
                <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                  This is the experience your customers will see. No real order was created and no inventory was changed.
                </p>
              </div>

              {/* Simulated Order Snapshot */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Preview Ref:</span>
                  <span className="font-mono font-bold text-gray-900">{completedOrderSnapshot.previewOrderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-medium text-gray-900">{completedOrderSnapshot.customerName} (+91 {completedOrderSnapshot.customerPhone})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Fulfillment:</span>
                  <span className="font-medium text-gray-900">
                    {completedOrderSnapshot.fulfillmentType === 'DELIVERY' 
                      ? `Delivery to ${completedOrderSnapshot.shippingAddress?.city}, ${completedOrderSnapshot.shippingAddress?.postalCode}`
                      : `Store Pickup (${store.name})`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment:</span>
                  <span className="font-medium text-gray-900">
                    {completedOrderSnapshot.paymentMethod === 'COD' ? 'Cash on Delivery (Doorstep)' : 'Online Payment (Preview)'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold text-sm text-gray-900">
                  <span>Simulated Total:</span>
                  <span className="font-mono text-emerald-700">{formatPaise(completedOrderSnapshot.totalPaise)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={getLink(`/store/${slug}`)}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" /> Back to Store
                </Link>
                <a
                  href={getSellerStorePreviewUrl()}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center justify-center gap-1.5"
                >
                  Exit Preview
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link href={getLink(`/store/${slug}/cart`)} className="hover:text-gray-900 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
              </Link>
              <span>/</span>
              <span className="font-semibold text-gray-800">
                {isPreviewMode ? 'Preview Checkout' : 'One-Page Guest Checkout'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isPreviewMode ? 'Store Checkout Preview' : 'Checkout'}
                </h1>
                {isPreviewMode && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Experience the complete customer order placement flow without real mutations.
                  </p>
                )}
              </div>
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
                        Mobile Number (for updates) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono text-gray-500 font-semibold">+91</span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210"
                          maxLength={10}
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

                {/* STEP 2: Fulfillment & Address */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      {fulfillmentType === 'DELIVERY' ? (
                        <Truck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <StoreIcon className="w-4 h-4 text-emerald-600" />
                      )}
                      2. Fulfillment Option
                    </h2>

                    {supportsPickup && supportsDelivery && (
                      <div className="flex p-0.5 bg-gray-100 rounded-lg text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setFulfillmentType('DELIVERY')}
                          className={`px-3 py-1 rounded-md transition ${
                            fulfillmentType === 'DELIVERY' ? 'bg-white shadow text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() => setFulfillmentType('PICKUP')}
                          className={`px-3 py-1 rounded-md transition ${
                            fulfillmentType === 'PICKUP' ? 'bg-white shadow text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Store Pickup
                        </button>
                      </div>
                    )}
                  </div>

                  {fulfillmentType === 'PICKUP' ? (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <StoreIcon className="w-4 h-4 text-emerald-700" /> Store Pickup Location
                      </div>
                      <p className="text-xs text-gray-800 font-medium">
                        {store.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {store.businessAddress || 'Address available upon pickup confirmation'}
                      </p>
                      {store.supportPhone && (
                        <p className="text-xs text-gray-500">
                          Contact: +91 {store.supportPhone}
                        </p>
                      )}
                      <p className="text-[11px] text-emerald-700 pt-1 font-medium">
                        ✓ No delivery fee • Pick up at your convenience during store business hours.
                      </p>
                    </div>
                  ) : (
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
                            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
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
                  )}
                </div>

                {/* STEP 3: Payment Method */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" /> 3. Payment Method
                  </h2>

                  <div className="space-y-3">
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
                            Pay in cash directly upon doorstep package delivery or store pickup.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        Pay on Arrival
                      </span>
                    </label>

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
                          <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            Online Payment (UPI, Cards, Netbanking)
                            {isPreviewMode && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                Preview — payment provider not yet connected
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {isPreviewMode 
                              ? 'Simulation only — real payment provider integration is tested safely without live charges.'
                              : 'Instant confirmation via Razorpay. Google Pay, PhonePe, Paytm supported.'
                            }
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Instant
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* RIGHT: Order Summary Sidebar */}
              <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
                <h2 className="text-base font-bold text-gray-900">
                  Order Summary ({items.reduce((s: number, i: any) => s + (i.quantity || 1), 0)} items)
                </h2>

                {/* Items list */}
                {items.length === 0 ? (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-gray-500">Your cart is empty.</p>
                    <Link
                      href={getLink(`/store/${slug}`)}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100">
                    {items.map((item: any) => (
                      <div key={item.id} className="pt-2 first:pt-0 flex justify-between text-xs">
                        <div>
                          <p className="font-semibold text-gray-900">{item.variant?.product?.title || item.variant?.title || 'Item'}</p>
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
                )}

                <div className="pt-4 border-t border-gray-200 space-y-2.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatPaise(subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fulfillment</span>
                    <span className="text-emerald-700 font-semibold">
                      {fulfillmentType === 'PICKUP' ? 'FREE STORE PICKUP' : 'FREE DELIVERY'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span className="text-gray-500">Included</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-bold text-gray-900">
                    <span>Total</span>
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
                    <span>{isPreviewMode ? 'Completing Preview...' : 'Placing Order Securely...'}</span>
                  ) : isPreviewMode ? (
                    <>
                      <span>Preview Place Order • {formatPaise(grandTotalPaise)}</span>
                      <CheckCircle className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Place Order • {formatPaise(grandTotalPaise)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {isPreviewMode ? (
                  <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg py-2 px-3 text-center font-medium leading-relaxed">
                    ✦ Merchant Preview Simulation: Safe end-to-end checkout. No real order will be created and inventory will not change.
                  </p>
                ) : (
                  <div className="pt-2 text-center text-[10px] text-gray-400">
                    By placing this order, you agree to our Terms of Service & Privacy Policy. No registration required.
                  </div>
                )}
              </div>
            </form>
          </>
        )}
      </main>

      <StoreFooter store={store} />
    </ThemeWrapper>
  );
}


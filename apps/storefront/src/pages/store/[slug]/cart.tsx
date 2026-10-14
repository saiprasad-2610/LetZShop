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
  Truck, 
  Tag,
  X,
  CheckCircle,
  Clock,
  Gift,
  Lock,
  Percent,
  Package
} from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../components/ui/Toast';
import { ThemeWrapper } from '../../../components/ThemeWrapper';
import { StoreHeader } from '../../../components/StoreHeader';
import { StoreFooter } from '../../../components/StoreFooter';
import { formatPaise, resolveVariantDisplayMedia } from '@simply/ui';
import { SafeImage } from '../../../components/ui/SafeImage';
import { getSellerStorePreviewUrl } from '../../../utils/config';

function formatItemVariantLabel(item: any): string | null {
  if (item.variantTitle && item.variantTitle !== 'Default') {
    return item.variantTitle;
  }
  const variant = item.variant;
  if (!variant) return null;
  if (variant.title && variant.title !== 'Default' && variant.title !== 'Standard') {
    return variant.title;
  }
  if (Array.isArray(variant.optionValues) && variant.optionValues.length > 0) {
    const values = variant.optionValues
      .map((ov: any) => ov.optionValue?.value || ov.value)
      .filter(Boolean);
    if (values.length > 0) {
      return values.join(' · ');
    }
  }
  return null;
}

export default function StoreCartPage() {
  const router = useRouter();
  const { slug, preview } = router.query;
  const { 
    cart, itemCount, subtotalPaise, updateQuantity, removeItem, 
    api, setStoreId, appliedCoupon, couponError, applyCoupon, removeCoupon,
    discountPaise, grandTotalPaise, shippingPaise,
    flatRatePaise, freeShippingThresholdPaise, freeDeliveryRemainingPaise,
    isFreeDeliveryQualified, setShippingSettings
  } = useCart();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const isEmbedded = router.query.embedded === 'true';
  const isPreviewMode = Boolean(
    storeData?.isPreview ||
    preview === 'true' ||
    (typeof window !== 'undefined' && sessionStorage.getItem('simply_merchant_preview') === 'true')
  );

  const getLink = (path: string) => {
    const params = new URLSearchParams();
    if (isPreviewMode) params.set('preview', 'true');
    if (isEmbedded) params.set('embedded', 'true');
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
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
      if (res.store?.shippingSettings) {
        setShippingSettings(res.store.shippingSettings);
      }
    } catch (err) {
      console.error('Failed to load store cart', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    const clean = couponInput.trim();
    if (!clean) {
      toast.warning('Empty Coupon', 'Please enter a coupon code');
      return;
    }
    setApplyingCoupon(true);
    try {
      const success = await applyCoupon(clean);
      if (success) {
        toast.success('Coupon Applied!', `Discount code "${clean.toUpperCase()}" applied successfully`);
        setCouponInput('');
        setShowCouponInput(false);
      } else {
        toast.error('Invalid Coupon', couponError || 'This coupon is not valid');
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    toast.info('Coupon Removed', 'Discount code has been removed from your order');
  };

  const handleRemoveItem = async (variantId: string, productName: string) => {
    setRemovingItemId(variantId);
    try {
      await removeItem(variantId);
      toast.success('Item Removed', `${productName} removed from your cart`);
    } catch {
      toast.error('Remove Failed', 'Could not remove the item. Please try again.');
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleQuantityChange = async (variantId: string, newQty: number, productName: string) => {
    try {
      if (newQty <= 0) {
        await removeItem(variantId);
        toast.success('Item Removed', `${productName} removed from cart`);
      } else {
        await updateQuantity(variantId, newQty);
      }
    } catch {
      toast.error('Update Failed', 'Could not update quantity');
    }
  };

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-gray-500">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const { store, themeConfig } = storeData;
  const items = cart?.items || [];
  const totalSavings = items.reduce((acc: number, item: any) => {
    const variant = item.variant || {};
    const compare = variant.compareAtPricePaise || 0;
    const price = variant.pricePaise || 0;
    if (compare > price) {
      return acc + (compare - price) * item.quantity;
    }
    return acc;
  }, 0);

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>Shopping Cart ({itemCount}) | {store.name}</title>
        <meta name="description" content={`Your shopping cart at ${store.name}. ${itemCount} items ready for checkout.`} />
      </Head>

      {/* Persistent Merchant Preview Banner (Hidden when embedded in iframe) */}
      {isPreviewMode && !isEmbedded && (
        <div className="bg-slate-950 text-white font-medium text-xs py-2 px-4 sticky top-0 z-50 shadow-md flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-white">Merchant Preview</span>
            <span className="text-slate-400 hidden sm:inline">— You're viewing your store exactly as customers will see it.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem('simply_merchant_preview');
              } catch {}
              if (window.opener) {
                window.close();
              } else {
                window.location.href = getSellerStorePreviewUrl();
              }
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition"
          >
            Exit Preview
          </button>
        </div>
      )}

      <StoreHeader store={store} themeConfig={themeConfig} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href={getLink(`/store/${slug}`)} className="hover:text-gray-900 flex items-center gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-800">Shopping Cart</span>
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-xs text-gray-500 mt-1">
              {itemCount === 0 
                ? 'Your cart is empty'
                : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for checkout`
              }
            </p>
          </div>
          {itemCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure Checkout</span>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          /* ================================================================
             EMPTY CART STATE
          ================================================================ */
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-5 max-w-xl mx-auto animate-fadeIn">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-800">Your cart is empty</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Discover our curated collection of products. Add items to your cart to begin your secure checkout experience.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href={getLink(`/store/${slug}`)}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-white shadow-md transition hover:opacity-90 hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* ================================================================
             CART WITH ITEMS
          ================================================================ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Shipping Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 text-xs text-emerald-800 animate-fadeIn">
                <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="font-bold">Free Delivery</span>
                  <span className="text-emerald-600 ml-1">on this order! Estimated dispatch within 24-48 hours.</span>
                </div>
              </div>

              {/* Item Cards */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
                {items.map((item: any, index: number) => {
                  const variant = item.variant || {};
                  const product = variant.product || {};
                  const cover = resolveVariantDisplayMedia({
                    itemImageUrl: item.imageUrl,
                    variant: item.variant,
                    productMedia: item.variant?.product?.media,
                    selectedOptionValues: item.variant?.optionValues,
                  });
                  const variantLabel = formatItemVariantLabel(item);
                  const productTitle = product.title || product.name || 'Product';
                  const targetVariantId = item.variantId || variant.id;
                  const isRemoving = removingItemId === targetVariantId;
                  const hasCompare = variant.compareAtPricePaise && variant.compareAtPricePaise > variant.pricePaise;
                  const lineTotal = (variant.pricePaise || 0) * item.quantity;

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 sm:p-6 transition-all duration-300 ${
                        isRemoving ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                      }`}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Product Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <Link href={getLink(`/store/${slug}/product/${product.id}`)}>
                            <SafeImage
                              src={cover}
                              alt={productTitle}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-gray-200 flex-shrink-0 hover:opacity-80 transition"
                              fallbackTitle={productTitle}
                            />
                          </Link>
                          <div className="space-y-1.5 min-w-0">
                            <Link
                              href={getLink(`/store/${slug}/product/${product.id}`)}
                              className="font-bold text-sm text-gray-900 hover:text-emerald-700 transition line-clamp-2"
                            >
                              {productTitle}
                            </Link>
                            {variantLabel && (
                              <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 text-gray-400" />
                                {variantLabel}
                              </p>
                            )}
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold font-mono text-gray-900">
                                {formatPaise(variant.pricePaise || 0)}
                              </span>
                              {hasCompare && (
                                <span className="text-xs text-gray-400 font-mono line-through">
                                  {formatPaise(variant.compareAtPricePaise)}
                                </span>
                              )}
                              {hasCompare && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {Math.round(((variant.compareAtPricePaise - variant.pricePaise) / variant.compareAtPricePaise) * 100)}% OFF
                                </span>
                              )}
                            </div>
                            {variant.sku && (
                              <p className="text-[10px] text-gray-400 font-mono">SKU: {variant.sku}</p>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(targetVariantId, item.quantity - 1, productTitle)}
                              className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-4 py-1.5 text-xs font-mono font-bold text-gray-900 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(targetVariantId, item.quantity + 1, productTitle)}
                              className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right space-y-1">
                            <span className="font-mono font-bold text-base text-gray-900 block">
                              {formatPaise(lineTotal)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(targetVariantId, productTitle)}
                              disabled={isRemoving}
                              className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 transition disabled:opacity-40"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-fadeIn">
                {appliedCoupon ? (
                  /* Applied Coupon Display */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
                        <Tag className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono tracking-wider border border-emerald-200">
                            {appliedCoupon.code}
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{appliedCoupon.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        -{formatPaise(discountPaise)}
                      </span>
                      <button
                        onClick={handleRemoveCoupon}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                        title="Remove coupon"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : showCouponInput ? (
                  /* Coupon Input Form */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-bold text-gray-900">Apply Coupon Code</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Enter coupon code"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-mono tracking-wider uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition coupon-input"
                        maxLength={20}
                        autoFocus
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
                        style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
                      >
                        {applyingCoupon ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Percent className="w-3.5 h-3.5" />
                        )}
                        <span>{applyingCoupon ? 'Checking...' : 'Apply'}</span>
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 animate-shake">
                        <X className="w-3 h-3" /> {couponError}
                      </p>
                    )}
                    <button
                      onClick={() => { setShowCouponInput(false); setCouponInput(''); }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  /* Coupon Trigger Button */
                  <button
                    onClick={() => setShowCouponInput(true)}
                    className="w-full flex items-center justify-between p-1 text-left hover:bg-gray-50 rounded-lg transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200 group-hover:bg-amber-100 transition">
                        <Tag className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Have a coupon code?</p>
                        <p className="text-[11px] text-gray-500">Apply discount to reduce your total</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition" />
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: Order Summary */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Order Summary
                </h2>

                {/* Free Delivery Goal Tracker */}
                {freeShippingThresholdPaise && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                    isFreeDeliveryQualified
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Truck className={`w-4 h-4 ${isFreeDeliveryQualified ? 'text-emerald-600' : 'text-amber-700'}`} />
                        {isFreeDeliveryQualified ? (
                          <span className="font-bold text-emerald-800">🎉 FREE Delivery Unlocked!</span>
                        ) : (
                          <span>Add <strong className="font-mono text-amber-950 font-bold">{formatPaise(freeDeliveryRemainingPaise)}</strong> more for FREE Delivery</span>
                        )}
                      </span>
                      <span className="text-[11px] font-mono opacity-75">
                        Goal: {formatPaise(freeShippingThresholdPaise)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFreeDeliveryQualified ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((subtotalPaise / freeShippingThresholdPaise) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-mono font-semibold text-gray-900">
                      {formatPaise(subtotalPaise)}
                    </span>
                  </div>

                  {/* Coupon Discount */}
                  {appliedCoupon && discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Coupon ({appliedCoupon.code})
                      </span>
                      <span className="font-mono font-semibold">-{formatPaise(discountPaise)}</span>
                    </div>
                  )}

                  {/* Savings from Compare Prices */}
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        Product Savings
                      </span>
                      <span className="font-mono font-semibold">-{formatPaise(totalSavings)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Delivery / Shipping
                    </span>
                    {shippingPaise === 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        FREE
                        {freeShippingThresholdPaise && isFreeDeliveryQualified && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                            Eligible
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="font-mono font-semibold text-gray-900">
                        {formatPaise(shippingPaise)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Taxes</span>
                    <span>Included</span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex justify-between text-base font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="font-mono text-lg">{formatPaise(grandTotalPaise)}</span>
                  </div>

                  {(discountPaise > 0 || totalSavings > 0) && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                      <span className="text-xs font-bold text-emerald-800">
                        🎉 You save {formatPaise(discountPaise + totalSavings)} on this order!
                      </span>
                    </div>
                  )}
                </div>

                {/* Checkout CTA */}
                <div className="space-y-3">
                  <Link
                    href={getLink(`/store/${slug}/checkout`)}
                    className="w-full py-4 rounded-xl text-sm font-bold text-white shadow-lg transition hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Secure Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href={getLink(`/store/${slug}`)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition flex items-center justify-center gap-1 border border-gray-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Continue Shopping</span>
                  </Link>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>256-bit SSL encrypted payment processing</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Truck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span>Direct door-to-door courier with tracking</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Estimated dispatch within 24-48 business hours</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>100% genuine and quality guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <StoreFooter store={store} themeConfig={themeConfig} />
    </ThemeWrapper>
  );
}

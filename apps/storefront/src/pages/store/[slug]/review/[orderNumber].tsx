import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Star,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Package,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '../../../../context/CartContext';
import { ThemeWrapper } from '../../../../components/ThemeWrapper';
import { StoreHeader } from '../../../../components/StoreHeader';
import { StoreFooter } from '../../../../components/StoreFooter';

interface EligibleProduct {
  orderItemId: string;
  productId: string;
  productName: string;
  variantTitle?: string | null;
  productImage?: string | null;
  unitPricePaise: number;
  quantity: number;
  existingReview: {
    id: string;
    rating: number;
    title?: string | null;
    body: string;
    createdAt: string;
  } | null;
}

export default function OrderReviewPage() {
  const router = useRouter();
  const { slug, orderNumber, token } = router.query;
  const { api, setStoreId } = useCart();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [eligibleData, setEligibleData] = useState<{
    orderNumber: string;
    customerName: string;
    deliveredAt?: string;
    items: EligibleProduct[];
  } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states per order item: { [orderItemId]: { rating: number, title: string, body: string, submitting: boolean, error: string | null, submitted: boolean } }
  const [forms, setForms] = useState<
    Record<
      string,
      {
        rating: number;
        title: string;
        body: string;
        submitting: boolean;
        error: string | null;
        submitted: boolean;
      }
    >
  >({});

  useEffect(() => {
    if (!slug || !orderNumber) return;
    loadEligibility(String(slug), String(orderNumber), token ? String(token) : '');
  }, [slug, orderNumber, token]);

  const loadEligibility = async (storeSlug: string, orderNum: string, reviewToken: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const [sRes, eRes] = await Promise.all([
        api.stores.getPublicStorefront(storeSlug),
        api.reviews.getEligible(storeSlug, orderNum, reviewToken),
      ]);
      setStoreData(sRes);
      setEligibleData(eRes);
      if (sRes.store?.id) {
        setStoreId(sRes.store.id);
      }

      // Initialize form state for each item
      const initialForms: Record<string, any> = {};
      (eRes.items || []).forEach((item: EligibleProduct) => {
        initialForms[item.orderItemId] = {
          rating: item.existingReview?.rating || 5,
          title: item.existingReview?.title || '',
          body: item.existingReview?.body || '',
          submitting: false,
          error: null,
          submitted: Boolean(item.existingReview),
        };
      });
      setForms(initialForms);
    } catch (err: any) {
      console.error('Failed to load review eligibility', err);
      setAuthError(
        err?.message ||
          'Review authorization failed. Please make sure this order is delivered and your review link is valid.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (orderItemId: string, rating: number) => {
    setForms((prev) => ({
      ...prev,
      [orderItemId]: {
        ...prev[orderItemId],
        rating,
      },
    }));
  };

  const handleFieldChange = (orderItemId: string, field: 'title' | 'body', val: string) => {
    setForms((prev) => ({
      ...prev,
      [orderItemId]: {
        ...prev[orderItemId],
        [field]: val,
      },
    }));
  };

  const handleSubmitReview = async (item: EligibleProduct) => {
    if (!slug || !orderNumber || !token) return;
    const form = forms[item.orderItemId];
    if (!form || !form.body.trim()) {
      setForms((prev) => ({
        ...prev,
        [item.orderItemId]: {
          ...prev[item.orderItemId],
          error: 'Please write a brief review of your experience before submitting.',
        },
      }));
      return;
    }

    setForms((prev) => ({
      ...prev,
      [item.orderItemId]: {
        ...prev[item.orderItemId],
        submitting: true,
        error: null,
      },
    }));

    try {
      await api.reviews.submit(String(slug), {
        orderNumber: String(orderNumber),
        token: String(token),
        orderItemId: item.orderItemId,
        productId: item.productId,
        reviewerName: eligibleData?.customerName,
        rating: form.rating,
        title: form.title.trim() || undefined,
        body: form.body.trim(),
      });

      setForms((prev) => ({
        ...prev,
        [item.orderItemId]: {
          ...prev[item.orderItemId],
          submitting: false,
          submitted: true,
          error: null,
        },
      }));
    } catch (err: any) {
      console.error('Failed to submit review', err);
      setForms((prev) => ({
        ...prev,
        [item.orderItemId]: {
          ...prev[item.orderItemId],
          submitting: false,
          error: err?.message || 'Failed to submit review. Please try again.',
        },
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-gray-300 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const store = storeData?.store;
  const themeConfig = storeData?.themeConfig;

  if (authError || !eligibleData) {
    return (
      <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
        {store && <StoreHeader store={store} themeConfig={themeConfig} />}
        <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Verified Review Required
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {authError ||
              'Only customers who have successfully received their delivered order can leave a verified product review. Please check your delivery confirmation email or WhatsApp link.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/store/${slug}`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <span>Back to Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        {store && <StoreFooter store={store} />}
      </ThemeWrapper>
    );
  }

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>Share Your Feedback | Order #{orderNumber} | {store?.name || 'Store'}</title>
      </Head>

      {store && <StoreHeader store={store} themeConfig={themeConfig} />}

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Verified Purchase Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            How was your purchase?
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Hello <strong className="text-gray-900 dark:text-white">{eligibleData.customerName}</strong>, thank you for supporting{' '}
            <strong className="text-gray-900 dark:text-white">{store?.name}</strong>. Your honest review helps this business improve and helps fellow shoppers make confident decisions.
          </p>
        </div>

        {/* Respectful Content Notice (Requirement 30) */}
        <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 rounded-2xl text-xs text-gray-600 dark:text-gray-300 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Please keep your review respectful and based on your genuine experience. Inappropriate, offensive, or abusive content may be removed according to our review guidelines.
          </p>
        </div>

        {/* Multi-Product Review List (Requirement 28) */}
        <div className="space-y-6">
          {eligibleData.items.map((item) => {
            const form = forms[item.orderItemId] || {
              rating: 5,
              title: '',
              body: '',
              submitting: false,
              error: null,
              submitted: false,
            };

            return (
              <div
                key={item.orderItemId}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5"
              >
                {/* Product Snapshot */}
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 shrink-0">
                      <Package className="w-7 h-7" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Verified Purchase
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate mt-1">
                      {item.productName}
                    </h3>
                    {item.variantTitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.variantTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Already Submitted State (Requirements 34 & 63) */}
                {form.submitted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle className="w-4 h-4" />
                        <span>Review submitted successfully ✓</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= form.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {form.title && (
                      <p className="text-xs font-bold text-gray-900 dark:text-white">"{form.title}"</p>
                    )}
                    <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{form.body}"</p>

                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                      <Link
                        href={`/store/${slug}/product/${item.productId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                      >
                        <span>View Product Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Review Input Form (Requirement 29) */
                  <div className="space-y-4">
                    {/* Star Rating Selector */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                        Your Rating <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(item.orderItemId, star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                            title={`${star} Star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                star <= form.rating
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                  : 'text-gray-300 dark:text-slate-700 hover:text-amber-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-2">
                          {form.rating === 5
                            ? 'Excellent'
                            : form.rating === 4
                            ? 'Very Good'
                            : form.rating === 3
                            ? 'Good'
                            : form.rating === 2
                            ? 'Fair'
                            : 'Poor'}
                        </span>
                      </div>
                    </div>

                    {/* Optional Review Title */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                        Headline / Title (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Great quality and fast delivery!"
                        value={form.title}
                        onChange={(e) => handleFieldChange(item.orderItemId, 'title', e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Review Body Textarea */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Your Review <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Share your genuine experience with this product..."
                        value={form.body}
                        onChange={(e) => handleFieldChange(item.orderItemId, 'body', e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                      />
                    </div>

                    {/* Error message */}
                    {form.error && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{form.error}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="button"
                      disabled={form.submitting}
                      onClick={() => handleSubmitReview(item)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {form.submitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Submit Verified Review</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
          <Link
            href={`/store/${slug}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl text-center shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <Link
            href={`/store/${slug}/order/${orderNumber}${token ? `?t=${token}` : ''}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl text-center transition"
          >
            <span>View Order Details</span>
          </Link>
        </div>
      </main>

      {store && <StoreFooter store={store} />}
    </ThemeWrapper>
  );
}

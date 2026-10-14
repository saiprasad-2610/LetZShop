import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Star,
  CheckCircle,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Package,
  ExternalLink,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

interface SellerReview {
  id: string;
  reviewerName: string;
  rating: number;
  title?: string | null;
  body: string;
  verifiedPurchase: boolean;
  status: 'ACTIVE' | 'REMOVED';
  moderationReason?: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
  };
  order: {
    id: string;
    orderNumber: string;
  };
}

export default function SellerReviewsPage() {
  const { api, store, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadReviews();
    }
  }, [authLoading]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res: any = await api.reviews.getSellerReviews({ page: 1, limit: 50 });
      setReviews(res.reviews || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load seller reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const activeReviews = reviews.filter((r) => r.status === 'ACTIVE');
  const avgRating =
    activeReviews.length > 0
      ? activeReviews.reduce((sum, r) => sum + r.rating, 0) / activeReviews.length
      : 0;

  return (
    <Layout title="Customer Reviews">
      <Head>
        <title>Customer Reviews | {store?.name || 'Seller Dashboard'}</title>
      </Head>

      <div className="space-y-6">
        {/* Header Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-merchant-text tracking-tight">
              Customer Product Reviews
            </h1>
            <p className="text-xs text-merchant-text-muted mt-1">
              Verified feedback submitted by buyers following order delivery
            </p>
          </div>

          <button
            type="button"
            onClick={loadReviews}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-merchant-surface border border-merchant-border hover:bg-merchant-surface-muted rounded-xl text-xs font-semibold text-merchant-text shadow-2xs transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-merchant-primary ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 sm:p-5 bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-merchant-text-muted uppercase">Average Rating</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-merchant-text font-mono">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-amber-500 text-lg">★</span>
            </div>
            <p className="text-[11px] text-merchant-text-muted">Across all active verified reviews</p>
          </div>

          <div className="p-4 sm:p-5 bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-merchant-text-muted uppercase">Total Reviews</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-merchant-text font-mono">
              {totalCount}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {activeReviews.length} active on storefront
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-merchant-text-muted uppercase">Verified Purchases</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              100%
            </div>
            <p className="text-[11px] text-merchant-text-muted">Enforced by delivery authorization token</p>
          </div>
        </div>

        {/* Policy & Moderation Notice (Requirements 35 & 36) */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Transparent Verified Reviews Policy</p>
            <p className="leading-relaxed text-[11px] text-indigo-600/90 dark:text-indigo-400/90">
              Reviews can only be written by customers who received a delivered order. To protect consumer trust, merchants cannot directly delete negative reviews. If a review contains abusive, profane, or policy-violating content, please contact Platform Support to request SuperAdmin review moderation.
            </p>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-merchant-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-merchant-text uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-merchant-primary" />
              <span>Customer Feedback Feed</span>
            </h3>
            <span className="text-xs text-merchant-text-muted font-mono">{reviews.length} items</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-merchant-text-muted">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-merchant-surface border border-merchant-border text-merchant-text-muted flex items-center justify-center mx-auto">
                <Star className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-merchant-text">No reviews received yet</p>
              <p className="text-[11px] text-merchant-text-muted max-w-sm mx-auto">
                When you dispatch and complete orders, customers receive a verified review request link via email and WhatsApp.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-merchant-border">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 sm:p-5 space-y-2 hover:bg-merchant-surface/50 transition">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono font-bold text-xs text-merchant-text">{rev.rating}.0</span>
                      {rev.title && (
                        <span className="font-bold text-xs text-merchant-text truncate max-w-xs sm:max-w-md">
                          "{rev.title}"
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          rev.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {rev.status === 'ACTIVE' ? 'Published' : 'Moderated by Admin'}
                      </span>
                      <span className="text-[11px] text-merchant-text-muted font-mono">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-merchant-text-secondary leading-relaxed whitespace-pre-line">
                    {rev.body}
                  </p>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-merchant-border text-[11px] text-merchant-text-muted">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-merchant-text">
                        Customer: {rev.reviewerName}
                      </span>
                      {rev.verifiedPurchase && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono">Order: #{rev.order?.orderNumber}</span>
                      <span className="font-semibold text-merchant-primary">
                        Product: {rev.product?.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

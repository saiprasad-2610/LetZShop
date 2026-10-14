import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, ShieldCheck, MessageSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ReviewItem {
  id: string;
  reviewerName: string;
  rating: number;
  title?: string | null;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ProductReviewsData {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<number, number>;
  reviews: ReviewItem[];
}

interface ProductReviewsSectionProps {
  slug: string;
  productId: string;
  productName?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  slug,
  productId,
  productName,
}) => {
  const { api } = useCart();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductReviewsData | null>(null);

  useEffect(() => {
    if (!slug || !productId) return;
    loadReviews();
  }, [slug, productId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await api.reviews.getProductReviews(slug, productId);
      setData(res);
    } catch (err) {
      console.error('Failed to load product reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const maskName = (name: string) => {
    if (!name) return 'Customer';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0];
    }
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
  };

  if (loading) {
    return (
      <div className="py-8 border-t border-gray-100 dark:border-slate-800 space-y-4 animate-pulse">
        <div className="h-4 w-40 bg-gray-200 dark:bg-slate-800 rounded" />
        <div className="h-20 bg-gray-100 dark:bg-slate-800/60 rounded-2xl" />
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const total = data?.totalReviews || 0;
  const avg = data?.averageRating || 0;
  const breakdown = (data as any)?.distribution || (data as any)?.breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <section className="pt-8 pb-10 border-t border-gray-200 dark:border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Customer Reviews</span>
            {total > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                {total}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Verified ratings from shoppers who purchased this product
          </p>
        </div>
      </div>

      {total === 0 ? (
        /* Empty Reviews State */
        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No reviews yet</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Customers receive a secure verified review link after their order is delivered.
          </p>
        </div>
      ) : (
        /* Reviews Summary & Rating Distribution (Requirement 33) */
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Overall Score */}
            <div className="text-center md:text-left space-y-1.5 md:border-r md:border-gray-200 dark:md:border-slate-700/60 md:pr-6">
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-mono">
                  {avg.toFixed(1)}
                </span>
                <span className="text-lg text-amber-500 font-bold">★</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">out of 5</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(avg)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Based on <strong className="text-gray-900 dark:text-white">{total}</strong> verified review{total > 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Breakdown Distribution Bars (Requirement 33) */}
            <div className="md:col-span-2 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = breakdown[stars] || 0;
                const percent = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-bold text-gray-700 dark:text-gray-300 flex items-center justify-end gap-1 font-mono">
                      <span>{stars}</span>
                      <span className="text-amber-500 text-[10px]">★</span>
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[11px] text-gray-500 dark:text-gray-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List of Verified Reviews (Requirements 31 & 32) */}
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs space-y-2.5 transition"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.title && (
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        {rev.title}
                      </h4>
                    )}
                  </div>

                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                    {formatDate(rev.createdAt)}
                  </span>
                </div>

                {/* Review Body (Supports Marathi/Unicode) */}
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {rev.body}
                </p>

                {/* Reviewer Display Name & Verified Purchase Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800/80 text-xs">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {maskName(rev.reviewerName)}
                  </span>
                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified Purchase</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

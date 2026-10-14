import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Star,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  EyeOff,
  Store,
  Package,
  RotateCcw,
  Loader2,
  X,
  MessageSquare,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ReviewRecord {
  id: string;
  reviewerName: string;
  rating: number;
  title?: string | null;
  body: string;
  verifiedPurchase: boolean;
  status: 'ACTIVE' | 'REMOVED';
  moderationReason?: string | null;
  moderatedAt?: string | null;
  moderatedBy?: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    images?: Array<{ url: string }>;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
  order: {
    id: string;
    orderNumber: string;
  };
}

export default function AdminReviewModerationPage() {
  const { api } = useAdminAuth();

  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REMOVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Moderation modal state
  const [moderatingReview, setModeratingReview] = useState<ReviewRecord | null>(null);
  const [moderationReason, setModerationReason] = useState('Violates platform respectful review guidelines');
  const [customReason, setCustomReason] = useState('');
  const [submittingModeration, setSubmittingModeration] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const COMMON_REASONS = [
    'Violates platform respectful review guidelines',
    'Abusive, offensive, or hateful content',
    'Spam or irrelevant advertising content',
    'False claims investigated with merchant support',
    'Customer requested review removal',
    'Other reason (specify below)',
  ];

  useEffect(() => {
    loadReviews();
  }, [statusFilter, searchQuery, currentPage]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res: any = await api.reviews.getAdminReviews({
        page: currentPage,
        limit: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });

      setReviews(res.reviews || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load admin reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModeration = (review: ReviewRecord) => {
    setModeratingReview(review);
    setModerationReason(COMMON_REASONS[0]);
    setCustomReason('');
    setModerationError(null);
  };

  const handleConfirmRemove = async () => {
    if (!moderatingReview) return;
    setSubmittingModeration(true);
    setModerationError(null);

    const effectiveReason =
      moderationReason === 'Other reason (specify below)' && customReason.trim()
        ? customReason.trim()
        : moderationReason;

    try {
      await api.reviews.moderateAdminReview(moderatingReview.id, {
        status: 'REMOVED',
        reason: effectiveReason,
      });

      setModeratingReview(null);
      await loadReviews();
    } catch (err: any) {
      console.error('Failed to moderate review', err);
      setModerationError(err.message || 'Failed to update review status.');
    } finally {
      setSubmittingModeration(false);
    }
  };

  const handleRestoreReview = async (review: ReviewRecord) => {
    if (!confirm(`Restore review by "${review.reviewerName}" to active status on storefront?`)) {
      return;
    }

    try {
      await api.reviews.moderateAdminReview(review.id, {
        status: 'ACTIVE',
        reason: 'Restored to storefront by Platform SuperAdmin',
      });
      await loadReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to restore review');
    }
  };

  const activeCount = reviews.filter((r) => r.status === 'ACTIVE').length;
  const removedCount = reviews.filter((r) => r.status === 'REMOVED').length;

  return (
    <AdminLayout>
      <Head>
        <title>Product Review Moderation | Platform SuperAdmin</title>
      </Head>

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-indigo-600" />
              Product Review Moderation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              SuperAdmin control over verified customer product reviews. Remove abusive or policy-violating reviews across all merchants.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold shadow-xs">
              Total Logged: {totalCount}
            </span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Reviews
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ACTIVE');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('REMOVED');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'REMOVED'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Removed / Hidden
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search product, merchant, reviewer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product & Merchant</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Rating & Review</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading reviews...</span>
                      </div>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      No reviews match the current filters.
                    </td>
                  </tr>
                ) : (
                  reviews.map((rev) => (
                    <tr
                      key={rev.id}
                      className={`hover:bg-slate-50/80 transition ${
                        rev.status === 'REMOVED' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Product & Store */}
                      <td className="py-3.5 px-4 align-top max-w-[200px]">
                        <p className="font-bold text-slate-900 truncate">{rev.product?.name || 'Product'}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <Store className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{rev.store?.name}</span>
                        </p>
                      </td>

                      {/* Reviewer */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-semibold text-slate-900">{rev.reviewerName}</p>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                            <CheckCircle className="w-3 h-3" /> Verified Purchase
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>

                      {/* Rating & Review Body */}
                      <td className="py-3.5 px-4 align-top max-w-[320px]">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="font-mono font-bold text-slate-700 ml-1">
                            {rev.rating}.0
                          </span>
                        </div>
                        {rev.title && (
                          <p className="font-bold text-slate-900 text-xs mb-0.5 truncate">
                            "{rev.title}"
                          </p>
                        )}
                        <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed whitespace-pre-line">
                          {rev.body}
                        </p>

                        {/* Moderation note if removed */}
                        {rev.status === 'REMOVED' && (
                          <div className="mt-2 p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 text-[11px] space-y-0.5">
                            <p className="font-bold">Moderated: {rev.moderationReason}</p>
                            {rev.moderatedAt && (
                              <p className="text-[10px] text-rose-600">
                                Removed on {new Date(rev.moderatedAt).toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Order Number */}
                      <td className="py-3.5 px-4 align-top font-mono text-[11px] text-slate-600">
                        #{rev.order?.orderNumber || 'N/A'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rev.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rev.status === 'ACTIVE' ? 'Active' : 'Removed'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        {rev.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModeration(rev)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                            title="Hide or remove review from storefront"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Remove / Hide</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestoreReview(rev)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                            title="Restore review to public product page"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: Moderation Reason Dialog (Requirement 35) */}
        {moderatingReview && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Moderate & Hide Review</h3>
                    <p className="text-xs text-slate-500">Remove review from public storefront and rating counts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModeratingReview(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Review Snippet */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{moderatingReview.reviewerName}</span>
                  <span className="text-amber-500">★ {moderatingReview.rating}.0</span>
                </div>
                <p className="text-slate-600 line-clamp-2 italic">"{moderatingReview.body}"</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Store: {moderatingReview.store?.name} • Product: {moderatingReview.product?.name}
                </p>
              </div>

              {/* Moderation Reason Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Reason for Removal <span className="text-rose-500">*</span>
                </label>
                <select
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  {COMMON_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {moderationReason === 'Other reason (specify below)' && (
                  <textarea
                    rows={2}
                    placeholder="Enter detailed reason for review removal..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                )}
              </div>

              {moderationError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{moderationError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submittingModeration}
                  onClick={() => setModeratingReview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingModeration}
                  onClick={handleConfirmRemove}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingModeration ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Hiding Review...</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Confirm Removal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

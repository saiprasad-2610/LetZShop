import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Star,
  CheckCircle,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Package,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Flag,
  Calendar,
  SlidersHorizontal,
  Clock,
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
  status: 'ACTIVE' | 'REMOVED' | 'SENT_FOR_REVIEW';
  moderationReason?: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug?: string;
    image?: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    createdAt?: string;
  };
}

interface ReviewSummary {
  total: number;
  averageRating: number;
  verifiedCount: number;
  fiveStarCount: number;
  negativeCount: number;
  distribution: Record<number, number>;
}

interface ProductOption {
  id: string;
  name: string;
}

export default function SellerReviewsPage() {
  const router = useRouter();
  const { api, store, loading: authLoading } = useAuth();

  // Data states
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    total: 0,
    averageRating: 0,
    verifiedCount: 0,
    fiveStarCount: 0,
    negativeCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [productsList, setProductsList] = useState<ProductOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Status and query states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Report modal state
  const [reportingReview, setReportingReview] = useState<SellerReview | null>(null);
  const [reportReason, setReportReason] = useState('Abusive / offensive content');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

  // Load products for dropdown filter
  useEffect(() => {
    if (!authLoading) {
      loadProducts();
    }
  }, [authLoading]);

  const loadProducts = async () => {
    try {
      const res: any = await api.catalog.getProducts({ limit: 100 });
      const items = res?.items || res || [];
      setProductsList(items.map((p: any) => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.warn('Could not load products for filter list', err);
    }
  };

  // Main data loader
  useEffect(() => {
    if (!authLoading) {
      loadReviews();
    }
  }, [
    authLoading,
    currentPage,
    activeSearch,
    ratingFilter,
    productFilter,
    dateRangeFilter,
    statusFilter,
    sortBy,
  ]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.reviews.getSellerReviews({
        page: currentPage,
        pageSize,
        rating: ratingFilter !== 'ALL'
          ? (ratingFilter === 'BELOW_3' ? 'BELOW_3' : parseInt(ratingFilter, 10))
          : undefined,
        productId: productFilter !== 'ALL' ? productFilter : undefined,
        status: statusFilter,
        dateRange: dateRangeFilter !== 'all' ? dateRangeFilter : undefined,
        search: activeSearch.trim() || undefined,
        sort: sortBy,
      });

      // Format response gracefully whether API returns structured object or fallback array
      if (Array.isArray(res)) {
        setReviews(res);
        setTotalCount(res.length);
        setTotalPages(1);
      } else {
        const reviewItems = res?.reviews || res?.items || [];
        setReviews(reviewItems);
        if (res?.summary) {
          setSummary({
            total: res.summary.total || 0,
            averageRating: res.summary.averageRating || 0,
            verifiedCount: res.summary.verifiedCount || 0,
            fiveStarCount: res.summary.fiveStarCount || 0,
            negativeCount: res.summary.negativeCount !== undefined
              ? res.summary.negativeCount
              : ((res.summary.distribution?.[1] || 0) + (res.summary.distribution?.[2] || 0)),
            distribution: res.summary.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          });
        }
        if (res?.pagination) {
          setTotalCount(res.pagination.total || 0);
          setTotalPages(res.pagination.totalPages || 1);
        } else {
          setTotalCount(reviewItems.length);
          setTotalPages(1);
        }
      }
    } catch (err: any) {
      console.error('Failed to load seller reviews', err);
      setError(err?.message || 'Unable to load customer reviews from the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setActiveSearch('');
    setRatingFilter('ALL');
    setProductFilter('ALL');
    setDateRangeFilter('all');
    setStatusFilter('ACTIVE');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    activeSearch.trim() !== '' ||
    ratingFilter !== 'ALL' ||
    productFilter !== 'ALL' ||
    dateRangeFilter !== 'all' ||
    statusFilter !== 'ACTIVE' ||
    sortBy !== 'newest';

  // Submit report review to moderation
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview) return;
    setReportSubmitting(true);
    try {
      await api.reviews.reportSellerReview(reportingReview.id, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportSuccessMessage(
        `Report received for Order #${reportingReview.order.orderNumber}. Sent for platform review.`
      );
      setReportingReview(null);
      setReportReason('Abusive / offensive content');
      setReportDetails('');
      await loadReviews();
    } catch (err: any) {
      alert(err?.message || 'Failed to submit moderation request.');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <Layout title="Customer Reviews">
      <Head>
        <title>Customer Reviews | {store?.name || 'Seller Dashboard'}</title>
      </Head>

      <div className="space-y-6">
        {/* Success Banner */}
        {reportSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reportSuccessMessage}</span>
            </div>
            <button
              onClick={() => setReportSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:hover:text-emerald-100 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-merchant-text tracking-tight">
              Customer Product Reviews
            </h1>
            <p className="text-xs text-merchant-text-muted mt-1">
              Verified feedback submitted by buyers following confirmed order delivery
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadReviews}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-merchant-surface border border-merchant-border hover:bg-merchant-surface-muted rounded-xl text-xs font-semibold text-merchant-text shadow-2xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-merchant-primary ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Reviews */}
          <div className="p-4 sm:p-5 bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-merchant-text-muted uppercase tracking-wider">
              Total Reviews
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-merchant-text font-mono">
              {summary.total}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Live on storefront
            </p>
          </div>

          {/* Card 2: Average Rating */}
          <div className="p-4 sm:p-5 bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-merchant-text-muted uppercase tracking-wider">
              Average Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-merchant-text font-mono">
                {summary.averageRating.toFixed(1)}
              </span>
              <span className="text-amber-500 text-lg">★</span>
            </div>
            <p className="text-[11px] text-merchant-text-muted">
              {summary.total > 0 ? `Across ${summary.total} verified reviews` : 'No reviews recorded yet'}
            </p>
          </div>

          {/* Card 3: 5-Star Reviews */}
          <div className="p-4 sm:p-5 bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-merchant-text-muted uppercase tracking-wider">
              5-Star Reviews
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
              {summary.fiveStarCount}
            </div>
            <p className="text-[11px] text-merchant-text-muted">
              {summary.total > 0
                ? `${Math.round((summary.fiveStarCount / summary.total) * 100)}% highest satisfaction`
                : 'Top rating count'}
            </p>
          </div>

          {/* Card 4: Negative Reviews (< 3 Stars) */}
          <div
            onClick={() => {
              setRatingFilter(ratingFilter === 'BELOW_3' ? 'ALL' : 'BELOW_3');
              setCurrentPage(1);
            }}
            className={`p-4 sm:p-5 bg-merchant-surface-raised border rounded-2xl shadow-xs space-y-1 cursor-pointer transition hover:border-rose-400/60 ${
              ratingFilter === 'BELOW_3'
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5'
                : 'border-merchant-border'
            }`}
            title="Click to filter reviews below 3 stars"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-merchant-text-muted uppercase tracking-wider">
                Negative Reviews
              </span>
              {summary.negativeCount > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  &lt; 3 Stars
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  0 Critical
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {summary.negativeCount}
            </div>
            <p className="text-[11px] text-merchant-text-muted">
              {summary.negativeCount === 1 ? '1 review with < 3 stars' : `${summary.negativeCount} reviews with < 3 stars`}
            </p>
          </div>
        </div>

        {/* Rating Distribution Breakdown & Policy Note */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Rating Distribution Bar Chart */}
          <div className="lg:col-span-2 p-4 sm:p-5 bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-merchant-border pb-2.5">
              <span className="text-xs font-bold text-merchant-text uppercase tracking-wider">
                Rating Breakdown
              </span>
              <span className="text-[11px] text-merchant-text-muted font-mono">
                {summary.total} active review{summary.total === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary.distribution[stars] || 0;
                const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRatingFilter(String(stars));
                        setCurrentPage(1);
                      }}
                      className="w-12 text-left font-semibold text-merchant-text flex items-center gap-1 hover:text-merchant-primary transition cursor-pointer"
                    >
                      <span>{stars}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                    </button>

                    <div className="flex-1 h-3 bg-merchant-surface rounded-full overflow-hidden border border-merchant-border/60">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="w-16 text-right font-mono text-[11px] text-merchant-text-muted">
                      {count} <span className="text-[10px]">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Policy & Moderation Info */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Verified Reviews & Moderation</span>
              </div>
              <p className="text-[11px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
                Reviews are genuine, verified feedback submitted exclusively by buyers who completed purchase and delivery.
              </p>
              <p className="text-[11px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
                To maintain consumer trust, merchants cannot directly delete negative reviews. If a review contains abusive, obscene, or false content, click <strong>Report Review</strong> to request SuperAdmin moderation.
              </p>
            </div>

            <div className="pt-2 border-t border-indigo-500/20 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              ✓ Platform-wide policy protection active
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-merchant-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reviews by customer, product, order #, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-merchant-surface border border-merchant-border rounded-xl text-xs text-merchant-text placeholder:text-merchant-text-muted focus:outline-hidden focus:ring-1 focus:ring-merchant-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-merchant-text-muted hover:text-merchant-text p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Quick Action Reset */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl transition self-start lg:self-auto cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-merchant-border">
            {/* Rating Filter */}
            <div>
              <label className="block text-[10px] font-bold text-merchant-text-muted uppercase mb-1">
                Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-merchant-surface border border-merchant-border rounded-lg text-xs text-merchant-text focus:outline-hidden focus:ring-1 focus:ring-merchant-primary"
              >
                <option value="ALL">All Ratings</option>
                <option value="BELOW_3">Negative (&lt; 3 Stars)</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-[10px] font-bold text-merchant-text-muted uppercase mb-1">
                Product
              </label>
              <select
                value={productFilter}
                onChange={(e) => {
                  setProductFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-merchant-surface border border-merchant-border rounded-lg text-xs text-merchant-text truncate focus:outline-hidden focus:ring-1 focus:ring-merchant-primary"
              >
                <option value="ALL">All Products</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-[10px] font-bold text-merchant-text-muted uppercase mb-1">
                Date Range
              </label>
              <select
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-merchant-surface border border-merchant-border rounded-lg text-xs text-merchant-text focus:outline-hidden focus:ring-1 focus:ring-merchant-primary"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
              </select>
            </div>

            {/* Moderation Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-merchant-text-muted uppercase mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-merchant-surface border border-merchant-border rounded-lg text-xs text-merchant-text focus:outline-hidden focus:ring-1 focus:ring-merchant-primary"
              >
                <option value="ACTIVE">Active Reviews</option>
                <option value="SENT_FOR_REVIEW">Sent for Review</option>
                <option value="REMOVED">Taken Down by Admin</option>
                <option value="ALL">All Reviews</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="block text-[10px] font-bold text-merchant-text-muted uppercase mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-merchant-surface border border-merchant-border rounded-lg text-xs text-merchant-text focus:outline-hidden focus:ring-1 focus:ring-merchant-primary"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_rating">Highest Rating</option>
                <option value="lowest_rating">Lowest Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews Feed Section */}
        <div className="bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-merchant-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-merchant-text uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-merchant-primary" />
              <span>Customer Feedback Feed</span>
            </h3>
            <span className="text-xs text-merchant-text-muted font-mono">
              {totalCount} item{totalCount === 1 ? '' : 's'}
            </span>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="divide-y divide-merchant-border p-4 space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="space-y-3 pt-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-merchant-text">Unable to load reviews</p>
              <p className="text-[11px] text-merchant-text-muted max-w-sm mx-auto">{error}</p>
              <button
                type="button"
                onClick={loadReviews}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-merchant-primary text-white text-xs font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : reviews.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-merchant-surface border border-merchant-border text-merchant-text-muted flex items-center justify-center mx-auto">
                <Star className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-merchant-text">
                {hasActiveFilters ? 'No reviews match your filters' : 'No reviews received yet'}
              </p>
              <p className="text-[11px] text-merchant-text-muted max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Try broadening your search term or resetting the selected filters.'
                  : 'Customer reviews will appear here after delivered orders are reviewed.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-merchant-surface border border-merchant-border rounded-xl text-xs font-semibold text-merchant-text hover:bg-merchant-surface-muted transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          ) : (
            /* Review Feed List */
            <div className="divide-y divide-merchant-border">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 sm:p-5 space-y-3 hover:bg-merchant-surface/50 transition">
                  {/* Top Bar: Stars, Title, Status & Date */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <span className="font-mono font-bold text-xs text-merchant-text">
                        {rev.rating}.0
                      </span>

                      {rev.title && (
                        <span className="font-bold text-xs text-merchant-text">
                          "{rev.title}"
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          rev.status === 'SENT_FOR_REVIEW'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                            : rev.status === 'REMOVED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {rev.status === 'SENT_FOR_REVIEW'
                          ? 'Sent for Review'
                          : rev.status === 'REMOVED'
                          ? 'Taken Down by Admin'
                          : 'Active'}
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

                  {/* Sent for review notice if applicable */}
                  {rev.status === 'SENT_FOR_REVIEW' && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Sent for Review:</strong> You reported this review to platform administrators for moderation.
                        {rev.moderationReason && (
                          <span className="block mt-0.5 text-amber-700 dark:text-amber-300">
                            Reason: {rev.moderationReason}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Removed notice if applicable */}
                  {rev.status === 'REMOVED' && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300">
                      <strong>Moderation Notice:</strong>{' '}
                      {rev.moderationReason || 'This review was taken down by platform moderation and is not visible to buyers.'}
                    </div>
                  )}

                  {/* Body Text */}
                  <p className="text-xs text-merchant-text-secondary leading-relaxed whitespace-pre-line">
                    {rev.body}
                  </p>

                  {/* Bottom Context: Customer, Order, Product with View Actions & Report */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 border-t border-merchant-border text-[11px]">
                    {/* Customer & Verified Status */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-merchant-text">
                        Customer: {rev.reviewerName}
                      </span>
                      {rev.verifiedPurchase && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>

                    {/* Product & Order Navigation Links & Report Action */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Order Link */}
                      <Link
                        href={`/orders?search=${encodeURIComponent(rev.order.orderNumber)}`}
                        className="inline-flex items-center gap-1 text-merchant-text-muted hover:text-merchant-text font-mono hover:underline"
                        title="View Order Details"
                      >
                        <span>Order #{rev.order.orderNumber}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>

                      {/* Product Link */}
                      <Link
                        href="/products"
                        className="inline-flex items-center gap-1.5 font-semibold text-merchant-primary hover:underline"
                        title="View Product in Catalog"
                      >
                        {rev.product.image ? (
                          <img
                            src={rev.product.image}
                            alt={rev.product.name}
                            className="w-4 h-4 rounded-xs object-cover border border-merchant-border"
                          />
                        ) : (
                          <Package className="w-3.5 h-3.5" />
                        )}
                        <span>{rev.product.name}</span>
                      </Link>

                      {/* Report Review Action / Status indicator */}
                      {rev.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => setReportingReview(rev)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md cursor-pointer ml-1"
                          title="Report to SuperAdmin moderation"
                        >
                          <Flag className="w-3 h-3" />
                          <span>Report Review</span>
                        </button>
                      )}

                      {rev.status === 'SENT_FOR_REVIEW' && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium"
                          title="Review submitted for moderation"
                        >
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Sent for Review</span>
                        </span>
                      )}

                      {rev.status === 'REMOVED' && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium"
                          title="Review taken down by platform moderation"
                        >
                          <X className="w-3 h-3" />
                          <span>Taken Down by Admin</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && !loading && (
            <div className="px-5 py-3.5 border-t border-merchant-border bg-merchant-surface flex items-center justify-between text-xs text-merchant-text-muted">
              <div>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} reviews
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 border border-merchant-border rounded-lg hover:bg-merchant-surface-muted disabled:opacity-40 disabled:cursor-not-allowed text-merchant-text"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono px-2 font-semibold text-merchant-text">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 border border-merchant-border rounded-lg hover:bg-merchant-surface-muted disabled:opacity-40 disabled:cursor-not-allowed text-merchant-text"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moderation Request / Report Review Modal (Requirement 14) */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-merchant-surface-raised border border-merchant-border rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-merchant-border pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-merchant-text">
                  Request Moderation for Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportingReview(null)}
                className="text-merchant-text-muted hover:text-merchant-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-merchant-text-muted leading-relaxed">
              Merchants cannot delete customer feedback directly. Submit a report if this review for{' '}
              <strong className="text-merchant-text">{reportingReview.product.name}</strong> (Order #{reportingReview.order.orderNumber}) violates community guidelines.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-merchant-text mb-1">
                  Reason for Moderation <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 bg-merchant-surface border border-merchant-border rounded-xl text-xs text-merchant-text focus:outline-hidden focus:ring-1 focus:ring-merchant-primary"
                  required
                >
                  <option value="Abusive / offensive content">Abusive / offensive content</option>
                  <option value="Spam or promotional">Spam or promotional</option>
                  <option value="Unrelated to product">Unrelated to product</option>
                  <option value="Contains personal information">Contains personal information</option>
                  <option value="False or misleading content">False or misleading content</option>
                  <option value="Other policy violation">Other policy violation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-merchant-text mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context for the platform administrator..."
                  className="w-full px-3 py-2 bg-merchant-surface border border-merchant-border rounded-xl text-xs text-merchant-text placeholder:text-merchant-text-muted focus:outline-hidden focus:ring-1 focus:ring-merchant-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-merchant-border">
                <button
                  type="button"
                  onClick={() => setReportingReview(null)}
                  disabled={reportSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-merchant-text-muted hover:text-merchant-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

import type {
  AdminPage,
  AdminReview,
  AdminReviewFilters,
  AdminReviewsSummary,
  AdminReviewTimelineEvent,
} from '@simply/api-contracts';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Star,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowUpDown,
  Search,
  X,
  ExternalLink,
  MessageSquare,
  Clock,
  User,
  Store,
  ShoppingBag,
  Eye,
  RefreshCw,
  ChevronDown,
  Mail,
  Phone,
  RotateCcw,
  Trash2,
  FileText,
  AlertTriangle,
  Check,
  Building,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import {
  errorMessage,
  ActionModal,
  Feedback,
  useAdminQuery,
} from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminAttention } from '../context/AdminAttentionContext';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { getStorefrontUrl } from '../utils/config';

interface SearchableComboboxOption {
  id: string;
  label: string;
  sub?: string;
}

function SearchableCombobox({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled,
  disabledPlaceholder,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: SearchableComboboxOption[];
  disabled?: boolean;
  disabledPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return o.label.toLowerCase().includes(term) || (o.sub && o.sub.toLowerCase().includes(term));
  });

  if (disabled) {
    return (
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-admin-muted">{label}</label>
        <div className="admin-input text-xs py-1.5 w-full bg-admin-raised/40 text-admin-muted cursor-not-allowed select-none">
          {disabledPlaceholder || 'Select previous filter first'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-admin-muted">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSearchTerm('');
            }}
            className="text-[10px] text-admin-accent hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div
        onClick={() => setOpen(!open)}
        className="admin-input text-xs py-1.5 w-full flex items-center justify-between cursor-pointer"
      >
        <span className={selected ? 'text-admin-text font-medium truncate' : 'text-admin-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-admin-muted shrink-0 ml-1" />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-admin-surface border border-admin-border rounded-xl shadow-2xl z-50 p-2 space-y-1.5 text-xs">
          <div className="relative">
            <Search className="h-3 w-3 text-admin-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="admin-input pl-8 pr-2 py-1 text-xs w-full"
            />
          </div>

          <div className="max-h-48 overflow-y-auto admin-scrollbar divide-y divide-admin-border/30">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setSearchTerm('');
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-admin-raised transition-colors flex items-center justify-between ${
                !value ? 'bg-admin-raised font-bold text-admin-accent' : 'text-admin-text'
              }`}
            >
              <span>All {label}s</span>
              {!value && <Check className="h-3.5 w-3.5 text-admin-accent" />}
            </button>

            {filtered.length === 0 ? (
              <div className="text-center text-admin-muted py-3 text-[11px]">
                No matching {label.toLowerCase()} found
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-admin-raised transition-colors flex items-center justify-between ${
                    value === opt.id ? 'bg-admin-raised font-bold text-admin-accent' : 'text-admin-text'
                  }`}
                >
                  <div className="truncate pr-1">
                    <span className="block truncate font-medium">{opt.label}</span>
                    {opt.sub && (
                      <span className="block text-[10px] text-admin-muted truncate font-normal">
                        {opt.sub}
                      </span>
                    )}
                  </div>
                  {value === opt.id && (
                    <Check className="h-3.5 w-3.5 text-admin-accent shrink-0 ml-1" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const REMOVAL_REASONS = [
  'Abuse / harassment',
  'Spam',
  'Irrelevant',
  'Personal information',
  'Fake / fraudulent',
  'Policy violation',
  'Other',
];

export default function ReviewsPage() {
  const { api } = useAdminAuth();
  const { refreshAttention } = useAdminAttention();
  const router = useRouter();

  // Primary filtering state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [reportStatus, setReportStatus] = useState('ALL');
  const [rating, setRating] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [productId, setProductId] = useState('');
  const [verified, setVerified] = useState('');
  const [hasComplaint, setHasComplaint] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('newest');

  // UI Popover / Drawer state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [timeline, setTimeline] = useState<AdminReviewTimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Workflow Dialogs
  const [dialogAction, setDialogAction] = useState<
    'REMOVE' | 'RESTORE' | 'DISMISS' | 'START' | null
  >(null);
  const [activeReviewForDialog, setActiveReviewForDialog] = useState<AdminReview | null>(null);
  const [modalReason, setModalReason] = useState(REMOVAL_REASONS[0]);
  const [internalNote, setInternalNote] = useState('');
  const [buyerMessage, setBuyerMessage] = useState('');
  const [merchantMessage, setMerchantMessage] = useState('');
  const [notifyBuyerEmail, setNotifyBuyerEmail] = useState(true);
  const [notifyMerchantEmail, setNotifyMerchantEmail] = useState(true);
  const [notifyBuyerWhatsApp, setNotifyBuyerWhatsApp] = useState(false);
  const [notifyMerchantWhatsApp, setNotifyMerchantWhatsApp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [whatsappPopup, setWhatsappPopup] = useState<{
    merchantUrl?: string | null;
    buyerUrl?: string | null;
    reviewId: string;
    storeName: string;
  } | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Cascading handler functions
  const handleMerchantChange = (newMerchantId: string) => {
    setMerchantId(newMerchantId);
    if (storeId) {
      const storeBelongs = filtersQuery.data?.stores?.some(
        (s) => s.id === storeId && (!newMerchantId || s.tenantId === newMerchantId),
      );
      if (!storeBelongs) {
        setStoreId('');
        setProductId('');
      }
    }
  };

  const handleStoreChange = (newStoreId: string) => {
    setStoreId(newStoreId);
    if (productId) {
      const prodBelongs = filtersQuery.data?.products?.some(
        (p) => p.id === productId && (!newStoreId || p.storeId === newStoreId),
      );
      if (!prodBelongs) {
        setProductId('');
      }
    }
  };

  // Sync router queries on initial mount
  useEffect(() => {
    if (typeof router.query.search === 'string') setSearch(router.query.search);
    if (typeof router.query.merchantId === 'string') setMerchantId(router.query.merchantId);
    if (typeof router.query.storeId === 'string') setStoreId(router.query.storeId);
    if (typeof router.query.reportStatus === 'string') setReportStatus(router.query.reportStatus);
  }, [router.query]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, reportStatus, rating, merchantId, storeId, productId, verified, hasComplaint, from, to, sort, limit]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Summary Counts
  const summaryQuery = useAdminQuery<AdminReviewsSummary>('admin/reviews/summary');

  // Fetch Filter Dropdowns
  const filtersQuery = useAdminQuery<AdminReviewFilters>('admin/reviews/filters');

  // Fetch Paginated Reviews
  const reviewsQuery = useAdminQuery<AdminPage<AdminReview>>('admin/reviews', {
    page,
    limit,
    search: debouncedSearch,
    status,
    reportStatus,
    rating,
    merchantId,
    storeId,
    productId,
    verified,
    hasComplaint,
    from,
    to,
    sort,
  });

  const reloadAll = () => {
    reviewsQuery.reload();
    summaryQuery.reload();
    filtersQuery.reload();
    void refreshAttention();
  };

  // Load Timeline when a review is selected
  useEffect(() => {
    if (!selectedReview) {
      setTimeline([]);
      return;
    }
    let active = true;
    setTimelineLoading(true);
    api
      .request<any>(`admin/reviews/${selectedReview.id}/timeline`)
      .then((res) => {
        if (!active) return;
        const events = Array.isArray(res) ? res : res?.timeline || [];
        setTimeline(events);
      })
      .catch(() => {
        if (!active) setTimeline([]);
      })
      .finally(() => {
        if (active) setTimelineLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedReview, api]);

  // Default messages for modals
  const openRemoveModal = (rev: AdminReview) => {
    setActiveReviewForDialog(rev);
    setDialogAction('REMOVE');
    setModalReason(REMOVAL_REASONS[0]);
    setInternalNote('');
    setBuyerMessage(
      `Your review for ${rev.product.name} at ${rev.store.name} was removed following LetzShop moderation review. Reason: ${REMOVAL_REASONS[0]}. If you have questions, please reach out to LetzShop support.`,
    );
    setMerchantMessage(
      `The customer review on ${rev.product.name} has been reviewed and removed by LetzShop moderation.`,
    );
    setNotifyBuyerEmail(true);
    setNotifyMerchantEmail(true);
    setNotifyBuyerWhatsApp(false);
    setNotifyMerchantWhatsApp(true);
    setActionError('');
  };

  const openDismissModal = (rev: AdminReview) => {
    setActiveReviewForDialog(rev);
    setDialogAction('DISMISS');
    setInternalNote('');
    setActionError('');
  };

  const openRestoreModal = (rev: AdminReview) => {
    setActiveReviewForDialog(rev);
    setDialogAction('RESTORE');
    setInternalNote('Restored following platform admin review.');
    setActionError('');
  };

  const handleStartReview = async (rev: AdminReview) => {
    const report = rev.reports?.find((p) => p.status === 'PENDING');
    if (!report) return;
    try {
      setBusy(true);
      await api.request(`admin/reviews/reports/${report.id}`, {
        method: 'PATCH',
        body: { status: 'UNDER_REVIEW', note: 'Admin review started' },
      });
      reloadAll();
      if (selectedReview?.id === rev.id) {
        setSelectedReview((prev) =>
          prev
            ? {
                ...prev,
                reports: prev.reports.map((r) =>
                  r.id === report.id ? { ...r, status: 'UNDER_REVIEW' } : r,
                ),
              }
            : null,
        );
      }
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleExecuteModalAction = async () => {
    if (!activeReviewForDialog || !dialogAction) return;
    setBusy(true);
    setActionError('');

    try {
      if (dialogAction === 'REMOVE') {
        await api.reviews.moderateAdminReview(activeReviewForDialog.id, {
          status: 'REMOVED',
          reason: modalReason,
          internalNote: internalNote.trim(),
          buyerFacingMessage: buyerMessage.trim(),
          merchantFacingMessage: merchantMessage.trim(),
          notifyBuyerEmail,
          notifyMerchantEmail,
          notifyBuyerWhatsApp,
          notifyMerchantWhatsApp,
        });

        // Prepare WhatsApp deep link if selected
        const merchantInfo = filtersQuery.data?.merchants?.find(
          (m) => m.id === (activeReviewForDialog.store.tenantId || activeReviewForDialog.store.tenant?.id),
        );
        const merchantPhone = merchantInfo?.phone;
        const buyerPhone = activeReviewForDialog.order?.customer?.phone;

        let merchantUrl: string | null = null;
        let buyerUrl: string | null = null;

        if (notifyMerchantWhatsApp && merchantPhone) {
          const cleanPhone = merchantPhone.replace(/[^0-9]/g, '');
          merchantUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(merchantMessage.trim())}`;
        }
        if (notifyBuyerWhatsApp && buyerPhone) {
          const cleanPhone = buyerPhone.replace(/[^0-9]/g, '');
          buyerUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(buyerMessage.trim())}`;
        }

        if (merchantUrl || buyerUrl) {
          setWhatsappPopup({
            reviewId: activeReviewForDialog.id,
            storeName: activeReviewForDialog.store.name,
            merchantUrl,
            buyerUrl,
          });
        }
      } else if (dialogAction === 'RESTORE') {
        await api.reviews.moderateAdminReview(activeReviewForDialog.id, {
          status: 'ACTIVE',
          reason: internalNote.trim() || 'Restored by platform admin',
        });
      } else if (dialogAction === 'DISMISS') {
        const report = activeReviewForDialog.reports?.find((p) =>
          ['PENDING', 'UNDER_REVIEW'].includes(p.status),
        );
        if (!report) throw new Error('No open complaint to dismiss.');
        if (!internalNote.trim()) throw new Error('Please enter a dismissal reason.');

        await api.request(`admin/reviews/reports/${report.id}`, {
          method: 'PATCH',
          body: {
            status: 'DISMISSED',
            note: internalNote.trim(),
          },
        });
      }

      setDialogAction(null);
      setActiveReviewForDialog(null);
      reloadAll();

      if (selectedReview?.id === activeReviewForDialog.id) {
        // Refresh detail drawer review object and timeline
        const updated = await api.request<AdminReview>(`admin/reviews/${activeReviewForDialog.id}`);
        setSelectedReview(updated);
        const tlRes = await api.reviews.getAdminReviewTimeline(activeReviewForDialog.id);
        const events = Array.isArray(tlRes) ? tlRes : (tlRes as any)?.timeline || [];
        setTimeline(events);
      }
    } catch (err: unknown) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleOpenWhatsApp = async (type: 'MERCHANT' | 'BUYER', url: string) => {
    if (!whatsappPopup) return;
    window.open(url, '_blank');
    try {
      await api.request(`admin/reviews/${whatsappPopup.reviewId}/whatsapp-opened`, {
        method: 'POST',
        body: {
          recipientType: type,
          phone: type === 'MERCHANT' ? 'merchant' : 'buyer',
        },
      });
      if (selectedReview?.id === whatsappPopup.reviewId) {
        const tlRes = await api.reviews.getAdminReviewTimeline(whatsappPopup.reviewId);
        const events = Array.isArray(tlRes) ? tlRes : (tlRes as any)?.timeline || [];
        setTimeline(events);
      }
    } catch (err) {
      console.error('Failed to record whatsapp opened', err);
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatus('ALL');
    setReportStatus('ALL');
    setRating('');
    setMerchantId('');
    setStoreId('');
    setProductId('');
    setVerified('');
    setHasComplaint('');
    setFrom('');
    setTo('');
    setSort('newest');
    setPage(1);
  };

  // Helper to determine active filters count
  const activeFiltersCount =
    (status !== 'ALL' ? 1 : 0) +
    (reportStatus !== 'ALL' ? 1 : 0) +
    (rating ? 1 : 0) +
    (merchantId ? 1 : 0) +
    (storeId ? 1 : 0) +
    (productId ? 1 : 0) +
    (verified ? 1 : 0) +
    (hasComplaint ? 1 : 0) +
    (from || to ? 1 : 0);

  const totalReviews = reviewsQuery.data?.total ?? 0;
  const items = reviewsQuery.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(totalReviews / limit));

  // Store, Merchant & Product name lookups for chips
  const selectedMerchantName = filtersQuery.data?.merchants?.find((m) => m.id === merchantId)?.name;
  const selectedStoreName = filtersQuery.data?.stores?.find((s) => s.id === storeId)?.name;
  const selectedProductName = filtersQuery.data?.products?.find((p) => p.id === productId)?.name;

  // Options for SearchableComboboxes
  const merchantOptions = (filtersQuery.data?.merchants || []).map((m) => ({
    id: m.id,
    label: m.name,
    sub: [m.ownerName, m.email, m.phone].filter(Boolean).join(' • '),
  }));

  const storeOptions = (filtersQuery.data?.stores || [])
    .filter((s) => !merchantId || s.tenantId === merchantId)
    .map((s) => ({
      id: s.id,
      label: s.name,
      sub: s.slug,
    }));

  const availableProducts = (filtersQuery.data?.products || []).filter(
    (p) => !storeId || p.storeId === storeId,
  );

  return (
    <AdminLayout>
      <Head>
        <title>Reviews & Reports — LetzShop Admin</title>
      </Head>

      <div className="space-y-4">
        {/* ============================================================== */}
        {/* HEADER                                                         */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-admin-text">
              Reviews & Reports
            </h1>
            <p className="text-xs text-admin-muted mt-0.5">
              Production moderation workspace for customer reviews and merchant complaints
            </p>
          </div>
          <button
            type="button"
            onClick={reloadAll}
            className="admin-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 self-start sm:self-auto font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5 text-admin-accent" />
            Refresh
          </button>
        </div>

        {/* ============================================================== */}
        {/* SUMMARY COUNT CHIPS / CARDS (Real Postgres Counts)             */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Pending Reports */}
          <button
            type="button"
            onClick={() => {
              setReportStatus((prev) => (prev === 'PENDING' ? 'ALL' : 'PENDING'));
              setStatus('ALL');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              reportStatus === 'PENDING'
                ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500'
                : 'bg-admin-panel border-admin-border/60 hover:border-admin-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                Pending Reports
              </span>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-2xl font-black text-admin-text block mt-1 tabular-nums">
              {summaryQuery.data?.pendingReports ?? 0}
            </span>
            <span className="text-[10px] text-admin-muted mt-0.5 block truncate">
              Requires initial review
            </span>
          </button>

          {/* Under Review */}
          <button
            type="button"
            onClick={() => {
              setReportStatus((prev) => (prev === 'UNDER_REVIEW' ? 'ALL' : 'UNDER_REVIEW'));
              setStatus('ALL');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              reportStatus === 'UNDER_REVIEW'
                ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500'
                : 'bg-admin-panel border-admin-border/60 hover:border-admin-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                Under Review
              </span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-2xl font-black text-admin-text block mt-1 tabular-nums">
              {summaryQuery.data?.underReviewReports ?? 0}
            </span>
            <span className="text-[10px] text-admin-muted mt-0.5 block truncate">
              Investigation in progress
            </span>
          </button>

          {/* Removed Reviews */}
          <button
            type="button"
            onClick={() => {
              setStatus((prev) => (prev === 'REMOVED' ? 'ALL' : 'REMOVED'));
              setReportStatus('ALL');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              status === 'REMOVED'
                ? 'bg-red-500/10 border-red-500 ring-1 ring-red-500'
                : 'bg-admin-panel border-admin-border/60 hover:border-admin-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">
                Removed Reviews
              </span>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </div>
            <span className="text-2xl font-black text-admin-text block mt-1 tabular-nums">
              {summaryQuery.data?.removedReviews ?? 0}
            </span>
            <span className="text-[10px] text-admin-muted mt-0.5 block truncate">
              Hidden from storefront
            </span>
          </button>

          {/* Resolved This Month */}
          <button
            type="button"
            onClick={() => {
              setReportStatus((prev) => (prev === 'RESOLVED' ? 'ALL' : 'RESOLVED'));
              setStatus('ALL');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              reportStatus === 'RESOLVED'
                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-admin-panel border-admin-border/60 hover:border-admin-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
                Resolved This Month
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-2xl font-black text-admin-text block mt-1 tabular-nums">
              {summaryQuery.data?.resolvedThisMonth ?? 0}
            </span>
            <span className="text-[10px] text-admin-muted mt-0.5 block truncate">
              Complaints moderated
            </span>
          </button>

          {/* Active Reviews */}
          <button
            type="button"
            onClick={() => {
              setStatus((prev) => (prev === 'ACTIVE' ? 'ALL' : 'ACTIVE'));
              setReportStatus('ALL');
            }}
            className={`col-span-2 sm:col-span-1 p-3 rounded-xl border text-left transition-all ${
              status === 'ACTIVE'
                ? 'bg-admin-accent/10 border-admin-accent ring-1 ring-admin-accent'
                : 'bg-admin-panel border-admin-border/60 hover:border-admin-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-admin-muted tracking-wider">
                Active Reviews
              </span>
              <Star className="h-4 w-4 text-admin-accent" />
            </div>
            <span className="text-2xl font-black text-admin-text block mt-1 tabular-nums">
              {summaryQuery.data?.activeReviews ?? 0}
            </span>
            <span className="text-[10px] text-admin-muted mt-0.5 block truncate">
              Visible on storefront
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* COMPACT CONTROLS BAR: SEARCH + FILTERS POPOVER + SORT          */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Global Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted" />
            <input
              type="text"
              aria-label="Search reviews, buyer, store, product, order"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search review text, buyer name, store, product, order #..."
              className="admin-input pl-9 pr-8 text-xs py-2 w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filters Popover Trigger */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`admin-secondary text-xs px-3 py-2 inline-flex items-center gap-1.5 font-medium ${
                  activeFiltersCount > 0
                    ? 'border-admin-accent text-admin-accent'
                    : ''
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-admin-accent text-white text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </button>

              {/* Compact Filters Popover */}
              {filtersOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl bg-admin-surface border border-admin-border p-4 shadow-2xl z-30 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-admin-border/60 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-admin-accent" />
                      Filter Reviews
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="text-admin-muted hover:text-admin-text"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Merchant Combobox */}
                    <SearchableCombobox
                      label="Merchant"
                      placeholder="All Merchants"
                      value={merchantId}
                      onChange={handleMerchantChange}
                      options={merchantOptions}
                    />

                    {/* Store Combobox */}
                    <SearchableCombobox
                      label="Store"
                      placeholder={merchantId ? "Select store for merchant..." : "All Stores"}
                      value={storeId}
                      onChange={handleStoreChange}
                      options={storeOptions}
                    />

                    {/* Report Status & Visibility */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-admin-muted">
                          Report Status
                        </label>
                        <select
                          value={reportStatus}
                          onChange={(e) => setReportStatus(e.target.value)}
                          className="admin-input text-xs py-1.5 w-full"
                        >
                          <option value="ALL">All Reports</option>
                          <option value="PENDING">Pending Reports</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="DISMISSED">Dismissed</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-admin-muted">
                          Review Visibility
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="admin-input text-xs py-1.5 w-full"
                        >
                          <option value="ALL">All Visibilities</option>
                          <option value="ACTIVE">Active Reviews</option>
                          <option value="REMOVED">Removed Reviews</option>
                        </select>
                      </div>
                    </div>

                    {/* Rating & Verified Purchase */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-admin-muted">
                          Rating
                        </label>
                        <select
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                          className="admin-input text-xs py-1.5 w-full"
                        >
                          <option value="">All Ratings</option>
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-admin-muted">
                          Verified Purchase
                        </label>
                        <select
                          value={verified}
                          onChange={(e) => setVerified(e.target.value)}
                          className="admin-input text-xs py-1.5 w-full"
                        >
                          <option value="">All Purchases</option>
                          <option value="true">Verified Only</option>
                          <option value="false">Unverified Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Product Filter (Constrained by store) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-admin-muted">
                          Product
                        </label>
                        {productId && (
                          <button
                            type="button"
                            onClick={() => setProductId('')}
                            className="text-[10px] text-admin-accent hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {!storeId ? (
                        <div className="admin-input text-xs py-1.5 w-full bg-admin-raised/40 text-admin-muted cursor-not-allowed select-none">
                          Select a store first
                        </div>
                      ) : (
                        <select
                          value={productId}
                          onChange={(e) => setProductId(e.target.value)}
                          className="admin-input text-xs py-1.5 w-full"
                        >
                          <option value="">All Products</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* From & To Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-admin-muted">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={from}
                          onChange={(e) => setFrom(e.target.value)}
                          className="admin-input text-xs py-1.5 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-admin-muted">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          className="admin-input text-xs py-1.5 w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-admin-border/50">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs text-admin-muted hover:text-admin-text font-medium"
                    >
                      Reset All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="admin-button text-xs px-3 py-1 font-semibold"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Popover Trigger */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="admin-secondary text-xs px-3 py-2 inline-flex items-center gap-1.5 font-medium"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort: {sort === 'newest' ? 'Newest' : sort === 'oldest' ? 'Oldest' : sort}
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-admin-surface border border-admin-border py-1 shadow-xl z-30 text-xs">
                  {[
                    ['newest', 'Newest First'],
                    ['oldest', 'Oldest First'],
                    ['rating_desc', 'Rating: High to Low'],
                    ['rating_asc', 'Rating: Low to High'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSort(val);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-admin-raised/80 transition-colors ${
                        sort === val ? 'text-admin-accent font-bold' : 'text-admin-text'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ACTIVE FILTER CHIPS                                            */}
        {/* ============================================================== */}
        {(debouncedSearch ||
          status !== 'ALL' ||
          reportStatus !== 'ALL' ||
          rating ||
          merchantId ||
          storeId ||
          productId ||
          verified ||
          from ||
          to) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] text-admin-muted font-medium">Active Filters:</span>

            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-raised border border-admin-border text-admin-text">
                Search: &ldquo;{debouncedSearch}&rdquo;
                <button type="button" onClick={() => setSearch('')} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {merchantId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-raised border border-admin-border text-admin-text">
                Merchant: {selectedMerchantName || merchantId}
                <button type="button" onClick={() => handleMerchantChange('')} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {reportStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-medium">
                Report: {reportStatus.replace('_', ' ')}
                <button type="button" onClick={() => setReportStatus('ALL')} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {status !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-accent/10 border border-admin-accent/30 text-admin-accent font-medium">
                Visibility: {status}
                <button type="button" onClick={() => setStatus('ALL')} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {rating && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-raised border border-admin-border text-admin-text">
                Rating: {rating}★
                <button type="button" onClick={() => setRating('')} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {storeId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-raised border border-admin-border text-admin-text">
                Store: {selectedStoreName || storeId}
                <button type="button" onClick={() => handleStoreChange('')} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {productId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-raised border border-admin-border text-admin-text">
                Product: {selectedProductName || productId}
                <button type="button" onClick={() => setProductId('')} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-raised border border-admin-border text-admin-text">
                {verified === 'true' ? 'Verified Purchase' : 'Unverified'}
                <button type="button" onClick={() => setVerified('')} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {(from || to) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-raised border border-admin-border text-admin-text">
                Dates: {from || 'Start'} to {to || 'End'}
                <button
                  type="button"
                  onClick={() => {
                    setFrom('');
                    setTo('');
                  }}
                  className="hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] font-semibold text-admin-accent hover:underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}

        <Feedback error={reviewsQuery.error} />

        {/* ============================================================== */}
        {/* MODERATION WORKSPACE TABLE (Controlled Height, Internal Scroll)*/}
        {/* ============================================================== */}
        <div id="reviews-workspace-table-card" className="admin-panel h-[580px] flex flex-col p-0 border border-admin-border overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto admin-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Review / Buyer</th>
                  <th className="px-4 py-3">Store / Product</th>
                  <th className="px-3 py-3 text-center">Rating</th>
                  <th className="px-3 py-3">Complaint / Report</th>
                  <th className="px-3 py-3">Visibility</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/60">
                {reviewsQuery.loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-admin-muted">
                      Loading reviews...
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((r) => {
                    const activeReport = r.reports?.find((p) =>
                      ['PENDING', 'UNDER_REVIEW'].includes(p.status),
                    ) || r.reports?.[0];

                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedReview(r)}
                        className={`hover:bg-admin-raised/50 cursor-pointer transition-colors ${
                          selectedReview?.id === r.id ? 'bg-admin-raised/70' : ''
                        }`}
                      >
                        {/* Review / Buyer */}
                        <td className="px-4 py-3 max-w-xs sm:max-w-md">
                          <div className="flex items-center gap-1 text-amber-500 font-bold mb-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < r.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                            <span className="text-[11px] text-admin-muted font-normal ml-1">
                              {new Date(r.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <p className="text-admin-text font-medium line-clamp-2 leading-relaxed">
                            {r.body || (r as any).comment || 'No text review'}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-admin-secondary font-semibold text-[11px] flex items-center gap-1">
                              <User className="h-3 w-3 text-admin-muted" />
                              {r.reviewerName || 'Customer'}
                            </span>
                            {r.verifiedPurchase && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Store / Product */}
                        <td className="px-4 py-3">
                          <span className="font-bold text-admin-text block text-sm">
                            {r.store?.name}
                          </span>
                          <span className="text-admin-secondary font-medium text-[11px] block mt-0.5">
                            {r.product?.name}
                          </span>
                          <span className="text-[10px] text-admin-muted font-mono block mt-0.5">
                            Order #{r.order?.orderNumber}
                          </span>
                        </td>

                        {/* Rating */}
                        <td className="px-3 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded font-black text-sm bg-admin-raised text-admin-text tabular-nums">
                            {r.rating}★
                          </span>
                        </td>

                        {/* Report Status */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {activeReport ? (
                            <div className="space-y-0.5">
                              <StatusBadge status={activeReport.status} category="auto" />
                              <span className="text-[10px] text-admin-muted block max-w-[120px] truncate">
                                {activeReport.reason}
                              </span>
                            </div>
                          ) : (
                            <span className="text-admin-muted text-[11px]">No complaint</span>
                          )}
                        </td>

                        {/* Review Visibility */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <StatusBadge status={r.status} category="auto" />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReview(r);
                            }}
                            className="admin-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 font-semibold"
                          >
                            <Eye className="h-3 w-3 text-admin-accent" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-admin-muted space-y-3">
                      <p className="text-sm">No reviews match these filters.</p>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="admin-button text-xs px-3 py-1 font-semibold"
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ============================================================== */}
          {/* FIXED PAGINATION FOOTER                                        */}
          {/* ============================================================== */}
          <div className="shrink-0 p-3 bg-admin-panel border-t border-admin-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-admin-muted">
            <div className="flex items-center gap-4">
              <span>
                Showing {totalReviews === 0 ? 0 : (page - 1) * limit + 1}–
                {Math.min(page * limit, totalReviews)} of {totalReviews} reviews
              </span>
              <label className="flex items-center gap-1.5 font-medium">
                Page size:
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="admin-input text-xs py-0.5 px-2"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="admin-secondary text-xs px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-medium text-admin-text px-1">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="admin-secondary text-xs px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* REVIEW DETAIL SLIDE-OVER DRAWER                                */}
      {/* ============================================================== */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex justify-end bg-admin-overlay animate-fadeIn">
          <div
            className="w-full max-w-xl bg-admin-surface border-l border-admin-border h-full flex flex-col shadow-2xl animate-slideLeft overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-admin-border/60 flex items-center justify-between bg-admin-panel shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-admin-muted">
                  #{selectedReview.id.slice(-8)}
                </span>
                <StatusBadge status={selectedReview.status} category="auto" />
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-raised"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar p-5 space-y-5">
              {/* Review Content Card */}
              <div className="rounded-xl bg-admin-panel border border-admin-border/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedReview.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-admin-text font-black ml-1.5 tabular-nums">
                      {selectedReview.rating} / 5
                    </span>
                  </div>
                  <span className="text-xs text-admin-muted">
                    {new Date(selectedReview.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {selectedReview.title && (
                  <h3 className="text-sm font-bold text-admin-text">
                    {selectedReview.title}
                  </h3>
                )}

                <p className="text-sm text-admin-text leading-relaxed whitespace-pre-wrap">
                  {selectedReview.body || (selectedReview as any).comment}
                </p>

                {selectedReview.status === 'REMOVED' && (
                  <div className="mt-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs space-y-1">
                    <span className="font-bold text-red-500 flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Review Moderated & Removed
                    </span>
                    <p className="text-admin-muted">
                      Reason: {selectedReview.moderationReason || 'Policy violation'}
                    </p>
                  </div>
                )}
              </div>

              {/* Reviewer / Buyer Profile Card (Admin Only Contact Info) */}
              <div className="rounded-xl bg-admin-panel border border-admin-border/60 p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-admin-accent" />
                  Buyer & Order Context
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-admin-muted block text-[11px]">Reviewer Name</span>
                    <span className="font-bold text-admin-text block">
                      {selectedReview.reviewerName || 'Customer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-admin-muted block text-[11px]">Purchase Status</span>
                    {selectedReview.verifiedPurchase ? (
                      <span className="text-emerald-500 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                      </span>
                    ) : (
                      <span className="text-admin-muted">Unverified</span>
                    )}
                  </div>

                  {/* Safely exposed buyer PII for Admin investigation only */}
                  <div>
                    <span className="text-admin-muted block text-[11px]">Buyer Email</span>
                    {selectedReview.order?.customer?.email ? (
                      <a
                        href={`mailto:${selectedReview.order.customer.email}`}
                        className="text-admin-accent hover:underline flex items-center gap-1 font-medium"
                      >
                        <Mail className="h-3 w-3" />
                        {selectedReview.order.customer.email}
                      </a>
                    ) : (
                      <span className="text-admin-muted">Not provided</span>
                    )}
                  </div>
                  <div>
                    <span className="text-admin-muted block text-[11px]">Buyer Phone</span>
                    {selectedReview.order?.customer?.phone ? (
                      <a
                        href={`tel:${selectedReview.order.customer.phone}`}
                        className="text-admin-accent hover:underline flex items-center gap-1 font-medium"
                      >
                        <Phone className="h-3 w-3" />
                        {selectedReview.order.customer.phone}
                      </a>
                    ) : (
                      <span className="text-admin-muted">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Target Context (Store, Product, Order) */}
              <div className="rounded-xl bg-admin-panel border border-admin-border/60 p-4 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-admin-accent" />
                  Target Store & Product Details
                </span>

                <div className="space-y-2 text-xs divide-y divide-admin-border/40">
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-admin-muted text-[11px] block">Store</span>
                      <span className="font-bold text-admin-text">{selectedReview.store.name}</span>
                      {selectedReview.store.tenant && (
                        <span className="text-[10px] text-admin-muted block font-medium mt-0.5">
                          Merchant: {selectedReview.store.tenant.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {selectedReview.store.tenant && (
                        <Link
                          href={`/merchants/${selectedReview.store.tenantId || selectedReview.store.tenant.id}`}
                          className="admin-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 font-semibold"
                        >
                          <Building className="h-3 w-3 text-admin-accent" />
                          View Merchant
                        </Link>
                      )}
                      <a
                        href={`${getStorefrontUrl()}/store/${selectedReview.store.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="h-3 w-3 text-admin-accent" />
                        View Store
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-admin-muted text-[11px] block">Product</span>
                      <span className="font-bold text-admin-text">{selectedReview.product.name}</span>
                    </div>
                    <a
                      href={`${getStorefrontUrl()}/store/${selectedReview.store.slug}/product/${selectedReview.product.slug || selectedReview.product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="h-3 w-3 text-admin-accent" />
                      View Product
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-admin-muted text-[11px] block">Order</span>
                      <span className="font-mono font-bold text-admin-text">
                        #{selectedReview.order?.orderNumber || 'N/A'}
                      </span>
                    </div>
                    {selectedReview.order?.orderNumber ? (
                      <Link
                        href={`/commerce?search=${encodeURIComponent(selectedReview.order.orderNumber)}`}
                        className="admin-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 font-semibold"
                      >
                        <ShoppingBag className="h-3 w-3 text-admin-accent" />
                        View Order
                      </Link>
                    ) : (
                      <span className="text-xs text-admin-muted italic">Order not linked</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Merchant Complaint Details Card */}
              {selectedReview.reports && selectedReview.reports.length > 0 && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Merchant Complaint ({selectedReview.reports.length})
                    </span>
                    <StatusBadge status={selectedReview.reports[0].status} category="auto" />
                  </div>

                  {selectedReview.reports.map((rep) => (
                    <div key={rep.id} className="text-xs space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-admin-text">
                          Reason: {rep.reason}
                        </span>
                        <span className="text-[11px] text-admin-muted">
                          Reported: {new Date(rep.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {rep.merchantNote && (
                        <div className="p-2.5 rounded bg-admin-surface border border-admin-border/50 text-[11px] text-admin-secondary italic">
                          &ldquo;{rep.merchantNote}&rdquo;
                        </div>
                      )}

                      {rep.adminNote && (
                        <p className="text-[11px] text-admin-muted">
                          <strong className="text-admin-secondary">Admin Note:</strong> {rep.adminNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Real Lifecycle Timeline */}
              <div className="rounded-xl bg-admin-panel border border-admin-border/60 p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-admin-accent" />
                  Moderation Lifecycle Timeline
                </span>

                {timelineLoading ? (
                  <p className="text-xs text-admin-muted py-2">Loading timeline...</p>
                ) : timeline.length > 0 ? (
                  <div className="space-y-3 text-xs pl-2 border-l-2 border-admin-border/80">
                    {timeline.map((evt) => {
                      const dateVal = evt.timestamp || evt.date || (evt as any).createdAt;
                      const formattedDate = dateVal
                        ? new Date(dateVal).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Date unknown';
                      return (
                        <div key={evt.id} className="relative pl-3 space-y-0.5">
                          <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-admin-accent border-2 border-admin-surface" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-admin-text">{evt.title}</span>
                            <span className="text-[10px] text-admin-muted">{formattedDate}</span>
                          </div>
                          <p className="text-[11px] text-admin-muted">
                            {typeof evt.details === 'string'
                              ? evt.details
                              : evt.details
                                ? JSON.stringify(evt.details)
                                : evt.description || ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-admin-muted py-2">No lifecycle events recorded.</p>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-admin-panel border-t border-admin-border/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {/* Start Review Button */}
                {selectedReview.reports?.some((p) => p.status === 'PENDING') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleStartReview(selectedReview)}
                    className="admin-button text-xs px-3 py-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Start Review
                  </button>
                )}

                {/* Dismiss Complaint Button */}
                {selectedReview.reports?.some((p) =>
                  ['PENDING', 'UNDER_REVIEW'].includes(p.status),
                ) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openDismissModal(selectedReview)}
                    className="admin-secondary text-xs px-3 py-1.5 font-semibold hover:border-amber-500 hover:text-amber-500"
                  >
                    Dismiss Complaint
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {/* Remove Review Button */}
                {selectedReview.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openRemoveModal(selectedReview)}
                    className="admin-secondary text-xs px-3 py-1.5 font-semibold text-red-500 border-red-500/40 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1 inline" />
                    Remove Review
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openRestoreModal(selectedReview)}
                    className="admin-button text-xs px-3 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1 inline" />
                    Restore Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WORKFLOW MODAL: REMOVE REVIEW                                  */}
      {/* ============================================================== */}
      {dialogAction === 'REMOVE' && activeReviewForDialog && (
        <ActionModal
          title="Remove Review"
          busy={busy}
          error={actionError}
          confirmLabel="Remove Review"
          onClose={() => setDialogAction(null)}
          onConfirm={handleExecuteModalAction}
        >
          <div className="space-y-4 text-xs">
            <p className="text-admin-muted">
              Removing this review will hide it from the storefront and immediately
              recalculate product ratings. The review record is preserved for audit purposes.
            </p>

            {/* Moderation Reason */}
            <div className="space-y-1">
              <label className="font-semibold text-admin-text">
                Moderation Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={modalReason}
                onChange={(e) => {
                  setModalReason(e.target.value);
                  setBuyerMessage(
                    `Your review for ${activeReviewForDialog.product.name} at ${activeReviewForDialog.store.name} was removed following LetzShop moderation review. Reason: ${e.target.value}. If you have questions, please reach out to LetzShop support.`,
                  );
                }}
                className="admin-input text-xs w-full py-2"
              >
                {REMOVAL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Internal Admin Note */}
            <div className="space-y-1">
              <label className="font-semibold text-admin-text">
                Internal Admin Note (Private to Admin)
              </label>
              <textarea
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Internal notes regarding why this review was removed..."
                className="admin-input text-xs w-full py-2"
              />
            </div>

            {/* Buyer-facing Message */}
            <div className="space-y-1">
              <label className="font-semibold text-admin-text">
                Buyer-Facing Notification Message
              </label>
              <textarea
                rows={3}
                value={buyerMessage}
                onChange={(e) => setBuyerMessage(e.target.value)}
                className="admin-input text-xs w-full py-2"
              />
              <span className="text-[10px] text-admin-muted block">
                Do not expose merchant complaints or internal notes.
              </span>
            </div>

            {/* Merchant-facing Message */}
            <div className="space-y-1">
              <label className="font-semibold text-admin-text">
                Merchant-Facing Notification Message
              </label>
              <textarea
                rows={2}
                value={merchantMessage}
                onChange={(e) => setMerchantMessage(e.target.value)}
                className="admin-input text-xs w-full py-2"
              />
            </div>

            {/* Notification Checkboxes */}
            <div className="pt-2 border-t border-admin-border/50 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="font-bold text-admin-secondary block">Notify Buyer:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyBuyerEmail}
                    onChange={(e) => setNotifyBuyerEmail(e.target.checked)}
                    className="rounded text-admin-accent"
                  />
                  <span>Send Email</span>
                </label>
                {activeReviewForDialog.order?.customer?.phone && (
                  <div className="pt-1">
                    <a
                      href={`https://wa.me/${activeReviewForDialog.order.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buyerMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Open in WhatsApp
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-admin-secondary block">Notify Merchant:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyMerchantEmail}
                    onChange={(e) => setNotifyMerchantEmail(e.target.checked)}
                    className="rounded text-admin-accent"
                  />
                  <span>Send Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyMerchantWhatsApp}
                    onChange={(e) => setNotifyMerchantWhatsApp(e.target.checked)}
                    className="rounded text-admin-accent"
                  />
                  <span>WhatsApp Deep-link</span>
                </label>
              </div>
            </div>
          </div>
        </ActionModal>
      )}

      {/* ============================================================== */}
      {/* WORKFLOW MODAL: DISMISS COMPLAINT                              */}
      {/* ============================================================== */}
      {dialogAction === 'DISMISS' && activeReviewForDialog && (
        <ActionModal
          title="Dismiss Merchant Complaint"
          busy={busy}
          error={actionError}
          confirmLabel="Dismiss Complaint"
          onClose={() => setDialogAction(null)}
          onConfirm={handleExecuteModalAction}
        >
          <div className="space-y-3 text-xs">
            <p className="text-admin-muted">
              The review will remain <strong>ACTIVE</strong> on the storefront. The merchant will
              be notified that their complaint was evaluated and dismissed.
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-admin-text">
                Dismissal Reason / Explanation <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Explain why the customer review does not violate policy and remains active..."
                className="admin-input text-xs w-full py-2"
              />
            </div>
          </div>
        </ActionModal>
      )}

      {/* ============================================================== */}
      {/* WORKFLOW MODAL: RESTORE REVIEW                                 */}
      {/* ============================================================== */}
      {dialogAction === 'RESTORE' && activeReviewForDialog && (
        <ActionModal
          title="Restore Review"
          busy={busy}
          error={actionError}
          confirmLabel="Restore Review"
          onClose={() => setDialogAction(null)}
          onConfirm={handleExecuteModalAction}
        >
          <div className="space-y-3 text-xs">
            <p className="text-admin-muted">
              Restoring this review will immediately make it visible on the storefront
              and recalculate the product rating and review counts.
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-admin-text">
                Reason for Restoration
              </label>
              <textarea
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Reason or notes regarding why this review is being restored..."
                className="admin-input text-xs w-full py-2"
              />
            </div>
          </div>
        </ActionModal>
      )}

      {/* ============================================================== */}
      {/* WORKFLOW MODAL: PREPARED WHATSAPP NOTIFICATION                 */}
      {/* ============================================================== */}
      {whatsappPopup && (
        <ActionModal
          title="Prepared WhatsApp Notification"
          busy={false}
          confirmLabel="Done"
          onClose={() => setWhatsappPopup(null)}
          onConfirm={() => setWhatsappPopup(null)}
        >
          <div className="space-y-3.5 text-xs">
            <p className="text-admin-muted">
              Review moderation complete! Prepared WhatsApp notifications are ready for{' '}
              <strong className="text-admin-text">{whatsappPopup.storeName}</strong>. Clicking a link
              will open WhatsApp Web/App with the pre-filled moderation notice and record an audit log.
            </p>

            <div className="space-y-2 pt-1">
              {whatsappPopup.merchantUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp('MERCHANT', whatsappPopup.merchantUrl!)}
                  className="w-full admin-button py-2 px-3 text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <MessageSquare className="h-4 w-4" />
                  Open Merchant WhatsApp (wa.me)
                </button>
              )}

              {whatsappPopup.buyerUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp('BUYER', whatsappPopup.buyerUrl!)}
                  className="w-full admin-secondary py-2 px-3 text-xs flex items-center justify-center gap-2 text-blue-500 border-blue-500/40 hover:bg-blue-500/10 font-semibold"
                >
                  <MessageSquare className="h-4 w-4" />
                  Open Buyer WhatsApp (wa.me)
                </button>
              )}
            </div>

            <p className="text-[10px] text-admin-muted italic">
              Note: Using wa.me records &ldquo;Opened in WhatsApp&rdquo; in the moderation timeline and audit trail.
            </p>
          </div>
        </ActionModal>
      )}
    </AdminLayout>
  );
}

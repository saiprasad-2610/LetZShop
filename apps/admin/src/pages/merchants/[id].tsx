import type {
  AdminMerchantDetail,
  AdminCommunicationLog,
  AdminStore,
  AdminMerchantDocument,
} from '@simply/api-contracts';
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ExternalLink,
  Mail,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Archive,
  ChevronDown,
  Store,
  CreditCard,
  MessageSquare,
  FileText,
  Clock,
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Layers,
  ShoppingBag,
  Star,
  Download,
  AlertCircle,
  Eye,
  FileCheck,
  X,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Feedback, useAdminQuery } from '../../components/AdminUI';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { SendMessageModal } from '../../components/merchants/SendMessageModal';
import { SuspendMerchantModal } from '../../components/merchants/SuspendMerchantModal';
import { ReactivateMerchantModal } from '../../components/merchants/ReactivateMerchantModal';
import { ArchiveMerchantModal } from '../../components/merchants/ArchiveMerchantModal';
import { getStorefrontUrl } from '../../utils/config';
import { formatPaise } from '@simply/ui';
import { useAdminAuth } from '../../context/AdminAuthContext';

function humanBusinessType(type?: string | null): string {
  switch (type) {
    case 'SOLE_PROPRIETORSHIP': return 'Sole Proprietorship';
    case 'PARTNERSHIP': return 'Partnership Firm';
    case 'LLP': return 'LLP';
    case 'PRIVATE_LIMITED': return 'Private Limited';
    case 'PUBLIC_LIMITED': return 'Public Limited';
    case 'OTHER': return 'Other';
    default: return type || 'Not Specified';
  }
}

function humanDocType(type: string): string {
  switch (type) {
    case 'PAN': return 'Business / Entity PAN';
    case 'OWNER_ID': return 'Owner / Signatory Identity';
    case 'UDYAM': return 'Udyam Registration';
    case 'GST_CERTIFICATE': return 'GST Registration Certificate';
    case 'BUSINESS_REGISTRATION': return 'Business Registration / Deed / Incorporation Proof';
    default: return type;
  }
}

export default function MerchantDetailPage() {
  const router = useRouter();
  const merchantId = typeof router.query.id === 'string' ? router.query.id : '';

  const {
    data: m,
    loading,
    error,
    reload,
  } = useAdminQuery<AdminMerchantDetail>(
    merchantId ? `admin/merchants/${merchantId}` : '',
  );

  // Modals state
  const [messageOpen, setMessageOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [selectedStoreForAction, setSelectedStoreForAction] = useState<AdminStore | null>(null);

  // "More Actions" dropdown state
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  // PDF download state
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // Server-side pagination states
  const [commPage, setCommPage] = useState(1);
  const [subPage, setSubPage] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [modRevPage, setModRevPage] = useState(1);
  const [modStatusPage, setModStatusPage] = useState(1);
  const pageSize = 5;

  // Server-side paginated queries
  const commQuery = useAdminQuery<any>(
    merchantId ? `admin/merchants/${merchantId}/communications` : '',
    { page: commPage, pageSize },
  );

  const subQuery = useAdminQuery<any>(
    merchantId ? `admin/merchants/${merchantId}/subscriptions` : '',
    { page: subPage, pageSize },
  );

  const invQuery = useAdminQuery<any>(
    merchantId ? `admin/merchants/${merchantId}/invoices` : '',
    { page: invPage, pageSize },
  );

  const orderQuery = useAdminQuery<any>(
    merchantId ? `admin/merchants/${merchantId}/orders` : '',
    { page: orderPage, pageSize },
  );

  const modQuery = useAdminQuery<any>(
    merchantId ? `admin/merchants/${merchantId}/moderation-summary` : '',
    { reviewPage: modRevPage, statusPage: modStatusPage, pageSize },
  );

  const { api } = useAdminAuth();

  // Document preview and review modal state
  const [selectedDocForReview, setSelectedDocForReview] = useState<AdminMerchantDocument | null>(null);
  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReasonChoice, setRejectionReasonChoice] = useState('Document unclear');
  const [rejectionReasonCustom, setRejectionReasonCustom] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleViewDocument = async (doc: AdminMerchantDocument) => {
    setSelectedDocForReview(doc);
    setIsRejecting(false);
    setRejectionReasonChoice('Document unclear');
    setRejectionReasonCustom('');
    setDocLoading(true);
    if (docBlobUrl) {
      URL.revokeObjectURL(docBlobUrl);
      setDocBlobUrl(null);
    }
    try {
      const token = localStorage.getItem('simply_admin_token') || '';
      const res = await fetch(`/api/platform/admin/merchants/${merchantId}/documents/${doc.id}/view`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Could not retrieve secure document stream.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDocBlobUrl(url);
    } catch (err: any) {
      alert(err.message || 'Error loading document');
    } finally {
      setDocLoading(false);
    }
  };

  const handleCloseDocModal = () => {
    if (docBlobUrl) {
      URL.revokeObjectURL(docBlobUrl);
    }
    setSelectedDocForReview(null);
    setDocBlobUrl(null);
    setIsRejecting(false);
  };

  useEffect(() => {
    return () => {
      if (docBlobUrl) {
        URL.revokeObjectURL(docBlobUrl);
      }
    };
  }, [docBlobUrl]);

  const handleDownloadDoc = async (doc: AdminMerchantDocument) => {
    try {
      const token = localStorage.getItem('simply_admin_token') || '';
      const res = await fetch(`/api/platform/admin/merchants/${merchantId}/documents/${doc.id}/download`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Could not download document.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFilename || `${doc.type.toLowerCase()}-document`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download document');
    }
  };

  const handleVerifyDoc = async () => {
    if (!selectedDocForReview) return;
    setReviewSubmitting(true);
    try {
      await api.admin.reviewMerchantDocument(merchantId, selectedDocForReview.id, {
        status: 'VERIFIED',
      });
      handleCloseDocModal();
      reloadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to verify document');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRejectDoc = async () => {
    if (!selectedDocForReview) return;
    const reason =
      rejectionReasonChoice === 'Other'
        ? rejectionReasonCustom.trim() || 'Other reason'
        : rejectionReasonChoice;
    if (!reason) {
      alert('Please specify a rejection reason');
      return;
    }
    setReviewSubmitting(true);
    try {
      await api.admin.reviewMerchantDocument(merchantId, selectedDocForReview.id, {
        status: 'REJECTED',
        rejectionReason: reason,
      });
      handleCloseDocModal();
      reloadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to reject document');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const reloadAll = () => {
    reload();
    commQuery.reload();
    subQuery.reload();
    invQuery.reload();
    orderQuery.reload();
    modQuery.reload();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setMoreActionsOpen(false);
      }
    }
    if (moreActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreActionsOpen]);

  const ownerMembership = m?.memberships?.find((x) => x.role === 'SELLER_OWNER');
  const owner = ownerMembership?.user;
  const primaryStore = m?.stores?.[0];
  const isSuspended = m?.status === 'SUSPENDED' || primaryStore?.status === 'SUSPENDED';
  const isArchived = m?.status === 'ARCHIVED' || primaryStore?.status === 'ARCHIVED';

  // Canonical contact fallbacks
  const canonicalEmail = owner?.email || primaryStore?.supportEmail || 'Not provided';
  const canonicalPhone = owner?.phone || primaryStore?.supportPhone || primaryStore?.whatsappNumber || 'Not provided';
  const canonicalOwner = owner?.fullName || 'Not provided';

  // Subscription details
  const activeSub = m?.subscriptions?.[0];
  const activePlanName = activeSub?.plan?.name || 'No subscription';
  const isSubActive = activeSub?.status === 'ACTIVE' && new Date(activeSub.currentPeriodEnd) > new Date();

  // Primary store URLs
  const isPrimaryLive = primaryStore?.status === 'LIVE' && primaryStore?.isPubliclyAccessible;
  const primaryStoreUrl = primaryStore?.slug ? `${getStorefrontUrl()}/store/${primaryStore.slug}` : null;
  const primaryPreviewUrl = primaryStore?.slug && primaryStore?.previewSecret
    ? `${getStorefrontUrl()}/store/${primaryStore.slug}?previewSecret=${primaryStore.previewSecret}`
    : primaryStoreUrl;

  // Aggregated operational metrics across stores
  const totalProducts = m?.stores?.reduce((acc, s) => acc + (s._count?.products || 0), 0) || 0;
  const totalOrders = m?.stores?.reduce((acc, s) => acc + (s._count?.orders || 0), 0) || 0;
  const totalCustomers = m?.stores?.reduce((acc, s) => acc + (s._count?.customers || 0), 0) || 0;
  const totalReviews = m?.reviewStats?.activeCount ?? (m?.stores?.reduce((acc, s) => acc + (s._count?.productReviews || 0), 0) || 0);

  // Server-side paginated collections with graceful fallback
  const commData = commQuery.data?.data || m?.communicationHistory || [];
  const commPagination = commQuery.data?.pagination || {
    page: commPage,
    pageSize,
    total: commData.length,
    totalPages: Math.ceil(commData.length / pageSize) || 1,
  };

  const subData = subQuery.data?.data || m?.subscriptions || [];
  const subPagination = subQuery.data?.pagination || {
    page: subPage,
    pageSize,
    total: subData.length,
    totalPages: Math.ceil(subData.length / pageSize) || 1,
  };

  const invData = invQuery.data?.data || m?.paymentHistory || [];
  const invPagination = invQuery.data?.pagination || {
    page: invPage,
    pageSize,
    total: invData.length,
    totalPages: Math.ceil(invData.length / pageSize) || 1,
  };

  const orderData = orderQuery.data?.data || m?.recentOrders || [];
  const orderPagination = orderQuery.data?.pagination || {
    page: orderPage,
    pageSize,
    total: orderData.length,
    totalPages: Math.ceil(orderData.length / pageSize) || 1,
  };

  const modStats = modQuery.data?.stats || {
    activeReviews: m?.reviewStats?.activeCount ?? totalReviews,
    avgRating: m?.reviewStats?.avgRating ?? 0,
    pendingReports: m?.reportedReviewCount ?? 0,
    underReviewReports: 0,
    removedReviews: 0,
  };
  const modReviewData = modQuery.data?.reviewModerationActivity?.data || modQuery.data?.reviewActivity?.data || [];
  const modReviewPagination = modQuery.data?.reviewModerationActivity?.pagination || modQuery.data?.reviewActivity?.pagination || {
    page: modRevPage,
    pageSize,
    total: modReviewData.length,
    totalPages: Math.ceil(modReviewData.length / pageSize) || 1,
  };
  const modStatusData = modQuery.data?.statusHistory?.data || m?.suspensionHistory || [];

  // PDF Download Handler
  const handleDownloadInvoicePdf = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingPdfId(invoiceId);
    try {
      const res = await fetch(`/api/platform/admin/invoices/${invoiceId}/pdf`);
      if (!res.ok) {
        throw new Error('Could not retrieve invoice PDF from server.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download invoice PDF');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const openStoreSuspend = (s: AdminStore) => {
    setSelectedStoreForAction(s);
    setSuspendOpen(true);
  };

  const openStoreReactivate = (s: AdminStore) => {
    setSelectedStoreForAction(s);
    setReactivateOpen(true);
  };

  const openAccountSuspend = () => {
    setSelectedStoreForAction(null);
    setSuspendOpen(true);
  };

  const openAccountReactivate = () => {
    setSelectedStoreForAction(null);
    setReactivateOpen(true);
  };

  return (
    <AdminLayout>
      <Head>
        <title>{m ? `${m.name} — Merchant Details` : 'Merchant Details'} — LetzShop Admin</title>
      </Head>

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/merchants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-admin-accent hover:underline transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Merchants
          </Link>
        </div>

        <Feedback error={error} loading={loading && !m} onRetry={() => reload()} />

        {m && (
          <>
            {/* ============================================================== */}
            {/* MERCHANT HEADER BANNER                                         */}
            {/* ============================================================== */}
            <div className="admin-panel p-5 sm:p-6 space-y-4 shadow-sm border border-admin-border">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-admin-text truncate">
                      {primaryStore?.name || m.name}
                    </h1>
                    <StatusBadge status={primaryStore?.status || m.status} category="store" />
                    <span className="text-[11px] font-semibold text-admin-secondary uppercase px-2 py-0.5 rounded bg-admin-raised border border-admin-border">
                      Account: {m.status}
                    </span>
                    {isSuspended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300">
                        <ShieldAlert className="h-3 w-3" />
                        Suspended
                      </span>
                    )}
                  </div>

                  {m.name !== primaryStore?.name && (
                    <p className="text-xs text-admin-muted font-medium">
                      Legal Entity: <span className="text-admin-text font-semibold">{m.name}</span> · Slug: <span className="font-mono">{m.slug}</span>
                    </p>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-6 text-xs text-admin-muted pt-1 border-t border-admin-border/50">
                    <div>
                      <span className="text-admin-secondary font-medium">Owner:</span>{' '}
                      <span className="text-admin-text font-semibold">{canonicalOwner}</span>
                    </div>
                    <div>
                      <span className="text-admin-secondary font-medium">Email:</span>{' '}
                      <span className="text-admin-text">{canonicalEmail}</span>
                    </div>
                    <div>
                      <span className="text-admin-secondary font-medium">Phone:</span>{' '}
                      <span className="text-admin-text font-mono">{canonicalPhone}</span>
                    </div>
                    <div>
                      <span className="text-admin-secondary font-medium">Joined:</span>{' '}
                      <span className="text-admin-text">
                        {new Date(m.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {primaryStoreUrl && (
                      <div className="sm:col-span-2 lg:col-span-4 truncate pt-0.5">
                        <span className="text-admin-secondary font-medium">Store URL:</span>{' '}
                        <a
                          href={isPrimaryLive ? primaryStoreUrl : primaryPreviewUrl || primaryStoreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-admin-accent hover:underline font-mono text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          {isPrimaryLive ? primaryStoreUrl : primaryPreviewUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                  {primaryStoreUrl && !isSuspended && !isArchived && (
                    <a
                      href={isPrimaryLive ? primaryStoreUrl : primaryPreviewUrl || primaryStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3 font-semibold"
                    >
                      {isPrimaryLive ? (
                        <>
                          <ExternalLink className="h-3.5 w-3.5 text-admin-accent" />
                          View Store
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 text-amber-500" />
                          Admin Preview
                        </>
                      )}
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setMessageOpen(true)}
                    className="admin-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3 font-semibold text-admin-accent border-admin-accent/40 hover:bg-admin-soft"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Send Message
                  </button>

                  {/* More Actions Dropdown */}
                  <div className="relative" ref={moreActionsRef}>
                    <button
                      type="button"
                      onClick={() => setMoreActionsOpen((prev) => !prev)}
                      className="admin-button inline-flex items-center gap-1.5 text-xs py-2 px-3"
                      aria-expanded={moreActionsOpen}
                    >
                      <span>More Actions</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {moreActionsOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-admin-border bg-admin-surface py-1.5 shadow-2xl z-30 ring-1 ring-black/5 dark:ring-white/10">
                        {isSuspended ? (
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            onClick={() => {
                              setMoreActionsOpen(false);
                              openAccountReactivate();
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Reactivate Merchant
                          </button>
                        ) : (
                          !isArchived && (
                            <button
                              type="button"
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => {
                                setMoreActionsOpen(false);
                                openAccountSuspend();
                              }}
                            >
                              <ShieldAlert className="h-4 w-4" />
                              Suspend Merchant
                            </button>
                          )
                        )}

                        {!isArchived && (
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            onClick={() => {
                              setMoreActionsOpen(false);
                              setArchiveOpen(true);
                            }}
                          >
                            <Archive className="h-4 w-4" />
                            Archive Merchant
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* ROW 1: BUSINESS OVERVIEW (Left) + CURRENT PLAN (Right)         */}
            {/* ============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Business Overview */}
              <div className="admin-panel p-5 space-y-3.5 border border-admin-border">
                <h2 className="text-sm font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-2 border-b border-admin-border/60 pb-2">
                  <Layers className="h-4 w-4 text-admin-accent" />
                  Business Overview
                </h2>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-admin-raised p-3 border border-admin-border/40">
                    <span className="text-[10px] uppercase font-bold text-admin-muted block">Stores</span>
                    <span className="text-xl font-bold text-admin-text block mt-1 tabular-nums">
                      {m.stores?.length || 0}
                    </span>
                  </div>

                  <div className="rounded-xl bg-admin-raised p-3 border border-admin-border/40">
                    <span className="text-[10px] uppercase font-bold text-admin-muted block">Products</span>
                    <span className="text-xl font-bold text-admin-text block mt-1 tabular-nums">
                      {totalProducts}
                    </span>
                  </div>

                  <div className="rounded-xl bg-admin-raised p-3 border border-admin-border/40">
                    <span className="text-[10px] uppercase font-bold text-admin-muted block">Orders</span>
                    <span className="text-xl font-bold text-admin-text block mt-1 tabular-nums">
                      {totalOrders}
                    </span>
                  </div>

                  <div className="rounded-xl bg-admin-raised p-3 border border-admin-border/40">
                    <span className="text-[10px] uppercase font-bold text-admin-muted block">Customers</span>
                    <span className="text-xl font-bold text-admin-text block mt-1 tabular-nums">
                      {totalCustomers}
                    </span>
                  </div>

                  <div className="rounded-xl bg-admin-raised p-3 border border-admin-border/40">
                    <span className="text-[10px] uppercase font-bold text-admin-muted block">Active Reviews</span>
                    <span className="text-xl font-bold text-admin-text block mt-1 tabular-nums">
                      {totalReviews}
                    </span>
                  </div>

                  <div className="rounded-xl bg-admin-raised p-3 border border-admin-border/40">
                    <span className="text-[10px] uppercase font-bold text-admin-muted block">Pending Reports</span>
                    <span className={`text-xl font-bold block mt-1 tabular-nums ${m.reportedReviewCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-admin-text'}`}>
                      {m.reportedReviewCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Plan */}
              <div className="admin-panel p-5 space-y-3.5 border border-admin-border">
                <div className="flex items-center justify-between border-b border-admin-border/60 pb-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-admin-accent" />
                    Current Plan
                  </h2>
                  <Link
                    href={`/billing?tenantId=${m.id}`}
                    className="text-xs text-admin-accent font-semibold hover:underline"
                  >
                    Manage Billing
                  </Link>
                </div>

                {activeSub ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-admin-text">{activeSub.plan.name}</span>
                        <span className="text-xs text-admin-muted block font-mono">
                          {formatPaise(activeSub.plan.pricePaise)} / {activeSub.plan.billingCycle?.toLowerCase() || 'month'}
                        </span>
                      </div>
                      <StatusBadge status={activeSub.status} category="subscription" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="rounded-lg bg-admin-raised p-2.5 border border-admin-border/40">
                        <span className="text-admin-muted block text-[10px] font-semibold uppercase">Started</span>
                        <span className="text-admin-text font-semibold block mt-0.5">
                          {new Date(activeSub.currentPeriodStart).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="rounded-lg bg-admin-raised p-2.5 border border-admin-border/40">
                        <span className="text-admin-muted block text-[10px] font-semibold uppercase">Valid Until</span>
                        <span className="text-admin-text font-semibold block mt-0.5">
                          {new Date(activeSub.currentPeriodEnd).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-admin-muted flex items-center justify-between pt-1">
                      <span>Status:</span>
                      <span className="font-semibold text-admin-text">
                        {isSubActive ? 'Paid & Active' : 'Payment Required / Expired'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-admin-muted text-xs">
                    No active subscription recorded for this merchant.
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================== */}
            {/* BUSINESS VERIFICATION (Full-Width Responsive Section)          */}
            {/* ============================================================== */}
            <div className="admin-panel p-5 space-y-4 border border-admin-border shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-admin-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-admin-accent/10 border border-admin-accent/20">
                    <ShieldCheck className="h-5 w-5 text-admin-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-admin-text">Business Verification</h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      Entity registration profile, compliance documents, and review actions
                    </p>
                  </div>
                </div>

                {/* Overall Verification Status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-admin-muted font-medium">Verification Status:</span>
                  {m.businessVerificationStatus === 'VERIFIED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : m.businessVerificationStatus === 'PENDING_REVIEW' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Review
                    </span>
                  ) : m.businessVerificationStatus === 'NEEDS_CHANGES' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Needs Changes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                      Incomplete
                    </span>
                  )}
                </div>
              </div>

              {/* Legal Entity Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-admin-raised/40 p-4 rounded-2xl border border-admin-border text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-admin-muted block">Business Type</span>
                  <span className="font-bold text-admin-text block mt-0.5 text-sm">
                    {m.businessType ? humanBusinessType(m.businessType) : 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-admin-muted block">GST Registered</span>
                  <span className="font-bold text-admin-text block mt-0.5 text-sm">
                    {m.gstRegistered ? 'Yes' : 'No'}
                  </span>
                  {m.gstin && (
                    <span className="text-[11px] font-mono text-admin-muted block mt-0.5">
                      GSTIN: {m.gstin}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-admin-muted block">Business PAN</span>
                  <span className="font-mono font-bold text-admin-text block mt-0.5 text-sm">
                    {m.panNumberMasked || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-admin-muted block">Udyam Registration</span>
                  <span className="font-mono font-bold text-admin-text block mt-0.5 text-sm">
                    {m.udyamNumber || '—'}
                  </span>
                </div>
              </div>

              {/* Documents Table */}
              <div className="overflow-x-auto admin-scrollbar border border-admin-border rounded-2xl">
                <table className="w-full text-left text-xs divide-y divide-admin-border">
                  <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Document Number</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/60 bg-admin-surface">
                    {/* Render requirements and matching documents */}
                    {(m.verification?.requirements && m.verification.requirements.length > 0
                      ? m.verification.requirements
                      : [
                          { type: 'PAN', name: 'PAN', required: true },
                          { type: 'OWNER_ID', name: 'Owner Identity', required: true },
                          { type: 'UDYAM', name: 'Udyam Registration', required: false },
                          { type: 'GST_CERTIFICATE', name: 'GST Certificate', required: Boolean(m.gstRegistered) },
                        ]
                    ).map((req) => {
                      const doc = m.verification?.documents?.find(
                        (d) => d.type === req.type && d.isCurrent,
                      );

                      return (
                        <tr key={req.type} className="hover:bg-admin-raised/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-admin-text block">
                              {humanDocType(req.type)}
                            </span>
                            <span className="text-[10px] text-admin-muted block mt-0.5">
                              {req.required ? (
                                <strong className="text-amber-500 font-semibold">Mandatory</strong>
                              ) : (
                                'Optional'
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono">
                            {doc?.documentNumberMasked ? (
                              <span className="font-bold text-admin-text">
                                {doc.documentNumberMasked}
                              </span>
                            ) : req.type === 'PAN' && m.panNumberMasked ? (
                              <span className="text-admin-secondary">{m.panNumberMasked}</span>
                            ) : req.type === 'UDYAM' && m.udyamNumber ? (
                              <span className="text-admin-secondary">{m.udyamNumber}</span>
                            ) : req.type === 'GST_CERTIFICATE' && m.gstin ? (
                              <span className="text-admin-secondary">{m.gstin}</span>
                            ) : (
                              <span className="text-admin-muted">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {!doc ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                Not Uploaded
                              </span>
                            ) : doc.status === 'VERIFIED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                <Check className="w-3 h-3" />
                                Verified
                              </span>
                            ) : doc.status === 'PENDING_REVIEW' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                Pending Review
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  Rejected
                                </span>
                                {doc.rejectionReason && (
                                  <span className="block text-[10px] text-red-400 truncate max-w-xs" title={doc.rejectionReason}>
                                    Reason: {doc.rejectionReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-admin-secondary">
                            {doc?.updatedAt ? (
                              new Date(doc.updatedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            ) : (
                              <span className="text-admin-muted">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {doc ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewDocument(doc)}
                                  className="px-3 py-1 text-xs font-semibold rounded-xl bg-admin-raised hover:bg-admin-surface text-admin-secondary hover:text-admin-accent border border-admin-border hover:border-admin-accent/40 transition cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{doc.status === 'PENDING_REVIEW' ? 'Review' : 'View'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDoc(doc)}
                                  className="p-1 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-raised transition cursor-pointer"
                                  title="Download securely"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-admin-muted text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ============================================================== */}
            {/* ROW 2: STORES (Full-Width Responsive Section)                  */}
            {/* ============================================================== */}
            <div className="admin-panel p-5 space-y-4 border border-admin-border">
              <div className="flex items-center justify-between border-b border-admin-border/60 pb-3">
                <h2 className="text-base font-bold text-admin-text flex items-center gap-2">
                  <Store className="h-4 w-4 text-admin-accent" />
                  Stores ({m.stores?.length || 0})
                </h2>
                <span className="text-xs text-admin-muted">
                  Full multi-store visibility & status controls
                </span>
              </div>

              <div className="overflow-x-auto admin-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border">
                    <tr>
                      <th className="px-3.5 py-2.5">Store Name & Slug</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Public Availability</th>
                      <th className="px-3.5 py-2.5 text-center">Products</th>
                      <th className="px-3.5 py-2.5 text-center">Orders</th>
                      <th className="px-3.5 py-2.5 text-center">Customers</th>
                      <th className="px-3.5 py-2.5">Mode</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/60">
                    {m.stores && m.stores.length > 0 ? (
                      m.stores.map((s) => {
                        const isStoreLive = s.status === 'LIVE' && s.isPubliclyAccessible;
                        const isStoreSuspended = s.status === 'SUSPENDED';
                        const sUrl = `${getStorefrontUrl()}/store/${s.slug}`;
                        const sPreviewUrl = s.previewSecret ? `${sUrl}?previewSecret=${s.previewSecret}` : sUrl;

                        return (
                          <tr key={s.id} className="hover:bg-admin-raised/40 transition-colors">
                            <td className="px-3.5 py-3">
                              <span className="font-bold text-admin-text block text-sm">{s.name}</span>
                              <span className="font-mono text-[11px] text-admin-muted block mt-0.5">{s.slug}</span>
                            </td>
                            <td className="px-3.5 py-3">
                              <StatusBadge status={s.status} category="store" />
                            </td>
                            <td className="px-3.5 py-3">
                              {s.isPubliclyAccessible ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Publicly Accessible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                  <Eye className="h-3 w-3" />
                                  Private Preview Only
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-center font-semibold text-admin-text tabular-nums">
                              {s._count?.products ?? 0}
                            </td>
                            <td className="px-3.5 py-3 text-center font-semibold text-admin-text tabular-nums">
                              {s._count?.orders ?? 0}
                            </td>
                            <td className="px-3.5 py-3 text-center font-semibold text-admin-text tabular-nums">
                              {s._count?.customers ?? 0}
                            </td>
                            <td className="px-3.5 py-3 text-admin-secondary uppercase text-[10px] font-semibold">
                              {s.fulfillmentMode || 'DELIVERY'}
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isStoreLive ? (
                                  <a
                                    href={sUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 font-semibold"
                                  >
                                    <ExternalLink className="h-3 w-3 text-admin-accent" />
                                    View Store
                                  </a>
                                ) : (
                                  <a
                                    href={sPreviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Admin Preview
                                  </a>
                                )}

                                {isStoreSuspended ? (
                                  <button
                                    type="button"
                                    onClick={() => openStoreReactivate(s)}
                                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
                                  >
                                    Reactivate
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openStoreSuspend(s)}
                                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                                  >
                                    Suspend
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-admin-muted">
                          No stores registered under this merchant tenant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ============================================================== */}
            {/* ROW 3: COMMUNICATION HISTORY (Full Width, Controlled Height)   */}
            {/* ============================================================== */}
            <div id="communication-history-card" className="admin-panel h-[380px] flex flex-col p-5 border border-admin-border">
              <div className="flex items-center justify-between border-b border-admin-border/60 pb-3 shrink-0">
                <h2 className="text-base font-bold text-admin-text flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-admin-accent" />
                  Communication History
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-admin-muted tabular-nums">
                    {commPagination.total} record{commPagination.total === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMessageOpen(true)}
                    className="text-xs text-admin-accent font-semibold hover:underline"
                  >
                    + New Message
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto admin-scrollbar mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border sticky top-0 z-10">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Channel</th>
                      <th className="px-3.5 py-2.5">Subject / Action</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/60">
                    {commData.length > 0 ? (
                      commData.map((item: any) => (
                        <tr key={item.id} className="hover:bg-admin-raised/40 transition-colors">
                          <td className="px-3.5 py-2.5 text-admin-muted whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-3.5 py-2.5 font-semibold text-admin-text">
                            {item.channel}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="font-semibold text-admin-text block">{item.subject}</span>
                            {item.message && (
                              <span className="text-admin-muted line-clamp-1 text-[11px] font-mono mt-0.5">
                                {item.message}
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                item.status.includes('Sent')
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : item.status.includes('WhatsApp')
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                  : item.status.includes('Failed')
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-admin-muted font-medium">{item.adminName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-admin-muted">
                          No communication records for this merchant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Fixed Pagination Footer */}
              <div className="shrink-0 pt-2.5 mt-auto border-t border-admin-border/50 flex items-center justify-between text-xs text-admin-muted">
                <span>
                  Showing page {commPagination.page} of {commPagination.totalPages} ({commPagination.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={commPage <= 1}
                    onClick={() => setCommPage((p) => Math.max(1, p - 1))}
                    className="admin-secondary text-xs px-2.5 py-1 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={commPage >= commPagination.totalPages}
                    onClick={() => setCommPage((p) => p + 1)}
                    className="admin-secondary text-xs px-2.5 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* ROW 4: SUBSCRIPTION HISTORY (Left) + INVOICE HISTORY (Right)   */}
            {/* Desktop: Identical Computed Heights (420px)                    */}
            {/* ============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Subscription History Card */}
              <div id="subscription-history-card" className="admin-panel h-[420px] flex flex-col p-5 border border-admin-border">
                <div className="flex items-center justify-between border-b border-admin-border/60 pb-2.5 shrink-0">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-2">
                    <Clock className="h-4 w-4 text-admin-accent" />
                    Subscription History
                  </h2>
                  <span className="text-xs text-admin-muted tabular-nums">
                    {subPagination.total} total
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto admin-scrollbar mt-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Start</th>
                        <th className="px-3 py-2">Valid Until</th>
                        <th className="px-3 py-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border/60">
                      {subData.length > 0 ? (
                        subData.map((s: any) => (
                          <tr key={s.id} className="hover:bg-admin-raised/40">
                            <td className="px-3 py-2 font-semibold text-admin-text whitespace-nowrap">
                              {s.plan?.name || 'Standard'}
                            </td>
                            <td className="px-3 py-2 font-mono tabular-nums text-admin-text">
                              {s.plan?.pricePaise != null ? formatPaise(s.plan.pricePaise) : '—'}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={s.status} category="subscription" />
                            </td>
                            <td className="px-3 py-2 text-admin-muted whitespace-nowrap">
                              {new Date(s.currentPeriodStart).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-3 py-2 text-admin-muted whitespace-nowrap">
                              {new Date(s.currentPeriodEnd).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={s.paymentStatus || 'PAID'} category="payment" />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-admin-muted">
                            No subscription history recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Fixed Pagination Footer */}
                <div className="shrink-0 pt-2.5 mt-auto border-t border-admin-border/50 flex items-center justify-between text-xs text-admin-muted">
                  <span>
                    Page {subPagination.page} of {subPagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={subPage <= 1}
                      onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                      className="admin-secondary text-xs px-2 py-0.5 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={subPage >= subPagination.totalPages}
                      onClick={() => setSubPage((p) => p + 1)}
                      className="admin-secondary text-xs px-2 py-0.5 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoice History with PDF action Card */}
              <div id="invoice-history-card" className="admin-panel h-[420px] flex flex-col p-5 border border-admin-border">
                <div className="flex items-center justify-between border-b border-admin-border/60 pb-2.5 shrink-0">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-2">
                    <FileText className="h-4 w-4 text-admin-accent" />
                    Invoice History & PDF
                  </h2>
                  <span className="text-xs text-admin-muted tabular-nums">
                    {invPagination.total} total
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto admin-scrollbar mt-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2">Invoice #</th>
                        <th className="px-3 py-2">Billing Period</th>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2 text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border/60">
                      {invData.length > 0 ? (
                        invData.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-admin-raised/40">
                            <td className="px-3 py-2 font-mono text-admin-text font-semibold whitespace-nowrap">
                              {inv.invoiceNumber}
                            </td>
                            <td className="px-3 py-2 text-admin-muted whitespace-nowrap text-[11px]">
                              {inv.periodStart && inv.periodEnd
                                ? `${new Date(inv.periodStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${new Date(inv.periodEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                : '—'}
                            </td>
                            <td className="px-3 py-2 text-admin-secondary font-medium">
                              {inv.planName || inv.subscription?.plan?.name || 'Launch'}
                            </td>
                            <td className="px-3 py-2 font-bold tabular-nums text-admin-text">
                              {formatPaise(inv.amountPaise)}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={inv.status} category="payment" />
                            </td>
                            <td className="px-3 py-2 text-admin-muted whitespace-nowrap">
                              {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                disabled={downloadingPdfId === inv.id}
                                onClick={() => handleDownloadInvoicePdf(inv.id, inv.invoiceNumber)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-admin-accent hover:underline disabled:opacity-50"
                                title="Download Official Invoice PDF"
                              >
                                <Download className="h-3 w-3" />
                                {downloadingPdfId === inv.id ? 'PDF…' : 'PDF'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-admin-muted">
                            No recorded invoices for this merchant.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Fixed Pagination Footer */}
                <div className="shrink-0 pt-2.5 mt-auto border-t border-admin-border/50 flex items-center justify-between text-xs text-admin-muted">
                  <span>
                    Page {invPagination.page} of {invPagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={invPage <= 1}
                      onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                      className="admin-secondary text-xs px-2 py-0.5 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={invPage >= invPagination.totalPages}
                      onClick={() => setInvPage((p) => p + 1)}
                      className="admin-secondary text-xs px-2 py-0.5 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* ROW 5: RECENT ORDERS (Left) + REVIEW & MODERATION (Right)      */}
            {/* Desktop: Identical Computed Heights (420px)                    */}
            {/* ============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent Orders Card */}
              <div id="recent-orders-card" className="admin-panel h-[420px] flex flex-col p-5 border border-admin-border">
                <div className="flex items-center justify-between border-b border-admin-border/60 pb-2.5 shrink-0">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-admin-accent" />
                    Recent Orders (Page Size: {pageSize})
                  </h2>
                  <Link href={`/orders?search=${m.slug}`} className="text-xs text-admin-accent font-semibold hover:underline">
                    View All in Orders
                  </Link>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto admin-scrollbar mt-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2">Order #</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border/60">
                      {orderData.length > 0 ? (
                        orderData.map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-admin-raised/40">
                            <td className="px-3 py-2 font-mono font-semibold text-admin-text whitespace-nowrap">
                              <Link href={`/orders/${ord.id}`} className="hover:text-admin-accent hover:underline">
                                {ord.orderNumber}
                              </Link>
                            </td>
                            <td className="px-3 py-2 text-admin-secondary">
                              {ord.customer?.fullName || 'Guest'}
                            </td>
                            <td className="px-3 py-2 font-bold tabular-nums text-admin-text">
                              {formatPaise(ord.totalPaise)}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={ord.status} category="order" />
                            </td>
                            <td className="px-3 py-2 text-admin-muted whitespace-nowrap">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-admin-muted">
                            No recent customer orders recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Fixed Pagination Footer */}
                <div className="shrink-0 pt-2.5 mt-auto border-t border-admin-border/50 flex items-center justify-between text-xs text-admin-muted">
                  <span>
                    Page {orderPagination.page} of {orderPagination.totalPages} ({orderPagination.total} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={orderPage <= 1}
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                      className="admin-secondary text-xs px-2 py-0.5 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={orderPage >= orderPagination.totalPages}
                      onClick={() => setOrderPage((p) => p + 1)}
                      className="admin-secondary text-xs px-2 py-0.5 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Review / Moderation Summary Card */}
              <div id="moderation-summary-card" className="admin-panel h-[420px] flex flex-col p-5 border border-admin-border">
                <div className="flex items-center justify-between border-b border-admin-border/60 pb-2.5 shrink-0">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-admin-secondary flex items-center gap-2">
                    <Star className="h-4 w-4 text-admin-accent" />
                    Review & Moderation Summary
                  </h2>
                  <Link
                    href={primaryStore ? `/reviews?storeId=${primaryStore.id}` : '/reviews'}
                    className="text-xs text-admin-accent font-semibold hover:underline"
                  >
                    Moderate Reviews
                  </Link>
                </div>

                {/* Fixed Compact Summary Metrics (5 Cards) */}
                <div className="grid grid-cols-5 gap-2 pt-3 shrink-0">
                  <div className="rounded-lg bg-admin-raised p-2 border border-admin-border/40 text-center">
                    <span className="text-[9px] uppercase font-bold text-admin-muted block truncate">Active</span>
                    <span className="text-sm font-bold text-admin-text block mt-0.5 tabular-nums">
                      {modStats.activeReviews}
                    </span>
                  </div>
                  <div className="rounded-lg bg-admin-raised p-2 border border-admin-border/40 text-center">
                    <span className="text-[9px] uppercase font-bold text-admin-muted block truncate">Rating</span>
                    <span className="text-sm font-bold text-admin-text block mt-0.5 tabular-nums">
                      {modStats.avgRating ? `${modStats.avgRating}★` : '—'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-admin-raised p-2 border border-admin-border/40 text-center">
                    <span className="text-[9px] uppercase font-bold text-admin-muted block truncate">Pending</span>
                    <span className={`text-sm font-bold block mt-0.5 tabular-nums ${modStats.pendingReports > 0 ? 'text-amber-500 font-extrabold' : 'text-admin-text'}`}>
                      {modStats.pendingReports}
                    </span>
                  </div>
                  <div className="rounded-lg bg-admin-raised p-2 border border-admin-border/40 text-center">
                    <span className="text-[9px] uppercase font-bold text-admin-muted block truncate">Reviewing</span>
                    <span className={`text-sm font-bold block mt-0.5 tabular-nums ${modStats.underReviewReports > 0 ? 'text-blue-500 font-extrabold' : 'text-admin-text'}`}>
                      {modStats.underReviewReports}
                    </span>
                  </div>
                  <div className="rounded-lg bg-admin-raised p-2 border border-admin-border/40 text-center">
                    <span className="text-[9px] uppercase font-bold text-admin-muted block truncate">Removed</span>
                    <span className={`text-sm font-bold block mt-0.5 tabular-nums ${modStats.removedReviews > 0 ? 'text-red-500 font-extrabold' : 'text-admin-text'}`}>
                      {modStats.removedReviews}
                    </span>
                  </div>
                </div>

                {/* Internally Scrollable Body with Two Visually Separated Sections */}
                <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar mt-3 space-y-4">
                  {/* Section A: Review Moderation Activity */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-admin-secondary flex items-center justify-between mb-2">
                      <span>Review Moderation Activity</span>
                      <span className="text-admin-muted text-[10px] font-normal">
                        {modReviewPagination.total} reviews
                      </span>
                    </span>

                    {modReviewData.length > 0 ? (
                      <div className="space-y-2">
                        {modReviewData.map((rev: any) => {
                          const activeReport = rev.reports?.find((p: any) =>
                            ['PENDING', 'UNDER_REVIEW'].includes(p.status),
                          ) || rev.reports?.[0];

                          return (
                            <div
                              key={rev.id}
                              className="p-2.5 rounded-lg bg-admin-raised/60 border border-admin-border/40 hover:border-admin-accent/40 transition-colors text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-admin-text truncate">
                                  {rev.customer?.fullName || 'Customer'}
                                  <span className="font-normal text-admin-muted ml-1.5">
                                    on {rev.product?.name || 'Product'}
                                  </span>
                                </span>
                                <span className="text-amber-500 font-bold shrink-0 ml-2">
                                  {rev.rating}★
                                </span>
                              </div>
                              <p className="text-admin-secondary text-[11px] line-clamp-1 italic">
                                &ldquo;{rev.comment || 'No comment text'}&rdquo;
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1.5">
                                  <StatusBadge status={rev.status} category="auto" className="text-[10px] py-0" />
                                  {activeReport && (
                                    <StatusBadge status={activeReport.status} category="auto" className="text-[10px] py-0" />
                                  )}
                                </div>
                                <span className="text-admin-muted text-[10px]">
                                  {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-admin-muted text-xs py-3">
                        No reviews or complaints for this merchant.
                      </p>
                    )}
                  </div>

                  {/* Section B: Store / Account Status History */}
                  <div className="pt-2 border-t border-admin-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-admin-secondary block mb-2">
                      Store / Account Status History
                    </span>
                    {modStatusData && modStatusData.length > 0 ? (
                      <div className="space-y-1.5 text-xs">
                        {modStatusData.map((sh: any) => (
                          <div
                            key={sh.id}
                            className="flex items-center justify-between py-1 border-b border-admin-border/30 last:border-0"
                          >
                            <div className="truncate mr-2">
                              <span
                                className={`font-semibold ${
                                  sh.action === 'SUSPENDED'
                                    ? 'text-red-500'
                                    : 'text-emerald-500'
                                }`}
                              >
                                {sh.action}
                              </span>
                              <span className="text-admin-muted ml-1.5">({sh.target})</span>
                              {sh.reason && (
                                <span className="text-admin-secondary ml-1.5 font-medium truncate max-w-xs inline-block align-bottom">
                                  · {sh.reason}
                                </span>
                              )}
                            </div>
                            <span className="text-admin-muted text-[10px] shrink-0">
                              {new Date(sh.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-admin-muted text-xs py-1">No suspension or reactivation events recorded.</p>
                    )}
                  </div>
                </div>

                {/* Fixed Pagination Footer for Moderation Activity */}
                <div className="shrink-0 pt-2.5 mt-auto border-t border-admin-border/50 flex items-center justify-between text-xs text-admin-muted">
                  <span>
                    Review Page {modReviewPagination.page} of {modReviewPagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={modRevPage <= 1}
                      onClick={() => setModRevPage((p) => Math.max(1, p - 1))}
                      className="admin-secondary text-xs px-2 py-0.5 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={modRevPage >= modReviewPagination.totalPages}
                      onClick={() => setModRevPage((p) => p + 1)}
                      className="admin-secondary text-xs px-2 py-0.5 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* ACTION MODALS                                                  */}
      {/* ============================================================== */}
      {m && messageOpen && (
        <SendMessageModal
          merchantId={m.id}
          merchantName={primaryStore?.name || m.name}
          recipientEmail={owner?.email}
          recipientPhone={owner?.phone}
          onClose={() => setMessageOpen(false)}
          onSuccess={() => reloadAll()}
        />
      )}

      {m && suspendOpen && (
        <SuspendMerchantModal
          merchantId={m.id}
          merchantName={selectedStoreForAction ? selectedStoreForAction.name : (primaryStore?.name || m.name)}
          recipientEmail={owner?.email}
          recipientPhone={owner?.phone}
          stores={m.stores?.map((s) => ({ id: s.id, name: s.name }))}
          initialStoreId={selectedStoreForAction?.id}
          onClose={() => {
            setSuspendOpen(false);
            setSelectedStoreForAction(null);
          }}
          onSuccess={() => reloadAll()}
        />
      )}

      {m && reactivateOpen && (
        <ReactivateMerchantModal
          merchantId={m.id}
          merchantName={selectedStoreForAction ? selectedStoreForAction.name : (primaryStore?.name || m.name)}
          recipientEmail={owner?.email}
          recipientPhone={owner?.phone}
          storeId={selectedStoreForAction?.id}
          onClose={() => {
            setReactivateOpen(false);
            setSelectedStoreForAction(null);
          }}
          onSuccess={() => reloadAll()}
        />
      )}

      {m && archiveOpen && (
        <ArchiveMerchantModal
          merchantId={m.id}
          merchantName={primaryStore?.name || m.name}
          recipientEmail={owner?.email}
          recipientPhone={owner?.phone}
          onClose={() => setArchiveOpen(false)}
          onSuccess={() => reloadAll()}
        />
      )}

      {/* ============================================================== */}
      {/* SECURE DOCUMENT PREVIEW & REVIEW MODAL                         */}
      {/* ============================================================== */}
      {selectedDocForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay backdrop-blur-sm animate-in fade-in">
          <div className="bg-admin-surface border border-admin-border rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-admin-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-admin-text">
                    {humanDocType(selectedDocForReview.type)}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-admin-raised border border-admin-border text-admin-secondary">
                    {selectedDocForReview.status}
                  </span>
                </div>
                <p className="text-xs text-admin-muted mt-0.5">
                  Merchant: <strong className="text-admin-text">{m?.name}</strong> · ID:{' '}
                  <span className="font-mono text-[11px]">{selectedDocForReview.documentNumberMasked || 'N/A'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDocModal}
                className="p-1.5 rounded-xl text-admin-muted hover:text-admin-text hover:bg-admin-raised"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Document Details Metadata Bar */}
            <div className="px-5 py-2.5 bg-admin-raised/40 border-b border-admin-border flex flex-wrap items-center justify-between gap-3 text-xs text-admin-muted">
              <div className="flex flex-wrap items-center gap-4">
                <span>
                  Filename: <strong className="text-admin-text font-mono text-[11px]">{selectedDocForReview.originalFilename}</strong>
                </span>
                <span>
                  Size: <strong className="text-admin-text">{Math.round(selectedDocForReview.fileSizeBytes / 1024)} KB</strong>
                </span>
                <span>
                  Format: <strong className="text-admin-text uppercase">{selectedDocForReview.mimeType.split('/')[1] || 'FILE'}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadDoc(selectedDocForReview)}
                className="inline-flex items-center gap-1.5 text-xs text-admin-accent hover:underline font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Securely</span>
              </button>
            </div>

            {/* Modal Body / Stream Preview */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {docLoading ? (
                <div className="h-80 flex flex-col items-center justify-center gap-3 text-admin-muted text-xs">
                  <span className="w-8 h-8 border-2 border-admin-accent border-t-transparent rounded-full animate-spin" />
                  <span>Loading secure document stream...</span>
                </div>
              ) : docBlobUrl ? (
                <div className="rounded-2xl border border-admin-border bg-admin-bg p-2 overflow-hidden flex items-center justify-center min-h-[380px]">
                  {selectedDocForReview.mimeType === 'application/pdf' ? (
                    <iframe
                      src={docBlobUrl}
                      title={selectedDocForReview.originalFilename}
                      className="w-full h-[450px] rounded-xl border border-admin-border/50"
                    />
                  ) : selectedDocForReview.mimeType.startsWith('image/') ? (
                    <img
                      src={docBlobUrl}
                      alt={selectedDocForReview.originalFilename}
                      className="max-h-[450px] w-auto object-contain mx-auto rounded-xl"
                    />
                  ) : (
                    <div className="p-10 text-center text-xs text-admin-muted">
                      Preview unavailable. Download securely.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center text-xs text-admin-muted">
                  Preview unavailable. Download securely.
                </div>
              )}

              {/* Rejection Reason Form */}
              {isRejecting && (
                <div className="p-4 rounded-2xl bg-admin-danger-soft border border-admin-border space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-admin-danger font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Specify Reason for Rejection / Changes Requested</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-admin-secondary mb-1">
                      Reason Category
                    </label>
                    <select
                      value={rejectionReasonChoice}
                      onChange={(e) => setRejectionReasonChoice(e.target.value)}
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                    >
                      <option value="Document unclear">Document unclear / blurry</option>
                      <option value="Expired document">Expired document</option>
                      <option value="Name mismatch">Legal name mismatch with merchant profile</option>
                      <option value="Incorrect document">Incorrect document type uploaded</option>
                      <option value="Incomplete document">Incomplete document / missing pages</option>
                      <option value="Other">Other reason (specify below)</option>
                    </select>
                  </div>

                  {rejectionReasonChoice === 'Other' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-admin-secondary mb-1">
                        Detailed Note for Merchant
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionReasonCustom}
                        onChange={(e) => setRejectionReasonCustom(e.target.value)}
                        placeholder="Provide clear guidance on what the merchant needs to provide"
                        className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-admin-raised/40 border-t border-admin-border flex items-center justify-between gap-3">
              <span className="text-[11px] text-admin-muted">
                Audit: Actions recorded with timestamp & administrator identity.
              </span>

              <div className="flex items-center gap-2">
                {isRejecting ? (
                  <>
                    <button
                      type="button"
                      disabled={reviewSubmitting}
                      onClick={() => setIsRejecting(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-admin-secondary hover:bg-admin-raised"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={reviewSubmitting}
                      onClick={handleRejectDoc}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                    >
                      {reviewSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={reviewSubmitting}
                      onClick={() => setIsRejecting(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-admin-surface hover:bg-admin-danger-soft text-admin-muted hover:text-admin-danger border border-admin-border"
                    >
                      Reject / Request Changes
                    </button>
                    <button
                      type="button"
                      disabled={reviewSubmitting}
                      onClick={handleVerifyDoc}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{reviewSubmitting ? 'Verifying...' : 'Verify Document'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

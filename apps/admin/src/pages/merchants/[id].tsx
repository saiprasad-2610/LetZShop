import type { AdminMerchantDetail, AdminCommunicationLog } from '@simply/api-contracts';
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ExternalLink,
  Mail,
  ShieldAlert,
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

  // "More Actions" dropdown state
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

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
  const activePlan = m?.subscriptions?.[0]?.plan?.name || 'No subscription';
  const storeUrl = primaryStore?.slug ? `${getStorefrontUrl()}/store/${primaryStore.slug}` : null;

  return (
    <AdminLayout>
      <Head>
        <title>{m ? `${m.name} — Merchant Details` : 'Merchant Details'} — LetzShop Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/merchants"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-admin-accent hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Merchants
          </Link>
        </div>

        <Feedback error={error} loading={loading && !m} onRetry={() => reload()} />

        {m && (
          <>
            {/* Merchant Detail Header Banner */}
            <div className="admin-panel p-5 sm:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-admin-text">
                      {primaryStore?.name || m.name}
                    </h1>
                    <StatusBadge status={primaryStore?.status || m.status} category="store" />
                    {m.status !== (primaryStore?.status || m.status) && (
                      <span className="text-xs text-admin-muted uppercase px-2 py-0.5 rounded bg-admin-raised border border-admin-border">
                        Account: {m.status}
                      </span>
                    )}
                  </div>

                  {m.name !== primaryStore?.name && (
                    <p className="text-xs text-admin-muted font-medium">
                      Legal Business: {m.name} · <span className="font-mono">{m.slug}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-6 text-xs text-admin-muted pt-1">
                    <div>
                      <span className="text-admin-secondary font-medium">Owner:</span>{' '}
                      <span className="text-admin-text">{owner?.fullName || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-admin-secondary font-medium">Email:</span>{' '}
                      <span className="text-admin-text">{owner?.email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-admin-secondary font-medium">Phone:</span>{' '}
                      <span className="text-admin-text">{owner?.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-admin-secondary font-medium">Plan:</span>{' '}
                      <span className="text-admin-text font-semibold">{activePlan}</span>
                    </div>
                    {storeUrl && (
                      <div className="sm:col-span-2 truncate">
                        <span className="text-admin-secondary font-medium">Store URL:</span>{' '}
                        <a
                          href={storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-admin-accent hover:underline font-mono text-[11px]"
                        >
                          {storeUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                  {storeUrl && !isSuspended && !isArchived && (
                    <a
                      href={storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-admin-muted" />
                      View Store
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setMessageOpen(true)}
                    className="admin-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3 font-semibold text-admin-accent border-admin-accent/30 hover:bg-admin-soft"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Send Message
                  </button>

                  {/* More Actions Dropdown */}
                  <div className="relative" ref={moreActionsRef}>
                    <button
                      type="button"
                      onClick={() => setMoreActionsOpen((prev) => !prev)}
                      className="admin-button inline-flex items-center gap-1 text-xs py-2 px-3"
                      aria-expanded={moreActionsOpen}
                    >
                      <span>More Actions</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {moreActionsOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-admin-border bg-admin-surface py-1.5 shadow-2xl z-30 ring-1 ring-black/5 dark:ring-white/10">
                        {isSuspended ? (
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            onClick={() => {
                              setMoreActionsOpen(false);
                              setReactivateOpen(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Reactivate Merchant
                          </button>
                        ) : (
                          !isArchived && (
                            <button
                              type="button"
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => {
                                setMoreActionsOpen(false);
                                setSuspendOpen(true);
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
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
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

            {/* Stores List */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-admin-text flex items-center gap-2">
                <Store className="h-4 w-4 text-admin-accent" />
                Stores ({m.stores?.length || 0})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {m.stores?.map((s) => (
                  <div key={s.id} className="admin-panel p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-admin-text">{s.name}</h3>
                      <StatusBadge status={s.status} category="store" />
                    </div>

                    <p className="text-xs text-admin-muted font-mono">{s.slug}</p>

                    <div className="grid grid-cols-3 gap-2 text-xs text-center pt-2 border-t border-admin-border/60">
                      <div className="rounded bg-admin-raised p-2">
                        <span className="block font-bold text-admin-text text-sm">{s._count?.orders ?? 0}</span>
                        <span className="text-admin-muted text-[10px]">Orders</span>
                      </div>
                      <div className="rounded bg-admin-raised p-2">
                        <span className="block font-bold text-admin-text text-sm">{s._count?.products ?? 0}</span>
                        <span className="text-admin-muted text-[10px]">Products</span>
                      </div>
                      <div className="rounded bg-admin-raised p-2">
                        <span className="block font-bold text-admin-text text-sm">{s._count?.customers ?? 0}</span>
                        <span className="text-admin-muted text-[10px]">Customers</span>
                      </div>
                    </div>

                    {s.slug && s.status !== 'SUSPENDED' && s.status !== 'ARCHIVED' && (
                      <div className="pt-2 flex justify-end">
                        <a
                          href={`${getStorefrontUrl()}/store/${s.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Storefront
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Communication History Section */}
            <div className="admin-panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-admin-text flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-admin-accent" />
                  Communication History
                </h2>
                <button
                  type="button"
                  onClick={() => setMessageOpen(true)}
                  className="text-xs text-admin-accent font-medium hover:underline"
                >
                  + New Message
                </button>
              </div>

              <div className="overflow-x-auto admin-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Channel</th>
                      <th className="px-4 py-2.5">Subject / Action</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/60">
                    {m.communicationHistory && m.communicationHistory.length > 0 ? (
                      m.communicationHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-admin-raised/40 transition-colors">
                          <td className="px-4 py-2.5 text-admin-muted whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-admin-text">
                            {item.channel}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-admin-text block">{item.subject}</span>
                            {item.message && (
                              <span className="text-admin-muted line-clamp-1 text-[11px] font-mono mt-0.5">
                                {item.message}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
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
                          <td className="px-4 py-2.5 text-admin-muted">{item.adminName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-admin-muted">
                          No communication history recorded yet for this merchant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subscriptions & Invoices Side-by-side or stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Subscription History */}
              <div className="admin-panel p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-admin-text flex items-center gap-2">
                    <Clock className="h-4 w-4 text-admin-accent" />
                    Subscription History
                  </h2>
                  <Link
                    href={`/billing?tenantId=${m.id}`}
                    className="text-xs text-admin-accent hover:underline"
                  >
                    Manage Billing
                  </Link>
                </div>

                <div className="overflow-x-auto admin-scrollbar max-h-60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Start</th>
                        <th className="px-3 py-2">Valid Until</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border/60">
                      {m.subscriptions && m.subscriptions.length > 0 ? (
                        m.subscriptions.map((s) => (
                          <tr key={s.id} className="hover:bg-admin-raised/40">
                            <td className="px-3 py-2 font-medium text-admin-text">{s.plan.name}</td>
                            <td className="px-3 py-2">
                              <StatusBadge status={s.status} category="subscription" />
                            </td>
                            <td className="px-3 py-2 text-admin-muted">
                              {new Date(s.currentPeriodStart).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 text-admin-muted">
                              {new Date(s.currentPeriodEnd).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-admin-muted">
                            No subscription history.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice History */}
              <div className="admin-panel p-5 space-y-3">
                <h2 className="text-base font-semibold text-admin-text flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-admin-accent" />
                  Invoice History
                </h2>

                <div className="overflow-x-auto admin-scrollbar max-h-60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-admin-raised text-admin-secondary uppercase tracking-wider font-semibold border-b border-admin-border sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Invoice #</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border/60">
                      {m.paymentHistory && m.paymentHistory.length > 0 ? (
                        m.paymentHistory.map((i) => (
                          <tr key={i.id} className="hover:bg-admin-raised/40">
                            <td className="px-3 py-2 font-mono text-admin-text">{i.invoiceNumber}</td>
                            <td className="px-3 py-2 font-semibold tabular-nums text-admin-text">
                              {formatPaise(i.amountPaise)}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={i.status} category="payment" />
                            </td>
                            <td className="px-3 py-2 text-admin-muted">
                              {new Date(i.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-admin-muted">
                            No recorded invoices.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Modals */}
      {m && messageOpen && (
        <SendMessageModal
          merchantId={m.id}
          merchantName={primaryStore?.name || m.name}
          recipientEmail={owner?.email}
          recipientPhone={owner?.phone}
          onClose={() => setMessageOpen(false)}
          onSuccess={() => reload()}
        />
      )}

      {m && suspendOpen && (
        <SuspendMerchantModal
          merchantId={m.id}
          merchantName={primaryStore?.name || m.name}
          recipientEmail={owner?.email}
          recipientPhone={owner?.phone}
          stores={m.stores?.map((s) => ({ id: s.id, name: s.name }))}
          onClose={() => setSuspendOpen(false)}
          onSuccess={() => reload()}
        />
      )}

      {m && reactivateOpen && (
        <ReactivateMerchantModal
          merchantId={m.id}
          merchantName={primaryStore?.name || m.name}
          recipientEmail={owner?.email}
          recipientPhone={owner?.phone}
          onClose={() => setReactivateOpen(false)}
          onSuccess={() => reload()}
        />
      )}

      {m && archiveOpen && (
        <ArchiveMerchantModal
          merchantId={m.id}
          merchantName={primaryStore?.name || m.name}
          recipientEmail={owner?.email}
          recipientPhone={owner?.phone}
          onClose={() => setArchiveOpen(false)}
          onSuccess={() => reload()}
        />
      )}
    </AdminLayout>
  );
}

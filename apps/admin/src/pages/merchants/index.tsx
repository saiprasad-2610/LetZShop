import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Store, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink, 
  X, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Package,
  ShoppingBag,
  Palette,
  FileText,
  Clock,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { formatPaise } from '@simply/ui';
import { getStorefrontUrl } from '../../utils/config';

export default function AdminMerchantsPage() {
  const { api } = useAdminAuth();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Detailed View
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [merchantDetails, setMerchantDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState<'store' | 'plan' | 'payments' | 'audits'>('store');

  // Action Modals (Suspend / Reactivate)
  const [actionModal, setActionModal] = useState<{
    merchant: any;
    action: 'suspend' | 'reactivate';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const res = await api.admin.getMerchants(searchTerm || undefined);
      setMerchants(res || []);
    } catch (err) {
      console.error('Failed to load merchants', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    setLoadingDetails(true);
    setDetailTab('store');
    try {
      const res = await api.admin.getMerchant(merchantId);
      setMerchantDetails(res || null);
    } catch (err) {
      console.error('Failed to load merchant details:', err);
      alert('Could not load detailed merchant profile.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedMerchantId(null);
    setMerchantDetails(null);
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    if (actionModal.action === 'suspend' && !actionReason.trim()) {
      alert('Please provide an audit reason for suspending this merchant.');
      return;
    }

    setProcessingAction(true);
    try {
      if (actionModal.action === 'suspend') {
        await api.admin.suspendMerchant(actionModal.merchant.id, actionReason);
        alert(`Merchant "${actionModal.merchant.name}" has been suspended.`);
      } else {
        await api.admin.reactivateMerchant(actionModal.merchant.id, actionReason || 'Reactivated by Platform Admin');
        alert(`Merchant "${actionModal.merchant.name}" has been reactivated.`);
      }

      setActionModal(null);
      setActionReason('');
      await loadMerchants();

      // Refresh details modal if open
      if (selectedMerchantId && selectedMerchantId === actionModal.merchant.id) {
        handleOpenDetails(selectedMerchantId);
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredMerchants = merchants.filter((m) => {
    if (statusFilter === 'ACTIVE') return m.status === 'ACTIVE';
    if (statusFilter === 'SUSPENDED') return m.status === 'SUSPENDED';
    return true;
  });

  const paginatedMerchants = filteredMerchants.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredMerchants.length / pageSize) || 1;

  return (
    <AdminLayout>
      <Head>
        <title>Merchants & Tenants Governance | ShopOnGo Platform Admin</title>
      </Head>

      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merchant Governance</h1>
            <p className="text-xs text-slate-500 mt-1">
              Audit merchant businesses, enforce compliance, inspect subscription plans, and manage store operational statuses
            </p>
          </div>

          <button
            onClick={loadMerchants}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status filter buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {status === 'ALL' ? 'All Merchants' : status === 'ACTIVE' ? 'Active' : 'Suspended'}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="flex gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by merchant name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadMerchants()}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
              />
            </div>
            <button
              onClick={loadMerchants}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Merchants Table */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 text-xs">
            <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block mr-2" />
            Loading merchant directories...
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center text-slate-500 text-xs">
            No merchants found matching your query.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Merchant / Business</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4">Storefront Slug</th>
                    <th className="py-3 px-4">Owner Contact</th>
                    <th className="py-3 px-4">Active Plan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Audited Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMerchants.map((m) => {
                    const store = m.store || m.stores?.[0];
                    const sub = m.subscription;
                    const isSuspended = m.status === 'SUSPENDED' || store?.status === 'SUSPENDED';
                    const joiningDate = m.createdAt ? new Date(m.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

                    return (
                      <tr 
                        key={m.id} 
                        className="hover:bg-slate-50/70 transition cursor-pointer group"
                        onClick={() => handleOpenDetails(m.id)}
                      >
                        {/* Name */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-slate-700 font-bold text-xs flex items-center justify-center transition">
                              {m.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-emerald-700 block transition">
                                {m.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                id: {m.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Joining Date */}
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{joiningDate}</span>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {store?.slug ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                              /store/{store.slug}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Owner Phone */}
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{m.owner?.phone || m.owner?.email || '—'}</span>
                          </div>
                        </td>

                        {/* Subscription */}
                        <td className="py-3.5 px-4 font-semibold">
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <CreditCard className="w-3 h-3" />
                            <span>{sub?.plan?.name || 'Growth Plan'}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              <ShieldAlert className="w-3 h-3" /> Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              <ShieldCheck className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details Button */}
                            <button
                              onClick={() => handleOpenDetails(m.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title="View Full Merchant Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>

                            {/* Storefront Link */}
                            {store?.slug && (
                              <a
                                href={`${getStorefrontUrl()}/store/${store.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                title="Open Live Storefront"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Suspend / Reactivate */}
                            {isSuspended ? (
                              <button
                                onClick={() => setActionModal({ merchant: m, action: 'reactivate' })}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg transition cursor-pointer text-[11px]"
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => setActionModal({ merchant: m, action: 'suspend' })}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold rounded-lg transition cursor-pointer text-[11px]"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page {currentPage} of {totalPages} ({filteredMerchants.length} total merchants)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* COMPREHENSIVE MERCHANT DETAILS DRAWER / MODAL                   */}
        {/* ============================================================== */}
        {selectedMerchantId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
              
              {loadingDetails || !merchantDetails ? (
                <div className="p-24 text-center text-slate-400 text-xs">
                  <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block mb-3" />
                  <p>Fetching full merchant telemetry, plan history, and store assets...</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  {(() => {
                    const primaryStore = merchantDetails.stores?.[0];
                    const activeSub = merchantDetails.subscriptions?.[0];
                    const owner = merchantDetails.memberships?.[0]?.user;
                    const isSuspended = merchantDetails.status === 'SUSPENDED';
                    const joiningDateFormatted = new Date(merchantDetails.createdAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });

                    return (
                      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-t-3xl">
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                              {merchantDetails.name}
                            </h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isSuspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {merchantDetails.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Joined: <strong className="text-slate-700">{joiningDateFormatted}</strong></span>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              Tenant ID: {merchantDetails.id}
                            </span>
                          </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {isSuspended ? (
                            <button
                              onClick={() => setActionModal({ merchant: merchantDetails, action: 'reactivate' })}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                            >
                              Activate Merchant
                            </button>
                          ) : (
                            <button
                              onClick={() => setActionModal({ merchant: merchantDetails, action: 'suspend' })}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Deactivate / Suspend
                            </button>
                          )}

                          <button
                            onClick={handleCloseDetails}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4 Summary Metric Cards */}
                  {(() => {
                    const primaryStore = merchantDetails.stores?.[0];
                    const activeSub = merchantDetails.subscriptions?.[0];
                    const owner = merchantDetails.memberships?.[0]?.user;

                    return (
                      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
                        {/* Current Plan */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Plan</span>
                          <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            <span>{activeSub?.plan?.name || 'Growth Plan'}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 block">
                            {formatPaise(activeSub?.plan?.pricePaise || 99900)}/mo
                          </span>
                        </div>

                        {/* Listed Products */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Catalog Size</span>
                          <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-emerald-600" />
                            <span>{primaryStore?._count?.products || 0} Products</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block">In active inventory</span>
                        </div>

                        {/* Fulfilled Orders */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Orders Processed</span>
                          <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4 text-blue-600" />
                            <span>{primaryStore?._count?.orders || 0} Orders</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block">Buyer fulfillment</span>
                        </div>

                        {/* Owner Contact */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Owner</span>
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {owner?.fullName || 'Merchant Seller'}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 block truncate">
                            {owner?.phone || owner?.email || '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Navigation Tabs */}
                  <div className="px-6 border-b border-slate-200 flex items-center gap-6 bg-slate-50/50 text-xs font-bold">
                    <button
                      onClick={() => setDetailTab('store')}
                      className={`py-3 border-b-2 transition cursor-pointer ${
                        detailTab === 'store'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Storefront & Branding
                    </button>
                    <button
                      onClick={() => setDetailTab('plan')}
                      className={`py-3 border-b-2 transition cursor-pointer ${
                        detailTab === 'plan'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Plan & Limits
                    </button>
                    <button
                      onClick={() => setDetailTab('payments')}
                      className={`py-3 border-b-2 transition cursor-pointer ${
                        detailTab === 'payments'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Payment History & Invoices
                    </button>
                    <button
                      onClick={() => setDetailTab('audits')}
                      className={`py-3 border-b-2 transition cursor-pointer ${
                        detailTab === 'audits'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Audit Trail
                    </button>
                  </div>

                  {/* Tab Body Content */}
                  <div className="p-6 flex-1 space-y-6">
                    {/* -------------------------------------------------------- */}
                    {/* TAB 1: Storefront & Branding                             */}
                    {/* -------------------------------------------------------- */}
                    {detailTab === 'store' && (() => {
                      const primaryStore = merchantDetails.stores?.[0];
                      const branding = primaryStore?.branding;
                      const activeTheme = primaryStore?.themeConfigs?.[0]?.theme;

                      return (
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Public Storefront Endpoint</span>
                              {primaryStore?.slug && (
                                <a
                                  href={`${getStorefrontUrl()}/store/${primaryStore.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                >
                                  <span>Visit Storefront</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>

                            <div className="font-mono text-sm bg-white p-3 rounded-xl border border-slate-200 text-slate-800 flex items-center justify-between">
                              <span>{getStorefrontUrl()}/store/{primaryStore?.slug || '—'}</span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                {primaryStore?.status || 'LIVE'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Branding Info */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-indigo-600" />
                                <span>Theme Archetype & Styling</span>
                              </h4>
                              <p className="text-xs text-slate-600">
                                Active Theme: <strong>{activeTheme?.name || 'Aura / Foundational'}</strong> ({activeTheme?.code || 'aura'})
                              </p>
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                                <span>Brand Colors:</span>
                                <span 
                                  className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                                  style={{ backgroundColor: branding?.primaryColor || '#1E40AF' }}
                                  title={`Primary: ${branding?.primaryColor}`}
                                />
                                <span 
                                  className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                                  style={{ backgroundColor: branding?.accentColor || '#F59E0B' }}
                                  title={`Accent: ${branding?.accentColor}`}
                                />
                                <span className="text-[10px] font-mono text-slate-400">
                                  {branding?.fontHeading || 'Playfair Display'}
                                </span>
                              </div>
                            </div>

                            {/* Catalog Summary */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-emerald-600" />
                                <span>Engagement Metrics</span>
                              </h4>
                              <div className="space-y-1 text-xs text-slate-600">
                                <div className="flex justify-between">
                                  <span>Total Registered Customers:</span>
                                  <strong className="text-slate-900">{primaryStore?._count?.customers || 0}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Inquiries & B2B Leads:</span>
                                  <strong className="text-slate-900">{primaryStore?._count?.enquiries || 0}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* -------------------------------------------------------- */}
                    {/* TAB 2: Plan & Feature Limits                             */}
                    {/* -------------------------------------------------------- */}
                    {detailTab === 'plan' && (() => {
                      const activeSub = merchantDetails.subscriptions?.[0];
                      const plan = activeSub?.plan;
                      const startDate = activeSub?.currentPeriodStart 
                        ? new Date(activeSub.currentPeriodStart).toLocaleDateString() 
                        : '—';
                      const endDate = activeSub?.currentPeriodEnd 
                        ? new Date(activeSub.currentPeriodEnd).toLocaleDateString() 
                        : '—';

                      return (
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-black text-slate-900">
                                  {plan?.name || 'Growth Plan'} Tier
                                </h3>
                                <span className="text-[10px] font-mono text-slate-500">
                                  CODE: {plan?.code || 'GROWTH_MONTHLY'}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-xl font-black font-mono text-slate-900">
                                  {formatPaise(plan?.pricePaise || 99900)}
                                </span>
                                <span className="text-xs text-slate-400 block">/{plan?.billingCycle?.toLowerCase() || 'month'}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs text-slate-600">
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Cycle Started</span>
                                <strong className="text-slate-800">{startDate}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid Through / Expiry</span>
                                <strong className="text-slate-800">{endDate}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Limits Table */}
                          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                            <h4 className="text-xs font-bold text-slate-800">Plan Enforced Quotas & Capabilities</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Max Products</span>
                                <strong className="text-sm font-mono text-slate-900">{plan?.maxProducts ?? 50}</strong>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Staff Seats</span>
                                <strong className="text-sm font-mono text-slate-900">{plan?.maxStaff ?? 2}</strong>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Storage Cap</span>
                                <strong className="text-sm font-mono text-slate-900">
                                  {(plan?.maxStorageMb ?? 1024) >= 1024 ? `${(plan?.maxStorageMb ?? 1024) / 1024} GB` : `${plan?.maxStorageMb} MB`}
                                </strong>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Custom Domain</span>
                                <strong className={`text-sm ${plan?.customDomainAllowed ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {plan?.customDomainAllowed ? 'Enabled' : 'Disabled'}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* -------------------------------------------------------- */}
                    {/* TAB 3: Payment History & Invoices                        */}
                    {/* -------------------------------------------------------- */}
                    {detailTab === 'payments' && (() => {
                      const payments = merchantDetails.paymentHistory || [];

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800">
                              Subscription Transactions & Invoicing Ledger
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              {payments.length} transaction record(s)
                            </span>
                          </div>

                          {payments.length === 0 ? (
                            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                              No payment transactions recorded for this tenant yet.
                            </div>
                          ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                                  <tr>
                                    <th className="py-2.5 px-4">Invoice #</th>
                                    <th className="py-2.5 px-4">Billing Date</th>
                                    <th className="py-2.5 px-4">Subscribed Plan</th>
                                    <th className="py-2.5 px-4">Payment Method</th>
                                    <th className="py-2.5 px-4">Status</th>
                                    <th className="py-2.5 px-4 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {payments.map((inv: any, idx: number) => {
                                    const dateFormatted = new Date(inv.paidAt || inv.createdAt).toLocaleDateString(undefined, {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    });

                                    return (
                                      <tr key={inv.id || idx} className="hover:bg-slate-50/50 transition">
                                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                          {inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                          {dateFormatted}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-slate-800">
                                          {inv.planName || 'Growth Plan'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono">
                                            {inv.paymentMethod || 'RAZORPAY_UPI'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                            {inv.status || 'PAID'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                                          {formatPaise(inv.amountPaise || 99900)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* -------------------------------------------------------- */}
                    {/* TAB 4: Audit & Compliance Trail                          */}
                    {/* -------------------------------------------------------- */}
                    {detailTab === 'audits' && (() => {
                      const audits = merchantDetails.auditLogs || [];

                      return (
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-slate-800">Tenant Governance Audit Trail</h3>
                          {audits.length === 0 ? (
                            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                              No recent compliance audit logs for this merchant.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {audits.map((a: any) => (
                                <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-slate-900 block">{a.action}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Actor ID: {a.actorId || 'SYSTEM'}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {new Date(a.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
                    <span className="text-[11px] text-slate-400">
                      Merchant Status: <strong className={merchantDetails.status === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'}>{merchantDetails.status}</strong>
                    </span>

                    <button
                      onClick={handleCloseDetails}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Close Details
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUSPEND / REACTIVATE ACTION MODAL DIALOG                        */}
        {/* ============================================================== */}
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {actionModal.action === 'suspend' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                  <h3 className="text-base font-bold text-slate-900">
                    {actionModal.action === 'suspend' ? 'Suspend Merchant Access' : 'Reactivate Merchant'}
                  </h3>
                </div>
                <button
                  onClick={() => setActionModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {actionModal.action === 'suspend' ? (
                  <>
                    Are you sure you want to suspend <strong>"{actionModal.merchant.name}"</strong>? This will immediately switch their public storefront to maintenance/suspended status and prevent customers from placing orders.
                  </>
                ) : (
                  <>
                    Are you sure you want to reactivate <strong>"{actionModal.merchant.name}"</strong>? This will immediately restore public storefront visibility and seller portal access.
                  </>
                )}
              </p>

              <form onSubmit={handleActionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandatory Audited Reason *
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      actionModal.action === 'suspend'
                        ? 'e.g., Compliance audit violation, dispute request...'
                        : 'e.g., Compliance resolved, identity verified...'
                    }
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    required={actionModal.action === 'suspend'}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={processingAction}
                    className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition disabled:opacity-60 cursor-pointer ${
                      actionModal.action === 'suspend'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {processingAction
                      ? 'Processing...'
                      : actionModal.action === 'suspend'
                      ? 'Confirm Suspension'
                      : 'Confirm Activation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

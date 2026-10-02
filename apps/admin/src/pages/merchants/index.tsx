import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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
  Calendar
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { createApiClient } from '@simply/api-contracts';

const api = createApiClient();

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const paginatedMerchants = merchants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Modals
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
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

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    if (actionModal.action === 'suspend' && !actionReason.trim()) {
      alert('Please provide a mandatory audit reason for suspending a merchant');
      return;
    }

    setProcessingAction(true);
    try {
      if (actionModal.action === 'suspend') {
        await api.admin.suspendMerchant(actionModal.merchant.id, actionReason);
        alert(`Merchant "${actionModal.merchant.name}" has been suspended.`);
      } else {
        await api.admin.reactivateMerchant(actionModal.merchant.id, actionReason || 'Reactivated by Admin');
        alert(`Merchant "${actionModal.merchant.name}" has been reactivated.`);
      }
      setActionModal(null);
      setActionReason('');
      loadMerchants();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Merchants & Tenants | Simply Platform Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merchant Governance</h1>
            <p className="text-xs text-slate-500 mt-1">
              Audit merchant businesses, enforce compliance, and manage store operational statuses
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by merchant name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
          <button
            onClick={loadMerchants}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            Filter
          </button>
        </div>

        {/* Merchants Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading merchants...</div>
        ) : merchants.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 text-xs">
            No merchants found matching your query.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Merchant / Business</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Storefront Slug</th>
                  <th className="py-3 px-4">Owner Phone</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Audited Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMerchants.map((m) => {
                  const store = m.stores?.[0];
                  const sub = m.subscription;
                  const isSuspended = m.status === 'SUSPENDED' || store?.status === 'SUSPENDED';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {m.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {store?.category || 'General'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        /{store?.slug || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {m.owner?.phone || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {sub?.plan?.name || 'Growth'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            <ShieldAlert className="w-3 h-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            <ShieldCheck className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {store?.slug && (
                            <a
                              href={`http://localhost:3000/store/${store.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition"
                              title="Visit Public Storefront"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {isSuspended ? (
                            <button
                              onClick={() => setActionModal({ merchant: m, action: 'reactivate' })}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg transition"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => setActionModal({ merchant: m, action: 'suspend' })}
                              className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded-lg transition"
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

            {/* Pagination Controls */}
            {merchants.length > pageSize && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * pageSize, merchants.length)}</strong> of{' '}
                  <strong>{merchants.length}</strong> merchants
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-slate-300 rounded-lg bg-white font-medium hover:bg-slate-100 disabled:opacity-50 transition"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-slate-700">
                    Page {currentPage} of {Math.ceil(merchants.length / pageSize)}
                  </span>
                  <button
                    disabled={currentPage >= Math.ceil(merchants.length / pageSize)}
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(merchants.length / pageSize), p + 1))}
                    className="px-3 py-1 border border-slate-300 rounded-lg bg-white font-medium hover:bg-slate-100 disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: Suspend or Reactivate */}
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  {actionModal.action === 'suspend' ? 'Suspend Merchant Access' : 'Reactivate Merchant Access'}
                </h3>
                <button
                  onClick={() => setActionModal(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <p>
                  Merchant: <strong className="text-slate-900">{actionModal.merchant.name}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  {actionModal.action === 'suspend'
                    ? 'Suspending a merchant immediately blocks their public storefront, halts checkout transactions, and restricts seller portal access.'
                    : 'Reactivating restores the merchant store and unblocks public commerce capabilities.'}
                </p>
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Audited Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter compliance rationale, fraud prevention alert, or review note..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingAction}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg text-white ${
                      actionModal.action === 'suspend'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {processingAction
                      ? 'Processing...'
                      : actionModal.action === 'suspend'
                      ? 'Confirm Suspension'
                      : 'Confirm Reactivation'}
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

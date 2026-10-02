import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  ShoppingBag,
  Search,
  Filter,
  MessageSquare,
  RotateCcw,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ExternalLink,
  Send,
  X,
  Phone,
  Eye,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { OrderDetailsDrawer } from '../components/OrderDetailsDrawer';
import { TableSkeleton } from '../components/ui/Skeletons';
import { EmptyState } from '../components/ui/EmptyState';
import { formatPaise, parseRupeesToPaise, ORDER_STATUS_MAP } from '@simply/ui';

export default function OrdersPage() {
  const { api } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'enquiries' | 'returns'>('orders');
  const [loading, setLoading] = useState(true);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Enquiries State
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [quotationModalEnquiry, setQuotationModalEnquiry] = useState<any | null>(null);
  const [quotationRupees, setQuotationRupees] = useState('');
  const [quotationNotes, setQuotationNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    if (router.query.tab === 'enquiries') {
      setActiveTab('enquiries');
    }
  }, [router.query]);

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const res = await api.orders.getOrders({ status: statusFilter || undefined });
        setOrders(res?.items || res || []);
      } else if (activeTab === 'enquiries') {
        const res = await api.enquiries.getEnquiries();
        setEnquiries(res || []);
      } else if (activeTab === 'returns') {
        const res = await api.orders.getOrders({ status: 'CANCELLED' });
        setOrders(res?.items || res || []);
      }
    } catch (err) {
      console.error('Failed to load orders/enquiries', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationModalEnquiry || !quotationRupees) return;
    setSubmittingQuote(true);
    try {
      const paise = parseRupeesToPaise(Number(quotationRupees));
      await api.enquiries.respond(quotationModalEnquiry.id, {
        quotationAmountPaise: paise,
        notes: quotationNotes,
        status: 'QUOTED',
      });
      setQuotationModalEnquiry(null);
      setQuotationRupees('');
      setQuotationNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit quotation');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const meta = ORDER_STATUS_MAP[status] || {
      label: status,
      bgClass: 'bg-slate-100 border border-slate-200',
      textClass: 'text-slate-800',
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${meta.bgClass} ${meta.textClass}`}
      >
        {meta.label}
      </span>
    );
  };

  return (
    <Layout title="Orders & Enquiries">
      <Head>
        <title>Orders & Fulfillment | Simply Seller</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Commerce & Fulfillment
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Track customer orders, handle customized B2B quotations, and manage fulfillment workflow
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-1">
          <button
            onClick={() => {
              setActiveTab('orders');
              setStatusFilter('');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Customer Orders
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'enquiries'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            B2B Enquiries & RFQs
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'returns'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Cancellations & Returns
          </button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: '', label: 'All Orders' },
                { key: 'NEW', label: 'New' },
                { key: 'PAID', label: 'Paid' },
                { key: 'PROCESSING', label: 'Processing' },
                { key: 'READY', label: 'Ready' },
                { key: 'SHIPPED', label: 'Shipped' },
                { key: 'DELIVERED', label: 'Delivered' },
                { key: 'CANCELLED', label: 'Cancelled' },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    statusFilter === st.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {loading ? (
              <TableSkeleton columns={6} rows={4} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders found"
                description={
                  statusFilter
                    ? `No orders currently match status "${statusFilter}".`
                    : 'Customer orders will appear here as buyers checkout from your storefront.'
                }
              />
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Order Number</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Items Summary</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Order Status</th>
                        <th className="py-3 px-4 text-right">View / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((o) => {
                        const itemsCount = o.items?.length || 0;
                        const firstItemName =
                          o.items?.[0]?.titleSnapshot || o.items?.[0]?.productName || 'Order item';

                        return (
                          <tr
                            key={o.id}
                            onClick={() => setSelectedOrder(o)}
                            className="hover:bg-slate-50/80 transition cursor-pointer"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              #{o.orderNumber}
                            </td>

                            <td className="py-3.5 px-4 text-slate-700">
                              <div className="font-semibold text-slate-900">
                                {o.customerName || 'Guest Customer'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {o.customerPhone || '—'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600">
                              <span className="font-medium text-slate-800">{firstItemName}</span>
                              {itemsCount > 1 && (
                                <span className="text-[11px] text-slate-400 block">
                                  +{itemsCount - 1} more items
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                              {formatPaise(o.totalAmountPaise || o.totalPaise)}
                            </td>

                            <td className="py-3.5 px-4">{getStatusBadge(o.status)}</td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(o);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: B2B ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Inquiries and Request-for-Quote submissions from wholesale buyers and businesses
            </p>

            {loading ? (
              <TableSkeleton columns={5} rows={3} />
            ) : enquiries.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No active enquiries"
                description="B2B quotations and product requests submitted by buyers will be listed here."
              />
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Prospective Buyer</th>
                      <th className="py-3 px-4">Product Requested</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{enq.customerName}</p>
                          <p className="text-slate-400 text-[11px] font-mono">{enq.customerPhone}</p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {enq.product?.title || enq.product?.name || 'Inquired Product'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {enq.quantity || 1} units
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              enq.status === 'QUOTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {enq.status || 'NEW'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setQuotationModalEnquiry(enq)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
                          >
                            Send Quotation
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RETURNS */}
        {activeTab === 'returns' && (
          <div className="space-y-4">
            {loading ? (
              <TableSkeleton columns={5} rows={2} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={RotateCcw}
                title="No cancellations or returns"
                description="Cancelled orders and customer return requests will be archived here."
              />
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          #{o.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{o.customerName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatPaise(o.totalAmountPaise || o.totalPaise)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            Cancelled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdated={loadData}
      />

      {/* Quotation Submission Modal */}
      {quotationModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSendQuotation}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200"
          >
            <h3 className="font-bold text-slate-900 text-sm">Send B2B Price Quotation</h3>
            <p className="text-xs text-slate-500">
              For {quotationModalEnquiry.customerName} ({quotationModalEnquiry.quantity || 1} units)
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Commercial Total Quote (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={quotationRupees}
                  onChange={(e) => setQuotationRupees(e.target.value)}
                  placeholder="e.g. 75000"
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quotation Terms & Notes
              </label>
              <textarea
                rows={3}
                value={quotationNotes}
                onChange={(e) => setQuotationNotes(e.target.value)}
                placeholder="Includes GST and 14-day lead time delivery..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuotationModalEnquiry(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingQuote}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {submittingQuote ? 'Sending...' : 'Send Quotation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}

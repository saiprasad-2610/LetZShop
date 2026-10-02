import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Store 
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { createApiClient } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';

const api = createApiClient();

export default function AdminCommercePage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    loadCommerce();
  }, []);

  const loadCommerce = async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const res = await api.admin.getCommerce();
      setData(res);
    } catch (err) {
      console.error('Failed to load commerce telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  const orders = data?.recentOrders || [];
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <AdminLayout>
      <Head>
        <title>Commerce Telemetry | Simply Platform Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cross-Tenant Commerce Telemetry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global view of transactions, fulfillment velocity, and gateway payment settlement
          </p>
        </div>

        {/* Global Orders Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" /> Platform Transaction Stream
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Live updates across all stores
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No orders logged on the platform yet.
            </div>
          ) : (
            <>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Merchant Store</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Fulfillment</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {paginatedOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        #{o.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-700">
                        {o.store?.name || 'Store'}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600">
                        {o.customerName || 'Guest'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatPaise(o.totalAmountPaise)}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                          {o.paymentStatus || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-sans">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {orders.length > pageSize && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-sans">
                  <span>
                    Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * pageSize, orders.length)}</strong> of{' '}
                    <strong>{orders.length}</strong> orders
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
                      Page {currentPage} of {Math.ceil(orders.length / pageSize)}
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(orders.length / pageSize)}
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(orders.length / pageSize), p + 1))}
                      className="px-3 py-1 border border-slate-300 rounded-lg bg-white font-medium hover:bg-slate-100 disabled:opacity-50 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  ShoppingBag, 
  MessageSquare, 
  Calendar,
  X,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { formatPaise } from '@simply/ui';

export default function CustomersPage() {
  const { api } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.customers.getCustomers();
      setCustomers(res || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q);
  });

  const getWhatsAppLink = (phone: string, name?: string) => {
    const clean = phone.replace(/[^0-9]/g, '').replace(/^91/, '');
    const text = encodeURIComponent(`Hello ${name || 'Valued Customer'}, greeting from our store!`);
    return `https://wa.me/91${clean}?text=${text}`;
  };

  return (
    <Layout>
      <Head>
        <title>Customer Directory | Simply Seller</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Directory</h1>
            <p className="text-sm text-gray-500">
              Relationship management, order history, and direct customer communication
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Customer Table */}
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading customer relationships...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-gray-800">No customers found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              As guests and buyers place orders or submit enquiries, your client database grows automatically.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Lifetime Value</th>
                  <th className="py-3 px-4">Last Order</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{c.name || 'Guest Buyer'}</div>
                        <div className="text-xs text-gray-400">Customer #{c.id.substring(0, 8)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-mono text-gray-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone || '-'}
                        </div>
                        {c.email && (
                          <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" /> {c.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                          <ShoppingBag className="w-3 h-3 text-gray-500" />
                          {c.totalOrders ?? c.orders?.length ?? 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {formatPaise(c.totalSpentPaise ?? 0)}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {c.lastOrderAt ? (
                          new Date(c.lastOrderAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.phone && (
                            <a
                              href={getWhatsAppLink(c.phone, c.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Customer Detail Drawer */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedCustomer.name || 'Customer Details'}
                  </h2>
                  <p className="text-xs text-gray-500">Customer Relationship Record</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Card */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">Contact Info</span>
                    {selectedCustomer.phone && (
                      <a
                        href={getWhatsAppLink(selectedCustomer.phone, selectedCustomer.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#25D366]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-xs font-mono text-gray-700">{selectedCustomer.phone}</p>
                  {selectedCustomer.email && <p className="text-xs text-gray-500">{selectedCustomer.email}</p>}
                </div>

                {/* Lifetime Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                    <span className="text-xs font-semibold text-emerald-800">Total Spend</span>
                    <p className="text-lg font-bold font-mono text-emerald-950 mt-1">
                      {formatPaise(selectedCustomer.totalSpentPaise ?? 0)}
                    </p>
                  </div>
                  <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                    <span className="text-xs font-semibold text-blue-800">Total Orders</span>
                    <p className="text-lg font-bold font-mono text-blue-950 mt-1">
                      {selectedCustomer.totalOrders ?? selectedCustomer.orders?.length ?? 1}
                    </p>
                  </div>
                </div>

                {/* Orders History */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Recent Orders
                  </h3>
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                      {selectedCustomer.orders.map((o: any) => (
                        <div key={o.id} className="p-3 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold text-gray-900">#{o.orderNumber}</span>
                            <span className="ml-2 text-gray-400">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="font-mono font-semibold text-gray-900">
                            {formatPaise(o.totalAmountPaise)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No historical orders logged</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

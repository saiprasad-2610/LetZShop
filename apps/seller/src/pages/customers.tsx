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
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--merchant-text)' }}>
              Customer Directory
            </h1>
            <p className="text-sm" style={{ color: 'var(--merchant-text-muted)' }}>
              Relationship management, order history, and direct customer communication
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--merchant-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by customer name, mobile, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              backgroundColor: 'var(--merchant-input-bg)',
              borderColor: 'var(--merchant-input-border)',
              color: 'var(--merchant-text)',
            }}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--merchant-focus-ring)]"
          />
        </div>

        {/* Customer Table */}
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--merchant-text-muted)' }}>
            Loading customer relationships...
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="border border-dashed rounded-xl p-12 text-center space-y-3"
            style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
          >
            <Users className="w-12 h-12 mx-auto opacity-30" style={{ color: 'var(--merchant-text-muted)' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--merchant-text)' }}>
              No customers found
            </h3>
            <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--merchant-text-muted)' }}>
              As guests and buyers place orders or submit enquiries, your client database grows automatically.
            </p>
          </div>
        ) : (
          <div
            className="border rounded-xl shadow-xs overflow-hidden"
            style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
          >
            <table className="w-full text-left text-sm">
              <thead
                className="border-b text-xs font-semibold uppercase tracking-wider"
                style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text-muted)' }}
              >
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Lifetime Value</th>
                  <th className="py-3 px-4">Last Order</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--merchant-border)' }}>
                {filtered.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-[var(--merchant-surface-raised)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold" style={{ color: 'var(--merchant-text)' }}>
                          {c.name || 'Guest Buyer'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--merchant-text-muted)' }}>
                          Customer #{c.id.substring(0, 8)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-mono flex items-center gap-1.5" style={{ color: 'var(--merchant-text-secondary)' }}>
                          <Phone className="w-3.5 h-3.5 opacity-60" /> {c.phone || '-'}
                        </div>
                        {c.email && (
                          <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--merchant-text-muted)' }}>
                            <Mail className="w-3.5 h-3.5 opacity-60" /> {c.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                          style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text)' }}
                        >
                          <ShoppingBag className="w-3 h-3 opacity-60" />
                          {c.totalOrders ?? c.orders?.length ?? 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold" style={{ color: 'var(--merchant-text)' }}>
                        {formatPaise(c.totalSpentPaise ?? 0)}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--merchant-text-muted)' }}>
                        {c.lastOrderAt ? (
                          new Date(c.lastOrderAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        ) : (
                          <span>-</span>
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
                            style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text)' }}
                            className="px-3 py-1 text-xs font-medium rounded-lg border hover:opacity-90 transition"
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
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            <div
              className="w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200 border-l"
              style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text)' }}
            >
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)' }}
              >
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--merchant-text)' }}>
                    {selectedCustomer.name || 'Customer Details'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--merchant-text-muted)' }}>Customer Relationship Record</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 opacity-60 hover:opacity-100 rounded-lg transition"
                  style={{ color: 'var(--merchant-text)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Card */}
                <div
                  className="p-4 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase" style={{ color: 'var(--merchant-text-muted)' }}>Contact Info</span>
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
                  <p className="text-sm font-semibold" style={{ color: 'var(--merchant-text)' }}>{selectedCustomer.name}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--merchant-text-secondary)' }}>{selectedCustomer.phone}</p>
                  {selectedCustomer.email && <p className="text-xs" style={{ color: 'var(--merchant-text-muted)' }}>{selectedCustomer.email}</p>}
                </div>

                {/* Lifetime Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3.5 rounded-xl border"
                    style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)' }}
                  >
                    <span className="text-xs font-semibold text-emerald-400">Total Spend</span>
                    <p className="text-lg font-bold font-mono mt-1" style={{ color: 'var(--merchant-text)' }}>
                      {formatPaise(selectedCustomer.totalSpentPaise ?? 0)}
                    </p>
                  </div>
                  <div
                    className="p-3.5 rounded-xl border"
                    style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)' }}
                  >
                    <span className="text-xs font-semibold" style={{ color: 'var(--merchant-primary)' }}>Total Orders</span>
                    <p className="text-lg font-bold font-mono mt-1" style={{ color: 'var(--merchant-text)' }}>
                      {selectedCustomer.totalOrders ?? selectedCustomer.orders?.length ?? 1}
                    </p>
                  </div>
                </div>

                {/* Orders History */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--merchant-text-muted)' }}>
                    Recent Orders
                  </h3>
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div
                      className="border rounded-xl divide-y overflow-hidden"
                      style={{ borderColor: 'var(--merchant-border)' }}
                    >
                      {selectedCustomer.orders.map((o: any) => (
                        <div key={o.id} className="p-3 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold" style={{ color: 'var(--merchant-text)' }}>#{o.orderNumber}</span>
                            <span className="ml-2" style={{ color: 'var(--merchant-text-muted)' }}>
                              {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="font-mono font-semibold" style={{ color: 'var(--merchant-text)' }}>
                            {formatPaise(o.totalAmountPaise)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic" style={{ color: 'var(--merchant-text-muted)' }}>No historical orders logged</p>
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

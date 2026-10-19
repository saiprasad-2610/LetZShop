import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Building2,
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Package,
} from 'lucide-react';
import type { AdminOrderDetail } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';
import { AdminLayout } from '../../components/AdminLayout';
import { Feedback } from '../../components/AdminUI';
import { useAdminAuth } from '../../context/AdminAuthContext';

function StatusBadge({ status, category = 'order' }: { status: string; category?: 'order' | 'payment' | 'fulfillment' }) {
  const s = (status || '').toUpperCase();
  let color = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

  if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'PAID') {
    color = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
  } else if (s === 'PROCESSING' || s === 'ACCEPTED' || s === 'SHIPPED' || s === 'AUTHORIZED') {
    color = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
  } else if (s === 'NEW' || s === 'PENDING') {
    color = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
  } else if (s === 'CANCELLED' || s === 'FAILED' || s === 'REFUNDED') {
    color = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color} uppercase tracking-wider`}>
      {status || 'Unknown'}
    </span>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { api } = useAdminAuth();

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getOrderDetail(id);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order details from platform backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady && id) {
      void loadOrder();
    }
  }, [router.isReady, id]);

  const shippingAddress = order?.orderAddress;
  const billingAddress = order?.orderAddress;

  return (
    <AdminLayout>
      <Head>
        <title>Order #{order?.orderNumber || (id as string) || 'Detail'} — LetzShop Admin</title>
      </Head>

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="p-2 rounded-xl border border-admin-border bg-admin-surface hover:bg-admin-raised text-admin-muted hover:text-admin-text transition-colors"
              title="Back to Orders"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-admin-text font-mono">
                  Order #{order?.orderNumber || '...'}
                </h1>
                {order && <StatusBadge status={order.status} category="order" />}
              </div>
              <p className="text-xs text-admin-muted mt-0.5">
                Created on{' '}
                {order
                  ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadOrder()}
              className="admin-secondary text-xs flex items-center gap-1.5 px-3 py-2"
              title="Refresh order details"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <Feedback error={error || undefined} loading={loading && !order} />

        {order && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Items & Financial Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items Card */}
              <div className="rounded-2xl border border-admin-border bg-admin-surface p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-admin-border/60 pb-3">
                  <div className="flex items-center gap-2 font-bold text-admin-text text-sm uppercase tracking-wider">
                    <Package className="w-4 h-4 text-admin-accent" />
                    <span>Order Items ({order.items?.length || 0})</span>
                  </div>
                  <span className="text-xs text-admin-muted">
                    Total Quantity: {order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)}
                  </span>
                </div>

                <div className="divide-y divide-admin-border/60">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-admin-text">
                          {item.productName || item.product?.title || 'Ordered Product'}
                        </div>
                        {item.variantTitle && (
                          <div className="text-xs text-admin-secondary mt-0.5">
                            Variant: {item.variantTitle}
                          </div>
                        )}
                        <div className="text-xs text-admin-muted mt-1">
                          Price: {formatPaise(item.pricePaise)} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold tabular-nums text-sm text-admin-text">
                          {formatPaise(item.totalPaise || item.pricePaise * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="rounded-2xl border border-admin-border bg-admin-surface p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-admin-border/60 pb-3">
                  <div className="flex items-center gap-2 font-bold text-admin-text text-sm uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-admin-accent" />
                    <span>Payment & Totals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.paymentStatus} category="payment" />
                    <span className="text-xs text-admin-muted font-medium">
                      {order.paymentMethod || 'Prepaid'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-admin-secondary pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">{formatPaise(order.subtotalPaise)}</span>
                  </div>
                  {order.discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span className="font-mono tabular-nums">-{formatPaise(order.discountPaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping Charges</span>
                    <span className="font-mono tabular-nums">{formatPaise(order.shippingPaise)}</span>
                  </div>
                  {order.taxPaise > 0 && (
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span className="font-mono tabular-nums">{formatPaise(order.taxPaise)}</span>
                    </div>
                  )}
                  <div className="border-t border-admin-border/80 pt-3 flex justify-between font-bold text-base text-admin-text">
                    <span>Total Amount</span>
                    <span className="font-mono tabular-nums text-admin-accent">
                      {formatPaise(order.totalPaise)}
                    </span>
                  </div>
                </div>

                {/* Payment Gateway Transactions */}
                {order.paymentOrders && order.paymentOrders.length > 0 && (
                  <div className="pt-3 border-t border-admin-border/60 space-y-2">
                    <div className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider">
                      Gateway Transactions ({order.paymentOrders.length})
                    </div>
                    {order.paymentOrders.map((po: any) => (
                      <div key={po.id} className="p-3 rounded-xl bg-admin-raised/40 border border-admin-border/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-semibold text-admin-text block">
                            {po.providerOrderId || po.id}
                          </span>
                          <span className="text-[11px] text-admin-muted">
                            Provider: {po.provider || 'RAZORPAY'} · {new Date(po.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={po.status} category="payment" />
                          <div className="font-bold tabular-nums text-admin-text mt-0.5">
                            {formatPaise(po.amountPaise)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="rounded-2xl border border-admin-border bg-admin-surface p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-admin-text text-sm uppercase tracking-wider border-b border-admin-border/60 pb-3">
                  <Clock className="w-4 h-4 text-admin-accent" />
                  <span>Order Lifecycle Timeline</span>
                </div>

                {order.statusHistory && order.statusHistory.length > 0 ? (
                  <div className="border-l-2 border-admin-border ml-3 pl-4 space-y-4 text-xs">
                    {order.statusHistory.map((h: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-admin-accent absolute -left-[22px] top-1"></div>
                        <div className="font-semibold text-admin-text text-sm">{h.status}</div>
                        <div className="text-xs text-admin-muted mt-0.5">
                          {new Date(h.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {h.note && <span className="block mt-0.5 text-admin-secondary italic">{h.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-admin-muted">
                    No timeline events recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Context, Customer & Shipments */}
            <div className="space-y-6">
              {/* Store & Merchant Ownership */}
              <div className="rounded-2xl border border-admin-border bg-admin-surface p-5 space-y-3.5 shadow-xs">
                <div className="font-bold text-admin-text text-sm uppercase tracking-wider border-b border-admin-border/60 pb-2.5">
                  Store & Merchant
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-admin-muted tracking-wider block">
                      Store
                    </span>
                    <div className="font-semibold text-admin-text text-sm mt-0.5">
                      {order.store?.name || '—'}
                    </div>
                    {order.store?.slug && (
                      <div className="text-admin-muted font-mono text-[11px] mt-0.5">
                        Slug: {order.store.slug}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-admin-muted tracking-wider block">
                      Merchant Account
                    </span>
                    {order.tenant ? (
                      <Link
                        href={`/merchants/${order.tenant.id}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-admin-accent hover:underline text-sm mt-0.5"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>{order.tenant.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    ) : (
                      <span className="font-semibold text-admin-text">LetzShop Direct</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="rounded-2xl border border-admin-border bg-admin-surface p-5 space-y-3.5 shadow-xs">
                <div className="font-bold text-admin-text text-sm uppercase tracking-wider border-b border-admin-border/60 pb-2.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-admin-accent" />
                  <span>Customer Details</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-admin-muted tracking-wider block">
                      Full Name
                    </span>
                    <div className="font-semibold text-admin-text text-sm mt-0.5">
                      {order.customer?.fullName || 'Guest Customer'}
                    </div>
                  </div>

                  {order.customer?.phone && (
                    <div className="flex items-center gap-2 text-admin-secondary">
                      <Phone className="w-3.5 h-3.5 text-admin-muted" />
                      <span>{order.customer.phone}</span>
                    </div>
                  )}

                  {order.customer?.email && (
                    <div className="flex items-center gap-2 text-admin-secondary">
                      <Mail className="w-3.5 h-3.5 text-admin-muted" />
                      <span>{order.customer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              <div className="rounded-2xl border border-admin-border bg-admin-surface p-5 space-y-3.5 shadow-xs">
                <div className="font-bold text-admin-text text-sm uppercase tracking-wider border-b border-admin-border/60 pb-2.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-admin-accent" />
                  <span>Shipping Address</span>
                </div>

                {shippingAddress ? (
                  <div className="text-xs text-admin-secondary space-y-1">
                    <div className="font-semibold text-admin-text">
                      {shippingAddress.fullName || order.customer?.fullName}
                    </div>
                    {shippingAddress.addressLine1 && <div>{shippingAddress.addressLine1}</div>}
                    {shippingAddress.addressLine2 && <div>{shippingAddress.addressLine2}</div>}
                    <div>
                      {[shippingAddress.city, shippingAddress.state, shippingAddress.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {shippingAddress.country && <div>{shippingAddress.country}</div>}
                    {shippingAddress.phone && (
                      <div className="text-admin-muted text-[11px] pt-1">
                        Contact: {shippingAddress.phone}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-admin-muted italic">
                    No physical shipping address recorded (digital or standard pickup).
                  </div>
                )}
              </div>

              {/* Fulfillment & Shipments */}
              <div className="rounded-2xl border border-admin-border bg-admin-surface p-5 space-y-3.5 shadow-xs">
                <div className="font-bold text-admin-text text-sm uppercase tracking-wider border-b border-admin-border/60 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-admin-accent" />
                    <span>Fulfillment</span>
                  </div>
                  <StatusBadge status={order.fulfillmentStatus} category="fulfillment" />
                </div>

                {order.shipments && order.shipments.length > 0 ? (
                  <div className="space-y-3">
                    {order.shipments.map((s: any) => (
                      <div key={s.id} className="p-3 rounded-xl bg-admin-raised/40 border border-admin-border text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-admin-text">
                            {s.carrier || 'Standard Courier'}
                          </span>
                          <StatusBadge status={s.status} category="fulfillment" />
                        </div>
                        {s.trackingNumber && (
                          <div className="text-xs font-mono text-admin-accent font-semibold">
                            Tracking: {s.trackingNumber}
                          </div>
                        )}
                        {s.trackingUrl && (
                          <a
                            href={s.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-admin-accent hover:underline"
                          >
                            <span>Track on Carrier Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-admin-muted">
                    No shipment parcels dispatched yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

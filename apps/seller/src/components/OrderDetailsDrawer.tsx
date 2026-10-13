import React, { useState } from 'react';
import {
  X,
  Package,
  MapPin,
  Phone,
  MessageSquare,
  CreditCard,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
  Ban,
  ArrowRight,
  Store as StoreIcon,
  Printer,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatPaise } from '@simply/ui';
import { SafeImage } from './ui/SafeImage';

interface OrderDetailsDrawerProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  NEW: { label: 'New', bgClass: 'bg-blue-500/10 border border-blue-500/30', textClass: 'text-blue-600 dark:text-blue-400' },
  CONFIRMED: { label: 'Confirmed', bgClass: 'bg-indigo-500/10 border border-indigo-500/30', textClass: 'text-indigo-600 dark:text-indigo-400' },
  ACCEPTED: { label: 'Accepted', bgClass: 'bg-cyan-500/10 border border-cyan-500/30', textClass: 'text-cyan-600 dark:text-cyan-400' },
  READY: { label: 'Ready to Ship', bgClass: 'bg-amber-500/10 border border-amber-500/30', textClass: 'text-amber-700 dark:text-amber-400' },
  DISPATCHED: { label: 'Dispatched', bgClass: 'bg-purple-500/10 border border-purple-500/30', textClass: 'text-purple-600 dark:text-purple-400' },
  COMPLETED: { label: 'Completed', bgClass: 'bg-emerald-500/10 border border-emerald-500/30', textClass: 'text-emerald-600 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelled', bgClass: 'bg-rose-500/10 border border-rose-500/30', textClass: 'text-rose-600 dark:text-rose-400' },
  RETURN_REQUESTED: { label: 'Return Requested', bgClass: 'bg-amber-500/10 border border-amber-500/30', textClass: 'text-amber-700 dark:text-amber-400' },
  RETURNED: { label: 'Returned', bgClass: 'bg-slate-500/10 border border-slate-500/30', textClass: 'text-slate-600 dark:text-slate-400' },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  PAID: { label: 'Paid', bgClass: 'bg-emerald-500/10 border border-emerald-500/30', textClass: 'text-emerald-600 dark:text-emerald-400' },
  PENDING: { label: 'Pending', bgClass: 'bg-amber-500/10 border border-amber-500/30', textClass: 'text-amber-700 dark:text-amber-400' },
  AUTHORIZED: { label: 'Authorized', bgClass: 'bg-blue-500/10 border border-blue-500/30', textClass: 'text-blue-600 dark:text-blue-400' },
  FAILED: { label: 'Failed', bgClass: 'bg-rose-500/10 border border-rose-500/30', textClass: 'text-rose-600 dark:text-rose-400' },
  REFUNDED: { label: 'Refunded', bgClass: 'bg-slate-500/10 border border-slate-500/30', textClass: 'text-slate-600 dark:text-slate-400' },
  PARTIALLY_REFUNDED: { label: 'Partially Refunded', bgClass: 'bg-slate-500/10 border border-slate-500/30', textClass: 'text-slate-600 dark:text-slate-400' },
};

const CANCELLATION_REASONS = [
  'Customer requested',
  'Out of stock',
  'Unable to fulfill',
  'Duplicate order',
  'Other',
];

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const { api } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    type: 'CANCEL' | 'COMPLETE';
    targetStatus: string;
  } | null>(null);
  const [cancellationReason, setCancellationReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const [shippingLoading, setShippingLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleShipWithShiprocket = async () => {
    setShippingLoading(true);
    setActionError(null);
    try {
      await api.shipping.shipOrder(order.id);
      onStatusUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch via Shiprocket');
    } finally {
      setShippingLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string, reason?: string) => {
    setUpdating(true);
    setActionError(null);
    try {
      await api.orders.updateStatus(order.id, newStatus, reason);
      setConfirmModal(null);
      onStatusUpdated();
    } catch (err: any) {
      console.error('Failed to update status', err);
      setActionError(err.message || 'Status transition rejected by server.');
    } finally {
      setUpdating(false);
    }
  };

  const cleanPhone = (p?: string) => {
    if (!p) return '';
    return p.replace(/[^0-9]/g, '').replace(/^91/, '');
  };

  const customerName =
    order.customerName ||
    order.customer?.name ||
    order.orderAddress?.fullName ||
    order.deliveryAddress?.fullName ||
    'Guest Customer';

  const customerPhone =
    order.customerPhone ||
    order.customer?.phone ||
    order.orderAddress?.phoneNumber ||
    order.deliveryAddress?.phoneNumber ||
    '';

  const customerEmail =
    order.customerEmail ||
    order.customer?.email ||
    '';

  const addr =
    order.orderAddress ||
    (order.deliveryAddress as any) ||
    {};

  const isPickup = order.fulfillmentMode === 'PICKUP';

  const getWhatsAppLink = () => {
    const phone = cleanPhone(customerPhone);
    const text = encodeURIComponent(
      `Hello ${customerName},\n\nUpdate regarding your order #${order.orderNumber} from our store:\nStatus: ${
        ORDER_STATUS_CONFIG[order.status]?.label || order.status
      }\nTotal: ${formatPaise(order.totalPaise)}\n\nThank you for choosing us!`
    );
    return `https://wa.me/91${phone}?text=${text}`;
  };

  const statusMeta = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    bgClass: 'bg-merchant-surface-raised border border-merchant-border',
    textClass: 'text-merchant-text',
  };

  const paymentMeta = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
    label: order.paymentStatus,
    bgClass: 'bg-merchant-surface-raised border border-merchant-border',
    textClass: 'text-merchant-text',
  };

  // Payment details
  const paymentOrder = order.paymentOrders?.[0];
  const paymentTransaction = paymentOrder?.transactions?.[0];
  const paymentMethodDisplay =
    paymentTransaction?.paymentMethod?.toUpperCase() ||
    paymentOrder?.provider ||
    'ONLINE';

  // Shipping details
  const shipment = order.shipments?.[0];

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
        className="fixed inset-0 z-50 flex justify-end bg-merchant-overlay backdrop-blur-xs"
      >
        <div className="w-full sm:max-w-xl md:max-w-2xl bg-merchant-surface text-merchant-text h-full flex flex-col shadow-2xl overflow-hidden border-l border-merchant-border animate-in slide-in-from-right duration-200">
          {/* =========================================================================
              DRAWER HEADER
          ========================================================================= */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-merchant-border bg-merchant-surface-raised">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2
                  id="order-drawer-title"
                  className="text-base sm:text-lg font-bold text-merchant-text font-mono tracking-tight"
                >
                  Order #{order.orderNumber}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusMeta.bgClass} ${statusMeta.textClass}`}
                >
                  {statusMeta.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${paymentMeta.bgClass} ${paymentMeta.textClass}`}
                >
                  {paymentMeta.label}
                </span>
              </div>
              <p className="text-xs text-merchant-text-muted mt-1">
                Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-merchant-text-muted hover:text-merchant-text rounded-xl hover:bg-merchant-surface transition shrink-0"
              aria-label="Close Order Details Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Error Banner if status transition fails */}
          {actionError && (
            <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {actionError}
              </span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-rose-500 hover:text-rose-700 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* =========================================================================
              DRAWER BODY (Scrollable)
          ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* NEXT WORKFLOW ACTIONS CARD */}
            <div className="bg-merchant-surface-raised border border-merchant-border rounded-2xl p-4 sm:p-5 text-merchant-text space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-merchant-text-muted uppercase tracking-wider">
                  Next Order Action
                </span>
                <span className="text-xs text-merchant-text-muted font-mono">
                  State: <strong className="text-merchant-text">{order.status}</strong>
                </span>
              </div>

              {/* Action Buttons based strictly on canonical OrderStatus transition graph */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {order.status === 'NEW' && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus('ACCEPTED', 'Order accepted by merchant')}
                      className="px-4 py-2 bg-merchant-primary hover:bg-merchant-primary-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Accept Order
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus('CONFIRMED', 'Order confirmed by merchant')}
                      className="px-4 py-2 bg-merchant-surface hover:bg-merchant-surface-muted text-merchant-text border border-merchant-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      Confirm Order
                    </button>
                  </>
                )}

                {order.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus('ACCEPTED', 'Order accepted for preparation')}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Start Preparation
                  </button>
                )}

                {order.status === 'ACCEPTED' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus('READY', 'Items packed and ready for dispatch')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    <Package className="w-4 h-4" /> Mark Ready to Ship
                  </button>
                )}

                {order.status === 'READY' && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus('DISPATCHED', 'Handed over to courier')}
                      className="px-4 py-2 bg-merchant-primary hover:bg-merchant-primary-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                    >
                      <Truck className="w-4 h-4" /> Dispatch Order
                    </button>
                    {isPickup && (
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => setConfirmModal({ type: 'COMPLETE', targetStatus: 'COMPLETED' })}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Picked Up
                      </button>
                    )}
                  </>
                )}

                {order.status === 'DISPATCHED' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setConfirmModal({ type: 'COMPLETE', targetStatus: 'COMPLETED' })}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Complete Order (Delivered)
                  </button>
                )}

                {/* Cancel Action available for unfulfilled active orders */}
                {['NEW', 'CONFIRMED', 'ACCEPTED', 'READY'].includes(order.status) && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setConfirmModal({ type: 'CANCEL', targetStatus: 'CANCELLED' })}
                    className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 ml-auto"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel Order
                  </button>
                )}

                {order.status === 'COMPLETED' && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Order successfully delivered and settled.</span>
                  </div>
                )}

                {order.status === 'CANCELLED' && (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>This order has been cancelled and inventory released.</span>
                  </div>
                )}
              </div>
            </div>

            {/* CUSTOMER DETAILS & ACTIONS */}
            <div className="bg-merchant-surface-raised border border-merchant-border rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-merchant-text-muted uppercase tracking-wider block">
                    Customer Details
                  </span>
                  <p className="text-sm font-bold text-merchant-text mt-0.5">{customerName}</p>
                  {customerPhone && (
                    <p className="text-xs text-merchant-text-secondary font-mono mt-0.5">{customerPhone}</p>
                  )}
                  {customerEmail && (
                    <p className="text-xs text-merchant-text-muted font-mono">{customerEmail}</p>
                  )}
                </div>

                {/* Contact Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {customerPhone && (
                    <>
                      <a
                        href={`tel:${customerPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-merchant-surface border border-merchant-border hover:bg-merchant-surface-muted text-merchant-text rounded-xl text-xs font-semibold shadow-2xs transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-merchant-primary" />
                        Call
                      </a>
                      <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-2xs transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* DELIVERY / FULFILLMENT INFORMATION */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-merchant-text-muted uppercase tracking-wider flex items-center gap-1.5">
                {isPickup ? <StoreIcon className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                <span>{isPickup ? 'Store Pickup Details' : 'Delivery Address'}</span>
              </h3>

              {isPickup ? (
                <div className="bg-merchant-surface-raised p-4 rounded-xl border border-merchant-border text-xs text-merchant-text space-y-1">
                  <p className="font-bold text-merchant-text">Self Pickup Order</p>
                  <p className="text-merchant-text-secondary">Customer will collect the package from physical store location.</p>
                </div>
              ) : (
                <div className="bg-merchant-surface-raised p-4 rounded-xl border border-merchant-border text-xs text-merchant-text space-y-1">
                  <p className="font-bold text-merchant-text">{addr.fullName || customerName}</p>
                  <p>{addr.addressLine1 || 'Address details'}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  {addr.landmark && <p className="text-merchant-text-muted">Landmark: {addr.landmark}</p>}
                  <p>
                    {addr.city}, {addr.state} -{' '}
                    <span className="font-mono font-semibold">{addr.pincode}</span>
                  </p>
                  <p className="text-merchant-text-muted font-mono text-[11px] pt-1">
                    PIN: {addr.pincode || 'N/A'} • {addr.country || 'India'}
                  </p>
                </div>
              )}
            </div>

            {/* ORDER ITEMS LIST */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-merchant-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span>Items ({order.items?.length || 0})</span>
              </h3>

              <div className="border border-merchant-border rounded-2xl divide-y divide-merchant-border overflow-hidden bg-merchant-surface shadow-xs">
                {(order.items || []).map((item: any) => {
                  const mediaUrl =
                    item.variant?.product?.media?.[0]?.publicUrl || null;

                  return (
                    <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-merchant-surface-raised rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-merchant-border">
                          <SafeImage
                            src={mediaUrl}
                            alt={item.productName}
                            fallbackTitle={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-merchant-text truncate">{item.productName}</p>
                          {item.variantTitle && (
                            <p className="text-merchant-text-muted text-[11px] truncate">{item.variantTitle}</p>
                          )}
                          {item.sku && (
                            <p className="text-merchant-text-muted font-mono text-[10px]">SKU: {item.sku}</p>
                          )}
                          <p className="text-merchant-text-secondary font-mono text-[11px] mt-0.5">
                            {item.quantity} × {formatPaise(item.unitPricePaise)}
                          </p>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-merchant-text text-sm shrink-0">
                        {formatPaise(item.totalPaise)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FINANCIAL BREAKDOWN */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-merchant-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Order Totals</span>
              </h3>

              <div className="bg-merchant-surface-raised p-4 rounded-xl border border-merchant-border text-xs space-y-2">
                <div className="flex justify-between text-merchant-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">{formatPaise(order.subtotalPaise)}</span>
                </div>
                {order.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{formatPaise(order.discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-merchant-text-secondary">
                  <span>Shipping & Delivery</span>
                  <span className="font-mono font-medium">
                    {order.shippingPaise > 0 ? formatPaise(order.shippingPaise) : 'Free'}
                  </span>
                </div>
                {order.taxPaise > 0 && (
                  <div className="flex justify-between text-merchant-text-secondary">
                    <span>Tax (GST)</span>
                    <span className="font-mono font-medium">{formatPaise(order.taxPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-merchant-text pt-2 border-t border-merchant-border">
                  <span>Total Amount</span>
                  <span className="font-mono">{formatPaise(order.totalPaise)}</span>
                </div>
              </div>
            </div>

            {/* PAYMENT INFORMATION */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-merchant-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Payment Information</span>
              </h3>

              <div className="bg-merchant-surface-raised p-4 rounded-xl border border-merchant-border text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-merchant-text-secondary">Payment Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${paymentMeta.bgClass} ${paymentMeta.textClass}`}>
                    {paymentMeta.label}
                  </span>
                </div>
                <div className="flex justify-between items-center text-merchant-text-secondary">
                  <span>Method</span>
                  <span className="font-mono font-medium text-merchant-text">{paymentMethodDisplay}</span>
                </div>
                {paymentOrder?.providerOrderId && (
                  <div className="flex justify-between items-center text-merchant-text-muted font-mono text-[11px]">
                    <span>Reference</span>
                    <span className="truncate max-w-[200px]">{paymentOrder.providerOrderId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SHIPPING & LOGISTICS DETAILS */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-merchant-text-muted uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-500" />
                  Logistics & Shiprocket Fulfillment
                </span>
                {shipment && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    AWB Active
                  </span>
                )}
              </h3>

              <div className="bg-merchant-surface-raised p-4 rounded-xl border border-merchant-border text-xs space-y-2.5">
                {shipment ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-merchant-text-secondary">Assigned Courier</span>
                      <span className="font-bold text-merchant-text">{shipment.courierName || 'Shiprocket Delivery'}</span>
                    </div>
                    {shipment.awbNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-merchant-text-secondary">AWB / Reference</span>
                        {shipment.awbNumber.startsWith('OWNER_DELIVERY_') ? (
                          <span className="font-mono font-bold text-emerald-500">{shipment.awbNumber}</span>
                        ) : (
                          <a
                            href={`https://shiprocket.co/tracking/${shipment.awbNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-merchant-primary hover:underline flex items-center gap-1"
                          >
                            {shipment.awbNumber}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-merchant-text-secondary">Logistics Status</span>
                      <span className="font-semibold text-merchant-text uppercase px-2 py-0.5 bg-merchant-surface rounded text-[10px] border border-merchant-border">
                        {shipment.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery (Owner)' : shipment.status}
                      </span>
                    </div>

                    {(shipment.labelUrl || shipment.manifestUrl) && (
                      <div className="pt-2 border-t border-merchant-border flex flex-wrap gap-2">
                        {shipment.labelUrl && (
                          <a
                            href={shipment.labelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-merchant-surface border border-merchant-border hover:bg-merchant-surface-muted rounded-lg text-[11px] font-semibold text-merchant-text shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-merchant-text-muted" /> Print Label
                          </a>
                        )}
                        {shipment.manifestUrl && (
                          <a
                            href={shipment.manifestUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-merchant-surface border border-merchant-border hover:bg-merchant-surface-muted rounded-lg text-[11px] font-semibold text-merchant-text shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-merchant-text-muted" /> Print Manifest
                          </a>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <p className="font-semibold text-merchant-text">Direct Owner Delivery / Courier</p>
                      <p className="text-[11px] text-merchant-text-muted mt-0.5">
                        Deliver directly by store owner, or manifest with 3rd-party Shiprocket courier.
                      </p>
                    </div>

                    {!['CANCELLED', 'COMPLETED'].includes(order.status) && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('DISPATCHED')}
                          disabled={updating}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          <StoreIcon className="w-3.5 h-3.5" /> Self-Deliver Order
                        </button>

                        <button
                          type="button"
                          onClick={handleShipWithShiprocket}
                          disabled={shippingLoading}
                          className="px-3 py-2 bg-merchant-surface hover:bg-merchant-surface-muted text-merchant-text border border-merchant-border rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {shippingLoading ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Manifesting...</>
                          ) : (
                            <><Truck className="w-3.5 h-3.5 text-amber-500" /> Shiprocket</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ORDER TIMELINE / STATUS HISTORY */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-merchant-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Order Timeline</span>
                </h3>

                <div className="border border-merchant-border rounded-2xl p-4 bg-merchant-surface space-y-3">
                  {order.statusHistory.map((h: any, idx: number) => {
                    const toMeta = ORDER_STATUS_CONFIG[h.toStatus] || {
                      label: h.toStatus,
                      bgClass: 'bg-merchant-surface-raised',
                      textClass: 'text-merchant-text',
                    };

                    return (
                      <div key={h.id || idx} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-merchant-primary mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-merchant-text">
                              Status changed to <span className={toMeta.textClass}>{toMeta.label}</span>
                            </span>
                            <span className="text-merchant-text-muted font-mono text-[10px]">
                              {new Date(h.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {h.reason && (
                            <p className="text-merchant-text-muted text-[11px] mt-0.5 italic">"{h.reason}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONFIRMATION MODAL
      ========================================================================= */}
      {confirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-merchant-overlay backdrop-blur-xs">
          <div className="bg-merchant-surface border border-merchant-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-merchant-text">
            {confirmModal.type === 'CANCEL' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-merchant-text">Cancel Order #{order.orderNumber}?</h3>
                  <p className="text-xs text-merchant-text-muted mt-1">
                    This order will be cancelled and reserved inventory stock will be released back to available quantity.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-merchant-text-secondary block">
                    Cancellation Reason:
                  </label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-merchant-input-border bg-merchant-input-bg text-merchant-text focus:outline-hidden focus:ring-2 focus:ring-merchant-focus-ring"
                  >
                    {CANCELLATION_REASONS.map((r) => (
                      <option key={r} value={r} className="bg-merchant-surface text-merchant-text">
                        {r}
                      </option>
                    ))}
                  </select>

                  {cancellationReason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify custom reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="w-full text-xs p-2.5 mt-2 rounded-xl border border-merchant-input-border bg-merchant-input-bg text-merchant-text placeholder-merchant-text-muted focus:outline-hidden focus:ring-2 focus:ring-merchant-focus-ring"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    disabled={updating}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-merchant-surface-raised hover:bg-merchant-surface-muted text-merchant-text border border-merchant-border transition"
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      handleUpdateStatus(
                        'CANCELLED',
                        cancellationReason === 'Other' && customReason
                          ? customReason
                          : cancellationReason
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition disabled:opacity-50"
                  >
                    {updating ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-merchant-text">Mark Order Delivered / Completed?</h3>
                  <p className="text-xs text-merchant-text-muted mt-1">
                    Confirm that customer has received the package. This will finalize stock and complete the order.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    disabled={updating}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-merchant-surface-raised hover:bg-merchant-surface-muted text-merchant-text border border-merchant-border transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('COMPLETED', 'Confirmed delivered to customer')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-50"
                  >
                    {updating ? 'Completing...' : 'Confirm Delivery & Complete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

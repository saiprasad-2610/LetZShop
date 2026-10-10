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
import { formatPaise, resolveMediaUrl } from '@simply/ui';
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
  NEW: { label: 'New', bgClass: 'bg-blue-50 border border-blue-200', textClass: 'text-blue-700' },
  CONFIRMED: { label: 'Confirmed', bgClass: 'bg-indigo-50 border border-indigo-200', textClass: 'text-indigo-700' },
  ACCEPTED: { label: 'Accepted', bgClass: 'bg-cyan-50 border border-cyan-200', textClass: 'text-cyan-700' },
  READY: { label: 'Ready to Ship', bgClass: 'bg-amber-50 border border-amber-200', textClass: 'text-amber-800' },
  DISPATCHED: { label: 'Dispatched', bgClass: 'bg-purple-50 border border-purple-200', textClass: 'text-purple-700' },
  COMPLETED: { label: 'Completed', bgClass: 'bg-emerald-50 border border-emerald-200', textClass: 'text-emerald-700' },
  CANCELLED: { label: 'Cancelled', bgClass: 'bg-rose-50 border border-rose-200', textClass: 'text-rose-700' },
  RETURN_REQUESTED: { label: 'Return Requested', bgClass: 'bg-amber-50 border border-amber-200', textClass: 'text-amber-700' },
  RETURNED: { label: 'Returned', bgClass: 'bg-slate-100 border border-slate-200', textClass: 'text-slate-700' },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  PAID: { label: 'Paid', bgClass: 'bg-emerald-50 border border-emerald-200', textClass: 'text-emerald-700' },
  PENDING: { label: 'Pending', bgClass: 'bg-amber-50 border border-amber-200', textClass: 'text-amber-700' },
  AUTHORIZED: { label: 'Authorized', bgClass: 'bg-blue-50 border border-blue-200', textClass: 'text-blue-700' },
  FAILED: { label: 'Failed', bgClass: 'bg-rose-50 border border-rose-200', textClass: 'text-rose-700' },
  REFUNDED: { label: 'Refunded', bgClass: 'bg-slate-100 border border-slate-200', textClass: 'text-slate-700' },
  PARTIALLY_REFUNDED: { label: 'Partially Refunded', bgClass: 'bg-slate-100 border border-slate-200', textClass: 'text-slate-700' },
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
      // If dispatching and no shipment created yet, automatically trigger shipment manifest with Shiprocket
      if (newStatus === 'DISPATCHED' && (!order.shipments || order.shipments.length === 0)) {
        try {
          await api.shipping.shipOrder(order.id);
        } catch (shipErr: any) {
          console.warn('Shipment dispatch warning:', shipErr);
        }
      }

      await api.orders.updateStatus(order.id, newStatus, reason || undefined);
      setConfirmModal(null);
      onStatusUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '').replace(/^91/, '');
  };

  const customerPhone =
    order.customerPhone ||
    order.customer?.phone ||
    order.orderAddress?.phone ||
    (order.deliveryAddress as any)?.phone ||
    '';

  const customerName =
    order.customerName ||
    order.customer?.fullName ||
    order.orderAddress?.fullName ||
    (order.deliveryAddress as any)?.fullName ||
    'Customer';

  const customerEmail =
    order.customerEmail ||
    order.customer?.email ||
    (order.deliveryAddress as any)?.email ||
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
    bgClass: 'bg-slate-100 border border-slate-200',
    textClass: 'text-slate-800',
  };

  const paymentMeta = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
    label: order.paymentStatus,
    bgClass: 'bg-slate-100 border border-slate-200',
    textClass: 'text-slate-700',
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
        className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
      >
        <div className="w-full sm:max-w-xl md:max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
          {/* =========================================================================
              DRAWER HEADER
          ========================================================================= */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2
                  id="order-drawer-title"
                  className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight"
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
              <p className="text-xs text-slate-500 mt-1">
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
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition shrink-0"
              aria-label="Close Order Details Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Error Banner if status transition fails */}
          {actionError && (
            <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {actionError}
              </span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-rose-500 hover:text-rose-800 ml-2"
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
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Next Order Action
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  State: <strong className="text-slate-200">{order.status}</strong>
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
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Accept Order
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus('CONFIRMED', 'Order confirmed by merchant')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
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
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
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
                    className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 ml-auto"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel Order
                  </button>
                )}

                {order.status === 'COMPLETED' && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Order successfully delivered and settled.</span>
                  </div>
                )}

                {order.status === 'CANCELLED' && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>This order has been cancelled and inventory released.</span>
                  </div>
                )}
              </div>
            </div>

            {/* CUSTOMER DETAILS & ACTIONS */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Details
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{customerName}</p>
                  {customerPhone && (
                    <p className="text-xs text-slate-600 font-mono mt-0.5">{customerPhone}</p>
                  )}
                  {customerEmail && (
                    <p className="text-xs text-slate-500 font-mono">{customerEmail}</p>
                  )}
                </div>

                {/* Contact Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {customerPhone && (
                    <>
                      <a
                        href={`tel:${customerPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
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
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {isPickup ? <StoreIcon className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                <span>{isPickup ? 'Store Pickup Details' : 'Delivery Address'}</span>
              </h3>

              {isPickup ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">Self Pickup Order</p>
                  <p className="text-slate-600">Customer will collect the package from physical store location.</p>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">{addr.fullName || customerName}</p>
                  <p>{addr.addressLine1 || 'Address details'}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  {addr.landmark && <p className="text-slate-500">Landmark: {addr.landmark}</p>}
                  <p>
                    {addr.city}, {addr.state} -{' '}
                    <span className="font-mono font-semibold">{addr.pincode}</span>
                  </p>
                  <p className="text-slate-400 font-mono text-[11px] pt-1">
                    PIN: {addr.pincode || 'N/A'} • {addr.country || 'India'}
                  </p>
                </div>
              )}
            </div>

            {/* ORDER ITEMS LIST (With snapshot details) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span>Items ({order.items?.length || 0})</span>
              </h3>

              <div className="border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-xs">
                {(order.items || []).map((item: any) => {
                  const mediaUrl =
                    item.variant?.product?.media?.[0]?.publicUrl || null;

                  return (
                    <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                          <SafeImage
                            src={mediaUrl}
                            alt={item.productName}
                            fallbackTitle={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                          {item.variantTitle && (
                            <p className="text-slate-500 text-[11px] truncate">{item.variantTitle}</p>
                          )}
                          {item.sku && (
                            <p className="text-slate-400 font-mono text-[10px]">SKU: {item.sku}</p>
                          )}
                          <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                            {item.quantity} × {formatPaise(item.unitPricePaise)}
                          </p>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-slate-900 text-sm shrink-0">
                        {formatPaise(item.totalPaise)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FINANCIAL BREAKDOWN */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Order Totals</span>
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">{formatPaise(order.subtotalPaise)}</span>
                </div>
                {order.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{formatPaise(order.discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Delivery</span>
                  <span className="font-mono font-medium">
                    {order.shippingPaise > 0 ? formatPaise(order.shippingPaise) : 'Free'}
                  </span>
                </div>
                {order.taxPaise > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (GST)</span>
                    <span className="font-mono font-medium">{formatPaise(order.taxPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="font-mono">{formatPaise(order.totalPaise)}</span>
                </div>
              </div>
            </div>

            {/* PAYMENT INFORMATION */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Payment Information</span>
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Payment Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${paymentMeta.bgClass} ${paymentMeta.textClass}`}>
                    {paymentMeta.label}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Method</span>
                  <span className="font-mono font-medium text-slate-800">{paymentMethodDisplay}</span>
                </div>
                {paymentOrder?.providerOrderId && (
                  <div className="flex justify-between items-center text-slate-500 font-mono text-[11px]">
                    <span>Reference</span>
                    <span className="truncate max-w-[200px]">{paymentOrder.providerOrderId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SHIPPING & LOGISTICS DETAILS */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-600" />
                  Logistics & Shiprocket Fulfillment
                </span>
                {shipment && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    AWB Active
                  </span>
                )}
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs space-y-2.5">
                {shipment ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Assigned Courier</span>
                      <span className="font-bold text-slate-900">{shipment.courierName || 'Shiprocket Delivery'}</span>
                    </div>
                    {shipment.awbNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">AWB Tracking #</span>
                        <a
                          href={`https://shiprocket.co/tracking/${shipment.awbNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                        >
                          {shipment.awbNumber}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Logistics Status</span>
                      <span className="font-semibold text-slate-800 uppercase px-2 py-0.5 bg-slate-200/60 rounded text-[10px]">
                        {shipment.status}
                      </span>
                    </div>

                    {(shipment.labelUrl || shipment.manifestUrl) && (
                      <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                        {shipment.labelUrl && (
                          <a
                            href={shipment.labelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Label
                          </a>
                        )}
                        {shipment.manifestUrl && (
                          <a
                            href={shipment.manifestUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Manifest
                          </a>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <p className="font-semibold text-slate-800">Shipment Not Created Yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Manifest this order with Shiprocket to assign an AWB and schedule pickup.
                      </p>
                    </div>

                    {!['CANCELLED', 'COMPLETED'].includes(order.status) && (
                      <button
                        type="button"
                        onClick={handleShipWithShiprocket}
                        disabled={shippingLoading}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
                      >
                        {shippingLoading ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Manifesting...</>
                        ) : (
                          <><Truck className="w-3.5 h-3.5" /> Ship via Shiprocket</>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ORDER TIMELINE / STATUS HISTORY (Section 29) */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Order Timeline</span>
                </h3>

                <div className="border border-slate-200/90 rounded-2xl p-4 bg-white space-y-3">
                  {order.statusHistory.map((h: any, idx: number) => {
                    const toMeta = ORDER_STATUS_CONFIG[h.toStatus] || {
                      label: h.toStatus,
                      bgClass: 'bg-slate-100',
                      textClass: 'text-slate-700',
                    };

                    return (
                      <div key={h.id || idx} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">
                              Status changed to <span className={toMeta.textClass}>{toMeta.label}</span>
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(h.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {h.reason && (
                            <p className="text-slate-500 text-[11px] mt-0.5 italic">"{h.reason}"</p>
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
          CONFIRMATION MODAL (Section 20 & 21)
      ========================================================================= */}
      {confirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {confirmModal.type === 'CANCEL' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cancel Order #{order.orderNumber}?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This order will be cancelled and reserved inventory stock will be released back to available quantity.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Cancellation Reason:
                  </label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {CANCELLATION_REASONS.map((r) => (
                      <option key={r} value={r}>
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
                      className="w-full text-xs p-2.5 mt-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    disabled={updating}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
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
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mark Order Delivered / Completed?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Confirm that customer has received the package. This will finalize stock and complete the order.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    disabled={updating}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={updating}
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

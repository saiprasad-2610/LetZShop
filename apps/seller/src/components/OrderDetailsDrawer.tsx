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
  Send,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatPaise, ORDER_STATUS_MAP } from '@simply/ui';

interface OrderDetailsDrawerProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const { api } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [statusReason, setStatusReason] = useState('');

  if (!isOpen || !order) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.orders.updateStatus(order.id, newStatus, statusReason || undefined);
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const cleanPhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, '').replace(/^91/, '');
  };

  const getWhatsAppLink = () => {
    const rawPhone = order.customerPhone || order.shippingAddress?.phone || '';
    const phone = cleanPhone(rawPhone);
    const text = encodeURIComponent(
      `Hello ${order.customerName || 'Customer'},\n\nUpdate on your order #${order.orderNumber} from our store:\nStatus: ${order.status}\nTotal: ${formatPaise(order.totalAmountPaise)}\n\nThank you for choosing us!`
    );
    return `https://wa.me/91${phone}?text=${text}`;
  };

  const addr = order.shippingAddress || {};
  const statusMeta = ORDER_STATUS_MAP[order.status] || {
    label: order.status,
    bgClass: 'bg-slate-100 border border-slate-200',
    textClass: 'text-slate-800',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="order-drawer-title" className="text-base font-bold text-slate-900 font-mono tracking-tight">
                Order #{order.orderNumber}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusMeta.bgClass} ${statusMeta.textClass}`}
              >
                {statusMeta.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer & WhatsApp Direct Action */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Customer Contact
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {order.customerName || 'Guest Customer'}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {order.customerPhone || 'No phone provided'}
                </p>
              </div>

              {order.customerPhone && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Delivery Address</span>
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">{addr.name || order.customerName}</p>
              <p>{addr.addressLine1 || addr.address1 || 'Address details'}</p>
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              <p>
                {addr.city}, {addr.state} -{' '}
                <span className="font-mono font-semibold">{addr.postalCode || addr.pincode}</span>
              </p>
              <p className="text-slate-400 font-mono text-[11px] pt-1">
                PIN: {addr.postalCode || addr.pincode || 'N/A'} • India
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-400" />
              <span>Ordered Items ({order.items?.length || 0})</span>
            </h3>
            <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{item.titleSnapshot || item.productName || 'Product'}</p>
                    {item.variantTitleSnapshot && (
                      <p className="text-slate-500 text-[11px]">{item.variantTitleSnapshot}</p>
                    )}
                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                      Qty: {item.quantity} × {formatPaise(item.unitPricePaise)}
                    </p>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {formatPaise(item.totalPricePaise || item.totalPaise)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commercial Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>Payment & Summary</span>
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-mono font-medium">{formatPaise(order.subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping & Delivery</span>
                <span className="font-mono font-medium">
                  {order.shippingFeePaise ? formatPaise(order.shippingFeePaise) : 'Free'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (GST)</span>
                <span className="font-mono font-medium">{formatPaise(order.taxPaise || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono">{formatPaise(order.totalAmountPaise || order.totalPaise)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Payment Mode / Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  {order.paymentMethod || 'PREPAID'} • {order.paymentStatus || 'PAID'}
                </span>
              </div>
            </div>
          </div>

          {/* Contextual Status Progression Actions */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fulfillment Workflow Actions
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {order.status === 'NEW' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('PAID')}
                  className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Check className="w-4 h-4" /> Accept Order
                </button>
              )}

              {(order.status === 'PAID' || order.status === 'NEW') && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('PROCESSING')}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Clock className="w-4 h-4" /> Start Processing
                </button>
              )}

              {order.status === 'PROCESSING' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('READY')}
                  className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Package className="w-4 h-4" /> Mark Ready
                </button>
              )}

              {(order.status === 'READY' || order.status === 'PROCESSING') && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('SHIPPED')}
                  className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Truck className="w-4 h-4" /> Dispatch & Ship
                </button>
              )}

              {order.status === 'SHIPPED' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('DELIVERED')}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Delivered
                </button>
              )}

              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('CANCELLED')}
                  className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <AlertCircle className="w-4 h-4" /> Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

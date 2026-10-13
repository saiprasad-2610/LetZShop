import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Copy,
  UserCheck,
  Send,
  Mail,
  UserPlus,
  Sparkles,
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
  'Customer requested cancellation',
  'Out of stock',
  'Unable to fulfill at this time',
  'Duplicate order',
  'Other',
];

const STATUS_MESSAGE_SUGGESTIONS: Record<string, string[]> = {
  ACCEPTED: [
    'Order accepted! We are packing your items right now.',
    'Items confirmed in stock. Will prepare and pack shortly.',
  ],
  CONFIRMED: [
    'Order confirmed by our store! Packing has begun.',
    'Thank you! Your order is confirmed and in progress.',
  ],
  READY: [
    'Order is packed and ready for delivery/pickup!',
    'All items checked and sealed. Awaiting rider handover.',
  ],
  DISPATCHED: [
    'Out for delivery now! Expected arrival in 15-20 minutes.',
    'Please keep exact cash ready for COD payment.',
    'Delivery rider will call upon arriving at your gate/door.',
  ],
  COMPLETED: [
    'Package delivered! Thank you for supporting our local business.',
    'Order delivered successfully! Hope you enjoy your purchase.',
  ],
  CANCELLED: [
    'Order cancelled as requested by customer.',
    'Item temporarily out of stock. Apologies for the inconvenience.',
  ],
};

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const { api } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Delivery Partners Directory from Store
  const [deliveryPartners, setDeliveryPartners] = useState<
    Array<{ id: string; name: string; phone: string; vehicle?: string; isDefault?: boolean }>
  >([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [isAddingNewRiderInline, setIsAddingNewRiderInline] = useState(false);
  const [saveRiderToDirectory, setSaveRiderToDirectory] = useState(true);

  // Two-Step Status Confirmation & Automated Notification Modal State
  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    targetStatus: string;
    title: string;
    subtitle: string;
    badgeLabel?: string;
    defaultReason: string;
    themeColor: 'blue' | 'cyan' | 'amber' | 'purple' | 'emerald' | 'rose';
  } | null>(null);

  const [customMessage, setCustomMessage] = useState('');
  const [cancellationReason, setCancellationReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [sendWhatsAppNotification, setSendWhatsAppNotification] = useState(true);

  // Shipping & Dispatch Mode State
  const [selectedFulfillmentMode, setSelectedFulfillmentMode] = useState<'SELF_DELIVERY' | 'SHIPROCKET'>('SELF_DELIVERY');
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [syncingTracking, setSyncingTracking] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Load registered delivery partners when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchPartners = async () => {
      try {
        const res = await api.deliveryPartners.list();
        if (res?.data && Array.isArray(res.data)) {
          setDeliveryPartners(res.data);
          const def = res.data.find((p: any) => p.isDefault) || res.data[0];
          if (def) {
            setSelectedPartnerId(def.id);
            setRiderName(def.name);
            setRiderPhone(def.phone);
          } else {
            setSelectedPartnerId('NEW');
            setIsAddingNewRiderInline(true);
          }
        }
      } catch (e) {
        // ignore fallback
      }
    };
    fetchPartners();
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    if (partnerId === 'NEW') {
      setIsAddingNewRiderInline(true);
      setRiderName('');
      setRiderPhone('');
    } else {
      setIsAddingNewRiderInline(false);
      const found = deliveryPartners.find((p) => p.id === partnerId);
      if (found) {
        setRiderName(found.name);
        setRiderPhone(found.phone);
      }
    }
  };

  const openStatusConfirmation = (config: {
    targetStatus: string;
    title: string;
    subtitle: string;
    badgeLabel?: string;
    defaultReason: string;
    themeColor: 'blue' | 'cyan' | 'amber' | 'purple' | 'emerald' | 'rose';
  }) => {
    setActionError(null);
    setCustomMessage('');
    setStatusConfirmModal(config);
  };

  const cleanPhone = (p?: string) => {
    if (!p) return '';
    return p.replace(/[^0-9]/g, '').replace(/^91/, '');
  };

  const customerName =
    order.customerName ||
    order.customer?.fullName ||
    order.customer?.name ||
    order.orderAddress?.fullName ||
    order.deliveryAddress?.fullName ||
    'Guest Customer';

  const customerPhone =
    order.customerPhone ||
    order.customer?.phone ||
    order.orderAddress?.phoneNumber ||
    order.orderAddress?.phone ||
    order.deliveryAddress?.phoneNumber ||
    order.deliveryAddress?.phone ||
    '';

  const customerEmail =
    order.customerEmail ||
    order.customer?.email ||
    order.deliveryAddress?.email ||
    '';

  const addr =
    order.orderAddress ||
    (order.deliveryAddress as any) ||
    {};

  const isPickup = order.fulfillmentMode === 'PICKUP';
  const shipment = order.shipments?.[0];

  const trackingUrl = order.trackingToken
    ? (typeof window !== 'undefined'
        ? `${window.location.origin.replace(':3000', ':3001')}/track/${order.orderNumber}?t=${order.trackingToken}`
        : `https://letzshop.com/track/${order.orderNumber}?t=${order.trackingToken}`)
    : undefined;

  const handleCopyTrackingLink = async () => {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2500);
    } catch (e) {
      // ignore clipboard error
    }
  };

  const getWhatsAppLinkForStatus = (
    status: string,
    customMsg?: string,
    riderN?: string,
    riderP?: string
  ) => {
    const phone = cleanPhone(customerPhone);
    if (!phone) return '#';

    const itemsSummary =
      order.itemsSummary ||
      (order.items && order.items.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')) ||
      'Items';

    let header = `*Order Update - #${order.orderNumber}*`;
    let detail = `Your order status is now *${ORDER_STATUS_CONFIG[status]?.label || status}*.`;

    if (status === 'ACCEPTED' || status === 'CONFIRMED') {
      header = `*Order Confirmed & Preparing! 👨‍🍳 - #${order.orderNumber}*`;
      detail = `Great news! Your order has been accepted and is currently being packed.`;
    } else if (status === 'READY') {
      header = `*Order Packed & Ready! 🎁 - #${order.orderNumber}*`;
      detail = `Your order has been packed and is ready for delivery/pickup.`;
    } else if (status === 'DISPATCHED') {
      const activeRider = riderN || riderName || shipment?.courierName;
      const activeRiderPhone = riderP || riderPhone;
      header = `*Order Dispatched! 🚀 - #${order.orderNumber}*`;
      detail =
        `Great news! Your order has been dispatched and is on its way to your delivery address.\n` +
        (activeRider
          ? `🛵 *Delivery Partner:* ${activeRider}${activeRiderPhone ? ` (${activeRiderPhone})` : ''}`
          : `🚚 *Shipped via Logistics Partner*`);
    } else if (status === 'COMPLETED') {
      header = `*Order Delivered! 🎉 - #${order.orderNumber}*`;
      detail = `Your order #${order.orderNumber} has been successfully delivered! We hope you love your purchase.`;
    } else if (status === 'CANCELLED') {
      header = `*Order Cancelled - #${order.orderNumber}*`;
      detail = `Your order #${order.orderNumber} has been cancelled.`;
    }

    const noteLine = customMsg?.trim() ? `\n\n💬 *Note from Store:* "${customMsg.trim()}"` : '';
    const trackingLine = trackingUrl ? `\n\n🔗 *Track Live Order:* ${trackingUrl}` : '';

    const text =
      `${header}\n\n` +
      `Hello *${customerName}*,\n` +
      `${detail}\n\n` +
      `📦 *Items:* ${itemsSummary}\n` +
      `💰 *Total Amount:* ${formatPaise(order.totalPaise)}` +
      `${noteLine}` +
      `${trackingLine}\n\n` +
      `Thank you for shopping with us! Reply here for any questions.`;

    return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
  };

  const getDeliveryPartnerAssignmentWhatsApp = (pPhone: string, pName: string) => {
    const cleanRider = (pPhone || '').replace(/[^0-9]/g, '').replace(/^91/, '');
    if (!cleanRider) return '#';

    const itemsSummary =
      order.itemsSummary ||
      (order.items && order.items.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')) ||
      'Items';

    const paymentText =
      order.paymentStatus === 'PAID'
        ? 'PREPAID (₹0 to collect)'
        : `COD / Collect ${formatPaise(order.totalPaise)}`;

    const text =
      `🛵 *Delivery Assignment - Order #${order.orderNumber}*\n\n` +
      `Hello *${pName || 'Delivery Partner'}*,\n` +
      `You have been assigned to deliver the following order:\n\n` +
      `👤 *Customer:* ${customerName}\n` +
      `📞 *Customer Phone:* ${customerPhone}\n` +
      `📍 *Delivery Address:* ${addr.addressLine1 || ''}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city || ''} (${addr.pincode || addr.postalCode || ''})\n` +
      `📦 *Items:* ${itemsSummary}\n` +
      `💰 *Payment Status:* ${paymentText}\n` +
      (trackingUrl ? `\n🔗 *Order Tracking:* ${trackingUrl}\n\n` : '\n\n') +
      `Please collect the package from store and deliver to recipient. Thank you!`;

    return `https://wa.me/91${cleanRider}?text=${encodeURIComponent(text)}`;
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusConfirmModal) return;
    setUpdating(true);
    setActionError(null);

    const { targetStatus, defaultReason } = statusConfirmModal;
    const effectiveReason =
      targetStatus === 'CANCELLED' && cancellationReason === 'Other' && customReason
        ? customReason
        : defaultReason;

    const effectiveRiderName =
      targetStatus === 'DISPATCHED' && selectedFulfillmentMode === 'SELF_DELIVERY'
        ? riderName.trim()
        : undefined;

    const effectiveRiderPhone =
      targetStatus === 'DISPATCHED' && selectedFulfillmentMode === 'SELF_DELIVERY'
        ? riderPhone.trim()
        : undefined;

    try {
      // 1. If adding a new rider on the fly and saving to store directory
      if (
        targetStatus === 'DISPATCHED' &&
        selectedFulfillmentMode === 'SELF_DELIVERY' &&
        isAddingNewRiderInline &&
        effectiveRiderName &&
        effectiveRiderPhone &&
        saveRiderToDirectory
      ) {
        api.deliveryPartners
          .save({
            name: effectiveRiderName,
            phone: effectiveRiderPhone,
            vehicle: 'Motorcycle',
            isDefault: deliveryPartners.length === 0,
          })
          .catch(() => {});
      }

      // 2. If dispatching via Shiprocket
      if (targetStatus === 'DISPATCHED' && selectedFulfillmentMode === 'SHIPROCKET') {
        await api.shipping.shipOrder(order.id, {
          mode: 'SHIPROCKET',
          notes: customMessage.trim() || undefined,
        });
      }

      // 3. Atomically update order status, reason, custom note, and rider info
      await api.orders.updateStatus(order.id, targetStatus, effectiveReason, {
        customMessage: customMessage.trim() || undefined,
        riderName: effectiveRiderName,
        riderPhone: effectiveRiderPhone,
      });

      // Headless Automated Notifications: Server automatically dispatches email and direct WhatsApp without client popups or redirects
      setStatusConfirmModal(null);
      onStatusUpdated();
    } catch (err: any) {
      console.error('Failed to update status', err);
      setActionError(err.message || 'Status transition rejected by server.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSyncTracking = async () => {
    setSyncingTracking(true);
    setActionError(null);
    setSyncSuccessMessage(null);
    try {
      const res: any = await api.shipping.syncTracking(order.id);
      setSyncSuccessMessage(
        res?.tracking?.status
          ? `Status pulled from Shiprocket: ${res.tracking.status}${res.tracking.location ? ` (${res.tracking.location})` : ''}`
          : 'Live tracking synchronized successfully.'
      );
      onStatusUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to pull live tracking from Shiprocket API.');
    } finally {
      setSyncingTracking(false);
    }
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
              className="p-2 text-merchant-text-muted hover:text-merchant-text rounded-xl hover:bg-merchant-surface transition shrink-0 cursor-pointer"
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
                className="text-rose-500 hover:text-rose-700 ml-2 cursor-pointer"
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

              {/* Action Buttons: 2-step confirmation with auto-notify */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {order.status === 'NEW' && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        openStatusConfirmation({
                          targetStatus: 'ACCEPTED',
                          title: 'Accept & Prepare Order',
                          subtitle: 'Confirm order receipt and begin packing. Buyer will receive email and WhatsApp alerts.',
                          badgeLabel: 'ACCEPTED',
                          defaultReason: 'Order accepted by merchant',
                          themeColor: 'cyan',
                        })
                      }
                      className="px-4 py-2 bg-merchant-primary hover:bg-merchant-primary-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Accept Order
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        openStatusConfirmation({
                          targetStatus: 'CONFIRMED',
                          title: 'Confirm Order',
                          subtitle: 'Confirm order and lock stock.',
                          badgeLabel: 'CONFIRMED',
                          defaultReason: 'Order confirmed by merchant',
                          themeColor: 'blue',
                        })
                      }
                      className="px-4 py-2 bg-merchant-surface hover:bg-merchant-surface-muted text-merchant-text border border-merchant-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Order
                    </button>
                  </>
                )}

                {order.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      openStatusConfirmation({
                        targetStatus: 'ACCEPTED',
                        title: 'Start Preparation',
                        subtitle: 'Notify buyer that packing and preparing items has begun.',
                        badgeLabel: 'PREPARING',
                        defaultReason: 'Order accepted for preparation',
                        themeColor: 'cyan',
                      })
                    }
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Start Preparation
                  </button>
                )}

                {order.status === 'ACCEPTED' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      openStatusConfirmation({
                        targetStatus: 'READY',
                        title: 'Mark Ready to Ship',
                        subtitle: 'Confirm items are packed and waiting for delivery partner pickup.',
                        badgeLabel: 'READY TO SHIP',
                        defaultReason: 'Items packed and ready for dispatch',
                        themeColor: 'amber',
                      })
                    }
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Package className="w-4 h-4" /> Mark Ready to Ship
                  </button>
                )}

                {order.status === 'READY' && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        openStatusConfirmation({
                          targetStatus: 'DISPATCHED',
                          title: 'Dispatch Order & Assign Rider',
                          subtitle: 'Assign a delivery partner and send live delivery details to the buyer.',
                          badgeLabel: 'DISPATCHED',
                          defaultReason: 'Handed over for delivery',
                          themeColor: 'purple',
                        })
                      }
                      className="px-4 py-2 bg-merchant-primary hover:bg-merchant-primary-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Truck className="w-4 h-4" /> Dispatch Order
                    </button>
                    {isPickup && (
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          openStatusConfirmation({
                            targetStatus: 'COMPLETED',
                            title: 'Confirm Order Picked Up',
                            subtitle: 'Confirm customer collected the package from your physical store.',
                            badgeLabel: 'COMPLETED',
                            defaultReason: 'Customer picked up the order',
                            themeColor: 'emerald',
                          })
                        }
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
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
                    onClick={() =>
                      openStatusConfirmation({
                        targetStatus: 'COMPLETED',
                        title: 'Confirm Delivery & Complete Order',
                        subtitle: 'Confirm package was received by customer. Sends delivery receipt and finalizes order.',
                        badgeLabel: 'DELIVERED',
                        defaultReason: 'Confirmed delivered to customer',
                        themeColor: 'emerald',
                      })
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Complete Order (Delivered)
                  </button>
                )}

                {/* Cancel Action available for unfulfilled active orders */}
                {['NEW', 'CONFIRMED', 'ACCEPTED', 'READY'].includes(order.status) && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      openStatusConfirmation({
                        targetStatus: 'CANCELLED',
                        title: 'Cancel Order',
                        subtitle: 'Cancel this order and release reserved stock back to available inventory.',
                        badgeLabel: 'CANCELLED',
                        defaultReason: 'Order cancelled by merchant',
                        themeColor: 'rose',
                      })
                    }
                    className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 ml-auto cursor-pointer"
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
                        href={getWhatsAppLinkForStatus(order.status)}
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
                <span>Billing & Totals</span>
              </h3>

              <div className="bg-merchant-surface-raised p-4 rounded-xl border border-merchant-border text-xs space-y-2">
                <div className="flex justify-between text-merchant-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPaise(order.subtotalPaise)}</span>
                </div>
                {order.shippingPaise > 0 && (
                  <div className="flex justify-between text-merchant-text-secondary">
                    <span>Delivery Charge</span>
                    <span className="font-mono">{formatPaise(order.shippingPaise)}</span>
                  </div>
                )}
                {order.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Discount</span>
                    <span className="font-mono">-{formatPaise(order.discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-merchant-text font-bold text-sm pt-2 border-t border-merchant-border">
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
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-merchant-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>Logistics & Fulfillment</span>
                </h3>
                {shipment && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {shipment.provider === 'SELF_DELIVERY' ? 'Self Delivery Active' : 'Shiprocket AWB Active'}
                  </span>
                )}
              </div>

              {/* Sync Success Message */}
              {syncSuccessMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between animate-in fade-in">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {syncSuccessMessage}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSyncSuccessMessage(null)}
                    className="text-emerald-500 hover:text-emerald-700 ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="bg-merchant-surface-raised p-4 rounded-xl border border-merchant-border text-xs space-y-3">
                {shipment ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-merchant-text-secondary">Delivery Mode</span>
                      <span className="font-bold text-merchant-text">
                        {shipment.provider === 'SELF_DELIVERY' ? '🛵 Store Team / Self Delivery' : '🚀 Shiprocket Logistics'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-merchant-text-secondary">Assigned Courier / Rider</span>
                      <span className="font-bold text-merchant-text">{shipment.courierName || 'Store In-house Team'}</span>
                    </div>

                    {shipment.awbNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-merchant-text-secondary">AWB / Reference</span>
                        {shipment.awbNumber.startsWith('SELF_') || shipment.provider === 'SELF_DELIVERY' ? (
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
                        {shipment.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : shipment.status}
                      </span>
                    </div>

                    {/* Pull Live Tracking from Shiprocket Button */}
                    <div className="pt-2 border-t border-merchant-border flex flex-wrap gap-2 items-center">
                      {shipment.provider !== 'SELF_DELIVERY' && (
                        <button
                          type="button"
                          onClick={handleSyncTracking}
                          disabled={syncingTracking}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-merchant-surface border border-merchant-border hover:bg-merchant-surface-muted rounded-lg text-xs font-semibold text-merchant-text shadow-2xs transition disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${syncingTracking ? 'animate-spin' : ''}`} />
                          {syncingTracking ? 'Pulling Shiprocket API...' : 'Pull Live Tracking from Shiprocket'}
                        </button>
                      )}

                      {/* WhatsApp Quick Updates */}
                      {customerPhone && (
                        <a
                          href={getWhatsAppLinkForStatus(order.status)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Send Status Update on WhatsApp
                        </a>
                      )}

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

                    {/* Zero-Login Tracking Link Banner */}
                    {trackingUrl && (
                      <div className="p-2.5 bg-merchant-surface border border-merchant-border rounded-xl space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-merchant-text-muted uppercase">
                            Zero-Login Customer Tracking Link
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyTrackingLink}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-merchant-primary hover:underline cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedTracking ? 'Copied to Clipboard!' : 'Copy Link'}
                          </button>
                        </div>
                        <p className="text-[11px] text-merchant-text-muted truncate font-mono">
                          {trackingUrl}
                        </p>
                        <p className="text-[10px] text-merchant-text-muted">
                          Customer does not need to log in — this link directly displays live order status, courier info, and receipt.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-merchant-text text-xs flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-merchant-primary" />
                        Assign Delivery Partner (Prior to Dispatch)
                      </p>
                      <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Pre-Dispatch Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-merchant-text-muted">
                      Select or add a delivery person below. You can assign and notify them regarding pickup and delivery details before marking dispatched.
                    </p>

                    <div className="p-3.5 bg-merchant-surface border border-merchant-border rounded-xl space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-merchant-text-secondary block mb-1">
                          Select Delivery Partner:
                        </label>
                        <select
                          value={isAddingNewRiderInline ? 'NEW' : selectedPartnerId}
                          onChange={(e) => handlePartnerSelect(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-merchant-input-border bg-merchant-input-bg text-merchant-text focus:outline-none"
                        >
                          {deliveryPartners.length > 0 ? (
                            <>
                              {deliveryPartners.map((dp) => (
                                <option key={dp.id} value={dp.id}>
                                  {dp.name} — {dp.phone} {dp.vehicle ? `(${dp.vehicle})` : ''} {dp.isDefault ? '★ Default' : ''}
                                </option>
                              ))}
                              <option value="NEW">+ Enter Different / New Delivery Person</option>
                            </>
                          ) : (
                            <option value="NEW">No saved partners yet — Enter rider details below</option>
                          )}
                        </select>
                      </div>

                      {(isAddingNewRiderInline || deliveryPartners.length === 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[11px] font-semibold text-merchant-text-muted block mb-1">
                              Delivery Person Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Ramesh"
                              value={riderName}
                              onChange={(e) => setRiderName(e.target.value)}
                              className="w-full text-xs p-2 rounded-lg border border-merchant-input-border bg-merchant-input-bg text-merchant-text focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-merchant-text-muted block mb-1">
                              Mobile Number
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g. 9876543210"
                              value={riderPhone}
                              onChange={(e) => setRiderPhone(e.target.value)}
                              className="w-full text-xs p-2 rounded-lg border border-merchant-input-border bg-merchant-input-bg text-merchant-text font-mono focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-between pt-1">
                            <label className="flex items-center gap-1.5 text-[11px] text-merchant-text-muted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={saveRiderToDirectory}
                                onChange={(e) => setSaveRiderToDirectory(e.target.checked)}
                                className="h-3.5 w-3.5 text-emerald-500 rounded cursor-pointer"
                              />
                              Save to store directory
                            </label>
                            {riderName.trim() && riderPhone.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  api.deliveryPartners
                                    .save({
                                      name: riderName.trim(),
                                      phone: riderPhone.trim(),
                                      vehicle: 'Motorcycle',
                                      isDefault: deliveryPartners.length === 0,
                                    })
                                    .then(() => {
                                      api.deliveryPartners.list().then((r: any) => {
                                        if (r?.data) setDeliveryPartners(r.data);
                                      });
                                    })
                                    .catch(() => {});
                                }}
                                className="text-[11px] text-merchant-primary font-semibold hover:underline cursor-pointer"
                              >
                                Save Partner Now
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action to notify assigned delivery partner */}
                      {riderPhone.trim() && (
                        <div className="pt-2 border-t border-merchant-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] text-merchant-text-muted">
                            Assigned: <strong className="text-merchant-text">{riderName || 'Partner'}</strong> ({riderPhone})
                          </span>
                          <a
                            href={getDeliveryPartnerAssignmentWhatsApp(riderPhone, riderName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold shadow-2xs transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Notify Delivery Person on WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TWO-STEP STATUS CONFIRMATION & NOTIFICATION MODAL
      ========================================================================= */}
      {statusConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !updating && setStatusConfirmModal(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-merchant-surface border border-merchant-border rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-merchant-text max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-merchant-border pb-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    statusConfirmModal.targetStatus === 'CANCELLED'
                      ? 'bg-rose-500/15 text-rose-500'
                      : statusConfirmModal.targetStatus === 'COMPLETED'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : statusConfirmModal.targetStatus === 'DISPATCHED'
                      ? 'bg-purple-500/15 text-purple-500'
                      : 'bg-cyan-500/15 text-cyan-500'
                  }`}
                >
                  {statusConfirmModal.targetStatus === 'CANCELLED' ? (
                    <Ban className="w-5 h-5" />
                  ) : statusConfirmModal.targetStatus === 'COMPLETED' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : statusConfirmModal.targetStatus === 'DISPATCHED' ? (
                    <Truck className="w-5 h-5" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-merchant-text">
                      {statusConfirmModal.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-merchant-surface-raised border border-merchant-border text-merchant-text-muted">
                      Review & Confirm
                    </span>
                  </div>
                  <p className="text-xs text-merchant-text-muted mt-0.5">
                    {statusConfirmModal.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !updating && setStatusConfirmModal(null)}
                className="text-merchant-text-muted hover:text-merchant-text p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Order Snapshot */}
            <div className="p-3 rounded-xl bg-merchant-surface-raised border border-merchant-border text-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-merchant-text-muted block">Order & Buyer</span>
                <span className="font-mono font-bold text-merchant-text">#{order.orderNumber}</span> • {customerName}
                {customerPhone && <span className="font-mono text-merchant-text-muted"> ({customerPhone})</span>}
              </div>
              <div className="text-right">
                <span className="text-[11px] text-merchant-text-muted block">Total Amount</span>
                <span className="font-mono font-bold text-emerald-500">{formatPaise(order.totalPaise)}</span>
              </div>
            </div>

            {/* Cancellation reason if CANCELLED */}
            {statusConfirmModal.targetStatus === 'CANCELLED' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-merchant-text-secondary block">
                  Select Reason:
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-merchant-input-border bg-merchant-input-bg text-merchant-text focus:outline-none"
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
                    className="w-full text-xs p-2.5 mt-2 rounded-xl border border-merchant-input-border bg-merchant-input-bg text-merchant-text placeholder-merchant-text-muted focus:outline-none"
                  />
                )}
              </div>
            )}

            {/* DELIVERY PARTNER ASSIGNMENT (When target is DISPATCHED) */}
            {statusConfirmModal.targetStatus === 'DISPATCHED' && (
              <div className="space-y-2.5 p-3.5 rounded-xl bg-merchant-surface-raised border border-merchant-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-merchant-text flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    Assign Delivery Partner
                  </label>
                  <span className="text-[10px] text-merchant-text-muted">
                    Buyer will receive rider name & contact
                  </span>
                </div>

                {/* Delivery Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-merchant-surface rounded-lg border border-merchant-border text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedFulfillmentMode('SELF_DELIVERY')}
                    className={`py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      selectedFulfillmentMode === 'SELF_DELIVERY'
                        ? 'bg-merchant-primary text-white shadow-2xs'
                        : 'text-merchant-text-muted hover:text-merchant-text'
                    }`}
                  >
                    <StoreIcon className="w-3 h-3" /> Store / In-House Rider
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFulfillmentMode('SHIPROCKET')}
                    className={`py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      selectedFulfillmentMode === 'SHIPROCKET'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-merchant-text-muted hover:text-merchant-text'
                    }`}
                  >
                    <Truck className="w-3 h-3" /> Shiprocket Logistics
                  </button>
                </div>

                {selectedFulfillmentMode === 'SELF_DELIVERY' ? (
                  <div className="space-y-2 pt-1">
                    {/* Saved Riders Dropdown */}
                    <div>
                      <label className="text-[11px] font-semibold text-merchant-text-secondary block mb-1">
                        Select from Registered Delivery Partners:
                      </label>
                      <select
                        value={isAddingNewRiderInline ? 'NEW' : selectedPartnerId}
                        onChange={(e) => handlePartnerSelect(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-merchant-input-border bg-merchant-input-bg text-merchant-text focus:outline-none"
                      >
                        {deliveryPartners.length > 0 ? (
                          <>
                            {deliveryPartners.map((dp) => (
                              <option key={dp.id} value={dp.id}>
                                {dp.name} — {dp.phone} {dp.vehicle ? `(${dp.vehicle})` : ''} {dp.isDefault ? '★ Default' : ''}
                              </option>
                            ))}
                            <option value="NEW">+ Enter Different / New Rider</option>
                          </>
                        ) : (
                          <>
                            <option value="NEW">No saved partners yet — Enter rider details below</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Inline Rider Details Inputs if adding new or editing */}
                    {(isAddingNewRiderInline || deliveryPartners.length === 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[11px] font-semibold text-merchant-text-muted block mb-1">
                            Rider Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Ramesh"
                            value={riderName}
                            onChange={(e) => setRiderName(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-merchant-input-border bg-merchant-input-bg text-merchant-text focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-merchant-text-muted block mb-1">
                            Rider Mobile Number
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={riderPhone}
                            onChange={(e) => setRiderPhone(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-merchant-input-border bg-merchant-input-bg text-merchant-text font-mono focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-1.5 pt-1">
                          <input
                            type="checkbox"
                            id="save-rider-dir"
                            checked={saveRiderToDirectory}
                            onChange={(e) => setSaveRiderToDirectory(e.target.checked)}
                            className="h-3.5 w-3.5 text-emerald-500 rounded cursor-pointer"
                          />
                          <label htmlFor="save-rider-dir" className="text-[11px] text-merchant-text-muted cursor-pointer">
                            Save this rider to store directory for future 1-click selection
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-500 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    Will request doorstep pickup and generate AWB via configured Shiprocket courier network.
                  </p>
                )}
              </div>
            )}

            {/* CUSTOM MESSAGE TO BUYER */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-merchant-text flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-merchant-primary" />
                  Custom Note / Message for Buyer (Optional)
                </label>
                <span className="text-[10px] text-merchant-text-muted">Included in email & WhatsApp</span>
              </div>

              <textarea
                rows={2}
                placeholder="Type any personal message, ETA, or instructions for the buyer..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-merchant-input-border bg-merchant-input-bg text-merchant-text placeholder-merchant-text-muted focus:outline-none focus:ring-1 focus:ring-merchant-primary resize-none"
              />

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {(STATUS_MESSAGE_SUGGESTIONS[statusConfirmModal.targetStatus] || []).map((sugg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCustomMessage(sugg)}
                    className="text-[10px] px-2 py-0.5 bg-merchant-surface-raised hover:bg-merchant-surface-muted text-merchant-text-muted hover:text-merchant-text border border-merchant-border rounded-md transition cursor-pointer"
                  >
                    + {sugg}
                  </button>
                ))}
              </div>
            </div>

            {/* AUTOMATED NOTIFICATION CHANNELS (HEADLESS 1-CLICK) */}
            <div className="p-3.5 rounded-xl bg-merchant-surface-raised border border-merchant-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-merchant-text-muted uppercase tracking-wider block">
                  Direct Buyer Notifications (1-Click)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ⚡ Sent Directly (No Redirects)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-merchant-text">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  Direct Email via Letzshop SMTP
                </span>

                {customerPhone && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                    Direct WhatsApp to {customerPhone}
                  </span>
                )}
              </div>
            </div>

            {/* Error banner if action fails */}
            {actionError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* STEP 2: CONFIRMATION FOOTER BUTTONS */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-merchant-border">
              <button
                type="button"
                onClick={() => setStatusConfirmModal(null)}
                disabled={updating}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-merchant-surface hover:bg-merchant-surface-muted text-merchant-text border border-merchant-border transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleConfirmStatusUpdate}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-merchant-primary hover:bg-merchant-primary-hover text-white shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating & Notifying...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm & Notify Buyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

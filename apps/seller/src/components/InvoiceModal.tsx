import React from 'react';
import { X, Printer, CheckCircle, Clock } from 'lucide-react';
import { formatPaise, getPaymentDisplayDetails, formatPaymentMethod } from '@simply/ui';

interface InvoiceModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  store?: any;
  user?: any;
  storeName?: string;
  merchantName?: string;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  gstin?: string;
}

export function InvoiceModal({
  order,
  isOpen,
  onClose,
  store,
  user,
  storeName,
  merchantName,
  storePhone,
  storeEmail,
  storeAddress,
  gstin,
}: InvoiceModalProps) {
  if (!isOpen || !order) return null;

  // Resolve Store & Merchant details
  const currentStore = store || order.store || {};
  const currentUser = user || currentStore.tenant?.owner || {};

  const resolvedStoreName =
    storeName ||
    currentStore.name ||
    'LetzShop Store';

  const resolvedMerchantName =
    merchantName ||
    currentUser.fullName ||
    currentUser.name ||
    currentStore.ownerName ||
    currentStore.merchantName ||
    '';

  const resolvedStorePhone =
    storePhone ||
    currentStore.supportPhone ||
    currentStore.contactPhone ||
    currentStore.whatsappNumber ||
    currentUser.phone ||
    '';

  const resolvedStoreEmail =
    storeEmail ||
    currentStore.supportEmail ||
    currentStore.contactEmail ||
    currentUser.email ||
    '';

  const resolvedStoreAddress =
    storeAddress ||
    currentStore.businessAddress ||
    currentStore.address ||
    '';

  const resolvedGstin =
    gstin ||
    currentStore.gstNumber ||
    currentStore.gstin ||
    order.gstin ||
    '';

  const paymentDetails = getPaymentDisplayDetails(order);
  const deliveryAddress =
    order.orderAddress ||
    (order.deliveryAddress as any) ||
    order.customerAddress ||
    {};

  const customerName =
    order.customerName ||
    order.customer?.fullName ||
    deliveryAddress.fullName ||
    'Valued Customer';
  const customerPhone =
    order.customerPhone || order.customer?.phone || deliveryAddress.phone || '';
  const customerEmail =
    order.customerEmail || order.customer?.email || deliveryAddress.email || '';

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-900 border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden print:border-none print:shadow-none print:max-w-none print:h-auto print:max-h-none print:rounded-none"
      >
        {/* MODAL HEADER (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">Tax Invoice / Receipt</span>
            <span className="text-xs font-mono text-slate-500">#{order.orderNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-700 print:overflow-visible print:p-8">
          {/* Top Brand & Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1 max-w-sm">
              <div className="flex items-center gap-2">
                {currentStore.branding?.logoUrl && (
                  <img
                    src={currentStore.branding.logoUrl}
                    alt={resolvedStoreName}
                    className="w-8 h-8 rounded-lg object-contain border border-slate-200"
                  />
                )}
                <h1 id="invoice-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                  {resolvedStoreName}
                </h1>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Official Order Receipt & Tax Invoice</p>

              {/* Store & Merchant details */}
              <div className="pt-2 space-y-0.5 text-[11px] text-slate-600">
                {resolvedMerchantName && (
                  <p>
                    <span className="font-semibold text-slate-700">Merchant / Proprietor:</span> {resolvedMerchantName}
                  </p>
                )}
                {resolvedStoreAddress && (
                  <p>
                    <span className="font-semibold text-slate-700">Store Address:</span> {resolvedStoreAddress}
                  </p>
                )}
                {resolvedStorePhone && (
                  <p>
                    <span className="font-semibold text-slate-700">Phone:</span> +91 {resolvedStorePhone.replace(/\D/g, '').slice(-10)}
                  </p>
                )}
                {resolvedStoreEmail && (
                  <p>
                    <span className="font-semibold text-slate-700">Email:</span> {resolvedStoreEmail}
                  </p>
                )}
                {resolvedGstin && (
                  <p>
                    <span className="font-semibold text-slate-700">GSTIN:</span> <span className="font-mono">{resolvedGstin}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-full text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1">
                Order #{order.orderNumber}
              </span>
              <p className="text-slate-500 text-[11px]">Date: <strong className="text-slate-800">{orderDate}</strong></p>
              <p className="text-slate-500 text-[11px]">
                Order Status: <strong className="text-slate-800 uppercase">{order.status}</strong>
              </p>
              <p className="text-slate-500 text-[11px]">
                Payment Status: <strong className={`uppercase ${order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>{order.paymentStatus}</strong>
              </p>
            </div>
          </div>

          {/* Customer & Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed / Delivered To
              </span>
              <p className="font-bold text-slate-900 text-sm">{customerName}</p>
              {customerPhone && <p className="font-mono text-slate-600">Mobile: +91 {customerPhone.replace(/\D/g, '').slice(-10)}</p>}
              {customerEmail && <p className="text-slate-600">{customerEmail}</p>}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Delivery Address
              </span>
              <p className="font-medium text-slate-800">{deliveryAddress.addressLine1 || 'Doorstep Delivery'}</p>
              {deliveryAddress.addressLine2 && <p className="text-slate-600">{deliveryAddress.addressLine2}</p>}
              {deliveryAddress.landmark && <p className="text-slate-500 text-[11px]">Landmark: {deliveryAddress.landmark}</p>}
              <p className="font-medium text-slate-800">
                {deliveryAddress.city ? `${deliveryAddress.city}, ` : ''}
                {deliveryAddress.state || ''}
                {deliveryAddress.pincode ? ` - ${deliveryAddress.pincode}` : ''}
              </p>
              <p className="text-slate-500 text-[11px]">{deliveryAddress.country || 'India'}</p>
            </div>
          </div>

          {/* Ordered Line Items */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Items Purchased
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item: any) => {
                    const snapshot = item.optionSnapshot || item.selectedOptions;
                    const displayVariant =
                      item.variantTitle && item.variantTitle !== 'Default'
                        ? item.variantTitle
                        : snapshot && Object.keys(snapshot).length > 0
                          ? Object.keys(snapshot)
                              .sort((a, b) => {
                                const order = ['colour', 'color', 'size', 'fit', 'material'];
                                const iA = order.indexOf(a.toLowerCase());
                                const iB = order.indexOf(b.toLowerCase());
                                if (iA !== -1 && iB !== -1) return iA - iB;
                                if (iA !== -1) return -1;
                                if (iB !== -1) return 1;
                                return a.localeCompare(b);
                              })
                              .map((k) => snapshot[k])
                              .join(' · ')
                          : null;
                    return (
                      <tr key={item.id} className="text-xs">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{item.productName || item.titleSnapshot}</span>
                          {displayVariant && (
                            <span className="text-[11px] text-slate-500 font-medium block">{displayVariant}</span>
                          )}
                          {item.sku && (
                            <span className="text-[10px] text-slate-400 font-mono block">SKU: {item.sku}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatPaise(item.unitPricePaise)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatPaise(item.totalPaise || item.totalPricePaise || item.quantity * item.unitPricePaise)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monetary Summary & Payment Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Payment Details Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Payment Details
              </span>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-semibold text-slate-900">
                  {paymentDetails.methodLabel}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              {/* Transaction ID for online payments */}
              {paymentDetails.transactionId && (
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-500 font-sans">Transaction ID</span>
                  <span className="font-bold text-slate-900 truncate max-w-[180px]">
                    {paymentDetails.transactionId}
                  </span>
                </div>
              )}

              {/* COD Actual Collection details */}
              {paymentDetails.isCod && paymentDetails.isCodCollected && (
                <>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Collected Via</span>
                    <span className="font-bold text-emerald-800">
                      {paymentDetails.codCollectionLabel || 'Cash'}
                    </span>
                  </div>
                  {paymentDetails.codCollectedAt && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Collected At</span>
                      <span>
                        {new Date(paymentDetails.codCollectedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </>
              )}

              {paymentDetails.isCod && !paymentDetails.isCodCollected && (
                <div className="pt-1 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200/60">
                  Cash on Delivery payment pending collection upon doorstep delivery.
                </div>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatPaise(order.subtotalPaise)}</span>
              </div>
              {order.taxPaise > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (GST)</span>
                  <span className="font-mono">{formatPaise(order.taxPaise)}</span>
                </div>
              )}
              {order.shippingPaise > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span className="font-mono">{formatPaise(order.shippingPaise)}</span>
                </div>
              )}
              {order.discountPaise > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-{formatPaise(order.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono">{formatPaise(order.totalPaise)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5">
            <p>Thank you for shopping with {resolvedStoreName}! This is a computer-generated invoice.</p>
            {(resolvedStoreEmail || resolvedStorePhone) && (
              <p className="text-[10px] text-slate-400">
                For questions or support, contact: {resolvedStoreEmail || ''}{resolvedStoreEmail && resolvedStorePhone ? ' · ' : ''}{resolvedStorePhone ? `+91 ${resolvedStorePhone.replace(/\D/g, '').slice(-10)}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

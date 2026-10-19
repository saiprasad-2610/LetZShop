import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, AlertTriangle, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminAttention } from '../../context/AdminAttentionContext';
import { errorMessage } from '../AdminUI';

interface SuspendMerchantModalProps {
  merchantId: string;
  merchantName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  stores?: Array<{ id: string; name: string }>;
  initialStoreId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REASONS = [
  'Policy violation',
  'Payment issue',
  'Compliance',
  'Suspicious activity',
  'Merchant request',
  'Other',
];

export function SuspendMerchantModal({
  merchantId,
  merchantName,
  recipientEmail,
  recipientPhone,
  stores = [],
  initialStoreId,
  onClose,
  onSuccess,
}: SuspendMerchantModalProps) {
  const { api } = useAdminAuth();
  const { refreshAttention } = useAdminAttention();

  const [reason, setReason] = useState(REASONS[0]);
  const [internalNote, setInternalNote] = useState('');
  const [customInfo, setCustomInfo] = useState('');
  const [merchantMessage, setMerchantMessage] = useState('');
  const [targetStoreId, setTargetStoreId] = useState<string>(initialStoreId || ''); // empty means entire merchant account / all stores

  const hasEmail = Boolean(recipientEmail?.trim());
  const hasPhone = Boolean(recipientPhone?.trim());
  const [notifyEmail, setNotifyEmail] = useState(hasEmail);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Update default message template when reason or custom info changes
  useEffect(() => {
    const template =
      `Hello ${merchantName},\n\n` +
      `Your LetzShop store has temporarily been suspended.\n\n` +
      `Reason:\n${reason}\n\n` +
      (customInfo.trim() ? `Additional information:\n${customInfo.trim()}\n\n` : '') +
      `Please contact the LetzShop team if you require assistance.\n\n` +
      `— LetzShop Support`;
    setMerchantMessage(template);
  }, [merchantName, reason, customInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a suspension reason.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await api.admin.suspendMerchant(merchantId, {
        reason,
        internalNote: internalNote.trim() || undefined,
        merchantMessage: merchantMessage.trim() || undefined,
        notifyEmail,
        notifyWhatsApp,
        storeId: targetStoreId || undefined,
      });

      if (res?.whatsAppUrl && notifyWhatsApp) {
        window.open(res.whatsAppUrl, '_blank', 'noopener,noreferrer');
      }

      await refreshAttention?.();
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: unknown) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-red-300 dark:border-red-900 bg-admin-surface p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-admin-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 id="suspend-modal-title" className="text-lg font-semibold text-admin-text">
                Suspend {merchantName}
              </h2>
              <p className="text-xs text-admin-muted">
                Restrict selling and public storefront access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-admin-muted hover:bg-admin-raised hover:text-admin-text"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Multi-store scope if applicable */}
          {stores.length > 1 && (
            <div>
              <label htmlFor="suspend-store" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
                Target Scope
              </label>
              <select
                id="suspend-store"
                className="admin-input"
                value={targetStoreId}
                onChange={(e) => setTargetStoreId(e.target.value)}
              >
                <option value="">Entire Merchant Account (All {stores.length} stores)</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    This Store Only: {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="suspend-reason" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              id="suspend-reason"
              className="admin-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="suspend-internal-note" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
              Internal Admin Note <span className="text-admin-muted font-normal text-[11px]">(Not visible to merchant)</span>
            </label>
            <input
              id="suspend-internal-note"
              type="text"
              className="admin-input"
              placeholder="e.g. Investigation ticket #4082, repeated policy breach"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="suspend-merchant-msg" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary">
                Merchant Message <span className="text-admin-muted font-normal text-[11px]">(Editable notice)</span>
              </label>
            </div>
            <textarea
              id="suspend-merchant-msg"
              rows={5}
              className="admin-input font-mono text-xs resize-y"
              value={merchantMessage}
              onChange={(e) => setMerchantMessage(e.target.value)}
              maxLength={4000}
              required
            />
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-2">
              Notify Merchant Via
            </span>
            <div className="flex flex-wrap gap-4">
              <label
                className={`inline-flex items-center gap-2 text-sm ${
                  hasEmail ? 'cursor-pointer text-admin-text' : 'opacity-50 cursor-not-allowed text-admin-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  disabled={!hasEmail || busy}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded border-admin-border text-red-600 focus:ring-red-500"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="h-4 w-4 text-admin-muted" />
                  Email {hasEmail ? `(${recipientEmail})` : '(No email)'}
                </span>
              </label>

              <label
                className={`inline-flex items-center gap-2 text-sm ${
                  hasPhone ? 'cursor-pointer text-admin-text' : 'opacity-50 cursor-not-allowed text-admin-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  disabled={!hasPhone || busy}
                  onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                  className="rounded border-admin-border text-red-600 focus:ring-red-500"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  WhatsApp {hasPhone ? `(${recipientPhone})` : '(No phone)'}
                </span>
              </label>
            </div>
            {notifyWhatsApp && (
              <p className="mt-1 text-xs text-admin-muted">
                Will open WhatsApp with prefilled message upon confirmation.
              </p>
            )}
          </div>

          <div className="rounded-lg bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 p-3 text-xs text-red-900 dark:text-red-300">
            <p className="font-semibold mb-0.5">Store access after suspension:</p>
            <p>
              Storefront will become unavailable and merchant selling actions will be restricted until reactivated. Historical orders, payments and audit records remain preserved.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-admin-border">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="admin-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Suspending…' : 'Suspend Merchant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

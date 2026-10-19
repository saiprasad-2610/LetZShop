import React, { useState } from 'react';
import { CheckCircle2, X, AlertCircle, Mail, MessageCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminAttention } from '../../context/AdminAttentionContext';
import { errorMessage } from '../AdminUI';

interface ReactivateMerchantModalProps {
  merchantId: string;
  merchantName: string;
  storeId?: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReactivateMerchantModal({
  merchantId,
  merchantName,
  storeId,
  recipientEmail,
  recipientPhone,
  onClose,
  onSuccess,
}: ReactivateMerchantModalProps) {
  const { api } = useAdminAuth();
  const { refreshAttention } = useAdminAttention();

  const hasEmail = Boolean(recipientEmail?.trim());
  const hasPhone = Boolean(recipientPhone?.trim());
  const [notifyEmail, setNotifyEmail] = useState(hasEmail);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [reason, setReason] = useState('Issue resolved / approved for reactivation');
  const [merchantMessage, setMerchantMessage] = useState(
    `Hello ${merchantName},\n\nYour LetzShop store access has been reactivated successfully.\n\nThank you for selling with LetzShop.\n\n— LetzShop Support`,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const res = await api.admin.reactivateMerchant(merchantId, {
        reason: reason.trim() || undefined,
        merchantMessage: merchantMessage.trim() || undefined,
        notifyEmail,
        notifyWhatsApp,
        storeId,
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
      aria-labelledby="reactivate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-admin-border bg-admin-surface p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-admin-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 id="reactivate-modal-title" className="text-lg font-semibold text-admin-text">
                Reactivate {merchantName}
              </h2>
              <p className="text-xs text-admin-muted">
                Restore merchant operations and storefront access
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
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reactivate-reason" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
              Internal Reason / Audit Note
            </label>
            <input
              id="reactivate-reason"
              type="text"
              className="admin-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="reactivate-msg" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
              Merchant Notification Message (Optional)
            </label>
            <textarea
              id="reactivate-msg"
              rows={4}
              className="admin-input font-mono text-xs resize-y"
              value={merchantMessage}
              onChange={(e) => setMerchantMessage(e.target.value)}
              maxLength={2000}
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
                  className="rounded border-admin-border text-emerald-600 focus:ring-emerald-500"
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
                  className="rounded border-admin-border text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  WhatsApp {hasPhone ? `(${recipientPhone})` : '(No phone)'}
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-3 text-xs text-emerald-900 dark:text-emerald-300">
            <p className="font-semibold mb-0.5">Storefront accessibility:</p>
            <p>
              Reactivating this merchant restores their account status to Active. Public storefront accessibility will be restored according to their active subscription status.
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Reactivating…' : 'Reactivate Merchant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

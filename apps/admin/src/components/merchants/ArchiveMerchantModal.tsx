import React, { useState } from 'react';
import { Archive, X, AlertTriangle, Mail, MessageCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminAttention } from '../../context/AdminAttentionContext';
import { errorMessage } from '../AdminUI';

interface ArchiveMerchantModalProps {
  merchantId: string;
  merchantName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ArchiveMerchantModal({
  merchantId,
  merchantName,
  recipientEmail,
  recipientPhone,
  onClose,
  onSuccess,
}: ArchiveMerchantModalProps) {
  const { api } = useAdminAuth();
  const { refreshAttention } = useAdminAttention();

  const hasEmail = Boolean(recipientEmail?.trim());
  const hasPhone = Boolean(recipientPhone?.trim());
  const [notifyEmail, setNotifyEmail] = useState(hasEmail);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);

  const [reason, setReason] = useState('Business closed / Merchant requested archival');
  const [internalNote, setInternalNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setError('Please check the confirmation box to confirm merchant archival.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await api.admin.archiveMerchant(merchantId, {
        reason: reason.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
        notifyEmail,
        notifyWhatsApp,
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
      aria-labelledby="archive-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-amber-300 dark:border-amber-900 bg-admin-surface p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-admin-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h2 id="archive-modal-title" className="text-lg font-semibold text-admin-text">
                Archive {merchantName}
              </h2>
              <p className="text-xs text-admin-muted">
                Safely deactivate merchant while retaining historical records
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
          <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3.5 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
            <p className="font-semibold">Data Preservation Guarantee:</p>
            <p>
              This removes the merchant from normal active operations and hides their storefront from buyers, but <strong>strictly preserves all historical orders, payments, reviews, and audit records</strong>.
            </p>
          </div>

          <div>
            <label htmlFor="archive-reason" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
              Archival Reason <span className="text-red-500">*</span>
            </label>
            <input
              id="archive-reason"
              type="text"
              className="admin-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Voluntary closure, inactive account"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="archive-internal-note" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
              Internal Admin Note (Optional)
            </label>
            <textarea
              id="archive-internal-note"
              rows={2}
              className="admin-input resize-y"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Internal record details..."
              maxLength={1000}
            />
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-2">
              Optional Notification
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
                  className="rounded border-admin-border text-amber-600 focus:ring-amber-500"
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
                  className="rounded border-admin-border text-amber-600 focus:ring-amber-500"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  WhatsApp {hasPhone ? `(${recipientPhone})` : '(No phone)'}
                </span>
              </label>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-admin-border bg-admin-raised/40 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-admin-border text-amber-600 focus:ring-amber-500"
              required
            />
            <span className="text-xs text-admin-text">
              I confirm that <strong>{merchantName}</strong> will be archived. All business data will be retained for historical compliance.
            </span>
          </label>

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
              disabled={busy || !confirmed}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Archiving…' : 'Archive Merchant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

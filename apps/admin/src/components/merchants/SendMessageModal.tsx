import React, { useState } from 'react';
import { Mail, MessageCircle, X, Send, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { errorMessage } from '../AdminUI';

interface SendMessageModalProps {
  merchantId: string;
  merchantName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SendMessageModal({
  merchantId,
  merchantName,
  recipientEmail,
  recipientPhone,
  onClose,
  onSuccess,
}: SendMessageModalProps) {
  const { api } = useAdminAuth();
  const hasEmail = Boolean(recipientEmail?.trim());
  const hasPhone = Boolean(recipientPhone?.trim());

  const [useEmail, setUseEmail] = useState(hasEmail);
  const [useWhatsApp, setUseWhatsApp] = useState(!hasEmail && hasPhone);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState<{
    text: string;
    whatsAppUrl?: string | null;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useEmail && !useWhatsApp) {
      setError('Please select at least one delivery channel (Email or WhatsApp).');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!message.trim()) {
      setError('Message is required.');
      return;
    }

    setBusy(true);
    setError('');
    setResultMessage(null);

    const channels: Array<'EMAIL' | 'WHATSAPP'> = [];
    if (useEmail) channels.push('EMAIL');
    if (useWhatsApp) channels.push('WHATSAPP');

    try {
      const res = await api.admin.sendMessageToMerchant(merchantId, {
        channels,
        subject: subject.trim(),
        message: message.trim(),
      });

      let statusMsg = '';
      if (res.emailSent) {
        statusMsg += 'Email notification sent successfully. ';
      } else if (useEmail) {
        statusMsg += 'Email delivery failed or pending. ';
      }

      if (res.whatsAppUrl) {
        // Open WhatsApp deep link in new tab
        window.open(res.whatsAppUrl, '_blank', 'noopener,noreferrer');
        statusMsg += 'Opened in WhatsApp. Click "Send" in WhatsApp to deliver the message.';
      }

      setResultMessage({
        text: statusMsg.trim() || 'Communication logged successfully.',
        whatsAppUrl: res.whatsAppUrl,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-message-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-admin-border bg-admin-surface p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-admin-border pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-admin-accent" aria-hidden="true" />
            <h2 id="send-message-title" className="text-lg font-semibold text-admin-text">
              Send Message to {merchantName}
            </h2>
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

        {resultMessage ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium">{resultMessage.text}</p>
                {resultMessage.whatsAppUrl && (
                  <p className="mt-1 text-xs opacity-90">
                    If WhatsApp did not open automatically,{' '}
                    <a
                      href={resultMessage.whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                    >
                      click here to open WhatsApp
                    </a>
                    .
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="admin-button"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-2">
                Channels
              </span>
              <div className="flex flex-wrap gap-4">
                <label
                  className={`inline-flex items-center gap-2 text-sm ${
                    hasEmail ? 'cursor-pointer text-admin-text' : 'opacity-50 cursor-not-allowed text-admin-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={useEmail}
                    disabled={!hasEmail || busy}
                    onChange={(e) => setUseEmail(e.target.checked)}
                    className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                  />
                  <span className="flex items-center gap-1.5 font-medium">
                    <Mail className="h-4 w-4 text-admin-muted" />
                    Email
                  </span>
                  {!hasEmail && (
                    <span className="text-xs text-admin-muted italic">(No email available)</span>
                  )}
                  {hasEmail && recipientEmail && (
                    <span className="text-xs text-admin-muted">({recipientEmail})</span>
                  )}
                </label>

                <label
                  className={`inline-flex items-center gap-2 text-sm ${
                    hasPhone ? 'cursor-pointer text-admin-text' : 'opacity-50 cursor-not-allowed text-admin-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={useWhatsApp}
                    disabled={!hasPhone || busy}
                    onChange={(e) => setUseWhatsApp(e.target.checked)}
                    className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                  />
                  <span className="flex items-center gap-1.5 font-medium">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    WhatsApp
                  </span>
                  {!hasPhone && (
                    <span className="text-xs text-admin-muted italic">(No phone available)</span>
                  )}
                  {hasPhone && recipientPhone && (
                    <span className="text-xs text-admin-muted">({recipientPhone})</span>
                  )}
                </label>
              </div>
              {useWhatsApp && (
                <p className="mt-2 text-xs text-admin-muted">
                  Note: WhatsApp will generate a prefilled message and open in WhatsApp for you to review and send.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="msg-subject" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                id="msg-subject"
                type="text"
                className="admin-input"
                placeholder="e.g. Account Verification / Subscription Reminder"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
                disabled={busy}
              />
            </div>

            <div>
              <label htmlFor="msg-body" className="block text-xs font-semibold uppercase tracking-wider text-admin-secondary mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="msg-body"
                rows={5}
                className="admin-input resize-y"
                placeholder="Write your message to the merchant owner..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={4000}
                required
                disabled={busy}
              />
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
                disabled={busy || (!useEmail && !useWhatsApp)}
                className="admin-button flex items-center gap-2"
              >
                {busy ? (
                  'Sending…'
                ) : useWhatsApp && !useEmail ? (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Open in WhatsApp
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

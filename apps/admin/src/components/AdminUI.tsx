import React, { useEffect, useId, useRef, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Request failed. Please retry.';
}
export function useAdminQuery<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  const { api } = useAdminAuth(),
    [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [version, setVersion] = useState(0);
  const key = JSON.stringify(params);
  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setData(null);
    setError('');
    api
      .request<T>(path, { params: JSON.parse(key) })
      .then((value) => {
        if (active) setData(value);
      })
      .catch((err) => {
        if (active) {
          setData(null);
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, key, version]);
  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return { data, loading, error, reload: () => setVersion((v) => v + 1) };
}
export const Feedback = ({
  error,
  loading,
  onRetry,
}: {
  error?: string;
  loading?: boolean;
  onRetry?: () => void;
}) =>
  error ? (
    <p
      role="alert"
      className="rounded-lg bg-admin-danger-soft p-3 text-sm text-admin-danger"
    >
      {error}{' '}
      <button
        className="ml-3 underline"
        onClick={onRetry || (() => window.location.reload())}
      >
        Retry
      </button>
    </p>
  ) : loading ? (
    <p role="status" className="py-3 text-sm text-admin-muted">
      Loading…
    </p>
  ) : null;
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <button
        className="admin-secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} of {Math.max(1, totalPages)}
      </span>
      <button
        className="admin-secondary"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
export function ActionModal({
  title,
  children,
  busy,
  error,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
}: {
  title: string;
  children: React.ReactNode;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  const id = useId(),
    ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-admin-overlay p-4">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="max-h-[90dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-admin-surface p-5"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !busy) onClose();
          if (e.key === 'Tab') {
            const nodes = ref.current?.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]',
            );
            if (!nodes?.length) return;
            const first = nodes[0],
              last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <h2 id={id} className="text-xl font-semibold">
          {title}
        </h2>
        {children}
        <Feedback error={error} />
        <div className="flex justify-end gap-2">
          <button className="admin-secondary" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="admin-button" disabled={busy} onClick={onConfirm}>
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

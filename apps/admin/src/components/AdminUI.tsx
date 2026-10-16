import React, { useEffect, useId, useRef, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

export function useAdminQuery(path: string, params: Record<string, any> = {}) {
  const { api } = useAdminAuth(),
    [data, setData] = useState<any>(null),
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
    setError('');
    api
      .request(path, { params: JSON.parse(key) })
      .then((value) => {
        if (active) setData(value);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, key, version]);
  return { data, loading, error, reload: () => setVersion((v) => v + 1) };
}
export const Feedback = ({
  error,
  loading,
}: {
  error?: string;
  loading?: boolean;
}) =>
  error ? (
    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {error}
    </p>
  ) : loading ? (
    <p role="status" className="py-3 text-sm text-slate-500">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="max-h-[90dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-5"
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
